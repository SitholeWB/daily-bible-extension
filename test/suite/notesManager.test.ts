import * as assert from 'assert';
import { NotesManager } from '../../src/notesManager';
import { VerseData } from '../../src/types';

class MockMemento {
  private store: Map<string, unknown> = new Map();

  get<T>(key: string, defaultValue?: T): T {
    if (this.store.has(key)) {
      return this.store.get(key) as T;
    }
    return defaultValue as T;
  }

  update(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }
}

describe('NotesManager Tests', () => {
  let notesManager: NotesManager;

  beforeEach(() => {
    const mockContext: any = { globalState: new MockMemento() };
    notesManager = new NotesManager(mockContext);
  });

  it('should save, update, query, and delete verse study notes', async () => {
    const verse: VerseData = {
      bookId: 43,
      bookName: 'John',
      zuluBookName: 'UJohane',
      chapter: 3,
      verse: 16,
      text: 'For God so loved the world...',
      translation: 'kjv'
    };

    const created = await notesManager.saveNote({
      title: 'Gods Love',
      content: 'Central verse of the Gospel.',
      tags: ['gospel', 'love'],
      verseData: verse
    });

    assert.strictEqual(notesManager.getNotes().length, 1);
    assert.strictEqual(notesManager.getNotesForVerse(43, 3, 16).length, 1);
    assert.strictEqual(created.bookName, 'John');

    // Update existing note
    const updated = await notesManager.saveNote({
      id: created.id,
      title: 'Gods Love (Updated)',
      content: 'Expanded sermon outline.',
      tags: ['gospel']
    });
    assert.strictEqual(notesManager.getNotes().length, 1);
    assert.strictEqual(updated.title, 'Gods Love (Updated)');
    assert.strictEqual(updated.bookId, 43);

    await notesManager.deleteNote(created.id);
    assert.strictEqual(notesManager.getNotes().length, 0);
  });

  it('should import notes without duplicating existing ids', async () => {
    const n1 = await notesManager.saveNote({ title: 'Note 1', content: 'First' });
    const count = await notesManager.importNotes([
      n1,
      {
        id: 'note_imported_2',
        title: 'Note 2',
        content: 'Second',
        createdAt: 1000,
        updatedAt: 2000
      }
    ]);
    assert.strictEqual(count, 1);
    assert.strictEqual(notesManager.getNotes().length, 2);
  });
});
