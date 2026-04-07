import 'package:flutter/material.dart';

class SelectOneQuestion extends StatelessWidget {
  final String label;
  final String xpath;
  final String kuid;
  final String? currentValue;
  final String defaultValue;
  final String readOnly;
  final ValueChanged<String?> onChanged;
  final List<dynamic> formChoices;
  final String listName;
  final bool Function() validationQuestion;
  final String appearance;
  final VoidCallback? next;
  final bool filterEnabled;
  final String? filterQuestionName;
  final Map<String, dynamic>? optionFilterMap;
  final List<dynamic>? filterOptionValues;
  final Map<String, dynamic> answers;

  const SelectOneQuestion({
    super.key,
    required this.appearance,
    required this.label,
    required this.xpath,
    required this.kuid,
    required this.currentValue,
    required this.defaultValue,
    required this.readOnly,
    required this.onChanged,
    required this.formChoices,
    required this.listName,
    required this.validationQuestion,
    this.next,
    this.filterEnabled = false,
    this.filterQuestionName,
    this.optionFilterMap,
    this.filterOptionValues,
    required this.answers,
  });

  @override
  Widget build(BuildContext context) {
    final isReadOnly = readOnly.toLowerCase() == "yes";

    // Filter options based on filterQuestionName's answer
    List<dynamic> filteredChoices = formChoices;
    if (filterEnabled &&
        filterQuestionName != null &&
        optionFilterMap != null) {
      final filterAnswer = answers[filterQuestionName];
      debugPrint('Filter answer for $filterQuestionName: $filterAnswer');
      if (filterAnswer != null && optionFilterMap!.containsKey(filterAnswer)) {
        final allowedOptionNames = optionFilterMap![filterAnswer] ?? [];
        filteredChoices =
            formChoices
                .where((choice) => allowedOptionNames.contains(choice['name']))
                .toList();
        debugPrint(
          'Filtered choices for $xpath: ${filteredChoices.map((c) => c['name']).toList()}',
        );
      } else {
        filteredChoices =
            []; // Show no options until parent question is answered
        debugPrint(
          'No valid filter answer for $filterQuestionName, hiding all options',
        );
      }
    } else if (filterEnabled &&
        filterQuestionName != null &&
        optionFilterMap == null) {
      debugPrint(
        'Warning: filterEnabled is true and filterQuestionName is provided, but optionFilterMap is null for $xpath. Showing all options.',
      );
    }

    // Validate currentValue against filtered choices
    String? effectiveValue = currentValue;
    if (filteredChoices.isNotEmpty &&
        currentValue != null &&
        !filteredChoices.any((c) => c['name'].toString() == currentValue)) {
      effectiveValue = null;
      WidgetsBinding.instance.addPostFrameCallback((_) => onChanged(null));
    } else if (currentValue == null || currentValue!.isEmpty) {
      effectiveValue = defaultValue.isNotEmpty ? defaultValue : null;
      if (effectiveValue != null &&
          filteredChoices.any(
            (choice) => choice['name'].toString() == effectiveValue,
          )) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          onChanged(effectiveValue);
          debugPrint('Applied default value for $xpath: $effectiveValue');
        });
      } else {
        effectiveValue = null;
      }
    } else if (filterEnabled &&
        filterQuestionName != null &&
        optionFilterMap != null &&
        currentValue != null) {
      // Ensure currentValue is valid for the current filter
      final filterAnswer = answers[filterQuestionName];
      if (filterAnswer != null) {
        final allowedOptions = optionFilterMap![filterAnswer] ?? [];
        if (!allowedOptions.contains(currentValue)) {
          effectiveValue = null;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            onChanged(null);
            debugPrint(
              'Cleared currentValue for $xpath: $currentValue due to invalid filter',
            );
          });
        }
      } else {
        effectiveValue = null;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          onChanged(null);
          debugPrint(
            'Cleared currentValue for $xpath: $currentValue because filterAnswer is null',
          );
        });
      }
    }

    return FormField<String>(
      validator: (value) {
        // Required
        if (validationQuestion() &&
            (answers[xpath] == null || answers[xpath].toString().isEmpty)) {
          return 'Please select an option';
        }

        // Filtered validation – use answers[xpath] (the source of truth), not `value`
        if (filterEnabled &&
            filterQuestionName != null &&
            optionFilterMap != null &&
            optionFilterMap!.isNotEmpty) {
          final filterAnswer = answers[filterQuestionName];
          final current = answers[xpath]; // <-- authoritative

          if (filterAnswer == null) {
            return 'Please select the parent question first';
          }

          final allowedOptions = List<String>.from(
            optionFilterMap![filterAnswer] ?? const [],
          );
          if (current != null &&
              current.toString().isNotEmpty &&
              !allowedOptions.contains(current)) {
            // Auto-clear invalid child selection to avoid sticky errors
            WidgetsBinding.instance.addPostFrameCallback(
              (_) => onChanged(null),
            );
            return 'Selected option is not valid for the chosen facility';
          }
        }

        return null;
      },
      builder: (field) {
        void handleChange(String? val) {
          if (!isReadOnly) {
            onChanged(val);
            field.didChange(val);
            if (appearance.startsWith("quick") && val != null) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                next?.call();
              });
            }
          }
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 18)),
            if (field.hasError)
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Text(
                  field.errorText ?? 'This can\'t be empty',
                  style: const TextStyle(color: Colors.red),
                ),
              ),
            const SizedBox(height: 10),
            if (filteredChoices.isEmpty)
              Text(
                filterEnabled
                    ? "Please select the parent question first"
                    : "No options available for this question",
                style: const TextStyle(color: Colors.grey),
              ),
            if (filteredChoices.isNotEmpty)
              if (appearance == "minimal")
                DropdownButtonFormField<String>(
                  isExpanded: true,
                  value: effectiveValue,
                  decoration: const InputDecoration(
                    isDense: true,
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    errorMaxLines: 3,
                  ),
                  items:
                      filteredChoices.map((choice) {
                        return DropdownMenuItem<String>(
                          value: choice['name'].toString(),
                          child: Text(
                            choice['label']?.toString() ?? 'Unnamed option',
                          ),
                        );
                      }).toList(),
                  onChanged: isReadOnly ? null : handleChange,
                )
              else if (appearance == "likert")
                Center(
                  child: Wrap(
                    spacing: 16.0,
                    runSpacing: 8.0,
                    alignment: WrapAlignment.center,
                    children:
                        filteredChoices.map((choice) {
                          final value = choice['name'].toString();
                          final isSelected = effectiveValue == value;

                          return Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Radio<String>(
                                value: value,
                                groupValue: effectiveValue,
                                onChanged: isReadOnly ? null : handleChange,
                              ),
                              Text(
                                choice['label']?.toString() ?? 'Unnamed option',
                                style: const TextStyle(fontSize: 14),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          );
                        }).toList(),
                  ),
                )
              else
                ...filteredChoices.map((choice) {
                  return RadioListTile<String>(
                    title: Text(
                      choice['label']?.toString() ?? 'Unnamed option',
                      //style: TextStyle(fontSize: 20),
                    ),
                    value: choice['name'].toString(),
                    groupValue: effectiveValue,
                    onChanged: isReadOnly ? null : handleChange,
                  );
                }),
          ],
        );
      },
    );
  }
}
