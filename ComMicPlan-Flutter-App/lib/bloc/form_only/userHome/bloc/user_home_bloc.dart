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
    on<UserHomeAllProjectButtonPressed>(_onUserHomeAllProjectButtonPressed);
    on<UserHomeAllOrganizationButtonPressed>(
      _onUserHomeAllOrganizationButtonPressed,
    );
  }

  FutureOr<void> _onUserHomeInitialEvent(
    UserHomeInitialEvent event,
    Emitter<UserHomeState> emit,
  ) async {
    final storedUserData = await LoginAuth.getStoredUser();
    if (storedUserData?['role'] == 3) {
      emit(UserHomeLoadedProjectAdminState());
    } else if (storedUserData?['role'] == 2) {
      emit(UserHomeLoadedOrganizationAdminState());
    } else if (storedUserData?['role'] == 1) {
      emit(UserHomeLoadedSuperAdminState());
    } else {
      emit(UserHomeLoadedState());
    }
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
      await storage.delete(key: 'username');
      await storage.delete(key: 'password');
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

  FutureOr<void> _onUserHomeAllProjectButtonPressed(
    UserHomeAllProjectButtonPressed event,
    Emitter<UserHomeState> emit,
  ) {
    emit(UserHomeNavigateToAllProjectState());
  }

  FutureOr<void> _onUserHomeAllOrganizationButtonPressed(
    UserHomeAllOrganizationButtonPressed event,
    Emitter<UserHomeState> emit,
  ) {
    emit(UserHomeNavigateToAllOrganizationState());
  }
}
