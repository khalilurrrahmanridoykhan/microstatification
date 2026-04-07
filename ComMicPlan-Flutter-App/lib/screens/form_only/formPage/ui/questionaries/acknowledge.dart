import 'package:flutter/material.dart';

class AcknowledgeQuestion extends StatelessWidget {
  final String label;
  final String xpath;
  final String kuid;
  final bool? currentValue; // Keep bool? as per your current code
  final ValueChanged<bool?> onChanged;
  final String hint;

  const AcknowledgeQuestion({
    super.key,
    required this.label,
    required this.xpath,
    required this.kuid,
    required this.currentValue,
    required this.onChanged,
    required this.hint,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 30)),
        const SizedBox(height: 10),
        if (hint.isNotEmpty) Text(hint),
        const SizedBox(height: 20),
        CheckboxListTile(
          title: const Text('Ok, please continue'),
          value: currentValue ?? false, // Default to false if null
          onChanged: onChanged,
          controlAffinity: ListTileControlAffinity.leading,
        ),
      ],
    );
  }
}
