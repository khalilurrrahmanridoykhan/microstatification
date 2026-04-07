import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:gmgi_project/models/user.dart';
import 'package:hive/hive.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fluttertoast/fluttertoast.dart';

class LoginAuth {
  static Future<bool> loginUser(String username, String password) async {
    final String loginUrl = dotenv.env['LOGIN_URL'] ?? '';
    final String csrfUrl = dotenv.env['CSRF_URL'] ?? '';
    final loginUri = Uri.parse(loginUrl);
    final csrfUri = Uri.parse(csrfUrl);

    try {
      // 1. Get CSRF Token
      final csrfResponse = await http.get(
        csrfUri,
        headers: {'Content-Type': 'application/json'},
      );

      if (csrfResponse.statusCode != 200) {
        Fluttertoast.showToast(msg: "Failed to retrieve CSRF token");
        return false;
      }

      final csrfData = jsonDecode(csrfResponse.body);
      final csrfToken = csrfData['csrfToken'];

      // Store CSRF Token
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('csrfToken', csrfToken);

      // 2. Perform Login
      final loginResponse = await http.post(
        loginUri,
        headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrfToken},
        body: jsonEncode({'username': username, 'password': password}),
      );

      if (loginResponse.statusCode == 200) {
        final data = jsonDecode(loginResponse.body);
        final token = data['token'];
        final user = data['user'];

        await prefs.setString('authToken', token);
        await prefs.setString('userInfo', jsonEncode(user));

        // 3. Fetch languages and cache
        try {
          final languagesUri = Uri.parse(
            'https://admin2.commicplan.com/api/api/languages/',
          );
          final langsResp = await http.get(
            languagesUri,
            headers: {
              'Content-Type': 'application/json',
              'Authorization':
                  'Token $token', // if your API needs it; remove if not
            },
          );

          if (langsResp.statusCode == 200) {
            // Expecting a JSON array like:
            // [{"id":3,"subtag":"ae","description":"Avestan",...}, ...]
            await prefs.setString('languages', langsResp.body);
            debugPrint(prefs.getString('languages'));
          } else {
            // Fallback to empty if call fails
            await prefs.remove('languages');
          }
        } catch (e) {
          await prefs.remove('languages');
        }

        Fluttertoast.showToast(msg: "Login successful");
        return true;
      } else {
        Fluttertoast.showToast(msg: "Invalid credentials");
        return false;
      }
    } catch (e) {
      Fluttertoast.showToast(msg: "Login error: $e");
      return false;
    }
  }

  /// Retrieves stored auth token
  static Future<String?> getStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('authToken');
  }

  /// Retrieves stored user info
  static Future<Map<String, dynamic>?> getStoredUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('userInfo');
    if (userJson != null) {
      return jsonDecode(userJson);
    }
    return null;
  }

  /// Retrieves stored CSRF token
  static Future<String?> getStoredCsrfToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('csrfToken');
  }

  /// Clears stored session
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();

    // Remove auth-related SharedPreferences
    await prefs.remove('authToken');
    await prefs.remove('userInfo');
    await prefs.remove('csrfToken');

    // Clear all Hive box data
    await Hive.box('forms').clear();
    await Hive.box('submission').clear();
    await Hive.box('appdata').clear();
    await Hive.box('follow_up').clear();
    await Hive.box('follow_up_submission').clear();

    // Optional: close Hive if needed
    // await Hive.close();
  }

  static Future<UserModel?> getStoredUserModel() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('userInfo');
    if (userJson != null) {
      final Map<String, dynamic> userMap = jsonDecode(userJson);
      return UserModel.fromJson(userMap);
    }
    return null;
  }
}
