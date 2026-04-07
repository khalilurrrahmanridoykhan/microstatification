import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:flutter/foundation.dart';
import 'package:gmgi_project/bloc/backend/form/submit_form.dart';
import 'package:gmgi_project/models/answer.dart';
import 'package:gmgi_project/utils/map_utils.dart';
import 'package:hive/hive.dart';

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
      final submissionBox = await Hive.openBox('follow_up_submission');
      final formsBox = await Hive.openBox('follow_up');

      final List<Map<String, Answer>> groupedAnswers = [];

      for (var key in submissionBox.keys) {
        final formUid = key.toString();
        final submissions = submissionBox.get(formUid, defaultValue: []) ?? [];

        // Get form name from stored form data
        final form = formsBox.get(formUid);
        final formName = form?['name']?.toString() ?? 'Unknown Form';

        if (submissions is List) {
          for (var submission in submissions) {
            if (submission is Map) {
              final normalizedSubmission = deepConvertToStringKeyedMap(
                Map<dynamic, dynamic>.from(submission),
              );
              final answer = Answer(
                formUid: formUid,
                answers: normalizedSubmission,
              );
              groupedAnswers.add({formName: answer});
            }
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
    final submissionBox = await Hive.openBox('follow_up_submission');
    final mainSubmissionBox = await Hive.openBox('submission');
    final formsBox = await Hive.openBox('follow_up');
    try {
      for (var answer in event.answers) {
        final formUid = answer.formUid;
        final answerMap = Map<String, dynamic>.from(answer.answers);
        print(answer);

        final submitter = SubmitForm(answers: answerMap, formId: formUid);

        await submitter.submitForm(); // Submit to backend
        final submissions = List<dynamic>.from(
          submissionBox.get(formUid, defaultValue: []) ?? [],
        );
        final instanceID = answerMap['meta']?['instanceID']?.toString();

        submissions.removeWhere((value) {
          if (value is! Map) return false;
          final valueMap = deepConvertToStringKeyedMap(
            Map<dynamic, dynamic>.from(value),
          );
          final valueInstanceID = valueMap['meta']?['instanceID']?.toString();

          if (instanceID != null && valueInstanceID != null) {
            return valueInstanceID == instanceID;
          }

          if (instanceID == null) {
            return mapEquals(valueMap, answerMap);
          }

          return false;
        });

        if (submissions.isEmpty) {
          await submissionBox.delete(formUid);
        } else {
          await submissionBox.put(formUid, submissions);
        }

        final mainSubmissions = List<dynamic>.from(
          mainSubmissionBox.get(formUid, defaultValue: []) ?? [],
        );

        mainSubmissions.removeWhere((value) {
          if (value is! Map) return false;
          final valueMap = deepConvertToStringKeyedMap(
            Map<dynamic, dynamic>.from(value),
          );
          final valueInstanceID = valueMap['meta']?['instanceID']?.toString();

          if (instanceID != null && valueInstanceID != null) {
            return valueInstanceID == instanceID;
          }

          if (instanceID == null) {
            return mapEquals(valueMap, answerMap);
          }

          return false;
        });

        if (mainSubmissions.isEmpty) {
          await mainSubmissionBox.delete(formUid);
        } else {
          await mainSubmissionBox.put(formUid, mainSubmissions);
        }
        await formsBox.delete(answer.formUid);
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
      final formsBox = await Hive.openBox('follow_up_submission');

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
