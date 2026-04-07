import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:gmgi_project/bloc/backend/authorization/login_auth.dart';
import 'package:gmgi_project/models/user.dart';
import 'package:hive/hive.dart';
import 'package:meta/meta.dart';

part 'profile_page_event.dart';
part 'profile_page_state.dart';

class ProfilePageBloc extends Bloc<ProfilePageEvent, ProfilePageState> {
  ProfilePageBloc() : super(ProfilePageInitial()) {
    on<ProfilePageInitialEvent>(_onProfilePageInitialEvent);
    on<ProfilePageLogOutButtonPressedEvent>(
      _onProfilePageLogOutButtonPressedEvent,
    );
    on<ProfilePageSetNameOkayButtonPressedEvent>(
      _onProfilePageSetNameOkayButtonPressedEvent,
    );
  }

  FutureOr<void> _onProfilePageInitialEvent(
    ProfilePageInitialEvent event,
    Emitter<ProfilePageState> emit,
  ) async {
    emit(ProfilePageLoadingState());
    try {
      final user = await LoginAuth.getStoredUserModel();
      if (user != null) {
        emit(ProfilePageLoadedState(userInfo: user));
      } else {
        emit(ProfilePageLoadedFailureState(error: "No user data found"));
      }
    } catch (e) {
      emit(ProfilePageLoadedFailureState(error: e.toString()));
    }
  }

  FutureOr<void> _onProfilePageLogOutButtonPressedEvent(
    ProfilePageLogOutButtonPressedEvent event,
    Emitter<ProfilePageState> emit,
  ) async {
    emit(ProfilePageLoadingState());
    try {
      await LoginAuth.logout();
      // You might want to emit a special state to notify UI to redirect to login page
      emit(ProfilePageLogOutSuccessState());
    } catch (e) {
      emit(ProfilePageLoadedFailureState(error: e.toString()));
    }
  }

  FutureOr<void> _onProfilePageSetNameOkayButtonPressedEvent(
    ProfilePageSetNameOkayButtonPressedEvent event,
    Emitter<ProfilePageState> emit,
  ) async {
    try {
      // Open Hive box (if not already open)
      final box = await Hive.openBox('appData'); // Open the box explicitly

      // Save the new name
      await box.put('submitAs', event.name);

      // Emit success state
      emit(ProfilePageNameSetSuccessState(event.name));
    } catch (e) {
      // Handle error
      emit(ProfilePageNameSetErrorState(e.toString()));
    }
  }
}
