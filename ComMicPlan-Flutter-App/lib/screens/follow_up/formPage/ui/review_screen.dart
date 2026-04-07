import 'package:flutter/material.dart';
import 'package:gmgi_project/utils/map_utils.dart';

class ReviewScreen extends StatelessWidget {
  /// Full question list. Each question is a Map (your existing structure).
  /// Expected keys (per your schema): 'name' (xpath/key), 'label', 'type', 'options' (list of {name,label}), etc.
  final List<dynamic> questions;

  /// Current answers map: xpath -> value
  final Map<String, dynamic> answers;

  /// Called when user taps a row to edit a question.
  /// You should handle navigation back and jump to that question by xpath.
  final void Function(String xpath) onEditRequested;

  /// Optional: If you only want to show a subset/order.
  final List<String>? displayOrderByXpath;

  /// Optional: control whether to show unanswered items too.
  final bool showUnanswered;
  final bool fromAppbar;

  final String? selectedLanguageKey;

  const ReviewScreen({
    super.key,
    required this.questions,
    required this.answers,
    required this.onEditRequested,
    this.displayOrderByXpath,
    this.showUnanswered = true,
    this.fromAppbar = false,
    this.selectedLanguageKey,
  });

  @override
  Widget build(BuildContext context) {
    final items = _buildReviewItems();
    final theme = Theme.of(context);
    final titleStyle =
        (theme.textTheme.titleMedium ?? const TextStyle()).copyWith(
      fontWeight: FontWeight.w600,
      color: theme.textTheme.titleMedium?.color ?? theme.colorScheme.onSurface,
    );
    final subtitleBase =
        theme.textTheme.bodyMedium ?? theme.textTheme.bodySmall ?? const TextStyle();
    final subtitleStyle = subtitleBase.copyWith(
      color: subtitleBase.color ?? theme.colorScheme.onSurface.withOpacity(0.7),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Review & Edit')),
      body:
          items.isEmpty
              ? const Center(child: Text('No answers to review yet.'))
              : ListView.separated(
                padding: const EdgeInsets.all(12),
                itemCount: items.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, idx) {
                  final it = items[idx];
                  final subtitleText =
                      (it.answerDisplay?.isEmpty ?? true) ? 'No answer' : it.answerDisplay!;
                  return ListTile(
                    title: Text(
                      it.title,
                      style: titleStyle,
                    ),
                    subtitle: Text(
                      subtitleText,
                      style: subtitleStyle,
                    ),
                    trailing:
                        it.isClickable ? const Icon(Icons.chevron_right) : null,
                    onTap:
                        it.isClickable ? () => onEditRequested(it.jumpTarget!) : null,
                  );
                },
              ),

      bottomNavigationBar:
          !fromAppbar
              ? SafeArea(
                minimum: const EdgeInsets.all(12),
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('Looks good — Continue'),
                  onPressed: () => Navigator.of(context).pop(true),
                ),
              )
              : null,
    );
  }

  List<_ReviewItem> _buildReviewItems() {
    // 1) Build a quick index: xpath -> question Map (skip nameless entries)
    final Map<String, Map<String, dynamic>> byXpath = {};
    for (final qRaw in questions) {
      if (qRaw is! Map) continue;
      final map = deepConvertToStringKeyedMap(
        Map<dynamic, dynamic>.from(qRaw),
      );
      final name = map['name']?.toString();
      if (name == null || name.isEmpty) continue;
      byXpath[name] = map;
    }

    final groupAnalysis = _analyzeFieldListGroups();

    // 2) Choose the order: provided or from questions list
    final List<String> order =
        displayOrderByXpath ??
        questions
            .map((q) => (q is Map ? q['name']?.toString() : null))
            .whereType<String>()
            .where((name) => name.isNotEmpty)
            .toList();

    // 3) Create items with display value
    final List<_ReviewItem> items = [];
    for (final xpath in order) {
      final q = byXpath[xpath];
      if (q == null) continue;

      final label = _questionLabel(q).trim();
      final value = answers[xpath];
      final isGroup = groupAnalysis.groups.containsKey(xpath);

      if (!showUnanswered && (value == null || value.toString().isEmpty)) {
        if (!isGroup) {
          continue;
        }
      }

      final answerDisplay = _renderAnswerForReview(q, value);
      final belongsToGroup = groupAnalysis.questionToGroup.containsKey(xpath);
      final jumpTarget = isGroup
          ? groupAnalysis.groups[xpath]?.firstQuestionName
          : (belongsToGroup ? null : xpath);

      items.add(
        _ReviewItem(
          xpath: xpath,
          title: label.isEmpty ? xpath : label,
          answerDisplay: answerDisplay,
          jumpTarget: jumpTarget,
          belongsToGroup: belongsToGroup,
          isGroup: isGroup,
        ),
      );
    }
    return items;
  }

  _GroupAnalysis _analyzeFieldListGroups() {
    final groups = <String, _FieldListGroup>{};
    final questionToGroup = <String, String>{};
    final stack = <_GroupStackEntry>[];

    for (final raw in questions) {
      if (raw is! Map) continue;
      final q = deepConvertToStringKeyedMap(
        Map<dynamic, dynamic>.from(raw),
      );
      final rawType = q['type']?.toString() ?? '';
      final baseType = rawType.split(' ').first;

      if (baseType == 'begin_group') {
        final name = q['name']?.toString();
        final isFieldList = q['appearance'] == 'field-list';
        final groupId = q['groupId']?.toString();
        _FieldListGroup? fieldListGroup;
        if (isFieldList && name != null && name.isNotEmpty) {
          fieldListGroup = _FieldListGroup(name: name);
          groups[name] = fieldListGroup;
        }
        stack.add(
          _GroupStackEntry(
            groupId: groupId,
            name: name,
            isFieldList: isFieldList,
            fieldListGroup: fieldListGroup,
          ),
        );
        continue;
      }

      if (baseType == 'end_group') {
        final groupId = q['groupId']?.toString();
        _popStackEntry(stack, groupId);
        continue;
      }

      final questionName = q['name']?.toString();
      if (questionName == null || questionName.isEmpty) {
        continue;
      }

      final fieldListEntry = _nearestFieldList(stack);
      if (fieldListEntry != null && fieldListEntry.fieldListGroup != null) {
        fieldListEntry.fieldListGroup!.questionNames.add(questionName);
        questionToGroup[questionName] = fieldListEntry.fieldListGroup!.name;
      }
    }

    return _GroupAnalysis(groups: groups, questionToGroup: questionToGroup);
  }

  void _popStackEntry(List<_GroupStackEntry> stack, String? groupId) {
    if (stack.isEmpty) return;
    if (groupId == null) {
      stack.removeLast();
      return;
    }
    for (var i = stack.length - 1; i >= 0; i--) {
      if (stack[i].groupId == groupId) {
        stack.removeAt(i);
        return;
      }
    }
    stack.removeLast();
  }

  _GroupStackEntry? _nearestFieldList(List<_GroupStackEntry> stack) {
    for (var i = stack.length - 1; i >= 0; i--) {
      final entry = stack[i];
      if (entry.isFieldList && entry.fieldListGroup != null) {
        return entry;
      }
    }
    return null;
  }

  /// Renders the user's answer using option **labels** when applicable.
  /// Supports: text, integer/decimal, select_one, select_multiple.
  String _renderAnswerForReview(Map<String, dynamic> q, dynamic value) {
    if (value == null) return '';

    final type = _normalizedQuestionType(q['type']);
    final opts = (q['options'] is List) ? (q['options'] as List) : const [];
    final optionLabelByName = <String, String>{};
    for (final o in opts) {
      if (o is! Map) continue;
      final name = o['name']?.toString();
      if (name == null || name.isEmpty) continue;
      final label = _optionLabel(o as Map<String, dynamic>);
      optionLabelByName[name] = label.isEmpty ? name : label;
    }

    switch (type) {
      case 'select_one':
      case 'select one':
      case 'select_one_external':
        final v = value.toString();
        return optionLabelByName[v] ?? v;

      case 'select_multiple':
      case 'select multiple':
      case 'select_multiple_external':
        // Value can be space- or comma-separated depending on your storage
        final List<String> codes;
        if (value is Iterable) {
          codes =
              value
                  .map((item) => item == null ? '' : item.toString())
                  .where((v) => v.trim().isNotEmpty)
                  .map((v) => v.trim())
                  .toList();
        } else {
          final raw = value.toString();
          final tokens =
              raw.contains(',') ? raw.split(',') : raw.split(RegExp(r'\s+'));
          codes =
              tokens.map((t) => t.trim()).where((t) => t.isNotEmpty).toList();
        }
        final labels =
            codes
                .map((t) => optionLabelByName[t] ?? t)
                .where((t) => t.isNotEmpty)
                .toList();
        return labels.join(', ');

      default:
        // text, int, decimal, date, datetime, geopoint, etc. — show raw
        return value.toString();
    }
  }

  String _normalizedQuestionType(dynamic rawType) {
    final type = rawType?.toString().trim().toLowerCase() ?? '';
    if (type.isEmpty) return type;

    if (type.startsWith('select_one_external') ||
        type.startsWith('select one external')) {
      return 'select_one_external';
    }
    if (type.startsWith('select_one') || type.startsWith('select one')) {
      return 'select_one';
    }
    if (type.startsWith('select_multiple_external') ||
        type.startsWith('select multiple external')) {
      return 'select_multiple_external';
    }
    if (type.startsWith('select_multiple') || type.startsWith('select multiple')) {
      return 'select_multiple';
    }

    return type;
  }

  String? get _effectiveTranslationKey {
    if (selectedLanguageKey == null) return null;
    final trimmed = selectedLanguageKey!.trim();
    if (trimmed.isEmpty) return null;
    return trimmed;
  }

  String _questionLabel(Map<String, dynamic> question) {
    final translationKey = _effectiveTranslationKey;
    if (translationKey != null) {
      final translated =
          _translatedText(question['translations'], translationKey) ??
          _translatedText(question['label'], translationKey);
      if (translated != null) return translated;
    }
    final base = question['label'];
    if (base is String) return base;
    return base?.toString() ?? question['name']?.toString() ?? '';
  }

  String _optionLabel(Map<String, dynamic> option) {
    final translationKey = _effectiveTranslationKey;
    if (translationKey != null) {
      final translated =
          _translatedText(option['translations'], translationKey) ??
          _translatedText(option['label'], translationKey);
      if (translated != null) return translated;
    }
    final baseLabel = option['label'];
    if (baseLabel is String && baseLabel.isNotEmpty) return baseLabel;
    if (baseLabel is Map && baseLabel.isNotEmpty) {
      final first = baseLabel.values.first;
      if (first != null && first.toString().trim().isNotEmpty) {
        return first.toString().trim();
      }
    }
    return option['name']?.toString() ?? '';
  }

  String? _translatedText(dynamic source, String key) {
    if (source is Map && source.isNotEmpty) {
      final value = source[key];
      if (value != null) {
        final text = value.toString().trim();
        if (text.isNotEmpty) return text;
      }
    }
    return null;
  }
}

class _ReviewItem {
  final String xpath;
  final String title;
  final String? answerDisplay;
  final String? jumpTarget;
  final bool belongsToGroup;
  final bool isGroup;

  const _ReviewItem({
    required this.xpath,
    required this.title,
    required this.answerDisplay,
    required this.jumpTarget,
    required this.belongsToGroup,
    required this.isGroup,
  });

  bool get isClickable => jumpTarget != null && jumpTarget!.isNotEmpty;
}

class _GroupAnalysis {
  final Map<String, _FieldListGroup> groups;
  final Map<String, String> questionToGroup;

  const _GroupAnalysis({
    required this.groups,
    required this.questionToGroup,
  });
}

class _FieldListGroup {
  final String name;
  final List<String> questionNames = [];

  _FieldListGroup({required this.name});

  String? get firstQuestionName {
    for (final q in questionNames) {
      final trimmed = q.trim();
      if (trimmed.isNotEmpty) return trimmed;
    }
    return null;
  }
}

class _GroupStackEntry {
  final String? groupId;
  final String? name;
  final bool isFieldList;
  final _FieldListGroup? fieldListGroup;

  const _GroupStackEntry({
    required this.groupId,
    required this.name,
    required this.isFieldList,
    this.fieldListGroup,
  });
}
