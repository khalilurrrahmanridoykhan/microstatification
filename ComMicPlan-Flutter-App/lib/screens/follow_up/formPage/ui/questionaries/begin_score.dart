import 'package:flutter/material.dart';

class BeginScoreQuestion extends StatelessWidget {
  final String label;
  final String xpath;
  final String kuid;
  final Map<String, dynamic>
  currentValue; // 🔥 FIXED: Changed from String to dynamic
  final ValueChanged<Map<String, dynamic>>
  onChanged; // 🔥 FIXED: Changed from String to dynamic
  final List<dynamic> formChoices;
  final String listName;
  final List<dynamic> form;
  final int currentIndex;

  const BeginScoreQuestion({
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

  Map<String, dynamic> _extractRelevantAnswers(
    Map<String, dynamic>? allAnswers,
  ) {
    return Map<String, dynamic>.from(allAnswers ?? {});
  }

  @override
  Widget build(BuildContext context) {
    // Filter score choices based on listName
    final scoreChoices =
        formChoices.where((choice) => choice['list_name'] == listName).toList();

    // Collect score questions until 'end_score'
    final scoreQuestions = <dynamic>[];
    int nextIndex = currentIndex + 1;
    while (nextIndex < form.length && form[nextIndex]['type'] != 'end_score') {
      if (form[nextIndex]['type'] == 'score__row') {
        scoreQuestions.add(form[nextIndex]);
      }
      nextIndex++;
    }

    // Ensure answers are properly initialized
    final allAnswers = currentValue;
    final relevantAnswers = _extractRelevantAnswers(allAnswers);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        if (scoreChoices.isEmpty) const Text("No score options available"),
        if (scoreQuestions.isEmpty) const Text("No score questions available"),
        if (scoreChoices.isNotEmpty && scoreQuestions.isNotEmpty)
          Table(
            columnWidths: const {0: FixedColumnWidth(160)},
            children: [
              // Header row for score choices
              TableRow(
                children: [
                  const Padding(padding: EdgeInsets.all(8.0), child: Text('')),
                  ...scoreChoices.map(
                    (choice) => Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text(
                        choice['label'] is List && choice['label'].isNotEmpty
                            ? choice['label'][0].toString()
                            : choice['name'].toString(),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ],
              ),
              // Rows for score questions
              ...scoreQuestions.map((scoreQuestion) {
                final displayLabel =
                    (scoreQuestion['label'] is List &&
                            scoreQuestion['label'].isNotEmpty)
                        ? scoreQuestion['label'][0].toString()
                        : scoreQuestion['name']?.toString() ??
                            'Unnamed Question';
                final scoreXPath =
                    scoreQuestion['\$xpath']?.toString() ?? 'unknown_xpath';

                // 🔥 FIXED: Safe conversion to string, handling null values
                final groupValue = relevantAnswers[scoreXPath]?.toString();
                debugPrint('scoreXPath: $scoreXPath, groupValue: $groupValue');

                return TableRow(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text(displayLabel),
                    ),
                    ...scoreChoices.map((choice) {
                      final choiceValue = choice['name'].toString();
                      return Radio<String>(
                        value: choiceValue,
                        groupValue: groupValue,
                        onChanged: (value) {
                          // 🔥 FIXED: Use dynamic map instead of forcing string
                          final updatedAnswers = Map<String, dynamic>.from(
                            allAnswers,
                          );
                          if (value != null) {
                            updatedAnswers[scoreXPath] = value;
                          } else {
                            updatedAnswers.remove(scoreXPath);
                          }
                          debugPrint('Score onChanged: $updatedAnswers');
                          onChanged(updatedAnswers);
                        },
                      );
                    }),
                  ],
                );
              }),
            ],
          ),
      ],
    );
  }
}
