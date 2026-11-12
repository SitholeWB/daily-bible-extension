import 'dart:async';
import 'dart:io';
import 'package:dbus/dbus.dart';
import 'bible_repository.dart';
import 'storage_service.dart';

class NotificationSlot {
  final String id;
  final String label;
  final int hour;
  final int minute;
  final int slotOffset;

  const NotificationSlot({
    required this.id,
    required this.label,
    required this.hour,
    required this.minute,
    required this.slotOffset,
  });

  int get totalMinutes => hour * 60 + minute;
}

class NotificationService {
  final BibleRepository repo;
  final StorageService storage;
  Timer? _timer;

  NotificationService({required this.repo, required this.storage});

  void start() {
    _timer?.cancel();
    // Check immediately and then every 30 seconds while app is running
    _checkSchedule();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _checkSchedule());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  List<NotificationSlot> get slots => [
        NotificationSlot(
          id: 'morning',
          label: 'Morning Bread',
          hour: storage.morningHour,
          minute: storage.morningMinute,
          slotOffset: 0,
        ),
        NotificationSlot(
          id: 'noon',
          label: 'Midday Bread',
          hour: storage.noonHour,
          minute: storage.noonMinute,
          slotOffset: 1,
        ),
        NotificationSlot(
          id: 'afternoon',
          label: 'Afternoon Bread',
          hour: storage.afternoonHour,
          minute: storage.afternoonMinute,
          slotOffset: 2,
        ),
      ];

  Future<void> _checkSchedule() async {
    if (!storage.dailyNotificationsEnabled) return;

    final now = DateTime.now();
    final todayPrefix =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final nowMinutes = now.hour * 60 + now.minute;

    // Pick the most recent slot whose scheduled time has passed today
    NotificationSlot? dueSlot;
    for (final slot in slots) {
      if (nowMinutes >= slot.totalMinutes) {
        dueSlot = slot;
      }
    }
    if (dueSlot == null) return;

    final slotKey = '$todayPrefix:${dueSlot.id}';
    if (storage.lastNotifiedSlotKey == slotKey) return;

    // Avoid firing a morning notification at 6pm if afternoon already fired today
    if (storage.lastNotifiedSlotKey.startsWith(todayPrefix)) {
      final lastId = storage.lastNotifiedSlotKey.split(':').last;
      final lastIdx = slots.indexWhere((s) => s.id == lastId);
      final dueIdx = slots.indexWhere((s) => s.id == dueSlot!.id);
      if (dueIdx <= lastIdx) return;
    }

    storage.lastNotifiedSlotKey = slotKey;
    await storage.save();

    await sendVerseNotification(
      slotLabel: dueSlot.label,
      slotOffset: dueSlot.slotOffset,
    );
  }

  Future<void> sendTestNotification() async {
    await sendVerseNotification(
      slotLabel: 'Bible of the Day',
      slotOffset: 0,
    );
  }

  Future<void> sendVerseNotification({
    required String slotLabel,
    required int slotOffset,
  }) async {
    final ref = repo.getDailyVerseRef(slotOffset: slotOffset);
    final book = repo.getBook(ref.bookId);
    final text = await repo.getVerseText(
        storage.translationId, ref.bookId, ref.chapter, ref.verse);
    if (book == null || text == null || text.isEmpty) return;

    final refTitle =
        '${book.displayName(storage.translationId)} ${ref.chapter}:${ref.verse}';
    final title = 'Daily Bread • $slotLabel ($refTitle)';

    await _dispatchDesktopNotification(title, text);
  }

  Future<void> _dispatchDesktopNotification(String title, String body) async {
    try {
      final client = DBusClient.session();
      final object = DBusRemoteObject(
        client,
        name: 'org.freedesktop.Notifications',
        path: DBusObjectPath('/org/freedesktop/Notifications'),
      );
      await object.callMethod(
        'org.freedesktop.Notifications',
        'Notify',
        [
          const DBusString('Daily Bread'), // app_name
          const DBusUint32(0), // replaces_id
          const DBusString('daily-bread-bible'), // app_icon
          DBusString(title), // summary
          DBusString(body), // body
          DBusArray.string(const []), // actions
          DBusDict.stringVariant(const {}), // hints
          const DBusInt32(8000), // expire_timeout (8s)
        ],
        replySignature: DBusSignature('u'),
      );
      await client.close();
      return;
    } catch (_) {
      // Fallback to notify-send if D-Bus direct call is unavailable
    }

    try {
      await Process.run('notify-send', [title, body, '-a', 'Daily Bread']);
    } catch (_) {
      // Ignore gracefully in headless/test environments
    }
  }
}
