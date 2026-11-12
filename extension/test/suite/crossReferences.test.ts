import * as assert from 'assert';
import * as path from 'path';
import { BibleManager } from '../../src/bibleManager';

describe('Cross References Integrity Tests', () => {
  let manager: BibleManager;

  before(() => {
    manager = new BibleManager(__dirname);
  });

  it('should load cross references for John 3:16', () => {
    const groups = manager.getCrossReferences(43, 3, 16);
    assert.ok(groups.length > 0, 'John 3:16 should have cross reference groups');

    const flattened = manager.getFlattenedCrossReferences(43, 3, 16);
    assert.ok(flattened.length > 0, 'John 3:16 should have flattened references');
    assert.ok(
      flattened.some(r => r.includes('Rom 5:8') || r.includes('Rom 8:32') || r.includes('1 John 4:9')),
      'Should contain Rom 5:8, Rom 8:32, or 1 John 4:9'
    );
  });

  it('should load cross references for Genesis 1:1', () => {
    const groups = manager.getCrossReferences(1, 1, 1);
    assert.ok(groups.length > 0, 'Genesis 1:1 should have cross reference groups');

    const flattened = manager.getFlattenedCrossReferences(1, 1, 1);
    assert.ok(
      flattened.some(r => r.includes('John 1:1') || r.includes('Prov 8:22') || r.includes('Heb 1:10')),
      'Should contain John 1:1 or Prov 8:22'
    );
  });

  it('should load cross references for Psalm 23:1', () => {
    const groups = manager.getCrossReferences(19, 23, 1);
    assert.ok(groups.length > 0, 'Psalm 23:1 should have cross reference groups');

    const flattened = manager.getFlattenedCrossReferences(19, 23, 1);
    assert.ok(
      flattened.some(r => r.includes('John 10:11') || r.includes('Isa 40:11') || r.includes('Phil 4:19')),
      'Should contain John 10:11, Isa 40:11, or Phil 4:19'
    );
  });

  it('should return empty array for out of range verses', () => {
    const groups = manager.getCrossReferences(1, 999, 999);
    assert.deepStrictEqual(groups, []);
  });

  it('should resolve cross references with actual scripture text', () => {
    const resolved = manager.resolveCrossReferences(43, 3, 16, 'kjv', 6);
    assert.ok(resolved.length > 0, 'Should have resolved cross references');
    for (const r of resolved) {
      assert.ok(r.text.length > 0, `Resolved ref ${r.ref} should have non-empty text`);
      assert.ok(r.bookName.length > 0, 'Should have book name');
    }

    // Verify Romans 5:8 is among the resolved references for John 3:16
    const rom58 = resolved.find(r => r.ref.includes('Rom 5:8'));
    assert.ok(rom58, 'Should find Rom 5:8 in resolved cross-references');
    assert.ok(rom58.text.toLowerCase().includes('love') || rom58.text.toLowerCase().includes('sinners'));
  });

  it('should attach full chapter context and resolved cross-references to VerseData', () => {
    const verseData = manager.getVerse(43, 3, 16, 'kjv');
    assert.ok(verseData);
    assert.ok(verseData.chapterVerses, 'Should contain full chapter verses');
    assert.strictEqual(verseData.chapterVerses?.length, 36);
    assert.ok(verseData.resolvedCrossReferences, 'Should contain resolved cross references');
    assert.ok((verseData.resolvedCrossReferences?.length ?? 0) > 0);
  });
});

