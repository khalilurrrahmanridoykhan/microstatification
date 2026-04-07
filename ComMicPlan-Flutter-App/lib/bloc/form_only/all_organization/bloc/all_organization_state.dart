part of 'all_organization_bloc.dart';

@immutable
abstract class AllOrganizationState {}

class AllOrganizationInitial extends AllOrganizationState {}

class AllOrganizationLoadedState extends AllOrganizationState {
  final List<Organization> organizations;
  AllOrganizationLoadedState({required this.organizations});
}

class AllOrganizationLoadingState extends AllOrganizationState {}

class AllOrganizationErrorState extends AllOrganizationState {
  final String error;
  AllOrganizationErrorState({required this.error});
}
