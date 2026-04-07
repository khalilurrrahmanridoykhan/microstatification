class FormUrl {
  final int uid;
  final String name;
  final List<Map<String, dynamic>> questions;
  final int project;
  final int? template;
  final Map<String, dynamic>? submissionData; // For filtering
  final List<Map<String, dynamic>>? filterQuestions;
  final Map<String, dynamic>? meta; // Mandatory questions for filtering

  FormUrl({
    required this.uid,
    required this.name,
    required this.questions,
    required this.project,
    required this.template,
    this.submissionData,
    this.filterQuestions,
    this.meta,
  });

  static FormUrl fromJson(Map<String, dynamic> value) {
    int? templateInt;
    if (value['template'] != null) {
      if (value['template'] is int) {
        templateInt = value['template'] as int;
      } else if (value['template'] is String) {
        templateInt = int.tryParse(value['template']);
      } else {
        templateInt = null;
      }
    }

    Map<String, dynamic>? submissionData;
    if (value['submissionData'] != null) {
      submissionData = Map<String, dynamic>.from(
        value['submissionData'] as Map,
      );
    }

    List<Map<String, dynamic>>? filterQuestions;
    if (value['filterQuestions'] != null) {
      filterQuestions =
          (value['filterQuestions'] as List<dynamic>)
              .map((q) => Map<String, dynamic>.from(q as Map))
              .toList();
    }

    // ✅ Build meta even if "other_languages" is missing; include title & translations too.
    Map<String, dynamic>? tempMeta = {
      'name': value['name'],
      'default_language': value['default_language'],
      // Prefer plural key; fallback to singular; default to empty list
      'other_languages':
          (value['other_languages'] ?? value['other_language'] ?? const [])
              as Object?,
      'translations': value['translations'] ?? const {},
    };

    // Normalize 'other_languages' to List<int>
    final rawOther =
        (tempMeta['other_languages'] is List)
            ? tempMeta['other_languages'] as List
            : const [];
    tempMeta['other_languages'] =
        rawOther
            .map((e) => e is int ? e : int.tryParse(e.toString()))
            .where((e) => e != null)
            .cast<int>()
            .toList();

    return FormUrl(
      uid: value['uid'] ?? value['id'] ?? 0,
      name: value['name'] ?? '',
      questions:
          value['questions'] != null
              ? (value['questions'] as List<dynamic>)
                  .map((q) => Map<String, dynamic>.from(q as Map))
                  .toList()
              : [],
      project: value['project'] ?? 0,
      template: templateInt,
      submissionData: submissionData,
      filterQuestions: filterQuestions,
      meta: tempMeta,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FormUrl && runtimeType == other.runtimeType && uid == other.uid; // equality based on UID

  @override
  int get hashCode => uid.hashCode;

  @override
  String toString() =>
      'FormUrl(uid: $uid, name: $name, project: $project, template: $template)';
}
