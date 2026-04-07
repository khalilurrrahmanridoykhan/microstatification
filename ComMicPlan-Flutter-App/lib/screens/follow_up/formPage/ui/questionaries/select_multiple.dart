import 'package:flutter/material.dart';

class SelectMultipleQuestion extends StatelessWidget {
  final String label;
  final String xpath;
  final String kuid;
  final List<String>? currentValue;
  final ValueChanged<List<String>?> onChanged;
  final List<dynamic> formChoices;
  final String listName;
  final bool Function() validationQuestion;
  final String appearance;
  final VoidCallback? next;
  final String defaultValue;
  final String readOnly;
  final bool filterEnabled; // New
  final String? filterQuestionId; // New
  final Map<String, dynamic>? optionFilterMap; // New
  final List<dynamic>? filterOptionValues; // New
  final Map<String, dynamic> answers; // New

  const SelectMultipleQuestion({
    super.key,
    required this.appearance,
    required this.label,
    required this.xpath,
    required this.kuid,
    required this.currentValue,
    required this.onChanged,
    required this.formChoices,
    required this.listName,
    required this.validationQuestion,
    required this.defaultValue,
    required this.readOnly,
    this.next,
    this.filterEnabled = false,
    this.filterQuestionId,
    this.optionFilterMap,
    this.filterOptionValues,
    required this.answers,
  });

  @override
  Widget build(BuildContext context) {
    final isReadOnly = readOnly.toLowerCase() == "yes";

    // Filter options based on filterQuestionId's answer
    List<dynamic> filteredChoices = formChoices;
    if (filterEnabled && filterQuestionId != null && optionFilterMap != null) {
      final filterAnswer = answers[filterQuestionId];
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
        filteredChoices = [];
        debugPrint(
          'No filter answer for $filterQuestionId, showing no options',
        );
      }
    }

    // Convert defaultValue string into List<String>
    final List<String> defaultSelected =
        defaultValue.isNotEmpty ? defaultValue.split(' ') : [];

    // Filter currentValue to only include valid options
    List<String> initialSelected =
        (currentValue != null && currentValue!.isNotEmpty)
            ? currentValue!
            : defaultSelected;
    if (filteredChoices.isNotEmpty) {
      initialSelected =
          initialSelected
              .where(
                (val) => filteredChoices.any(
                  (choice) => choice['name'].toString() == val,
                ),
              )
              .toList();
      if (initialSelected != currentValue) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          onChanged(initialSelected.isEmpty ? null : initialSelected);
          debugPrint('Filtered currentValue for $xpath: $initialSelected');
        });
      }
    } else if (currentValue != null && currentValue!.isNotEmpty) {
      initialSelected = [];
      WidgetsBinding.instance.addPostFrameCallback((_) {
        onChanged(null);
        debugPrint('Cleared currentValue for $xpath due to no valid options');
      });
    }

    return FormField<List<String>>(
      initialValue: initialSelected,
      validator: (value) {
        if (validationQuestion() && (value == null || value.isEmpty)) {
          return 'Please select at least one option';
        }
        if (filterEnabled && filterQuestionId != null && value != null) {
          final filterAnswer = answers[filterQuestionId];
          if (filterAnswer != null) {
            final allowedOptions = optionFilterMap?[filterAnswer] ?? [];
            if (value.any((val) => !allowedOptions.contains(val))) {
              return 'One or more selected options are not valid for the current filter';
            }
          }
        }
        return null;
      },
      builder: (field) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          field.validate();
        });

        final selectedValues = field.value ?? [];

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 30)),
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
              GestureDetector(
                onTap:
                    isReadOnly
                        ? null
                        : () {
                          showDialog(
                            context: context,
                            builder: (context) {
                              final dialogSelectedValues = List<String>.from(
                                selectedValues,
                              );

                              return StatefulBuilder(
                                builder: (context, setState) {
                                  return AlertDialog(
                                    title: Text(label),
                                    content: SizedBox(
                                      width: double.maxFinite,
                                      child: ListView(
                                        shrinkWrap: true,
                                        children:
                                            filteredChoices.map((choice) {
                                              final value =
                                                  choice['name'].toString();
                                              final isSelected =
                                                  dialogSelectedValues.contains(
                                                    value,
                                                  );

                                              return CheckboxListTile(
                                                title: Text(
                                                  choice['label']?.toString() ??
                                                      'Unnamed option',
                                                ),
                                                value: isSelected,
                                                onChanged:
                                                    isReadOnly
                                                        ? null
                                                        : (val) {
                                                          setState(() {
                                                            if (val == true &&
                                                                !dialogSelectedValues
                                                                    .contains(
                                                                      value,
                                                                    )) {
                                                              dialogSelectedValues
                                                                  .add(value);
                                                            } else if (val ==
                                                                    false &&
                                                                dialogSelectedValues
                                                                    .contains(
                                                                      value,
                                                                    )) {
                                                              dialogSelectedValues
                                                                  .remove(
                                                                    value,
                                                                  );
                                                            }
                                                          });
                                                        },
                                              );
                                            }).toList(),
                                      ),
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () {
                                          Navigator.of(context).pop();
                                        },
                                        child: const Text('Cancel'),
                                      ),
                                      TextButton(
                                        onPressed: () {
                                          onChanged(
                                            dialogSelectedValues.isEmpty
                                                ? null
                                                : dialogSelectedValues,
                                          );
                                          field.didChange(dialogSelectedValues);
                                          Navigator.of(context).pop();

                                          if (appearance == "quick" &&
                                              dialogSelectedValues.isNotEmpty) {
                                            WidgetsBinding.instance
                                                .addPostFrameCallback((_) {
                                                  next?.call();
                                                });
                                          }
                                        },
                                        child: const Text('OK'),
                                      ),
                                    ],
                                  );
                                },
                              );
                            },
                          );
                        },
                child: InputDecorator(
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    errorMaxLines: 3,
                  ),
                  child: Text(
                    selectedValues.isEmpty
                        ? 'Select options'
                        : selectedValues
                            .map(
                              (val) =>
                                  filteredChoices
                                      .firstWhere(
                                        (choice) =>
                                            choice['name'].toString() == val,
                                        orElse:
                                            () => {'label': 'Unnamed option'},
                                      )['label']
                                      ?.toString() ??
                                  'Unnamed option',
                            )
                            .join(', '),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
