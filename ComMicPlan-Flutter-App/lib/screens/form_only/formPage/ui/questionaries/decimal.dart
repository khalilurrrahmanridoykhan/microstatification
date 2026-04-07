import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class DecimalQuestion extends StatelessWidget {
  final String label;
  final String xpath;
  final String kuid;
  final String? currentValue;
  final String defaultValue;
  final String readOnly; // "yes" or "no"
  final ValueChanged<String?> onChanged;
  final bool Function() validationQuestion;

  const DecimalQuestion({
    super.key,
    required this.label,
    required this.xpath,
    required this.kuid,
    this.currentValue,
    required this.defaultValue,
    required this.readOnly,
    required this.onChanged,
    required this.validationQuestion,
  });

  @override
  Widget build(BuildContext context) {
    final isReadOnly = readOnly.toLowerCase() == "yes";
    final hasDefaultValue = defaultValue.isNotEmpty;

    // Determine initial text (currentValue > defaultValue)
    final initialText =
        (currentValue != null && currentValue!.isNotEmpty)
            ? currentValue!
            : defaultValue;

    // If read-only with default and no currentValue, store it
    if (isReadOnly && currentValue == null && hasDefaultValue) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        onChanged(defaultValue);
      });
    }

    final controller = TextEditingController(text: initialText)
      ..selection = TextSelection.collapsed(offset: initialText.length);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 18)),
        const SizedBox(height: 20),
        TextFormField(
          key: ValueKey('decimal-$isReadOnly-$hasDefaultValue'),
          controller: controller,
          readOnly: isReadOnly,
          onChanged:
              isReadOnly
                  ? null
                  : (value) {
                    if (value.isEmpty) {
                      onChanged(null);
                    } else {
                      final parsed = double.tryParse(value);
                      if (parsed != null) {
                        onChanged(value);
                      }
                    }
                  },
          keyboardType: const TextInputType.numberWithOptions(
            decimal: true,
            signed: true,
          ),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[0-9.-]')),
            FilteringTextInputFormatter.deny(
              RegExp(r'\.\.+'),
            ), // Prevent multiple dots
            FilteringTextInputFormatter.deny(
              RegExp(r'--*'),
            ), // Prevent multiple negatives
            FilteringTextInputFormatter.deny(
              RegExp(r'^-?\d*\.\d*\.+'),
            ), // Prevent extra dots
            FilteringTextInputFormatter.deny(
              RegExp(r'^-?\d*\.?\d*[^0-9.-]'),
            ), // Deny invalid chars
          ],
          decoration: const InputDecoration(
            isDense: true,
            border: OutlineInputBorder(),
            hintText: 'Enter a decimal number (e.g., 3.14)',
            errorMaxLines: 3,
          ),
          validator: (value) {
            if (validationQuestion() && (value == null || value.isEmpty)) {
              return 'This field is required';
            }
            if (value != null &&
                value.isNotEmpty &&
                double.tryParse(value) == null) {
              return 'Please enter a valid decimal';
            }
            return null;
          },
        ),
      ],
    );
  }
}
