import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:gmgi_project/bloc/backend/form/fetch_organizations.dart';
import 'package:gmgi_project/models/organization.dart';
import 'package:meta/meta.dart';

part 'all_organization_event.dart';
part 'all_organization_state.dart';

class AllOrganizationBloc
    extends Bloc<AllOrganizationEvent, AllOrganizationState> {
  AllOrganizationBloc() : super(AllOrganizationInitial()) {
    on<AllOrganizationInitialEvent>(_onAllOrganizationInitialEvent);
  }

  FutureOr<void> _onAllOrganizationInitialEvent(
    AllOrganizationInitialEvent event,
    Emitter<AllOrganizationState> emit,
  ) async {
    emit(AllOrganizationLoadingState());
    try {
      final organizations = await FetchOrganizations().fetchOrganizations();

      emit(AllOrganizationLoadedState(organizations: organizations));
    } catch (e) {
      emit(AllOrganizationErrorState(error: e.toString()));
    }
  }
}
