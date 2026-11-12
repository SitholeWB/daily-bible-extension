import 'package:flutter_test/flutter_test.dart';
import 'package:daily_bread/models/bible_models.dart';

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
}
