import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../services/storage_service.dart';

enum FeedbackCategory { suggestion, bug, translation, general }

class FeedbackDialog extends StatefulWidget {
  final StorageService storage;
  final String activeTranslation;
  final String appVersion;

  const FeedbackDialog({
    super.key,
    required this.storage,
    required this.activeTranslation,
    this.appVersion = '1.0.4',
  });

  static String decodeWebhookUrl() {
    const payload =
        '3c0615141a54487f0808070500000971321a0c4115050470240d0b0d030b34051e0204614559515f5a55605c574c5e5a475467685a150306245b13122c0037242a16036e797712452717202a3625071110365b24406f6737242719580334372e2e5638033d046763751735193b203c06190016303f26360169';
    const salt = 'TradingPlatform_Quantum_Shield_v131';
    final buf = StringBuffer();
    for (int i = 0; i < payload.length; i += 2) {
      final code = int.parse(payload.substring(i, i + 2), radix: 16) ^
          salt.codeUnitAt((i ~/ 2) % salt.length);
      buf.writeCharCode(code);
    }
    final result = buf.toString();
    return result.startsWith('https://') ? result : '';
  }

  @override
  State<FeedbackDialog> createState() => _FeedbackDialogState();
}

class _FeedbackDialogState extends State<FeedbackDialog> {
  static const int _rateLimitSeconds = 45;
  final _random = Random();

  late final TextEditingController _nameController;
  late final TextEditingController _contactController;
  late final TextEditingController _messageController;
  late final TextEditingController _captchaController;

  FeedbackCategory _category = FeedbackCategory.suggestion;
  late int _num1;
  late int _num2;
  bool _isSubmitting = false;
  bool _isSuccess = false;
  String? _errorMessage;
  int _cooldownRemaining = 0;
  Timer? _cooldownTimer;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.storage.feedbackAuthor);
    _contactController =
        TextEditingController(text: widget.storage.feedbackContact);
    _messageController = TextEditingController();
    _captchaController = TextEditingController();
    _generateChallenge();
    _checkRateLimit();
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    _nameController.dispose();
    _contactController.dispose();
    _messageController.dispose();
    _captchaController.dispose();
    super.dispose();
  }

  void _generateChallenge() {
    _num1 = _random.nextInt(12) + 1;
    _num2 = _random.nextInt(10) + 1;
    _captchaController.clear();
  }

  void _checkRateLimit() {
    final lastMs = widget.storage.feedbackLastSentMs;
    if (lastMs <= 0) return;
    final diffSec =
        ((DateTime.now().millisecondsSinceEpoch - lastMs) / 1000).floor();
    if (diffSec < _rateLimitSeconds) {
      _startCooldown(_rateLimitSeconds - diffSec);
    }
  }

  void _startCooldown(int seconds) {
    _cooldownTimer?.cancel();
    setState(() => _cooldownRemaining = seconds);
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_cooldownRemaining <= 1) {
        t.cancel();
        setState(() => _cooldownRemaining = 0);
      } else {
        setState(() => _cooldownRemaining -= 1);
      }
    });
  }

  bool get _isCaptchaValid {
    final parsed = int.tryParse(_captchaController.text.trim());
    return parsed != null && parsed == (_num1 + _num2);
  }

  Future<void> _submit() async {
    setState(() => _errorMessage = null);

    if (!_isCaptchaValid) {
      setState(() => _errorMessage =
          'Verification failed: Please enter the correct sum to prove you are human.');
      return;
    }

    final author = _nameController.text.trim();
    final contact = _contactController.text.trim();
    final msg = _messageController.text.trim();

    if (author.isEmpty) {
      setState(() => _errorMessage = 'Please enter your name or handle.');
      return;
    }
    if (msg.length < 5) {
      setState(() =>
          _errorMessage = 'Please enter a message with at least 5 characters.');
      return;
    }
    if (_cooldownRemaining > 0) {
      setState(() => _errorMessage =
          'Please wait ${_cooldownRemaining}s before sending another message.');
      return;
    }

    final webhookUrl = FeedbackDialog.decodeWebhookUrl();
    if (webhookUrl.isEmpty) {
      setState(() => _errorMessage =
          'Feedback dispatch service is currently unavailable.');
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      widget.storage.feedbackAuthor = author;
      if (contact.isNotEmpty) {
        widget.storage.feedbackContact = contact;
      }
      await widget.storage.save();

      final (label, color, emoji) = switch (_category) {
        FeedbackCategory.suggestion => ('Feature Suggestion', 0x3b82f6, '💡'),
        FeedbackCategory.bug => ('Bug Report', 0xef4444, '🐛'),
        FeedbackCategory.translation => (
          'Translation / Scripture Feedback',
          0x10b981,
          '📖'
        ),
        FeedbackCategory.general => ('General Feedback', 0x8b5cf6, '💬'),
      };

      final utcNow = DateTime.now().toUtc().toIso8601String();
      final payload = {
        'username': 'Daily Bread Client Voice',
        'avatar_url':
            'https://raw.githubusercontent.com/SitholeWB/daily-bread-bible/main/desktop/assets/icon.png',
        'embeds': [
          {
            'title': '$emoji $label',
            'description': msg,
            'color': color,
            'fields': [
              {
                'name': '👤 Reader Name / Handle',
                'value': '**$author**',
                'inline': true,
              },
              {
                'name': '🏷️ Category',
                'value': label,
                'inline': true,
              },
              {
                'name': '📱 Contact / Reply To',
                'value': contact.isNotEmpty ? contact : '*(Not provided)*',
                'inline': true,
              },
              {
                'name': '🖥️ System Info',
                'value':
                    '• **Platform:** Daily Bread Desktop (${Platform.operatingSystem})\n• **Version:** v${widget.appVersion}\n• **Active Translation:** ${widget.activeTranslation.toUpperCase()}\n• **Time (UTC):** ${utcNow.replaceAll('T', ' ').substring(0, 19)}',
                'inline': false,
              },
            ],
            'footer': {
              'text':
                  'Daily Bread Feedback Bot • Human Verified (No Login Required)',
            },
            'timestamp': utcNow,
          },
        ],
      };

      final resp = await http
          .post(
            Uri.parse(webhookUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(payload),
          )
          .timeout(const Duration(seconds: 15));

      if (resp.statusCode < 200 || resp.statusCode >= 300) {
        throw Exception('Discord returned HTTP ${resp.statusCode}');
      }

      widget.storage.feedbackLastSentMs =
          DateTime.now().millisecondsSinceEpoch;
      await widget.storage.save();
      _startCooldown(_rateLimitSeconds);

      if (!mounted) return;
      setState(() {
        _isSuccess = true;
        _messageController.clear();
        _generateChallenge();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage =
          'Failed to deliver feedback. Please check your internet connection ($e).');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AlertDialog(
      title: Row(
        children: [
          Icon(Icons.chat_bubble_outline, color: theme.colorScheme.primary),
          const SizedBox(width: 10),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Quick Feedback'),
                Text(
                  'Direct Discord dispatch • No login required',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
                ),
              ],
            ),
          ),
        ],
      ),
      content: SizedBox(
        width: 520,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_isSuccess)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                    border:
                        Border.all(color: Colors.green.withValues(alpha: 0.4)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.green, size: 20),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Thank you! Your feedback has been sent directly to the developer.',
                        ),
                      ),
                    ],
                  ),
                ),
              if (_errorMessage != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.errorContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _errorMessage!,
                    style:
                        TextStyle(color: theme.colorScheme.onErrorContainer),
                  ),
                ),
              SegmentedButton<FeedbackCategory>(
                segments: const [
                  ButtonSegment(
                      value: FeedbackCategory.suggestion,
                      label: Text('Idea')),
                  ButtonSegment(
                      value: FeedbackCategory.bug, label: Text('Bug')),
                  ButtonSegment(
                      value: FeedbackCategory.translation,
                      label: Text('Text')),
                  ButtonSegment(
                      value: FeedbackCategory.general, label: Text('General')),
                ],
                selected: {_category},
                onSelectionChanged: (s) => setState(() => _category = s.first),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Your Name / Handle *',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _contactController,
                      decoration: const InputDecoration(
                        labelText: 'Contact (optional)',
                        hintText: 'Email / Discord / GitHub',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _messageController,
                maxLines: 5,
                minLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Message *',
                  alignLabelWithHint: true,
                  hintText:
                      'Share a feature idea, report a bug, or suggest a translation...',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest
                      .withValues(alpha: 0.45),
                  borderRadius: BorderRadius.circular(8),
                  border:
                      Border.all(color: theme.dividerColor.withValues(alpha: 0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified_user_outlined, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'Human check: $_num1 + $_num2 = ',
                      style: theme.textTheme.bodyMedium
                          ?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    SizedBox(
                      width: 72,
                      child: TextField(
                        controller: _captchaController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          isDense: true,
                          hintText: '?',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(
                              horizontal: 8, vertical: 8),
                        ),
                      ),
                    ),
                    IconButton(
                      tooltip: 'New math puzzle',
                      icon: const Icon(Icons.refresh, size: 18),
                      onPressed: () => setState(_generateChallenge),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Close'),
        ),
        FilledButton.icon(
          onPressed: (_isSubmitting || _cooldownRemaining > 0) ? null : _submit,
          icon: _isSubmitting
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.send, size: 17),
          label: Text(
            _cooldownRemaining > 0
                ? 'Wait ${_cooldownRemaining}s'
                : 'Send Feedback',
          ),
        ),
      ],
    );
  }
}
