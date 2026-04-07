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
  });

  @override
  State<IntegerQuestion> createState() => _IntegerQuestionState();
}

class _IntegerQuestionState extends State<IntegerQuestion> {
  late final TextEditingController _controller;
  late final FocusNode _focusNode;

  bool get isReadOnly => widget.readOnly.toLowerCase() == "yes";
  bool get hasDefaultValue => widget.defaultValue.isNotEmpty;

  @override
  void initState() {
    super.initState();

    // Determine initial text
    final initialText =
        (widget.currentValue != null && widget.currentValue!.isNotEmpty)
            ? widget.currentValue!
            : widget.defaultValue;

    _controller = TextEditingController(text: initialText);
    _focusNode = FocusNode();
    _focusNode.addListener(_handleFocusChange);

    // ✅ Auto-save default value if read-only and no currentValue
    if (isReadOnly && widget.currentValue == null && hasDefaultValue) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onChanged(widget.defaultValue);
      });
    }
  }

  void _handleFocusChange() {
    if (!_focusNode.hasFocus && !isReadOnly) {
      final value = _controller.text;
      if (value.isNotEmpty) {
        widget.onChanged(BigInt.tryParse(value)?.toString());
      }
    }
  }

  void _handleSubmit(String value) {
    if (!isReadOnly && value.isNotEmpty) {
      widget.onChanged(BigInt.tryParse(value)?.toString());
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label, style: const TextStyle(fontSize: 30)),
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
            if (!isReadOnly && value.isNotEmpty) {
              widget.onChanged(BigInt.tryParse(value)?.toString());
            }
          },
          onEditingComplete: () {
            _handleSubmit(_controller.text);
            _focusNode.unfocus();
          },
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
            errorMaxLines: 3,
          ),
          validator: (value) {
            if (widget.validationQuestion() &&
                (value == null || value.isEmpty)) {
              return 'This field is required';
            }
            if (value != null &&
                value.isNotEmpty &&
                BigInt.tryParse(value) == null) {
              return 'Please enter a valid integer';
            }
            return null;
          },
        ),
      ],
    );
  }
}
