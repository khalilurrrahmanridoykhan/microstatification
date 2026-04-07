part of 'form_page_bloc.dart';

@immutable
abstract class FormPageEvent {}

class FormPageFinalizeButtonPressed extends FormPageEvent {
  final Map<String, dynamic> answers;
  final String formUid;
  final Map<String, dynamic>? originalAnswers;

  FormPageFinalizeButtonPressed({
    required this.answers,
    required this.formUid,
    this.originalAnswers,
  });
}


