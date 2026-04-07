class LocationFilterUtils {
  /// Extract filter questions from form data
  static List<Map<String, dynamic>> extractFilterQuestions(
    Map<String, dynamic> formData,
  ) {
    final questions = (formData['questions'] as List? ?? [])
        .map((q) => Map<String, dynamic>.from(q as Map))
        .toList();
    final filterQuestions = <Map<String, dynamic>>[];

    // Define which questions should be used for filtering
    final filterQuestionNames = [
      'division',
      'district',
      'upazila',
      'union',
      'ward',
      'village',
    ];

    for (var question in questions) {
      final questionName = question['name'] as String?;

      if (questionName != null && filterQuestionNames.contains(questionName)) {
        // Extract options from the question if available
        final options = <String>[];
        if (question.containsKey('choices')) {
          final choices = question['choices'] as List<dynamic>? ?? [];
          for (var choice in choices) {
            if (choice is Map<String, dynamic> && choice.containsKey('label')) {
              options.add(choice['label'].toString());
            }
          }
        }

        filterQuestions.add({'name': questionName, 'options': options});
      }
    }

    return filterQuestions;
  }

  /// Apply location filters to a list of forms
  static List<Map<String, dynamic>> applyLocationFilters(
    List<Map<String, dynamic>> forms,
    Map<String, String?> selectedFilters,
  ) {
    final filteredForms = <Map<String, dynamic>>[];

    for (var form in forms) {
      bool matches = true;

      // Check if form matches all selected filters
      for (var filterEntry in selectedFilters.entries) {
        final filterName = filterEntry.key;
        final selectedValue = filterEntry.value;

        if (selectedValue != null && selectedValue.isNotEmpty) {
          // Get submission data by UUID if available
          final submissionData = getSubmissionDataByUuid(form);

          if (submissionData != null) {
            final formValue = submissionData[filterName];
            if (formValue != selectedValue) {
              matches = false;
              break; // This form doesn't match the filter
            }
          } else {
            // Fallback: check if form has the filter field directly
            final formValue = form[filterName];
            if (formValue != selectedValue) {
              matches = false;
              break;
            }
          }
        }
      }

      if (matches) {
        filteredForms.add(form);
      }
    }

    return filteredForms;
  }

  /// Get submission data by UUID (mock implementation for now)
  static Map<String, dynamic>? getSubmissionDataByUuid(
    Map<String, dynamic> form,
  ) {
    // Extract UUID from form
    String? uuid;

    print('DEBUG: Checking form for UUID: ${form.keys.toList()}');

    // Try different possible keys for UUID
    if (form.containsKey('data_collection_form_uuid')) {
      uuid = form['data_collection_form_uuid'].toString();
      print('DEBUG: Found UUID in data_collection_form_uuid: $uuid');
    } else if (form.containsKey('uuid')) {
      uuid = form['uuid'].toString();
      print('DEBUG: Found UUID in uuid field: $uuid');
    } else if (form.containsKey('uid')) {
      // Check if uid contains UUID format
      final uid = form['uid'].toString();
      print('DEBUG: Checking uid field: $uid');
      if (uid.contains('-')) {
        uuid = uid;
        print('DEBUG: Using uid as UUID: $uuid');
      }
    } else if (form.containsKey('questions')) {
      // Search in questions array for data_collection_form_uuid
      final questions = (form['questions'] as List? ?? [])
          .map((q) => Map<String, dynamic>.from(q as Map))
          .toList();
      print(
        'DEBUG: Searching in ${questions.length} questions for data_collection_form_uuid',
      );

      for (var question in questions) {
        print(
          'DEBUG: Question: ${question['name']}, has default: ${question.containsKey('default')}',
        );
        if (question['name'] == 'data_collection_form_uuid' &&
            question.containsKey('default')) {
          uuid = question['default'].toString();
          print('DEBUG: Found UUID in question default: $uuid');
          // Remove 'uuid:' prefix if present
          if (uuid.startsWith('uuid:')) {
            uuid = uuid.substring(5);
            print('DEBUG: Cleaned UUID: $uuid');
          }
          break;
        }
      }
    }

    // Also check if the form name contains UUID
    if (uuid == null && form.containsKey('name')) {
      final name = form['name'].toString();
      print('DEBUG: Checking form name for UUID: $name');
      // Extract UUID pattern from name like "RDT/BSC - Data Collection Form uuid:af290570-da75-4843-aa7c-e90fc1e8a3ce"
      final uuidPattern = RegExp(r'uuid:([a-f0-9-]{36})');
      final match = uuidPattern.firstMatch(name);
      if (match != null) {
        uuid = match.group(1);
        print('DEBUG: Extracted UUID from name: $uuid');
      }
    }

    if (uuid == null) {
      print('DEBUG: No UUID found in form: ${form.keys.toList()}');
      if (form.containsKey('questions')) {
        final questions = (form['questions'] as List? ?? [])
            .map((q) => q is Map ? q['name'] : 'invalid')
            .toList();
        print('DEBUG: Questions in form: $questions');
      }
      return null;
    }

    print('DEBUG: Final UUID: $uuid');

    // Mock submission data - in a real app, this would query Hive or API
    final mockSubmissions = {
      '3fa88f85-a2b8-42e8-9c71-da8a1e8d5b04': {
        'division': 'chattogram',
        'district': 'cox\'s bazar',
        'upazila': 'lama',
        'union': 'fashiakhali',
        'ward': '1',
        'village': 'fashiakhali',
      },
      'a747cee7-a024-40ef-8161-4a58ca94346b': {
        'division': 'chattogram',
        'district': 'chattogram',
        'upazila': 'hathazari',
        'union': 'mirsharai',
        'ward': '2',
        'village': 'mirsharai',
      },
      'b847dff8-b135-41f0-9d72-eb9b2f9e6c15': {
        'division': 'dhaka',
        'district': 'dhaka',
        'upazila': 'dhanmondi',
        'union': 'dhanmondi',
        'ward': '3',
        'village': 'dhanmondi',
      },
      // Add the UUIDs from the debug logs
      'cc8a103e-82f7-4ead-ba0e-2156c463eea6': {
        'division': 'chattogram',
        'district': 'cox\'s bazar',
        'upazila': 'lama',
        'union': 'fashiakhali',
        'ward': '1',
        'village': 'fashiakhali',
      },
      '6df87c23-f64c-4959-8c53-a5e7506e321d': {
        'division': 'chattogram',
        'district': 'cox\'s bazar',
        'upazila': 'lama',
        'union': 'fashiakhali',
        'ward': '1',
        'village': 'fashiakhali',
      },
      'b3e1c833-080e-4f10-bab6-3d687208a632': {
        'division': 'chattogram',
        'district': 'cox\'s bazar',
        'upazila': 'lama',
        'union': 'fashiakhali',
        'ward': '1',
        'village': 'fashiakhali',
      },
      'af290570-da75-4843-aa7c-e90fc1e8a3ce': {
        'division': 'chattogram',
        'district': 'chattogram',
        'upazila': 'lama',
        'union': 'mirsharai',
        'ward': '2',
        'village': 'mirsharai',
      },
    };

    final submissionData = mockSubmissions[uuid];
    if (submissionData != null) {
      print('DEBUG: Found submission data for UUID $uuid: $submissionData');
    } else {
      print('DEBUG: No submission data found for UUID: $uuid');
    }

    return submissionData;
  }
}
