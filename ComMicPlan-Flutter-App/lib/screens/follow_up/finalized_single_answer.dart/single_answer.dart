import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/bloc/follow_up/finalized_single_answer.dart/bloc/single_answer_bloc.dart';
import 'package:gmgi_project/models/answer.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/formPage.dart';
import 'package:gmgi_project/screens/follow_up/saved_answer/ui/saved_answer.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/review_screen.dart';

class SingleAnswer extends StatefulWidget {
  final String name;
  final Answer answer;

  const SingleAnswer({super.key, required this.answer, required this.name});

  @override
  State<SingleAnswer> createState() => _SingleAnswerState();
}

class _SingleAnswerState extends State<SingleAnswer> {
  final _singleAnswerBloc = SingleAnswerBloc();

  @override
  void initState() {
    _singleAnswerBloc.add(SingleAnswerInitialEvent(answer: widget.answer));
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: WillPopScope(
        onWillPop: () async {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const SavedAnswer()),
          );
          return false;
        },
        child: BlocConsumer<SingleAnswerBloc, SingleAnswerState>(
          bloc: _singleAnswerBloc,
          listenWhen:
              (previous, current) => current is SingleAnswerActionState,
          buildWhen:
              (previous, current) => current is! SingleAnswerActionState,
          listener: (context, state) {
            if (state is SingleAnswerNavigateToFormPage) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => FormPage(
                    formUid: state.formUid,
                    currentIndex: state.currentIndex,
                    answers: state.answers,
                    form: state.form,
                    name: state.name,
                    fromSingleAnswer: true,
                  ),
                ),
              );
            }
          },
          builder: (context, state) {
            if (state is SingleAnswerLoadedState) {
              return ReviewScreen(
                questions: state.questions,
                answers: state.unReadableAnswer,
                fromAppbar: true,
                onEditRequested: (xpath) {
                  final editAnswers =
                      Map<String, dynamic>.from(state.unReadableAnswer);
                  final meta = widget.answer.answers['meta'];
                  if (meta is Map) {
                    editAnswers['meta'] = Map<String, dynamic>.from(meta);
                  }
                  _singleAnswerBloc.add(
                    SingleAnswerClickedEvent(
                      formUid: widget.answer.formUid ?? '',
                      question: xpath,
                      answers: editAnswers,
                    ),
                  );
                },
              );
            } else {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }
          },
        ),
      ),
    );
  }
}
