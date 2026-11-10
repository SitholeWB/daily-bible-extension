import * as fs from 'fs';
import * as path from 'path';
import { BookMetadata, CrossReferenceGroup, CuratedTopic, ResolvedCrossReference, Translation, TranslationInfo, VerseData, VerseRef } from './types';
import { downloadBuffer, parseAndValidatePack } from './translationDownloader';

export class BibleManager {
  private extensionPath: string;
  private dataDir: string;
  private globalStoragePath?: string;
  private books: BookMetadata[] = [];
  private booksById: Map<number, BookMetadata> = new Map();
  private aliasMap: Map<string, BookMetadata> = new Map();
  private topics: Record<string, CuratedTopic> = {};
  private catalog: TranslationInfo[] = [];
  private catalogById: Map<string, TranslationInfo> = new Map();
  private cache: Map<string, string[][]> = new Map(); // key: `${translation}:${bookId}`
  private crossRefCache: Map<number, Record<string, Record<string, CrossReferenceGroup[]>>> = new Map();
  private curatedVerseList: VerseRef[] = [];

  constructor(extensionPath: string, globalStoragePath?: string) {
    this.extensionPath = extensionPath;
    this.globalStoragePath = globalStoragePath;
    const candidates = [
      path.join(extensionPath, 'data'),
      path.join(extensionPath, '..', 'data'),
      path.resolve(__dirname, '..', 'data'),
      path.resolve(__dirname, 'data'),
      path.resolve(process.cwd(), 'data')
    ];

    let foundDir = candidates[0];
    for (const c of candidates) {
      if (fs.existsSync(path.join(c, 'books.json'))) {
        foundDir = c;
        break;
      }
    }

    this.dataDir = foundDir;
    this.loadMetadata();
  }

  private loadMetadata(): void {
    const booksPath = path.join(this.dataDir, 'books.json');
    if (fs.existsSync(booksPath)) {
      this.books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
      for (const b of this.books) {
        this.booksById.set(b.id, b);
        this.indexBookAliases(b);
      }
    }

    const catalogPath = path.join(this.dataDir, 'translations_catalog.json');
    if (fs.existsSync(catalogPath)) {
      this.catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    } else {
      this.catalog = [
        {
          id: 'kjv',
          languageCode: 'en',
          language: 'English',
          name: 'King James Version (KJV)',
          shortName: 'KJV',
          direction: 'ltr',
          copyright: 'Public Domain (1769 Oxford Standard)',
          bundled: true,
          sizeKB: 4200,
          region: 'Default Offline'
        },
        {
          id: 'zulu',
          languageCode: 'zu',
          language: 'isiZulu',
          name: 'IBhayibheli Elingcwele (1959)',
          shortName: 'ZULU',
          direction: 'ltr',
          copyright: 'Public Domain (1959 Edition)',
          bundled: true,
          sizeKB: 3800,
          region: 'Default Offline'
        }
      ];
    }
    for (const item of this.catalog) {
      this.catalogById.set(item.id, item);
    }

    const topicsPath = path.join(this.dataDir, 'curated_topics.json');
    if (fs.existsSync(topicsPath)) {
      this.topics = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));
      // Build flattened list of curated verses
      const seen = new Set<string>();
      for (const topic of Object.values(this.topics)) {
        for (const v of topic.verses) {
          const key = `${v.bookId}:${v.chapter}:${v.verse}`;
          if (!seen.has(key)) {
            seen.add(key);
            this.curatedVerseList.push(v);
          }
        }
      }
    }
  }

  private normalizeText(str: string): string {
    return str
      .toLowerCase()
      .replace(/[\u2018\u2019\u201C\u201D'"`\-_—–:.,;!]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private indexBookAliases(book: BookMetadata): void {
    const addAlias = (alias: string) => {
      const norm = this.normalizeText(alias);
      if (norm) {
        this.aliasMap.set(norm, book);
      }
    };

    addAlias(book.name);
    addAlias(book.zuluName);
    addAlias(book.code);

    for (const a of book.aliases) {
      addAlias(a);
    }

    // Zulu prefix removals for flexible search
    // e.g. "USenesisi" -> "Senesisi", "AmaHubo" -> "Hubo", "IzAga" -> "Aga", "KwabaseRoma" -> "Roma"
    const prefixes = ['u-', 'u', 'ku', 'kuma', 'kwabase', 'eka', 'aba', 'ama', 'izi', 'isi', 'um'];
    for (const prefix of prefixes) {
      const lower = book.zuluName.toLowerCase();
      if (lower.startsWith(prefix) && lower.length > prefix.length + 2) {
        addAlias(lower.slice(prefix.length));
      }
    }
  }

  public getBooks(): BookMetadata[] {
    return this.books;
  }

  public getBook(id: number): BookMetadata | undefined {
    return this.booksById.get(id);
  }

  public getCuratedTopics(): Record<string, CuratedTopic> {
    return this.topics;
  }

  public getCatalog(): TranslationInfo[] {
    return this.catalog;
  }

  public getTranslationInfo(id: string): TranslationInfo | undefined {
    return this.catalogById.get(id);
  }

  private getDownloadedPackPath(id: string): string | undefined {
    if (!this.globalStoragePath) return undefined;
    return path.join(this.globalStoragePath, 'translations', `${id}.json.gz`);
  }

  private getDevPackPath(id: string): string | undefined {
    const candidates = [
      path.join(this.extensionPath, 'packs', `${id}.json.gz`),
      path.join(this.extensionPath, '..', 'packs', `${id}.json.gz`),
      path.resolve(__dirname, '..', 'packs', `${id}.json.gz`),
      path.resolve(process.cwd(), 'packs', `${id}.json.gz`)
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return undefined;
  }

  public isTranslationInstalled(id: string): boolean {
    if (fs.existsSync(path.join(this.dataDir, 'translations', id, '1.json'))) {
      return true;
    }
    const downloadedPath = this.getDownloadedPackPath(id);
    if (downloadedPath && fs.existsSync(downloadedPath)) {
      return true;
    }
    // Check if already cached in memory
    if (this.cache.has(`${id}:1`)) {
      return true;
    }
    return false;
  }

  public getInstalledTranslations(): TranslationInfo[] {
    return this.catalog.filter(t => this.isTranslationInstalled(t.id));
  }

  public async downloadTranslation(id: string): Promise<void> {
    const info = this.catalogById.get(id);
    if (!info) {
      throw new Error(`Unknown translation ID: ${id}`);
    }
    if (info.bundled && fs.existsSync(path.join(this.dataDir, 'translations', id, '1.json'))) {
      return;
    }

    const destPath = this.getDownloadedPackPath(id);
    if (!destPath) {
      throw new Error('Offline storage path is not configured.');
    }

    let gzBuffer: Buffer;
    const localDevPack = this.getDevPackPath(id);
    if (info.downloadUrl) {
      try {
        gzBuffer = await downloadBuffer(info.downloadUrl);
      } catch (err) {
        if (localDevPack) {
          gzBuffer = fs.readFileSync(localDevPack);
        } else {
          throw err;
        }
      }
    } else if (localDevPack) {
      gzBuffer = fs.readFileSync(localDevPack);
    } else {
      throw new Error(`No download URL configured for ${info.name}`);
    }

    const parsed = parseAndValidatePack(gzBuffer);

    const destDir = path.dirname(destPath);
    fs.mkdirSync(destDir, { recursive: true });
    const tmpPath = `${destPath}.tmp`;
    fs.writeFileSync(tmpPath, gzBuffer);
    fs.renameSync(tmpPath, destPath);

    for (const [bId, chapters] of Object.entries(parsed)) {
      this.cache.set(`${id}:${bId}`, chapters);
    }
  }

  public deleteDownloadedTranslation(id: string): boolean {
    const info = this.catalogById.get(id);
    if (info?.bundled) {
      return false;
    }
    const destPath = this.getDownloadedPackPath(id);
    if (destPath && fs.existsSync(destPath)) {
      fs.unlinkSync(destPath);
    }
    for (let i = 1; i <= 66; i++) {
      this.cache.delete(`${id}:${i}`);
    }
    return true;
  }

  public findBook(query: string): BookMetadata | undefined {
    const norm = this.normalizeText(query);
    if (!norm) return undefined;

    // Direct match
    if (this.aliasMap.has(norm)) {
      return this.aliasMap.get(norm);
    }

    // Try without numbers prefix/spacing (e.g. "1sam" vs "1 sam")
    const compact = norm.replace(/\s+/g, '');
    for (const [alias, book] of this.aliasMap.entries()) {
      if (alias.replace(/\s+/g, '') === compact) {
        return book;
      }
    }

    // Prefix/starts-with matching
    for (const [alias, book] of this.aliasMap.entries()) {
      if (alias.startsWith(norm) || norm.startsWith(alias)) {
        return book;
      }
    }

    // Fuzzy contains match for queries >= 3 chars
    if (norm.length >= 3) {
      for (const [alias, book] of this.aliasMap.entries()) {
        if (alias.includes(norm) || norm.includes(alias)) {
          return book;
        }
      }
    }

    return undefined;
  }

  /**
   * Parse reference input such as:
   * "John 3:16", "Joh 3:16", "AmaHubo 23:1", "Hubo 23:1", "Phil 4:13", "Gen 1", "USenesisi 1:1"
   */
  public parseReference(input: string): { book: BookMetadata; chapter: number; verse?: number; endVerse?: number } | undefined {
    const cleaned = input.trim();
    if (!cleaned) return undefined;

    // Match patterns like "1 John 4:9-10", "John 1:14,18", "John 3:16", "Psalm 23", "AmaHubo 23:1"
    const match = cleaned.match(/^([1-3]?\s*[A-Za-z\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/);
    if (!match) {
      // Fallback: match without verse or with looser spacing
      const fallbackMatch = cleaned.match(/^([1-3]?\s*[\p{L}\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/u);
      if (!fallbackMatch) return undefined;
      const bookStr = fallbackMatch[1].trim();
      const ch = parseInt(fallbackMatch[2], 10);
      const v = fallbackMatch[3] ? parseInt(fallbackMatch[3], 10) : undefined;
      const ev = fallbackMatch[4] ? parseInt(fallbackMatch[4], 10) : undefined;
      const book = this.findBook(bookStr);
      if (!book) return undefined;
      return { book, chapter: ch, verse: v, endVerse: ev };
    }

    const bookStr = match[1].trim();
    const chapter = parseInt(match[2], 10);
    const verse = match[3] ? parseInt(match[3], 10) : undefined;
    const endVerse = match[4] ? parseInt(match[4], 10) : undefined;

    const book = this.findBook(bookStr);
    if (!book) return undefined;

    // Validate chapter boundary
    if (chapter < 1 || chapter > book.chapters) {
      return undefined;
    }

    return { book, chapter, verse, endVerse };
  }

  public getVerseRange(
    bookId: number,
    chapter: number,
    startVerse: number,
    endVerse?: number,
    translation: Translation = 'kjv'
  ): string {
    const verses = this.getChapter(bookId, chapter, translation);
    if (verses.length === 0 || startVerse < 1 || startVerse > verses.length) {
      return '';
    }

    if (!endVerse || endVerse <= startVerse) {
      return verses[startVerse - 1] || '';
    }

    const limit = Math.min(endVerse, verses.length, startVerse + 2);
    const parts: string[] = [];
    for (let v = startVerse; v <= limit; v++) {
      const t = verses[v - 1];
      if (t) {
        parts.push(`[${v}] ${t}`);
      }
    }
    if (endVerse > limit) {
      parts.push('...');
    }
    return parts.join(' ');
  }

  public resolveCrossReferences(
    bookId: number,
    chapter: number,
    verse: number,
    translation: Translation = 'kjv',
    maxCount: number = 8
  ): ResolvedCrossReference[] {
    const groups = this.getCrossReferences(bookId, chapter, verse);
    const results: ResolvedCrossReference[] = [];
    const seenRefs = new Set<string>();

    for (const group of groups) {
      for (const ref of group.refs) {
        if (seenRefs.has(ref)) continue;
        seenRefs.add(ref);

        const parsed = this.parseReference(ref);
        if (parsed && parsed.verse) {
          const text = this.getVerseRange(
            parsed.book.id,
            parsed.chapter,
            parsed.verse,
            parsed.endVerse,
            translation
          );

          if (text) {
            results.push({
              ref,
              bookId: parsed.book.id,
              bookName: parsed.book.name,
              zuluBookName: parsed.book.zuluName,
              chapter: parsed.chapter,
              verse: parsed.verse,
              endVerse: parsed.endVerse,
              text,
              anchor: group.anchor
            });
          }
        }

        if (results.length >= maxCount) {
          return results;
        }
      }
    }

    return results;
  }

  public loadBookChapters(bookId: number, translation: Translation): string[][] {
    const key = `${translation}:${bookId}`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const filePath = path.join(this.dataDir, 'translations', translation, `${bookId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as string[][];
        this.cache.set(key, data);
        return data;
      } catch {
        return [];
      }
    }

    // Check downloaded single-file gzip pack in globalStorageUri (or dev fallback packs/)
    const packPath = this.getDownloadedPackPath(translation);
    const resolvedPack =
      packPath && fs.existsSync(packPath) ? packPath : this.getDevPackPath(translation);

    if (resolvedPack && fs.existsSync(resolvedPack)) {
      try {
        const bundle = parseAndValidatePack(fs.readFileSync(resolvedPack));
        for (const [bId, chapters] of Object.entries(bundle)) {
          this.cache.set(`${translation}:${bId}`, chapters);
        }
        return this.cache.get(key) || [];
      } catch {
        return [];
      }
    }

    return [];
  }

  public loadBookCrossReferences(bookId: number): Record<string, Record<string, CrossReferenceGroup[]>> {
    if (this.crossRefCache.has(bookId)) {
      return this.crossRefCache.get(bookId)!;
    }

    const filePath = path.join(this.dataDir, 'cross_references', `${bookId}.json`);
    if (!fs.existsSync(filePath)) {
      return {};
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.crossRefCache.set(bookId, data);
      return data;
    } catch {
      return {};
    }
  }

  public getCrossReferences(bookId: number, chapter: number, verse: number): CrossReferenceGroup[] {
    const bookData = this.loadBookCrossReferences(bookId);
    return (bookData[chapter.toString()] && bookData[chapter.toString()][verse.toString()]) || [];
  }

  public getFlattenedCrossReferences(bookId: number, chapter: number, verse: number): string[] {
    const groups = this.getCrossReferences(bookId, chapter, verse);
    const set = new Set<string>();
    for (const g of groups) {
      for (const r of g.refs) {
        set.add(r);
      }
    }
    return Array.from(set);
  }

  public getChapter(bookId: number, chapter: number, translation: Translation): string[] {
    const chapters = this.loadBookChapters(bookId, translation);
    if (chapter < 1 || chapter > chapters.length) {
      return [];
    }
    return chapters[chapter - 1] || [];
  }

  public getVerse(
    bookId: number,
    chapter: number,
    verse: number,
    translation: Translation,
    dualTranslation?: Translation
  ): VerseData | undefined {
    const book = this.getBook(bookId);
    if (!book) return undefined;

    const chapterVerses = this.getChapter(bookId, chapter, translation);
    if (verse < 1 || verse > chapterVerses.length) {
      return undefined;
    }

    const text = chapterVerses[verse - 1];
    let parallelText: string | undefined = undefined;

    if (dualTranslation && dualTranslation !== translation) {
      const dualVerses = this.getChapter(bookId, chapter, dualTranslation);
      if (verse >= 1 && verse <= dualVerses.length) {
        parallelText = dualVerses[verse - 1];
      }
    }

    const crossReferences = this.getCrossReferences(bookId, chapter, verse);
    const resolvedCrossReferences = this.resolveCrossReferences(bookId, chapter, verse, translation, 12);
    const primaryMeta = this.catalogById.get(translation);
    const parallelMeta =
      dualTranslation && dualTranslation !== translation ? this.catalogById.get(dualTranslation) : undefined;

    return {
      bookId,
      bookName: book.name,
      zuluBookName: book.zuluName,
      chapter,
      verse,
      text,
      translation,
      translationName: primaryMeta ? `${primaryMeta.language} — ${primaryMeta.name}` : translation.toUpperCase(),
      direction: primaryMeta?.direction || 'ltr',
      parallelText,
      parallelTranslation: dualTranslation && dualTranslation !== translation ? dualTranslation : undefined,
      parallelTranslationName: parallelMeta ? parallelMeta.shortName : dualTranslation?.toUpperCase(),
      crossReferences: crossReferences.length > 0 ? crossReferences : undefined,
      resolvedCrossReferences: resolvedCrossReferences.length > 0 ? resolvedCrossReferences : undefined,
      chapterVerses: chapterVerses
    };
  }

  public getRandomVerse(
    topicId?: string,
    translation: Translation = 'kjv',
    dualTranslation?: Translation
  ): VerseData {
    let list: VerseRef[] = [];

    if (topicId && topicId !== 'all' && this.topics[topicId]) {
      list = this.topics[topicId].verses;
    } else {
      list = this.curatedVerseList;
    }

    if (list.length === 0) {
      // Fallback: John 3:16
      list = [{ bookId: 43, chapter: 3, verse: 16 }];
    }

    const randIndex = Math.floor(Math.random() * list.length);
    const item = list[randIndex];
    const verse = this.getVerse(item.bookId, item.chapter, item.verse, translation, dualTranslation);

    if (verse) {
      return verse;
    }

    // Default fallback
    return {
      bookId: 43,
      bookName: 'John',
      zuluBookName: 'UJohane',
      chapter: 3,
      verse: 16,
      text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
      translation
    };
  }

  public getNextCuratedVerse(
    current: VerseRef,
    topicId?: string,
    translation: Translation = 'kjv',
    dualTranslation?: Translation
  ): VerseData {
    let list: VerseRef[] = [];
    if (topicId && topicId !== 'all' && this.topics[topicId]) {
      list = this.topics[topicId].verses;
    } else {
      list = this.curatedVerseList;
    }

    if (list.length === 0) {
      return this.getRandomVerse(topicId, translation, dualTranslation);
    }

    const currentIndex = list.findIndex(
      v => v.bookId === current.bookId && v.chapter === current.chapter && v.verse === current.verse
    );

    const nextIndex = (currentIndex + 1) % list.length;
    const nextItem = list[nextIndex];
    return this.getVerse(nextItem.bookId, nextItem.chapter, nextItem.verse, translation, dualTranslation) ||
      this.getRandomVerse(topicId, translation, dualTranslation);
  }

  public getNextSequentialVerse(
    current: VerseRef,
    translation: Translation = 'kjv',
    dualTranslation?: Translation
  ): VerseData {
    const book = this.getBook(current.bookId);
    if (!book) return this.getRandomVerse(undefined, translation, dualTranslation);

    const verses = this.getChapter(current.bookId, current.chapter, translation);
    if (current.verse < verses.length) {
      return this.getVerse(current.bookId, current.chapter, current.verse + 1, translation, dualTranslation)!;
    }

    // Next chapter
    if (current.chapter < book.chapters) {
      return this.getVerse(current.bookId, current.chapter + 1, 1, translation, dualTranslation)!;
    }

    // Next book
    const nextBookId = (current.bookId % 66) + 1;
    return this.getVerse(nextBookId, 1, 1, translation, dualTranslation)!;
  }
}
