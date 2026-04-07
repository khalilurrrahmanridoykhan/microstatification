part of 'wrapper_bloc.dart';

@immutable
abstract class WrapperEvent {}

class WrapperInitialEvent extends WrapperEvent{}

class WrapperLoginButtonPressedEvent extends WrapperEvent{}

class WrapperSignUpButtonPressedEvent extends WrapperEvent{}