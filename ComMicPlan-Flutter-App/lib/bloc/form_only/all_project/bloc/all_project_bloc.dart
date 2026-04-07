import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:gmgi_project/bloc/backend/form/fetch_projects.dart';
import 'package:gmgi_project/models/project.dart';
import 'package:meta/meta.dart';

part 'all_project_event.dart';
part 'all_project_state.dart';

class AllProjectBloc extends Bloc<AllProjectEvent, AllProjectState> {
  AllProjectBloc() : super(AllProjectInitial()) {
    on<AllProjectInitialEvent>(_onAllProjectInitialEvent);
  }

  FutureOr<void> _onAllProjectInitialEvent(
    AllProjectInitialEvent event,
    Emitter<AllProjectState> emit,
  ) async {
    emit(AllProjectLoadingState());
    try {
      List<Project> projects;
      if (event.organizationId == -1) {
        projects = await ProjectFetch().fetchProjects();
      } else {
        projects = await ProjectFetch().fetchProjectsByOrganization(
          event.organizationId,
        );
      }

      emit(AllProjectLoadedState(projects: projects));
    } catch (e) {
      emit(AllProjectErrorState(error: e.toString()));
    }
  }
}
