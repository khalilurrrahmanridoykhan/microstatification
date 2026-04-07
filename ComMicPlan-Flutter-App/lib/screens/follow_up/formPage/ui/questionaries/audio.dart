import 'package:audioplayers/audioplayers.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_sound/flutter_sound.dart' as fsound;
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

class AudioQuestion extends StatefulWidget {
  final String label;
  final String name;
  final String kuid;
  final String? currentValue;
  final Function(String?) onChanged;

  const AudioQuestion({
    super.key,
    required this.label,
    required this.name,
    required this.kuid,
    this.currentValue,
    required this.onChanged,
  });

  @override
  State<AudioQuestion> createState() => _AudioQuestionState();
}

class _AudioQuestionState extends State<AudioQuestion> {
  final AudioPlayer _audioPlayer = AudioPlayer();
  final fsound.FlutterSoundRecorder _audioRecorder =
      fsound.FlutterSoundRecorder();
  bool _isRecording = false;
  String? _audioFilePath;

  @override
  void initState() {
    super.initState();
    _audioFilePath = widget.currentValue;
    _initRecorder();
  }

  Future<void> _initRecorder() async {
    await _audioRecorder.openRecorder();
    // Request microphone permission
    if (await Permission.microphone.request().isGranted) {
      print('Microphone permission granted');
    } else {
      print('Microphone permission denied');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Microphone permission is required to record audio'),
        ),
      );
    }
  }

  Future<void> _playAudio(String filePath) async {
    DeviceFileSource deviceFileSource = DeviceFileSource(filePath);
    try {
      await _audioPlayer.play(deviceFileSource);
    } catch (e) {
      print('Error playing audio: $e');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error playing audio: $e')));
    }
  }

  Future<void> _stopAudio() async {
    try {
      await _audioPlayer.stop();
    } catch (e) {
      print('Error stopping audio: $e');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error stopping audio: $e')));
    }
  }

  Future<void> _pauseAudio() async {
    try {
      await _audioPlayer.pause();
    } catch (e) {
      print('Error pausing audio: $e');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error pausing audio: $e')));
    }
  }

  Future<void> _pickAudioFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.audio,
      allowMultiple: false,
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() {
        _audioFilePath = result.files.single.path;
        widget.onChanged(_audioFilePath);
        print('Audio file stored for ${widget.kuid}: $_audioFilePath');
      });
      await _playAudio(_audioFilePath!);
    } else {
      print('No file selected');
    }
  }

  Future<void> _startRecording() async {
    if (_isRecording) return;
    try {
      final tempDir = await getTemporaryDirectory();
      final filePath =
          '${tempDir.path}/recorded_audio_${DateTime.now().millisecondsSinceEpoch}.aac';
      await _audioRecorder.startRecorder(
        toFile: filePath,
        codec: fsound.Codec.aacADTS,
      );
      setState(() {
        _isRecording = true;
      });
      print('Started recording to $filePath');
    } catch (e) {
      print('Error starting recording: $e');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error starting recording: $e')));
    }
  }

  Future<void> _stopRecording() async {
    if (!_isRecording) return;
    try {
      final filePath = await _audioRecorder.stopRecorder();
      if (filePath != null) {
        setState(() {
          _isRecording = false;
          _audioFilePath = filePath;
          widget.onChanged(_audioFilePath);
          print('Recorded audio stored for ${widget.kuid}: $_audioFilePath');
        });
        await _playAudio(_audioFilePath!);
      }
    } catch (e) {
      print('Error stopping recording: $e');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error stopping recording: $e')));
    }
  }

  @override
  void dispose() {
    _audioRecorder.closeRecorder();
    _audioPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(widget.label, style: const TextStyle(fontSize: 30)),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _pickAudioFile,
          child: const Text('Pick and Play Audio'),
        ),
        ElevatedButton(
          onPressed: _isRecording ? null : _startRecording,
          child: const Text('Start Recording'),
        ),
        ElevatedButton(
          onPressed: _isRecording ? _stopRecording : null,
          child: const Text('Stop Recording'),
        ),
        ElevatedButton(
          onPressed: _audioFilePath != null ? _pauseAudio : null,
          child: const Text('Pause Audio'),
        ),
        ElevatedButton(
          onPressed: _audioFilePath != null ? _stopAudio : null,
          child: const Text('Stop Audio'),
        ),
        if (_audioFilePath != null) Text('Selected file: $_audioFilePath'),
        if (_isRecording) const Text('Recording in progress...'),
      ],
    );
  }
}
