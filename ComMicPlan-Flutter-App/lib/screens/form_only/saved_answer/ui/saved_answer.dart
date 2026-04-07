import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/bloc/form_only/saved_answer/bloc/saved_answer_bloc.dart';
import 'package:gmgi_project/models/answer.dart';
import 'package:gmgi_project/screens/form_only/finalized_single_answer.dart/single_answer.dart';
import 'package:gmgi_project/screens/form_only/userHome/ui/userHome.dart';
import 'package:intl/intl.dart';

class SavedAnswer extends StatefulWidget {
  const SavedAnswer({super.key});

  @override
  State<SavedAnswer> createState() => _SavedAnswerState();
}

class _SavedAnswerState extends State<SavedAnswer> {
  final _savedAnswerBloc = SavedAnswerBloc();
  final List<Answer> _selectedAnswers = [];
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    _savedAnswerBloc.add(SavedAnswerInitialEvent());
    super.initState();
  }

  @override
  void dispose() {
    _savedAnswerBloc.close();
    _searchController.dispose();
    super.dispose();
  }

  void _toggleAnswerSelection(Answer answer) {
    setState(() {
      _selectedAnswers.contains(answer)
          ? _selectedAnswers.remove(answer)
          : _selectedAnswers.add(answer);
    });
  }

  void _selectAll(List<Answer> allAnswers) {
    setState(() {
      _selectedAnswers.clear();
      _selectedAnswers.addAll(allAnswers);
    });
  }

  void _deselectAll() {
    setState(() => _selectedAnswers.clear());
  }

  void _showSuccessDialog(BuildContext context) {
    showDialog(
      context: context,
      builder:
          (_) => AlertDialog(
            backgroundColor: Colors.white,
            title: Text(
              'Submission Completed',
              style: TextStyle(color: Colors.blue[300]),
            ),
            content: const Text(
              'Your selected answers have been submitted successfully.',
              style: TextStyle(color: Colors.black87),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text('OK', style: TextStyle(color: Colors.blue[300])),
              ),
            ],
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: WillPopScope(
        onWillPop: () async {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) => UserHome()),
            (route) => false,
          );
          return false;
        },
        child: Scaffold(
          appBar: AppBar(
            backgroundColor: Colors.blue[300],
            foregroundColor: Colors.white,
            title: const Text(
              'Ready to Send',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            elevation: 2,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (context) => UserHome()),
                  (route) => false,
                );
              },
            ),
          ),
          backgroundColor: const Color(0xFFF5F5F5),
          body: BlocConsumer<SavedAnswerBloc, SavedAnswerState>(
            bloc: _savedAnswerBloc,
            listenWhen:
                (previous, current) =>
                    current is SavedAnswerActionState ||
                    current is SavedAnswerErrorState ||
                    current is SavedAnswerSubmitSuccessState,
            buildWhen:
                (previous, current) => current is! SavedAnswerActionState,
            listener: (context, state) {
              if (state is SavedAnswerNavigateToSingleAnswerState) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder:
                        (context) => SingleAnswer(
                          answer: state.answer,
                          name: state.name,
                        ),
                  ),
                );
              } else if (state is SavedAnswerErrorState) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Error: ${state.error}')),
                );
              } else if (state is SavedAnswerSubmitSuccessState) {
                _showSuccessDialog(context);
              }
            },
            builder: (context, state) {
              if (state is SavedAnswerLoadingState) {
                return const Center(child: CircularProgressIndicator());
              } else if (state is SavedAnswerLoadedState) {
                final allAnswers = state.answers;
                final filteredAnswers =
                    allAnswers
                        .where(
                          (entry) => entry.keys.first.toLowerCase().contains(
                            _searchQuery.toLowerCase(),
                          ),
                        )
                        .toList();

                return allAnswers.isNotEmpty
                    ? Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
                          child: TextField(
                            controller: _searchController,
                            decoration: InputDecoration(
                              hintText: 'Search form name...',
                              prefixIcon: const Icon(Icons.search),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              filled: true,
                              fillColor: Colors.white,
                            ),
                            onChanged: (value) {
                              setState(() => _searchQuery = value.trim());
                            },
                          ),
                        ),
                        if (filteredAnswers.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12.0,
                              vertical: 6,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('${_selectedAnswers.length} selected'),
                                ElevatedButton.icon(
                                  icon: Icon(
                                    _selectedAnswers.length ==
                                            filteredAnswers
                                                .map((e) => e.values.first)
                                                .length
                                        ? Icons.clear_all
                                        : Icons.select_all,
                                  ),
                                  label: Text(
                                    _selectedAnswers.length ==
                                            filteredAnswers
                                                .map((e) => e.values.first)
                                                .length
                                        ? "Deselect All"
                                        : "Select All",
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.blue[300],
                                    foregroundColor: Colors.white,
                                  ),
                                  onPressed: () {
                                    final allCurrentAnswers =
                                        filteredAnswers
                                            .map((entry) => entry.values.first)
                                            .toList();
                                    if (_selectedAnswers.length ==
                                        allCurrentAnswers.length) {
                                      _deselectAll();
                                    } else {
                                      _selectAll(allCurrentAnswers);
                                    }
                                  },
                                ),
                              ],
                            ),
                          ),
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.all(12),
                            itemCount: filteredAnswers.length,
                            itemBuilder: (context, index) {
                              final entry = filteredAnswers[index];
                              final formName = entry.keys.first;
                              final answer = entry[formName]!;
                              final isSelected = _selectedAnswers.contains(
                                answer,
                              );

                              final dateTime = DateTime.parse(
                                answer.answers['end'],
                              );
                              final finalizeTime = DateFormat(
                                'EEE, MMM d, yyyy • h:mm a',
                              ).format(dateTime);

                              return AnimatedContainer(
                                duration: const Duration(milliseconds: 300),
                                margin: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  border:
                                      isSelected
                                          ? Border.all(
                                            color: Colors.blueAccent,
                                            width: 2,
                                          )
                                          : null,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Material(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  elevation: 2,
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.symmetric(
                                      vertical: 12,
                                      horizontal: 16,
                                    ),
                                    leading: Transform.scale(
                                      scale: 1.5,
                                      child: Checkbox(
                                        value: isSelected,
                                        onChanged:
                                            (_) =>
                                                _toggleAnswerSelection(answer),
                                        shape: const CircleBorder(),
                                        activeColor: Colors.blue,
                                        side: BorderSide(
                                          color:
                                              isSelected
                                                  ? Colors.blue
                                                  : Colors.grey,
                                          width: 2,
                                        ),
                                        materialTapTargetSize:
                                            MaterialTapTargetSize.padded,
                                      ),
                                    ),
                                    title: Text(
                                      formName,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 16,
                                      ),
                                    ),
                                    subtitle: Padding(
                                      padding: const EdgeInsets.only(top: 4.0),
                                      child: Text(
                                        'Finalized: $finalizeTime',
                                        style: const TextStyle(
                                          fontSize: 13,
                                          color: Colors.black54,
                                        ),
                                      ),
                                    ),
                                    trailing: const Icon(
                                      Icons.arrow_forward_ios_rounded,
                                      size: 18,
                                    ),
                                    onTap: () {
                                      _savedAnswerBloc.add(
                                        SavedAnswerSingleSubmissionClickedEvent(
                                          name: formName,
                                          answer: answer,
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    )
                    : Center(child: Text("No draft submissions to send"));
              } else if (state is SavedAnswerErrorState) {
                return Center(
                  child: Text(
                    'Error: ${state.error}',
                    style: const TextStyle(color: Colors.red),
                  ),
                );
              }

              return const Center(child: Text('Initializing...'));
            },
          ),
          bottomNavigationBar:
              _selectedAnswers.isNotEmpty
                  ? Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(blurRadius: 6, color: Colors.black12),
                      ],
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              showDialog(
                                context: context,
                                builder:
                                    (_) => AlertDialog(
                                      title: const Text("Delete Selected?"),
                                      content: const Text(
                                        "Are you sure you want to delete the selected submissions?",
                                      ),
                                      actions: [
                                        TextButton(
                                          onPressed:
                                              () => Navigator.of(context).pop(),
                                          child: const Text("Cancel"),
                                        ),
                                        TextButton(
                                          onPressed: () {
                                            Navigator.of(context).pop();
                                            _savedAnswerBloc.add(
                                              SavedAnswerDeleteButtonPressedEvent(
                                                answers: List.from(
                                                  _selectedAnswers,
                                                ),
                                              ),
                                            );
                                            setState(
                                              () => _selectedAnswers.clear(),
                                            );
                                          },
                                          child: const Text(
                                            "Delete",
                                            style: TextStyle(color: Colors.red),
                                          ),
                                        ),
                                      ],
                                    ),
                              );
                            },
                            icon: const Icon(Icons.delete_outline),
                            label: const Text("Delete"),
                            style: ElevatedButton.styleFrom(
                              foregroundColor: Colors.white,
                              backgroundColor: Colors.red,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ButtonStyle(
                              backgroundColor: WidgetStatePropertyAll(
                                Colors.blue[300],
                              ),
                              foregroundColor: WidgetStatePropertyAll(
                                Colors.white,
                              ),
                            ),
                            onPressed: () {
                              final answersToSubmit = List<Answer>.from(
                                _selectedAnswers,
                              );
                              _savedAnswerBloc.add(
                                SavedAnswerSubmitButtonPressedEvent(
                                  answers: answersToSubmit,
                                ),
                              );
                              setState(() => _selectedAnswers.clear());
                            },
                            icon: const Icon(Icons.send_rounded),
                            label: const Text("Submit"),
                          ),
                        ),
                      ],
                    ),
                  )
                  : null,
        ),
      ),
    );
  }
}
