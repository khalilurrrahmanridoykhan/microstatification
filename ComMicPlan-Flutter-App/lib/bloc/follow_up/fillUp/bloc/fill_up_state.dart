part of 'fill_up_bloc.dart';

@immutable
abstract class FillUpState {}

class FillUpInitial extends FillUpState {}

class FillUpLoadedState extends FillUpState {
  final List<dynamic> form;
  FillUpLoadedState({required this.form});
}

class FillUpLoadingState extends FillUpState {}
