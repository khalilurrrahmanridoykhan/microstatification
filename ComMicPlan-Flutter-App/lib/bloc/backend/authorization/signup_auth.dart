import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:http/http.dart' as http;

class SignupAuth {
  static Future<bool> signUpUser(
    String username,
    String email,
    String firstName,
    String lastName,
    String password,
  ) async {
    final signUpurl = dotenv.env['SIGNUP_URL'] ?? '';
    final url = Uri.parse(signUpurl);
    try {
      await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'email': email,
          'password': password,
          'first_name': firstName,
          'last_name': lastName,
        }),
      );
      Fluttertoast.showToast(msg: "Account created successfully");
      return true;
    } catch (e) {
      Fluttertoast.showToast(msg: "Sign Up error: $e");
      return false;
    }
  }
}
