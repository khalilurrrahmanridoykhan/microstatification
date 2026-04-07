import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/bloc/authentication/email_confirmation/bloc/confirm_email_bloc.dart';
import 'package:gmgi_project/theme/colors/colors.dart';

class ConfirmEmail extends StatefulWidget {
  const ConfirmEmail({super.key});

  @override
  State<ConfirmEmail> createState() => _ConfirmEmailState();
}

class _ConfirmEmailState extends State<ConfirmEmail> {
  final ConfirmEmailBloc _confirmEmailbloc = ConfirmEmailBloc();
  @override
  void initState() {
    _confirmEmailbloc.add(ConfirmEmailInitialEvent());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: ConfirmEmailScreen().backgroundColor,
        body: BlocConsumer<ConfirmEmailBloc, ConfirmEmailState>(
          bloc: _confirmEmailbloc,
          listener: (context, state) {
            // TODO: implement listener
          },
          builder: (context, state) {
            switch (state.runtimeType) {
              case ConfirmEmailLoadedState:
                return Center(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.vertical,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          'Email Confirmation',
                          style: TextStyle(
                            color: ConfirmEmailScreen().textColor,
                            fontSize: 25,
                          ),
                          maxLines: 2,
                        ),
                        SizedBox(height: 20,),
                        Text(
                          'Please Confirm Your Email',
                          style: TextStyle(
                            color: ConfirmEmailScreen().textColor,
                            fontSize: 25,
                          ),
                          maxLines: 2,
                        ),
                        SizedBox(height: 60),
                        SizedBox(
                          width: 200,
                          child: FilledButton(
                            style: ButtonStyle(
                              shape: WidgetStateProperty.all(
                                RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              foregroundColor: WidgetStateProperty.all(
                                ConfirmEmailScreen().textColor,
                              ),
                              backgroundColor: WidgetStateProperty.all(
                                ConfirmEmailScreen().buttonColor,
                              ),
                            ),
                            onPressed: () {},
                            child: Text('Resend'),
                          ),
                        ),
                      ],
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
