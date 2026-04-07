part of 'download_page_bloc.dart';

abstract class DownloadPageEvent {}

class DownloadPageInitialEvent extends DownloadPageEvent {
  final int projectID;
  final int parentUid;
  final String name;
  DownloadPageInitialEvent({
    this.projectID = -1,
    this.parentUid = -1,
    this.name = '',
  });
}

class DownloadPageDownloadButtonPressedEvent extends DownloadPageEvent {
  final Set<FormUrl> forms;
  final int projectID;
  final int parentUid;
  DownloadPageDownloadButtonPressedEvent({
    required this.forms,
    this.projectID = -1,
    this.parentUid = -1,
  });
}
