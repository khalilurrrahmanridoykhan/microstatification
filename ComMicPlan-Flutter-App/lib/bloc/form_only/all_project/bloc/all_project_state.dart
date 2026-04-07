part of 'all_project_bloc.dart';

@immutable
abstract class AllProjectState {}

class AllProjectInitial extends AllProjectState {}

class AllProjectLoadedState extends AllProjectState {
  final List<Project> projects;
  AllProjectLoadedState({required this.projects});
}

class AllProjectLoadingState extends AllProjectState {}

class AllProjectErrorState extends AllProjectState {
  final String error;
  AllProjectErrorState({required this.error});
}
