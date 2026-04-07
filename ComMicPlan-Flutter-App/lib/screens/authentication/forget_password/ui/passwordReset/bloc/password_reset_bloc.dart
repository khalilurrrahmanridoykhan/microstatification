import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'password_reset_event.dart';
part 'password_reset_state.dart';

class PasswordResetBloc extends Bloc<PasswordResetEvent, PasswordResetState> {
  PasswordResetBloc() : super(PasswordResetInitial()) {
    on<PasswordResetInitialEvent>(_onPasswordResetInitialEvent);
    on<PasswordResetSubmitButtonPressedEvent>(
      _onPasswordResetSubmitButtonPressedEvent,
    );
  }

  FutureOr<void> _onPasswordResetInitialEvent(
    PasswordResetInitialEvent event,
    Emitter<PasswordResetState> emit,
  ) {
    emit(PasswordResetLoadedState());
  }

  FutureOr<void> _onPasswordResetSubmitButtonPressedEvent(
    PasswordResetSubmitButtonPressedEvent event,
    Emitter<PasswordResetState> emit,
  ) {
    emit(PasswordResetSuccessState());
  }
}
