class UserModel {
  String username;
  String email;
  String firstName;
  String lastName;
  int role;
  bool isStaff;
  String dateJoined;
  Map<String, List<dynamic>> profile;

  UserModel({
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.isStaff,
    required this.dateJoined,
    required this.profile,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    // Parse the profile field carefully, assuming profile is a map with list values
    Map<String, List<dynamic>> parsedProfile = {};
    if (json['profile'] != null) {
      json['profile'].forEach((key, value) {
        if (value is List) {
          parsedProfile[key] = value.cast<dynamic>();
        }
      });
    }

    return UserModel(
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      role: json['role'] ?? 0,
      isStaff: json['is_staff'] ?? false,
      dateJoined: json['date_joined'] ?? '',
      profile: parsedProfile,
    );
  }
}
