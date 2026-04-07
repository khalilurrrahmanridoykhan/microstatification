import 'package:flutter/material.dart';

class DatetimeQuestion extends StatefulWidget {
  final String label;
  final String xpath;
  final String kuid;
  final String? currentValue; // Current value (ISO 8601 string)
  final String? defaultValue; // Optional default value
  final ValueChanged<String?> onChanged;
  final bool readOnly; // Disable picking if true

  const DatetimeQuestion({
    super.key,
    required this.label,
    required this.xpath,
    required this.kuid,
    this.currentValue,
    this.defaultValue,
    required this.onChanged,
    this.readOnly = false,
  });

  @override
  State<DatetimeQuestion> createState() => _DatetimeQuestionState();
}

class _DatetimeQuestionState extends State<DatetimeQuestion> {
  DateTime? _dateTime;

  @override
  void initState() {
    super.initState();
    _initializeDateTime();
    // If read-only with default value, trigger onChanged immediately
    if (widget.readOnly && _dateTime != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onChanged(_dateTime!.toIso8601String());
      });
    }
  }

  void _initializeDateTime() {
    String? valueToUse = widget.currentValue ?? widget.defaultValue;
    _dateTime = valueToUse != null ? DateTime.tryParse(valueToUse) : null;
  }

  TimeOfDay parseTimeOfDay(String time) {
    try {
      final parts = time.split(":");
      final hour = int.parse(parts[0]);
      final minute = int.parse(parts[1]);
      return TimeOfDay(hour: hour, minute: minute);
    } catch (_) {
      return TimeOfDay.now();
    }
  }

  Future<void> _pickDate(BuildContext context) async {
    if (widget.readOnly) return;

    final pickedDate = await showDatePicker(
      context: context,
      initialDate: _dateTime ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (pickedDate != null) {
      final existingTime =
          _dateTime?.toLocal().toIso8601String().split('T')[1] ??
          TimeOfDay.now().format(context);
      final time = parseTimeOfDay(existingTime);
      setState(() {
        _dateTime = DateTime(
          pickedDate.year,
          pickedDate.month,
          pickedDate.day,
          time.hour,
          time.minute,
        );
        widget.onChanged(_dateTime!.toIso8601String());
      });
    }
  }

  Future<void> _pickTime(BuildContext context) async {
    if (widget.readOnly) return;

    final pickedTime = await showTimePicker(
      context: context,
      initialTime:
          _dateTime != null
              ? TimeOfDay.fromDateTime(_dateTime!)
              : TimeOfDay.now(),
    );
    if (pickedTime != null) {
      final currentDate = _dateTime ?? DateTime.now();
      setState(() {
        _dateTime = DateTime(
          currentDate.year,
          currentDate.month,
          currentDate.day,
          pickedTime.hour,
          pickedTime.minute,
        );
        widget.onChanged(_dateTime!.toIso8601String());
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Re-initialize if currentValue changed externally
    if (_dateTime?.toIso8601String() != widget.currentValue) {
      _initializeDateTime();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(widget.label, style: const TextStyle(fontSize: 30)),
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton.icon(
              onPressed: widget.readOnly ? null : () => _pickDate(context),
              icon: const Icon(Icons.calendar_month),
              label: const Text("Pick Date"),
            ),
            const SizedBox(width: 20),
            ElevatedButton.icon(
              onPressed: widget.readOnly ? null : () => _pickTime(context),
              icon: const Icon(Icons.access_time),
              label: const Text("Pick Time"),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Text(
          _dateTime != null
              ? 'Selected: ${_dateTime!.toLocal()}'
              : 'No date & time selected',
          style: const TextStyle(fontSize: 16),
        ),
      ],
    );
  }
}
