part of 'single_answer_bloc.dart';

@immutable
abstract class SingleAnswerEvent {}

class SingleAnswerInitialEvent extends SingleAnswerEvent {
  final Answer answer;
  SingleAnswerInitialEvent({required this.answer});
}

class SingleAnswerClickedEvent extends SingleAnswerEvent {
  final String formUid;
  final String question;
  final Map<String, dynamic> answers;
  SingleAnswerClickedEvent({
    required this.formUid,
    required this.question,
    required this.answers,
  });
}
