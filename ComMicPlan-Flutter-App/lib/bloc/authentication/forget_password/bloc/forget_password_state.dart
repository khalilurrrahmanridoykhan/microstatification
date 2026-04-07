part of 'forget_password_bloc.dart';

@immutable
abstract class ForgetPasswordState {}

abstract class ForgetPasswordActionState extends ForgetPasswordState {}

class ForgetPasswordInitial extends ForgetPasswordState {}

class ForgetPasswordLoadedState extends ForgetPasswordState{}

class ForgetPasswordNavigateToLoginState extends ForgetPasswordActionState{}

class ForgetPasswordNavigateToConfirmationstate extends ForgetPasswordActionState{}
