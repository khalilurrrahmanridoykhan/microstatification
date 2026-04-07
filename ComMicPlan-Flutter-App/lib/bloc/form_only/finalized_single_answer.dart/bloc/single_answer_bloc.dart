import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:flutter/foundation.dart';
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
    final formBox = await Hive.openBox('forms');
    final raw = formBox.get(event.answer.formUid);
    final formQuestion = Map<String, dynamic>.from(raw as Map);
    final questions = (formQuestion['questions'] as List? ?? [])
        .map((q) => Map<String, dynamic>.from(q as Map))
        .toList();
    final Map<String, dynamic> readableAnswer = {};
    for (var item in questions) {
      if (event.answer.answers[item['name'].toString()] != null) {
        if (item['type'].toString().split(' ')[0] == 'select_one') {
          for (var option in item['options']) {
            if (option['name'] ==
                event.answer.answers[item['name'].toString()]) {
              readableAnswer[item['label']] = option['label'];
              break;
            }
          }
        } else if (item['type'].toString().split(' ')[0] == 'select_multiple') {
          for (var option in item['options']) {
            var selected = event.answer.answers[item['name'].toString()].split(
              ' ',
            );
            // selected could be a list of selected names
            if (selected is List && selected.contains(option['name'])) {
              readableAnswer[item['label']] ??= ''; // initialize if null
              readableAnswer[item['label']] += '${option['label']} ';
            }
          }
        } else {
          readableAnswer[item['label']] =
              event.answer.answers[item['name'].toString()];
        }
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
    if (!Hive.isBoxOpen('forms')) {
      await Hive.openBox('forms');
    }

    // Stamp edit_start
    final now = DateTime.now();
    final offset = now.timeZoneOffset;
    final offsetHours = offset.inHours;
    final offsetMinutes = offset.inMinutes.remainder(60);
    final offsetString =
        '${offsetHours >= 0 ? '+' : '-'}${offsetHours.abs().toString().padLeft(2, '0')}:${offsetMinutes.abs().toString().padLeft(2, '0')}';
    event.answers['edit_start'] =
        '${now.toIso8601String().substring(0, 23)}$offsetString';

    final formsBox = Hive.box('forms');
    final raw = formsBox.get(event.formUid);

    final Map<String, dynamic> storedForm = Map<String, dynamic>.from(raw);

    final List<Map<String, dynamic>> questions =
        (storedForm['questions'] as List? ?? [])
            .map((q) => Map<String, dynamic>.from(q as Map))
            .toList();

    final Map<String, dynamic>? meta =
        (storedForm['meta'] is Map)
            ? Map<String, dynamic>.from(storedForm['meta'] as Map)
            : null;
    final name = storedForm['name'];

    // find index of the tapped question by 'name'
    final questionName = event.question;
    int i = 0;
    for (final qRaw in questions) {
      final n =
          (qRaw is Map && qRaw['name'] != null)
              ? qRaw['name'].toString()
              : null;
      if (n == questionName) break;
      i++;
    }
    if (i >= questions.length) i = 0;

    emit(
      SingleAnswerNavigateToFormPage(
        formUid: event.formUid,
        currentIndex: i,
        answers: event.answers,
        form: questions,
        name: name,
        formMeta: meta, // <-- already Map<String,dynamic>? and safe
      ),
    );
  }
}
