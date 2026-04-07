import 'package:flutter/foundation.dart';

class SkipLogicCheck {
  final List<dynamic> conditions;
  final Map<String, dynamic> answers;

  SkipLogicCheck({required this.conditions, required this.answers});

  bool skipLogicCheck() {
    // If there are no conditions, the question should be shown
    if (conditions.isEmpty) {
      return true;
    }

    // All conditions must be true (AND operation)
    for (var condition in conditions) {
      final question = condition['question'].toString();
      final conditionType = condition['condition'].toString();
      final value = condition['value'];

      if (conditionType == 'was_answered') {
        if (answers[question] == null || answers[question].toString().isEmpty) {
          return false; // Question was not answered, so skip
        }
      } else if (conditionType == '=') {
        if (answers[question]?.toString() != value?.toString()) {
          return false; // Answer does not match the expected value
        }
      } else if (conditionType == 'was_not_answered') {
        if (answers[question] != null &&
            answers[question].toString().isNotEmpty) {
          return false; // Question was answered, so skip
        }
      } else if (conditionType == '!=') {
        if (answers[question]?.toString() == value?.toString()) {
          return false; // Answer matches the value, so skip
        }
      } else {
        debugPrint('Unsupported condition type: $conditionType');
        return false; // Unsupported condition, skip the question
      }
    }
    return true; // All conditions are met, show the question
  }
}
