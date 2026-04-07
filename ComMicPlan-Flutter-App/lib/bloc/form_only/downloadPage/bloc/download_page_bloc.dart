import 'dart:async';
import 'package:bloc/bloc.dart';
import 'package:flutter/material.dart';
import 'package:gmgi_project/bloc/backend/authorization/login_auth.dart';
import 'package:gmgi_project/bloc/backend/form/fetchForm.dart';
import 'package:gmgi_project/bloc/backend/form/fetch_projects.dart';
import 'package:gmgi_project/models/form.dart';
import 'package:hive/hive.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

part 'download_page_event.dart';
part 'download_page_state.dart';

class DownloadPageBloc extends Bloc<DownloadPageEvent, DownloadPageState> {
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
      // Retrieve token and username from stored data
      final token = await LoginAuth.getStoredToken();
      final storedUser = await LoginAuth.getStoredUser();

      if (token == null || token.isEmpty) {
        emit(DownloadPageFailureState(error: 'No valid token found'));
        return;
      }

      if (storedUser == null || storedUser['username'] == null) {
        emit(DownloadPageFailureState(error: 'No valid user data found'));
        return;
      }

      // Fetch user data from the API
      final username = storedUser['username'];
      final userApiUrl =
          'https://admin2.commicplan.com/api/api/users/$username/';
      final userResponse = await http.get(
        Uri.parse(userApiUrl),
        headers: {
          'Authorization': 'Token $token',
          'Content-Type': 'application/json',
        },
      );

      if (userResponse.statusCode != 200) {
        emit(
          DownloadPageFailureState(error: 'Failed to fetch user data from API'),
        );
        return;
      }

      // Parse the API response
      final userData = jsonDecode(userResponse.body);

      // Update stored user info in SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('userInfo', jsonEncode(userData));

      // Proceed with the rest of the logic using the fetched userData
      final db = FormDatabase(token: token);

      // If projectID is specified (not -1), fetch forms for that project only
      if (event.projectID != -1) {
        final forms = await db.fetchFormsByProject(event.projectID);
        // Sort forms by name
        forms.sort(
          (a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()),
        );
        debugPrint('Forms for project ${event.projectID}: $forms');
        emit(DownloadPageLoadedState(forms: forms));
        return;
      }

      // Fetch user data from the API response
      final userFormIds =
          (userData['profile']?['forms'] as List<dynamic>?)?.cast<int>() ?? [];
      final userProjectIds =
          (userData['profile']?['projects'] as List<dynamic>?)?.cast<int>() ??
          [];
      final userOrganizationIds =
          (userData['profile']?['organizations'] as List<dynamic>?)
              ?.cast<int>() ??
          [];

      // Fetch all forms from FORMFETCH_URL
      final forms = await db.fetchForms();
      final superAdminForms =
          forms.where((form) {
            return form.template == null;
          }).toList();
      debugPrint('Forms from FORMFETCH_URL: $forms');

      List<int> allProjectIds = [];

      // For role 4 and 5 users, skip project fetching as backend already filters forms
      if (userData['role'].toString() != '4' && userData['role'].toString() != '5') {
        // Fetch all projects and filter by organization
        final projectFetch = ProjectFetch();
        final projects = await projectFetch.fetchProjects();
        final organizationProjectIds =
            projects
                .where(
                  (project) => userOrganizationIds.contains(project.organization),
                )
                .map((project) => project.id)
                .toList();
        debugPrint('Organization Project IDs: $organizationProjectIds');

        // Combine userProjectIds and organizationProjectIds
        allProjectIds = <int>{...userProjectIds, ...organizationProjectIds}.toList();
        debugPrint('All Project IDs: $allProjectIds');
      } else {
        debugPrint('Role ${userData['role']} - Skipping project fetch, using direct form access');
      }

      // Filter forms based on userFormIds and project IDs
      final userForms =
          forms.where((form) {
            return ((userFormIds.contains(form.uid) ||
                    allProjectIds.contains(form.project)) &&
                form.template != null);
          }).toList();

      // Sort forms by name
      for (var form in userForms) {
        debugPrint(form.template.toString());
      }
      userForms.sort(
        (a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()),
      );

      // Emit all forms for admin (role == '1'), otherwise filtered forms
      if (userData['role'].toString() == '1') {
        debugPrint('All Forms: $forms');
        emit(DownloadPageLoadedState(forms: forms));
      } else {
        debugPrint('User Forms: $userForms');
        emit(DownloadPageLoadedState(forms: userForms));
      }
    } catch (e) {
      emit(DownloadPageFailureState(error: e.toString()));
    }
  }

  FutureOr<void> _onDownloadPageDownloadButtonPressedEvent(
    DownloadPageDownloadButtonPressedEvent event,
    Emitter<DownloadPageState> emit,
  ) async {
    // Keep whatever is currently shown (likely DownloadPageLoadedState)
    final previous = state;

    try {
      final formsBox = await Hive.openBox('forms');
      for (var form in event.forms) {
        await formsBox.put(form.uid.toString(), {
          "name": form.name,
          "uid": form.uid.toString(),
          "meta": form.meta,
          "questions": form.questions,
        });
      }

      // Notify UI via listener (shows dialog, clears selections, etc.)
      emit(DownloadPageDownloadSuccessState());

      // Re-emit a non-action state so builder paints the list again
      if (previous is DownloadPageLoadedState) {
        emit(DownloadPageLoadedState(forms: previous.forms));
      } else {
        // Fallback if we weren’t on Loaded state for any reason:
        add(DownloadPageInitialEvent(projectID: -1));
      }
    } catch (e) {
      emit(DownloadPageFailureState(error: e.toString()));
    }
  }
}
