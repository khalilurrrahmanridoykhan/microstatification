import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/bloc/follow_up/downloadPage/bloc/download_page_bloc.dart';
import 'package:gmgi_project/models/form.dart';
import 'package:gmgi_project/screens/follow_up/downloadPage/ui/downloadPageTile.dart';
import 'package:gmgi_project/screens/follow_up/downloadPage/ui/download_child_page.dart';
import 'package:gmgi_project/screens/follow_up/downloadPage/ui/follow_up_page.dart';
import 'package:gmgi_project/theme/colors/colors.dart';

class DownloadPage extends StatefulWidget {
  int projectID;
  int parentUid;
  String titleText;
  String name;
  FormUrl? parent;
  DownloadPage({
    super.key,
    this.projectID = -1,
    this.parentUid = -1,
    this.titleText = "My Assigned Templates",
    this.name = '',
    this.parent,
  });

  @override
  State<DownloadPage> createState() => _DownloadPageState();
}

class _DownloadPageState extends State<DownloadPage> {
  final color = LogInScreenColors();
  final Set<FormUrl> selectedForm = {};
  final DownloadPageBloc _downloadPageBloc = DownloadPageBloc();

  String searchText = '';
  String sortOrder = 'A-Z';

  @override
  void initState() {
    _downloadPageBloc.add(
      DownloadPageInitialEvent(
        projectID: widget.projectID,
        parentUid: widget.parentUid,
        name: widget.name,
      ),
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
    bool isFollowUp = widget.parentUid != -1;
    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.grey[100],
        appBar: AppBar(
          title: Text(
            widget.titleText,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
          ),
          centerTitle: true,
          backgroundColor: Colors.blue[300],
          foregroundColor: Colors.white,
          elevation: 1,
        ),
        body: BlocConsumer<DownloadPageBloc, DownloadPageState>(
          bloc: _downloadPageBloc,
          listenWhen: (prev, curr) => curr is DownloadPageActionState,
          buildWhen:
              (prev, curr) =>
                  curr is! DownloadPageActionState ||
                  curr is DownloadPageFailureState,
          listener: (context, state) {
            if (state is DownloadPageFailureState) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.error),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
          builder: (context, state) {
            if (state is DownloadPageFailureState) {
              return const Center(
                child: Text('No Data Found. Please Try Again.'),
              );
            } else if (state is DownloadPageLoadingState) {
              return const Center(child: CircularProgressIndicator());
            } else if (state is DownloadPageLoadedState) {
              final forms = state.forms;

              // Search + Sort
              List<FormUrl> filteredForms =
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

              return RefreshIndicator(
                onRefresh: () async {
                  _downloadPageBloc.add(
                    DownloadPageInitialEvent(
                      projectID: widget.projectID,
                      parentUid: widget.parentUid,
                    ),
                  );
                },
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      _buildTopControls(filteredForms, isFollowUp),
                      const SizedBox(height: 10),
                      Expanded(
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 300),
                          child:
                              filteredForms.isEmpty
                                  ? const Center(
                                    child: Text('No matching forms found.'),
                                  )
                                  : ListView.separated(
                                    key: ValueKey(filteredForms.length),
                                    itemCount: filteredForms.length,
                                    itemBuilder: (context, index) {
                                      final form = filteredForms[index];
                                      final isSelected = selectedForm.contains(
                                        form,
                                      );
                                      return DownloadPageTile(
                                        form: form,
                                        isSelected:
                                            isFollowUp ? isSelected : false,
                                        onChanged:
                                            isFollowUp
                                                ? (value) {
                                                  setState(() {
                                                    if (value == true) {
                                                      selectedForm.add(form);
                                                    } else {
                                                      selectedForm.remove(form);
                                                    }
                                                  });
                                                }
                                                : null,
                                        onTap:
                                            !isFollowUp
                                                ? () {
                                                  Navigator.push(
                                                    context,
                                                    MaterialPageRoute(
                                                      builder:
                                                          (
                                                            context,
                                                          ) => FollowUpPage(
                                                            projectID:
                                                                form.project,
                                                            parentUid:
                                                                form.template ??
                                                                -1,
                                                            parentName:
                                                                form.name,
                                                            form: form,
                                                          ),
                                                    ),
                                                  );
                                                }
                                                : null,
                                      );
                                    },
                                    separatorBuilder:
                                        (_, __) => const SizedBox(height: 8),
                                  ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (isFollowUp && selectedForm.isNotEmpty)
                        SizedBox(
                          width: double.infinity,
                          height: 55,
                          child: FilledButton.icon(
                            icon: const Icon(Icons.download),
                            label: const Text('Download'),
                            onPressed: () {
                              if (selectedForm.isNotEmpty) {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder:
                                        (context) => DownloadChildPage(
                                          forms: selectedForm.toList(),
                                        ),
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
            return const SizedBox();
          },
        ),
      ),
    );
  }

  Widget _buildTopControls(List<FormUrl> allForms, bool isFollowUp) {
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
            if (isFollowUp) ...[
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
          ],
        ),
      ],
    );
  }
}
