import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:gmgi_project/bloc/backend/authorization/signup_auth.dart';
import 'package:meta/meta.dart';

part 'sign_up_event.dart';
part 'sign_up_state.dart';

class SignUpBloc extends Bloc<SignUpEvent, SignUpState> {
  SignUpBloc() : super(SignUpInitial()) {
    on<SignUpInitialEvent>(_onSignUpInitialEvent);
    on<SignUpButtonPressedEvent>(_onSignUpButtonPressedEvent);
    on<SignUpNavigateToLogInbuttonPressed>(
      _onSignUpNavigateToLogInbuttonPressed,
    );
  }

  FutureOr<void> _onSignUpInitialEvent(
    SignUpInitialEvent event,
    Emitter<SignUpState> emit,
  ) {
    emit(SignUpLoadedState());
  }

  FutureOr<void> _onSignUpButtonPressedEvent(
    SignUpButtonPressedEvent event,
    Emitter<SignUpState> emit,
  ) async {
    try {
      final response = await SignupAuth.signUpUser(
        event.username,
        event.email,
        event.firstName,
        event.lastName,
        event.password,
      );
      if (response) {
        emit(SignUpNavigateToLoginState());
      }
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  FutureOr<void> _onSignUpNavigateToLogInbuttonPressed(
    SignUpNavigateToLogInbuttonPressed event,
    Emitter<SignUpState> emit,
  ) {
    emit(SignUpNavigateToLoginState());
  }
}
