import 'dart:convert';

import 'package:gmgi_project/models/form.dart';
import 'package:hive/hive.dart';

class AvailableUpdate {
  Future<bool> isUpdateAvailable(FormUrl form) async {
    final formsBox = await Hive.openBox('forms');
    final raw = formsBox.get(form.uid.toString());
    if (raw == null) return false; // not stored yet → no update
    final storedForm = Map<String, dynamic>.from(raw as Map);

    // Compare questions — using JSON to handle nested lists/maps
    final storedQuestions = (storedForm['questions'] as List? ?? [])
        .map((q) => Map<String, dynamic>.from(q as Map))
        .toList();
    final storedQuestionsJson = jsonEncode(storedQuestions);
    final currentQuestionsJson = jsonEncode(form.questions);

    return storedQuestionsJson != currentQuestionsJson;
  }
}
