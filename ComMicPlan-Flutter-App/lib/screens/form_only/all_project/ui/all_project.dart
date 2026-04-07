import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/bloc/form_only/all_project/bloc/all_project_bloc.dart';
import 'package:gmgi_project/screens/form_only/downloadPage/ui/downloadPage.dart';

class AllProject extends StatefulWidget {
  int organizationId;
  String titleText;
  AllProject({
    super.key,
    this.organizationId = -1,
    this.titleText = 'All Project',
  });

  @override
  State<AllProject> createState() => _AllProjectState();
}

class _AllProjectState extends State<AllProject> {
  final _allProjectBloc = AllProjectBloc();

  @override
  void initState() {
    super.initState();
    _allProjectBloc.add(
      AllProjectInitialEvent(organizationId: widget.organizationId),
    );
  }

  @override
  void dispose() {
    _allProjectBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.titleText),
          backgroundColor: Colors.blue[300],
          foregroundColor: Colors.white,
          centerTitle: true,
          // leading: IconButton(
          //   icon: const Icon(Icons.arrow_back),
          //   onPressed: () {
          //     Navigator.pushReplacement(
          //       context,
          //       MaterialPageRoute(builder: (context) => const UserHome()),
          //     );
          //   },
          // ),
        ),
        body: BlocConsumer<AllProjectBloc, AllProjectState>(
          bloc: _allProjectBloc,
          listener: (context, state) {
            if (state is AllProjectErrorState) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.error),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
          builder: (context, state) {
            if (state is AllProjectLoadingState) {
              return const Center(child: CircularProgressIndicator.adaptive());
            } else if (state is AllProjectLoadedState) {
              final projects = state.projects;
              return projects.isEmpty
                  ? const Center(
                    child: Text(
                      'No projects found',
                      style: TextStyle(fontSize: 18, color: Colors.grey),
                    ),
                  )
                  : ListView.builder(
                    padding: const EdgeInsets.all(10),
                    itemCount: projects.length,
                    itemBuilder: (BuildContext context, int index) {
                      final project = projects[index];
                      return Card(
                        elevation: 2,
                        margin: const EdgeInsets.symmetric(
                          vertical: 5,
                          horizontal: 10,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: ListTile(
                          title: Text(
                            project.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          subtitle: Text(
                            project.description.isNotEmpty
                                ? project.description
                                : 'No description available',
                            style: const TextStyle(color: Colors.grey),
                          ),
                          trailing: const Icon(
                            Icons.arrow_forward_ios,
                            size: 16,
                          ),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder:
                                    (context) => DownloadPage(
                                      projectID: state.projects[index].id,
                                      titleText: state.projects[index].name,
                                    ),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  );
            } else if (state is AllProjectErrorState) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      state.error,
                      style: const TextStyle(color: Colors.red, fontSize: 18),
                    ),
                    const SizedBox(height: 10),
                    ElevatedButton(
                      onPressed: () {
                        _allProjectBloc.add(
                          AllProjectInitialEvent(
                            organizationId: widget.organizationId,
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue[300],
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            }
            return const Center(
              child: Text(
                'Initializing...',
                style: TextStyle(fontSize: 18, color: Colors.grey),
              ),
            );
          },
        ),
      ),
    );
  }
}
