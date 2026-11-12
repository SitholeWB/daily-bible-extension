import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { BibleManager } from '../../src/bibleManager';

describe('BibleManager Data & Translation Integrity Tests', () => {
  let manager: BibleManager;

  before(() => {
    const extPath = path.resolve(__dirname, '../../');
    manager = new BibleManager(extPath);
  });

  it('should load all 66 canonical books', () => {
    const books = manager.getBooks();
    assert.strictEqual(books.length, 66);
    assert.strictEqual(books[0].name, 'Genesis');
    assert.strictEqual(books[0].zuluName, 'USenesisi');
    assert.strictEqual(books[65].name, 'Revelation');
    assert.strictEqual(books[65].zuluName, 'IsAmbulo');
  });

  it('should retrieve John 3:16 across all 3 translations', () => {
    const zuluVerse = manager.getVerse(43, 3, 16, 'zulu');
    assert.ok(zuluVerse);
    assert.ok(zuluVerse.text.includes('uNkulunkulu walithanda izwe'));

    const kjvVerse = manager.getVerse(43, 3, 16, 'kjv');
    assert.ok(kjvVerse);
    assert.ok(kjvVerse.text.includes('God so loved the world'));

    const webVerse = manager.getVerse(43, 3, 16, 'web');
    assert.ok(webVerse);
    assert.ok(webVerse.text.includes('God so loved the world'));
  });

  it('should support parallel/dual translation fetching', () => {
    const dualVerse = manager.getVerse(19, 23, 1, 'zulu', 'web');
    assert.ok(dualVerse);
    assert.strictEqual(dualVerse.chapter, 23);
    assert.strictEqual(dualVerse.verse, 1);
    assert.ok(dualVerse.text.includes('umalusi wami'));
    assert.ok(dualVerse.parallelText?.includes('shepherd'));
    assert.strictEqual(dualVerse.parallelTranslation, 'web');
  });

  it('should retrieve full chapters correctly', () => {
    const psalm23Verses = manager.getChapter(19, 23, 'zulu');
    assert.strictEqual(psalm23Verses.length, 6);

    const psalm23Kjv = manager.getChapter(19, 23, 'kjv');
    assert.strictEqual(psalm23Kjv.length, 6);
  });

  it('should load curated topics and generate random verses', () => {
    const topics = manager.getCuratedTopics();
    assert.ok(topics['peace']);
    assert.ok(topics['wisdom']);
    assert.ok(topics['strength']);

    const randVerse = manager.getRandomVerse('peace', 'zulu');
    assert.ok(randVerse);
    assert.ok(randVerse.text.length > 0);
  });

  it('should bundle only kjv and zulu by default and expose downloadable catalog', async function () {
    this.timeout(10000);
    const tmpStorage = fs.mkdtempSync(path.join(os.tmpdir(), 'daily-bible-test-'));
    try {
      const extPath = path.resolve(__dirname, '../../');
      const m = new BibleManager(extPath, tmpStorage);
      const catalog = m.getCatalog();
      const bundled = catalog.filter(c => c.bundled).map(c => c.id).sort();
      assert.deepStrictEqual(bundled, ['kjv', 'zulu']);
      assert.ok(catalog.length >= 20, 'Expected rich downloadable translation catalog');

      assert.strictEqual(m.isTranslationInstalled('kjv'), true);
      assert.strictEqual(m.isTranslationInstalled('zulu'), true);
      assert.strictEqual(m.isTranslationInstalled('web'), false);

      await m.downloadTranslation('web');
      assert.strictEqual(m.isTranslationInstalled('web'), true);
      const webJohn = m.getVerse(43, 3, 16, 'web');
      assert.ok(webJohn?.text.includes('God so loved the world'));

      assert.strictEqual(m.deleteDownloadedTranslation('kjv'), false);
      assert.strictEqual(m.deleteDownloadedTranslation('web'), true);
      assert.strictEqual(m.isTranslationInstalled('web'), false);
    } finally {
      fs.rmSync(tmpStorage, { recursive: true, force: true });
    }
  });
});

