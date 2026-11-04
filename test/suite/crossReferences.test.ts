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
});

