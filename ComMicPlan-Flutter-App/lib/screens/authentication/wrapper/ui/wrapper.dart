import 'package:flutter/material.dart';
import 'package:gmgi_project/screens/authentication/log_in/ui/log_in.dart';
import 'package:gmgi_project/screens/authentication/sign_up/ui/sign_up.dart';
import 'package:gmgi_project/bloc/authentication/wrapper/bloc/wrapper_bloc.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/theme/colors/colors.dart';

class Wrapper extends StatefulWidget {
  const Wrapper({super.key});

  @override
  _WrapperState createState() => _WrapperState();
}

class _WrapperState extends State<Wrapper> {
  final WrapperBloc _wrapperBloc = WrapperBloc();

  @override
  void initState() {
    _wrapperBloc.add(WrapperInitialEvent());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: WrapperScreenColors().backgroundColor,
        body: BlocConsumer<WrapperBloc, WrapperState>(
          bloc: _wrapperBloc,
          listenWhen: (previous, current) => current is WrapperActionState,
          buildWhen: (previous, current) => current is! WrapperActionState,
          //bloc: _wrapperBloc,
          listener: (context, state) {
            if (state is WrapperNavigateToLoginState) {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => LogIn()),
              );
            } else if (state is WrapperNavigateToSignUpState) {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => SignUp()),
              );
            }
          },
          builder: (context, state) {
            switch (state.runtimeType) {
              case WrapperLoadedState:
                double height = MediaQuery.of(context).size.height;
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 25, left: 25),
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Image.asset(
                            'assets/images/image.png',
                            height: 198,
                            width: 198,
                          ),
                          SizedBox(height: 50),
                          FilledButton(
                            onPressed: () {
                              _wrapperBloc.add(
                                WrapperSignUpButtonPressedEvent(),
                              );
                            },
                            style: ButtonStyle(
                              minimumSize: WidgetStateProperty.all(
                                Size(369, 80),
                              ),
                              backgroundColor: WidgetStateProperty.all(
                                WrapperScreenColors().signUpButtonColor,
                              ),
                              //foregroundColor: MaterialStateProperty.all(const Color(0xFF27B9D2)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.person_add_sharp,
                                  color: Colors.black,
                                  size: 25,
                                ),
                                SizedBox(width: 10),
                                Text(
                                  'Sign Up',
                                  style: TextStyle(
                                    color: const Color(0xFF575C5C),
                                    fontSize: 17,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(height: 20),
                          FilledButton(
                            onPressed: () {
                              _wrapperBloc.add(
                                WrapperLoginButtonPressedEvent(),
                              );
                            },
                            style: ButtonStyle(
                              minimumSize: WidgetStateProperty.all(
                                Size(369, 80),
                              ),
                              backgroundColor: WidgetStateProperty.all(
                                WrapperScreenColors().loginButtonColor,
                              ),
                              //foregroundColor: MaterialStateProperty.all(const Color(0xFF27B9D2)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.login,
                                  color: Colors.black,
                                  size: 25,
                                ),
                                SizedBox(width: 10),
                                Text(
                                  'Log In',
                                  style: TextStyle(
                                    color:
                                        WrapperScreenColors().signUpButtonColor,
                                    fontSize: 17,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(height: (height - 500)),
                          Text(
                            'ComMicPlan Version',
                            style: TextStyle(
                              fontSize: 22,
                              color: WrapperScreenColors().versionColor,
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
