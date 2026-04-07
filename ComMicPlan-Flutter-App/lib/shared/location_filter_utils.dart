class LocationFilterUtils {
  /// Get submission data by UUID from cached/mock data
  /// In a real implementation, this would fetch from your backend API
  static Map<String, dynamic>? getSubmissionDataByUuid(String uuid) {
    // Mock data based on your examples
    final mockSubmissions = {
      'uuid:5ad20ad6-75cd-459d-b118-3aa7304a488e': {
        'division': 'chattogram',
        'district': 'bandarban',
        'upazila': 'lama',
        'union': 'aziznagar',
        'ward': 'ward_no_01',
        'village': 'azizuddin_colony_para',
      },
      'uuid:b3e1c833-080e-4f10-bab6-3d687208a632': {
        'division': 'chattogram',
        'district': 'bandarban',
        'upazila': 'lama',
        'union': 'aziznagar',
        'ward': 'ward_no_01',
        'village': 'azizuddin_colony_para',
      },
      'uuid:91aa7e1e-6c0b-423e-8ab7-9891cb127962': {
        'division': 'chattogram',
        'district': 'bandarban',
        'upazila': 'lama',
        'union': 'aziznagar',
        'ward': 'ward_no_01',
        'village': 'azizuddin_colony_para',
      },
      'uuid:cc8a103e-82f7-4ead-ba0e-2156c463eea6': {
        'division': 'chattogram',
        'district': 'bandarban',
        'upazila': 'lama',
        'union': 'aziznagar',
        'ward': 'ward_no_01',
        'village': 'azizuddin_colony_para',
      },
      'uuid:6df87c23-f64c-4959-8c53-a5e7506e321d': {
        'division': 'chattogram',
        'district': 'bandarban',
        'upazila': 'lama',
        'union': 'aziznagar',
        'ward': 'ward_no_01',
        'village': 'azizuddin_colony_para',
      },
      'uuid:af290570-da75-4843-aa7c-e90fc1e8a3ce': {
        'division': 'chattogram',
        'district': 'bandarban',
        'upazila': 'lama',
        'union': 'aziznagar',
        'ward': 'ward_no_01',
        'village': 'azizuddin_colony_para',
      },
    };

    return mockSubmissions[uuid];
  }

  /// Filter forms based on location hierarchy filters using the data_collection_form_uuid
  static List<dynamic> applyLocationFilters(
    List<dynamic> forms,
    Map<String, String?> selectedFilters,
  ) {
    // If no filters are selected, show all forms
    if (selectedFilters.values.every((value) => value == null)) {
      return forms;
    }

    return forms.where((form) {
      print('DEBUG: Checking form: ${form['name']}');

      // Find the data_collection_form_uuid question in the form
      final questions = (form['questions'] as List? ?? [])
          .map((q) => Map<String, dynamic>.from(q as Map))
          .toList();
      final uuidQuestion = questions.firstWhere(
        (q) => q['name']?.toString() == 'data_collection_form_uuid',
        orElse: () => <String, dynamic>{},
      );

      if (uuidQuestion.isEmpty) {
        print(
          'DEBUG: No data_collection_form_uuid found in form ${form['name']}',
        );
        return false;
      }

      final submissionUuid = uuidQuestion['default']?.toString();
      if (submissionUuid == null || submissionUuid.isEmpty) {
        print('DEBUG: Empty data_collection_form_uuid in form ${form['name']}');
        return false;
      }

      print(
        'DEBUG: Found submission UUID: $submissionUuid in form ${form['name']}',
      );

      // Get the parent submission data using the UUID
      final submissionData = getSubmissionDataByUuid(submissionUuid);
      if (submissionData == null) {
        print('DEBUG: No submission data found for UUID $submissionUuid');
        return false;
      }

      print(
        'DEBUG: Found submission data for $submissionUuid: division=${submissionData['division']}, district=${submissionData['district']}, upazila=${submissionData['upazila']}',
      );

      // Check if submission data matches all selected filters
      for (final entry in selectedFilters.entries) {
        final filterKey = entry.key;
        final filterValue = entry.value;

        // Skip null filters (not selected yet)
        if (filterValue == null) continue;

        final submissionValue = submissionData[filterKey]?.toString();
        print(
          'DEBUG: Checking filter $filterKey=$filterValue against submission value=$submissionValue',
        );

        if (submissionValue != filterValue) {
          print(
            'DEBUG: Filter $filterKey=$filterValue not matched (submission has $submissionValue) for form ${form['name']}',
          );
          return false;
        }
      }

      print('DEBUG: All filters matched for form ${form['name']}');
      return true;
    }).toList();
  }

  /// Extract filter questions from a form (for UI generation)
  static List<Map<String, dynamic>> extractFilterQuestions(dynamic form) {
    final questions = (form['questions'] as List? ?? [])
        .map((q) => Map<String, dynamic>.from(q as Map))
        .toList();

    return questions
        .where((q) {
          final type = q['type']?.toString() ?? '';
          final filterEnabled = q['filterEnabled'] == true;
          final mandatory = q['make_mandatory'] == true;
          return type.startsWith('select_one') && (filterEnabled || mandatory);
        })
        .toList();
  }

  /// Get filtered options for a given question based on parent answers
  static List<Map<String, dynamic>> getFilteredChoices(
    Map<String, dynamic> question,
    int index,
    List<Map<String, dynamic>> filterQuestions,
    Map<String, String?> selectedFilters,
  ) {
    final choices =
        (question['options'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    // If no filter map, return all
    if (question['optionFilterMap'] == null) return choices;

    final optionMap = question['optionFilterMap'] as Map;

    // Check only immediate parent's selection
    if (index > 0) {
      final parentQ = filterQuestions[index - 1];
      final parentName = parentQ['name'];
      final parentValue = selectedFilters[parentName];

      if (parentValue != null && optionMap.containsKey(parentValue)) {
        final allowedList = (optionMap[parentValue] as List?) ?? [];
        return choices.where((c) => allowedList.contains(c['name'])).toList();
      }
    }

    // No parent selection yet
    return [];
  }
}
