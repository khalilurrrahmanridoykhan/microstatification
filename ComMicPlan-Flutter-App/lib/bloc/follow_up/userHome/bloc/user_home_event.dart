part of 'user_home_bloc.dart';

@immutable
abstract class UserHomeEvent {}

class UserHomeInitialEvent extends UserHomeEvent {}

class UserHomeDownloadFormButtonPressed extends UserHomeEvent {}

class UserHomeFillUpButtonPressed extends UserHomeEvent {}

class UserHomeLogOutButtonPressed extends UserHomeEvent {}

class UserHomeReadyToSendButtonPressed extends UserHomeEvent {}

class UserHomeAllProjectButtonPressed extends UserHomeEvent {}

class UserHomeAllOrganizationButtonPressed extends UserHomeEvent {}
