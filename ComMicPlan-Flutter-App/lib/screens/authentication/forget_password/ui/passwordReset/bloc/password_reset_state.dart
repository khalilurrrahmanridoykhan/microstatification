part of 'password_reset_bloc.dart';

@immutable
abstract class PasswordResetState {}

abstract class PasswordResetActionState extends PasswordResetState{}

class PasswordResetInitial extends PasswordResetState {}

class PasswordResetLoadedState extends PasswordResetState{}

class PasswordResetFailureState extends PasswordResetState{}

class PasswordResetSuccessState extends PasswordResetActionState{}

