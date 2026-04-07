import 'package:flutter/foundation.dart';

Map<String, dynamic> deepConvertToStringKeyedMap(Map<dynamic, dynamic> source) {
  final result = <String, dynamic>{};

  source.forEach((key, value) {
    if (key == null) return; // Skip null keys defensively
    final keyString = key is String ? key : key.toString();
    result[keyString] = _normalizeValue(value);
  });

  return result;
}

dynamic _normalizeValue(dynamic value) {
  if (value is Map) {
    try {
      return deepConvertToStringKeyedMap(Map<dynamic, dynamic>.from(value));
    } catch (e) {
      debugPrint('Failed to normalise map value: $e');
      final map = value.map((key, val) => MapEntry(key, val));
      return deepConvertToStringKeyedMap(map);
    }
  }

  if (value is Iterable && value is! String) {
    return value.map(_normalizeValue).toList();
  }

  return value;
}
