part of 'download_page_bloc.dart';

@immutable
abstract class DownloadPageEvent {}

class DownloadPageInitialEvent extends DownloadPageEvent {
  int projectID;
  DownloadPageInitialEvent({this.projectID = -1});
}

class DownloadPageDownloadButtonPressedEvent extends DownloadPageEvent {
  final Set<FormUrl> forms;
  DownloadPageDownloadButtonPressedEvent({required this.forms});
}
