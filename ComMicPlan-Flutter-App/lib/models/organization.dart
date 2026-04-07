class Organization {
  final int id;
  final String name;
  final String description;
  final String type;
  final String website;
  final String email;
  final String location;

  Organization({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    required this.website,
    required this.email,
    required this.location,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'type': type,
      'location': location,
      'email': email,
      'website': location,
    };
  }
}
