import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'forget_password_event.dart';
part 'forget_password_state.dart';

class ForgetPasswordBloc
    extends Bloc<ForgetPasswordEvent, ForgetPasswordState> {
  ForgetPasswordBloc() : super(ForgetPasswordInitial()) {
    on<ForgetPasswordInitialEvent>(_onForgetPasswordInitialEvent);
    on<ForgetPasswordNavigateToLoginEvent>(
      _onForgetPasswordNavigateToLoginEvent,
    );
    on<ForgetPasswordNavigateToConfirmationEvent>(
      _onForgetPasswordNavigateToConfirmationEvent,
    );
  }

  FutureOr<void> _onForgetPasswordInitialEvent(
    ForgetPasswordInitialEvent event,
    Emitter<ForgetPasswordState> emit,
  ) {
    emit(ForgetPasswordLoadedState());
  }

  FutureOr<void> _onForgetPasswordNavigateToLoginEvent(
    ForgetPasswordNavigateToLoginEvent event,
    Emitter<ForgetPasswordState> emit,
  ) {
    emit(ForgetPasswordNavigateToLoginState());
  }

  FutureOr<void> _onForgetPasswordNavigateToConfirmationEvent(
    ForgetPasswordNavigateToConfirmationEvent event,
    Emitter<ForgetPasswordState> emit,
  ) {
    emit(ForgetPasswordNavigateToConfirmationstate());
  }
}
