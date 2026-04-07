import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:gmgi_project/bloc/backend/authorization/login_auth.dart';
import 'package:meta/meta.dart';

part 'user_home_event.dart';
part 'user_home_state.dart';

class UserHomeBloc extends Bloc<UserHomeEvent, UserHomeState> {
  UserHomeBloc() : super(UserHomeInitial()) {
    on<UserHomeLogOutButtonPressed>(_onUserHomeLogOutButtonPressed);
    on<UserHomeInitialEvent>(_onUserHomeInitialEvent);
    on<UserHomeFillUpButtonPressed>(_onUserHomeFillUpButtonPressed);
    on<UserHomeDownloadFormButtonPressed>(_onUserHomeDownloadFormButtonPressed);
    on<UserHomeReadyToSendButtonPressed>(_onUserHomeReadyToSendButtonPressed);
  }

  FutureOr<void> _onUserHomeInitialEvent(
    UserHomeInitialEvent event,
    Emitter<UserHomeState> emit,
  ) async {
    final storedUserData = await LoginAuth.getStoredUser();

    emit(UserHomeLoadedState());
  }

  FutureOr<void> _onUserHomeDownloadFormButtonPressed(
    UserHomeDownloadFormButtonPressed event,
    Emitter<UserHomeState> emit,
  ) {
    emit(UserHomeNavigateToDownloadState());
  }

  FutureOr<void> _onUserHomeFillUpButtonPressed(
    UserHomeFillUpButtonPressed event,
    Emitter<UserHomeState> emit,
  ) {
    emit(UserHomeNavigateToFillUpState());
  }

  FutureOr<void> _onUserHomeLogOutButtonPressed(
    UserHomeLogOutButtonPressed event,
    Emitter<UserHomeState> emit,
  ) async {
    final FlutterSecureStorage storage = FlutterSecureStorage();
    try {
      // Clear secure storage
      await storage.delete(key: 'username');
      await storage.delete(key: 'password');

      // Clear all app data including follow-up related Hive storage
      await LoginAuth.logout();

      emit(UserHomeLogOutSuccessState());
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  FutureOr<void> _onUserHomeReadyToSendButtonPressed(
    UserHomeReadyToSendButtonPressed event,
    Emitter<UserHomeState> emit,
  ) {
    emit(UserHomeNavigateToReadyToSendState());
  }
}
