import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'confirm_email_event.dart';
part 'confirm_email_state.dart';

class ConfirmEmailBloc extends Bloc<ConfirmEmailEvent, ConfirmEmailState> {
  ConfirmEmailBloc() : super(ConfirmEmailInitial()) {
    on<ConfirmEmailInitialEvent>(_onCoinfirmEmailInitial);
  }

  FutureOr<void> _onCoinfirmEmailInitial(
    ConfirmEmailInitialEvent event,
    Emitter<ConfirmEmailState> emit,
  ) {
    emit(ConfirmEmailLoadedState());
  }
}
