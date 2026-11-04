import * as fs from 'fs';
import * as path from 'path';
import { BookMetadata, CrossReferenceGroup, CuratedTopic, Translation, VerseData, VerseRef } from './types';

export class BibleManager {
  private dataDir: string;
  private books: BookMetadata[] = [];
  private booksById: Map<number, BookMetadata> = new Map();
  private aliasMap: Map<string, BookMetadata> = new Map();
  private topics: Record<string, CuratedTopic> = {};
  private cache: Map<string, string[][]> = new Map(); // key: `${translation}:${bookId}`
  private crossRefCache: Map<number, Record<string, Record<string, CrossReferenceGroup[]>>> = new Map();
  private curatedVerseList: VerseRef[] = [];

  constructor(extensionPath: string) {
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
  public parseReference(input: string): { book: BookMetadata; chapter: number; verse?: number } | undefined {
    const cleaned = input.trim();
    if (!cleaned) return undefined;

    // Match patterns like "1 John 3:16", "John 3:16", "Psalm 23", "AmaHubo 23:1"
    const match = cleaned.match(/^([1-3]?\s*[A-Za-z\-]+)\s*(\d+)(?:[:.\s](\d+))?$/);
    if (!match) {
      // Fallback: match without verse or with looser spacing
      const fallbackMatch = cleaned.match(/^([1-3]?\s*[\p{L}\-]+)\s*(\d+)(?:[:.\s](\d+))?$/u);
      if (!fallbackMatch) return undefined;
      const bookStr = fallbackMatch[1].trim();
      const ch = parseInt(fallbackMatch[2], 10);
      const v = fallbackMatch[3] ? parseInt(fallbackMatch[3], 10) : undefined;
      const book = this.findBook(bookStr);
      if (!book) return undefined;
      return { book, chapter: ch, verse: v };
    }

    const bookStr = match[1].trim();
    const chapter = parseInt(match[2], 10);
    const verse = match[3] ? parseInt(match[3], 10) : undefined;

    const book = this.findBook(bookStr);
    if (!book) return undefined;

    // Validate chapter boundary
    if (chapter < 1 || chapter > book.chapters) {
      return undefined;
    }

    return { book, chapter, verse };
  }

  public loadBookChapters(bookId: number, translation: Translation): string[][] {
    const key = `${translation}:${bookId}`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const filePath = path.join(this.dataDir, 'translations', translation, `${bookId}.json`);
    if (!fs.existsSync(filePath)) {
      return [];
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as string[][];
      this.cache.set(key, data);
      return data;
    } catch {
      return [];
    }
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

    return {
      bookId,
      bookName: book.name,
      zuluBookName: book.zuluName,
      chapter,
      verse,
      text,
      translation,
      parallelText,
      parallelTranslation: dualTranslation && dualTranslation !== translation ? dualTranslation : undefined,
      crossReferences: crossReferences.length > 0 ? crossReferences : undefined
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
