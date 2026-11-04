import * as assert from 'assert';
import { BookmarksManager } from '../../src/bookmarks';
import { VerseData } from '../../src/types';

class MockMemento {
  private store: Map<string, any> = new Map();

  get<T>(key: string, defaultValue?: T): T {
    if (this.store.has(key)) {
      return this.store.get(key) as T;
    }
    return defaultValue as T;
  }

  update(key: string, value: any): Promise<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }

  keys(): readonly string[] {
    return Array.from(this.store.keys());
  }

  setKeysForSync(): void {}
}

describe('BookmarksManager Tests', () => {
  let bookmarksManager: BookmarksManager;
  let mockState: MockMemento;

  beforeEach(() => {
    mockState = new MockMemento();
    const mockContext: any = {
      globalState: mockState
    };
    bookmarksManager = new BookmarksManager(mockContext);
  });

  it('should add and retrieve bookmarks', async () => {
    const verse: VerseData = {
      bookId: 43,
      bookName: 'John',
      zuluBookName: 'UJohane',
      chapter: 3,
      verse: 16,
      text: 'God so loved the world...',
      translation: 'web'
    };

    await bookmarksManager.addBookmark(verse, 'My favorite verse', ['salvation', 'hope']);

    const bookmarks = bookmarksManager.getBookmarks();
    assert.strictEqual(bookmarks.length, 1);
    assert.strictEqual(bookmarks[0].bookId, 43);
    assert.strictEqual(bookmarks[0].note, 'My favorite verse');
    assert.deepStrictEqual(bookmarks[0].tags, ['salvation', 'hope']);
    assert.strictEqual(bookmarksManager.isBookmarked(43, 3, 16), true);
    assert.strictEqual(bookmarksManager.isBookmarked(1, 1, 1), false);
  });

  it('should remove bookmark', async () => {
    const verse: VerseData = {
      bookId: 19,
      bookName: 'Psalms',
      zuluBookName: 'AmaHubo',
      chapter: 23,
      verse: 1,
      text: 'The Lord is my shepherd...',
      translation: 'kjv'
    };

    const b = await bookmarksManager.addBookmark(verse);
    assert.strictEqual(bookmarksManager.getBookmarks().length, 1);

    await bookmarksManager.removeBookmark(b.id);
    assert.strictEqual(bookmarksManager.getBookmarks().length, 0);
  });

  it('should export bookmarks to Markdown and JSON', async () => {
    const verse: VerseData = {
      bookId: 50,
      bookName: 'Philippians',
      zuluBookName: 'KwabaseFilipi',
      chapter: 4,
      verse: 13,
      text: 'I can do all things through Christ...',
      translation: 'kjv'
    };

    await bookmarksManager.addBookmark(verse, 'Coding fuel', ['strength']);

    const md = bookmarksManager.exportBookmarksMarkdown();
    assert.ok(md.includes('Philippians 4:13'));
    assert.ok(md.includes('Coding fuel'));
    assert.ok(md.includes('#strength'));

    const json = bookmarksManager.exportBookmarksJson();
    assert.ok(json.includes('"bookId": 50'));
  });

  it('should import bookmarks correctly', async () => {
    const jsonStr = JSON.stringify([
      {
        id: '1:1:1:zulu',
        bookId: 1,
        chapter: 1,
        verse: 1,
        translation: 'zulu',
        text: 'Ekuqaleni...',
        bookName: 'USenesisi',
        createdAt: 1000
      }
    ]);

    const count = await bookmarksManager.importBookmarks(jsonStr);
    assert.strictEqual(count, 1);
    assert.strictEqual(bookmarksManager.getBookmarks().length, 1);
    assert.strictEqual(bookmarksManager.getBookmarks()[0].bookName, 'USenesisi');
  });
});

