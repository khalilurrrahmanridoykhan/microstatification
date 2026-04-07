part of 'wrapper_bloc.dart';

@immutable
abstract class WrapperState {}

abstract class WrapperActionState extends WrapperState{}

class WrapperInitial extends WrapperState {}

class WrapperLoadedState extends WrapperState{}

class WrapperNavigateToLoginState extends WrapperActionState{}

class WrapperNavigateToSignUpState extends WrapperActionState{}