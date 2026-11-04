import * as vscode from 'vscode';
import { Bookmark, VerseData } from './types';

export class BookmarksManager {
  private static readonly STORAGE_KEY = 'dailyBread.bookmarks';
  private context: vscode.ExtensionContext;
  private onDidChangeEmitter = new vscode.EventEmitter<void>();
  public readonly onDidChangeBookmarks = this.onDidChangeEmitter.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public getBookmarks(): Bookmark[] {
    const data = this.context.globalState.get<Bookmark[]>(BookmarksManager.STORAGE_KEY, []);
    return [...data].sort((a, b) => b.createdAt - a.createdAt);
  }

  public isBookmarked(bookId: number, chapter: number, verse: number): boolean {
    const list = this.getBookmarks();
    return list.some(b => b.bookId === bookId && b.chapter === chapter && b.verse === verse);
  }

  public getBookmark(id: string): Bookmark | undefined {
    return this.getBookmarks().find(b => b.id === id);
  }

  public async addBookmark(verse: VerseData, note?: string, tags?: string[]): Promise<Bookmark> {
    const list = this.getBookmarks();
    const id = `${verse.bookId}:${verse.chapter}:${verse.verse}:${verse.translation}`;

    // Remove existing if any to update
    const filtered = list.filter(b => b.id !== id);

    const displayName = verse.translation === 'zulu' ? verse.zuluBookName : verse.bookName;
    const newBookmark: Bookmark = {
      id,
      bookId: verse.bookId,
      chapter: verse.chapter,
      verse: verse.verse,
      translation: verse.translation,
      text: verse.text,
      bookName: displayName,
      createdAt: Date.now(),
      note,
      tags
    };

    filtered.unshift(newBookmark);
    await this.context.globalState.update(BookmarksManager.STORAGE_KEY, filtered);
    this.onDidChangeEmitter.fire();
    return newBookmark;
  }

  public async removeBookmark(id: string): Promise<void> {
    const list = this.getBookmarks();
    const filtered = list.filter(b => b.id !== id);
    await this.context.globalState.update(BookmarksManager.STORAGE_KEY, filtered);
    this.onDidChangeEmitter.fire();
  }

  public async updateBookmark(id: string, note?: string, tags?: string[]): Promise<void> {
    const list = this.getBookmarks();
    const item = list.find(b => b.id === id);
    if (item) {
      if (note !== undefined) item.note = note;
      if (tags !== undefined) item.tags = tags;
      await this.context.globalState.update(BookmarksManager.STORAGE_KEY, list);
      this.onDidChangeEmitter.fire();
    }
  }

  public exportBookmarksMarkdown(): string {
    const bookmarks = this.getBookmarks();
    if (bookmarks.length === 0) {
      return '# Daily Bible Bookmarks\n\nNo bookmarks saved yet.';
    }

    let md = '# 📖 Daily Bible — Saved Bookmarks & Favorites\n\n';
    md += `*Exported on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

    for (const b of bookmarks) {
      const dateStr = new Date(b.createdAt).toLocaleDateString();
      md += `### ${b.bookName} ${b.chapter}:${b.verse} (${b.translation.toUpperCase()})\n`;
      md += `> "${b.text}"\n\n`;
      if (b.note) {
        md += `📝 **Note:** ${b.note}\n\n`;
      }
      if (b.tags && b.tags.length > 0) {
        md += `🏷️ **Tags:** ${b.tags.map(t => '`#' + t + '`').join(' ')}\n\n`;
      }
      md += `*Saved on ${dateStr}*\n\n---\n\n`;
    }

    return md;
  }

  public exportBookmarksJson(): string {
    return JSON.stringify(this.getBookmarks(), null, 2);
  }

  public async importBookmarks(jsonStr: string): Promise<number> {
    try {
      const parsed = JSON.parse(jsonStr) as Bookmark[];
      if (!Array.isArray(parsed)) return 0;

      const current = this.getBookmarks();
      const existingIds = new Set(current.map(c => c.id));
      let count = 0;

      for (const item of parsed) {
        if (item.bookId && item.chapter && item.verse && item.text) {
          const id = item.id || `${item.bookId}:${item.chapter}:${item.verse}:${item.translation || 'zulu'}`;
          if (!existingIds.has(id)) {
            current.push({ ...item, id, createdAt: item.createdAt || Date.now() });
            existingIds.add(id);
            count++;
          }
        }
      }

      await this.context.globalState.update(BookmarksManager.STORAGE_KEY, current);
      this.onDidChangeEmitter.fire();
      return count;
    } catch {
      return 0;
    }
  }
}

