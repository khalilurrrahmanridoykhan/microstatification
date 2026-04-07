part of 'profile_page_bloc.dart';

@immutable
abstract class ProfilePageState {}

abstract class ProfilePageActionState extends ProfilePageState {}

class ProfilePageInitial extends ProfilePageState {}

class ProfilePageLoadedState extends ProfilePageState {
  final UserModel userInfo;
  ProfilePageLoadedState({required this.userInfo});
}

class ProfilePageLoadingState extends ProfilePageState {}

class ProfilePageLoadedFailureState extends ProfilePageState {
  final String error;
  ProfilePageLoadedFailureState({required this.error});
}

class ProfilePageLogOutSuccessState extends ProfilePageActionState {}

class ProfilePageNameSetSuccessState extends ProfilePageState {
  final String name;
  ProfilePageNameSetSuccessState(this.name);
}

class ProfilePageNameSetErrorState extends ProfilePageState {
  final String error;
  ProfilePageNameSetErrorState(this.error);
}
