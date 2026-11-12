import 'package:flutter/material.dart';
import 'package:yaru/yaru.dart';
import 'services/bible_repository.dart';
import 'services/notification_service.dart';
import 'services/storage_service.dart';
import 'ui/app_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final repo = BibleRepository();
  await repo.init();

  final storage = StorageService();
  await storage.init();

  final notifications = NotificationService(repo: repo, storage: storage);
  notifications.start();

  runApp(DailyBreadApp(
      repo: repo, storage: storage, notifications: notifications));
}

class DailyBreadApp extends StatefulWidget {
  final BibleRepository repo;
  final StorageService storage;
  final NotificationService notifications;

  const DailyBreadApp({
    super.key,
    required this.repo,
    required this.storage,
    required this.notifications,
  });

  @override
  State<DailyBreadApp> createState() => _DailyBreadAppState();
}

class _DailyBreadAppState extends State<DailyBreadApp> {
  @override
  Widget build(BuildContext context) {
    return YaruTheme(
      builder: (context, yaru, child) {
        return MaterialApp(
          title: 'Daily Bread — Offline Bible & Study',
          debugShowCheckedModeBanner: false,
          theme: yaru.theme,
          darkTheme: yaru.darkTheme,
          themeMode: widget.storage.themeMode,
          home: AppShell(
            repo: widget.repo,
            storage: widget.storage,
            notifications: widget.notifications,
            onThemeChanged: () => setState(() {}),
          ),
        );
      },
    );
  }
}
