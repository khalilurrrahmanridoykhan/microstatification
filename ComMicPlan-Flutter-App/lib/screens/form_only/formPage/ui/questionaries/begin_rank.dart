import 'package:flutter/material.dart';

class BeginRankQuestion extends StatelessWidget {
  final String label;
  final String xpath;
  final String kuid;
  final Map<String, String>? currentValue; // Full flat map of all answers
  final ValueChanged<Map<String, String>?> onChanged;
  final List<dynamic> formChoices;
  final String listName;
  final List<dynamic> form;
  final int currentIndex;

  const BeginRankQuestion({
    super.key,
    required this.label,
    required this.xpath,
    required this.kuid,
    required this.currentValue,
    required this.onChanged,
    required this.formChoices,
    required this.listName,
    required this.form,
    required this.currentIndex,
  });

  // Validate that no two rank levels have the same choice selected
  String? validate() {
    final relevantAnswers = _extractRelevantAnswers(currentValue);
    final selectedChoices = relevantAnswers.values.toSet();
    if (selectedChoices.length < relevantAnswers.length) {
      return 'Duplicate selections detected. Each rank level must have a unique choice.';
    }
    return null;
  }

  /// Filters only the keys that start with `xpath/`
  Map<String, String> _extractRelevantAnswers(Map<String, String>? allAnswers) {
    if (allAnswers == null) return {};
    return Map.fromEntries(
      allAnswers.entries.where((e) => e.key.startsWith('$xpath/')),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Filter rank choices based on listName
    final rankChoices =
        formChoices.where((choice) => choice['list_name'] == listName).toList();

    // Collect rank levels until end_rank
    final rankLevels = <dynamic>[];
    int nextIndex = currentIndex + 1;
    while (nextIndex < form.length && form[nextIndex]['type'] != 'end_rank') {
      if (form[nextIndex]['type'] == 'rank__level') {
        rankLevels.add(form[nextIndex]);
      }
      nextIndex++;
    }

    final allAnswers = currentValue ?? {};
    final relevantAnswers = _extractRelevantAnswers(allAnswers);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 18)),
        const SizedBox(height: 10),
        if (rankLevels.isEmpty) const Text("No rank levels available"),
        ...rankLevels.map((rankLevel) {
          final levelSuffix = rankLevel['\$xpath']?.toString() ?? '_unknown';
          final key = '$xpath/$levelSuffix';

          final displayLabel =
              rankLevel['label'] is List && rankLevel['label'].isNotEmpty
                  ? rankLevel['label'][0].toString()
                  : levelSuffix;

          final selectedChoiceName = relevantAnswers[key];

          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(displayLabel, style: const TextStyle(fontSize: 20)),
                DropdownButton<String>(
                  value: selectedChoiceName,
                  items:
                      rankChoices.map((choice) {
                        final label =
                            choice['label'] is List &&
                                    choice['label'].isNotEmpty
                                ? choice['label'][0].toString()
                                : 'Unnamed option';
                        final choiceName = choice['name'].toString();
                        return DropdownMenuItem<String>(
                          value: choiceName,
                          child: Text(label),
                        );
                      }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      final updatedAnswers = Map<String, String>.from(
                        allAnswers,
                      );
                      updatedAnswers[key] = value;
                      print('Rank onChanged: $updatedAnswers');
                      onChanged(updatedAnswers);
                    }
                  },
                  hint: const Text('Select an item'),
                  isExpanded: true,
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
