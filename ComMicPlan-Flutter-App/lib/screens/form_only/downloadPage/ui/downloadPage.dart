import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/bloc/form_only/downloadPage/bloc/download_page_bloc.dart';
import 'package:gmgi_project/models/form.dart';
import 'package:gmgi_project/screens/form_only/downloadPage/ui/downloadPageTile.dart';
import 'package:gmgi_project/theme/colors/colors.dart';

class DownloadPage extends StatefulWidget {
  int projectID;
  String titleText;
  DownloadPage({
    super.key,
    this.projectID = -1,
    this.titleText = "Download Forms",
  });

  @override
  State<DownloadPage> createState() => _DownloadPageState();
}

class _DownloadPageState extends State<DownloadPage> {
  final color = LogInScreenColors();
  final Set<FormUrl> selectedForm = {};
  final DownloadPageBloc _downloadPageBloc = DownloadPageBloc();
  List<FormUrl>? _cachedForms;

  String searchText = '';
  String sortOrder = 'A-Z';

  @override
  void initState() {
    _downloadPageBloc.add(
      DownloadPageInitialEvent(projectID: widget.projectID),
    );
    super.initState();
  }

  @override
  void dispose() {
    _downloadPageBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.grey[100],
        appBar: AppBar(
          title: Text(
            widget.titleText,
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
          ),
          centerTitle: true,
          backgroundColor: Colors.blue[300],
          foregroundColor: Colors.white,
          elevation: 1,
        ),
        body: BlocConsumer<DownloadPageBloc, DownloadPageState>(
          bloc: _downloadPageBloc,
          listenWhen:
              (prev, curr) =>
                  curr is DownloadPageActionState ||
                  curr is DownloadPageLoadedState,
          buildWhen:
              (prev, curr) =>
                  curr is! DownloadPageActionState ||
                  curr is DownloadPageFailureState,
          listener: (context, state) {
            if (state is DownloadPageDownloadSuccessState) {
              _showSuccessDialogBox(context);
              setState(() => selectedForm.clear());
            } else if (state is DownloadPageFailureState) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.error),
                  backgroundColor: Colors.red,
                ),
              );
            } else if (state is DownloadPageLoadedState) {
              setState(() {
                _cachedForms = state.forms;
                selectedForm.removeWhere(
                  (form) => !state.forms.contains(form),
                );
              });
            }
          },
          builder: (context, state) {
            if (state is DownloadPageFailureState) {
              return const Center(
                child: Text('No Data Found. Please Try Again.'),
              );
            }

            final bool hasCachedForms =
                _cachedForms != null && _cachedForms!.isNotEmpty;
            final bool isInitial = state is DownloadPageInitial;
            final bool isLoading = state is DownloadPageLoadingState;
            final bool showBlockingLoader =
                (isLoading || isInitial) && !hasCachedForms;

            if (showBlockingLoader) {
              return const Center(child: CircularProgressIndicator());
            }

            final List<FormUrl> forms =
                state is DownloadPageLoadedState
                    ? state.forms
                    : (_cachedForms ?? []);

            final Widget content = _buildFormList(forms);

            if (isLoading && hasCachedForms) {
              return Stack(
                children: [
                  content,
                  const ModalBarrier(
                    dismissible: false,
                    color: Colors.black12,
                  ),
                  const Center(child: CircularProgressIndicator()),
                ],
              );
            }

            return content;
          },
        ),
      ),
    );
  }

  Widget _buildFormList(List<FormUrl> forms) {
    final List<FormUrl> filteredForms =
        forms
            .where(
              (f) => f.name.toLowerCase().contains(
                searchText.toLowerCase(),
              ),
            )
            .toList();

    filteredForms.sort(
      (a, b) =>
          sortOrder == 'A-Z'
              ? a.name.toLowerCase().compareTo(b.name.toLowerCase())
              : b.name.toLowerCase().compareTo(a.name.toLowerCase()),
    );

    final bool isSearching = searchText.isNotEmpty;

    return RefreshIndicator(
      onRefresh: () async {
        _downloadPageBloc.add(
          DownloadPageInitialEvent(projectID: widget.projectID),
        );
      },
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            _buildTopControls(forms),
            const SizedBox(height: 10),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child:
                    filteredForms.isEmpty
                        ? Center(
                          child: Text(
                            isSearching
                                ? 'No matching forms found.'
                                : 'No forms available yet.',
                          ),
                        )
                        : ListView.separated(
                          key: ValueKey(
                            '${filteredForms.length}-$sortOrder-$searchText',
                          ),
                          itemCount: filteredForms.length,
                          itemBuilder: (context, index) {
                            final form = filteredForms[index];
                            final isSelected = selectedForm.contains(form);
                            return DownloadPageTile(
                              form: form,
                              isSelected: isSelected,
                              onChanged: (value) {
                                setState(() {
                                  if (value == true) {
                                    selectedForm.add(form);
                                  } else {
                                    selectedForm.remove(form);
                                  }
                                });
                              },
                            );
                          },
                          separatorBuilder:
                              (_, __) => const SizedBox(height: 8),
                        ),
              ),
            ),
            const SizedBox(height: 12),
            if (selectedForm.isNotEmpty)
              SizedBox(
                width: double.infinity,
                height: 55,
                child: FilledButton.icon(
                  icon: const Icon(Icons.download),
                  label: const Text('Download'),
                  onPressed: () {
                    if (selectedForm.isNotEmpty) {
                      _downloadPageBloc.add(
                        DownloadPageDownloadButtonPressedEvent(
                          forms: selectedForm,
                        ),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Please select at least one form.',
                          ),
                          backgroundColor: Colors.orange,
                        ),
                      );
                    }
                  },
                  style: ButtonStyle(
                    backgroundColor: WidgetStateProperty.all(
                      color.loginButtonColor,
                    ),
                    foregroundColor: WidgetStateProperty.all(
                      Colors.white,
                    ),
                    shape: WidgetStateProperty.all(
                      RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopControls(List<FormUrl> allForms) {
    return Column(
      children: [
        TextField(
          onChanged: (val) => setState(() => searchText = val),
          decoration: InputDecoration(
            hintText: 'Search forms...',
            prefixIcon: const Icon(Icons.search),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            contentPadding: const EdgeInsets.symmetric(
              vertical: 10,
              horizontal: 16,
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: DropdownButtonFormField<String>(
                value: sortOrder,
                items: const [
                  DropdownMenuItem(value: 'A-Z', child: Text('Sort: A-Z')),
                  DropdownMenuItem(value: 'Z-A', child: Text('Sort: Z-A')),
                ],
                onChanged: (val) => setState(() => sortOrder = val ?? 'A-Z'),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            if (searchText.isEmpty)
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    if (selectedForm.length == allForms.length) {
                      selectedForm.clear();
                    } else {
                      selectedForm
                        ..clear()
                        ..addAll(allForms);
                    }
                  });
                },
                icon: Icon(
                  selectedForm.length == allForms.length
                      ? Icons.clear
                      : Icons.check_box,
                ),
                label: Text(
                  selectedForm.length == allForms.length
                      ? 'Deselect All'
                      : 'Select All',
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: color.loginButtonColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  void _showSuccessDialogBox(BuildContext context) {
    showDialog(
      context: context,
      builder:
          (_) => AlertDialog(
            backgroundColor: Colors.white,
            title: Text(
              'Download Completed',
              style: TextStyle(color: color.loginButtonColor),
            ),
            content: Text(
              'Your selected forms have been downloaded successfully.',
              style: TextStyle(color: color.headerTextColor),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(
                  'OK',
                  style: TextStyle(color: color.loginButtonColor),
                ),
              ),
            ],
          ),
    );
  }
}
