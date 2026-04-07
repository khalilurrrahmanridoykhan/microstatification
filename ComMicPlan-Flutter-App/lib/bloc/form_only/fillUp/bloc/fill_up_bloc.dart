import 'dart:async';

import 'package:bloc/bloc.dart';

import 'package:hive/hive.dart';
import 'package:meta/meta.dart';

part 'fill_up_event.dart';
part 'fill_up_state.dart';

class FillUpBloc extends Bloc<FillUpEvent, FillUpState> {
  FillUpBloc() : super(FillUpInitial()) {
    on<FillUpInitialEvent>(_onFillUpInitialEvent);
  }

  FutureOr<void> _onFillUpInitialEvent(
    FillUpInitialEvent event,
    Emitter<FillUpState> emit,
  ) async {
    emit(FillUpLoadingState());
    try {
      if (!Hive.isBoxOpen('forms')) {
        await Hive.openBox('forms');
      }

      final formsBox = Hive.box('forms');

      final storedForm = formsBox.values.toList();
      //print(storedForm);
      List<dynamic> forms = [];

      //print(storedForm);
      for (var item in storedForm) {
        print(item);
        if (item is Map) {
          print(item['uid']);
          forms.add(item);
        } else {
          print("⚠️ Found unexpected item type: ${item.runtimeType}");
        }
      }
      //print(formNames[0]);
      // Optionally sort
      forms.sort(
        (a, b) => a['name'].toString().toLowerCase().compareTo(
          b['name'].toString().toLowerCase(),
        ),
      );

      emit(FillUpLoadedState(form: forms));
    } catch (e) {
      print('Error loading forms: $e');
      emit(FillUpInitial()); // fallback or create a FillUpErrorState
    }
  }
}
