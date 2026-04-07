import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:flutter/foundation.dart';
import 'package:gmgi_project/bloc/backend/form/submit_form.dart';
import 'package:hive/hive.dart';
import 'package:gmgi_project/models/answer.dart';

part 'saved_answer_event.dart';
part 'saved_answer_state.dart';

class SavedAnswerBloc extends Bloc<SavedAnswerEvent, SavedAnswerState> {
  SavedAnswerBloc() : super(SavedAnswerInitial()) {
    on<SavedAnswerInitialEvent>(_onSavedAnswerInitialEvent);
    on<SavedAnswerSubmitButtonPressedEvent>(
      _onSavedAnswerSubmitButtonPressedEvent,
    );
    on<SavedAnswerSingleSubmissionClickedEvent>(
      _onSavedAnswerSingleSubmissionClickedEvent,
    );
    on<SavedAnswerDeleteButtonPressedEvent>(
      _onSavedAnswerDeleteButtonPressedEvent,
    );
  }

  FutureOr<void> _onSavedAnswerInitialEvent(
    SavedAnswerInitialEvent event,
    Emitter<SavedAnswerState> emit,
  ) async {
    emit(SavedAnswerLoadingState());
    try {
      final submissionBox = await Hive.openBox('submission');
      final formsBox = await Hive.openBox('forms');

      final List<Map<String, Answer>> groupedAnswers = [];

      for (var key in submissionBox.keys) {
        final formUid = key.toString();
        final submissions = submissionBox.get(formUid, defaultValue: []) ?? [];

        // Get form name from stored form data
        final form = formsBox.get(formUid);
        final formName = form?['name']?.toString() ?? 'Unknown Form';

        if (submissions is List) {
          for (var submission in submissions) {
            final answer = Answer(
              formUid: formUid,
              answers: Map<String, dynamic>.from(submission),
            );
            groupedAnswers.add({formName: answer});
          }
        }
      }

      emit(SavedAnswerLoadedState(answers: groupedAnswers));
    } catch (e) {
      debugPrint('Error fetching submissions: $e');
      emit(SavedAnswerErrorState(error: e.toString()));
    }
  }

  FutureOr<void> _onSavedAnswerSubmitButtonPressedEvent(
    SavedAnswerSubmitButtonPressedEvent event,
    Emitter<SavedAnswerState> emit,
  ) async {
    emit(SavedAnswerLoadingState());
    try {
      for (var answer in event.answers) {
        final formUid = answer.formUid;
        print(answer);

        final submitter = SubmitForm(
          answers: Map<String, dynamic>.from(answer.answers),
          formId: formUid,
        );

        await submitter.submitForm(); // Submit to backend
      }
      emit(SavedAnswerSubmitSuccessState());
      add(SavedAnswerInitialEvent());
    } catch (e) {
      debugPrint('Error submitting to server: $e');
      emit(SavedAnswerErrorState(error: e.toString()));
    }
  }

  FutureOr<void> _onSavedAnswerSingleSubmissionClickedEvent(
    SavedAnswerSingleSubmissionClickedEvent event,
    Emitter<SavedAnswerState> emit,
  ) {
    emit(
      SavedAnswerNavigateToSingleAnswerState(
        answer: event.answer,
        name: event.name,
      ),
    );
  }

  FutureOr<void> _onSavedAnswerDeleteButtonPressedEvent(
    SavedAnswerDeleteButtonPressedEvent event,
    Emitter<SavedAnswerState> emit,
  ) async {
    print(event.answers.length);
    emit(SavedAnswerLoadingState());
    try {
      final formsBox = await Hive.openBox('submission');

      for (var answer in event.answers) {
        final formUid = answer.formUid;

        List<dynamic> submissions =
            formsBox.get(formUid, defaultValue: []) ?? [];
        debugPrint(submissions.length.toString());
        if (submissions.isNotEmpty) {
          // Get the instanceID from the answer's meta field
          final instanceID = answer.answers['meta']?['instanceID']?.toString();

          submissions.removeWhere((value) {
            debugPrint(answer.answers['meta']['instanceID'].toString());
            debugPrint(value['meta']['instanceID'].toString());
            return value['meta']['instanceID'].toString() == instanceID;
          });

          await formsBox.put(formUid, submissions);
        } else {
          debugPrint('No submissions found for $formUid');
        }
      }
      add(SavedAnswerInitialEvent());
    } catch (e) {
      emit(SavedAnswerErrorState(error: e.toString()));
    }
  }
}
