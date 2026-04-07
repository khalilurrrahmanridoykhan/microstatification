// main.dart
// Run: dart run main.dart

class ParsedIf {
  final String variable; // e.g., "district"
  final Map<String, String> mapping; // e.g., {"bandarban": "lama", ...}
  final String defaultValue; // e.g., ""
  ParsedIf(this.variable, this.mapping, this.defaultValue);

  @override
  String toString() =>
      'ParsedIf(variable: $variable, mapping: $mapping, default: "$defaultValue")';
}

/// Parses a KoBo/XLSForm-style nested if expression like:
/// if(${district} = 'bandarban', 'lama',
/// if(${district} = 'chottogram', 'baskhali',
/// ...
/// if(${district} = 'barishal', 'hizla', '')))
ParsedIf parseNestedIf(String expr) {
  // 1) Extract triplets: ${var} = 'key' , 'value'
  final tripletRe = RegExp(
    r"if\(\s*\$\{([^}]+)\}\s*=\s*'([^']+)'\s*,\s*'([^']+)'\s*,?",
    multiLine: true,
    caseSensitive: false,
  );

  // 2) Extract the final default value (the last 'something' before closing parens)
  final defaultRe = RegExp(
    r",\s*'([^']*)'\s*\)+\s*$",
    multiLine: true,
    caseSensitive: false,
  );

  final mapping = <String, String>{};
  String? variableName;

  for (final m in tripletRe.allMatches(expr)) {
    final varName = m.group(1)!; // e.g., district
    final key = m.group(2)!; // e.g., bandarban
    final value = m.group(3)!; // e.g., lama
    variableName ??= varName;
    if (variableName != varName) {
      throw FormatException(
        "Mixed variables in expression: '$variableName' vs '$varName'",
      );
    }
    mapping[key] = value;
  }

  if (variableName == null) {
    throw FormatException(
      "Expression does not match expected nested-if format.",
    );
  }

  final defMatch = defaultRe.firstMatch(expr);
  final defaultValue = defMatch?.group(1) ?? "";

  return ParsedIf(variableName, mapping, defaultValue);
}

/// Resolves the output given the expression and a map containing current trigger values.
/// Example: resolveFromExpr(expr, {"district": "bandarban"}) -> "lama"
String resolveFromExpr(String expr, Map<String, String> context) {
  final parsed = parseNestedIf(expr);
  final triggerValue = context[parsed.variable];
  if (triggerValue == null) return parsed.defaultValue;
  return parsed.mapping[triggerValue] ?? parsed.defaultValue;
}

/// Convenience helper if you have the trigger string like "${district}" and its current value.
String resolveWithTrigger(
  String expr,
  String triggerLiteral,
  String currentValue,
) {
  // Turn "${district}" -> "district"
  final triggerName = triggerLiteral.replaceAll(RegExp(r'^\$\{|\}$'), '');
  print(triggerName);
  final parsed = parseNestedIf(expr);
  if (parsed.variable != triggerName) {
    // Not strictly necessary, but it helps catch mismatches.
    throw ArgumentError(
      "Trigger '$triggerName' doesn't match expression variable '${parsed.variable}'.",
    );
  }
  return parsed.mapping[currentValue] ?? parsed.defaultValue;
}
