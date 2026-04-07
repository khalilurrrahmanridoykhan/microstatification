import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class IntegerQuestion extends StatefulWidget {
  final String label;
  final String xpath;
  final String kuid;
  final String? currentValue;
  final String defaultValue;
  final String readOnly; // "yes" or "no"
  final ValueChanged<String?> onChanged;
  final bool Function() validationQuestion;

  // NEW: regex support (same as TextQuestion)
  final String constraint; // e.g. "regex('^\\d{10}\$')"
  final String constraintMessage; // e.g. "Must be 10 digits"

  const IntegerQuestion({
    super.key,
    required this.label,
    required this.xpath,
    required this.kuid,
    required this.currentValue,
    required this.defaultValue,
    required this.readOnly,
    required this.onChanged,
    required this.validationQuestion,
    this.constraint = '', // <- defaults keep old calls working
    this.constraintMessage = '',
  });

  @override
  State<IntegerQuestion> createState() => _IntegerQuestionState();
}

class _IntegerQuestionState extends State<IntegerQuestion> {
  late final TextEditingController _controller;
  late final FocusNode _focusNode;

  bool get isReadOnly => widget.readOnly.toLowerCase() == "yes";
  bool get hasDefaultValue => widget.defaultValue.isNotEmpty;

  // NEW: parsed regex + message
  RegExp? _regex;
  String? _customErrorMessage;

  @override
  void initState() {
    super.initState();

    // Determine initial text
    final initialText =
        (widget.currentValue != null && widget.currentValue!.isNotEmpty)
            ? widget.currentValue!
            : widget.defaultValue;

    _controller = TextEditingController(text: initialText);
    _focusNode = FocusNode()..addListener(_handleFocusChange);

    // parse constraint once
    _parseConstraint();

    // Auto-save default value if read-only and no currentValue
    if (isReadOnly && widget.currentValue == null && hasDefaultValue) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onChanged(widget.defaultValue);
      });
    }
  }

  @override
  void didUpdateWidget(covariant IntegerQuestion oldWidget) {
    super.didUpdateWidget(oldWidget);

    // keep controller in sync if value changed upstream
    final newText =
        (widget.currentValue != null && widget.currentValue!.isNotEmpty)
            ? widget.currentValue!
            : widget.defaultValue;
    if (_controller.text != newText) {
      _controller.text = newText;
      _controller.selection = TextSelection.collapsed(
        offset: _controller.text.length,
      );
    }

    // re-parse constraint if it changed
    if (oldWidget.constraint != widget.constraint ||
        oldWidget.constraintMessage != widget.constraintMessage) {
      _parseConstraint();
    }
  }

  void _parseConstraint() {
    _regex = null;
    _customErrorMessage = null;

    if (widget.constraint.isNotEmpty &&
        widget.constraint.startsWith('regex(')) {
      try {
        final match = RegExp(r"'([^']*)'").firstMatch(widget.constraint);
        if (match != null) {
          final pattern = match.group(1)!;
          _regex = RegExp(pattern);
          _customErrorMessage =
              widget.constraintMessage.isNotEmpty
                  ? widget.constraintMessage
                  : 'Input does not match the required format.';
        }
      } catch (e) {
        debugPrint('Invalid regex pattern: ${widget.constraint}');
      }
    }
  }

  void _handleFocusChange() {
    if (!_focusNode.hasFocus && !isReadOnly) {
      final value = _controller.text;
      widget.onChanged(
        value.isEmpty ? null : BigInt.tryParse(value)?.toString(),
      );
    }
  }

  void _handleSubmit(String value) {
    if (!isReadOnly) {
      widget.onChanged(
        value.isEmpty ? null : BigInt.tryParse(value)?.toString(),
      );
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_handleFocusChange);
    _focusNode.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // NOTE: digitsOnly means only 0-9 will be allowed. If you need negatives,
    // remove digitsOnly and handle via regex/validator instead.
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label, style: const TextStyle(fontSize: 18)),
        const SizedBox(height: 20),
        TextFormField(
          controller: _controller,
          focusNode: _focusNode,
          readOnly: isReadOnly,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          textInputAction: TextInputAction.done,
          onFieldSubmitted: _handleSubmit,
          onChanged: (value) {
            if (!isReadOnly) {
              widget.onChanged(
                value.isEmpty ? null : BigInt.tryParse(value)?.toString(),
              );
            }
          },
          onEditingComplete: () {
            _handleSubmit(_controller.text);
            _focusNode.unfocus();
          },
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
            isDense: true,
            contentPadding: EdgeInsets.symmetric(
              vertical: 8.0,
              horizontal: 12.0,
            ),
            errorMaxLines: 3,
          ),
          validator: (value) {
            // Required check
            if (widget.validationQuestion() &&
                (value == null || value.isEmpty)) {
              return 'This field is required';
            }

            // Integer check (only when not empty)
            if (value != null &&
                value.isNotEmpty &&
                BigInt.tryParse(value) == null) {
              return 'Please enter a valid integer';
            }

            // Regex check (like TextQuestion)
            if (_regex != null &&
                value != null &&
                value.isNotEmpty &&
                !_regex!.hasMatch(value)) {
              return _customErrorMessage ??
                  'Input does not match the required format.';
            }

            return null;
          },
        ),
      ],
    );
  }
}
