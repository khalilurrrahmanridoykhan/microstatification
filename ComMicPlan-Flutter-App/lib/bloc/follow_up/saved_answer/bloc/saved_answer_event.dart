part of 'saved_answer_bloc.dart';

@immutable
abstract class SavedAnswerEvent {}

class SavedAnswerInitialEvent extends SavedAnswerEvent {}

class SavedAnswerSubmitButtonPressedEvent extends SavedAnswerEvent {
  final List<Answer> answers;
  SavedAnswerSubmitButtonPressedEvent({required this.answers});
}

class SavedAnswerSingleSubmissionClickedEvent extends SavedAnswerEvent {
  final String name;
  final Answer answer;
  SavedAnswerSingleSubmissionClickedEvent({
    required this.answer,
    required this.name,
  });
}

class SavedAnswerDeleteButtonPressedEvent extends SavedAnswerEvent {
  final List<Answer> answers;
  SavedAnswerDeleteButtonPressedEvent({required this.answers});
}
