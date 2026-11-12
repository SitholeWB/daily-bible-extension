import 'package:flutter_test/flutter_test.dart';
import 'package:daily_bread/models/bible_models.dart';
import 'package:daily_bread/services/bible_repository.dart';
import 'package:daily_bread/services/notification_service.dart';
import 'package:daily_bread/services/storage_service.dart';
import 'package:daily_bread/ui/feedback_dialog.dart';

void main() {
  test('BibleBook displays isiZulu name when zulu translation is active', () {
    const book = BibleBook(
      id: 1,
      code: 'GEN',
      name: 'Genesis',
      zuluName: 'USenesisi',
      chapters: 50,
      testament: 'OT',
      aliases: ['gen', 'senesisi'],
    );

    expect(book.displayName('kjv'), 'Genesis');
    expect(book.displayName('zulu'), 'USenesisi');
  });

  test('StudyNote copyWith updates content and preserves id', () {
    final now = DateTime(2026, 11, 12);
    final note = StudyNote(
      id: 'n1',
      title: 'Initial',
      content: 'Draft',
      verseRef: const VerseRef(bookId: 43, chapter: 3, verse: 16),
      tags: const ['grace'],
      createdAt: now,
      updatedAt: now,
    );

    final updated = note.copyWith(content: 'Revised reflection');
    expect(updated.id, 'n1');
    expect(updated.content, 'Revised reflection');
    expect(updated.verseRef, const VerseRef(bookId: 43, chapter: 3, verse: 16));
  });

  test('FeedbackDialog decodes Discord webhook URL cleanly', () {
    final url = FeedbackDialog.decodeWebhookUrl();
    expect(url.startsWith('https://discord.com/api/webhooks/'), isTrue);
  });

  test('NotificationService defaults to 3 daily slots (08:00, 12:00, 17:00)', () {
    final service = NotificationService(
      repo: BibleRepository(),
      storage: StorageService(),
    );
    expect(service.slots.length, 3);
    expect(service.slots[0].hour, 8);
    expect(service.slots[1].hour, 12);
    expect(service.slots[2].hour, 17);
  });
}
