import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:gmgi_project/models/answer.dart';
import 'package:hive/hive.dart';
import 'package:meta/meta.dart';

part 'single_answer_event.dart';
part 'single_answer_state.dart';

class SingleAnswerBloc extends Bloc<SingleAnswerEvent, SingleAnswerState> {
  SingleAnswerBloc() : super(SingleAnswerInitial()) {
    on<SingleAnswerInitialEvent>(_onSingleAnswerInitialEvent);
    on<SingleAnswerClickedEvent>(_onSingleAnswerClickedEvent);
  }

  FutureOr<void> _onSingleAnswerInitialEvent(
    SingleAnswerInitialEvent event,
    Emitter<SingleAnswerState> emit,
  ) async {
    final formBox = await Hive.openBox('follow_up');
    final raw = formBox.get(event.answer.formUid);
    final formQuestion = Map<String, dynamic>.from(raw as Map);
    final questions = (formQuestion['questions'] as List? ?? [])
        .map((q) => Map<String, dynamic>.from(q as Map))
        .toList();
    final Map<String, dynamic> readableAnswer = {};
    for (var item in questions) {
      final name = item['name'].toString();
      final answer = event.answer.answers[name];
      if (answer == null) continue;

      final type = item['type'].toString().split(' ')[0];
      if (type == 'select_one') {
        for (var option in item['options']) {
          if (option['name'] == answer) {
            readableAnswer[item['label']] = option['label'];
            break;
          }
        }
      } else if (type == 'select_multiple') {
        final tokens = answer.toString().split(' ');
        for (var option in item['options']) {
          if (tokens.contains(option['name'])) {
            readableAnswer[item['label']] ??= '';
            readableAnswer[item['label']] += '${option['label']} ';
          }
        }
      } else {
        readableAnswer[item['label']] = answer;
      }
    }

    final unReadableAnswer = Map<String, dynamic>.from(event.answer.answers);
    unReadableAnswer.remove('start');
    unReadableAnswer.remove('end');
    //unReadableAnswer.remove('meta');
    unReadableAnswer.remove('edit_start');
    unReadableAnswer.remove('_id');

    emit(
      SingleAnswerLoadedState(
        readableAnswer: readableAnswer,
        unReadableAnswer: unReadableAnswer,
        questions: questions,
      ),
    );
  }

  FutureOr<void> _onSingleAnswerClickedEvent(
    SingleAnswerClickedEvent event,
    Emitter<SingleAnswerState> emit,
  ) async {
    if (!Hive.isBoxOpen('follow_up')) {
      await Hive.openBox('follow_up');
    }

    final now = DateTime.now();
    final offset = now.timeZoneOffset;
    final offsetHours = offset.inHours;
    final offsetMinutes = offset.inMinutes.remainder(60);
    final offsetString =
        '${offsetHours >= 0 ? '+' : '-'}${offsetHours.abs().toString().padLeft(2, '0')}:${offsetMinutes.abs().toString().padLeft(2, '0')}';
    event.answers['edit_start'] =
        '${now.toIso8601String().substring(0, 23)}$offsetString';

    final formsBox = Hive.box('follow_up');
    final rawForm = formsBox.get(event.formUid) as Map;
    final storedForm = Map<String, dynamic>.from(rawForm);
    final questionName = event.question; // assuming this is a String

    final List<Map<String, dynamic>> questions =
        (storedForm['questions'] as List? ?? [])
            .map((q) => Map<String, dynamic>.from(q as Map))
            .toList();
    final name = storedForm['name'];
    int i = 0;
    for (var question in questions) {
      if (question['name'] == questionName) {
        break;
      }
      i++;
    }
    emit(
      SingleAnswerNavigateToFormPage(
        formUid: event.formUid,
        currentIndex: i,
        answers: event.answers,
        form: questions,
        name: name,
      ),
    );
  }
}
