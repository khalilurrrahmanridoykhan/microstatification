import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:gmgi_project/screens/follow_up/downloadPage/ui/downloadPage.dart';
import 'package:gmgi_project/screens/authentication/log_in/ui/log_in.dart';
import 'package:gmgi_project/screens/follow_up/fillUp/ui/fillUp.dart';
import 'package:gmgi_project/screens/follow_up/saved_answer/ui/saved_answer.dart';
import 'package:gmgi_project/screens/home.dart';
import 'package:gmgi_project/screens/profile_page/ui/profile_page.dart';
import 'package:gmgi_project/theme/colors/colors.dart';
import 'package:gmgi_project/bloc/follow_up/userHome/bloc/user_home_bloc.dart';

class FollowUpUserHome extends StatefulWidget {
  const FollowUpUserHome({super.key});

  @override
  State<FollowUpUserHome> createState() => _UserHomeState();
}

class _UserHomeState extends State<FollowUpUserHome> {
  final UserHomeBloc _userHomeBloc = UserHomeBloc();

  @override
  void initState() {
    print("Follow up");
    super.initState();
    _userHomeBloc.add(UserHomeInitialEvent());
  }

  @override
  void dispose() {
    _userHomeBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        appBar: AppBar(
          leading: BackButton(
            onPressed: () {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => HomeScreen()),
                (Route<dynamic> route) => false,
              );
            },
          ),
          backgroundColor: Colors.white,
          automaticallyImplyLeading: false,
          title: Text('Follow up'),

          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => ProfilePage()),
                  );
                  print("Profile icon tapped");
                },
                child: CircleAvatar(radius: 18, child: Icon(Icons.person)),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        // Remove backgroundColor to avoid conflicts with image
        body: Stack(
          children: [
            // Background image
            Container(
              decoration: const BoxDecoration(
                image: DecorationImage(
                  image: AssetImage('assets/images/image3.png'), // Local asset
                  // For network image, use:
                  // image: NetworkImage('https://example.com/background.jpg'),
                  fit: BoxFit.cover, // Cover entire screen
                  opacity: 0.05, // Optional: Adjust transparency
                ),
              ),
            ),
            // Foreground content
            BlocConsumer<UserHomeBloc, UserHomeState>(
              bloc: _userHomeBloc,
              listenWhen: (previous, current) => current is UserHomeActionState,
              buildWhen: (previous, current) => current is! UserHomeActionState,
              listener: (context, state) {
                if (state is UserHomeNavigateToDownloadState) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => DownloadPage()),
                  );
                } else if (state is UserHomeNavigateToFillUpState) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => FillUp()),
                  );
                } else if (state is UserHomeLogOutSuccessState) {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (context) => LogIn()),
                    (route) => false,
                  );
                } else if (state is UserHomeNavigateToReadyToSendState) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => SavedAnswer()),
                  );
                }
              },
              builder: (context, state) {
                switch (state.runtimeType) {
                  case UserHomeLoadedState:
                    return Column(
                      children: [
                        Expanded(
                          child: Scrollbar(
                            child: SingleChildScrollView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              child: Padding(
                                padding: const EdgeInsets.all(10.0),
                                child: Column(
                                  children: [
                                    GridView.count(
                                      shrinkWrap: true,
                                      physics:
                                          const NeverScrollableScrollPhysics(),
                                      primary: false,
                                      padding: const EdgeInsets.all(20),
                                      crossAxisSpacing: 10,
                                      mainAxisSpacing: 10,
                                      crossAxisCount: 2,
                                      children: <Widget>[
                                        GestureDetector(
                                          onTap: () {
                                            _userHomeBloc.add(
                                              UserHomeDownloadFormButtonPressed(),
                                            );
                                          },
                                          child: Container(
                                            decoration: BoxDecoration(
                                              borderRadius:
                                                  BorderRadius.circular(25),
                                              color:
                                                  LogInScreenColors()
                                                      .loginButtonColor,
                                            ),
                                            padding: const EdgeInsets.all(8),
                                            child: const Center(
                                              child: Column(
                                                children: [
                                                  SizedBox(height: 30),
                                                  Icon(
                                                    Icons.download,
                                                    color: Colors.white,
                                                  ),
                                                  Align(
                                                    alignment: Alignment.center,
                                                    child: Text(
                                                      "Download Forms",
                                                      textAlign:
                                                          TextAlign.center,
                                                      style: TextStyle(
                                                        color: Colors.white,
                                                        fontSize: 20,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),

                                        GestureDetector(
                                          onTap: () {
                                            _userHomeBloc.add(
                                              UserHomeFillUpButtonPressed(),
                                            );
                                          },
                                          child: ClipRRect(
                                            borderRadius: BorderRadius.circular(
                                              25,
                                            ),
                                            child: BackdropFilter(
                                              filter: ImageFilter.blur(
                                                sigmaX: 2,
                                                sigmaY: 2,
                                              ),
                                              child: Container(
                                                height: 250,
                                                width: 350,
                                                decoration: BoxDecoration(
                                                  borderRadius:
                                                      BorderRadius.circular(25),
                                                  color: Colors.black45,
                                                ),
                                                child: Padding(
                                                  padding: const EdgeInsets.all(
                                                    15,
                                                  ),
                                                  child: Column(
                                                    mainAxisAlignment:
                                                        MainAxisAlignment
                                                            .center,
                                                    children: [
                                                      Icon(
                                                        Ionicons.documents,
                                                        color: Colors.white,
                                                      ),
                                                      const Center(
                                                        child: Text(
                                                          'Start new form',
                                                          textAlign:
                                                              TextAlign.center,
                                                          style: TextStyle(
                                                            color: Colors.white,
                                                            fontSize: 20,
                                                          ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                        GestureDetector(
                                          onTap: () {
                                            _userHomeBloc.add(
                                              UserHomeReadyToSendButtonPressed(),
                                            );
                                          },
                                          child: ClipRRect(
                                            borderRadius: BorderRadius.circular(
                                              25,
                                            ),
                                            child: BackdropFilter(
                                              filter: ImageFilter.blur(
                                                sigmaX: 2,
                                                sigmaY: 2,
                                              ),
                                              child: Container(
                                                height: 250,
                                                width: 350,
                                                decoration: BoxDecoration(
                                                  borderRadius:
                                                      BorderRadius.circular(25),
                                                  color: Colors.black45,
                                                ),
                                                child: Padding(
                                                  padding: const EdgeInsets.all(
                                                    15,
                                                  ),
                                                  child: Column(
                                                    mainAxisAlignment:
                                                        MainAxisAlignment
                                                            .center,
                                                    children: [
                                                      Icon(
                                                        FontAwesome.send_o,
                                                        color: Colors.white,
                                                      ),
                                                      const Center(
                                                        child: Text(
                                                          'Ready to send',
                                                          textAlign:
                                                              TextAlign.center,
                                                          style: TextStyle(
                                                            color: Colors.white,
                                                            fontSize: 20,
                                                          ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  default:
                    return const SizedBox();
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
