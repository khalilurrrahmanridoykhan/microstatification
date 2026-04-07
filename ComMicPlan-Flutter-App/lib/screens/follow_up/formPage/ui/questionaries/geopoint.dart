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

  const GeopointQuestion({
    super.key,
    required this.label,
    required this.xpath,
    required this.kuid,
    this.currentValue,
    this.defaultValue,
    required this.onChanged,
    this.readOnly = false,
  });

  @override
  State<GeopointQuestion> createState() => _GeopointQuestionState();
}

class _GeopointQuestionState extends State<GeopointQuestion> {
  bool _loading = false;
  List<String> displayValue = [];
  String? _geoValue;

  @override
  void initState() {
    super.initState();
    _initializeValue();
    // If read-only with a value, trigger onChanged
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

  @override
  Widget build(BuildContext context) {
    // Re-initialize if currentValue changes externally
    if (_geoValue != widget.currentValue) {
      _initializeValue();
    }

    return _loading
        ? const Center(child: CircularProgressIndicator())
        : Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(widget.label, style: const TextStyle(fontSize: 30)),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: widget.readOnly ? null : _getCurrentLocation,
              icon: const Icon(Icons.location_on),
              label: const Text("Get Current Location"),
            ),
            const SizedBox(height: 20),
            Text(
              _geoValue != null
                  ? 'Longitude: ${displayValue[0]}'
                  : 'No location selected',
            ),
            const SizedBox(height: 10),
            Text(
              _geoValue != null
                  ? 'Latitude: ${displayValue[1]}'
                  : 'No location selected',
            ),
            const SizedBox(height: 10),
            Text(
              _geoValue != null
                  ? 'Altitude: ${displayValue[2]}'
                  : 'No location selected',
            ),
            const SizedBox(height: 10),
            Text(
              _geoValue != null
                  ? 'Accuracy: ${displayValue[3]}'
                  : 'No location selected',
            ),
          ],
        );
  }
}
