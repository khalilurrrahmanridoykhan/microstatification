import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:video_player/video_player.dart';

class VideoQuestion extends StatefulWidget {
  final String label;
  final String name;
  final String kuid;
  final String? currentValue;
  final Function(String?) onChanged;

  const VideoQuestion({
    super.key,
    required this.label,
    required this.name,
    required this.kuid,
    this.currentValue,
    required this.onChanged,
  });

  @override
  State<VideoQuestion> createState() => _VideoQuestionState();
}

class _VideoQuestionState extends State<VideoQuestion> {
  final ImagePicker _picker = ImagePicker();
  bool showVideo = false;

  Future<void> _pickVideo(ImageSource source) async {
    final XFile? pickedFile = await _picker.pickVideo(source: source);
    if (pickedFile != null) {
      widget.onChanged(pickedFile.path);
      setState(() {
        showVideo = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final String? videoPath = widget.currentValue;
    final bool isVideoPlayable = videoPath != null && videoPath.isNotEmpty;

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(widget.label, style: const TextStyle(fontSize: 18)),
        const SizedBox(height: 20),
        videoPath != null
            ? Column(
              children: [
                Text("Selected video: $videoPath"),
                const SizedBox(height: 10),
                if (showVideo)
                  SizedBox(
                    height: 200,
                    child: VideoPlayerWidget(videoFile: File(videoPath)),
                  ),
              ],
            )
            : const Text("No video selected."),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: () async {
            await _pickVideo(ImageSource.gallery);
          },
          child: const Text("Pick from Gallery"),
        ),
        ElevatedButton(
          onPressed: () async {
            await _pickVideo(ImageSource.camera);
          },
          child: const Text("Record from Camera"),
        ),
        ElevatedButton(
          onPressed:
              isVideoPlayable
                  ? () {
                    setState(() {
                      showVideo = true;
                    });
                  }
                  : null,
          child: const Text("Play Video"),
        ),
      ],
    );
  }
}

class VideoPlayerWidget extends StatefulWidget {
  final File videoFile;

  const VideoPlayerWidget({super.key, required this.videoFile});

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  VideoPlayerController? _controller;
  File? _currentFile;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _currentFile = widget.videoFile;
    _initializePlayer();
  }

  @override
  void didUpdateWidget(VideoPlayerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.videoFile.path != oldWidget.videoFile.path) {
      _currentFile = widget.videoFile;
      _initializePlayer();
    }
  }

  Future<void> _initializePlayer() async {
    if (_controller != null) {
      await _controller!.pause();
      await _controller!.dispose();
      _controller = null;
    }

    _controller = VideoPlayerController.file(_currentFile!);

    try {
      await _controller!.initialize();
      _controller!.setLooping(true);
      _controller!.setVolume(1.0);
      await _controller!.play();
      setState(() {
        _isInitialized = true;
      });
    } catch (e) {
      print("Error initializing video player: $e");
      setState(() {
        _isInitialized = false;
      });
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_controller == null || !_isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }

    if (!_controller!.value.isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }

    return AspectRatio(
      aspectRatio: _controller!.value.aspectRatio,
      child: VideoPlayer(_controller!),
    );
  }
}
