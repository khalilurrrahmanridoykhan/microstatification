import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:gmgi_project/screens/authentication/forget_password/ui/forget_password.dart';
import 'package:gmgi_project/bloc/authentication/log_in/bloc/log_in_bloc.dart';
import 'package:gmgi_project/screens/authentication/sign_up/ui/sign_up.dart';
import 'package:gmgi_project/screens/home.dart';
import 'package:gmgi_project/theme/colors/colors.dart';
import 'package:gmgi_project/screens/form_only/userHome/ui/userHome.dart';

class LogIn extends StatefulWidget {
  const LogIn({super.key});

  @override
  State<LogIn> createState() => _LogInState();
}

class _LogInState extends State<LogIn> {
  final LogInBloc _loginBloc = LogInBloc();
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _userNameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool obscured = true;
  bool checked = false;
  final color = LogInScreenColors();

  @override
  void initState() {
    _loginBloc.add(LoginInitialEvent());
    super.initState();
  }

  @override
  void dispose() {
    _loginBloc.close();
    _passwordController.dispose();
    _userNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.white,
        body: BlocConsumer<LogInBloc, LogInState>(
          listenWhen: (previous, current) => current is LoginActionState,
          buildWhen: (previous, current) => current is! LoginActionState,
          bloc: _loginBloc,
          listener: (context, state) {
            if (state is LoginNavigateToSignUpState) {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => SignUp()),
              );
            } else if (state is LoginNavigateToForgetPasswordState) {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => ForgetPassword()),
              );
            } else if (state is LoginSuccessState) {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => HomeScreen()),
                (route) => false,
              );
            }
          },
          builder: (context, state) {
            switch (state.runtimeType) {
              case LoginLoadingState:
                return Center(child: CircularProgressIndicator.adaptive());
              case LoginFailureState:
              case LoginLoadedState:
                return SizedBox.expand(
                  child: SingleChildScrollView(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            color.backgroundColor1,
                            color.backgroundColor2,
                          ],
                          stops: const [0.0, 0.3],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Image.asset('assets/images/image2.png', height: 200),
                          Text(
                            'ComMicPlan',
                            style: TextStyle(
                              fontSize: 35,
                              color: color.headerTextColor,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            'Login to your account',
                            style: TextStyle(color: color.headerTextColor),
                          ),

                          Padding(
                            padding: const EdgeInsets.only(
                              right: 25,
                              left: 25,
                              top: 10,
                            ),
                            child: Divider(thickness: 1),
                          ),
                          SizedBox(height: 20),
                          Padding(
                            padding: const EdgeInsets.all(25),
                            child: Form(
                              key: _formKey,
                              child: Column(
                                children: [
                                  TextFormField(
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Username shouldn\'t be empty';
                                      } else {
                                        return null;
                                      }
                                    },
                                    controller: _userNameController,
                                    decoration: InputDecoration(
                                      isDense: true,
                                      hintText: 'Enter your username',
                                      hintStyle: TextStyle(color: Colors.grey),
                                      prefixIcon: Icon(Feather.at_sign),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.grey,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.black,
                                        ),
                                      ),
                                    ),
                                  ),
                                  SizedBox(height: 20),
                                  TextFormField(
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Password shouldn\'t be empty';
                                      } else {
                                        return null;
                                      }
                                    },
                                    obscureText: obscured,
                                    controller: _passwordController,
                                    decoration: InputDecoration(
                                      isDense: true,
                                      hintText: 'Enter your password',
                                      hintStyle: TextStyle(color: Colors.grey),
                                      prefixIcon: Icon(Feather.lock),
                                      suffixIcon: InkWell(
                                        onTap: () {
                                          setState(() {
                                            obscured = !obscured;
                                          });
                                        },
                                        child:
                                            obscured
                                                ? Icon(
                                                  MaterialIcons.visibility_off,
                                                )
                                                : Icon(
                                                  MaterialIcons.visibility,
                                                ),
                                      ),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.grey,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.black,
                                        ),
                                      ),
                                    ),
                                  ),
                                  SizedBox(height: 10),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,

                                    children: [
                                      InkWell(
                                        onTap: () {
                                          setState(() {
                                            checked = !checked;
                                          });
                                        },
                                        child: Row(
                                          children: [
                                            Checkbox(
                                              value: checked,
                                              onChanged: (value) {
                                                setState(() {
                                                  checked = value!;
                                                });
                                              },

                                              activeColor:
                                                  color.loginButtonColor,
                                              checkColor: Colors.white,
                                            ),
                                            Text(
                                              'Remember me',
                                              style: TextStyle(
                                                color: Colors.grey[800],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),

                                      //SizedBox(width: 50),
                                      TextButton(
                                        style: ButtonStyle(
                                          foregroundColor:
                                              WidgetStatePropertyAll(
                                                color.loginButtonColor,
                                              ),
                                        ),
                                        onPressed: () {
                                          _loginBloc.add(
                                            LoginNavigateToForgetPasswordEvent(),
                                          );
                                        },
                                        child: Text('Forget Password?'),
                                      ),
                                    ],
                                  ),
                                  SizedBox(height: 30),
                                  SizedBox(
                                    width: double.infinity,
                                    height: 50,
                                    child: FilledButton(
                                      style: ButtonStyle(
                                        shape: WidgetStateProperty.all(
                                          RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              15,
                                            ),
                                          ),
                                        ),
                                        backgroundColor:
                                            WidgetStateProperty.all(
                                              color.loginButtonColor,
                                            ),
                                        foregroundColor:
                                            WidgetStateProperty.all(
                                              Colors.white,
                                            ),
                                      ),
                                      onPressed: () {
                                        if (_formKey.currentState!.validate()) {
                                          _loginBloc.add(
                                            LoginButtonPressedEvent(
                                              username:
                                                  _userNameController.text
                                                      .trim(),
                                              password:
                                                  _passwordController.text
                                                      .trim(),
                                              checked: checked,
                                            ),
                                          );
                                        }
                                      },
                                      child: Text('Log In'),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Don\'t have an account?'),
                              TextButton(
                                onPressed: () {
                                  _loginBloc.add(LoginNavigateToSignUpEvent());
                                },
                                child: Text(
                                  'Sign up',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: color.loginButtonColor,
                                  ),
                                ),
                              ),
                            ],
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
