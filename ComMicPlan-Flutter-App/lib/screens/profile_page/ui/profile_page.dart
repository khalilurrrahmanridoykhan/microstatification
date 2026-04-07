import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/bloc/form_only/profile_page/bloc/profile_page_bloc.dart';
import 'package:gmgi_project/screens/authentication/log_in/ui/log_in.dart';
import 'package:gmgi_project/theme/colors/colors.dart';
import 'package:hive_flutter/hive_flutter.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _profilePageBloc = ProfilePageBloc();
  final Random _random = Random();
  String? _submitAsName;

  Color getRandomColorWithOpacity(double opacity) {
    return Color.fromRGBO(
      _random.nextInt(256),
      _random.nextInt(256),
      _random.nextInt(256),
      opacity,
    );
  }

  @override
  void initState() {
    super.initState();
    _profilePageBloc.add(ProfilePageInitialEvent());
    _loadSubmitAsName();
  }

  Future<void> _loadSubmitAsName() async {
    final box = await Hive.openBox('appData'); // Open the box explicitly
    setState(() {
      _submitAsName = box.get('submitAs', defaultValue: '');
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        appBar: AppBar(title: const Text("Profile"), centerTitle: true),
        backgroundColor: Colors.white,
        body: BlocConsumer<ProfilePageBloc, ProfilePageState>(
          bloc: _profilePageBloc,
          listenWhen:
              (previous, current) =>
                  current is ProfilePageActionState ||
                  current is ProfilePageNameSetSuccessState ||
                  current is ProfilePageNameSetErrorState,
          buildWhen: (previous, current) => current is! ProfilePageActionState,
          listener: (context, state) {
            if (state is ProfilePageLogOutSuccessState) {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const LogIn()),
                (route) => false,
              );
            } else if (state is ProfilePageNameSetSuccessState) {
              setState(() {
                _submitAsName = state.name;
              });
              _profilePageBloc.add(ProfilePageInitialEvent());
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text("Submit As name set to: ${state.name}")),
              );
            } else if (state is ProfilePageNameSetErrorState) {
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(SnackBar(content: Text("Error: ${state.error}")));
            }
          },
          builder: (context, state) {
            switch (state.runtimeType) {
              case ProfilePageLoadingState:
                return const Center(
                  child: CircularProgressIndicator.adaptive(),
                );
              case ProfilePageLoadedState:
                final userInfo = (state as ProfilePageLoadedState).userInfo;
                final role =
                    userInfo.role == 1
                        ? "Super Admin"
                        : (userInfo.role == 2
                            ? "Organization Admin"
                            : (userInfo.role == 3
                                ? "Project Admin"
                                : (userInfo.role == 4
                                    ? "User"
                                    : "Data Collector")));

                return SingleChildScrollView(
                  child: Column(
                    children: [
                      const SizedBox(height: 24),

                      // Profile Picture
                      CircleAvatar(
                        radius: 48,
                        backgroundColor: getRandomColorWithOpacity(0.8),
                        child: Text(
                          "${userInfo.firstName.isNotEmpty ? userInfo.firstName[0] : ''}"
                                  "${userInfo.lastName.isNotEmpty ? userInfo.lastName[0] : ''}"
                              .toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 40,
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Name and Username
                      Text(
                        "${userInfo.firstName} ${userInfo.lastName}",
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        userInfo.username,
                        style: const TextStyle(color: Colors.grey),
                      ),

                      const SizedBox(height: 20),

                      // Email Card
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Card(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 1,
                          child: ListTile(
                            leading: const Icon(
                              Icons.email,
                              color: Colors.blue,
                            ),
                            title: Text(userInfo.email),
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Role and Status Row
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Row(
                          children: [
                            Expanded(
                              child: Card(
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 1,
                                child: ListTile(
                                  leading: const Icon(
                                    Icons.person_outline,
                                    color: Colors.blue,
                                  ),
                                  title: const Text("Role"),
                                  subtitle: Text(role),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Card(
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 1,
                                child: ListTile(
                                  leading: const Icon(
                                    Icons.desktop_windows_outlined,
                                    color: Colors.blue,
                                  ),
                                  title: const Text("Status"),
                                  subtitle:
                                      userInfo.isStaff
                                          ? const Text("Staff")
                                          : const Text("Not Staff"),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Profile Metrics
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              "Profile Metrics",
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(height: 12),
                          ],
                        ),
                      ),

                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Row(
                          children: [
                            _buildMetricCard(
                              Icons.apartment,
                              userInfo.profile['organizations']!.length
                                  .toString(),
                              "Organizations",
                            ),
                            const SizedBox(width: 12),
                            _buildMetricCard(
                              Icons.folder_open,
                              userInfo.profile['projects']!.length.toString(),
                              "Projects",
                            ),
                            const SizedBox(width: 12),
                            _buildMetricCard(
                              Icons.description,
                              userInfo.profile['forms']!.length.toString(),
                              "Forms",
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 32),

                      // Submit Form As button
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Column(
                          children: [
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                icon: const Icon(Icons.edit),
                                label: const Text("Submit Form As"),
                                style: ElevatedButton.styleFrom(
                                  foregroundColor: Colors.white,
                                  backgroundColor: Colors.blue,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                onPressed: () async {
                                  final TextEditingController nameController =
                                      TextEditingController(
                                        text: _submitAsName ?? '',
                                      );

                                  final result = await showDialog<String>(
                                    context: context,
                                    builder:
                                        (context) => AlertDialog(
                                          title: const Text("Set Submit Name"),
                                          content: TextField(
                                            controller: nameController,
                                            decoration: const InputDecoration(
                                              hintText: "Enter name",
                                              border: OutlineInputBorder(),
                                            ),
                                          ),
                                          actions: [
                                            TextButton(
                                              onPressed:
                                                  () => Navigator.pop(context),
                                              child: const Text("Cancel"),
                                            ),
                                            ElevatedButton(
                                              onPressed: () {
                                                Navigator.pop(
                                                  context,
                                                  nameController.text.trim(),
                                                );
                                              },
                                              child: const Text("OK"),
                                            ),
                                          ],
                                        ),
                                  );

                                  if (result != null && result.isNotEmpty) {
                                    _profilePageBloc.add(
                                      ProfilePageSetNameOkayButtonPressedEvent(
                                        name: result,
                                      ),
                                    );
                                  }
                                },
                              ),
                            ),
                            if ((_submitAsName ?? '').isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  "Current: $_submitAsName",
                                  style: const TextStyle(
                                    color: Colors.grey,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Logout Button
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            icon: const Icon(Icons.logout),
                            label: const Text("Logout"),
                            style: ElevatedButton.styleFrom(
                              foregroundColor: Colors.white,
                              backgroundColor:
                                  LogInScreenColors().loginButtonColor,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            onPressed: () {
                              _profilePageBloc.add(
                                ProfilePageLogOutButtonPressedEvent(),
                              );
                            },
                          ),
                        ),
                      ),

                      const SizedBox(height: 24),
                    ],
                  ),
                );
              default:
                return const SizedBox();
            }
          },
        ),
      ),
    );
  }

  Widget _buildMetricCard(IconData icon, String value, String label) {
    return Expanded(
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 1,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            children: [
              Icon(icon, color: Colors.blue),
              const SizedBox(height: 8),
              Text(
                value,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              Text(
                label,
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
