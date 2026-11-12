import * as vscode from 'vscode';
import { Bookmark, DailyBibleBackup, ExtensionSettings, StudyNote, VerseData } from './types';

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

  public exportBookmarksText(): string {
    const bookmarks = this.getBookmarks();
    if (bookmarks.length === 0) {
      return 'Daily Bible — Saved Bookmarks\n\nNo bookmarks saved yet.';
    }

    const lines: string[] = [
      'DAILY BIBLE — SAVED BOOKMARKS & STUDY NOTES',
      `Exported on ${new Date().toLocaleDateString()}`,
      '============================================================',
      ''
    ];

    for (const b of bookmarks) {
      const dateStr = new Date(b.createdAt).toLocaleDateString();
      lines.push(`${b.bookName} ${b.chapter}:${b.verse} (${b.translation.toUpperCase()})`);
      lines.push(`"${b.text}"`);
      if (b.note) {
        lines.push(`Note: ${b.note}`);
      }
      if (b.tags && b.tags.length > 0) {
        lines.push(`Tags: ${b.tags.map(t => '#' + t).join(' ')}`);
      }
      lines.push(`Saved on ${dateStr}`);
      lines.push('------------------------------------------------------------');
      lines.push('');
    }

    return lines.join('\n');
  }

  public exportBookmarksCsv(): string {
    const bookmarks = this.getBookmarks();
    const escCsv = (val: string): string => `"${(val || '').replace(/"/g, '""')}"`;
    const rows = ['Book,Chapter,Verse,Translation,Text,Note,Tags,SavedDate'];

    for (const b of bookmarks) {
      const tagsStr = b.tags ? b.tags.join('; ') : '';
      const dateStr = new Date(b.createdAt).toISOString().slice(0, 10);
      rows.push(
        [
          escCsv(b.bookName),
          b.chapter.toString(),
          b.verse.toString(),
          escCsv(b.translation.toUpperCase()),
          escCsv(b.text),
          escCsv(b.note || ''),
          escCsv(tagsStr),
          escCsv(dateStr)
        ].join(',')
      );
    }

    return rows.join('\n');
  }

  public exportBookmarksHtml(): string {
    const bookmarks = this.getBookmarks();
    const esc = (s: string): string =>
      (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const cards =
      bookmarks.length === 0
        ? '<p>No bookmarks saved yet.</p>'
        : bookmarks
            .map(b => {
              const dateStr = new Date(b.createdAt).toLocaleDateString();
              const noteHtml = b.note ? `<p class="note"><strong>Note:</strong> ${esc(b.note)}</p>` : '';
              const tagsHtml =
                b.tags && b.tags.length > 0
                  ? `<div class="tags">${b.tags.map(t => `<span>#${esc(t)}</span>`).join(' ')}</div>`
                  : '';
              return `<article class="card">
  <h2>${esc(b.bookName)} ${b.chapter}:${b.verse} <small>(${esc(b.translation.toUpperCase())})</small></h2>
  <blockquote>"${esc(b.text)}"</blockquote>
  ${noteHtml}
  ${tagsHtml}
  <div class="date">Saved on ${esc(dateStr)}</div>
</article>`;
            })
            .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Daily Bible — Saved Bookmarks &amp; Study Notes</title>
  <style>
    body { font-family: Georgia, serif; max-width: 780px; margin: 40px auto; padding: 0 20px; color: #1f2328; line-height: 1.65; }
    h1 { border-bottom: 2px solid #d0d7de; padding-bottom: 10px; }
    .meta { color: #57606a; font-style: italic; margin-bottom: 28px; }
    .card { border: 1px solid #d0d7de; border-radius: 8px; padding: 16px 20px; margin-bottom: 18px; page-break-inside: avoid; }
    .card h2 { margin: 0 0 8px 0; font-size: 1.15em; font-family: system-ui, sans-serif; }
    .card h2 small { color: #57606a; font-weight: normal; }
    blockquote { margin: 8px 0 12px 0; padding-left: 14px; border-left: 3px solid #0969da; font-size: 1.05em; }
    .note { background: #f6f8fa; padding: 8px 12px; border-radius: 6px; font-family: system-ui, sans-serif; font-size: 0.92em; }
    .tags span { display: inline-block; background: #ddf4ff; color: #0969da; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-family: system-ui, sans-serif; margin-right: 4px; }
    .date { font-size: 0.8em; color: #57606a; margin-top: 8px; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <h1>📖 Daily Bible — Saved Bookmarks &amp; Study Notes</h1>
  <div class="meta">Exported on ${esc(new Date().toLocaleDateString())}</div>
  ${cards}
</body>
</html>`;
  }

  public exportBookmarksJson(): string {
    return JSON.stringify(this.getBookmarks(), null, 2);
  }

  public exportFullBackup(
    settings: Partial<ExtensionSettings>,
    installedTranslations: string[],
    notes?: StudyNote[]
  ): string {
    const backup: DailyBibleBackup = {
      format: 'daily-bible-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      bookmarks: this.getBookmarks(),
      notes: notes && notes.length > 0 ? notes : undefined,
      settings,
      installedTranslations
    };
    return JSON.stringify(backup, null, 2);
  }

  private async mergeBookmarkItems(items: Bookmark[]): Promise<number> {
    const current = this.getBookmarks();
    const existingIds = new Set(current.map(c => c.id));
    let count = 0;

    for (const item of items) {
      if (item && item.bookId && item.chapter && item.verse && item.text) {
        const trans = item.translation || 'kjv';
        const id = item.id || `${item.bookId}:${item.chapter}:${item.verse}:${trans}`;
        if (!existingIds.has(id)) {
          current.push({
            ...item,
            id,
            translation: trans,
            createdAt: item.createdAt || Date.now()
          });
          existingIds.add(id);
          count++;
        }
      }
    }

    if (count > 0) {
      await this.context.globalState.update(BookmarksManager.STORAGE_KEY, current);
      this.onDidChangeEmitter.fire();
    }
    return count;
  }

  public async importBookmarks(jsonStr: string): Promise<number> {
    const res = await this.importBackup(jsonStr);
    return res.bookmarksImported;
  }

  public async importBackup(
    jsonStr: string
  ): Promise<{
    bookmarksImported: number;
    notes?: StudyNote[];
    settings?: Partial<ExtensionSettings>;
    installedTranslations?: string[];
  }> {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        const count = await this.mergeBookmarkItems(parsed as Bookmark[]);
        return { bookmarksImported: count };
      }

      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.bookmarks)) {
        const backup = parsed as DailyBibleBackup;
        const count = await this.mergeBookmarkItems(backup.bookmarks);
        return {
          bookmarksImported: count,
          notes: Array.isArray(backup.notes) ? backup.notes : undefined,
          settings: backup.settings,
          installedTranslations: Array.isArray(backup.installedTranslations) ? backup.installedTranslations : undefined
        };
      }

      return { bookmarksImported: 0 };
    } catch {
      return { bookmarksImported: 0 };
    }
  }

  /**
   * Parses bookmarks from a Daily Bible exported Markdown (.md) document.
   */
  public async importBookmarksMarkdown(
    mdContent: string,
    resolveBook: (bookName: string) => { id: number; name: string } | undefined
  ): Promise<number> {
    const blocks = mdContent.split(/\n---\s*\n/);
    const parsedItems: Bookmark[] = [];

    for (const block of blocks) {
      const headingMatch = block.match(/###\s+(.+?)\s+(\d+):(\d+)\s+\(([^)]+)\)/);
      if (!headingMatch) continue;

      const rawBook = headingMatch[1].trim();
      const chapter = parseInt(headingMatch[2], 10);
      const verse = parseInt(headingMatch[3], 10);
      const translation = headingMatch[4].trim().toLowerCase();

      const book = resolveBook(rawBook);
      if (!book || isNaN(chapter) || isNaN(verse)) continue;

      const quoteMatch = block.match(/>\s*"([\s\S]*?)"/);
      const text = quoteMatch ? quoteMatch[1].trim() : '';
      if (!text) continue;

      const noteMatch = block.match(/📝\s*\*\*Note:\*\*\s*(.+)/);
      const note = noteMatch ? noteMatch[1].trim() : undefined;

      const tagsMatch = block.match(/🏷️\s*\*\*Tags:\*\*\s*(.+)/);
      let tags: string[] | undefined;
      if (tagsMatch) {
        const found = Array.from(tagsMatch[1].matchAll(/#([A-Za-z0-9_\-]+)/g)).map(m => m[1]);
        if (found.length > 0) tags = found;
      }

      parsedItems.push({
        id: `${book.id}:${chapter}:${verse}:${translation}`,
        bookId: book.id,
        chapter,
        verse,
        translation,
        text,
        bookName: rawBook,
        createdAt: Date.now(),
        note,
        tags
      });
    }

    return this.mergeBookmarkItems(parsedItems);
  }
}

