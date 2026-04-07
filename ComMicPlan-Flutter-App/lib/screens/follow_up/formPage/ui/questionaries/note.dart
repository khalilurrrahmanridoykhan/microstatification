import 'package:flutter/material.dart';

class NoteQuestion extends StatelessWidget {
  final String label;
  const NoteQuestion({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(label, style: TextStyle(fontSize: 25), maxLines: 700);
  }
}
