import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

class GeopointQuestion extends StatefulWidget {
  final String label;
  final String xpath;
  final String kuid;
  final String? currentValue; // Current stored geopoint
  final String? defaultValue; // Optional default geopoint
  final Function(String?) onChanged;
  final bool readOnly; // Disable button if true

  // NEW: constraint support
  final String constraint; // e.g. selected-at(., 3) <= 10
  final String constraintMessage;

  const GeopointQuestion({
    super.key,
    required this.label,
    required this.xpath,
    required this.kuid,
    this.currentValue,
    this.defaultValue,
    required this.onChanged,
    this.readOnly = false,
    this.constraint = "",
    this.constraintMessage = "",
  });

  @override
  State<GeopointQuestion> createState() => _GeopointQuestionState();
}

class _GeopointQuestionState extends State<GeopointQuestion> {
  bool _loading = false;
  List<String> displayValue = [];
  String? _geoValue;
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _initializeValue();

    if (widget.readOnly && _geoValue != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onChanged(_geoValue);
      });
    }
  }

  void _initializeValue() {
    _geoValue = widget.currentValue ?? widget.defaultValue;
    if (_geoValue != null) {
      displayValue = _geoValue!.split(' ');
      _validateConstraint();
    }
  }

  Future<void> _getCurrentLocation() async {
    if (widget.readOnly) return;

    setState(() {
      _loading = true;
    });

    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permissions are denied')),
          );
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Location permissions are permanently denied, cannot request permissions.',
            ),
          ),
        );
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      final location =
          '${position.longitude} ${position.latitude} ${position.altitude} ${position.accuracy}';

      setState(() {
        _geoValue = location;
        displayValue = location.split(' ');
        _validateConstraint();
      });

      widget.onChanged(location);
      debugPrint('Geopoint set for ${widget.kuid}: $location');
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error getting location: $e')));
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  /// ✅ Custom constraint validation
  void _validateConstraint() {
    _errorText = null;

    if (_geoValue == null || widget.constraint.isEmpty) return;

    // Example: selected-at(., 3) <= 10
    final regex = RegExp(r"selected-at\(., (\d+)\)\s*([<>=!]+)\s*(\d+)");
    final match = regex.firstMatch(widget.constraint);

    if (match != null) {
      final index = int.parse(match.group(1)!); // e.g. 3
      final operator = match.group(2)!; // e.g. <=
      final threshold = double.tryParse(match.group(3)!) ?? 0;

      if (displayValue.length > index) {
        final actual = double.tryParse(displayValue[index]) ?? double.infinity;

        bool valid = true;
        switch (operator) {
          case "<":
            valid = actual < threshold;
            break;
          case "<=":
            valid = actual <= threshold;
            break;
          case ">":
            valid = actual > threshold;
            break;
          case ">=":
            valid = actual >= threshold;
            break;
          case "=":
          case "==":
            valid = actual == threshold;
            break;
          case "!=":
            valid = actual != threshold;
            break;
        }

        if (!valid) {
          _errorText =
              widget.constraintMessage.isNotEmpty
                  ? widget.constraintMessage
                  : "Constraint not satisfied";
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Re-initialize if currentValue changes externally
    if (_geoValue != widget.currentValue) {
      _initializeValue();
    }

    return _loading
        ? const Center(child: CircularProgressIndicator())
        : FormField<String>(
            validator: (_) {
              // Required check
              if (!widget.readOnly &&
                  widget.constraint.isEmpty &&
                  _geoValue == null) {
                return "Location is required";
              }

              // Custom constraint check
              if (_errorText != null) {
                return _errorText;
              }

              return null;
            },
            builder: (field) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(widget.label, style: const TextStyle(fontSize: 18)),
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      onPressed: widget.readOnly ? null : _openLocationDialog,
                      icon: const Icon(Icons.location_on),
                      label: const Text("Get Current Location"),
                    ),

                    const SizedBox(height: 20),
                    if (_geoValue != null) ...[
                      Text('Longitude: ${displayValue[0]}'),
                      const SizedBox(height: 10),
                      Text('Latitude: ${displayValue[1]}'),
                      const SizedBox(height: 10),
                      Text('Altitude: ${displayValue[2]}'),
                      const SizedBox(height: 10),
                      Text('Accuracy: ${displayValue[3]} m'),
                    ] else
                      const Text('No location selected'),

                    if (field.errorText != null) ...[
                      const SizedBox(height: 16),
                      Text(
                        field.errorText!,
                        style: const TextStyle(
                          color: Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ],
                ),
              );
            },
          );
  }

  Future<void> _openLocationDialog() async {
    if (widget.readOnly) return;

    // --- Check & request permission ---
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Location permissions are denied')),
        );
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Location permissions are permanently denied, cannot request permissions.',
          ),
        ),
      );
      return;
    }

    // --- Initialize variables ---
    bool saving = false;
    Position? latestPosition;
    final startTime = DateTime.now();

    Stream<Position> positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.best,
        distanceFilter: 0,
      ),
    );

    // Extract accuracy threshold if constraint exists
    double? accuracyThreshold;
    if (widget.constraint.isNotEmpty) {
      final regex = RegExp(
        r"selected-at\(., (\d+)\)\s*([<>=!]+)\s*(\d+\.?\d*)",
      );
      final match = regex.firstMatch(widget.constraint);
      if (match != null && int.parse(match.group(1)!) == 3) {
        accuracyThreshold = double.tryParse(match.group(3)!);
      }
    }

    // --- Show dialog ---
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, dialogSetState) {
            Timer? timer;

            // Update UI every second for elapsed time
            timer = Timer.periodic(const Duration(seconds: 1), (_) {
              if (ctx.mounted) {
                dialogSetState(() {});
              } else {
                timer?.cancel();
              }
            });

            void closeDialog() {
              timer?.cancel();
              Navigator.pop(ctx);
            }

            return AlertDialog(
              title: const Text("Getting Location"),
              content: StreamBuilder<Position>(
                stream: positionStream,
                builder: (context, snapshot) {
                  if (snapshot.hasData) latestPosition = snapshot.data;
                  final pos = latestPosition;

                  final elapsed = DateTime.now().difference(startTime);
                  final minutes = elapsed.inMinutes;
                  final seconds = elapsed.inSeconds % 60;

                  if (pos == null) {
                    return const SizedBox(
                      height: 60,
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }

                  return Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text("Longitude: ${pos.longitude.toStringAsFixed(6)}"),
                      Text("Latitude: ${pos.latitude.toStringAsFixed(6)}"),
                      Text("Altitude: ${pos.altitude.toStringAsFixed(2)} m"),
                      Text(
                        "Accuracy: ${pos.accuracy.toStringAsFixed(2)} m",
                        style: TextStyle(
                          color:
                              (accuracyThreshold != null &&
                                      pos.accuracy <= accuracyThreshold)
                                  ? Colors.green
                                  : Colors.orange,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        "Elapsed time: ${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}",
                        style: const TextStyle(fontSize: 12),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        "Click Save to store this location.",
                        style: TextStyle(fontSize: 12),
                      ),
                    ],
                  );
                },
              ),
              actions: [
                TextButton(onPressed: closeDialog, child: const Text("Cancel")),
                ElevatedButton(
                  onPressed:
                      (latestPosition != null && !saving)
                          ? () {
                            dialogSetState(() => saving = true);
                            timer?.cancel();

                            final location =
                                '${latestPosition!.longitude} ${latestPosition!.latitude} ${latestPosition!.altitude} ${latestPosition!.accuracy}';

                            setState(() {
                              _geoValue = location;
                              displayValue = location.split(' ');
                              _validateConstraint();
                            });

                            widget.onChanged(location);

                            Navigator.pop(ctx);
                          }
                          : null,
                  child:
                      saving
                          ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                          : const Text("Save"),
                ),
              ],
            );
          },
        );
      },
    );

    if (mounted) setState(() {});
  }
}
