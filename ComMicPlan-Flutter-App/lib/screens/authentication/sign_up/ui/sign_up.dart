import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:gmgi_project/bloc/backend/algorithms/password_check.dart';
import 'package:gmgi_project/screens/authentication/log_in/ui/log_in.dart';
import 'package:gmgi_project/bloc/authentication/sign_up/bloc/sign_up_bloc.dart';
import 'package:gmgi_project/theme/colors/colors.dart';

class SignUp extends StatefulWidget {
  const SignUp({super.key});

  @override
  State<SignUp> createState() => _SignUpState();
}

class _SignUpState extends State<SignUp> {
  String selectedCountry = '';
  String selectedSector = '';
  String selectedOrganization = '';
  final Map<String, String> countryShortcuts = {
    'usa': 'United States of America',
    'uk': 'United Kingdom',
    'uae': 'United Arab Emirates',
    'dr congo': 'Democratic Republic of the Congo',
    'north korea': 'North Korea',
    'south korea': 'South Korea',
    'ivory coast': 'Côte d\'Ivoire',
    'palestine': 'Palestine State',
    'bd': 'Bangladesh',
  };

  final List<String> countries = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo (Congo-Brazzaville)",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czechia (Czech Republic)",
    "Democratic Republic of the Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini (fmr. \"Swaziland\")",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Ivory Coast",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar (formerly Burma)",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestine State",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States of America",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe",
  ];

  final List<String> sectors = ['A', 'B', 'C'];
  final List<String> organizations = ['X', 'Y', 'Z'];
  final SignUpBloc _signUpBloc = SignUpBloc();
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _userNameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool obscured2 = true;
  bool obscured = true;
  bool checked = false;
  final color = LogInScreenColors();

  @override
  void initState() {
    _signUpBloc.add(SignUpInitialEvent());
    super.initState();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _userNameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _signUpBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        // extendBodyBehindAppBar: true,
        // appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: BlocConsumer<SignUpBloc, SignUpState>(
          listenWhen: (previous, current) => current is SignUpActionState,
          buildWhen: (previous, current) => current is! SignUpActionState,
          bloc: _signUpBloc,
          listener: (context, state) {
            if (state is SignUpNavigateToLoginState) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => LogIn()),
              );
            }
          },
          builder: (context, state) {
            switch (state.runtimeType) {
              case SignUpLoadedState:
                return SizedBox.expand(
                  child: SingleChildScrollView(
                    child: Container(
                      padding: EdgeInsets.only(
                        top: MediaQuery.of(context).padding.top + 10,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            color.backgroundColor1,
                            color.backgroundColor2,
                          ],
                          stops: const [0.0, 0.3],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Stack(
                            children: [
                              // Background Image
                              Image.asset(
                                'assets/images/image2.png',
                                height: 200,
                                width: double.infinity,
                                fit: BoxFit.cover,
                              ),
                              Positioned(
                                top: MediaQuery.of(context).padding.top + 8,
                                left: 16,
                                child: InkWell(
                                  onTap: () => Navigator.pop(context),
                                  child: Container(
                                    padding: EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withOpacity(
                                        0.3,
                                      ), // optional background
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      Icons.arrow_back,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),

                          Text(
                            'Get Started',
                            style: TextStyle(
                              fontSize: 35,
                              color: color.headerTextColor,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            'Create new account',
                            style: TextStyle(color: color.headerTextColor),
                          ),

                          Padding(
                            padding: const EdgeInsets.only(
                              right: 25,
                              left: 25,
                              top: 10,
                            ),
                            child: Divider(thickness: 1),
                          ),
                          SizedBox(height: 20),
                          Padding(
                            padding: const EdgeInsets.all(25),
                            child: Form(
                              key: _formKey,
                              child: Column(
                                children: [
                                  TextFormField(
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'First name shouldn\'t be empty';
                                      } else {
                                        return null;
                                      }
                                    },
                                    controller: _firstNameController,
                                    decoration: InputDecoration(
                                      isDense: true,
                                      hintText: 'Enter your first name',
                                      hintStyle: TextStyle(color: Colors.grey),
                                      prefixIcon: Icon(Ionicons.person_outline),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.grey,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.black,
                                        ),
                                      ),
                                    ),
                                  ),
                                  SizedBox(height: 20),
                                  TextFormField(
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Last name shouldn\'t be empty';
                                      } else {
                                        return null;
                                      }
                                    },
                                    controller: _lastNameController,
                                    decoration: InputDecoration(
                                      isDense: true,
                                      hintText: 'Enter your last name',
                                      hintStyle: TextStyle(color: Colors.grey),
                                      prefixIcon: Icon(Ionicons.person_outline),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.grey,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.black,
                                        ),
                                      ),
                                    ),
                                  ),
                                  SizedBox(height: 20),
                                  TextFormField(
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Username shouldn\'t be empty';
                                      } else {
                                        return null;
                                      }
                                    },
                                    controller: _userNameController,
                                    decoration: InputDecoration(
                                      isDense: true,
                                      hintText: 'Enter your username',
                                      hintStyle: TextStyle(color: Colors.grey),
                                      prefixIcon: Icon(Feather.at_sign),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.grey,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.black,
                                        ),
                                      ),
                                    ),
                                  ),
                                  SizedBox(height: 20),
                                  // Autocomplete<String>(
                                  //   optionsBuilder: (
                                  //     TextEditingValue textEditingValue,
                                  //   ) {
                                  //     final input =
                                  //         textEditingValue.text.toLowerCase();

                                  //     if (input.isEmpty) return countries;

                                  //     final matchedShortcut = countryShortcuts
                                  //         .entries
                                  //         .where(
                                  //           (entry) =>
                                  //               entry.key.startsWith(input),
                                  //         )
                                  //         .map((entry) => entry.value);

                                  //     final matchedNames = countries.where(
                                  //       (country) => country
                                  //           .toLowerCase()
                                  //           .startsWith(input),
                                  //     );

                                  //     return {
                                  //       ...matchedShortcut,
                                  //       ...matchedNames,
                                  //     };
                                  //   },

                                  //   onSelected: (String selection) {
                                  //     print('You selected: $selection');
                                  //     setState(() {
                                  //       selectedCountry = selection;
                                  //     });
                                  //   },
                                  //   fieldViewBuilder: (
                                  //     context,
                                  //     controller,
                                  //     focusNode,
                                  //     onEditingComplete,
                                  //   ) {
                                  //     return TextFormField(
                                  //       validator: (value) {
                                  //         if (value == null || value.isEmpty) {
                                  //           return 'Select country';
                                  //         } else {
                                  //           return null;
                                  //         }
                                  //       },
                                  //       controller: controller,
                                  //       focusNode: focusNode,
                                  //       decoration: InputDecoration(
                                  //         prefixIcon: Icon(
                                  //           SimpleLineIcons.globe,
                                  //         ),
                                  //         isDense: true,
                                  //         labelText: 'Search Country',
                                  //         labelStyle: TextStyle(
                                  //           color: Colors.grey,
                                  //         ),
                                  //         border: OutlineInputBorder(
                                  //           borderRadius: BorderRadius.circular(
                                  //             15,
                                  //           ),
                                  //         ),
                                  //       ),
                                  //     );
                                  //   },
                                  // ),
                                  // SizedBox(height: 20),
                                  // Autocomplete<String>(
                                  //   optionsBuilder: (
                                  //     TextEditingValue textEditingValue,
                                  //   ) {
                                  //     if (textEditingValue.text == '') {
                                  //       return sectors;
                                  //     }
                                  //     return sectors.where((String sector) {
                                  //       return sector.toLowerCase().startsWith(
                                  //         textEditingValue.text.toLowerCase(),
                                  //       );
                                  //     });
                                  //   },
                                  //   onSelected: (String selection) {
                                  //     print('You selected: $selection');
                                  //     setState(() {
                                  //       selectedSector = selection;
                                  //     });
                                  //   },
                                  //   fieldViewBuilder: (
                                  //     context,
                                  //     controller,
                                  //     focusNode,
                                  //     onEditingComplete,
                                  //   ) {
                                  //     return TextFormField(
                                  //       validator: (value) {
                                  //         if (value == null || value.isEmpty) {
                                  //           return 'Select sector';
                                  //         } else {
                                  //           return null;
                                  //         }
                                  //       },
                                  //       controller: controller,
                                  //       focusNode: focusNode,
                                  //       decoration: InputDecoration(
                                  //         prefixIcon: Icon(
                                  //           MaterialIcons.work_outline,
                                  //         ),
                                  //         isDense: true,
                                  //         labelText: 'Select sector',
                                  //         labelStyle: TextStyle(
                                  //           color: Colors.grey,
                                  //         ),
                                  //         border: OutlineInputBorder(
                                  //           borderRadius: BorderRadius.circular(
                                  //             15,
                                  //           ),
                                  //         ),
                                  //       ),
                                  //     );
                                  //   },
                                  // ),
                                  // SizedBox(height: 20),
                                  // Autocomplete<String>(
                                  //   optionsBuilder: (
                                  //     TextEditingValue textEditingValue,
                                  //   ) {
                                  //     if (textEditingValue.text == '') {
                                  //       return organizations;
                                  //     }
                                  //     return organizations.where((
                                  //       String organization,
                                  //     ) {
                                  //       return organization
                                  //           .toLowerCase()
                                  //           .startsWith(
                                  //             textEditingValue.text
                                  //                 .toLowerCase(),
                                  //           );
                                  //     });
                                  //   },
                                  //   onSelected: (String selection) {
                                  //     print('You selected: $selection');
                                  //     setState(() {
                                  //       selectedOrganization = selection;
                                  //     });
                                  //   },
                                  //   fieldViewBuilder: (
                                  //     context,
                                  //     controller,
                                  //     focusNode,
                                  //     onEditingComplete,
                                  //   ) {
                                  //     return TextFormField(
                                  //       validator: (value) {
                                  //         if (value == null || value.isEmpty) {
                                  //           return 'Select organization';
                                  //         } else {
                                  //           return null;
                                  //         }
                                  //       },
                                  //       controller: controller,
                                  //       focusNode: focusNode,
                                  //       decoration: InputDecoration(
                                  //         prefixIcon: Icon(
                                  //           Octicons.organization,
                                  //         ),
                                  //         isDense: true,
                                  //         labelText: 'Select organization type',
                                  //         labelStyle: TextStyle(
                                  //           color: Colors.grey,
                                  //         ),
                                  //         border: OutlineInputBorder(
                                  //           borderRadius: BorderRadius.circular(
                                  //             15,
                                  //           ),
                                  //         ),
                                  //       ),
                                  //     );
                                  //   },
                                  // ),
                                  // SizedBox(height: 20),
                                  TextFormField(
                                    validator: (value) {
                                      if (value == null ||
                                          value.isEmpty ||
                                          !value.contains('@')) {
                                        return 'Invalid Email';
                                      } else {
                                        return null;
                                      }
                                    },
                                    controller: _emailController,
                                    decoration: InputDecoration(
                                      isDense: true,
                                      hintText: 'Enter your e-mail',
                                      hintStyle: TextStyle(color: Colors.grey),
                                      prefixIcon: Icon(Fontisto.email),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.grey,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.black,
                                        ),
                                      ),
                                    ),
                                  ),
                                  SizedBox(height: 20),
                                  TextFormField(
                                    validator: (value) {
                                      if (value == null ||
                                          value.isEmpty ||
                                          !PasswordCheck().checkPassword(
                                            value.toString(),
                                          )) {
                                        return 'Password should countain at least 8 characters, one capital letter, one small letter, one digit, one special character and shouldn\'t contain any space';
                                      } else {
                                        return null;
                                      }
                                    },
                                    obscureText: obscured,
                                    controller: _passwordController,
                                    decoration: InputDecoration(
                                      errorMaxLines: 4,
                                      isDense: true,
                                      hintText: 'Enter your password',
                                      hintStyle: TextStyle(color: Colors.grey),
                                      prefixIcon: Icon(Feather.lock),
                                      suffixIcon: InkWell(
                                        onTap: () {
                                          setState(() {
                                            obscured = !obscured;
                                          });
                                        },
                                        child:
                                            obscured
                                                ? Icon(
                                                  MaterialIcons.visibility_off,
                                                )
                                                : Icon(
                                                  MaterialIcons.visibility,
                                                ),
                                      ),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.grey,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.black,
                                        ),
                                      ),
                                    ),
                                  ),
                                  SizedBox(height: 20),
                                  TextFormField(
                                    validator: (value) {
                                      if (value == null ||
                                          value.isEmpty ||
                                          value.toString() !=
                                              _passwordController.text) {
                                        return 'Password missmatched';
                                      } else {
                                        return null;
                                      }
                                    },
                                    obscureText: obscured2,
                                    controller: _confirmPasswordController,
                                    decoration: InputDecoration(
                                      isDense: true,
                                      hintText: 'Enter your password again',
                                      hintStyle: TextStyle(color: Colors.grey),
                                      prefixIcon: Icon(AntDesign.check),
                                      suffixIcon: InkWell(
                                        onTap: () {
                                          setState(() {
                                            obscured2 = !obscured2;
                                          });
                                        },
                                        child:
                                            obscured2
                                                ? Icon(
                                                  MaterialIcons.visibility_off,
                                                )
                                                : Icon(
                                                  MaterialIcons.visibility,
                                                ),
                                      ),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.grey,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                          color: Colors.black,
                                        ),
                                      ),
                                    ),
                                  ),

                                  SizedBox(height: 30),
                                  SizedBox(
                                    width: double.infinity,
                                    height: 50,
                                    child: FilledButton(
                                      style: ButtonStyle(
                                        shape: WidgetStateProperty.all(
                                          RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              15,
                                            ),
                                          ),
                                        ),
                                        backgroundColor:
                                            WidgetStateProperty.all(
                                              color.loginButtonColor,
                                            ),
                                        foregroundColor:
                                            WidgetStateProperty.all(
                                              Colors.white,
                                            ),
                                      ),
                                      onPressed: () {
                                        if (_formKey.currentState!.validate()) {
                                          _signUpBloc.add(
                                            SignUpButtonPressedEvent(
                                              username:
                                                  _userNameController.text
                                                      .trim(),
                                              email:
                                                  _emailController.text.trim(),
                                              password:
                                                  _passwordController.text
                                                      .trim(),
                                              firstName:
                                                  _firstNameController.text
                                                      .trim(),
                                              lastName:
                                                  _lastNameController.text
                                                      .trim(),
                                            ),
                                          );
                                        }
                                      },
                                      child: Text('Create Account'),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          SizedBox(height: 10),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 60),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text('Already have an account?'),
                                TextButton(
                                  onPressed: () {
                                    _signUpBloc.add(
                                      SignUpNavigateToLogInbuttonPressed(),
                                    );
                                  },
                                  child: Text(
                                    'Log In',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: color.loginButtonColor,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );

              default:
                return SizedBox();
            }
          },
        ),
      ),
    );
  }
}
