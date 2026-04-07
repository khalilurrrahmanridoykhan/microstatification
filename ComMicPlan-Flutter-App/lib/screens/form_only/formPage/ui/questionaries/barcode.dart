import 'package:barcode_scan2/barcode_scan2.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class BarcodeQuestion extends StatefulWidget {
  final String label;
  final String xpath;
  final String kuid;
  final String? currentValue; // Current stored barcode value
  final String? defaultValue; // Optional default barcode value
  final Function(String?) onChanged;
  final bool readOnly; // Disable button if true

  const BarcodeQuestion({
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
  State<BarcodeQuestion> createState() => _BarcodeQuestionState();
}

class _BarcodeQuestionState extends State<BarcodeQuestion> {
  bool _loading = false;
  String? _barcodeValue;

  @override
  void initState() {
    super.initState();
    _initializeValue();
    // If read-only with a value, trigger onChanged
    if (widget.readOnly && _barcodeValue != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onChanged(_barcodeValue);
      });
    }
  }

  void _initializeValue() {
    setState(() {
      _barcodeValue = widget.currentValue ?? widget.defaultValue;
    });
  }

  Future<void> _scanBarcode() async {
    if (widget.readOnly) return;

    setState(() {
      _loading = true;
    });

    try {
      // Check camera permission
      var permission = await Permission.camera.status;
      if (permission.isDenied) {
        permission = await Permission.camera.request();
        if (permission.isDenied) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Camera permission is denied')),
          );
          setState(() {
            _loading = false;
          });
          return;
        }
      }

      if (permission.isPermanentlyDenied) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Camera permission is permanently denied. Please enable it in settings.',
            ),
          ),
        );
        setState(() {
          _loading = false;
        });
        return;
      }

      final result = await BarcodeScanner.scan(
        options: const ScanOptions(
          restrictFormat: [], // Empty list allows all formats
          useCamera: -1, // Default camera
          autoEnableFlash: false,
          android: AndroidOptions(aspectTolerance: 0.0, useAutoFocus: true),
        ),
      );

      if (result.rawContent.isNotEmpty) {
        setState(() {
          _barcodeValue = result.rawContent;
          widget.onChanged(_barcodeValue);
          debugPrint('Barcode scanned for ${widget.kuid}: $_barcodeValue');
        });
      } else {
        debugPrint('Barcode scan cancelled');
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Barcode scan cancelled')));
      }
    } catch (e) {
      debugPrint('Error scanning barcode: $e');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error scanning barcode: $e')));
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Re-initialize if currentValue changes externally
    if (_barcodeValue != widget.currentValue) {
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
              onPressed: widget.readOnly ? null : _scanBarcode,
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('Scan Barcode'),
            ),
            const SizedBox(height: 20),
            Text(
              _barcodeValue != null
                  ? 'Scanned Barcode: $_barcodeValue'
                  : 'No barcode scanned',
              textAlign: TextAlign.center,
            ),
          ],
        );
  }
}
