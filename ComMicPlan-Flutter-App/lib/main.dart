import 'package:flutter/material.dart';
import 'package:gmgi_project/bloc/backend/authorization/login_auth.dart';
import 'package:gmgi_project/screens/authentication/log_in/ui/log_in.dart';
import 'package:gmgi_project/screens/form_only/userHome/ui/userHome.dart';
import 'package:gmgi_project/screens/home.dart';

import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final dir = await getApplicationDocumentsDirectory();
  await Hive.initFlutter(dir.path);
  await Hive.openBox('forms');
  await Hive.openBox('follow_up');
  await Hive.openBox('submission');
  await Hive.openBox('follow_up_submission');
  await Hive.openBox('appData');
  final storedUserData = await LoginAuth.getStoredUser();
  print(storedUserData);
  await dotenv.load(fileName: "lib/.env");
  runApp(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      home: storedUserData != null ? HomeScreen() : LogIn(),
      //home: HomeScreen(),
      //home: Test(),
    ),
  );
} //
