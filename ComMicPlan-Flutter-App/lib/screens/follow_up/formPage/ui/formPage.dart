import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/bloc/backend/algorithms/skip_logic_check.dart';
import 'package:gmgi_project/bloc/follow_up/formPage/bloc/form_page_bloc.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/acknowledge.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/audio.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/barcode.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/date.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/date_time.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/decimal.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/file.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/geopoint.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/geoshape.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/geotrace.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/image.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/integer.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/note.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/range.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/select_multiple.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/select_one.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/text.dart'
    as text_question;
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/time.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/questionaries/video.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/review_screen.dart';
import 'package:gmgi_project/screens/follow_up/userHome/ui/userHome.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Debugging extension
extension FormPageDebugging on _FormPageState {
  void debugFormState() {
    debugPrint('=== Form Debug Info ===');
    debugPrint('Current Index: $currentIndex');
    debugPrint('Questions Length: ${_questions.length}');
    debugPrint('Is Form Complete: $isFormComplete');
    debugPrint('Answers Count: ${answers.length}');
    if (currentIndex < _questions.length) {
      final current = _questions[currentIndex];
      debugPrint('Current Item Type: ${current?['type'] ?? 'null'}');
      debugPrint('Current Item Label: ${current?['label'] ?? 'null'}');
      debugPrint('Is Group Section: ${_isGroupSection(currentIndex)}');
      if (current?['filterEnabled'] == true) {
        final filterAnswer = answers[uuidToName[current?['filterQuestionId']]];
        debugPrint('Filter Enabled: true');
        debugPrint('Filter Question ID: ${current?['filterQuestionId']}');
        debugPrint('Filter Answer: $filterAnswer');
        debugPrint(
          'Filtered Options: ${current?['optionFilterMap']?[filterAnswer]}',
        );
      }
    }
    debugPrint('Visibility Cache Size: ${_visibilityCache.length}');
    debugPrint('Answers: $answers');
    debugPrint('uuidToName: $uuidToName');
    debugPrint('Selected Language ID: $_selectedLanguageId');
    debugPrint('====================');
  }
}

class FormPage extends StatefulWidget {
  /// `form` here is the **questions array** only.
  final List<dynamic> form;

  /// Optional: pass the form meta (the whole JSON except the `questions` list).
  /// Expected keys used here: `default_language`, `other_languages`, `name`, `translations`
  final Map<String, dynamic>? formMeta;

  final int currentIndex;
  final Map<String, dynamic> answers;
  final String formUid;
  final dynamic name; // fallback title if meta not provided
  final bool fromSingleAnswer;

  const FormPage({
    super.key,
    required this.form, // questions only
    this.formMeta, // optional meta
    this.currentIndex = 0,
    this.answers = const {},
    required this.formUid,
    required this.name,
    this.fromSingleAnswer = false,
  });

  @override
  State<FormPage> createState() => _FormPageState();
}

class _FormPageState extends State<FormPage> {
  // -------- existing fields ----------
  late Map<String, dynamic> answers;
  Map<String, dynamic>? _originalAnswers;
  late int currentIndex;
  bool isFormComplete = false;
  final _formKey = GlobalKey<FormState>();
  final _formPageBloc = FormPageBloc();
  final Map<String, bool> _visibilityCache = {};
  bool _isNavigating = false;
  bool _isDialogShowing = false;
  final Map<String, String> uuidToName = {};

  // -------- language support ----------
  int? _selectedLanguageId;
  List<Map<String, dynamic>> _languages = []; // from SharedPreferences
  final Map<int, String> _langDisplayById = {}; // id -> "Description (subtag)"

  // Questions = widget.form (just for readability)
  List<dynamic> get _questions => widget.form;

  // meta provided by caller (or null)
  // ✅ new
  Map<String, dynamic>? get _meta => widget.formMeta;

  bool get _formHasLanguages {
    final m = _meta;
    if (m == null) return false;
    final dl = m['default_language'];
    final ol =
        (m['other_languages'] is List) ? (m['other_languages'] as List) : [];
    return (dl != null) || (ol.isNotEmpty);
  }

  String _formBaseTitle() {
    if (_meta != null && _meta!['name'] != null)
      return _meta!['name'].toString();
    return widget.name.toString();
  }

  String _translatedFormTitleOr(String fallback) {
    final m = _meta;
    if (m == null || _selectedLanguageId == null) return fallback;

    final t = m['translations'];
    if (t is Map && t.isNotEmpty) {
      final key = _langDisplayById[_selectedLanguageId!]; // e.g. "Bangla (bn)"
      if (key != null &&
          t[key] != null &&
          t[key].toString().trim().isNotEmpty) {
        return t[key].toString().trim();
      }
    }
    return fallback;
  }

  // Return translated question label for current language, falling back to default label
  String _labelFor(dynamic question) {
    final baseLabel = question?['label']?.toString() ?? 'Unnamed Question';
    if (_selectedLanguageId == null) return baseLabel;

    final translations = question?['translations'];
    if (translations is Map && translations.isNotEmpty) {
      final key = _langDisplayById[_selectedLanguageId!]; // e.g. "Bangla (bn)"
      if (key != null && translations[key] != null) {
        var txt = translations[key].toString().trim();
        // If devs accidentally provided comma-duplicated text, pick first part

        if (txt.isNotEmpty) return txt;
      }
    }
    return baseLabel;
  }

  List<dynamic> _labelForOption(dynamic question) {
    if (_selectedLanguageId == null) return question['options'];

    final translations = question?['translations'];
    if (translations is Map && translations.isNotEmpty) {
      final key = _langDisplayById[_selectedLanguageId!];
      return question['options'].map((option) {
        if (option['translations'] == null) {
          return {
            'label': option['label'],
            'name': option['name'],
          };
        } else {
          return {
            'label': option['translations']?[key] ?? option['label'],
            'name': option['name'],
          };
        }
      }).toList();
    }
    return question['options'];
  }

  // -------- lifecycle ----------
  @override
  void initState() {
    super.initState();
    answers = Map<String, dynamic>.from(widget.answers);
    _originalAnswers =
        widget.fromSingleAnswer ? Map<String, dynamic>.from(widget.answers) : null;
    currentIndex = widget.currentIndex;

    _initializeUuidToName();

    // Load languages cached at login (if any), then init selected lang
    _initLanguagesFromPrefs().then((_) {
      _initSelectedLanguageFromMeta();
      if (mounted) setState(() {});
    });

    // Ensure 'start' timestamp
    if (answers['start'] == null || answers['start'].toString().isEmpty) {
      final now = DateTime.now();
      final offset = now.timeZoneOffset;
      final offsetHours = offset.inHours;
      final offsetMinutes = offset.inMinutes.remainder(60);
      final offsetString =
          '${offsetHours >= 0 ? '+' : '-'}${offsetHours.abs().toString().padLeft(2, '0')}:${offsetMinutes.abs().toString().padLeft(2, '0')}';
      answers['start'] =
          '${now.toIso8601String().substring(0, 23)}$offsetString';
    }

    // Jump to first visible section
    currentIndex =
        _questions.isNotEmpty ? _findNextSectionStart(currentIndex) : 0;
    debugFormState();
  }

  @override
  void didUpdateWidget(covariant FormPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!identical(oldWidget.form, widget.form)) {
      _initializeUuidToName();
      _initSelectedLanguageFromMeta();
    }
  }

  Future<void> _initLanguagesFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = prefs.getString('languages'); // store this at login
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final list = jsonDecode(jsonStr);
        if (list is List) {
          _languages =
              list.cast<Map>().map((e) => e.cast<String, dynamic>()).toList();
        }
      }

      _langDisplayById.clear();
      for (final m in _languages) {
        final id = m['id'];
        final subtag = m['subtag']?.toString() ?? '';
        final desc = m['description']?.toString() ?? '';
        if (id is int) {
          final display =
              (desc.isNotEmpty && subtag.isNotEmpty)
                  ? '$desc ($subtag)'
                  : (desc.isNotEmpty ? desc : subtag);
          if (display.isNotEmpty) _langDisplayById[id] = display;
        }
      }
    } catch (e) {
      debugPrint('Failed to load languages: $e');
    }
  }

  void _initSelectedLanguageFromMeta() {
    final m = _meta;
    if (m == null) {
      _selectedLanguageId = null;
      return;
    }
    if (m['default_language'] is int) {
      _selectedLanguageId = m['default_language'] as int;
      return;
    }
    final ol = m['other_languages'];
    if (ol is List && ol.isNotEmpty && ol.first is int) {
      _selectedLanguageId = ol.first as int;
    }
  }

  void _initializeUuidToName() {
    uuidToName.clear();
    for (var question in _questions) {
      if (question != null &&
          question['_uuid'] != null &&
          question['name'] != null) {
        uuidToName[question['_uuid'].toString()] = question['name'].toString();
      }
    }
  }

  @override
  void dispose() {
    _formPageBloc.close();
    super.dispose();
  }

  // ---------- Helpers: types & cache ----------
  bool _isUnsupportedType(String? type) {
    if (type == null) return true;
    const supportedTypes = {
      'text',
      'datetime',
      'acknowledge',
      'select_one',
      'select_multiple',
      'video',
      'image',
      'time',
      'integer',
      'date',
      'audio',
      'geopoint',
      'range',
      'decimal',
      'file',
      'barcode',
      'geotrace',
      'geoshape',
      'note',
      'begin_group',
      'end_group',
    };
    final baseType = type.split(' ')[0];
    return !supportedTypes.contains(baseType);
  }

  bool _isGroupSection(int index) {
    if (index < 0 || index >= _questions.length) return false;
    final q = _questions[index];
    if (q == null || q['type'] == null) return false;
    return q['type'] == 'begin_group' && q['appearance'] == 'field-list';
  }

  String _cacheKeyForQuestion(dynamic q) {
    final name = q?['name']?.toString();
    return 'q:${name ?? q.hashCode.toString()}';
  }

  String _cacheKeyForGroup(dynamic q) {
    final groupId = q?['groupId']?.toString();
    return 'g:${groupId ?? q.hashCode.toString()}';
  }

  bool _evaluateConditions(dynamic q) {
    try {
      if (q == null || q['conditions'] == null) return true;

      dynamic conds = q['conditions'];
      if (conds is String) {
        try {
          conds = jsonDecode(conds);
        } catch (_) {
          return true; // invalid JSON – treat as no conditions
        }
      }

      if (conds is! List || conds.isEmpty) return true;

      final db = SkipLogicCheck(conditions: conds, answers: answers);
      return db.skipLogicCheck();
    } catch (_) {
      return false;
    }
  }

  bool _shouldShowQuestion(dynamic q) {
    if (q == null) return false;
    final key = _cacheKeyForQuestion(q);
    if (_visibilityCache.containsKey(key)) return _visibilityCache[key]!;
    final show = _evaluateConditions(q);
    _visibilityCache[key] = show;
    return show;
  }

  bool _shouldShowGroup(dynamic beginGroupQ) {
    if (beginGroupQ == null) return false;
    final key = _cacheKeyForGroup(beginGroupQ);
    if (_visibilityCache.containsKey(key)) return _visibilityCache[key]!;
    bool show = _evaluateConditions(beginGroupQ);
    if (show) {
      show = _groupHasVisibleQuestion(beginGroupQ);
    }
    _visibilityCache[key] = show;
    return show;
  }

  bool _groupHasVisibleQuestion(dynamic beginGroupQ) {
    final beginIndex = _questions.indexOf(beginGroupQ);
    if (beginIndex == -1) return false;
    final endIndex = _findMatchingEnd(beginIndex);
    for (int i = beginIndex + 1; i < endIndex && i < _questions.length; i++) {
      final child = _questions[i];
      if (child == null) continue;
      final typeStr = child['type']?.toString() ?? '';
      final baseType = typeStr.split(' ').first;
      if (baseType == 'end_group' || _isUnsupportedType(baseType)) continue;
      if (baseType == 'begin_group') {
        if (_shouldShowGroup(child)) return true;
        i = _findMatchingEnd(i);
        continue;
      }
      if (_shouldShowQuestion(child)) return true;
    }
    return false;
  }

  void _invalidateVisibilityCache() => _visibilityCache.clear();

  int _findMatchingEnd(int beginIndex) {
    if (beginIndex < 0 || beginIndex >= _questions.length)
      return _questions.length;
    final beginItem = _questions[beginIndex];
    final String? groupId = beginItem?['groupId']?.toString();
    if (groupId == null) return beginIndex + 1;
    for (int j = beginIndex + 1; j < _questions.length; j++) {
      final it = _questions[j];
      if (it != null &&
          it['type'] == 'end_group' &&
          it['groupId']?.toString() == groupId) {
        return j;
      }
    }
    return _questions.length;
  }

  int _findMatchingBegin(int endIndex) {
    if (endIndex < 0 || endIndex >= _questions.length) return -1;
    final endItem = _questions[endIndex];
    final String? groupId = endItem?['groupId']?.toString();
    if (groupId == null) return -1;
    for (int j = endIndex - 1; j >= 0; j--) {
      final it = _questions[j];
      if (it != null &&
          it['type'] == 'begin_group' &&
          it['groupId']?.toString() == groupId) {
        return j;
      }
    }
    return -1;
  }

  bool _isStructural(dynamic q) {
    final t = q?['type']?.toString() ?? '';
    final base = t.split(' ').first;
    return base == 'begin_group' || base == 'end_group';
  }

  String? _questionNameOf(dynamic q) => q?['name']?.toString();

  Set<String> _collectVisibleQuestionNames() {
    final visible = <String>{};
    int i = 0;
    while (i < _questions.length) {
      final q = _questions[i];
      if (q == null) {
        i++;
        continue;
      }
      final typeStr = q['type']?.toString() ?? '';
      final baseType = typeStr.split(' ').first;

      if (baseType == 'begin_group' && q['appearance'] == 'field-list') {
        if (_shouldShowGroup(q)) {
          final end = _findMatchingEnd(i);
          for (int k = i + 1; k < end && k < _questions.length; k++) {
            final child = _questions[k];
            if (child == null || _isStructural(child)) continue;
            if (_shouldShowQuestion(child)) {
              final name = _questionNameOf(child);
              if (name != null && name.isNotEmpty) visible.add(name);
            }
          }
        }
        i = _findMatchingEnd(i) + 1;
        continue;
      }

      if (!_isStructural(q) && _shouldShowQuestion(q)) {
        final name = _questionNameOf(q);
        if (name != null && name.isNotEmpty) visible.add(name);
      }
      i++;
    }
    return visible;
  }

  void _purgeHiddenAnswers() {
    bool removed;
    do {
      removed = false;
      final visibleNames = _collectVisibleQuestionNames();
      final currentKeys = List<String>.from(answers.keys);
      final toRemove = <String>[];
      for (final key in currentKeys) {
        if (key == 'start' || key == 'end' || key == '_id') continue;
        if (!visibleNames.contains(key)) toRemove.add(key);
      }
      for (final k in toRemove) {
        answers.remove(k);
        removed = true;
        debugPrint('Purged hidden answer for "$k".');
      }

      // Clearing removed answers may hide additional questions whose
      // visibility depended on them. Invalidate the cache so the next
      // iteration (or subsequent build) recomputes visibility correctly.
      if (removed) {
        _invalidateVisibilityCache();
      }
      // If we removed any answers, loop again in case their absence hides more questions
    } while (removed);
  }

  int _findNextSectionStart(int from) {
    int i = from;
    while (i < _questions.length) {
      final q = _questions[i];
      if (q == null) {
        i++;
        continue;
      }
      final String? typeStr = q['type']?.toString();
      if (typeStr == null) {
        i++;
        continue;
      }
      final String baseType = typeStr.split(' ')[0];

      if (baseType == 'begin_group') {
        if (q['appearance'] != 'field-list') {
          i++;
          continue;
        }
        final visible = _shouldShowGroup(q);
        if (!visible) {
          i = _findMatchingEnd(i) + 1;
          continue;
        }
        return i;
      }

      if (baseType == 'end_group' || _isUnsupportedType(baseType)) {
        i++;
        continue;
      }

      final visible = _shouldShowQuestion(q);
      if (!visible) {
        i++;
        continue;
      }
      return i;
    }
    return _questions.length;
  }

  int _findPreviousSectionStart(int from) {
    int i = from - 1;
    while (i >= 0) {
      final q = _questions[i];
      if (q == null) {
        i--;
        continue;
      }
      final String? typeStr = q['type']?.toString();
      if (typeStr == null) {
        i--;
        continue;
      }
      final String baseType = typeStr.split(' ')[0];

      if (baseType == 'end_group') {
        final begin = _findMatchingBegin(i);
        if (begin >= 0) {
          final beginQ = _questions[begin];
          final isFieldList = beginQ?['appearance'] == 'field-list';
          final visible = isFieldList ? _shouldShowGroup(beginQ) : false;
          if (isFieldList && visible) return begin;
          i = begin - 1;
          continue;
        }
        i--;
        continue;
      }

      if (baseType == 'begin_group' || _isUnsupportedType(baseType)) {
        i--;
        continue;
      }

      final visible = _shouldShowQuestion(q);
      if (visible) return i;
      i--;
    }
    return 0;
  }

  // ---------- Validation ----------
  String? _validateQuestion(dynamic question) {
    if (question == null) return null;
    final String? typeStr = question['type']?.toString();
    if (typeStr == null) return null;

    final baseType = typeStr.split(' ')[0];
    final label = _labelFor(question);
    final questionName = question['name']?.toString() ?? 'unknown_name';
    final isRequired = question['required'] == true;

    if (_isUnsupportedType(baseType)) return null;
    if (!isRequired) return null;

    final answer = answers[questionName];

    switch (baseType) {
      case 'text':
        if (answer == null || answer.toString().trim().isEmpty) {
          return 'Please enter text for "$label".';
        }
        break;
      case 'integer':
        if (answer == null || answer.toString().trim().isEmpty) {
          return 'Please enter a number for "$label".';
        }
        if (int.tryParse(answer.toString()) == null) {
          return 'Please enter a valid integer for "$label".';
        }
        break;
      case 'decimal':
        if (answer == null || answer.toString().trim().isEmpty) {
          return 'Please enter a decimal number for "$label".';
        }
        if (double.tryParse(answer.toString()) == null) {
          return 'Please enter a valid decimal number for "$label".';
        }
        break;
      case 'date':
        if (answer == null || answer.toString().trim().isEmpty) {
          return 'Please select a date for "$label".';
        }
        break;
      case 'time':
        if (answer == null || answer.toString().trim().isEmpty) {
          return 'Please select a time for "$label".';
        }
        break;
      case 'datetime':
        if (answer == null || answer.toString().trim().isEmpty) {
          return 'Please select a date and time for "$label".';
        }
        break;
      case 'select_one':
        if (answer == null || answer.toString().trim().isEmpty) {
          return 'Please select an option for "$label".';
        }
        if (question['filterEnabled'] == true &&
            question['filterQuestionId'] != null) {
          final filterQuestionName = uuidToName[question['filterQuestionId']];
          final filterAnswer =
              filterQuestionName != null ? answers[filterQuestionName] : null;
          if (question['optionFilterMap'] != null &&
              question['optionFilterMap'].isNotEmpty &&
              filterAnswer != null) {
            final allowedOptions =
                question['optionFilterMap'][filterAnswer] ?? [];
            if (answer != null && !allowedOptions.contains(answer)) {
              return 'Selected option for "$label" is not valid for the current filter.';
            }
          }
        }
        break;
      case 'select_multiple':
        if (answer == null ||
            (answer is List && answer.isEmpty) ||
            (answer is String && answer.trim().isEmpty)) {
          return 'Please select at least one option for "$label".';
        }
        break;
      case 'acknowledge':
        if (answer != true && answer != 'OK') {
          return 'Please acknowledge "$label".';
        }
        break;
      case 'image':
        if (answer == null || answer.toString().isEmpty) {
          return 'Please upload an image for "$label".';
        }
        break;
      case 'video':
        if (answer == null || answer.toString().isEmpty) {
          return 'Please upload a video for "$label".';
        }
        break;
      case 'audio':
        if (answer == null || answer.toString().isEmpty) {
          return 'Please upload an audio file for "$label".';
        }
        break;
      case 'geopoint':
        if (answer == null || answer.toString().trim().isEmpty) {
          return 'Please record a location for "$label".';
        }
        break;
      case 'range':
        if (answer == null) {
          return 'Please select a value for "$label".';
        }
        break;
      case 'file':
        if (answer == null || answer.toString().isEmpty) {
          return 'Please upload a file for "$label".';
        }
        break;
      case 'barcode':
        if (answer == null || answer.toString().isEmpty) {
          return 'Please scan a barcode for "$label".';
        }
        break;
      default:
        return 'Please provide an answer for "$label".';
    }
    return null;
  }

  List<String> _validateSection(int sectionStart) {
    final List<String> errors = [];
    if (sectionStart >= _questions.length) return errors;

    if (_isGroupSection(sectionStart)) {
      final end = _findMatchingEnd(sectionStart);
      for (int k = sectionStart + 1; k < end && k < _questions.length; k++) {
        final q = _questions[k];
        if (q == null) continue;
        final String? typeStr = q['type']?.toString();
        if (typeStr == null) continue;
        final baseType = typeStr.split(' ')[0];
        if (_isUnsupportedType(baseType)) continue;
        if (!_shouldShowQuestion(q)) continue;
        final err = _validateQuestion(q);
        if (err != null) errors.add(err);
      }
    } else {
      final q = _questions[sectionStart];
      if (q == null) return errors;
      final String? typeStr = q['type']?.toString();
      if (typeStr == null || _isUnsupportedType(typeStr.split(' ')[0]))
        return errors;
      if (_shouldShowQuestion(q)) {
        final err = _validateQuestion(q);
        if (err != null) errors.add(err);
      }
    }
    return errors;
  }

  // ---------- Navigation actions ----------
  void previous() {
    if (currentIndex <= 0 || !mounted || _isNavigating) return;
    _isNavigating = true;
    if (mounted && FocusScope.of(context).hasFocus) {
      FocusScope.of(context).unfocus();
    }
    setState(() {
      isFormComplete = false;
      currentIndex = _findPreviousSectionStart(currentIndex);
      currentIndex = currentIndex.clamp(0, _questions.length - 1);
    });
    _isNavigating = false;
  }

    void next() async {
      if (_isNavigating || !mounted) return;
      _isNavigating = true;
      try {
        if (mounted && FocusScope.of(context).hasFocus) {
          FocusScope.of(context).unfocus();
          await Future.delayed(const Duration(milliseconds: 100));
        }
        if (_formKey.currentState != null && !_formKey.currentState!.validate()) {
          _isNavigating = false;
          return;
        }
        final errors = _validateSection(currentIndex);
        if (errors.isNotEmpty) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(errors.join('\n')),
                backgroundColor: Colors.red,
                duration: const Duration(seconds: 3),
              ),
            );
          }
          _isNavigating = false;
          return;
        }

        if (!mounted) return;

        // Compute the next start, but keep index within bounds.
        final sectionEnd =
            _isGroupSection(currentIndex)
                ? _findMatchingEnd(currentIndex)
                : currentIndex;
        final nextStart = _findNextSectionStart(sectionEnd + 1);

        if (nextStart >= _questions.length) {
          // Keep index at last valid question and open preview screen.
          final last = (_questions.length - 1).clamp(0, _questions.length - 1);
          setState(() {
            currentIndex = last;
            isFormComplete = false;
          });
          await _openReviewScreen();
          return;
        }

        setState(() {
          currentIndex = nextStart;
          isFormComplete = false;
        });
      } finally {
        _isNavigating = false;
      }
    }

  void _onAnswerChanged(String key, dynamic value) {
    if (!mounted) return;
    final previous = answers[key];
    if (previous == value) return; // Avoid unnecessary rebuilds

    setState(() {
      answers[key] = value;
      _invalidateVisibilityCache();

      void clearDependents(String changedKey) {
        for (var question in _questions) {
          if (question == null || question['filterEnabled'] != true) continue;
          final parentUuid = question['filterQuestionId']?.toString();
          final parentName = uuidToName[parentUuid];
          if (parentName == null || parentName != changedKey) continue;

          final dependentName = question['name']?.toString();
          if (dependentName == null) continue;
          final currentAnswer = answers[dependentName];
          if (currentAnswer == null) {
            clearDependents(dependentName);
            continue;
          }

          final allowedOptions =
              question['optionFilterMap']?[answers[parentName]] ?? [];
          if (question['type'].toString().startsWith('select_one')) {
            if (!allowedOptions.contains(currentAnswer)) {
              answers.remove(dependentName);
              clearDependents(dependentName);
            }
          } else if (question['type'].toString().startsWith(
            'select_multiple',
          )) {
            final currentAnswers =
                currentAnswer is String
                    ? currentAnswer
                        .split(' ')
                        .where((v) => v.isNotEmpty)
                        .toList()
                    : (currentAnswer as List?)?.cast<String>() ?? [];
            final validAnswers =
                currentAnswers
                    .where((a) => allowedOptions.contains(a))
                    .toList();
            if (validAnswers.length != currentAnswers.length) {
              answers[dependentName] =
                  validAnswers.isEmpty ? null : validAnswers.join(' ');
              clearDependents(dependentName);
            }
          }
        }
      }

      clearDependents(key);

      // Auto-jump if current section becomes invisible
      if (_isGroupSection(currentIndex)) {
        final currentGroup = _questions[currentIndex];
        final groupVisible = _shouldShowGroup(currentGroup);
        if (!groupVisible) {
          final end = _findMatchingEnd(currentIndex);
          final nextStart = _findNextSectionStart(end + 1);
          currentIndex =
              nextStart >= _questions.length
                  ? (_questions.length - 1).clamp(0, _questions.length - 1)
                  : nextStart;
          isFormComplete = currentIndex >= _questions.length - 1;
        }
      } else if (currentIndex < _questions.length) {
        final q = _questions[currentIndex];
        if (q != null && q['type'] != null) {
          final baseType = q['type'].toString().split(' ')[0];
          if (!_isUnsupportedType(baseType) && !_shouldShowQuestion(q)) {
            final nextStart = _findNextSectionStart(currentIndex + 1);
            currentIndex =
                nextStart >= _questions.length
                    ? (_questions.length - 1).clamp(0, _questions.length - 1)
                    : nextStart;
            isFormComplete = currentIndex >= _questions.length - 1;
          }
        }
      }

      _purgeHiddenAnswers();
    });
  }

  // ---------- Renderability normalization ----------
  int _normalizeToRenderable(int from) {
    int idx = _findNextSectionStart(from);
    while (idx < _questions.length) {
      final q = _questions[idx];
      if (q == null) {
        idx++;
        continue;
      }
      final String typeStr = q['type']?.toString() ?? '';
      final String baseType = typeStr.split(' ')[0];

      if (baseType == 'begin_group' && q['appearance'] == 'field-list') {
        if (_shouldShowGroup(q)) return idx;
        idx = _findMatchingEnd(idx) + 1;
        continue;
      }
      if (baseType == 'end_group' || _isUnsupportedType(baseType)) {
        idx++;
        continue;
      }
      if (_shouldShowQuestion(q)) return idx;
      idx++;
    }
    return idx;
  }

  // ---------- Preview & language menu ----------
  Widget _moreMenu() {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert),
      tooltip: 'Options',
        onSelected: (value) async {
          switch (value) {
            case 'preview':
              // If user is on the finalize page, reset state so returning from
              // preview shows the last question instead of a blank screen.
              if (isFormComplete) {
                setState(() {
                  isFormComplete = false;
                  currentIndex = (_questions.length - 1).clamp(
                    0,
                    _questions.length - 1,
                  );
                });
              }
              await _openReviewScreen(fromAppbar: true);
              break;
            case 'language':
              await _openLanguagePicker();
              break;
          }
        },
      itemBuilder: (context) {
        final items = <PopupMenuEntry<String>>[
          const PopupMenuItem<String>(
            value: 'preview',
            child: ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.visibility_outlined),
              title: Text('Preview'),
            ),
          ),
        ];

        if (_formHasLanguages) {
          items.add(
            const PopupMenuItem<String>(
              value: 'language',
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(Icons.translate),
                title: Text('Language'),
              ),
            ),
          );
        }

        return items;
      },
    );
  }

  Future<void> _openLanguagePicker() async {
    if (!_formHasLanguages) return;

    final ids = <int>{
      if (_meta?['default_language'] is int) _meta!['default_language'] as int,
      ...((_meta?['other_languages'] as List?)?.whereType<int>() ??
          const <int>[]),
    }.toList();

    if (ids.isEmpty) return;

    int tempSelected = _selectedLanguageId ?? ids.first;

    final chosen = await showModalBottomSheet<int>(
      context: context,
      isScrollControlled: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const ListTile(
                    title: Text(
                      'Language',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                  const Divider(height: 1),
                  Flexible(
                    child: ListView(
                      shrinkWrap: true,
                      children: ids.map((id) {
                        final label = _langDisplayById[id] ?? 'Lang #$id';
                        return RadioListTile<int>(
                          title: Text(label),
                          value: id,
                          groupValue: tempSelected,
                          onChanged: (v) {
                            if (v == null) return;
                            setSheetState(() => tempSelected = v);
                            Navigator.of(context).pop(v);
                          },
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            );
          },
        );
      },
    );

    if (chosen != null && mounted) {
      setState(() => _selectedLanguageId = chosen);
    }
  }

  int _sectionStartForQuestionName(String questionName) {
    for (int i = 0; i < _questions.length; i++) {
      final q = _questions[i];
      if (q == null) continue;
      final typeStr = q['type']?.toString() ?? '';
      final baseType = typeStr.split(' ').first;

      if (baseType == 'begin_group' && q['appearance'] == 'field-list') {
        final begin = i;
        final end = _findMatchingEnd(begin);
        for (int k = begin + 1; k < end && k < _questions.length; k++) {
          final child = _questions[k];
          if (child == null) continue;
          if (_isStructural(child)) continue;
          if (child['name']?.toString() == questionName) {
            return begin;
          }
        }
        i = end;
        continue;
      }

      if (!_isStructural(q) && q['name']?.toString() == questionName) {
        return i;
      }
    }
    return 0;
  }

  void _jumpToQuestion(String xpath) {
    final idx = _sectionStartForQuestionName(xpath);
    setState(() {
      currentIndex = idx.clamp(
        0,
        _questions.isEmpty ? 0 : _questions.length - 1,
      );
      isFormComplete = false;
      _invalidateVisibilityCache();
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _formKey.currentState?.validate();
    });
  }

  Future<void> _openReviewScreen({bool fromAppbar = false}) async {
    final selectedLanguageKey =
        _selectedLanguageId != null ? _langDisplayById[_selectedLanguageId!] : null;

    final confirmed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => ReviewScreen(
          questions: _questions,
          answers: answers,
          onEditRequested: (xpath) {
            Navigator.of(context).pop(false);
            _jumpToQuestion(xpath);
          },
          showUnanswered: true,
          fromAppbar: fromAppbar,
          selectedLanguageKey: selectedLanguageKey,
        ),
      ),
    );

    if (confirmed == true) {
      if (!mounted) return;
      setState(() {
        isFormComplete = true;
        currentIndex = (_questions.length - 1).clamp(0, _questions.length - 1);
      });
    }
  }

  /// Resolves a constraint expression into a simple `regex(., '...')` string.
  /// Evaluates any conditional logic using the current answers map.
  String _resolveConstraint(Map<String, dynamic> question) {
    final raw = question['constraint']?.toString() ?? '';
    if (raw.isEmpty) return '';

    if (!raw.contains(r'${')) {
      return raw;
    }

    final segments = raw.split(RegExp(r'\s+or\s+'));
    for (final seg in segments) {
      final condRegex = RegExp(r"\$\{([^}]*)\}\s*(=|!=)\s*'([^']*)'");
      final conditions = condRegex.allMatches(seg);
      var matches = true;
      for (final m in conditions) {
        final qName = m.group(1)!;
        final op = m.group(2)!;
        final expected = m.group(3)!;
        final actual = answers[qName]?.toString();
        if (op == '=' && actual != expected) {
          matches = false;
          break;
        } else if (op == '!=' && actual == expected) {
          matches = false;
          break;
        }
      }

      if (matches) {
        final regexMatch =
            RegExp(r"regex\(\.\s*,\s*'([^']*)'\)").firstMatch(seg);
        if (regexMatch != null) {
          final pattern = regexMatch.group(1)!;
          return "regex(., '$pattern')";
        } else {
          return '';
        }
      }
    }

    return '';
  }

  // Put this INSIDE class _FormPageState, e.g. near the "UI" section.

  Widget _buildQuestionWidget(dynamic question) {
    if (question == null) {
      return const Text(
        'Error: Question is null',
        style: TextStyle(color: Colors.red),
      );
    }

    final label = _labelFor(question);
    final questionName = question['name']?.toString() ?? 'unknown_name';
    final type = question['type']?.toString() ?? '';
    final baseType = type.split(' ').first;
    final id = questionName;

    // Structural types -> render nothing
    if (baseType == 'begin_group' || baseType == 'end_group') {
      return const SizedBox.shrink();
    }

    // Guard: unsupported -> show helpful hint instead of crashing
    bool unsupported(String? t) {
      if (t == null) return true;
      const supported = {
        'text',
        'datetime',
        'acknowledge',
        'select_one',
        'select_multiple',
        'video',
        'image',
        'time',
        'integer',
        'date',
        'audio',
        'geopoint',
        'range',
        'decimal',
        'file',
        'barcode',
        'geotrace',
        'geoshape',
        'note',
      };
      return !supported.contains(t);
    }

    if (unsupported(baseType)) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Unsupported question type: $baseType",
            style: const TextStyle(fontSize: 16, color: Colors.red),
          ),
          Text("name: $questionName"),
        ],
      );
    }

    try {
      switch (baseType) {
        case 'text':
          return text_question.TextQuestion(
            validationQuestion: () => question['required'] == true,
            label: label,
            xpath: questionName,
            kuid: id,
            currentValue: answers[questionName]?.toString(),
            onChanged: (value) => _onAnswerChanged(questionName, value),
            appearance: question['appearance']?.toString() ?? '',
            readOnly: question['read_only']?.toString() ?? '',
            defaultValue: question['default']?.toString() ?? '',
            constraint: _resolveConstraint(question),
            constraintMessage: question['constraint_message']?.toString() ?? '',
          );

        case 'integer':
          return IntegerQuestion(
            key: Key(questionName),
            readOnly: question['read_only']?.toString() ?? '',
            defaultValue: question['default']?.toString() ?? '',
            validationQuestion: () => question['required'] == true,
            label: label,
            xpath: questionName,
            kuid: id,
            currentValue: answers[questionName]?.toString(),
            onChanged: (v) => _onAnswerChanged(questionName, v),
          );

        case 'decimal':
          return DecimalQuestion(
            readOnly: question['read_only']?.toString() ?? '',
            defaultValue: question['default']?.toString() ?? '',
            validationQuestion: () => question['required'] == true,
            label: label,
            xpath: questionName,
            kuid: id,
            currentValue: answers[questionName]?.toString(),
            onChanged: (v) => _onAnswerChanged(questionName, v.toString()),
          );

        case 'date':
          return DateQuestion(
            validationQuestion: () => question['required'] == true,
            appearance: question['appearance']?.toString() ?? '',
            label: label,
            xpath: questionName,
            kuid: id,
            currentValue: answers[questionName]?.toString(),
            onChanged: (v) => _onAnswerChanged(questionName, v),
          );

        case 'time':
          return TimeQuestion(
            label: label,
            xpath: questionName,
            kuid: id,
            currentValue: answers[questionName]?.toString(),
            onChanged: (v) => _onAnswerChanged(questionName, v),
          );

        case 'datetime':
          return DatetimeQuestion(
            label: label,
            xpath: questionName,
            kuid: id,
            currentValue: answers[questionName]?.toString(),
            onChanged: (v) => _onAnswerChanged(questionName, v),
          );

        case 'acknowledge':
          return AcknowledgeQuestion(
            label: label,
            xpath: questionName,
            kuid: id,
            currentValue: answers[questionName] == 'OK',
            onChanged:
                (v) => _onAnswerChanged(questionName, v == true ? 'OK' : null),
            hint: question['guidance_hint']?.toString() ?? '',
          );

        case 'select_one':
          {
            final listName =
                type.split(' ').length > 1 ? type.split(' ')[1] : '';
            final options = _labelForOption(question);
            final formChoices =
                options
                    .map<Map<String, dynamic>>(
                      (c) =>
                          (c is Map)
                              ? c.map((k, v) => MapEntry(k.toString(), v))
                              : <String, dynamic>{
                                'name': 'invalid',
                                'label': 'Invalid option',
                              },
                    )
                    .toList();

            final filterEnabled = question['filterEnabled'] == true;
            final filterQuestionId =
                filterEnabled ? question['filterQuestionId']?.toString() : null;
            final filterQuestionName =
                filterQuestionId != null ? uuidToName[filterQuestionId] : null;
            final rawFilterMap = question['optionFilterMap'] ?? {};
            final optionFilterMap =
                filterEnabled
                    ? (rawFilterMap as Map).map<String, List<String>>(
                      (k, v) =>
                          MapEntry(k.toString(), List<String>.from(v as List)),
                    )
                    : null;
            final filterOptionValues =
                filterEnabled
                    ? List<String>.from(question['filterOptionValues'] ?? [])
                    : null;

            return SelectOneQuestion(
              validationQuestion: () => question['required'] == true,
              readOnly: question['read_only']?.toString() ?? '',
              defaultValue: question['default']?.toString() ?? '',
              appearance: question['appearance']?.toString() ?? '',
              label: label,
              xpath: questionName,
              kuid: id,
              currentValue: answers[questionName]?.toString(),
              onChanged: (v) => _onAnswerChanged(questionName, v),
              formChoices: formChoices,
              listName: listName,
              next: next,
              filterEnabled: filterEnabled,
              filterQuestionName: filterQuestionName,
              optionFilterMap: optionFilterMap,
              filterOptionValues: filterOptionValues,
              answers: answers,
            );
          }

        case 'select_multiple':
          {
            final listName =
                type.split(' ').length > 1 ? type.split(' ')[1] : '';
            final options = _labelForOption(question);
            final formChoices =
                options
                    .map<Map<String, dynamic>>(
                      (c) =>
                          (c is Map)
                              ? c.map((k, v) => MapEntry(k.toString(), v))
                              : <String, dynamic>{
                                'name': 'invalid',
                                'label': 'Invalid option',
                              },
                    )
                    .toList();

            final filterEnabled = question['filterEnabled'] == true;
            final filterQuestionId =
                filterEnabled ? question['filterQuestionId']?.toString() : null;
            final filterQuestionName =
                filterQuestionId != null ? uuidToName[filterQuestionId] : null;
            final rawFilterMap = question['optionFilterMap'] ?? {};
            final optionFilterMap =
                filterEnabled
                    ? (rawFilterMap as Map).map<String, List<String>>(
                      (k, v) =>
                          MapEntry(k.toString(), List<String>.from(v as List)),
                    )
                    : null;
            final filterOptionValues =
                filterEnabled
                    ? List<String>.from(question['filterOptionValues'] ?? [])
                    : null;

            final current = answers[questionName]?.toString() ?? '';
            final currentList =
                current.split(' ').where((e) => e.isNotEmpty).toList();

            return SelectMultipleQuestion(
              readOnly: question['read_only']?.toString() ?? '',
              defaultValue: question['default']?.toString() ?? '',
              validationQuestion: () => question['required'] == true,
              appearance: question['appearance']?.toString() ?? '',
              label: label,
              xpath: questionName,
              kuid: id,
              currentValue: currentList,
              onChanged:
                  (vals) =>
                      _onAnswerChanged(questionName, vals?.join(' ') ?? ''),
              formChoices: formChoices,
              listName: listName,
              next: next,
              filterEnabled: filterEnabled,
              filterQuestionId: filterQuestionId,
              optionFilterMap: optionFilterMap,
              filterOptionValues: filterOptionValues,
              answers: answers,
            );
          }

        case 'image':
          return ImageQuestion(
            label: label,
            xpath: questionName,
            kuid: id,
            currentValue: answers[questionName]?.toString(),
            onChanged: (v) => _onAnswerChanged(questionName, v),
            validationQuestion: () => question['required'] == true,
            appearance: question['appearance']?.toString() ?? '',
          );

        case 'video':
          return VideoQuestion(
            label: label,
            name: questionName,
            kuid: id,
            currentValue: answers[id]?.toString(),
            onChanged: (v) => _onAnswerChanged(id, v),
          );

        case 'audio':
          return AudioQuestion(
            label: label,
            name: questionName,
            kuid: id,
            currentValue: answers[id]?.toString(),
            onChanged: (v) => _onAnswerChanged(id, v),
          );

        case 'file':
          return FileQuestion(
            label: label,
            name: questionName,
            kuid: id,
            currentValue: answers[id]?.toString(),
            onChanged: (v) => _onAnswerChanged(id, v),
          );

        case 'barcode':
          return BarcodeQuestion(
            label: label,
            xpath: questionName,
            kuid: id,
            currentValue: answers[questionName]?.toString(),
            onChanged: (v) => _onAnswerChanged(questionName, v.toString()),
          );

        case 'geopoint':
          return GeopointQuestion(
            label: label,
            xpath: questionName,
            kuid: id,
            currentValue: answers[questionName]?.toString(),
            onChanged: (v) => _onAnswerChanged(questionName, v),
          );

        case 'geotrace':
          return GeotraceQuestion(
            label: label,
            xpath: questionName,
            kuid: id,
            currentValue: answers[questionName]?.toString(),
            onChanged: (v) => _onAnswerChanged(questionName, v),
          );

        case 'geoshape':
          return GeoshapeQuestion(
            label: label,
            xpath: questionName,
            kuid: id,
            currentValue: answers[questionName]?.toString(),
            onChanged: (v) => _onAnswerChanged(questionName, v),
          );

        case 'range':
          return RangeQuestion(
            label: label,
            xpath: questionName,
            kuid: id,
            currentValue:
                answers[questionName] != null
                    ? int.tryParse(answers[questionName].toString())
                    : null,
            onChanged: (v) => _onAnswerChanged(questionName, v?.toString()),
            parameters: question['parameters']?.toString() ?? '',
          );

        case 'note':
          return NoteQuestion(label: label);

        default:
          return const SizedBox.shrink();
      }
    } catch (e, stack) {
      debugPrint('Error building widget for $questionName: $e\n$stack');
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Error building question widget: $baseType",
            style: const TextStyle(fontSize: 18, color: Colors.red),
          ),
          const SizedBox(height: 8),
          Text("Name: $questionName"),
          Text(
            "Error: ${e.toString()}",
            style: const TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ],
      );
    }
  }

  PreferredSizeWidget _buildAppBar(String title, {Color? background}) {
    return AppBar(
      title: Text(
        title,
        style:
            background != null
                ? const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 20,
                  letterSpacing: 0.5,
                  color: Colors.white,
                )
                : const TextStyle(fontWeight: FontWeight.w600),
      ),
      elevation: background != null ? 0 : 2,
      shadowColor: background != null ? Colors.black12 : null,
      backgroundColor: background,
      leading: IconButton(
        icon: Icon(
          Icons.arrow_back,
          color: background != null ? Colors.white : null,
        ),
        onPressed: () => Navigator.pop(context),
      ),
      centerTitle: true,
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 4),
          child: _moreMenu(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    // Ensure currentIndex points to renderable
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final normalized = _normalizeToRenderable(currentIndex);
      if (normalized != currentIndex) {
        setState(() {
          currentIndex =
              (normalized >= _questions.length)
                  ? (_questions.length - 1).clamp(0, _questions.length - 1)
                  : normalized;
          isFormComplete = normalized >= _questions.length;
        });
      }
    });

    final appBarTitle = _translatedFormTitleOr(_formBaseTitle());

    // Completed screen
    if (isFormComplete) {
      return BlocConsumer<FormPageBloc, FormPageState>(
        bloc: _formPageBloc,
        listenWhen: (previous, current) => current is FormPageAtionState,
        listener: (context, state) {
          if (state is FormPageFinalizeState) {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (context) => FollowUpUserHome()),
              (route) => false,
            );
          }
        },
        builder: (context, state) {
          return SafeArea(
            child: Scaffold(
              backgroundColor: const Color(0xFFF5F7FA),
              appBar: _buildAppBar(
                appBarTitle,
                background: const Color(0xFF4CAF50),
              ),
              body: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Form Completed!',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                        color: const Color(0xFF4CAF50),
                        shadows: [
                          Shadow(
                            color: const Color(0xFF4CAF50).withOpacity(0.2),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: MediaQuery.of(context).size.height * 0.04),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 16,
                      ),
                      margin: const EdgeInsets.symmetric(horizontal: 24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Colors.grey.shade200,
                          width: 1,
                        ),
                        boxShadow: const [
                          BoxShadow(
                            color: Colors.black12,
                            spreadRadius: 3,
                            blurRadius: 12,
                            offset: Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ElevatedButton.icon(
                            onPressed: () {
                              setState(() {
                                currentIndex++;
                              });
                              previous();
                            },
                            style: ElevatedButton.styleFrom(
                              foregroundColor: const Color(0xFF2196F3),
                              backgroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 12,
                              ),
                              textStyle: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                                side: BorderSide(
                                  color: const Color(
                                    0xFF2196F3,
                                  ).withOpacity(0.3),
                                ),
                              ),
                              elevation: 0,
                              shadowColor: Colors.transparent,
                            ),
                            icon: const Icon(Icons.arrow_back, size: 20),
                            label: const Text('Back'),
                          ),
                          const SizedBox(width: 12),
                          VerticalDivider(
                            width: 24,
                            thickness: 1,
                            color: Colors.grey.shade300,
                          ),
                          const SizedBox(width: 12),
                          ElevatedButton.icon(
                            onPressed: () async {
                              FocusScope.of(context).unfocus();
                              final errors = _validateSection(currentIndex);
                              if (errors.isNotEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      errors.join('\n'),
                                      style: const TextStyle(fontSize: 14),
                                    ),
                                    backgroundColor: Colors.red.shade600,
                                    duration: const Duration(seconds: 3),
                                    behavior: SnackBarBehavior.floating,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                );
                                return;
                              }
                              final nonSystemKeys = answers.keys.where(
                                (k) => k != 'start' && k != 'end' && k != '_id',
                              );
                              if (nonSystemKeys.isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: const Text(
                                      'You must answer at least one question.',
                                      style: TextStyle(fontSize: 14),
                                    ),
                                    backgroundColor: Colors.orange.shade600,
                                    behavior: SnackBarBehavior.floating,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                );
                                return;
                              }
                              final now = DateTime.now();
                              answers['end'] = now.toIso8601String().substring(
                                0,
                                23,
                              );
                              answers['_id'] = "form_${widget.formUid}";
                              _formPageBloc.add(
                                FormPageFinalizeButtonPressed(
                                  answers: answers,
                                  formUid: widget.formUid,
                                  originalAnswers: _originalAnswers,
                                ),
                              );
                              Navigator.pop(context);
                            },
                            style: ElevatedButton.styleFrom(
                              foregroundColor: Colors.white,
                              backgroundColor: const Color(0xFF4CAF50),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 12,
                              ),
                              textStyle: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              elevation: 2,
                              shadowColor: Colors.black12,
                            ),
                            icon: const Icon(Icons.check_circle, size: 20),
                            label: const Text('Finalize'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      );
    }

    // Empty / out-of-range handling
    if (_questions.isEmpty || currentIndex >= _questions.length) {
      return SafeArea(
        child: Scaffold(
          appBar: _buildAppBar(_translatedFormTitleOr(_formBaseTitle())),
          body: Center(
            child: Text(
              _questions.isEmpty
                  ? 'No questions available in this form.'
                  : 'Form navigation error. Please restart the form.',
            ),
          ),
        ),
      );
    }

    // ------- Build content for current section -------
    Widget content;
    try {
      if (_isGroupSection(currentIndex)) {
        final groupQ = _questions[currentIndex];
        final groupLabel = _labelFor(groupQ);
        final end = _findMatchingEnd(currentIndex);

        final List<int> visibleIndices = [];
        for (int k = currentIndex + 1; k < end && k < _questions.length; k++) {
          final q = _questions[k];
          if (q == null) continue;
          final String? typeStr = q['type']?.toString();
          if (typeStr == null) continue;
          final baseType = typeStr.split(' ')[0];
          if (_isUnsupportedType(baseType)) continue;
          if (_shouldShowQuestion(q)) visibleIndices.add(k);
        }

        visibleIndices.sort();

        final List<Widget> children = [];
        if (groupLabel.isNotEmpty) {
          children.add(
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                groupLabel,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          );
        }
        for (final k in visibleIndices) {
          try {
            children.add(
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _buildQuestionWidget(_questions[k]),
              ),
            );
          } catch (_) {
            children.add(
              const Padding(
                padding: EdgeInsets.only(bottom: 16),
                child: Text(
                  'Error rendering question.',
                  style: TextStyle(color: Colors.red),
                ),
              ),
            );
          }
        }

        content = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: children,
        );
      } else {
        final question = _questions[currentIndex];
        final typeStr = question?['type']?.toString() ?? '';
        final baseType = typeStr.split(' ').first;
        content =
            (baseType == 'begin_group' || baseType == 'end_group')
                ? const SizedBox.shrink()
                : _buildQuestionWidget(question);
      }
    } catch (e) {
      content = Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error, color: Colors.red, size: 48),
          const SizedBox(height: 16),
          Text('Error building form content: ${e.toString()}'),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () {
              setState(() {
                _invalidateVisibilityCache();
                currentIndex = _findNextSectionStart(0);
              });
            },
            child: const Text('Reset Form'),
          ),
        ],
      );
    }

    return WillPopScope(
      onWillPop: () async {
        if (_isDialogShowing) return false;
        _isDialogShowing = true;

        final nonSystemKeys =
            answers.keys
                .where((k) => k != 'start' && k != 'end' && k != '_id')
                .toList();
        bool shouldExit = true;

        if (nonSystemKeys.isNotEmpty) {
          shouldExit =
              await showDialog<bool>(
                context: context,
                builder:
                    (context) => AlertDialog(
                      title: const Text("Unsaved Changes"),
                      content: const Text(
                        "Do you want to save as draft, discard changes, or cancel?",
                      ),
                      actions: [
                        TextButton(
                          onPressed: () {
                            final nonSystem = answers.keys.where(
                              (k) => k != 'start' && k != 'end' && k != '_id',
                            );
                            if (nonSystem.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Cannot save an empty draft.'),
                                  backgroundColor: Colors.orange,
                                ),
                              );
                              return;
                            }
                            final now = DateTime.now();
                            answers['end'] = now.toIso8601String().substring(
                              0,
                              23,
                            );
                            answers['_id'] = "form_${widget.formUid}";
                            _formPageBloc.add(
                              FormPageFinalizeButtonPressed(
                                answers: answers,
                                formUid: widget.formUid,
                                originalAnswers: _originalAnswers,
                              ),
                            );
                            Navigator.pushAndRemoveUntil(
                              context,
                              MaterialPageRoute(
                                builder: (context) => FollowUpUserHome(),
                              ),
                              (route) => false,
                            );
                          },
                          child: const Text("Save as Draft"),
                        ),
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(true),
                          child: const Text("Discard"),
                        ),
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(false),
                          child: const Text("Cancel"),
                        ),
                      ],
                    ),
              ) ??
              false;
        }

        _isDialogShowing = false;
        return shouldExit;
      },
      child: SafeArea(
        child: Scaffold(
          appBar: _buildAppBar(appBarTitle),
          body: GestureDetector(
            onHorizontalDragEnd: (details) {
              if (details.primaryVelocity != null) {
                if (details.primaryVelocity! < -200)
                  next();
                else if (details.primaryVelocity! > 200)
                  previous();
              }
            },
            child: Padding(
              padding: const EdgeInsets.only(top: 40, left: 35, right: 35),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(child: SingleChildScrollView(child: content)),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.withOpacity(0.2),
                            spreadRadius: 2,
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: FilledButton(
                              onPressed: currentIndex > 0 ? previous : null,
                              style: FilledButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 12,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                backgroundColor:
                                    currentIndex > 0
                                        ? null
                                        : Colors.grey.shade300,
                                foregroundColor:
                                    currentIndex > 0
                                        ? null
                                        : Colors.grey.shade600,
                              ),
                              child: const Text('Back'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (currentIndex > 0)
                            const VerticalDivider(
                              width: 20,
                              thickness: 1,
                              color: Colors.grey,
                            ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: FilledButton(
                              onPressed: next,
                              style: FilledButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 12,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: Text(
                                isFormComplete ||
                                        currentIndex >= _questions.length - 1
                                    ? "Finish"
                                    : "Next",
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
