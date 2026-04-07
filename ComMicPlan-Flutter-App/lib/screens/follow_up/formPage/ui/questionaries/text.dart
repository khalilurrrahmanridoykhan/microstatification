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
  late final TextEditingController controller;
  late final FocusNode focusNode;
  String? lastNotifiedValue;

  bool get isReadOnly => widget.readOnly.toLowerCase() == 'yes';

  @override
  void initState() {
    super.initState();

    // Initial text: prefer currentValue, else default
    final initialText =
        (widget.currentValue != null && widget.currentValue!.isNotEmpty)
            ? widget.currentValue!
            : widget.defaultValue;

    controller = TextEditingController(text: initialText);
    focusNode = FocusNode();

    // Keep cursor at the end (only relevant if editable later)
    controller.selection = TextSelection.collapsed(
      offset: controller.text.length,
    );

    // Record last notified to avoid duplicate callbacks
    lastNotifiedValue = controller.text;

    // If read-only, auto-propagate value AFTER the first frame so we don't
    // notify during build or trigger Form rebuild assertions.
    if (isReadOnly) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final v = controller.text;
        if (v != lastNotifiedValue) {
          widget.onChanged(v.isEmpty ? null : v);
          lastNotifiedValue = v;
        } else {
          // Still ensure parent gets the value at least once
          widget.onChanged(v.isEmpty ? null : v);
        }
      });
    }
  }

  @override
  void didUpdateWidget(covariant TextQuestion oldWidget) {
    super.didUpdateWidget(oldWidget);

    // Compute the next text (prefer currentValue, else default)
    final newText =
        (widget.currentValue != null && widget.currentValue!.isNotEmpty)
            ? widget.currentValue!
            : widget.defaultValue;

    // Only update if changed; defer to post-frame to avoid "setState during build"
    if (controller.text != newText) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        controller.text = newText;
        controller.selection = TextSelection.collapsed(
          offset: controller.text.length,
        );

        if (isReadOnly) {
          // Auto-propagate for read-only so parent always has the latest
          if (newText != lastNotifiedValue) {
            widget.onChanged(newText.isEmpty ? null : newText);
            lastNotifiedValue = newText;
          }
        }
      });
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
    final hasDefaultValue = widget.defaultValue.isNotEmpty;

    final isMultiline =
        (isReadOnly && hasDefaultValue) || widget.appearance == "multiline";
    final isNumber =
        widget.appearance == "numbers" && !(isReadOnly && hasDefaultValue);

    final keyboardType =
        isNumber
            ? TextInputType.number
            : (isMultiline ? TextInputType.multiline : TextInputType.text);

    // Extract regex pattern from constraint if provided: regex('^...$')
    RegExp? regex;
    String? customErrorMessage;
    if (widget.constraint.isNotEmpty &&
        widget.constraint.startsWith('regex(')) {
      try {
        final patternMatch = RegExp(r"'([^']*)'").firstMatch(widget.constraint);
        if (patternMatch != null) {
          final pattern = patternMatch.group(1)!;
          regex = RegExp(pattern);
          customErrorMessage =
              widget.constraintMessage.isNotEmpty
                  ? widget.constraintMessage
                  : 'Input does not match the required format.';
        }
      } catch (_) {
        // ignore invalid regex, just don't apply it
      }
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        if (focusNode.hasFocus) focusNode.unfocus();
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.label, style: const TextStyle(fontSize: 30)),
          const SizedBox(height: 20),
          TextFormField(
            key: ValueKey(
              'text-${widget.xpath}-$isReadOnly-$hasDefaultValue-${widget.appearance}',
            ),
            controller: controller,
            focusNode: focusNode,

            // If read-only, do not allow edits and do not emit onChanged from UI typing
            readOnly: isReadOnly,
            enabled:
                !isReadOnly, // disables focus, keyboard & validation visuals

            decoration: InputDecoration(
              border: const OutlineInputBorder(),
              // visually indicate lock
              suffixIcon: isReadOnly ? const Icon(Icons.lock) : null,
              filled: isReadOnly,
              errorMaxLines: 3,
            ),

            // Validator: skip for read-only; otherwise enforce required & regex
            validator: (value) {
              if (isReadOnly)
                return null; // never block "Next" for display-only
              if (widget.validationQuestion() &&
                  (value == null || value.trim().isEmpty)) {
                return 'This field is required';
              }
              if (regex != null &&
                  value != null &&
                  value.isNotEmpty &&
                  !regex.hasMatch(value)) {
                return customErrorMessage;
              }
              return null;
            },

            onChanged:
                isReadOnly
                    ? null
                    : (value) {
                      if (value != lastNotifiedValue) {
                        final nv = value.trim().isEmpty ? null : value;
                        widget.onChanged(nv);
                        lastNotifiedValue = value;
                      }
                    },

            keyboardType: keyboardType,
            maxLines: isMultiline ? null : 1,
            textInputAction:
                isMultiline ? TextInputAction.newline : TextInputAction.done,
            onFieldSubmitted: (_) => focusNode.unfocus(),
          ),
        ],
      ),
    );
  }
}
