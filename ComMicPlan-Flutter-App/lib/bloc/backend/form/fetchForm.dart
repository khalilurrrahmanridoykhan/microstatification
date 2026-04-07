import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:gmgi_project/bloc/backend/authorization/login_auth.dart';
import 'package:gmgi_project/bloc/backend/form/fetch_projects.dart';
import 'package:gmgi_project/models/form.dart';
import 'package:http/http.dart' as http;

class FormDatabase {
  final String token;

  FormDatabase({required this.token});

  Future<List<FormUrl>> fetchForms() async {
    final String? lightweightUrl =
        dotenv.env['FORMFETCH_WITHOUT_SUBMISSION_URL'];
    final String? fallbackUrl = dotenv.env['FORMFETCH_URL'];
    final String resolvedUrl = (lightweightUrl != null &&
            lightweightUrl.isNotEmpty)
        ? lightweightUrl
        : (fallbackUrl ?? '');

    if (resolvedUrl.isEmpty) {
      throw Exception('FORMFETCH URL is not configured.');
    }

    final Uri url = Uri.parse(resolvedUrl);
    final storedUserInfo = await LoginAuth.getStoredUser();
    final response = await http.get(
      url,
      headers: {
        'Authorization': 'Token $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final result = jsonDecode(response.body) as List<dynamic>;
      print('Forms fetched from $url: $result');
      final modeledResult =
          result
              .map((value) => FormUrl.fromJson(value as Map<String, dynamic>))
              .toList();
      if (storedUserInfo?['role'] == 1) {
        final projectsCreatedByUser = await ProjectFetch().fetchProjects();
        List<int> projectIds = [];
        for (int i = 0; i < projectsCreatedByUser.length; i++) {
          projectIds.add(projectsCreatedByUser[i].id);
        }
        final List<dynamic> userFormIds =
            storedUserInfo?['profile']['forms'] ?? [];
        return modeledResult.where((value) {
          return projectIds.contains(value.project) ||
              userFormIds.contains(value.uid);
        }).toList();
      }
      return modeledResult;
    } else {
      throw Exception('Failed to fetch forms: ${response.statusCode}');
    }
  }

  Future<List<FormUrl>> fetchFormsByProject(int projectId) async {
    final String? lightweightUrl =
        dotenv.env['FORMFETCH_WITHOUT_SUBMISSION_URL'];
    if (lightweightUrl != null && lightweightUrl.isNotEmpty) {
      final Uri lightweightUri = Uri.parse(lightweightUrl);
      final Map<String, String> query = {
        ...lightweightUri.queryParameters,
        'project': projectId.toString(),
      };
      final Uri url = lightweightUri.replace(queryParameters: query);

      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Token $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body) as List<dynamic>;
        print('Forms fetched (lightweight) for project $projectId: $result');
        return result
            .map((value) => FormUrl.fromJson(value as Map<String, dynamic>))
            .toList();
      } else {
        throw Exception(
          'Failed to fetch forms for project $projectId: ${response.statusCode}',
        );
      }
    }

    final String? baseUrl = dotenv.env['PROJECTFETCH_URL'];
    if (baseUrl == null || baseUrl.isEmpty) {
      throw Exception('PROJECTFETCH_URL is not set in .env file');
    }
    final String projectFetchUrl = '$baseUrl$projectId/';
    print(projectFetchUrl);

    final Uri url = Uri.parse(projectFetchUrl);
    final response = await http.get(
      url,
      headers: {
        'Authorization': 'Token $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final result = jsonDecode(response.body) as Map<String, dynamic>;
      final formsJson = result['forms'] as List<dynamic>? ?? [];
      print('Forms fetched for project $projectId: $formsJson');
      return formsJson
          .map((value) => FormUrl.fromJson(value as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception(
        'Failed to fetch forms for project $projectId: ${response.statusCode}',
      );
    }
  }
}
