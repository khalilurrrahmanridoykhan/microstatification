import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:gmgi_project/bloc/backend/authorization/login_auth.dart';
import 'package:hive/hive.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart';
import 'package:image/image.dart' as img; // Add image package for compression
import 'package:device_info_plus/device_info_plus.dart'; // Add for device ID

class SubmitForm {
  final Map<String, dynamic> answers;
  final String formId;

  SubmitForm({required this.answers, required this.formId});

  Future<void> submitForm() async {
    final String baseFormUrl = dotenv.env['FORM_SUBMIT_URL'] ?? '';
    final String baseMediaUrl = dotenv.env['MEDIA_UPLOAD_URL'] ?? '';

    if (baseFormUrl.isEmpty || baseMediaUrl.isEmpty) {
      throw Exception(
        'Missing FORM_SUBMIT_URL or MEDIA_UPLOAD_URL in .env file',
      );
    }

    final Uri formSubmitUrl = Uri.parse('$baseFormUrl/$formId/submit/');
    final Uri mediaUploadUrl = Uri.parse('$baseMediaUrl/$formId/submit-media/');
    final String? token = await LoginAuth.getStoredToken();
    final String? csrfToken = await LoginAuth.getStoredCsrfToken();

    final Map<String, dynamic> originalAnswers = Map<String, dynamic>.from(
      answers,
    );
    final Map<String, dynamic> submissionData = Map<String, dynamic>.from(
      answers,
    );

    // Step 1: Get submitAs name and device ID
    final box = await Hive.openBox('appData');
    final String submitAsName = box.get('submitAs', defaultValue: '');
    final DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
    String? deviceId;

    try {
      if (Platform.isAndroid) {
        final androidInfo = await deviceInfo.androidInfo;
        deviceId = androidInfo.id; // Unique device ID for Android
      } else if (Platform.isIOS) {
        final iosInfo = await deviceInfo.iosInfo;
        deviceId = iosInfo.identifierForVendor; // Unique device ID for iOS
      }
    } catch (e) {
      debugPrint('Failed to get device ID: $e');
      deviceId = 'unknown';
    }

    // Add submitAs and deviceId to submissionData
    submissionData['submitAs'] = submitAsName.isNotEmpty ? submitAsName : null;
    submissionData['deviceId'] = deviceId;

    submissionData.remove('meta');
    debugPrint('Original submission data: ${submissionData.toString()}');

    try {
      /// Step 2: Collect media files, compress images, and check total size
      final mediaFiles = <String, File>{};
      int totalFileSizeInBytes = 0;

      for (final entry in submissionData.entries) {
        final value = entry.value;
        if (value is String && _isSupportedMedia(value)) {
          final file = File(value);
          if (file.existsSync()) {
            File processedFile = file;
            // Compress if it's an image
            if (_isImage(value)) {
              processedFile = await _compressImage(file);
            }
            mediaFiles[entry.key] = processedFile;
            // Calculate file size
            final fileSizeInBytes = processedFile.lengthSync();
            totalFileSizeInBytes += fileSizeInBytes;
            // Replace full path with just filename.extension in submissionData
            submissionData[entry.key] = basename(processedFile.path);
          }
        }
      }

      /// Step 3: Check total file size (5 MB = 5,000,000 bytes)
      const maxTotalSizeInBytes = 5 * 1024 * 1024; // 5 MB in bytes
      if (mediaFiles.isNotEmpty && totalFileSizeInBytes > maxTotalSizeInBytes) {
        final totalSizeInMB = totalFileSizeInBytes / (1024 * 1024);
        debugPrint(
          '❌ Total media file size (${totalSizeInMB.toStringAsFixed(2)} MB) exceeds 5 MB limit',
        );
        throw Exception(
          'Total media file size (${totalSizeInMB.toStringAsFixed(2)} MB) exceeds the 5 MB limit',
        );
      }

      debugPrint('Total file size: $totalFileSizeInBytes bytes');

      /// Step 4: Upload media files if within size limit
      if (mediaFiles.isNotEmpty) {
        await _uploadAllMediaFiles(
          mediaUploadUrl,
          mediaFiles,
          token,
          csrfToken,
        );
      }

      /// Step 5: Ensure all string values in submissionData are checked for media paths
      for (final entry in submissionData.entries) {
        final value = entry.value;
        if (value is String && _isSupportedMedia(value)) {
          // Ensure only filename.extension is included, even if full path persists
          submissionData[entry.key] = basename(value);
        }
      }

      /// Step 6: Submit JSON
      debugPrint('📤 Submitting form JSON: ${jsonEncode(submissionData)}');

      final response = await http.post(
        formSubmitUrl,
        headers: {
          'Content-Type': 'application/json',
          if (csrfToken != null) 'X-CSRFToken': csrfToken,
          if (token != null) 'Authorization': 'Token $token',
        },
        body: jsonEncode(submissionData),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        debugPrint('✅ Form submitted successfully! Now deleting local copy...');
        await _deleteLocalEntry(formId, originalAnswers);
      } else {
        debugPrint('❌ Form submission failed: ${response.statusCode}');
        throw Exception('Server error: ${response.body}');
      }
    } catch (e) {
      throw Exception('Submit failed: ${e.toString()}');
    }
  }

  /// Check if file is an image
  bool _isImage(String path) {
    final lower = path.toLowerCase();
    return lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png') ||
        lower.endsWith('.webp');
  }

  /// Check if file is image/audio/video/file
  bool _isSupportedMedia(String path) {
    final lower = path.toLowerCase();
    return _isImage(lower) ||
        lower.endsWith('.mp3') ||
        lower.endsWith('.wav') ||
        lower.endsWith('.m4a') ||
        lower.endsWith('.aac') ||
        lower.endsWith('.mp4') ||
        lower.endsWith('.avi') ||
        lower.endsWith('.mov') ||
        lower.endsWith('.mkv') ||
        lower.endsWith('.pdf') ||
        lower.endsWith('.doc') ||
        lower.endsWith('.docx') ||
        lower.endsWith('.xls') ||
        lower.endsWith('.xlsx');
  }

  /// Compress image to ~30% quality
  Future<File> _compressImage(File originalFile) async {
    try {
      // Read the image
      final image = img.decodeImage(await originalFile.readAsBytes());
      if (image == null) {
        debugPrint('❌ Failed to decode image: ${originalFile.path}');
        return originalFile; // Return original if decoding fails
      }

      // Determine output format and compression
      final String extension = originalFile.path.toLowerCase().split('.').last;
      List<int> compressedBytes;
      if (extension == 'png') {
        // PNG: Use compression level (0-9, higher means more compression)
        compressedBytes = img.encodePng(
          image,
          level: 7,
        ); // Adjust level as needed
      } else {
        // JPEG/WebP: Use quality (0-100, lower means more compression)
        compressedBytes = img.encodeJpg(image, quality: 30); // ~30% quality
      }

      // Create a temporary file to store compressed image
      final tempDir = Directory.systemTemp;
      final compressedFile = File(
        '${tempDir.path}/compressed_${basename(originalFile.path)}',
      );

      // Write compressed bytes to file
      await compressedFile.writeAsBytes(compressedBytes);
      debugPrint(
        '🖼️ Compressed image: ${originalFile.path} '
        '(${originalFile.lengthSync() / 1024} KB -> '
        '${compressedFile.lengthSync() / 1024} KB)',
      );

      return compressedFile;
    } catch (e) {
      debugPrint('❌ Image compression failed: $e');
      return originalFile; // Return original file if compression fails
    }
  }

  /// Upload all media files in a single request
  Future<void> _uploadAllMediaFiles(
    Uri url,
    Map<String, File> mediaFiles,
    String? token,
    String? csrfToken,
  ) async {
    final request = http.MultipartRequest('POST', url);

    request.headers.addAll({
      if (csrfToken != null) 'X-CSRFToken': csrfToken,
      if (token != null) 'Authorization': 'Token $token',
    });

    for (final entry in mediaFiles.entries) {
      final fieldName = entry.key;
      final file = entry.value;
      final fileSizeInBytes = file.lengthSync();
      final fileSizeInKB = fileSizeInBytes / 1024;
      final fileSizeInMB = fileSizeInKB / 1024;

      debugPrint(
        '📁 Media file: $fieldName, Path: ${file.path}, '
        'Size: $fileSizeInBytes bytes (${fileSizeInKB.toStringAsFixed(2)} KB, '
        '${fileSizeInMB.toStringAsFixed(2)} MB)',
      );

      final fileStream = await http.MultipartFile.fromPath(
        'file_$fieldName', // Unique field name for each file
        file.path,
        filename: basename(file.path),
      );

      request.files.add(fileStream);
      request.fields['field_$fieldName'] = fieldName; // Associate field name
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      debugPrint('✅ Uploaded all media files: ${mediaFiles.keys.join(", ")}');
    } else {
      debugPrint('❌ Failed to upload media files: ${response.body}');
      throw Exception('Media upload failed: ${response.body}');
    }
  }

  /// Delete local Hive copy after success
  Future<void> _deleteLocalEntry(
    String formId,
    Map<String, dynamic> originalAnswers,
  ) async {
    final formsBox = await Hive.openBox('submission');
    final followupFormsBox = await Hive.openBox('follow_up_submission');
    final List<dynamic> submissions =
        formsBox.get(formId, defaultValue: []) ?? [];
    final List<dynamic> followupSubmissions =
        followupFormsBox.get(formId, defaultValue: []) ?? [];

    final String? instanceID =
        originalAnswers['meta']?['instanceID']?.toString();
    if (instanceID != null) {
      submissions.removeWhere(
        (entry) => entry['meta']?['instanceID']?.toString() == instanceID,
      );
      followupSubmissions.removeWhere(
        (entry) => entry['meta']?['instanceID']?.toString() == instanceID,
      );
      if (submissions.isEmpty) {
        await formsBox.delete(formId);
      } else {
        await formsBox.put(formId, submissions);
      }

      if (followupSubmissions.isEmpty) {
        await followupFormsBox.delete(formId);
      } else {
        await followupFormsBox.put(formId, followupSubmissions);
      }
      debugPrint('🧹 Deleted local form instance: $instanceID');
    }
  }
}
