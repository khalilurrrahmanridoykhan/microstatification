part of 'sign_up_bloc.dart';

@immutable
abstract class SignUpEvent {}

class SignUpInitialEvent extends SignUpEvent {}

class SignUpButtonPressedEvent extends SignUpEvent {
  final String username;
  final String email;
  final String password;
  final String firstName;
  final String lastName;
  SignUpButtonPressedEvent({
    required this.username,
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
  });
}

class SignUpNavigateToLogInbuttonPressed extends SignUpEvent {}
