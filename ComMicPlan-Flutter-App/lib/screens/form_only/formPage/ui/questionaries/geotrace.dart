import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';

class GeotraceQuestion extends StatefulWidget {
  final String label;
  final String xpath;
  final String kuid;
  final String? currentValue; // Current stored geotrace
  final String? defaultValue; // Optional default geotrace
  final Function(String?) onChanged;
  final bool readOnly; // Disable button if true

  const GeotraceQuestion({
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
  State<GeotraceQuestion> createState() => _GeotraceQuestionState();
}

class _GeotraceQuestionState extends State<GeotraceQuestion> {
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
    setState(() {
      _geoValue = widget.currentValue ?? widget.defaultValue;
      if (_geoValue != null && _geoValue!.isNotEmpty) {
        displayValue =
            _geoValue!.split(';').map((coord) => coord.trim()).toList();
      } else {
        displayValue = [];
      }
    });
  }

  Future<void> _checkPermissionsAndNavigate() async {
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
          setState(() {
            _loading = false;
          });
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
        setState(() {
          _loading = false;
        });
        return;
      }

      setState(() {
        _loading = false;
      });

      Navigator.push(
        context,
        MaterialPageRoute(
          builder:
              (context) => GeotraceMapScreen(
                label: widget.label,
                xpath: widget.xpath,
                kuid: widget.kuid,
                currentValue: _geoValue,
                onChanged: (value) {
                  setState(() {
                    _geoValue = value;
                    displayValue =
                        value != null && value.isNotEmpty
                            ? value
                                .split(';')
                                .map((coord) => coord.trim())
                                .toList()
                            : [];
                  });
                  widget.onChanged(value);
                },
                readOnly: widget.readOnly,
              ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error checking permissions: $e')));
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
            Text(widget.label, style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: widget.readOnly ? null : _checkPermissionsAndNavigate,
              icon: const Icon(Icons.polyline),
              label: const Text("Get Line"),
            ),
            const SizedBox(height: 20),
            displayValue.isNotEmpty
                ? Column(
                  children:
                      displayValue
                          .asMap()
                          .entries
                          .map(
                            (entry) => Padding(
                              padding: const EdgeInsets.symmetric(
                                vertical: 5.0,
                              ),
                              child: Text(
                                'Point ${entry.key + 1}: ${entry.value}',
                              ),
                            ),
                          )
                          .toList(),
                )
                : const Text('No line selected'),
          ],
        );
  }
}

class GeotraceMapScreen extends StatefulWidget {
  final String label;
  final String xpath;
  final String kuid;
  final String? currentValue;
  final ValueChanged<String?> onChanged;
  final bool readOnly;

  const GeotraceMapScreen({
    super.key,
    required this.label,
    required this.xpath,
    required this.kuid,
    this.currentValue,
    required this.onChanged,
    this.readOnly = false,
  });

  @override
  State<GeotraceMapScreen> createState() => _GeotraceMapScreenState();
}

class _GeotraceMapScreenState extends State<GeotraceMapScreen> {
  final MapController _mapController = MapController();
  List<LatLng> _points = [];
  LatLng? _currentLocation;
  bool _locationPermissionDenied = false;
  bool _isMapReady = false;
  bool _isMapRendered = false;
  bool _isAutomaticMode = false;
  StreamSubscription<Position>? _positionStream;
  Timer? _autoPointTimer;
  int _selectedDuration = 10; // Default duration in seconds

  @override
  void initState() {
    super.initState();
    if (widget.currentValue != null && widget.currentValue!.isNotEmpty) {
      _points = _parseGeotrace(widget.currentValue!);
    }
    _getUserLocation();
    if (!widget.readOnly) {
      _startLocationUpdates();
    }
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    _autoPointTimer?.cancel();
    super.dispose();
  }

  List<LatLng> _parseGeotrace(String value) {
    List<LatLng> points = [];
    try {
      final coordinates = value.split(';');
      for (var coord in coordinates) {
        final parts = coord.trim().split(' ');
        if (parts.length >= 2) {
          final lat = double.tryParse(parts[0]);
          final lon = double.tryParse(parts[1]);
          if (lat != null && lon != null && lat.isFinite && lon.isFinite) {
            points.add(LatLng(lat, lon));
          } else {
            debugPrint('Invalid coordinate: $coord');
          }
        }
      }
    } catch (e) {
      debugPrint('Error parsing geotrace: $e');
    }
    return points;
  }

  String _pointsToGeotraceString() {
    if (_points.isEmpty) return '';
    return _points.map((p) => '${p.latitude} ${p.longitude} 0.0 0.0').join(';');
  }

  Future<void> _getUserLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _locationPermissionDenied = true;
          _isMapReady = true;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _locationPermissionDenied = true;
            _isMapReady = true;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _locationPermissionDenied = true;
          _isMapReady = true;
        });
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      if (position.latitude.isFinite && position.longitude.isFinite) {
        setState(() {
          _currentLocation = LatLng(position.latitude, position.longitude);
          _isMapReady = true;
          _locationPermissionDenied = false;
        });
        if (_isMapRendered && _points.isEmpty && mounted) {
          _mapController.move(_currentLocation!, 13.0);
        }
      } else {
        debugPrint(
          'Invalid initial location: ${position.latitude}, ${position.longitude}',
        );
        setState(() {
          _isMapReady = true;
          _locationPermissionDenied = true;
        });
      }
    } catch (e) {
      debugPrint('Error getting initial location: $e');
      setState(() {
        _isMapReady = true;
      });
    }
  }

  void _startLocationUpdates() {
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    );

    _positionStream = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        if (!mounted) return;
        try {
          if (position.latitude.isFinite && position.longitude.isFinite) {
            setState(() {
              _currentLocation = LatLng(position.latitude, position.longitude);
            });
            if (_points.isEmpty && _isMapRendered) {
              _mapController.move(_currentLocation!, 13.0);
            }
          } else {
            debugPrint(
              'Invalid location update: ${position.latitude}, ${position.longitude}',
            );
          }
        } catch (e) {
          debugPrint('Error in location stream: $e');
        }
      },
      onError: (e) {
        debugPrint('Location stream error: $e');
        setState(() {
          _locationPermissionDenied = true;
        });
      },
    );
  }

  void _onMapTap(TapPosition tapPosition, LatLng point) {
    if (!mounted || _isAutomaticMode || widget.readOnly) return;
    try {
      if (!point.latitude.isFinite || !point.longitude.isFinite) {
        debugPrint(
          'Invalid tap coordinates: ${point.latitude}, ${point.longitude}',
        );
        return;
      }
      debugPrint('Tap detected at: ${point.latitude}, ${point.longitude}');
      setState(() {
        if (_points.isEmpty || _points.last != point) {
          _points.add(point);
          widget.onChanged(_pointsToGeotraceString());
          _fitBounds();
        }
      });
    } catch (e) {
      debugPrint('Error in _onMapTap: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to add point: $e'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  void _addCurrentLocationPoint() {
    if (!mounted || _currentLocation == null || widget.readOnly) return;
    try {
      if (!_currentLocation!.latitude.isFinite ||
          !_currentLocation!.longitude.isFinite) {
        debugPrint(
          'Invalid current location: ${_currentLocation!.latitude}, ${_currentLocation!.longitude}',
        );
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invalid current location.'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 2),
          ),
        );
        return;
      }
      setState(() {
        if (_points.isEmpty || _points.last != _currentLocation) {
          _points.add(_currentLocation!);
          widget.onChanged(_pointsToGeotraceString());
          _fitBounds();
        }
      });
    } catch (e) {
      debugPrint('Error adding current location point: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to add current location: $e'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  void _toggleAutomaticMode(int? duration) {
    if (widget.readOnly) return;
    if (duration == null) {
      setState(() {
        _isAutomaticMode = false;
      });
      _autoPointTimer?.cancel();
      return;
    }

    setState(() {
      _isAutomaticMode = true;
      _selectedDuration = duration;
    });

    _autoPointTimer?.cancel();
    _autoPointTimer = Timer.periodic(Duration(seconds: duration), (timer) {
      if (!mounted || _currentLocation == null || !_isAutomaticMode) {
        timer.cancel();
        return;
      }
      try {
        if (_currentLocation!.latitude.isFinite &&
            _currentLocation!.longitude.isFinite) {
          setState(() {
            if (_points.isEmpty || _points.last != _currentLocation) {
              _points.add(_currentLocation!);
              widget.onChanged(_pointsToGeotraceString());
              _fitBounds();
            }
          });
        } else {
          debugPrint(
            'Invalid auto point location: ${_currentLocation!.latitude}, ${_currentLocation!.longitude}',
          );
        }
      } catch (e) {
        debugPrint('Error in auto point addition: $e');
      }
    });
  }

  void _showDurationDialog() {
    if (widget.readOnly) return;
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Select Auto Mode Duration'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('5 seconds'),
                onTap: () {
                  _toggleAutomaticMode(5);
                  Navigator.pop(context);
                },
              ),
              ListTile(
                title: const Text('10 seconds'),
                onTap: () {
                  _toggleAutomaticMode(10);
                  Navigator.pop(context);
                },
              ),
              ListTile(
                title: const Text('15 seconds'),
                onTap: () {
                  _toggleAutomaticMode(15);
                  Navigator.pop(context);
                },
              ),
              if (_isAutomaticMode)
                ListTile(
                  title: const Text('Turn Off Auto Mode'),
                  onTap: () {
                    _toggleAutomaticMode(null);
                    Navigator.pop(context);
                  },
                ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
          ],
        );
      },
    );
  }

  void _fitBounds() {
    if (!mounted || !_isMapRendered || _points.length < 2) return;
    try {
      final validPoints =
          _points
              .where((p) => p.latitude.isFinite && p.longitude.isFinite)
              .toList();
      if (validPoints.length < 2) {
        debugPrint(
          'Not enough valid points to fit bounds: ${validPoints.length}',
        );
        return;
      }
      bool allIdentical = true;
      for (int i = 1; i < validPoints.length; i++) {
        if (validPoints[i] != validPoints[0]) {
          allIdentical = false;
          break;
        }
      }
      if (allIdentical) {
        debugPrint('All points are identical, skipping fitBounds');
        return;
      }
      final bounds = LatLngBounds.fromPoints(validPoints);
      if (bounds.southWest.latitude.isFinite &&
          bounds.southWest.longitude.isFinite &&
          bounds.northEast.latitude.isFinite &&
          bounds.northEast.longitude.isFinite) {
        _mapController.fitCamera(
          CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(50.0)),
        );
      } else {
        debugPrint('Invalid bounds: $bounds');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cannot fit map to points: Invalid bounds.'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error fitting bounds: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error fitting map bounds: $e'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  void _removeLastPoint() {
    if (!mounted || _points.isEmpty || widget.readOnly) return;
    try {
      setState(() {
        _points.removeLast();
        widget.onChanged(_pointsToGeotraceString());
        if (_points.length >= 2) {
          _fitBounds();
        } else if (_isMapRendered &&
            _currentLocation != null &&
            _currentLocation!.latitude.isFinite &&
            _currentLocation!.longitude.isFinite) {
          _mapController.move(_currentLocation!, 13.0);
        }
      });
    } catch (e) {
      debugPrint('Error removing last point: $e');
    }
  }

  void _clearAllPoints() {
    if (!mounted || widget.readOnly) return;
    try {
      setState(() {
        _points.clear();
        widget.onChanged('');
        if (_isMapRendered &&
            _currentLocation != null &&
            _currentLocation!.latitude.isFinite &&
            _currentLocation!.longitude.isFinite) {
          _mapController.move(_currentLocation!, 13.0);
        }
      });
    } catch (e) {
      debugPrint('Error clearing polyline: $e');
    }
  }

  void _onMapCreated() {
    setState(() {
      _isMapRendered = true;
    });
    if (_currentLocation != null &&
        _points.isEmpty &&
        _currentLocation!.latitude.isFinite &&
        _currentLocation!.longitude.isFinite) {
      _mapController.move(_currentLocation!, 13.0);
    }
    if (_points.length >= 2) {
      _fitBounds();
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.label,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _locationPermissionDenied
                        ? 'Location permission denied. ${widget.readOnly
                            ? 'Read-only mode.'
                            : _isAutomaticMode
                            ? 'Automatic mode disabled.'
                            : 'Tap to add points.'}'
                        : widget.readOnly
                        ? 'Read-only mode. Displaying existing line.'
                        : _isAutomaticMode
                        ? 'Automatic mode: Adding points every $_selectedDuration seconds. ${_points.isNotEmpty ? "Points: ${_points.length}" : ""}'
                        : _currentLocation != null
                        ? 'Tap to add points to form a polyline. ${_points.isNotEmpty ? "Points: ${_points.length}" : ""}'
                        : 'Fetching current location...',
                    style: const TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                ],
              ),
            ),
            Expanded(
              child:
                  _isMapReady
                      ? Stack(
                        children: [
                          FlutterMap(
                            mapController: _mapController,
                            options: MapOptions(
                              initialCenter:
                                  _currentLocation ??
                                  const LatLng(51.509364, -0.128928),
                              initialZoom: 13.0,
                              onTap: widget.readOnly ? null : _onMapTap,
                              onMapReady: _onMapCreated,
                              interactionOptions: const InteractionOptions(
                                flags:
                                    InteractiveFlag.all &
                                    ~InteractiveFlag.rotate,
                              ),
                            ),
                            children: [
                              TileLayer(
                                urlTemplate:
                                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                userAgentPackageName: 'com.example.app',
                                maxZoom: 19,
                                minZoom: 1,
                              ),
                              if (_points.length >= 2)
                                PolylineLayer(
                                  polylines: [
                                    Polyline(
                                      points: _points,
                                      strokeWidth: 4.0,
                                      color: Colors.redAccent,
                                    ),
                                  ],
                                ),
                              MarkerLayer(
                                markers: [
                                  if (_currentLocation != null &&
                                      _currentLocation!.latitude.isFinite &&
                                      _currentLocation!.longitude.isFinite)
                                    Marker(
                                      point: _currentLocation!,
                                      width: 40,
                                      height: 40,
                                      child: const Icon(
                                        Ionicons.ios_location,
                                        color: Colors.red,
                                        size: 25,
                                      ),
                                    ),
                                  ..._points.asMap().entries.map((entry) {
                                    final point = entry.value;
                                    if (!point.latitude.isFinite ||
                                        !point.longitude.isFinite) {
                                      debugPrint(
                                        'Invalid marker point: ${point.latitude}, ${point.longitude}',
                                      );
                                      return null;
                                    }
                                    return Marker(
                                      point: point,
                                      width: 40,
                                      height: 40,
                                      child: Stack(
                                        alignment: Alignment.center,
                                        children: [
                                          const Icon(
                                            Octicons.dot_fill,
                                            color: Colors.blueAccent,
                                            size: 40,
                                          ),
                                          Text(
                                            '${entry.key + 1}',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }).whereType<Marker>(),
                                ],
                              ),
                            ],
                          ),
                          Positioned(
                            bottom: 16,
                            right: 16,
                            child: Column(
                              children: [
                                if (!widget.readOnly)
                                  FloatingActionButton(
                                    onPressed:
                                        _points.isNotEmpty
                                            ? _clearAllPoints
                                            : null,
                                    backgroundColor:
                                        _points.isNotEmpty && !_isAutomaticMode
                                            ? Colors.blue
                                            : Colors.grey,
                                    tooltip: 'Clear All Points',
                                    child: const Icon(
                                      AntDesign.delete,
                                      color: Colors.white,
                                    ),
                                  ),
                                if (!widget.readOnly)
                                  const SizedBox(height: 10),
                                if (!widget.readOnly)
                                  FloatingActionButton(
                                    onPressed:
                                        _points.isNotEmpty
                                            ? _removeLastPoint
                                            : null,
                                    backgroundColor:
                                        _points.isNotEmpty && !_isAutomaticMode
                                            ? Colors.blue
                                            : Colors.grey,
                                    tooltip: 'Remove Last Point',
                                    child: const Icon(
                                      Ionicons.md_backspace,
                                      color: Colors.white,
                                    ),
                                  ),
                                if (!widget.readOnly)
                                  const SizedBox(height: 10),
                                if (!widget.readOnly)
                                  FloatingActionButton(
                                    onPressed:
                                        (_currentLocation != null &&
                                                _currentLocation!
                                                    .latitude
                                                    .isFinite &&
                                                _currentLocation!
                                                    .longitude
                                                    .isFinite &&
                                                !_isAutomaticMode)
                                            ? _addCurrentLocationPoint
                                            : null,
                                    backgroundColor:
                                        (_currentLocation != null &&
                                                _currentLocation!
                                                    .latitude
                                                    .isFinite &&
                                                _currentLocation!
                                                    .longitude
                                                    .isFinite &&
                                                !_isAutomaticMode)
                                            ? Colors.blue
                                            : Colors.grey,
                                    tooltip: 'Add Current Point',
                                    child: const Icon(
                                      Icons.add,
                                      color: Colors.white,
                                    ),
                                  ),
                                if (!widget.readOnly)
                                  const SizedBox(height: 10),
                                if (!widget.readOnly)
                                  FloatingActionButton(
                                    onPressed:
                                        _locationPermissionDenied
                                            ? null
                                            : _showDurationDialog,
                                    backgroundColor:
                                        _locationPermissionDenied
                                            ? Colors.grey
                                            : Colors.blue,
                                    tooltip:
                                        _isAutomaticMode
                                            ? 'Change Auto Mode Duration'
                                            : 'Start Auto Mode',
                                    child: Icon(
                                      _isAutomaticMode
                                          ? Icons.timer
                                          : Icons.timer_outlined,
                                      color: Colors.white,
                                    ),
                                  ),
                                const SizedBox(height: 10),
                                FloatingActionButton(
                                  onPressed: () => Navigator.pop(context),
                                  backgroundColor: Colors.blue,
                                  tooltip: 'Save and Exit',
                                  child: const Icon(
                                    Ionicons.save,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                      : const Center(child: CircularProgressIndicator()),
            ),
          ],
        ),
      ),
    );
  }
}
