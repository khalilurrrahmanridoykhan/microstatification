import 'package:flutter/material.dart';
import 'package:gmgi_project/bloc/backend/algorithms/available_update.dart';
import 'package:gmgi_project/models/form.dart';

class DownloadPageTile extends StatelessWidget {
  final FormUrl form;
  final bool isSelected;
  final Function(bool?)? onChanged;
  final VoidCallback? onTap;

  const DownloadPageTile({
    super.key,
    required this.form,
    required this.isSelected,
    this.onChanged,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: AvailableUpdate().isUpdateAvailable(form),
      builder: (context, snapshot) {
        final updateAvailable = snapshot.data ?? false;

        return AnimatedScale(
          scale: isSelected ? 0.98 : 1.0,
          duration: const Duration(milliseconds: 200),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: onChanged != null ? () => onChanged!(!isSelected) : onTap,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              margin: const EdgeInsets.symmetric(vertical: 4),
              decoration: BoxDecoration(
                color: isSelected ? Colors.blue.shade50 : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color:
                      isSelected
                          ? Theme.of(context).primaryColor
                          : Colors.grey.shade300,
                  width: 1.5,
                ),
                boxShadow: [
                  if (isSelected)
                    BoxShadow(
                      color: Theme.of(context).primaryColor.withOpacity(0.15),
                      blurRadius: 6,
                      offset: const Offset(0, 3),
                    ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          form.name,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color:
                                isSelected
                                    ? Theme.of(context).primaryColor
                                    : Colors.black,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              Icons.assignment,
                              size: 14,
                              color: Colors.blue.shade600,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              "Template Form",
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Colors.blue.shade600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          "Form ID: ${form.uid}",
                          style: TextStyle(
                            fontSize: 12.5,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        if (updateAvailable) ...[
                          const SizedBox(height: 4),
                          Text(
                            "Update available",
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.orange.shade700,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (onChanged != null)
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 250),
                      transitionBuilder:
                          (child, animation) =>
                              ScaleTransition(scale: animation, child: child),
                      child:
                          isSelected
                              ? const Icon(
                                Icons.check_circle,
                                color: Colors.green,
                                size: 24,
                                key: ValueKey(true),
                              )
                              : const Icon(
                                Icons.radio_button_unchecked,
                                color: Colors.grey,
                                size: 24,
                                key: ValueKey(false),
                              ),
                    ),
                  if (onChanged == null)
                    const Icon(
                      Icons.arrow_forward_ios,
                      color: Colors.grey,
                      size: 20,
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
