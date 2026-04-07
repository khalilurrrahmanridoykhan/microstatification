import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/bloc/backend/algorithms/password_check.dart';
import 'package:gmgi_project/screens/authentication/forget_password/ui/passwordReset/bloc/password_reset_bloc.dart';
import 'package:gmgi_project/screens/authentication/log_in/ui/log_in.dart';
import 'package:gmgi_project/theme/colors/colors.dart';

class ForgetPasswordReset extends StatefulWidget {
  const ForgetPasswordReset({super.key});

  @override
  State<ForgetPasswordReset> createState() => _ForgetPasswordResetState();
}

class _ForgetPasswordResetState extends State<ForgetPasswordReset> {
  final TextEditingController _oldPassController = TextEditingController();
  final TextEditingController _newPassController = TextEditingController();
  final TextEditingController _newPassAgainController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final PasswordResetBloc _passwordResetBloc = PasswordResetBloc();

  @override
  void initState() {
    _passwordResetBloc.add(PasswordResetInitialEvent());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: ForgetPasswordScreenColors().backgroundColor,
        body: Padding(
          padding: const EdgeInsets.only(right: 25, left: 25, bottom: 25),
          child: SingleChildScrollView(
            scrollDirection: Axis.vertical,
            child: BlocConsumer<PasswordResetBloc, PasswordResetState>(
              bloc: _passwordResetBloc,
              listener: (context, state) {
                // TODO: implement listener
              },
              builder: (context, state) {
                switch (state.runtimeType) {
                  case PasswordResetLoadedState:
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Image.asset(
                          'assets/images/image.png',
                          height: 198,
                          width: 198,
                        ),
                        SizedBox(height: 20),
                        Center(
                          child: Form(
                            key: _formKey,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Old Password',
                                  style: TextStyle(color: Colors.white),
                                ),
                                SizedBox(height: 10),
                                SizedBox(
                                  width: 300,
                                  child: TextFormField(
                                    controller: _oldPassController,
                                    decoration: InputDecoration(
                                      fillColor:
                                          LogInScreenColors().textFieldColor,
                                      filled: true,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      contentPadding: EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 8,
                                      ),
                                    ),
                                    validator: (value) {
                                      final check = PasswordCheck()
                                          .checkPassword(value.toString());
                                      if (value == null ||
                                          value.isEmpty ||
                                          !check) {
                                        return 'Password should contain one upper case, one digit, \none special character and shouldn\'t contain space';
                                      }
                                      return null;
                                    },
                                  ),
                                ),
                                SizedBox(height: 20),
                                Text(
                                  'New Password',
                                  style: TextStyle(color: Colors.white),
                                ),
                                SizedBox(height: 10),
                                SizedBox(
                                  width: 300,
                                  child: TextFormField(
                                    controller: _newPassController,
                                    decoration: InputDecoration(
                                      fillColor:
                                          LogInScreenColors().textFieldColor,
                                      filled: true,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      contentPadding: EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 8,
                                      ),
                                    ),
                                    validator: (value) {
                                      final check = PasswordCheck()
                                          .checkPassword(value.toString());
                                      if (value == null ||
                                          value.isEmpty ||
                                          !check) {
                                        return 'Password should contain one upper case, one digit, \none special character and shouldn\'t contain space';
                                      }
                                      return null;
                                    },
                                  ),
                                ),
                                SizedBox(height: 20),
                                Text(
                                  'New Password(Again)',
                                  style: TextStyle(color: Colors.white),
                                ),
                                SizedBox(height: 10),
                                SizedBox(
                                  width: 300,
                                  child: TextFormField(
                                    controller: _newPassAgainController,
                                    decoration: InputDecoration(
                                      fillColor:
                                          LogInScreenColors().textFieldColor,
                                      filled: true,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      contentPadding: EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 8,
                                      ),
                                    ),
                                    validator: (value) {
                                      
                                      if (value == null ||
                                          value.isEmpty ||
                                          value !=
                                              _newPassController.text.trim()) {
                                        return 'Password missmatched';
                                      }
                                      return null;
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        SizedBox(height: 30),
                        FilledButton(
                          style: ButtonStyle(
                            shape: WidgetStateProperty.all(
                              RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                            backgroundColor: WidgetStateProperty.all(
                              LogInScreenColors().loginButtonColor,
                            ),
                          ),
                          onPressed: () {
                            if (_formKey.currentState!.validate()) {
                              print('success');
                              _passwordResetBloc.add(
                                PasswordResetSubmitButtonPressedEvent(),
                              );
                            }
                          },
                          child: Text(
                            'Submit',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ],
                    );
                  case PasswordResetSuccessState:
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Image.asset(
                            'assets/images/image.png',
                            height: 198,
                            width: 198,
                          ),
                          SizedBox(height: 20),
                          Text(
                            'Password Reset Succesfully.',
                            maxLines: 15,
                            style: TextStyle(color: Colors.white, fontSize: 17),
                          ),
                          SizedBox(height: 20),
                          FilledButton(
                            style: ButtonStyle(
                              shape: WidgetStateProperty.all(
                                RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              backgroundColor: WidgetStateProperty.all(
                                LogInScreenColors().loginButtonColor,
                              ),
                            ),
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => LogIn(),
                                ),
                              );
                            },
                            child: Text(
                              'Log In',
                              style: TextStyle(color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    );
                  default:
                    return SizedBox();
                }
              },
            ),
          ),
        ),
      ),
    );
  }
}
