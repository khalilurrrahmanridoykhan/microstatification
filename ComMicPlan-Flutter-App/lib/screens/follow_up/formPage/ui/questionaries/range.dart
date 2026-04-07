import 'package:flutter/material.dart';

class RangeQuestion extends StatefulWidget {
  final String label;
  final String xpath;
  final String kuid;
  final int? currentValue; // int? for the selected value or null
  final ValueChanged<int?> onChanged;
  final String parameters; // Parameters string (e.g., "start=0;end=10;step=1")

  const RangeQuestion({
    super.key,
    required this.label,
    required this.xpath,
    required this.kuid,
    required this.currentValue,
    required this.onChanged,
    required this.parameters,
  });

  @override
  State<RangeQuestion> createState() => _RangeQuestionState();
}

class _RangeQuestionState extends State<RangeQuestion> {
  late int start;
  late int end;
  late int step;
  late int divisions;
  late int currentValue;

  @override
  void initState() {
    super.initState();
    // Parse parameters with default values
    start = 0;
    end = 10;
    step = 1;
    final params = widget.parameters.split(';');
    for (final param in params) {
      final parts = param.trim().split('=');
      if (parts.length == 2) {
        final key = parts[0].trim();
        final value = int.tryParse(parts[1].trim()) ?? 0;
        if (key == 'start') start = value;
        if (key == 'end') end = value;
        if (key == 'step') step = value;
      }
    }
    // Ensure end is not less than start and step is positive
    if (end < start) end = start;
    if (step <= 0) step = 1;
    // Calculate divisions, ensuring at least one division
    divisions = ((end - start) ~/ step).clamp(1, double.maxFinite.toInt());
    // Initialize currentValue, clamping to valid range
    currentValue = (widget.currentValue ?? start).clamp(start, end);
    debugPrint(
      'RangeQuestion init: start=$start, end=$end, step=$step, divisions=$divisions, currentValue=$currentValue',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: const TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 20),
        Slider(
          value: currentValue.toDouble(),
          min: start.toDouble(),
          max: end.toDouble(),
          divisions: divisions,
          label: currentValue.toString(),
          onChanged: (value) {
            setState(() {
              currentValue = value.round();
              widget.onChanged(currentValue);
              debugPrint('RangeQuestion onChanged: $currentValue');
            });
          },
        ),
        Center(
          child: Text(
            'Selected Value: $currentValue',
            style: const TextStyle(fontSize: 18),
          ),
        ),
      ],
    );
  }
}
