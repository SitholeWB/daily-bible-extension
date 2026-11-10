import * as vscode from 'vscode';
import { BibleManager } from './bibleManager';
import { BookmarksManager } from './bookmarks';
import { BookMetadata, Translation } from './types';

export class BibleReaderView {
  public static currentPanel: BibleReaderView | undefined;

  public static updateCurrent(): void {
    BibleReaderView.currentPanel?.update();
  }
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly bibleManager: BibleManager;
  private readonly bookmarksManager: BookmarksManager;
  private disposables: vscode.Disposable[] = [];

  private currentBookId: number = 43; // John
  private currentChapter: number = 3;
  private currentVerseTarget?: number = 16;
  private primaryTranslation: Translation = 'kjv';
  private parallelTranslation: Translation = 'zulu';
  private isParallel: boolean = false;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    bibleManager: BibleManager,
    bookmarksManager: BookmarksManager,
    initialBookId: number = 43,
    initialChapter: number = 3,
    initialVerse?: number,
    initialTranslation: Translation = 'kjv'
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.bibleManager = bibleManager;
    this.bookmarksManager = bookmarksManager;
    this.currentBookId = initialBookId;
    this.currentChapter = initialChapter;
    this.currentVerseTarget = initialVerse;
    this.primaryTranslation = initialTranslation;

    this.update();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'prevChapter':
            this.goToPreviousChapter();
            break;
          case 'nextChapter':
            this.goToNextChapter();
            break;
          case 'setChapter':
            this.currentChapter = message.chapter;
            this.currentVerseTarget = undefined;
            this.update();
            break;
          case 'setBookAndChapter':
            this.currentBookId = message.bookId;
            this.currentChapter = message.chapter;
            this.currentVerseTarget = message.verse;
            this.update();
            break;
          case 'toggleParallel':
            this.isParallel = !this.isParallel;
            this.update();
            break;
          case 'setPrimaryTranslation':
            if (message.translation === '__more__') {
              vscode.commands.executeCommand('dailyBread.switchTranslation', 'primary');
              this.update();
              break;
            }
            this.primaryTranslation = message.translation;
            this.update();
            break;
          case 'setParallelTranslation':
            if (message.translation === '__more__') {
              vscode.commands.executeCommand('dailyBread.switchTranslation', 'parallel');
              this.update();
              break;
            }
            this.parallelTranslation = message.translation;
            this.update();
            break;
          case 'openTranslationSwitcher':
            vscode.commands.executeCommand('dailyBread.switchTranslation', message.mode || 'primary');
            break;
          case 'copyVerse': {
            const vData = this.bibleManager.getVerse(
              message.bookId,
              message.chapter,
              message.verse,
              message.translation
            );
            if (vData) {
              const bName = message.translation === 'zulu' ? vData.zuluBookName : vData.bookName;
              const formatted = `"${vData.text}" — ${bName} ${message.chapter}:${message.verse} (${message.translation.toUpperCase()})`;
              await vscode.env.clipboard.writeText(formatted);
              vscode.window.showInformationMessage(`Copied: ${bName} ${message.chapter}:${message.verse}`);
            }
            break;
          }
          case 'bookmarkVerse': {
            const vData = this.bibleManager.getVerse(
              message.bookId,
              message.chapter,
              message.verse,
              message.translation
            );
            if (vData) {
              if (this.bookmarksManager.isBookmarked(message.bookId, message.chapter, message.verse)) {
                const bId = `${message.bookId}:${message.chapter}:${message.verse}:${message.translation}`;
                await this.bookmarksManager.removeBookmark(bId);
                vscode.window.showInformationMessage(`Bookmark removed.`);
              } else {
                await this.bookmarksManager.addBookmark(vData);
                vscode.window.showInformationMessage(
                  `⭐ Bookmarked: ${vData.bookName} ${message.chapter}:${message.verse}`
                );
              }
              this.update();
            }
            break;
          }
          case 'openBookPicker':
            this.showBookPicker();
            break;
          case 'jumpToReference': {
            if (message.ref) {
              const parsed = this.bibleManager.parseReference(message.ref);
              if (parsed) {
                this.navigate(parsed.book.id, parsed.chapter, parsed.verse, this.primaryTranslation);
              } else {
                vscode.window.showInformationMessage(`Could not resolve cross-reference: ${message.ref}`);
              }
            }
            break;
          }
          case 'adjustFontSize': {
            const config = vscode.workspace.getConfiguration('dailyBread');
            const current = config.get<number>('fontSize', 0);
            const editorSize = vscode.workspace.getConfiguration('editor').get<number>('fontSize', 14);
            const base = current === 0 ? editorSize : current;
            const next = Math.max(10, Math.min(36, base + message.delta));
            await config.update('fontSize', next, vscode.ConfigurationTarget.Global);
            this.update();
            break;
          }
          case 'setFontSize': {
            const config = vscode.workspace.getConfiguration('dailyBread');
            await config.update('fontSize', message.size, vscode.ConfigurationTarget.Global);
            this.update();
            break;
          }
          case 'promptFontSize': {
            await vscode.commands.executeCommand('dailyBread.changeFontSize');
            break;
          }
        }
      },
      null,
      this.disposables
    );
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    bibleManager: BibleManager,
    bookmarksManager: BookmarksManager,
    bookId: number = 43,
    chapter: number = 3,
    verse?: number,
    translation: Translation = 'kjv'
  ): BibleReaderView {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (BibleReaderView.currentPanel) {
      BibleReaderView.currentPanel.panel.reveal(column);
      BibleReaderView.currentPanel.navigate(bookId, chapter, verse, translation);
      return BibleReaderView.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      'dailyBreadReader',
      'Daily Bible Reader',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      }
    );

    BibleReaderView.currentPanel = new BibleReaderView(
      panel,
      extensionUri,
      bibleManager,
      bookmarksManager,
      bookId,
      chapter,
      verse,
      translation
    );

    return BibleReaderView.currentPanel;
  }

  public navigate(bookId: number, chapter: number, verse?: number, translation?: Translation): void {
    this.currentBookId = bookId;
    this.currentChapter = chapter;
    this.currentVerseTarget = verse;
    if (translation) {
      this.primaryTranslation = translation;
    }
    this.update();
  }

  private goToPreviousChapter(): void {
    const book = this.bibleManager.getBook(this.currentBookId);
    if (!book) return;

    if (this.currentChapter > 1) {
      this.currentChapter--;
    } else if (this.currentBookId > 1) {
      this.currentBookId--;
      const prevBook = this.bibleManager.getBook(this.currentBookId);
      this.currentChapter = prevBook ? prevBook.chapters : 1;
    }
    this.currentVerseTarget = undefined;
    this.update();
  }

  private goToNextChapter(): void {
    const book = this.bibleManager.getBook(this.currentBookId);
    if (!book) return;

    if (this.currentChapter < book.chapters) {
      this.currentChapter++;
    } else if (this.currentBookId < 66) {
      this.currentBookId++;
      this.currentChapter = 1;
    }
    this.currentVerseTarget = undefined;
    this.update();
  }

  private async showBookPicker(): Promise<void> {
    const books = this.bibleManager.getBooks();
    const items = books.map(b => ({
      label: this.primaryTranslation === 'zulu' ? `${b.zuluName} (${b.name})` : `${b.name} (${b.zuluName})`,
      description: `${b.testament} • ${b.chapters} chapters`,
      book: b
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a Book to Read (e.g. USenesisi, AmaHubo, UJohane, Romans)'
    });

    if (!selected) return;

    const chapters = Array.from({ length: selected.book.chapters }, (_, i) => ({
      label: `Chapter ${i + 1}`,
      chapter: i + 1
    }));

    const selectedChapter = await vscode.window.showQuickPick(chapters, {
      placeHolder: `Select Chapter (1 to ${selected.book.chapters})`
    });

    if (selectedChapter) {
      this.currentBookId = selected.book.id;
      this.currentChapter = selectedChapter.chapter;
      this.currentVerseTarget = undefined;
      this.update();
    }
  }

  private update(): void {
    const book = this.bibleManager.getBook(this.currentBookId);
    if (!book) return;

    const bookTitle = this.primaryTranslation === 'zulu' ? book.zuluName : book.name;
    this.panel.title = `📖 ${bookTitle} ${this.currentChapter}`;
    this.panel.webview.html = this.getHtmlContent(book);
  }

  private getHtmlContent(book: BookMetadata): string {
    if (!this.bibleManager.isTranslationInstalled(this.primaryTranslation)) {
      this.primaryTranslation = 'kjv';
    }
    if (!this.bibleManager.isTranslationInstalled(this.parallelTranslation)) {
      this.parallelTranslation = 'zulu';
    }

    const installedTranslations = this.bibleManager.getInstalledTranslations();
    const primaryInfo = this.bibleManager.getTranslationInfo(this.primaryTranslation);
    const parallelInfo = this.bibleManager.getTranslationInfo(this.parallelTranslation);
    const primaryDir = primaryInfo?.direction || 'ltr';

    const primaryOptionsHtml =
      installedTranslations
        .map(t => `<option value="${t.id}" ${this.primaryTranslation === t.id ? 'selected' : ''}>${t.language} (${t.shortName})</option>`)
        .join('') +
      `<option value="__more__">🌐 Download More Translations...</option>`;

    const parallelOptionsHtml =
      installedTranslations
        .map(t => `<option value="${t.id}" ${this.parallelTranslation === t.id ? 'selected' : ''}>Parallel: ${t.language} (${t.shortName})</option>`)
        .join('') +
      `<option value="__more__">🌐 Download More Translations...</option>`;

    const primaryVerses = this.bibleManager.getChapter(
      this.currentBookId,
      this.currentChapter,
      this.primaryTranslation
    );

    const parallelVerses = this.isParallel
      ? this.bibleManager.getChapter(
          this.currentBookId,
          this.currentChapter,
          this.parallelTranslation
        )
      : [];

    const bookDisplayName =
      this.primaryTranslation === 'zulu'
        ? `${book.zuluName} (${book.name})`
        : `${book.name} (${book.zuluName})`;

    const totalChapters = book.chapters;

    let versesHtml = '';
    const maxVerses = Math.max(primaryVerses.length, parallelVerses.length);

    for (let i = 0; i < maxVerses; i++) {
      const vNum = i + 1;
      const vTextPrimary = primaryVerses[i] || '';
      const vTextParallel = parallelVerses[i] || '';
      const isBookmarked = this.bookmarksManager.isBookmarked(book.id, this.currentChapter, vNum);
      const isTarget = this.currentVerseTarget === vNum;
      const highlightClass = isTarget ? 'target-verse' : '';
      const bookmarkClass = isBookmarked ? 'is-bookmarked' : '';
      const resolvedCrossRefs = this.bibleManager.resolveCrossReferences(book.id, this.currentChapter, vNum, this.primaryTranslation, 8);
      const hasCrossRefs = resolvedCrossRefs.length > 0;

      let crossRefsHtml = '';
      if (hasCrossRefs) {
        crossRefsHtml = `
          <div class="cross-ref-tray" id="cross-tray-${vNum}" style="display:none;">
            <div class="cross-ref-tray-title">🔗 Cross References & Connected Verses (${resolvedCrossRefs.length})</div>
            <div class="cross-ref-list">
              ${resolvedCrossRefs.map(cr => `
                <div class="cross-ref-item" onclick="jumpRef('${cr.ref}')" title="Click to open ${cr.ref} in reader">
                  <div class="cr-header">
                    <span class="cr-citation">🔗 ${cr.bookName} ${cr.chapter}:${cr.verse}${cr.endVerse ? '-' + cr.endVerse : ''}</span>
                    ${cr.anchor ? `<span class="cr-anchor">on "${cr.anchor}"</span>` : ''}
                  </div>
                  <div class="cr-verse-text">"${cr.text}"</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (this.isParallel) {
        versesHtml += `
          <div class="verse-row ${highlightClass}" id="verse-${vNum}">
            <div class="verse-col primary-col ${bookmarkClass}">
              <span class="verse-num">${vNum}</span>
              <span class="verse-text">${vTextPrimary}</span>
              <div class="verse-actions">
                ${hasCrossRefs ? `<button title="Cross References" class="action-btn" onclick="toggleCrossRefs(${vNum})">🔗</button>` : ''}
                <button title="Bookmark" onclick="bookmarkVerse(${book.id}, ${this.currentChapter}, ${vNum}, '${this.primaryTranslation}')">${isBookmarked ? '⭐' : '☆'}</button>
                <button title="Copy" onclick="copyVerse(${book.id}, ${this.currentChapter}, ${vNum}, '${this.primaryTranslation}')">📋</button>
              </div>
            </div>
            <div class="verse-col parallel-col">
              <span class="verse-num">${vNum}</span>
              <span class="verse-text">${vTextParallel}</span>
              <div class="verse-actions">
                <button title="Copy" onclick="copyVerse(${book.id}, ${this.currentChapter}, ${vNum}, '${this.parallelTranslation}')">📋</button>
              </div>
            </div>
          </div>
          ${crossRefsHtml}
        `;
      } else {
        versesHtml += `
          <div class="verse-item ${highlightClass} ${bookmarkClass}" id="verse-${vNum}">
            <span class="verse-num">${vNum}</span>
            <span class="verse-text">${vTextPrimary}</span>
            <span class="verse-actions">
              ${hasCrossRefs ? `<button class="action-btn" title="View Cross References" onclick="toggleCrossRefs(${vNum})">🔗</button>` : ''}
              <button class="action-btn" title="Bookmark" onclick="bookmarkVerse(${book.id}, ${this.currentChapter}, ${vNum}, '${this.primaryTranslation}')">${isBookmarked ? '⭐' : '☆'}</button>
              <button class="action-btn" title="Copy Verse" onclick="copyVerse(${book.id}, ${this.currentChapter}, ${vNum}, '${this.primaryTranslation}')">📋</button>
            </span>
          </div>
          ${crossRefsHtml}
        `;
      }
    }

    const dailyBreadConfig = vscode.workspace.getConfiguration('dailyBread');
    const configuredFontSize = dailyBreadConfig.get<number>('fontSize', 0);
    const configuredFontFamily = dailyBreadConfig.get<string>('fontFamily', 'editor');

    const editorConfig = vscode.workspace.getConfiguration('editor');
    const editorFontSize = editorConfig.get<number>('fontSize', 14);
    const editorFontFamily = editorConfig.get<string>('fontFamily', '');

    let resolvedFontFamily = 'var(--vscode-editor-font-family, monospace)';
    if (configuredFontFamily === 'serif') {
      resolvedFontFamily = 'Georgia, Garamond, "Times New Roman", serif';
    } else if (configuredFontFamily === 'sans-serif') {
      resolvedFontFamily = 'var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)';
    } else if (configuredFontFamily === 'monospace') {
      resolvedFontFamily = 'var(--vscode-editor-font-family, Consolas, "Courier New", monospace)';
    } else if (configuredFontFamily === 'system') {
      resolvedFontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }

    const fontSizeDisplay = configuredFontSize === 0 ? `Editor (${editorFontSize}px)` : `${configuredFontSize}px`;
    const cssFontSize = configuredFontSize === 0 ? `var(--vscode-editor-font-size, ${editorFontSize}px)` : `${configuredFontSize}px`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bookDisplayName} ${this.currentChapter}</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --font-family: ${resolvedFontFamily};
      --reader-font-size: ${cssFontSize};
      --accent: var(--vscode-textLink-foreground, #3794ff);
      --card-bg: var(--vscode-editorWidget-background, rgba(128, 128, 128, 0.08));
      --border: var(--vscode-editorWidget-border, rgba(128, 128, 128, 0.2));
      --hover-bg: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.12));
      --highlight: var(--vscode-editor-findMatchHighlightBackground, rgba(234, 179, 8, 0.25));
    }

    * { box-sizing: border-box; }

    body {
      background-color: var(--bg);
      color: var(--fg);
      font-family: var(--font-family);
      font-size: var(--reader-font-size);
      margin: 0;
      padding: 0;
      line-height: 1.7;
    }

    .header-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      padding: 10px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      backdrop-filter: blur(8px);
    }

    .nav-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn {
      background: var(--card-bg);
      color: var(--fg);
      border: 1px solid var(--border);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .btn:hover {
      background: var(--hover-bg);
      border-color: var(--accent);
    }

    .btn-primary {
      background: var(--accent);
      color: #ffffff;
      border: none;
    }

    .title-pill {
      font-size: 16px;
      font-weight: 600;
      padding: 4px 12px;
      cursor: pointer;
      border-radius: 4px;
    }

    .title-pill:hover {
      background: var(--hover-bg);
      color: var(--accent);
    }

    .view-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    select {
      background: var(--card-bg);
      color: var(--fg);
      border: 1px solid var(--border);
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
    }

    .content-area {
      max-width: ${this.isParallel ? '1200px' : '820px'};
      margin: 0 auto;
      padding: 32px 24px 64px 24px;
    }

    .chapter-hero {
      text-align: center;
      margin-bottom: 32px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
    }

    .chapter-hero h1 {
      margin: 0 0 6px 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }

    .chapter-hero .subtitle {
      opacity: 0.75;
      font-size: 14px;
    }

    .parallel-headers {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }

    /* Single view layout */
    .verse-item {
      position: relative;
      padding: 6px 10px;
      border-radius: 6px;
      margin-bottom: 4px;
      transition: background 0.15s ease;
      display: flex;
      align-items: baseline;
      gap: 10px;
    }

    .verse-item:hover {
      background: var(--hover-bg);
    }

    .verse-num {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
      min-width: 22px;
      user-select: none;
      opacity: 0.85;
    }

    .verse-text {
      flex: 1;
    }

    .verse-actions {
      opacity: 0;
      transition: opacity 0.15s ease;
      display: inline-flex;
      gap: 4px;
    }

    .verse-item:hover .verse-actions,
    .verse-col:hover .verse-actions {
      opacity: 1;
    }

    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 13px;
      padding: 2px 4px;
      border-radius: 3px;
    }

    .action-btn:hover {
      background: var(--hover-bg);
    }

    /* Parallel view layout */
    .verse-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 8px 10px;
      border-radius: 6px;
      margin-bottom: 4px;
    }

    .verse-row:hover {
      background: var(--hover-bg);
    }

    .verse-col {
      display: flex;
      align-items: baseline;
      gap: 10px;
      position: relative;
    }

    .target-verse {
      background: var(--highlight) !important;
      border-left: 3px solid var(--accent);
    }

    .is-bookmarked .verse-num {
      color: #eab308;
    }

    /* Cross References Tray */
    .cross-ref-tray {
      margin: 6px 0 12px 32px;
      padding: 12px 16px;
      background: var(--card-bg);
      border-left: 3px solid var(--accent);
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 280px;
      overflow-y: auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .cross-ref-tray-title {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.85;
      color: var(--accent);
    }

    .cross-ref-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cross-ref-item {
      padding: 8px 12px;
      border-radius: 6px;
      background: var(--hover-bg);
      border: 1px solid var(--border);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .cross-ref-item:hover {
      border-color: var(--accent);
      background: var(--card-bg);
      transform: translateX(3px);
    }

    .cr-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .cr-citation {
      font-weight: 600;
      color: var(--accent);
      font-size: 12px;
    }

    .cr-anchor {
      font-size: 11px;
      font-style: italic;
      opacity: 0.75;
    }

    .cr-verse-text {
      font-size: 13px;
      line-height: 1.5;
      opacity: 0.95;
      font-style: italic;
    }

    .ref-pill {
      background: var(--hover-bg);
      border: 1px solid var(--border);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      color: var(--accent);
      transition: all 0.15s ease;
      user-select: none;
    }

    .ref-pill:hover {
      background: var(--accent);
      color: #ffffff;
      border-color: var(--accent);
    }

    .bottom-nav {
      display: flex;
      justify-content: space-between;
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }

    .font-controls {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 1px 3px;
    }

    .font-btn {
      border: none !important;
      background: transparent !important;
      padding: 3px 6px !important;
      font-size: 11px !important;
      font-weight: 600;
      border-radius: 3px;
      cursor: pointer;
    }

    .font-btn:hover {
      background: var(--hover-bg) !important;
      color: var(--accent);
    }

    .font-btn.btn-active {
      color: var(--accent);
      font-weight: 700;
    }

    .font-pill {
      border: none !important;
      background: transparent !important;
      padding: 3px 7px !important;
      font-size: 11px !important;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border-left: 1px solid var(--border) !important;
      border-right: 1px solid var(--border) !important;
      border-radius: 0 !important;
      cursor: pointer;
    }

    .font-pill:hover {
      background: var(--hover-bg) !important;
      color: var(--accent);
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="nav-controls">
      <button class="btn" onclick="prevChapter()" title="Previous Chapter">◀ Prev</button>
      <div class="title-pill" onclick="openPicker()" title="Click to browse books and chapters">
        ${bookDisplayName} — Chapter ${this.currentChapter} ▾
      </div>
      <button class="btn" onclick="nextChapter()" title="Next Chapter">Next ▶</button>
    </div>

    <div class="view-controls">
      <label for="primary-trans" style="font-size:12px;opacity:0.8;">Primary:</label>
      <select id="primary-trans" onchange="changePrimary(this.value)">
        ${primaryOptionsHtml}
      </select>
      <button class="btn" onclick="openTranslationLibrary()" title="Search, Switch &amp; Download More Offline Bible Translations">🌐 More</button>

      <button class="btn ${this.isParallel ? 'btn-primary' : ''}" onclick="toggleParallel()" title="Toggle Side-by-Side Dual Translation View">
        ${this.isParallel ? 'Parallel: ON' : 'Parallel: OFF'}
      </button>

      ${this.isParallel ? `
        <select id="parallel-trans" onchange="changeParallel(this.value)">
          ${parallelOptionsHtml}
        </select>
      ` : ''}

      <div class="font-controls" title="Scripture Font Size">
        <button class="btn font-btn" onclick="adjustFontSize(-1)" title="Decrease font size (A-)">A−</button>
        <button class="btn font-pill" onclick="promptFontSize()" title="Click to choose or customize font size">
          <span style="font-weight:700;">Aa</span>
          <span id="font-size-label">${fontSizeDisplay}</span>
        </button>
        <button class="btn font-btn" onclick="adjustFontSize(1)" title="Increase font size (A+)">A+</button>
        <button class="btn font-btn ${configuredFontSize === 0 ? 'btn-active' : ''}" onclick="resetFontSize()" title="Match VS Code Editor Font Size">Auto</button>
      </div>
    </div>
  </div>

  <div class="content-area">
    <div class="chapter-hero">
      <h1>${bookDisplayName}</h1>
      <div class="subtitle">Chapter ${this.currentChapter} of ${totalChapters} • ${primaryInfo ? `${primaryInfo.language} — ${primaryInfo.name}` : this.primaryTranslation.toUpperCase()}</div>
    </div>

    ${this.isParallel ? `
      <div class="parallel-headers">
        <div>${primaryInfo ? `${primaryInfo.language} (${primaryInfo.shortName})` : this.primaryTranslation.toUpperCase()}</div>
        <div>${parallelInfo ? `${parallelInfo.language} (${parallelInfo.shortName})` : this.parallelTranslation.toUpperCase()}</div>
      </div>
    ` : ''}

    <div class="verses-container" dir="${primaryDir}">
      ${versesHtml}
    </div>

    <div class="bottom-nav">
      <button class="btn" onclick="prevChapter()">◀ Previous Chapter</button>
      <button class="btn" onclick="openPicker()">Jump to Book / Chapter</button>
      <button class="btn" onclick="nextChapter()">Next Chapter ▶</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function prevChapter() {
      vscode.postMessage({ command: 'prevChapter' });
    }

    function nextChapter() {
      vscode.postMessage({ command: 'nextChapter' });
    }

    function openPicker() {
      vscode.postMessage({ command: 'openBookPicker' });
    }

    function toggleParallel() {
      vscode.postMessage({ command: 'toggleParallel' });
    }

    function changePrimary(val) {
      vscode.postMessage({ command: 'setPrimaryTranslation', translation: val });
    }

    function changeParallel(val) {
      vscode.postMessage({ command: 'setParallelTranslation', translation: val });
    }

    function openTranslationLibrary() {
      vscode.postMessage({ command: 'openTranslationSwitcher', mode: 'primary' });
    }

    function copyVerse(bookId, chapter, verse, translation) {
      vscode.postMessage({ command: 'copyVerse', bookId, chapter, verse, translation });
    }

    function bookmarkVerse(bookId, chapter, verse, translation) {
      vscode.postMessage({ command: 'bookmarkVerse', bookId, chapter, verse, translation });
    }

    function toggleCrossRefs(vNum) {
      const tray = document.getElementById('cross-tray-' + vNum);
      if (tray) {
        if (tray.style.display === 'none' || !tray.style.display) {
          tray.style.display = 'flex';
        } else {
          tray.style.display = 'none';
        }
      }
    }

    function jumpRef(ref) {
      vscode.postMessage({ command: 'jumpToReference', ref: ref });
    }

    function adjustFontSize(delta) {
      vscode.postMessage({ command: 'adjustFontSize', delta: delta });
    }

    function resetFontSize() {
      vscode.postMessage({ command: 'setFontSize', size: 0 });
    }

    function promptFontSize() {
      vscode.postMessage({ command: 'promptFontSize' });
    }

    // Auto-scroll to target verse if specified
    window.addEventListener('DOMContentLoaded', () => {
      ${this.currentVerseTarget ? `
        const target = document.getElementById('verse-${this.currentVerseTarget}');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      ` : ''}
    });
  </script>
</body>
</html>`;
  }

  public isVisible(): boolean {
    return this.panel.visible;
  }

  public dispose(): void {
    BibleReaderView.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}

