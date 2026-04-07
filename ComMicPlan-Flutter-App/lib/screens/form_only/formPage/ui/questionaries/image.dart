import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class ImageQuestion extends StatefulWidget {
  final String label;
  final String xpath;
  final String kuid;
  final String appearance;
  final String? currentValue;
  final String? defaultValue; // ✅ Default image path or URL
  final bool Function() validationQuestion;
  final Function(String?) onChanged;

  const ImageQuestion({
    super.key,
    required this.label,
    required this.xpath,
    required this.kuid,
    required this.appearance,
    this.currentValue,
    this.defaultValue,
    required this.validationQuestion,
    required this.onChanged,
  });

  @override
  State<ImageQuestion> createState() => _ImageQuestionState();
}

class _ImageQuestionState extends State<ImageQuestion> {
  String? _imagePath;

  @override
  void initState() {
    super.initState();

    // ✅ If no current value, set default image
    if ((widget.currentValue == null || widget.currentValue!.isEmpty) &&
        widget.defaultValue != null &&
        widget.defaultValue!.isNotEmpty) {
      _imagePath = widget.defaultValue;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onChanged(widget.defaultValue);
      });
    } else {
      _imagePath = widget.currentValue;
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: source);
    if (pickedFile != null) {
      setState(() {
        _imagePath = pickedFile.path;
      });
      widget.onChanged(pickedFile.path);
    }
  }

  void _showDrawingBoard(BuildContext context, {File? backgroundImage}) {
    // TODO: Implement drawing/signature functionality
    // For now, you can open a custom drawing board page
  }

  @override
  Widget build(BuildContext context) {
    return FormField<String>(
      initialValue: _imagePath,
      validator: (value) {
        if (widget.validationQuestion() && (value == null || value.isEmpty)) {
          return 'Please provide an image';
        }
        return null;
      },
      builder: (field) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          field.validate();
        });

        return Center(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
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
              const SizedBox(height: 20),

              // Buttons based on appearance
              if (widget.appearance == 'signature' ||
                  widget.appearance == 'draw')
                ElevatedButton.icon(
                  onPressed: () => _showDrawingBoard(context),
                  icon: const Icon(Icons.edit),
                  label: Text(
                    widget.appearance == 'signature' ? 'Sign' : 'Draw',
                  ),
                )
              else ...[
                ElevatedButton.icon(
                  onPressed: () => _pickImage(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt),
                  label: const Text("Take Picture"),
                ),
                const SizedBox(height: 10),
                ElevatedButton.icon(
                  onPressed: () => _pickImage(ImageSource.gallery),
                  icon: const Icon(Icons.image),
                  label: const Text("Choose from Gallery"),
                ),
              ],

              // Show selected/default image
              if (_imagePath != null && _imagePath!.isNotEmpty) ...[
                const SizedBox(height: 20),
                const Text(
                  "Selected Image:",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                GestureDetector(
                  onTap:
                      widget.appearance == 'annotate'
                          ? () => _showDrawingBoard(
                            context,
                            backgroundImage: File(_imagePath!),
                          )
                          : null,
                  child:
                      _imagePath!.startsWith('http')
                          ? Image.network(
                            _imagePath!,
                            height: 200,
                            fit: BoxFit.contain,
                            errorBuilder:
                                (context, error, stackTrace) =>
                                    const Text('⚠️ Could not load image'),
                          )
                          : Image.file(
                            File(_imagePath!),
                            height: 200,
                            fit: BoxFit.contain,
                            errorBuilder:
                                (context, error, stackTrace) =>
                                    const Text('⚠️ Could not load image'),
                          ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
