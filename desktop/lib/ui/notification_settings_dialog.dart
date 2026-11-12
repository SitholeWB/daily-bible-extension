import 'package:flutter/material.dart';
import '../services/notification_service.dart';
import '../services/storage_service.dart';

class NotificationSettingsDialog extends StatefulWidget {
  final StorageService storage;
  final NotificationService notifications;

  const NotificationSettingsDialog({
    super.key,
    required this.storage,
    required this.notifications,
  });

  @override
  State<NotificationSettingsDialog> createState() =>
      _NotificationSettingsDialogState();
}

class _NotificationSettingsDialogState
    extends State<NotificationSettingsDialog> {
  late bool _enabled;
  late TimeOfDay _morning;
  late TimeOfDay _noon;
  late TimeOfDay _afternoon;

  @override
  void initState() {
    super.initState();
    _enabled = widget.storage.dailyNotificationsEnabled;
    _morning = TimeOfDay(
        hour: widget.storage.morningHour, minute: widget.storage.morningMinute);
    _noon = TimeOfDay(
        hour: widget.storage.noonHour, minute: widget.storage.noonMinute);
    _afternoon = TimeOfDay(
        hour: widget.storage.afternoonHour,
        minute: widget.storage.afternoonMinute);
  }

  Future<void> _pickTime(
      TimeOfDay current, void Function(TimeOfDay picked) onPicked) async {
    final picked = await showTimePicker(context: context, initialTime: current);
    if (picked != null) {
      setState(() => onPicked(picked));
    }
  }

  Future<void> _save() async {
    widget.storage.dailyNotificationsEnabled = _enabled;
    widget.storage.morningHour = _morning.hour;
    widget.storage.morningMinute = _morning.minute;
    widget.storage.noonHour = _noon.hour;
    widget.storage.noonMinute = _noon.minute;
    widget.storage.afternoonHour = _afternoon.hour;
    widget.storage.afternoonMinute = _afternoon.minute;
    await widget.storage.save();
    if (mounted) Navigator.of(context).pop();
  }

  String _formatTime(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AlertDialog(
      title: const Row(
        children: [
          Icon(Icons.notifications_active_outlined),
          SizedBox(width: 10),
          Text('Daily Bible Notifications'),
        ],
      ),
      content: SizedBox(
        width: 440,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Bible of the Day (3× daily)'),
              subtitle: const Text(
                  'Receive Morning, Noon, and Afternoon scripture reminders while Daily Bread is running.'),
              value: _enabled,
              onChanged: (v) => setState(() => _enabled = v),
            ),
            const Divider(),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.wb_twilight_outlined),
              title: const Text('Morning Bread'),
              trailing: OutlinedButton(
                onPressed: _enabled
                    ? () => _pickTime(_morning, (t) => _morning = t)
                    : null,
                child: Text(_formatTime(_morning)),
              ),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.wb_sunny_outlined),
              title: const Text('Midday / Noon Bread'),
              trailing: OutlinedButton(
                onPressed:
                    _enabled ? () => _pickTime(_noon, (t) => _noon = t) : null,
                child: Text(_formatTime(_noon)),
              ),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.nights_stay_outlined),
              title: const Text('Afternoon Bread'),
              trailing: OutlinedButton(
                onPressed: _enabled
                    ? () => _pickTime(_afternoon, (t) => _afternoon = t)
                    : null,
                child: Text(_formatTime(_afternoon)),
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () async {
                await widget.notifications.sendTestNotification();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('Sent Bible of the Day notification!'),
                      backgroundColor: theme.colorScheme.primary,
                    ),
                  );
                }
              },
              icon: const Icon(Icons.send_outlined, size: 17),
              label: const Text('Send Test Notification Now'),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _save,
          child: const Text('Save Schedule'),
        ),
      ],
    );
  }
}
