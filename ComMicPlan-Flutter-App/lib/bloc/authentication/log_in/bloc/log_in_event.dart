part of 'log_in_bloc.dart';

@immutable
abstract class LogInEvent {}

class LoginInitialEvent extends LogInEvent{}

class LoginNavigateToSignUpEvent extends LogInEvent{}

class LoginNavigateToForgetPasswordEvent extends LogInEvent{}

class LoginButtonPressedEvent extends LogInEvent{
  final String username;
  final String password;
  final bool checked;
  LoginButtonPressedEvent({required this.username,required this.password,required this.checked});
}
