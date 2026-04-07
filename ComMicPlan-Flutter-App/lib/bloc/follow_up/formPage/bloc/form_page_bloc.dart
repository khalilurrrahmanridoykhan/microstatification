import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:flutter/foundation.dart';
import 'package:collection/collection.dart';
import 'package:hive/hive.dart';
import 'package:uuid/uuid.dart';

part 'form_page_event.dart';
part 'form_page_state.dart';

class FormPageBloc extends Bloc<FormPageEvent, FormPageState> {
  FormPageBloc() : super(FormPageInitial()) {
    on<FormPageFinalizeButtonPressed>(_onFormPageFinalizeButtonPressed);
  }

  FutureOr<void> _onFormPageFinalizeButtonPressed(
    FormPageFinalizeButtonPressed event,
    Emitter<FormPageState> emit,
  ) async {
    emit(FormPageLoadingState());
    try {
      final formsBox = await Hive.openBox('follow_up_submission');

      // Retrieve existing submissions for this form
      List<dynamic> submissions =
          formsBox.get(event.formUid, defaultValue: [])?.toList() ?? [];

      // If editing an existing submission, remove the old entry
      if (event.originalAnswers != null) {
        final existingId = event.originalAnswers?['meta']?['instanceID']?.toString();
        if (existingId != null) {
          submissions.removeWhere(
            (answer) =>
                (answer as Map)['meta']?['instanceID']?.toString() == existingId,
          );
        } else {
          const equality = DeepCollectionEquality();
          submissions.removeWhere(
            (answer) =>
                equality.equals(answer, event.originalAnswers),
          );
        }
      }

      // Ensure each submission has an instanceID
      if (event.answers['meta'] == null || event.answers['meta'].isEmpty) {
        var uuid = const Uuid();
        String rawUuid = uuid.v4();

        final now = DateTime.now().millisecondsSinceEpoch;
        final String timeHex =
            now.toRadixString(16).padLeft(12, '0').substring(0, 12);

        List<String> uuidParts = rawUuid.split('-');
        uuidParts[4] = timeHex;

        final finalInstanceID = 'uuid:${uuidParts.join('-')}';
        event.answers['meta'] = {'instanceID': finalInstanceID};
      }

      // Remove any existing submission with same instanceID before adding new
      submissions.removeWhere(
        (answer) =>
            (answer as Map)['meta']?['instanceID']?.toString() ==
            event.answers['meta']['instanceID'].toString(),
      );

      submissions.add(event.answers);

      await formsBox.put(event.formUid, submissions);

      emit(FormPageFinalizeState());
    } catch (e) {
      debugPrint('Error storing submissions: $e');
    }
  }
}
