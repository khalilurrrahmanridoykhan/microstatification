import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/bloc/authentication/forget_password/bloc/forget_password_bloc.dart';
import 'package:gmgi_project/screens/authentication/forget_password/ui/forget_password_confirmation.dart';
import 'package:gmgi_project/theme/colors/colors.dart';

class ForgetPassword extends StatefulWidget {
  const ForgetPassword({super.key});

  @override
  State<ForgetPassword> createState() => _ForgetPasswordState();
}

class _ForgetPasswordState extends State<ForgetPassword> {
  final ForgetPasswordBloc _forgetPasswordbloc = ForgetPasswordBloc();
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();

  @override
  void initState() {
    _forgetPasswordbloc.add(ForgetPasswordInitialEvent());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: ForgetPasswordScreenColors().backgroundColor,
        body: BlocConsumer<ForgetPasswordBloc, ForgetPasswordState>(
          listenWhen:
              (previous, current) => current is ForgetPasswordActionState,
          buildWhen:
              (previous, current) => current is! ForgetPasswordActionState,
          bloc: _forgetPasswordbloc,
          listener: (context, state) {
            if (state is ForgetPasswordNavigateToLoginState) {
              Navigator.pop(context);
            }
            if (state is ForgetPasswordNavigateToConfirmationstate) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (context) => ForgetPasswordConfirmation(),
                ),
              );
            }
          },
          builder: (context, state) {
            switch (state.runtimeType) {
              case ForgetPasswordLoadedState:
                return Padding(
                  padding: EdgeInsets.only(left: 40, right: 40),
                  child: Align(
                    alignment: Alignment.topCenter,
                    child: SingleChildScrollView(
                      scrollDirection: Axis.vertical,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Image.asset(
                            'assets/images/image.png',
                            height: 198,
                            width: 198,
                          ),
                          SizedBox(height: 20),
                          Text(
                            'Reset Password',
                            style: TextStyle(color: Colors.white),
                          ),

                          SizedBox(height: 20),
                          Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Email:',
                                      style: TextStyle(color: Colors.white),
                                    ),
                                    SizedBox(width: 10),
                                    Expanded(
                                      child: TextFormField(
                                        controller: _emailController,
                                        decoration: InputDecoration(
                                          fillColor:
                                              LogInScreenColors()
                                                  .textFieldColor,
                                          filled: true,
                                          border: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                              10,
                                            ),
                                          ),
                                          contentPadding: EdgeInsets.symmetric(
                                            horizontal: 10,
                                            vertical: 8,
                                          ),
                                        ),
                                        validator: (value) {
                                          if (value == null ||
                                              value.isEmpty ||
                                              !value.contains('@')) {
                                            return 'Invalid Email';
                                          }
                                          return null;
                                        },
                                      ),
                                    ),
                                  ],
                                ),

                                SizedBox(height: 40),
                                FilledButton(
                                  onPressed: () {
                                    if (_formKey.currentState!.validate()) {
                                      print('success');
                                      _forgetPasswordbloc.add(
                                        ForgetPasswordNavigateToConfirmationEvent(),
                                      );
                                    }
                                  },

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
                                  child: Text('Reset Password'),
                                ),
                                SizedBox(height: 30),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      'Remember Password?',
                                      style: TextStyle(color: Colors.white),
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        _forgetPasswordbloc.add(
                                          ForgetPasswordNavigateToLoginEvent(),
                                        );
                                      },
                                      child: Text(
                                        'Log In',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );

              default:
                return SizedBox();
            }
          },
        ),
      ),
    );
  }
}
