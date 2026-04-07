part of 'user_home_bloc.dart';

@immutable
abstract class UserHomeState {}

abstract class UserHomeActionState extends UserHomeState {}

class UserHomeInitial extends UserHomeState {}

class UserHomeLoadedState extends UserHomeState {}

class UserHomeNavigateToDownloadState extends UserHomeActionState {}

class UserHomeNavigateToFillUpState extends UserHomeActionState {}

class UserHomeLogOutSuccessState extends UserHomeActionState {}

class UserHomeNavigateToReadyToSendState extends UserHomeActionState {}

