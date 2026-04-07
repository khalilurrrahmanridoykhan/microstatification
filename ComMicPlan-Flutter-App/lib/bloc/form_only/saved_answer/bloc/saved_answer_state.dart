part of 'saved_answer_bloc.dart';

@immutable
abstract class SavedAnswerState {}

abstract class SavedAnswerActionState extends SavedAnswerState {}

class SavedAnswerInitial extends SavedAnswerState {}

class SavedAnswerLoadedState extends SavedAnswerState {
  final List<Map<String, Answer>> answers;
  SavedAnswerLoadedState({required this.answers});
}

class SavedAnswerLoadingState extends SavedAnswerState {}

class SavedAnswerSubmitSuccessState extends SavedAnswerActionState {}

class SavedAnswerErrorState extends SavedAnswerState {
  final String error;
  SavedAnswerErrorState({required this.error});
}

class SavedAnswerNavigateToSingleAnswerState extends SavedAnswerActionState {
  final String name;
  final Answer answer;
  SavedAnswerNavigateToSingleAnswerState({
    required this.answer,
    required this.name,
  });
}
