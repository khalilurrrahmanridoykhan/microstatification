part of 'confirm_email_bloc.dart';

@immutable
abstract class ConfirmEmailEvent {}

class ConfirmEmailInitialEvent extends ConfirmEmailEvent{}

class ConfirmEmailResendButtonPressedEvent extends ConfirmEmailEvent{}
