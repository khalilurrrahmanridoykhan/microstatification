import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class TimeQuestion extends StatefulWidget {
  final String xpath;
  final String label;
  final String kuid;
  final String?
  currentValue; // String? to handle null or formatted time (HH:mm)
  final ValueChanged<String?> onChanged;

  const TimeQuestion({
    super.key,
    required this.xpath,
    required this.label,
    required this.kuid,
    required this.currentValue,
    required this.onChanged,
  });

  @override
  State<TimeQuestion> createState() => _TimeQuestionState();
}

class _TimeQuestionState extends State<TimeQuestion> {
  TimeOfDay? _currentTime;

  @override
  void initState() {
    super.initState();
    _currentTime = _parseTime(widget.currentValue);
  }

  TimeOfDay? _parseTime(String? hhmm) {
    if (hhmm == null) return null;
    final parts = hhmm.split(':');
    if (parts.length != 2) return null;
    final h = int.tryParse(parts[0]);
    final m = int.tryParse(parts[1]);
    if (h == null || m == null) return null;
    return TimeOfDay(hour: h, minute: m);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(widget.label, style: const TextStyle(fontSize: 30)),
        const SizedBox(height: 20),
        ElevatedButton.icon(
          onPressed: () async {
            final picked = await showTimePicker(
              context: context,
              initialTime: _currentTime ?? TimeOfDay.now(),
            );
            if (picked != null) {
              setState(() {
                _currentTime = picked;
                print(_currentTime);
                final now = DateTime.now();
                final dateTime = DateTime(
                  now.year,
                  now.month,
                  now.day,
                  _currentTime!.hour,
                  _currentTime!.minute,
                );

                // Define the desired format
                final formatter = DateFormat('HH:mm:ss.SSS');
                final offset = DateTime.now().timeZoneOffset;
                final hours = offset.inHours.abs().toString().padLeft(2, '0');
                final minutes = (offset.inMinutes.abs() % 60)
                    .toString()
                    .padLeft(2, '0');
                final sign = offset.isNegative ? '-' : '+';
                final timezoneOffset = '$sign$hours:$minutes';
                final formatted =
                    '${formatter.format(dateTime)}$timezoneOffset';
                print(formatted);
                widget.onChanged(formatted);
              });
            }
          },
          icon: const Icon(Icons.access_time),
          label: const Text("Pick a Time"),
        ),
        const SizedBox(height: 15),
        Text(
          _currentTime != null
              ? 'Selected: ${_currentTime!.format(context)}'
              : 'No time selected',
        ),
      ],
    );
  }
}
