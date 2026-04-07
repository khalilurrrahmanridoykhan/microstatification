import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gmgi_project/bloc/follow_up/fillUp/bloc/fill_up_bloc.dart';
import 'package:gmgi_project/screens/follow_up/fillUp/ui/fillUpTile.dart';

class FillUp extends StatefulWidget {
  const FillUp({super.key});

  @override
  State<FillUp> createState() => _FillUpState();
}

class _FillUpState extends State<FillUp> {
  final _fillUpBloc = FillUpBloc();
  String _searchText = '';

  @override
  void initState() {
    _fillUpBloc.add(FillUpInitialEvent());
    super.initState();
  }

  @override
  void dispose() {
    _fillUpBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.grey[100],
        appBar: AppBar(
          title: const Text(
            'Select Form to Fill Up',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          centerTitle: true,
          backgroundColor: Colors.blue[300],
          foregroundColor: Colors.white,
          elevation: 1,
        ),
        body: BlocConsumer<FillUpBloc, FillUpState>(
          bloc: _fillUpBloc,
          listener: (context, state) {},
          builder: (context, state) {
            if (state is FillUpLoadingState) {
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Loading forms...'),
                  ],
                ),
              );
            }

            if (state is FillUpLoadedState) {
              if (state.form.isEmpty) {
                return const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.search_off, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No forms available.'),
                    ],
                  ),
                );
              }

              final allForms = state.form;
              final filteredForms = allForms.where((form) {
                final name = form['name']?.toString();
                if (name == null) return false;
                return name.toLowerCase().contains(
                      _searchText.toLowerCase(),
                    );
              }).toList();

              return Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    TextField(
                      onChanged: (val) => setState(() => _searchText = val),
                      decoration: InputDecoration(
                        hintText: 'Search forms...',
                        prefixIcon: const Icon(Icons.search),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 10,
                          horizontal: 16,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: filteredForms.isEmpty
                          ? const Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.search_off,
                                    size: 64,
                                    color: Colors.grey,
                                  ),
                                  SizedBox(height: 16),
                                  Text('No forms available.'),
                                ],
                              ),
                            )
                          : ListView.separated(
                              itemCount: filteredForms.length,
                              itemBuilder: (context, index) {
                                return FillUpTile(
                                  formName: filteredForms[index],
                                );
                              },
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: 10),
                            ),
                    ),
                  ],
                ),
              );
            }

            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red),
                  SizedBox(height: 16),
                  Text('Something went wrong or no data.'),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

