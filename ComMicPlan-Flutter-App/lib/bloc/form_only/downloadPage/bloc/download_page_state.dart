part of 'download_page_bloc.dart';

@immutable
abstract class DownloadPageState {}

abstract class DownloadPageActionState extends DownloadPageState {}

class DownloadPageInitial extends DownloadPageState {}

class DownloadPageLoadedState extends DownloadPageState {
  final List<FormUrl> forms;
  DownloadPageLoadedState({required this.forms});
}

class DownloadPageLoadingState extends DownloadPageState {}

class DownloadPageFailureState extends DownloadPageActionState {
  final String error;
  DownloadPageFailureState({required this.error});
}

class DownloadPageDownloadSuccessState extends DownloadPageActionState {}


