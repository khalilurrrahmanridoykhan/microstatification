import 'package:flutter/material.dart';
import 'package:gmgi_project/screens/follow_up/formPage/ui/formPage.dart';
import 'package:gmgi_project/utils/map_utils.dart';

class FillUpTile extends StatelessWidget {
  final dynamic formName;

  const FillUpTile({super.key, required this.formName});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          final metaRaw = formName['meta'];
          final meta = metaRaw is Map
              ? deepConvertToStringKeyedMap(
                  Map<dynamic, dynamic>.from(metaRaw),
                )
              : null;

          final questionsRaw = (formName['questions'] as List?) ?? const [];
          final questions = questionsRaw
              .whereType<Map>()
              .map(
                (q) => deepConvertToStringKeyedMap(
                  Map<dynamic, dynamic>.from(q),
                ),
              )
              .toList();

          print(meta);
          Navigator.push(
            context,
            MaterialPageRoute(
              builder:
                  (_) => FormPage(
                    formUid: formName['uid'],
                    name: formName['name'],
                    form: questions,
                    formMeta: meta,
                  ),
            ),
          );
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade300),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 6,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(Icons.description, color: Colors.blue),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      formName['name'] ?? 'Untitled Form',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Form ID: ${formName['uid']}',
                      style: TextStyle(
                        fontSize: 12.5,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
