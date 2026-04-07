part of 'profile_page_bloc.dart';

@immutable
abstract class ProfilePageEvent {}

class ProfilePageInitialEvent extends ProfilePageEvent {}

class ProfilePageLogOutButtonPressedEvent extends ProfilePageEvent {}

class ProfilePageSetNameOkayButtonPressedEvent extends ProfilePageEvent {
  final String name;
  ProfilePageSetNameOkayButtonPressedEvent({required this.name});
}
