import * as assert from 'assert';
import * as path from 'path';
import { BibleManager } from '../../src/bibleManager';

describe('Scripture Rotation & Navigation Tests', () => {
  let manager: BibleManager;

  before(() => {
    manager = new BibleManager(__dirname);
  });

  it('should cycle through curated verses in topic', () => {
    const v1 = manager.getRandomVerse('peace', 'zulu');
    assert.ok(v1);

    const v2 = manager.getNextCuratedVerse(
      { bookId: v1.bookId, chapter: v1.chapter, verse: v1.verse },
      'peace',
      'zulu'
    );
    assert.ok(v2);
    assert.ok(v2.text.length > 0);
  });

  it('should advance to next sequential verse across chapters and books', () => {
    // Within chapter: John 3:16 -> John 3:17
    const nextV = manager.getNextSequentialVerse({ bookId: 43, chapter: 3, verse: 16 }, 'web');
    assert.strictEqual(nextV.bookId, 43);
    assert.strictEqual(nextV.chapter, 3);
    assert.strictEqual(nextV.verse, 17);

    // End of chapter: Psalm 23:6 -> Psalm 24:1
    const nextCh = manager.getNextSequentialVerse({ bookId: 19, chapter: 23, verse: 6 }, 'kjv');
    assert.strictEqual(nextCh.bookId, 19);
    assert.strictEqual(nextCh.chapter, 24);
    assert.strictEqual(nextCh.verse, 1);
  });

  it('should simulate hover & reading protection timing logic', () => {
    // When user is reading hover tooltip, editor is idle (> 3000ms)
    let lastEditorInteraction = Date.now() - 5000;
    let isRotationPending = false;
    let verseChanged = false;

    const attemptAutoRotate = (force = false, preventWhileReading = true) => {
      if (!force && preventWhileReading) {
        const idleMs = Date.now() - lastEditorInteraction;
        if (idleMs > 3000) {
          isRotationPending = true;
          return;
        }
      }
      isRotationPending = false;
      verseChanged = true;
    };

    // Auto-rotation fires while user is hovering & reading
    attemptAutoRotate(false, true);
    assert.strictEqual(isRotationPending, true, 'Rotation must be held pending while reading');
    assert.strictEqual(verseChanged, false, 'Verse must not change while reading');

    // User finishes reading and interacts with editor
    const onEditorInteraction = () => {
      lastEditorInteraction = Date.now();
      if (isRotationPending) {
        attemptAutoRotate(true);
      }
    };

    onEditorInteraction();
    assert.strictEqual(isRotationPending, false, 'Pending rotation should clear on resume');
    assert.strictEqual(verseChanged, true, 'Verse should rotate cleanly when user returns to editor');
  });
});

