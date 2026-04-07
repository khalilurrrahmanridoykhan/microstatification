class Project {
  final dynamic id;
  final String name;
  final String description;
  final int organization;
  final String location;
  final List species;
  final String createdBy;

  Project({
    required this.id,
    required this.name,
    required this.description,
    required this.organization,
    required this.location,
    required this.species,
    required this.createdBy,
  });

  // Add toJson method for JSON serialization
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'organization': organization,
      'location': location,
      'species': species,
      'created_by': createdBy,
    };
  }
}
