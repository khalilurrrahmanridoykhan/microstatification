part of 'forget_password_bloc.dart';

@immutable
abstract class ForgetPasswordEvent {}

class ForgetPasswordInitialEvent extends ForgetPasswordEvent{}

class ForgetPasswordNavigateToLoginEvent extends ForgetPasswordEvent{}

class ForgetPasswordNavigateToConfirmationEvent extends ForgetPasswordEvent{}
