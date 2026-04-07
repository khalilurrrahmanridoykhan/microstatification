import 'package:flutter/material.dart';
import 'package:gmgi_project/bloc/follow_up/downloadPage/bloc/download_page_bloc.dart';
import 'package:gmgi_project/models/form.dart';
import 'package:gmgi_project/screens/follow_up/downloadPage/ui/downloadPageTile.dart';
import 'package:gmgi_project/theme/colors/colors.dart';

class DownloadChildPage extends StatelessWidget {
  final List<FormUrl> forms;

  DownloadChildPage({super.key, required this.forms});
  final _downloadPageBloc = DownloadPageBloc();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Selected Child Forms",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body:
          forms.isEmpty
              ? const Center(child: Text("No forms selected."))
              : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: forms.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final form = forms[index];
                  return DownloadPageTile(
                    form: form,
                    isSelected: true,
                    onChanged: null, // disable re-selection here
                    onTap: null,
                  );
                },
              ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: FilledButton.icon(
          icon: const Icon(Icons.download),
          label: const Text("Confirm Download"),
          onPressed: () async {
            if (forms.isNotEmpty) {
              _downloadPageBloc.add(
                DownloadPageDownloadButtonPressedEvent(forms: forms.toSet()),
              );
              Navigator.pop(context);
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Please select at least one form.'),
                  backgroundColor: Colors.orange,
                ),
              );
            }

            // close after download
          },
        ),
      ),
    );
  }
}
