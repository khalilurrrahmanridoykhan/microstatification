import 'dart:async';
import 'dart:convert';

import 'package:bloc/bloc.dart';
import 'package:flutter/material.dart';
import 'package:gmgi_project/bloc/backend/authorization/login_auth.dart';
import 'package:gmgi_project/bloc/backend/form/fetchForm.dart';
import 'package:gmgi_project/models/form.dart';
import 'package:gmgi_project/utils/map_utils.dart';
import 'package:hive/hive.dart';
import 'package:http/http.dart' as http;

part 'download_page_event.dart';
part 'download_page_state.dart';

class DownloadPageBloc extends Bloc<DownloadPageEvent, DownloadPageState> {
  // Toggle for local vs production
  static const bool useLocalServer = false;

  // IMPORTANT: base URLs WITHOUT trailing /api
  static const String localBaseUrl = 'http://localhost:8000';
  static const String productionBaseUrl = 'https://admin2.commicplan.com';

  static String get baseUrl =>
      useLocalServer ? localBaseUrl : productionBaseUrl;
  static String get api => '$baseUrl/api/api';

  DownloadPageBloc() : super(DownloadPageInitial()) {
    on<DownloadPageInitialEvent>(_onDownloadPageInitialEvent);
    on<DownloadPageDownloadButtonPressedEvent>(
      _onDownloadPageDownloadButtonPressedEvent,
    );
  }

  FutureOr<void> _onDownloadPageInitialEvent(
    DownloadPageInitialEvent event,
    Emitter<DownloadPageState> emit,
  ) async {
    emit(DownloadPageLoadingState());

    try {
      // 1) Token + user profile
      final token = await LoginAuth.getStoredToken();
      final userBox = await Hive.openBox('user_data');
      final rawUserData = userBox.get('user');
      final Map<String, dynamic>? userData =
          rawUserData != null
              ? Map<String, dynamic>.from(rawUserData as Map)
              : null;

      if (token == null || token.isEmpty) {
        emit(DownloadPageFailureState(error: 'No valid token found'));
        return;
      }

      // 2) Fetch ONLY the forms the user can access
      final formsRes = await http.get(
        Uri.parse('$api/get-user-forms/'),
        headers: {
          'Authorization': 'Token $token',
          'Content-Type': 'application/json',
        },
      );

      if (formsRes.statusCode != 200) {
        emit(DownloadPageFailureState(error: 'Failed to fetch user forms'));
        return;
      }

      final userFormsJson = jsonDecode(formsRes.body) as List<dynamic>;
      final userForms = userFormsJson.map((j) => FormUrl.fromJson(j)).toList();

      // Build a fast lookup of the user’s accessible form UIDs (as strings)
      final userFormUidSet = userForms.map((f) => f.uid.toString()).toSet();

      // === Child mode: parentUid + projectID provided → show only generated forms under that template ===
      final bool childMode = event.parentUid != -1 && event.projectID != -1;
      if (childMode) {
        // Try cached template first
        final templateBox = await Hive.openBox('template_cache');
        final cacheKey = 'template_${event.parentUid}';
        Map<String, dynamic>? templateData =
            templateBox.get(cacheKey) != null
                ? Map<String, dynamic>.from(templateBox.get(cacheKey))
                : null;
        debugPrint(
          '🚀 DownloadPageInitialEvent triggered with projectID: ${event.projectID}, parentUid: ${event.parentUid}',
        );
        // debugPrint('🎯 Template API Response Status: ${templateData}');
        // if (templateData == null) {

        // }
        final tplRes = await http.get(
          Uri.parse('$api/get-template/${event.parentUid}/'),
          headers: {
            'Authorization': 'Token $token',
            'Content-Type': 'application/json',
          },
        );
        if (tplRes.statusCode != 200) {
          emit(
            DownloadPageFailureState(error: 'Failed to fetch template data'),
          );
          return;
        }
        templateData = jsonDecode(tplRes.body) as Map<String, dynamic>;
        await templateBox.put(cacheKey, templateData);

        final generatedLookups =
            (templateData['generated_lookup_forms'] as List<dynamic>?) ??
            const [];

        // Get data collection form and its submissions for filtering
        final dataCollectionForm = templateData['data_collection_form'];
        // Try different possible keys for submissions
        final submissions =
            (dataCollectionForm?['submissions'] as List<dynamic>?) ??
            (dataCollectionForm?['submission'] as List<dynamic>?) ??
            const [];

        // Get filter questions (questions with make_mandatory = true)
        final questions =
            (dataCollectionForm?['questions'] as List? ?? [])
                .map((q) => Map<String, dynamic>.from(q as Map))
                .toList();
        final filterQuestions =
            questions.where((q) => q['make_mandatory'] == true).toList();

        // Create a map for quick UUID to submission data lookup
        final submissionMap = <String, Map<String, dynamic>>{};
        for (final submission in submissions) {
          try {
            final submissionData = Map<String, dynamic>.from(submission as Map);

            // Extract the actual data (might be nested under 'data' key)
            final actualData =
                submissionData['data'] != null
                    ? Map<String, dynamic>.from(submissionData['data'] as Map)
                    : submissionData;

            // Try different possible UUID field names
            final uuid =
                actualData['_uuid']?.toString() ??
                actualData['uuid']?.toString() ??
                actualData['instanceID']?.toString() ??
                actualData['meta']?['instanceID']?.toString();

            if (uuid != null && uuid.isNotEmpty) {
              // Clean UUID - remove 'uuid:' prefix if present
              final cleanUuid = uuid.replaceAll('uuid:', '');
              submissionMap[cleanUuid] =
                  actualData; // Store the actual data, not the wrapper
            } else {
              emit(DownloadPageFailureState(error: 'No valid token found'));
            }
          } catch (e) {
            emit(DownloadPageFailureState(error: e.toString()));
          }
        }

        // Debug: Print first few UUIDs from submissions for comparison
        if (submissionMap.isNotEmpty) {
          final firstFewUuids = submissionMap.keys.take(3).toList();
        }

        final List<FormUrl> childForms = [];

        for (final raw in generatedLookups) {
          try {
            // Normalize id/uid for safety
            final map = Map<String, dynamic>.from(raw as Map);
            map['uid'] ??= map['id'];
            final candidateUid = (map['uid'] ?? '').toString();
            if (candidateUid.isEmpty) continue;

            if (userFormUidSet.contains(candidateUid)) {
              // Extract UUID from the form name (format: "RDT/BSC uuid:xxxxx")
              final formName = map['name']?.toString() ?? '';
              final uuidMatch = RegExp(
                r'uuid:([a-f0-9-]+)',
              ).firstMatch(formName);

              if (uuidMatch != null) {
                final uuid = uuidMatch.group(1);
                final submissionData = submissionMap[uuid];

                if (submissionData != null) {
                  // Extract patient name from submission data
                  String? patientName;
                  try {
                    final rawPatientName = submissionData['patient_name'];

                    patientName = rawPatientName?.toString().trim();

                    if (patientName == null || patientName.isEmpty) {
                      final rawName = submissionData['name'];
                      patientName = rawName?.toString().trim();

                      if (patientName == null || patientName.isEmpty) {
                        final rawPatient = submissionData['patient'];
                        patientName = rawPatient?.toString().trim();
                      }
                      if (patientName == null || patientName.isEmpty) {
                        final rawFullName = submissionData['full_name'];
                        patientName = rawFullName?.toString().trim();
                      }
                    }
                  } catch (e) {
                    emit(DownloadPageFailureState(error: e.toString()));
                  }

                  // Update form name to include patient name
                  final parentName =
                      templateData['name']?.toString() ?? 'Template Form';

                  if (patientName != null && patientName.isNotEmpty) {
                    map['name'] = '$parentName - $patientName';
                  } else {
                    map['name'] = parentName;
                  }

                  // Add submission data to form for filtering
                  map['submissionData'] = submissionData;
                  // Add filter questions for reference
                  map['filterQuestions'] = filterQuestions;
                } else {
                  emit(
                    DownloadPageFailureState(error: 'No submission data found'),
                  );
                }
              } else {
                emit(DownloadPageFailureState(error: 'Could not extract UUID'));
              }

              // Always add filter questions even if no submission data
              map['filterQuestions'] = filterQuestions;
              childForms.add(FormUrl.fromJson(map));
            }
          } catch (e) {
            emit(DownloadPageFailureState(error: e.toString()));
          }
        }

        emit(DownloadPageLoadedState(forms: childForms));
        return; // stop here so parent forms aren't reloaded
      }

      // === Parent mode: build the list of Data Collection forms per assigned template ===
      final List<FormUrl> parentForms = [];

      // Assigned template IDs from user profile (if present)
      final userTemplateIds =
          (userData?['profile']?['templates'] as List<dynamic>?) ?? const [];

      if (userTemplateIds.isNotEmpty) {
        final bulkRes = await http.post(
          Uri.parse('$api/get-templates-bulk/'),
          headers: {
            'Authorization': 'Token $token',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({'template_ids': userTemplateIds}),
        );

        if (bulkRes.statusCode == 200) {
          final templates = jsonDecode(bulkRes.body) as List<dynamic>;
          for (final t in templates) {
            final tpl = Map<String, dynamic>.from(t as Map);
            final dc = tpl['data_collection_form'];
            if (dc != null) {
              // Attach template id so FormUrl has it
              final dataCollectionFormData = Map<String, dynamic>.from(
                dc as Map,
              );
              dataCollectionFormData['template'] = tpl['id'];
              final form = FormUrl.fromJson(dataCollectionFormData);

              // Only include if user has access
              if (userFormUidSet.contains(form.uid.toString())) {
                parentForms.add(form);
              }
            }
          }
        } else {
          emit(DownloadPageFailureState(error: 'Failed to fetch templates'));
        }
      }

      // Fallback: infer one "parent" (data collection) form per template from userForms
      if (parentForms.isEmpty) {
        final seenTemplates = <int>{};
        for (final f in userForms) {
          final templateId = f.template;
          if (templateId == null || seenTemplates.contains(templateId))
            continue;
          seenTemplates.add(templateId);

          final formsWithSameTemplate =
              userForms.where((x) => x.template == templateId).toList();
          // Prefer a name that doesn't look like an instance (no uuid:)
          final dataCollectionForm = formsWithSameTemplate.firstWhere(
            (x) => !x.name.toLowerCase().contains('uuid:'),
            orElse: () => formsWithSameTemplate.first,
          );
          parentForms.add(dataCollectionForm);
        }
      }

      // ✅ FIX: de-dupe by uid (instead of toSet() on FormUrl which lacks ==/hashCode)
      final Map<String, FormUrl> dedupByUid = {
        for (final f in parentForms) f.uid.toString(): f,
      };
      final filteredParentForms =
          dedupByUid.values.toList()..sort(
            (a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()),
          );

      // Admin gets everything
      final isAdmin =
          (userData?['role'] == 1) || (userData?['role']?.toString() == '1');
      if (isAdmin) {
        final db = FormDatabase(token: token);
        final allForms = await db.fetchForms();
        emit(DownloadPageLoadedState(forms: allForms));
      } else {
        final formsToShow =
            filteredParentForms.isNotEmpty
                ? filteredParentForms
                : (userForms..sort(
                  (a, b) =>
                      a.name.toLowerCase().compareTo(b.name.toLowerCase()),
                ));
        emit(DownloadPageLoadedState(forms: formsToShow));
      }
    } catch (e, st) {
      emit(DownloadPageFailureState(error: e.toString()));
    }
  }

  FutureOr<void> _onDownloadPageDownloadButtonPressedEvent(
    DownloadPageDownloadButtonPressedEvent event,
    Emitter<DownloadPageState> emit,
  ) async {
    emit(DownloadPageLoadingState());
    try {
      final formsBox = await Hive.openBox('follow_up');
      for (final form in event.forms) {
        final normalizedMeta = form.meta == null
            ? null
            : deepConvertToStringKeyedMap(
                Map<dynamic, dynamic>.from(form.meta!),
              );

        final normalizedQuestions = form.questions
            .map(
              (question) => deepConvertToStringKeyedMap(
                Map<dynamic, dynamic>.from(question),
              ),
            )
            .toList();

        await formsBox.put(form.uid.toString(), {
          "name": form.name,
          "uid": form.uid.toString(),
          "meta": normalizedMeta,
          "questions": normalizedQuestions,
        });
      }
      emit(DownloadPageDownloadSuccessState());

      // Re-load after download
      add(
        DownloadPageInitialEvent(
          projectID: event.projectID,
          parentUid: event.parentUid,
        ),
      );
    } catch (e) {
      emit(DownloadPageFailureState(error: e.toString()));
    }
  }
}
