import 'package:flutter/material.dart';

class TextQuestion extends StatefulWidget {
  final String label;
  final String xpath;
  final String kuid;
  final String? currentValue;
  final String defaultValue;
  final String readOnly; // "yes" or "no"
  final ValueChanged<String?> onChanged;
  final bool Function() validationQuestion;
  final String appearance;
  final String constraint;
  final String constraintMessage;

  const TextQuestion({
    super.key,
    required this.label,
    required this.xpath,
    required this.kuid,
    required this.currentValue,
    required this.defaultValue,
    required this.readOnly,
    required this.onChanged,
    required this.validationQuestion,
    required this.appearance,
    required this.constraint,
    required this.constraintMessage,
  });

  @override
  State<TextQuestion> createState() => _TextQuestionState();
}

class _TextQuestionState extends State<TextQuestion> {
  late TextEditingController controller;
  late FocusNode focusNode;
  String? lastNotifiedValue;

  @override
  void initState() {
    super.initState();
    // Initialize controller with initial text
    final initialText =
        (widget.currentValue != null && widget.currentValue!.isNotEmpty)
            ? widget.currentValue!
            : widget.defaultValue;
    controller = TextEditingController(text: initialText);
    focusNode = FocusNode();

    // Set cursor to end of text
    controller.selection = TextSelection.collapsed(
      offset: controller.text.length,
    );

    // Apply default value for read-only fields
    if (widget.readOnly.toLowerCase() == "yes" &&
        widget.currentValue == null &&
        widget.defaultValue.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onChanged(widget.defaultValue);
      });
    }
  }

  @override
  void didUpdateWidget(covariant TextQuestion oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Update controller text if currentValue or defaultValue changes
    final newText =
        (widget.currentValue != null && widget.currentValue!.isNotEmpty)
            ? widget.currentValue!
            : widget.defaultValue;
    if (controller.text != newText) {
      controller.text = newText;
      controller.selection = TextSelection.collapsed(
        offset: controller.text.length,
      );
    }
  }

  @override
  void dispose() {
    controller.dispose();
    focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isReadOnly = widget.readOnly.toLowerCase() == "yes";
    final hasDefaultValue = widget.defaultValue.isNotEmpty;

    final isMultiline =
        (isReadOnly && hasDefaultValue) || widget.appearance == "multiline";
    final isNumber =
        widget.appearance == "numbers" && !(isReadOnly && hasDefaultValue);

    final keyboardType =
        isNumber
            ? TextInputType.number
            : isMultiline
            ? TextInputType.multiline
            : TextInputType.text;

    // Extract regex pattern from constraint
    RegExp? regex;
    String? customErrorMessage;
    if (widget.constraint.isNotEmpty &&
        widget.constraint.startsWith('regex(')) {
      try {
        final patternMatch = RegExp(r"'([^']*)'").firstMatch(widget.constraint);
        if (patternMatch != null) {
          String pattern = patternMatch.group(1)!;
          regex = RegExp(pattern);
          customErrorMessage =
              widget.constraintMessage.isNotEmpty
                  ? widget.constraintMessage
                  : 'Input does not match the required format.';
        }
      } catch (e) {
        debugPrint('Invalid regex pattern: ${widget.constraint}');
      }
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        if (focusNode.hasFocus) {
          focusNode.unfocus();
        }
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.label, style: const TextStyle(fontSize: 18)),
          const SizedBox(height: 20),
          TextFormField(
            key: ValueKey('${widget.appearance}-$isReadOnly-$hasDefaultValue'),
            controller: controller,
            focusNode: focusNode,
            onChanged:
                isReadOnly
                    ? null
                    : (value) {
                      // Only notify if the value has changed to avoid infinite loops
                      if (value != lastNotifiedValue) {
                        widget.onChanged(value.isEmpty ? null : value);
                        lastNotifiedValue = value;
                      }
                    },
            readOnly: isReadOnly,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              isDense: true,
              contentPadding: EdgeInsets.symmetric(
                vertical: 8.0, // Reduced vertical padding
                horizontal: 12.0, // Horizontal padding for aesthetics
              ),
              errorMaxLines: 3,
            ),
            validator: (value) {
              if (widget.validationQuestion() &&
                  (value == null || value.isEmpty)) {
                return 'This field is required';
              }
              if (regex != null && value != null && !regex.hasMatch(value)) {
                return customErrorMessage;
              }
              return null;
            },

            keyboardType: keyboardType,
            maxLines: isMultiline ? null : 1,
            textInputAction:
                isMultiline ? TextInputAction.newline : TextInputAction.done,
            onFieldSubmitted: (_) {
              focusNode.unfocus();
            },
          ),
        ],
      ),
    );
  }
}
