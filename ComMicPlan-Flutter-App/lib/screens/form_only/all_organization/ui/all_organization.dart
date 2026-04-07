import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/bloc/form_only/all_organization/bloc/all_organization_bloc.dart';
import 'package:gmgi_project/screens/form_only/all_project/ui/all_project.dart';

import 'package:gmgi_project/screens/form_only/userHome/ui/userHome.dart';

class AllOrganization extends StatefulWidget {
  const AllOrganization({super.key});

  @override
  State<AllOrganization> createState() => _AllOrganizationState();
}

class _AllOrganizationState extends State<AllOrganization> {
  final _allOrganizationBloc = AllOrganizationBloc();
  @override
  void initState() {
    super.initState();
    _allOrganizationBloc.add(AllOrganizationInitialEvent());
  }

  @override
  void dispose() {
    _allOrganizationBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('All Organizations'),
          backgroundColor: Colors.blue[300],
          foregroundColor: Colors.white,
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const UserHome()),
              );
            },
          ),
        ),
        body: BlocConsumer<AllOrganizationBloc, AllOrganizationState>(
          bloc: _allOrganizationBloc,
          listener: (context, state) {
            if (state is AllOrganizationErrorState) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.error),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
          builder: (context, state) {
            if (state is AllOrganizationLoadingState) {
              return const Center(child: CircularProgressIndicator.adaptive());
            } else if (state is AllOrganizationLoadedState) {
              final organizations = state.organizations;
              return organizations.isEmpty
                  ? const Center(
                    child: Text(
                      'No Organizations found',
                      style: TextStyle(fontSize: 18, color: Colors.grey),
                    ),
                  )
                  : ListView.builder(
                    padding: const EdgeInsets.all(10),
                    itemCount: organizations.length,
                    itemBuilder: (BuildContext context, int index) {
                      final organization = organizations[index];
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
                            organization.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          subtitle: Text(
                            organization.description.isNotEmpty
                                ? organization.description
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
                                    (context) => AllProject(
                                      organizationId: organization.id,
                                      titleText: organization.name,
                                    ),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  );
            } else if (state is AllOrganizationErrorState) {
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
                        _allOrganizationBloc.add(AllOrganizationInitialEvent());
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
