import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

class FileQuestion extends StatefulWidget {
  final String label;
  final String name;
  final String kuid;
  final String? currentValue;
  final Function(String?) onChanged;

  const FileQuestion({
    super.key,
    required this.label,
    required this.name,
    required this.kuid,
    this.currentValue,
    required this.onChanged,
  });

  @override
  State<FileQuestion> createState() => _FileQuestionState();
}

class _FileQuestionState extends State<FileQuestion> {
  Future<void> _pickFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.any,
      allowMultiple: false,
    );
    if (result != null && result.files.isNotEmpty) {
      final filePath = result.files.single.path;
      if (filePath != null) {
        setState(() {
          widget.onChanged(filePath);
          print('File selected for ${widget.kuid}: $filePath');
        });
      } else {
        print('No file path available');
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('No file selected')));
      }
    } else {
      print('File selection cancelled');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(widget.label, style: const TextStyle(fontSize: 30)),
        const SizedBox(height: 20),
        ElevatedButton.icon(
          onPressed: _pickFile,
          icon: const Icon(Icons.upload_file),
          label: const Text('Upload File'),
        ),
        const SizedBox(height: 15),
        Text(
          widget.currentValue != null
              ? 'Selected File: ${widget.currentValue}'
              : 'No file selected',
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
