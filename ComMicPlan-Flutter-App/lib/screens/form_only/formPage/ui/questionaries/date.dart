import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class DateQuestion extends StatefulWidget {
  final String label;
  final String xpath;
  final String kuid;
  final String? currentValue;
  final String? defaultValue; // optional default value
  final ValueChanged<String?> onChanged;
  final bool Function() validationQuestion;
  final String appearance;
  final bool readOnly; // read-only option

  const DateQuestion({
    super.key,
    required this.label,
    required this.xpath,
    required this.kuid,
    this.currentValue,
    this.defaultValue,
    required this.onChanged,
    required this.validationQuestion,
    this.appearance = '',
    this.readOnly = false,
  });

  @override
  State<DateQuestion> createState() => _DateQuestionState();
}

class _DateQuestionState extends State<DateQuestion> {
  DateTime? _currentDate;

  @override
  void initState() {
    super.initState();
    _initializeCurrentDate();
    // If read-only with default/current, propagate the value once.
    if (widget.readOnly && _currentDate != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onChanged(_formatValue(_currentDate));
      });
    }
  }

  @override
  void didUpdateWidget(covariant DateQuestion oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Recompute current date if upstream value/default changed
    final old = oldWidget.currentValue ?? oldWidget.defaultValue;
    final now = widget.currentValue ?? widget.defaultValue;
    if (old != now) {
      _initializeCurrentDate();
    }
  }

  void _initializeCurrentDate() {
    final valueToUse = widget.currentValue ?? widget.defaultValue;
    if (valueToUse == null) {
      _currentDate = null;
      return;
    }

    if (widget.appearance == 'year') {
      final year = int.tryParse(valueToUse);
      _currentDate = year != null ? DateTime(year, 1, 1) : null;
    } else if (widget.appearance == 'month-year') {
      final parts = valueToUse.split('-');
      if (parts.length == 2) {
        final year = int.tryParse(parts[0]);
        final month = int.tryParse(parts[1]);
        _currentDate =
            (year != null && month != null) ? DateTime(year, month, 1) : null;
      } else {
        _currentDate = null;
      }
    } else {
      _currentDate = DateTime.tryParse(valueToUse);
    }
  }

  String _formatDisplayText() {
    if (_currentDate == null) return 'No date selected';
    if (widget.appearance == 'month-year') {
      return DateFormat('MMMM yyyy').format(_currentDate!);
    } else if (widget.appearance == 'year') {
      return _currentDate!.year.toString();
    } else {
      return _currentDate!.toLocal().toString().split(' ').first;
    }
  }

  String? _formatValue(DateTime? date) {
    if (date == null) return null;
    if (widget.appearance == 'month-year') {
      return DateFormat('yyyy-MM').format(date);
    } else if (widget.appearance == 'year') {
      return date.year.toString();
    } else {
      return date.toIso8601String().split('T').first;
    }
  }

  Future<void> _showMonthYearPicker(BuildContext context) async {
    final now = DateTime.now();
    int selectedYear = _currentDate?.year ?? now.year;
    int selectedMonth = _currentDate?.month ?? now.month;

    if (widget.readOnly) return;

    final result = await showDialog<Map<String, int>>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(widget.label),
          content: StatefulBuilder(
            builder: (context, setState) {
              return SizedBox(
                width: double.maxFinite,
                height: 200,
                child: Row(
                  children: [
                    Expanded(
                      child: ListWheelScrollView.useDelegate(
                        itemExtent: 40,
                        perspective: 0.005,
                        diameterRatio: 1.5,
                        physics: const FixedExtentScrollPhysics(),
                        controller: FixedExtentScrollController(
                          initialItem: selectedYear - 2000,
                        ),
                        onSelectedItemChanged: (index) {
                          setState(() => selectedYear = 2000 + index);
                        },
                        childDelegate: ListWheelChildBuilderDelegate(
                          builder: (context, index) {
                            final year = 2000 + index;
                            return Center(
                              child: Text(
                                year.toString(),
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight:
                                      year == selectedYear
                                          ? FontWeight.bold
                                          : FontWeight.normal,
                                  color:
                                      year == selectedYear
                                          ? Colors.blue[700]
                                          : Colors.black,
                                ),
                              ),
                            );
                          },
                          childCount: 101,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ListWheelScrollView.useDelegate(
                        itemExtent: 40,
                        perspective: 0.005,
                        diameterRatio: 1.5,
                        physics: const FixedExtentScrollPhysics(),
                        controller: FixedExtentScrollController(
                          initialItem: selectedMonth - 1,
                        ),
                        onSelectedItemChanged: (index) {
                          setState(() => selectedMonth = index + 1);
                        },
                        childDelegate: ListWheelChildBuilderDelegate(
                          builder: (context, index) {
                            final month = index + 1;
                            return Center(
                              child: Text(
                                DateFormat('MMMM').format(DateTime(0, month)),
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight:
                                      month == selectedMonth
                                          ? FontWeight.bold
                                          : FontWeight.normal,
                                  color:
                                      month == selectedMonth
                                          ? Colors.blue[700]
                                          : Colors.black,
                                ),
                              ),
                            );
                          },
                          childCount: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(
                  context,
                ).pop({'year': selectedYear, 'month': selectedMonth});
              },
              child: const Text('OK'),
            ),
          ],
        );
      },
    );

    if (result != null) {
      setState(() {
        _currentDate = DateTime(result['year']!, result['month']!, 1);
      });
      // Propagate up & update FormField value (validator uses field.value)
      widget.onChanged(_formatValue(_currentDate));
    }
  }

  Future<void> _showYearPicker(BuildContext context) async {
    int selectedYear = _currentDate?.year ?? DateTime.now().year;
    if (widget.readOnly) return;

    final result = await showDialog<int>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(widget.label),
          content: SizedBox(
            width: double.maxFinite,
            height: 200,
            child: ListWheelScrollView.useDelegate(
              itemExtent: 40,
              perspective: 0.005,
              diameterRatio: 1.5,
              physics: const FixedExtentScrollPhysics(),
              controller: FixedExtentScrollController(
                initialItem: selectedYear - 2000,
              ),
              onSelectedItemChanged: (index) {
                selectedYear = 2000 + index;
              },
              childDelegate: ListWheelChildBuilderDelegate(
                builder: (context, index) {
                  final year = 2000 + index;
                  return Center(
                    child: Text(
                      year.toString(),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight:
                            year == selectedYear
                                ? FontWeight.bold
                                : FontWeight.normal,
                        color:
                            year == selectedYear
                                ? Colors.blue[700]
                                : Colors.black,
                      ),
                    ),
                  );
                },
                childCount: 101,
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(selectedYear),
              child: const Text('OK'),
            ),
          ],
        );
      },
    );

    if (result != null) {
      setState(() {
        _currentDate = DateTime(result, 1, 1);
      });
      widget.onChanged(_formatValue(_currentDate));
    }
  }

  @override
  Widget build(BuildContext context) {
    // Keep the displayed date in sync with currentValue/default
    final upstream = widget.currentValue ?? widget.defaultValue;
    if (_formatValue(_currentDate) != upstream) {
      _initializeCurrentDate();
    }

    return FormField<String>(
      initialValue: upstream,
      // IMPORTANT: only show error when parent calls FormState.validate() (e.g., on Next)
      autovalidateMode: AutovalidateMode.disabled,
      validator: (value) {
        // Use field.value (passed as `value`) — NOT widget.currentValue
        if (widget.validationQuestion() && (value == null || value.isEmpty)) {
          return 'Please select a date';
        }
        return null;
      },
      builder: (field) {
        // DO NOT call field.validate() here (that would show error immediately)
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.label, style: const TextStyle(fontSize: 18)),
            if (field.hasError)
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Text(
                  field.errorText ?? 'This field is required',
                  style: const TextStyle(color: Colors.red),
                ),
              ),
            const SizedBox(height: 10),
            Center(
              child: ElevatedButton.icon(
                onPressed:
                    widget.readOnly
                        ? null
                        : () async {
                          if (widget.appearance == 'month-year') {
                            await _showMonthYearPicker(context);
                          } else if (widget.appearance == 'year') {
                            await _showYearPicker(context);
                          } else {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: _currentDate ?? DateTime.now(),
                              firstDate: DateTime(2000),
                              lastDate: DateTime(2100),
                            );
                            if (picked != null) {
                              setState(() => _currentDate = picked);
                              widget.onChanged(_formatValue(_currentDate));
                            }
                          }
                          // Update the FormField value so validator sees the change
                          field.didChange(_formatValue(_currentDate));
                        },
                icon: const Icon(Icons.calendar_today),
                label: const Text("Pick a Date"),
              ),
            ),
            const SizedBox(height: 10),
            Center(
              child: Text(
                _formatDisplayText(),
                style: const TextStyle(fontSize: 16),
              ),
            ),
          ],
        );
      },
    );
  }
}
