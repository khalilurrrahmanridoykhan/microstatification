import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:gmgi_project/bloc/backend/authorization/login_auth.dart';
import 'package:gmgi_project/models/project.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ProjectFetch {
  Future<List<Project>> fetchProjectsByOrganization(int organizationId) async {
    final storedToken = await LoginAuth.getStoredToken();
    final projectFetchUrl = dotenv.env['PROJECTFETCH_URL'];
    if (projectFetchUrl == null || projectFetchUrl.isEmpty) {
      throw Exception('PROJECTFETCH_URL is not set in .env file');
    }

    final storedUserInfo = await LoginAuth.getStoredUser();
    try {
      // Append organizationId to the URL (adjust based on your API's structure)
      final Uri url = Uri.parse(
        '$projectFetchUrl?organization_id=$organizationId',
      );
      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Token $storedToken',
          'Content-Type': 'application/json',
        },
      );
      debugPrint('API Response: ${response.body}');

      if (response.statusCode == 200) {
        final decodedBody = json.decode(response.body);
        if (decodedBody is! List) {
          throw Exception('Expected a list in API response');
        }
        final List<dynamic> projectJson = decodedBody;
        debugPrint('Parsed JSON: $projectJson');

        final List<Project> projects =
            projectJson.map((json) {
              return Project(
                id: json['id'] ?? 0,
                name: json['name'] ?? '',
                description: json['description'] ?? '',
                organization: json['organization'] ?? 0,
                location: json['location'] ?? '',
                species: json['species'] ?? [],
                createdBy: json['created_by'] ?? '',
              );
            }).toList();
        debugPrint('Mapped Projects: $projects');
        if (storedUserInfo?['role'] == 1) {
          final String? loggedInUsername = storedUserInfo?['username'];
          return projects.where((project) {
            return project.createdBy == loggedInUsername &&
                project.organization == organizationId;
          }).toList();
        }
        // Filter projects to ensure they belong to the specified organization
        final List<Project> filteredProjects =
            projects.where((project) {
              return project.organization == organizationId;
            }).toList();

        // Optional: Additional filtering based on user permissions
        if (storedUserInfo != null) {
          final List<dynamic> userOrganizationIds =
              storedUserInfo['profile']['organizations'] ?? [];
          final String? loggedInUsername = storedUserInfo['username'];
          debugPrint(
            'Username: $loggedInUsername\nOrganizations: $userOrganizationIds',
          );
        }

        debugPrint('Filtered Projects: $filteredProjects');
        return filteredProjects;
      } else {
        throw Exception('Failed to fetch projects: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching projects: $e');
    }
  }

  Future<List<Project>> fetchProjects() async {
    final storedToken = await LoginAuth.getStoredToken();
    if (storedToken == null || storedToken.isEmpty) {
      throw Exception('No authentication token found');
    }

    final projectFetchUrl = dotenv.env['PROJECTFETCH_URL'];
    if (projectFetchUrl == null || projectFetchUrl.isEmpty) {
      throw Exception('PROJECTFETCH_URL is not set in .env file');
    }

    final storedUserInfo = await LoginAuth.getStoredUser();
    try {
      final Uri url = Uri.parse(projectFetchUrl);
      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Token $storedToken',
          'Content-Type': 'application/json',
        },
      );
      debugPrint('API Response: ${response.body}');

      if (response.statusCode == 200) {
        final decodedBody = json.decode(response.body);
        if (decodedBody is! List) {
          throw Exception('Expected a list in API response');
        }
        final List<dynamic> projectJson = decodedBody;
        debugPrint('Parsed JSON: $projectJson');

        final List<Project> projects =
            projectJson.map((json) {
              return Project(
                id: json['id'] ?? 0,
                name: json['name'] ?? '',
                description: json['description'] ?? '',
                organization: json['organization'] ?? 0,
                location: json['location'] ?? '',
                species: json['species'] ?? [],
                createdBy: json['created_by'] ?? '',
              );
            }).toList();
        debugPrint('Mapped Projects: $projects');

        // Filter projects based on user's project IDs, created_by, or associated organizations

        if (storedUserInfo != null) {
          final String? loggedInUsername = storedUserInfo['username'];
          final List<dynamic> userProjectIds =
              storedUserInfo['profile']['projects'] ?? [];
          final List<dynamic> userOrganizationIds =
              storedUserInfo['profile']['organizations'] ?? [];
          debugPrint(
            'Username: $loggedInUsername\nProject IDs: $userProjectIds\nOrganization IDs: $userOrganizationIds',
          );

          return projects.where((project) {
            return userProjectIds.contains(project.id) ||
                project.createdBy == loggedInUsername ||
                userOrganizationIds.contains(project.organization);
          }).toList();
        }

        debugPrint('Filtered Projects: $projects');
        return projects;
      } else {
        throw Exception('Failed to fetch projects: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching projects: $e');
    }
  }
}
