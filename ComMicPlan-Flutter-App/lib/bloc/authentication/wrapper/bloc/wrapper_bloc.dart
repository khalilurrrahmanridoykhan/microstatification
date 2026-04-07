import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'wrapper_event.dart';
part 'wrapper_state.dart';

class WrapperBloc extends Bloc<WrapperEvent, WrapperState> {
  WrapperBloc() : super(WrapperInitial()) {
    on<WrapperInitialEvent>(_onWrapperInitialEvent);
    on<WrapperLoginButtonPressedEvent>(_onWrapperLoginButtonPressedEvent);
    on<WrapperSignUpButtonPressedEvent>(_onWrapperSignUpButtonPressedEvent);
  }

  FutureOr<void> _onWrapperInitialEvent(
    WrapperInitialEvent event,
    Emitter<WrapperState> emit,
  ) {
    emit(WrapperLoadedState());
  }

  FutureOr<void> _onWrapperLoginButtonPressedEvent(
    WrapperLoginButtonPressedEvent event,
    Emitter<WrapperState> emit,
  ) {
    emit(WrapperNavigateToLoginState());
  }

  FutureOr<void> _onWrapperSignUpButtonPressedEvent(
    WrapperSignUpButtonPressedEvent event,
    Emitter<WrapperState> emit,
  ) {
    emit(WrapperNavigateToSignUpState());
  }
}
