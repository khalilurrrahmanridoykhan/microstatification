import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/bloc/follow_up/downloadPage/bloc/download_page_bloc.dart';
import 'package:gmgi_project/models/form.dart';
import 'package:gmgi_project/screens/follow_up/downloadPage/ui/downloadPageTile.dart';
import 'package:gmgi_project/screens/follow_up/downloadPage/ui/download_child_page.dart';
import 'package:gmgi_project/theme/colors/colors.dart';

class FollowUpPage extends StatefulWidget {
  final int projectID;
  final int parentUid;
  final String parentName;
  final FormUrl form;

  const FollowUpPage({
    super.key,
    required this.projectID,
    required this.parentUid,
    required this.parentName,
    required this.form,
  });

  @override
  State<FollowUpPage> createState() => _FollowUpPageState();
}

class _FollowUpPageState extends State<FollowUpPage> {
  final color = LogInScreenColors();
  final Set<FormUrl> selectedForms = {};
  final DownloadPageBloc _bloc = DownloadPageBloc();

  String searchText = '';
  String sortOrder = 'A-Z';

  @override
  void initState() {
    super.initState();
    _bloc.add(
      DownloadPageInitialEvent(
        projectID: widget.projectID,
        parentUid: widget.parentUid,
        name: widget.parentName,
      ),
    );
  }

  @override
  void dispose() {
    _bloc.close();
    super.dispose();
  }

  void _toggleAllForms(List<FormUrl> forms) {
    setState(() {
      if (selectedForms.length == forms.length) {
        selectedForms.clear();
      } else {
        selectedForms
          ..clear()
          ..addAll(forms);
      }
    });
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
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            contentPadding:
                const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
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
                onPressed: () => _toggleAllForms(allForms),
                icon: Icon(
                  selectedForms.length == allForms.length
                      ? Icons.clear
                      : Icons.check_box,
                ),
                label: Text(
                  selectedForms.length == allForms.length
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

  @override
  Widget build(BuildContext context) {
    List<dynamic> generatedForms = [];
    if (widget.form is Map &&
        (widget.form as Map).containsKey('generated_lookup_forms')) {
      generatedForms = (widget.form as Map)['generated_lookup_forms'] ?? [];
    }

    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.grey[100],
        appBar: AppBar(
          title: Text(
            "Follow Up: ${widget.parentName}",
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
          ),
          centerTitle: true,
          backgroundColor: Colors.blue[300],
          foregroundColor: Colors.white,
          elevation: 1,
        ),
        body: BlocBuilder<DownloadPageBloc, DownloadPageState>(
          bloc: _bloc,
          builder: (context, state) {
            if (state is DownloadPageLoadingState) {
              return const Center(child: Text("Loading..."));
            } else if (state is DownloadPageFailureState) {
              return const Center(child: Text("Failed to load child forms."));
            } else if (state is DownloadPageLoadedState) {
              final forms = state.forms;

              List<FormUrl> filteredForms = forms
                  .where((f) =>
                      f.name.toLowerCase().contains(searchText.toLowerCase()))
                  .toList();
              filteredForms.sort((a, b) => sortOrder == 'A-Z'
                  ? a.name.toLowerCase().compareTo(b.name.toLowerCase())
                  : b.name.toLowerCase().compareTo(a.name.toLowerCase()));

              return Column(
                children: [
                  if (generatedForms.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Generated Forms:',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          ...generatedForms.map(
                            (form) => Card(
                              child: ListTile(
                                title: Text(form['name'] ?? 'Unnamed Form'),
                                subtitle:
                                    Text('UID: ${form['uid'] ?? form['id']}'),
                                onTap: () {
                                  // TODO: Navigate to form fill page, passing form data
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: _buildTopControls(filteredForms),
                  ),
                  const SizedBox(height: 10),
                  Expanded(
                    child: filteredForms.isEmpty
                        ? const Center(
                            child: Text("No follow-up forms found."),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: filteredForms.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final form = filteredForms[index];
                              final isSelected = selectedForms.contains(form);

                              return DownloadPageTile(
                                form: form,
                                isSelected: isSelected,
                                onChanged: (val) {
                                  setState(() {
                                    if (val == true) {
                                      selectedForms.add(form);
                                    } else {
                                      selectedForms.remove(form);
                                    }
                                  });
                                },
                                onTap: null,
                              );
                            },
                          ),
                  ),
                  if (selectedForms.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: SizedBox(
                        width: double.infinity,
                        height: 55,
                        child: FilledButton.icon(
                          icon: const Icon(Icons.download),
                          label: const Text('Download'),
                          onPressed: () {
                            if (selectedForms.isNotEmpty) {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => DownloadChildPage(
                                    forms: selectedForms.toList(),
                                  ),
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
                    ),
                ],
              );
            }
            return const SizedBox();
          },
        ),
      ),
    );
  }
}
