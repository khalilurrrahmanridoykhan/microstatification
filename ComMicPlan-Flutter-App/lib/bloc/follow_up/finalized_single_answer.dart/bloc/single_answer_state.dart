part of 'single_answer_bloc.dart';

@immutable
abstract class SingleAnswerState {}

abstract class SingleAnswerActionState extends SingleAnswerState {}

class SingleAnswerInitial extends SingleAnswerState {}

class SingleAnswerLoadedState extends SingleAnswerState {
  final Map<String, dynamic> readableAnswer;
  final Map<String, dynamic> unReadableAnswer;
  final List<dynamic> questions;
  SingleAnswerLoadedState({
    required this.readableAnswer,
    required this.unReadableAnswer,
    required this.questions,
  });
}

class SingleAnswerNavigateToFormPage extends SingleAnswerActionState {
  final String formUid;
  final int currentIndex;
  final Map<String, dynamic> answers;
  final List<dynamic> form;
  final String name;
  SingleAnswerNavigateToFormPage({
    required this.formUid,
    required this.currentIndex,
    required this.answers,
    required this.form,
    required this.name,
  });
}
