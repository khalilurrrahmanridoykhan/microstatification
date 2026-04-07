part of 'password_reset_bloc.dart';

@immutable
abstract class PasswordResetEvent {}

class PasswordResetInitialEvent extends PasswordResetEvent{}

class PasswordResetSubmitButtonPressedEvent extends PasswordResetEvent{}