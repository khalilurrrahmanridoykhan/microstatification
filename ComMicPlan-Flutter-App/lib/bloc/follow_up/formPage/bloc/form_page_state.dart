part of 'form_page_bloc.dart';

@immutable
abstract class FormPageState {}

class FormPageInitial extends FormPageState {}

abstract class FormPageAtionState extends FormPageState {}

class FormPageFinalizeState extends FormPageAtionState {}

class FormPageLoadingState extends FormPageState {}

