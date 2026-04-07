part of 'sign_up_bloc.dart';

@immutable
abstract class SignUpState {}

abstract class SignUpActionState extends SignUpState{}

class SignUpInitial extends SignUpState {}

class SignUpLoadedState extends SignUpState{}

class SignUpNavigateToConfirmEmailState extends SignUpActionState{}

class SignUpNavigateToLoginState extends SignUpActionState{}