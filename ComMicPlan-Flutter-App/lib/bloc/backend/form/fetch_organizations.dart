import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:gmgi_project/bloc/backend/authorization/login_auth.dart';
import 'package:gmgi_project/bloc/backend/form/fetch_projects.dart';
import 'package:gmgi_project/models/organization.dart';
import 'package:http/http.dart' as http;

class FetchOrganizations {
  Future<List<Organization>> fetchOrganizations() async {
    final storedToken = await LoginAuth.getStoredToken();
    final organizationFetchUrl = dotenv.env['ORGANIZATIONFETCH_URL'] ?? '';
    final storedUserInfo = await LoginAuth.getStoredUser();
    try {
      final Uri url = Uri.parse(organizationFetchUrl);
      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Token $storedToken',
          'Content-Type': 'application/json',
        },
      );
      print('API Response: ${response.body}');
      if (response.statusCode == 200) {
        final List<dynamic> organizationJson = json.decode(response.body);
        print('Parsed JSON: $organizationJson');
        final String? loggedInUsername = storedUserInfo?['username'];

        final List<Organization> organizations =
            organizationJson.map((json) {
              return Organization(
                id: json['id'] ?? 0,
                name: json['name'] ?? '',
                description: json['description'] ?? '',
                type: json['type'] ?? '',
                location: json['location'] ?? '',
                website: json['website'] ?? '',
                email: json['email'],
              );
            }).toList();
        print('Mapped organizations: $organizations');
        if (storedUserInfo?['role'] == 1) {
          final projectsCreatedByUser = await ProjectFetch().fetchProjects();
          debugPrint(projectsCreatedByUser.toString());
          List<int> projectOrganizationIds = [];
          for (int i = 0; i < projectsCreatedByUser.length; i++) {
            projectOrganizationIds.add(projectsCreatedByUser[i].organization);
          }
          final List<dynamic> userOrganizationIds =
              storedUserInfo?['profile']['organizations'] ?? [];
          return organizations.where((organization) {
            return projectOrganizationIds.contains(organization.id) ||
                userOrganizationIds.contains(organization.id);
          }).toList();
        }
        if (storedUserInfo != null) {
          final List<dynamic> userOrganizationIds =
              storedUserInfo['profile']['organizations'] ?? [];
          debugPrint("Username: $loggedInUsername\n $userOrganizationIds");
          return organizations.where((organization) {
            return userOrganizationIds.contains(organization.id);
          }).toList();
        }

        print('Filtered Projects: $organizations adgadadgadg');
        return organizations;
      } else {
        throw Exception(
          'Failed to fetch organizations: ${response.statusCode}',
        );
      }
    } catch (e) {
      throw Exception('Error fetching organizations: $e');
    }
  }
}
