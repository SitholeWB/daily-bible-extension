import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import '../models/bible_models.dart';

class StorageService {
  List<Bookmark> bookmarks = [];
  List<StudyNote> notes = [];

  String translationId = 'kjv';
  String? compareTranslationId;
  double fontSize = 17.0;
  ThemeMode themeMode = ThemeMode.system;
  int lastBookId = 43; // John
  int lastChapter = 3;

  File? _dataFile;

  Future<void> init() async {
    final supportDir = await getApplicationSupportDirectory();
    _dataFile = File('${supportDir.path}/daily_bread_user_data.json');
    if (await _dataFile!.exists()) {
      try {
        final raw = await _dataFile!.readAsString();
        final json = jsonDecode(raw) as Map<String, dynamic>;
        translationId = (json['translationId'] ?? 'kjv') as String;
        compareTranslationId = json['compareTranslationId'] as String?;
        fontSize = ((json['fontSize'] ?? 17.0) as num).toDouble();
        lastBookId = (json['lastBookId'] ?? 43) as int;
        lastChapter = (json['lastChapter'] ?? 3) as int;

        final themeStr = (json['themeMode'] ?? 'system') as String;
        themeMode = switch (themeStr) {
          'light' => ThemeMode.light,
          'dark' => ThemeMode.dark,
          _ => ThemeMode.system,
        };

        bookmarks = (json['bookmarks'] as List<dynamic>? ?? [])
            .map((e) => Bookmark.fromJson(e as Map<String, dynamic>))
            .toList();
        notes = (json['notes'] as List<dynamic>? ?? [])
            .map((e) => StudyNote.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {
        // Fallback to defaults if corrupted
      }
    }
  }

  Future<void> save() async {
    if (_dataFile == null) return;
    final themeStr = switch (themeMode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    };
    final payload = {
      'version': 1,
      'translationId': translationId,
      'compareTranslationId': compareTranslationId,
      'fontSize': fontSize,
      'themeMode': themeStr,
      'lastBookId': lastBookId,
      'lastChapter': lastChapter,
      'bookmarks': bookmarks.map((b) => b.toJson()).toList(),
      'notes': notes.map((n) => n.toJson()).toList(),
    };
    await _dataFile!.writeAsString(
      const JsonEncoder.withIndent('  ').convert(payload),
    );
  }

  bool isBookmarked(int bookId, int chapter, int verse) {
    return bookmarks.any(
        (b) => b.bookId == bookId && b.chapter == chapter && b.verse == verse);
  }

  Future<bool> toggleBookmark(
      int bookId, int chapter, int verse, String currentTranslation) async {
    final existingIdx = bookmarks.indexWhere(
        (b) => b.bookId == bookId && b.chapter == chapter && b.verse == verse);
    if (existingIdx >= 0) {
      bookmarks.removeAt(existingIdx);
      await save();
      return false;
    } else {
      bookmarks.insert(
        0,
        Bookmark(
          id: '${bookId}_${chapter}_${verse}_${DateTime.now().millisecondsSinceEpoch}',
          bookId: bookId,
          chapter: chapter,
          verse: verse,
          translationId: currentTranslation,
          createdAt: DateTime.now(),
        ),
      );
      await save();
      return true;
    }
  }

  Future<void> upsertNote(StudyNote note) async {
    final idx = notes.indexWhere((n) => n.id == note.id);
    if (idx >= 0) {
      notes[idx] = note;
    } else {
      notes.insert(0, note);
    }
    await save();
  }

  Future<void> deleteNote(String id) async {
    notes.removeWhere((n) => n.id == id);
    await save();
  }

  List<StudyNote> notesForVerse(int bookId, int chapter, int verse) {
    return notes
        .where((n) =>
            n.verseRef != null &&
            n.verseRef!.bookId == bookId &&
            n.verseRef!.chapter == chapter &&
            n.verseRef!.verse == verse)
        .toList();
  }

  Future<String> exportBackupToDocuments() async {
    final docsDir = await getApplicationDocumentsDirectory();
    final exportDir = Directory('${docsDir.path}/DailyBreadBackups');
    if (!await exportDir.exists()) {
      await exportDir.create(recursive: true);
    }
    final stamp = DateTime.now()
        .toIso8601String()
        .replaceAll(':', '-')
        .split('.')
        .first;
    final outFile = File('${exportDir.path}/daily-bread-backup-$stamp.json');
    final payload = {
      'exportedAt': DateTime.now().toIso8601String(),
      'bookmarks': bookmarks.map((b) => b.toJson()).toList(),
      'notes': notes.map((n) => n.toJson()).toList(),
    };
    await outFile.writeAsString(
      const JsonEncoder.withIndent('  ').convert(payload),
    );
    return outFile.path;
  }
}
