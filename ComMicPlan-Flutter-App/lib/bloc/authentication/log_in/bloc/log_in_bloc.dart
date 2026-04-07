import 'dart:async';
import 'package:bloc/bloc.dart';
import 'package:gmgi_project/bloc/backend/authorization/login_auth.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:meta/meta.dart';

part 'log_in_event.dart';
part 'log_in_state.dart';

class LogInBloc extends Bloc<LogInEvent, LogInState> {
  LogInBloc() : super(LogInInitial()) {
    on<LoginInitialEvent>(_onLoginInitialEvent);
    on<LoginNavigateToSignUpEvent>(_onLoginNavigateToSignUpEvent);
    on<LoginNavigateToForgetPasswordEvent>(
      _onLoginNavigateToForgetPasswordEvent,
    );
    on<LoginButtonPressedEvent>(_onLoginButtonPressedEvent);
  }

  FutureOr<void> _onLoginInitialEvent(
    LoginInitialEvent event,
    Emitter<LogInState> emit,
  ) {
    emit(LoginLoadedState());
  }

  FutureOr<void> _onLoginNavigateToSignUpEvent(
    LoginNavigateToSignUpEvent event,
    Emitter<LogInState> emit,
  ) {
    emit(LoginNavigateToSignUpState());
  }

  FutureOr<void> _onLoginNavigateToForgetPasswordEvent(
    LoginNavigateToForgetPasswordEvent event,
    Emitter<LogInState> emit,
  ) {
    emit(LoginNavigateToForgetPasswordState());
  }

  FutureOr<void> _onLoginButtonPressedEvent(
    LoginButtonPressedEvent event,
    Emitter<LogInState> emit,
  ) async {
    emit(LoginLoadingState());
    try {
      final success = await LoginAuth.loginUser(event.username, event.password);
      // Assuming loginUser returns a boolean indicating success
      if (success) {
        // Retrieve token and user data after successful login if needed
        final token = await LoginAuth.getStoredToken();
        final userData = await LoginAuth.getStoredUser();

        if (token == null || userData == null) {
          emit(LoginFailureState(error: 'Invalid response data'));
          return;
        }

        // Store data in Hive
        final userBox = await Hive.openBox('user_data');
        await userBox.put('token', token);
        await userBox.put('user', userData);

        // Verify stored token
        final storedToken = await LoginAuth.getStoredToken();
        print('Stored token: $storedToken');

        emit(LoginSuccessState());
      } else {
        emit(LoginFailureState(error: 'Login failed: Invalid credentials'));
      }
    } catch (e) {
      emit(LoginFailureState(error: e.toString()));
    }
  }
}
