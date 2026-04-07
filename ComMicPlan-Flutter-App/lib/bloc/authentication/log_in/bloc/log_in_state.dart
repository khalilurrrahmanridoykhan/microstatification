part of 'log_in_bloc.dart';

@immutable
abstract class LogInState {}

abstract class LoginActionState extends LogInState{}

class LogInInitial extends LogInState {}

class LoginLoadedState extends LogInState{}

class LoginFailureState extends LogInState{
  final String error;
  LoginFailureState({required this.error});
}

class LoginNavigateToSignUpState extends LoginActionState{}

class LoginNavigateToForgetPasswordState extends LoginActionState{}

class LoginSuccessState extends LoginActionState{}

class LoginLoadingState extends LogInState{}
