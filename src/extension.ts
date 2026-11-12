import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { BibleManager } from './bibleManager';
import { BookmarksManager } from './bookmarks';
import { NotesManager } from './notesManager';
import { BibleReaderView } from './readerView';
import { StudyNoteView } from './studyNoteView';
import { TranslationSwitcherView } from './translationSwitcherView';
import { StatusBarController } from './statusBar';
import { BibleExplorerProvider } from './sidebar/bibleExplorerProvider';
import { BookmarksProvider, BookmarkTreeItem } from './sidebar/bookmarksProvider';
import { NotesProvider, NoteTreeItem } from './sidebar/notesProvider';
import { TopicsProvider } from './sidebar/topicsProvider';
import { ToolsProvider } from './sidebar/toolsProvider';
import { Bookmark, ExtensionSettings, RotationSchedule, StatusDisplayMode, StatusIconType, StudyNote, Translation, VerseData } from './types';

let bibleManager: BibleManager;
let bookmarksManager: BookmarksManager;
let notesManager: NotesManager;
let statusBarController: StatusBarController;
let rotationTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
  bibleManager = new BibleManager(context.extensionPath, context.globalStorageUri.fsPath);
  bookmarksManager = new BookmarksManager(context);
  notesManager = new NotesManager(context);
  statusBarController = new StatusBarController();

  // Register Tree Views
  const explorerProvider = new BibleExplorerProvider(bibleManager);
  vscode.window.registerTreeDataProvider('dailyBreadExplorer', explorerProvider);

  const bookmarksProvider = new BookmarksProvider(bookmarksManager);
  vscode.window.registerTreeDataProvider('dailyBreadBookmarks', bookmarksProvider);

  const notesProvider = new NotesProvider(notesManager);
  vscode.window.registerTreeDataProvider('dailyBreadNotes', notesProvider);

  const topicsProvider = new TopicsProvider(bibleManager);
  vscode.window.registerTreeDataProvider('dailyBreadTopics', topicsProvider);

  const toolsProvider = new ToolsProvider(bibleManager, () => isRotationPaused);
  vscode.window.registerTreeDataProvider('dailyBreadTools', toolsProvider);

  // Settings
  const getSettings = (): ExtensionSettings => {
    const config = vscode.workspace.getConfiguration('dailyBread');
    const rawTranslation = config.get<Translation>('translation', 'kjv');
    const rawDual = config.get<Translation | 'none'>('dualTranslation', 'none');

    const safeTranslation = bibleManager.isTranslationInstalled(rawTranslation) ? rawTranslation : 'kjv';
    const safeDual =
      rawDual !== 'none' && bibleManager.isTranslationInstalled(rawDual) ? rawDual : 'none';

    return {
      translation: safeTranslation,
      displayMode: config.get<StatusDisplayMode>('displayMode', 'preview'),
      icon: config.get<StatusIconType>('icon', 'cross'),
      rotationSchedule: config.get<RotationSchedule>('rotationSchedule', '15min'),
      rotateOnFileSave: config.get<boolean>('rotateOnFileSave', false),
      preventRotationWhileReading: config.get<boolean>('preventRotationWhileReading', true),
      topic: config.get<string>('topic', 'all'),
      dualTranslation: safeDual,
      fontSize: config.get<number>('fontSize', 0),
      fontFamily: config.get<string>('fontFamily', 'editor')
    };
  };

  let isRotationPaused: boolean = false;
  let isRotationPending: boolean = false;
  let lastEditorInteractionTime: number = Date.now();

  const recordEditorInteraction = () => {
    lastEditorInteractionTime = Date.now();
    if (isRotationPending && !isRotationPaused) {
      isRotationPending = false;
      rotateNextVerse(true);
    }
  };

  const updateVerseDisplay = (verse: VerseData) => {
    const settings = getSettings();
    const isBookmarked = bookmarksManager.isBookmarked(verse.bookId, verse.chapter, verse.verse);
    statusBarController.update(verse, settings.displayMode, settings.icon, isBookmarked, isRotationPaused);
  };

  // Initial verse
  const initialSettings = getSettings();
  const dual = initialSettings.dualTranslation !== 'none' ? initialSettings.dualTranslation : undefined;
  let currentVerse = bibleManager.getRandomVerse(initialSettings.topic, initialSettings.translation, dual);
  updateVerseDisplay(currentVerse);

  // Setup Rotation
  const setupRotation = () => {
    if (rotationTimer) {
      clearInterval(rotationTimer);
      rotationTimer = undefined;
    }

    if (isRotationPaused) {
      return;
    }

    const settings = getSettings();
    let ms = 0;
    switch (settings.rotationSchedule) {
      case '5min':
        ms = 5 * 60 * 1000;
        break;
      case '15min':
        ms = 15 * 60 * 1000;
        break;
      case '30min':
        ms = 30 * 60 * 1000;
        break;
      case '60min':
        ms = 60 * 60 * 1000;
        break;
      default:
        ms = 0;
        break;
    }

    if (ms > 0) {
      rotationTimer = setInterval(() => {
        rotateNextVerse(false);
      }, ms);
    }
  };

  const resetRotationTimerIfActive = () => {
    if (!isRotationPaused && rotationTimer) {
      setupRotation();
    }
  };

  const rotateNextVerse = (force: boolean = false) => {
    if (isRotationPaused) {
      return;
    }

    // Do not auto-rotate while the user has the in-editor reader tab open and visible
    if (BibleReaderView.currentPanel && BibleReaderView.currentPanel.isVisible()) {
      return;
    }

    const settings = getSettings();

    // Hover & Reading Protection:
    // In VS Code, when hovering and reading the status bar hover tooltip, the editor is idle.
    // If the editor has been idle for > 3 seconds, postpone rotation so the hover popup is not dismissed.
    // The rotation will apply smoothly the instant the user returns to their code.
    if (!force && settings.preventRotationWhileReading) {
      const editorIdleMs = Date.now() - lastEditorInteractionTime;
      if (editorIdleMs > 3000) {
        isRotationPending = true;
        return;
      }
    }

    isRotationPending = false;
    const dual = settings.dualTranslation !== 'none' ? settings.dualTranslation : undefined;
    currentVerse = statusBarController.getVerse()
      ? bibleManager.getNextCuratedVerse(
          statusBarController.getVerse()!,
          settings.topic,
          settings.translation,
          dual
        )
      : bibleManager.getRandomVerse(settings.topic, settings.translation, dual);
    updateVerseDisplay(currentVerse);
  };

  setupRotation();

  // User interaction triggers to detect when user returns to editor (hover tooltip is guaranteed closed)
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      recordEditorInteraction();
      if (editor && getSettings().rotationSchedule === 'onEditorOpen') {
        rotateNextVerse(true);
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(() => {
      recordEditorInteraction();
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      if (e.contentChanges && e.contentChanges.length > 0) {
        recordEditorInteraction();
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeWindowState(state => {
      if (state.focused) {
        recordEditorInteraction();
      }
    })
  );

  // Rotate on File Save trigger
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(() => {
      recordEditorInteraction();
      if (getSettings().rotateOnFileSave) {
        rotateNextVerse(true);
      }
    })
  );

  // Listen for config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (
        e.affectsConfiguration('dailyBread') ||
        e.affectsConfiguration('editor.fontSize') ||
        e.affectsConfiguration('editor.fontFamily')
      ) {
        setupRotation();
        BibleReaderView.updateCurrent();
        TranslationSwitcherView.updateCurrent();
        toolsProvider.refresh();
        const settings = getSettings();
        if (currentVerse) {
          const dual = settings.dualTranslation !== 'none' ? settings.dualTranslation : undefined;
          const reloaded = bibleManager.getVerse(
            currentVerse.bookId,
            currentVerse.chapter,
            currentVerse.verse,
            settings.translation,
            dual
          );
          if (reloaded) {
            currentVerse = reloaded;
            updateVerseDisplay(currentVerse);
          }
        }
      }
    })
  );

  // Commands Registration

  // 1. Next Verse
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.nextVerse', () => {
      // Manual trigger advances verse immediately even if reading
      isRotationPending = false;
      rotateNextVerse(true);
      resetRotationTimerIfActive();
    })
  );

  // 2. Open In-Editor Reader
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.openReader', () => {
      const v = statusBarController.getVerse() || currentVerse;
      const settings = getSettings();
      BibleReaderView.createOrShow(
        context.extensionUri,
        bibleManager,
        bookmarksManager,
        v.bookId,
        v.chapter,
        v.verse,
        settings.translation
      );
    })
  );

  // 3. Read Chapter
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.readChapter', () => {
      const v = statusBarController.getVerse() || currentVerse;
      const settings = getSettings();
      BibleReaderView.createOrShow(
        context.extensionUri,
        bibleManager,
        bookmarksManager,
        v.bookId,
        v.chapter,
        v.verse,
        settings.translation
      );
    })
  );

  // 4. Open Reader at specific book, chapter, verse
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'dailyBread.openReaderAt',
      (bookId: number, chapter: number, verse?: number, translation?: Translation) => {
        const settings = getSettings();
        BibleReaderView.createOrShow(
          context.extensionUri,
          bibleManager,
          bookmarksManager,
          bookId,
          chapter,
          verse,
          translation || settings.translation
        );
      }
    )
  );

  // 5. Bookmark Current Verse
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.bookmarkCurrent', async () => {
      const v = statusBarController.getVerse() || currentVerse;
      if (!v) return;

      const note = await vscode.window.showInputBox({
        prompt: 'Add an optional personal note/thought for this verse (leave empty to skip):',
        placeHolder: 'e.g. Remember this for tough days at work'
      });

      const tagsInput = await vscode.window.showInputBox({
        prompt: 'Add tags separated by comma (optional):',
        placeHolder: 'e.g. encouragement, coding, hope'
      });

      const tags = tagsInput
        ? tagsInput
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0)
        : undefined;

      await bookmarksManager.addBookmark(v, note, tags);
      updateVerseDisplay(v);
      vscode.window.showInformationMessage(
        `⭐ Bookmarked: ${v.translation === 'zulu' ? v.zuluBookName : v.bookName} ${v.chapter}:${v.verse}`
      );
    })
  );

  // 6. Remove Current Bookmark
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.removeCurrentBookmark', async () => {
      const v = statusBarController.getVerse() || currentVerse;
      if (!v) return;
      const id = `${v.bookId}:${v.chapter}:${v.verse}:${v.translation}`;
      await bookmarksManager.removeBookmark(id);
      updateVerseDisplay(v);
      vscode.window.showInformationMessage(`Bookmark removed.`);
    })
  );

  // 7. Show / Manage Bookmarks QuickPick
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.showBookmarks', async () => {
      const bookmarks = bookmarksManager.getBookmarks();
      if (bookmarks.length === 0) {
        vscode.window.showInformationMessage('You have no saved bookmarks yet.');
        return;
      }

      interface BookmarkQuickPickItem extends vscode.QuickPickItem {
        bookmark: Bookmark;
      }

      const items: BookmarkQuickPickItem[] = bookmarks.map(b => ({
        label: `⭐ ${b.bookName} ${b.chapter}:${b.verse} (${b.translation.toUpperCase()})`,
        description: b.note ? `📝 ${b.note}` : `"${b.text.slice(0, 45)}..."`,
        detail: b.tags && b.tags.length > 0 ? `Tags: ${b.tags.map(t => '#' + t).join(' ')}` : undefined,
        bookmark: b
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a saved bookmark to open in reader'
      });

      if (selected) {
        BibleReaderView.createOrShow(
          context.extensionUri,
          bibleManager,
          bookmarksManager,
          selected.bookmark.bookId,
          selected.bookmark.chapter,
          selected.bookmark.verse,
          selected.bookmark.translation
        );
      }
    })
  );

  // 8. Select Topic / Mood
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.selectTopic', async () => {
      const topics = bibleManager.getCuratedTopics();
      const currentConfig = getSettings();

      const items = [
        {
          label: '$(sparkle) All Scripture / Any Topic',
          description: 'Cycle across all curated themes',
          topicId: 'all'
        },
        ...Object.values(topics).map(t => ({
          label: `$(tag) ${t.name} (${t.zuluName})`,
          description: `${t.verses.length} verses — ${t.description}`,
          topicId: t.id
        }))
      ];

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select Scripture Topic / Mood for Status Bar Rotation'
      });

      if (selected) {
        await vscode.workspace.getConfiguration('dailyBread').update('topic', selected.topicId, vscode.ConfigurationTarget.Global);
        rotateNextVerse(true);
        vscode.window.showInformationMessage(`Daily Bible topic set to: ${selected.label}`);
      }
    })
  );

  // 9. Switch Translation (In-Editor Searchable Library & Downloader)
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.switchTranslation', (mode?: 'primary' | 'parallel') => {
      const targetMode = mode === 'parallel' ? 'parallel' : 'primary';
      TranslationSwitcherView.createOrShow(
        bibleManager,
        {
          onTranslationActivated: () => {
            const settings = getSettings();
            const dual = settings.dualTranslation !== 'none' ? settings.dualTranslation : undefined;
            const current = statusBarController.getVerse() || currentVerse;
            const reloaded = bibleManager.getVerse(
              current.bookId,
              current.chapter,
              current.verse,
              settings.translation,
              dual
            );
            if (reloaded) {
              currentVerse = reloaded;
              updateVerseDisplay(currentVerse);
            }
            BibleReaderView.updateCurrent();
          }
        },
        targetMode
      );
    })
  );

  // 10. Search and Jump to Verse
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.jumpTo', async () => {
      const input = await vscode.window.showInputBox({
        prompt: 'Enter book & chapter/verse in English or isiZulu',
        placeHolder: 'e.g. Joh 3:16, AmaHubo 23:1, Phil 4:13, Mathewu 6:33, Gen 1:1'
      });

      if (!input) return;

      const parsed = bibleManager.parseReference(input);
      if (!parsed) {
        vscode.window.showErrorMessage(`Could not find reference: "${input}". Try format like "Joh 3:16" or "Hubo 23:1".`);
        return;
      }

      const settings = getSettings();
      const targetVerse = parsed.verse || 1;
      const vData = bibleManager.getVerse(
        parsed.book.id,
        parsed.chapter,
        targetVerse,
        settings.translation
      );

      if (vData) {
        currentVerse = vData;
        updateVerseDisplay(currentVerse);
        resetRotationTimerIfActive();
      }

      // Open in Reader
      BibleReaderView.createOrShow(
        context.extensionUri,
        bibleManager,
        bookmarksManager,
        parsed.book.id,
        parsed.chapter,
        parsed.verse,
        settings.translation
      );
    })
  );

  // 10b. Jump directly to reference from link
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.jumpToRef', (ref: string) => {
      if (!ref) return;
      const parsed = bibleManager.parseReference(ref);
      if (!parsed) {
        vscode.window.showWarningMessage(`Could not resolve cross-reference: ${ref}`);
        return;
      }
      const settings = getSettings();
      const targetVerse = parsed.verse || 1;
      const vData = bibleManager.getVerse(parsed.book.id, parsed.chapter, targetVerse, settings.translation);
      if (vData) {
        currentVerse = vData;
        updateVerseDisplay(currentVerse);
        resetRotationTimerIfActive();
      }
      BibleReaderView.createOrShow(
        context.extensionUri,
        bibleManager,
        bookmarksManager,
        parsed.book.id,
        parsed.chapter,
        parsed.verse,
        settings.translation
      );
    })
  );

  // 10c. Show Cross References QuickPick
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.showCrossReferences', async () => {
      const v = statusBarController.getVerse() || currentVerse;
      if (!v) return;

      const settings = getSettings();
      const resolved = bibleManager.resolveCrossReferences(v.bookId, v.chapter, v.verse, settings.translation, 20);
      if (resolved.length === 0) {
        vscode.window.showInformationMessage(`No cross references indexed for ${v.bookName} ${v.chapter}:${v.verse}`);
        return;
      }

      interface CrossRefPickItem extends vscode.QuickPickItem {
        refString: string;
      }

      const items: CrossRefPickItem[] = resolved.map(cr => {
        const crBook = settings.translation === 'zulu' ? cr.zuluBookName : cr.bookName;
        const rangeStr = cr.endVerse ? `-${cr.endVerse}` : '';
        return {
          label: `🔗 ${crBook} ${cr.chapter}:${cr.verse}${rangeStr}`,
          description: cr.anchor ? `Phrase: "${cr.anchor}"` : undefined,
          detail: `"${cr.text}"`,
          refString: cr.ref
        };
      });

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `Cross References with Scriptures for ${v.bookName} ${v.chapter}:${v.verse} (${items.length} passages)`
      });

      if (selected) {
        vscode.commands.executeCommand('dailyBread.jumpToRef', selected.refString);
      }
    })
  );

  // 11. Random Chapter
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.randomChapter', () => {
      const books = bibleManager.getBooks();
      const randBook = books[Math.floor(Math.random() * books.length)];
      const randChapter = Math.floor(Math.random() * randBook.chapters) + 1;
      const settings = getSettings();

      BibleReaderView.createOrShow(
        context.extensionUri,
        bibleManager,
        bookmarksManager,
        randBook.id,
        randChapter,
        1,
        settings.translation
      );
    })
  );

  // 12. Copy Current Verse
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.copyVerse', async () => {
      const v = statusBarController.getVerse() || currentVerse;
      if (!v) return;
      const bTitle = v.translation === 'zulu' ? v.zuluBookName : v.bookName;
      const textToCopy = `"${v.text}" — ${bTitle} ${v.chapter}:${v.verse} (${v.translation.toUpperCase()})`;
      await vscode.env.clipboard.writeText(textToCopy);
      vscode.window.showInformationMessage(`Copied: ${bTitle} ${v.chapter}:${v.verse}`);
    })
  );

  // 13. Export Bookmarks & Full Backup
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.exportBookmarks', async () => {
      const choice = await vscode.window.showQuickPick(
        [
          {
            label: '$(archive) Full Backup (.json)',
            description: '✅ Re-importable — Bookmarks, notes, tags, settings & offline translations',
            detail: 'Best for moving to another computer or restoring everything later',
            format: 'backup' as const,
            reimportable: true
          },
          {
            label: '$(json) Bookmarks Only (.json)',
            description: '✅ Re-importable — Saved bookmarks, notes & tags',
            detail: 'Portable JSON list of your saved verses',
            format: 'json' as const,
            reimportable: true
          },
          {
            label: '$(markdown) Markdown Study Document (.md)',
            description: '✅ Re-importable — Formatted study doc (Obsidian / VS Code / Notion)',
            detail: 'Readable Markdown with verses, notes & tags that can also be imported back',
            format: 'md' as const,
            reimportable: true
          },
          {
            label: '$(file-text) Plain Text (.txt)',
            description: '⚠️ Export-only (cannot be imported back)',
            detail: 'Clean plain text for printing, emails, or Word/Notepad',
            format: 'txt' as const,
            reimportable: false
          },
          {
            label: '$(table) CSV Spreadsheet (.csv)',
            description: '⚠️ Export-only (cannot be imported back)',
            detail: 'Spreadsheet table for Excel, Google Sheets, or LibreOffice Calc',
            format: 'csv' as const,
            reimportable: false
          },
          {
            label: '$(globe) Styled HTML Study Sheet (.html)',
            description: '⚠️ Export-only (cannot be imported back)',
            detail: 'Formatted webpage ready to open in a browser or print to PDF',
            format: 'html' as const,
            reimportable: false
          }
        ],
        { placeHolder: 'Choose export format (JSON & Markdown can be imported back; TXT/CSV/HTML are export-only)' }
      );

      if (!choice) return;

      const dateTag = new Date().toISOString().slice(0, 10);
      let content = '';
      let defaultName = '';
      let filters: Record<string, string[]> = {};

      if (choice.format === 'backup') {
        const installedIds = bibleManager.getInstalledTranslations().map(t => t.id);
        content = bookmarksManager.exportFullBackup(getSettings(), installedIds, notesManager.getNotes());
        defaultName = `daily-bible-backup-${dateTag}.json`;
        filters = { 'Daily Bible Backup (JSON)': ['json'] };
      } else if (choice.format === 'md') {
        content = bookmarksManager.exportBookmarksMarkdown();
        defaultName = `daily-bible-bookmarks-${dateTag}.md`;
        filters = { 'Markdown Document': ['md'] };
      } else if (choice.format === 'txt') {
        content = bookmarksManager.exportBookmarksText();
        defaultName = `daily-bible-bookmarks-${dateTag}.txt`;
        filters = { 'Plain Text': ['txt'] };
      } else if (choice.format === 'csv') {
        content = bookmarksManager.exportBookmarksCsv();
        defaultName = `daily-bible-bookmarks-${dateTag}.csv`;
        filters = { 'CSV Spreadsheet': ['csv'] };
      } else if (choice.format === 'html') {
        content = bookmarksManager.exportBookmarksHtml();
        defaultName = `daily-bible-bookmarks-${dateTag}.html`;
        filters = { 'HTML Document': ['html'] };
      } else {
        content = bookmarksManager.exportBookmarksJson();
        defaultName = `daily-bible-bookmarks-${dateTag}.json`;
        filters = { 'JSON File': ['json'] };
      }

      const defaultFolder =
        vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
          ? vscode.workspace.workspaceFolders[0].uri.fsPath
          : os.homedir();

      const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(path.join(defaultFolder, defaultName)),
        filters,
        saveLabel: 'Export'
      });

      if (saveUri) {
        await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content, 'utf8'));
        const note = choice.reimportable
          ? ''
          : ' (Export-only format — cannot be imported back. Use .json or .md for backups.)';
        const action = await vscode.window.showInformationMessage(
          `✅ Exported to ${path.basename(saveUri.fsPath)}${note}`,
          'Open File'
        );
        if (action === 'Open File') {
          const doc = await vscode.workspace.openTextDocument(saveUri);
          await vscode.window.showTextDocument(doc);
        }
      }
    })
  );

  // 13b. Import Bookmarks & Restore Backup
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.importBookmarks', async () => {
      const defaultFolder =
        vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
          ? vscode.workspace.workspaceFolders[0].uri.fsPath
          : os.homedir();

      const picked = await vscode.window.showOpenDialog({
        defaultUri: vscode.Uri.file(defaultFolder),
        canSelectMany: false,
        openLabel: 'Import / Restore',
        filters: {
          'Daily Bible Backups & Exports': ['json', 'md']
        }
      });

      if (!picked || picked.length === 0) return;

      const fileUri = picked[0];
      const rawBytes = await vscode.workspace.fs.readFile(fileUri);
      const rawText = Buffer.from(rawBytes).toString('utf8');
      const ext = path.extname(fileUri.fsPath).toLowerCase();

      if (ext === '.md') {
        const count = await bookmarksManager.importBookmarksMarkdown(rawText, name =>
          bibleManager.findBook(name)
        );
        if (currentVerse) updateVerseDisplay(currentVerse);
        vscode.window.showInformationMessage(
          count > 0
            ? `✅ Imported ${count} bookmark(s) from Markdown.`
            : 'No new bookmarks found in Markdown file (duplicates skipped).'
        );
        return;
      }

      const result = await bookmarksManager.importBackup(rawText);

      // Restore settings if present in Full Backup
      let settingsRestored = false;
      if (result.settings && Object.keys(result.settings).length > 0) {
        const applySettings = await vscode.window.showQuickPick(
          [
            {
              label: '$(check) Restore Settings & Preferences Too',
              description: 'Apply saved translation, font size, rotation schedule, and display mode',
              restore: true
            },
            {
              label: '$(bookmark) Import Bookmarks Only',
              description: 'Keep my current settings untouched',
              restore: false
            }
          ],
          { placeHolder: `Backup contains ${result.bookmarksImported} new bookmark(s) and extension settings` }
        );

        if (applySettings?.restore) {
          const config = vscode.workspace.getConfiguration('dailyBread');
          const keysToRestore: Array<keyof ExtensionSettings> = [
            'translation',
            'dualTranslation',
            'displayMode',
            'icon',
            'rotationSchedule',
            'rotateOnFileSave',
            'preventRotationWhileReading',
            'topic',
            'fontSize',
            'fontFamily'
          ];
          for (const key of keysToRestore) {
            if (result.settings[key] !== undefined) {
              await config.update(key, result.settings[key], vscode.ConfigurationTarget.Global);
            }
          }
          settingsRestored = true;
        }
      }

      // Check if backup references translations not yet downloaded locally
      if (result.installedTranslations && result.installedTranslations.length > 0) {
        const missing = result.installedTranslations.filter(
          id => bibleManager.getTranslationInfo(id) && !bibleManager.isTranslationInstalled(id)
        );
        if (missing.length > 0) {
          const dlChoice = await vscode.window.showInformationMessage(
            `This backup used ${missing.length} additional offline translation(s): ${missing.join(', ')}. Download them now?`,
            'Download Missing Translations',
            'Skip'
          );
          if (dlChoice === 'Download Missing Translations') {
            await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: 'Restoring offline Bible translations from backup...',
                cancellable: false
              },
              async progress => {
                for (const id of missing) {
                  progress.report({ message: id });
                  try {
                    await bibleManager.downloadTranslation(id);
                  } catch {
                    // Continue remaining packs even if one fails
                  }
                }
              }
            );
          }
        }
      }

      let notesImported = 0;
      if (result.notes && result.notes.length > 0) {
        notesImported = await notesManager.importNotes(result.notes);
      }

      if (currentVerse) updateVerseDisplay(currentVerse);
      BibleReaderView.updateCurrent();
      TranslationSwitcherView.updateCurrent();

      const noteMsg = notesImported > 0 ? `, ${notesImported} study note(s)` : '';
      vscode.window.showInformationMessage(
        `✅ Import complete: ${result.bookmarksImported} new bookmark(s)${noteMsg} added${settingsRestored ? ' and preferences restored' : ''}.`
      );
    })
  );

  // 14. Delete single bookmark from TreeItem
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.deleteBookmarkItem', async (item: BookmarkTreeItem) => {
      if (item && item.bookmark) {
        await bookmarksManager.removeBookmark(item.bookmark.id);
        vscode.window.showInformationMessage(`Bookmark removed.`);
      }
    })
  );

  // 14b. Study Notes Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.addNote', (verseData?: VerseData) => {
      const v = verseData || statusBarController.getVerse() || currentVerse;
      const existing = v ? notesManager.getNotesForVerse(v.bookId, v.chapter, v.verse)[0] : undefined;
      StudyNoteView.createOrShow(notesManager, { note: existing, verseData: v });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.newNote', () => {
      StudyNoteView.createOrShow(notesManager, {});
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.openNote', (note: StudyNote) => {
      if (note) {
        StudyNoteView.createOrShow(notesManager, { note });
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.deleteNoteItem', async (item: NoteTreeItem) => {
      if (item && item.note) {
        await notesManager.deleteNote(item.note.id);
        vscode.window.showInformationMessage('Study note deleted.');
      }
    })
  );

  // 15. Status Bar Click Menu (Rich QuickPick)
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.menu', async () => {
      const v = statusBarController.getVerse() || currentVerse;
      const isBookmarked = bookmarksManager.isBookmarked(v.bookId, v.chapter, v.verse);
      const bTitle = v.translation === 'zulu' ? v.zuluBookName : v.bookName;

      const items: vscode.QuickPickItem[] = [
        { label: 'Scripture & Reading', kind: vscode.QuickPickItemKind.Separator },
        {
          label: '$(sync) Next Verse',
          description: 'Ctrl+Alt+B / Cmd+Alt+B',
          detail: 'Fetch next uplifting scripture into status bar'
        },
        {
          label: '$(book) Read Full Chapter in Editor',
          description: `${bTitle} Chapter ${v.chapter}`,
          detail: 'Open clean in-editor Bible tab with side-by-side translation option'
        },
        {
          label: '$(search) Search & Jump to Verse',
          description: 'Type any reference (e.g. Joh 3:16, Hubo 23:1)',
          detail: 'Instantly jump to any chapter and verse in the Bible'
        },
        {
          label: '$(globe) Switch / Download Translations',
          description: `Current: ${getSettings().translation.toUpperCase()}`,
          detail: 'Search, switch, or download 60+ offline Bible translations & languages'
        },
        {
          label: isBookmarked ? '$(star-full) Remove Bookmark' : '$(star-empty) Bookmark Current Verse',
          description: `${bTitle} ${v.chapter}:${v.verse}`,
          detail: isBookmarked ? 'Remove from saved favorites' : 'Save verse with optional notes and tags'
        },
        {
          label: '$(edit) Add / Edit Study Note',
          description: `${bTitle} ${v.chapter}:${v.verse} (${notesManager.getNotes().length} saved notes)`,
          detail: 'Open in-editor note writer for reflections, sermon outlines, or study notes'
        },
        {
          label: '$(link) View Verse Cross-References',
          description: `Treasury of Scripture Knowledge`,
          detail: 'Explore connected passages and related scriptures for this verse'
        },

        { label: 'Browse & Share', kind: vscode.QuickPickItemKind.Separator },
        {
          label: '$(bookmark) View All Bookmarks',
          description: `${bookmarksManager.getBookmarks().length} saved verses`,
          detail: 'Browse, filter, and jump to your saved favorites'
        },
        {
          label: '$(tag) Select Topic / Mood',
          description: `Current: ${getSettings().topic}`,
          detail: 'Filter status bar by Peace, Focus, Strength, Joy, Gratitude, or Comfort'
        },
        {
          label: '$(dice) Random Chapter',
          description: 'Explore scripture unpredictably',
          detail: 'Pick a random chapter from Genesis to Revelation'
        },
        {
          label: '$(clippy) Copy Verse to Clipboard',
          description: `${bTitle} ${v.chapter}:${v.verse}`,
          detail: 'Copy reference and scripture text formatted for sharing'
        },

        { label: 'Reading Mode & Display', kind: vscode.QuickPickItemKind.Separator },
        {
          label: isRotationPaused ? '$(play) Resume Auto-Rotation' : '$(debug-pause) Pause Auto-Rotation (Reading Mode)',
          description: isRotationPaused ? 'Auto-rotation currently paused' : `Schedule: ${getSettings().rotationSchedule}`,
          detail: isRotationPaused
            ? 'Resume automatic scripture cycling'
            : 'Freeze verse so it never changes while you are reading'
        },
        {
          label: '$(clock) Change Rotation Schedule',
          description: `Current: ${getSettings().rotationSchedule}`,
          detail: 'Adjust how often verses change (5min, 15min, 30min, 60min, onEditorOpen, or Manual)'
        },
        {
          label: '$(text-size) Change Font Size',
          description: getSettings().fontSize === 0 ? `Auto / Match Editor (${vscode.workspace.getConfiguration('editor').get<number>('fontSize', 14)}px)` : `${getSettings().fontSize}px`,
          detail: 'Adjust scripture text size or sync automatically with VS Code editor font'
        },
        {
          label: '$(symbol-text) Change Font Family',
          description: `Current: ${getSettings().fontFamily}`,
          detail: 'Switch between Editor font, Book Serif, Clean Sans-Serif, or Monospace'
        },

        { label: 'Backup & Settings', kind: vscode.QuickPickItemKind.Separator },
        {
          label: '$(export) Export Bookmarks & Backup',
          description: 'JSON, Markdown, TXT, CSV, or HTML',
          detail: 'Save your bookmarks, notes, tags, and settings to a file'
        },
        {
          label: '$(cloud-upload) Import Bookmarks & Restore Backup',
          description: 'Restore from .json backup or .md export',
          detail: 'Load saved bookmarks, notes, tags, and preferences from a file'
        },
        {
          label: '$(gear) Configure Extension Settings',
          description: 'Icons, Display modes, Rotation intervals',
          detail: 'Open Daily Bible settings in VS Code Preferences'
        }
      ];

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `📖 Daily Bible — ${bTitle} ${v.chapter}:${v.verse}`
      });

      if (!selected) return;

      if (selected.label.includes('Next Verse')) {
        rotateNextVerse(true);
      } else if (selected.label.includes('Auto-Rotation')) {
        vscode.commands.executeCommand('dailyBread.togglePauseRotation');
      } else if (selected.label.includes('Change Rotation Schedule')) {
        vscode.commands.executeCommand('dailyBread.setRotationSchedule');
      } else if (selected.label.includes('Read Full Chapter')) {
        vscode.commands.executeCommand('dailyBread.readChapter');
      } else if (selected.label.includes('View Verse Cross-References')) {
        vscode.commands.executeCommand('dailyBread.showCrossReferences');
      } else if (selected.label.includes('Bookmark Current Verse')) {
        vscode.commands.executeCommand('dailyBread.bookmarkCurrent');
      } else if (selected.label.includes('Remove Bookmark')) {
        vscode.commands.executeCommand('dailyBread.removeCurrentBookmark');
      } else if (selected.label.includes('Add / Edit Study Note')) {
        vscode.commands.executeCommand('dailyBread.addNote');
      } else if (selected.label.includes('View All Bookmarks')) {
        vscode.commands.executeCommand('dailyBread.showBookmarks');
      } else if (selected.label.includes('Select Topic')) {
        vscode.commands.executeCommand('dailyBread.selectTopic');
      } else if (selected.label.includes('Change Font Size')) {
        vscode.commands.executeCommand('dailyBread.changeFontSize');
      } else if (selected.label.includes('Change Font Family')) {
        vscode.commands.executeCommand('dailyBread.changeFontFamily');
      } else if (selected.label.includes('Switch / Download Translations')) {
        vscode.commands.executeCommand('dailyBread.switchTranslation');
      } else if (selected.label.includes('Search & Jump')) {
        vscode.commands.executeCommand('dailyBread.jumpTo');
      } else if (selected.label.includes('Random Chapter')) {
        vscode.commands.executeCommand('dailyBread.randomChapter');
      } else if (selected.label.includes('Copy Verse')) {
        vscode.commands.executeCommand('dailyBread.copyVerse');
      } else if (selected.label.includes('Export Bookmarks')) {
        vscode.commands.executeCommand('dailyBread.exportBookmarks');
      } else if (selected.label.includes('Import Bookmarks')) {
        vscode.commands.executeCommand('dailyBread.importBookmarks');
      } else if (selected.label.includes('Configure Extension Settings')) {
        vscode.commands.executeCommand('workbench.action.openSettings', 'dailyBread');
      }
    })
  );

  // 16. Change Font Size Command
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.changeFontSize', async () => {
      const editorSize = vscode.workspace.getConfiguration('editor').get<number>('fontSize', 14);
      const currentSize = vscode.workspace.getConfiguration('dailyBread').get<number>('fontSize', 0);

      const items = [
        {
          label: `$(sync) Auto — Match Editor Font (${editorSize}px)`,
          description: currentSize === 0 ? 'Currently Active' : 'Automatically syncs with editor.fontSize',
          size: 0
        },
        { label: '$(text-size) Small (12px)', description: currentSize === 12 ? 'Active' : '', size: 12 },
        { label: '$(text-size) Compact (14px)', description: currentSize === 14 ? 'Active' : '', size: 14 },
        { label: '$(text-size) Medium (16px)', description: currentSize === 16 ? 'Active' : '', size: 16 },
        { label: '$(text-size) Large (18px)', description: currentSize === 18 ? 'Active' : '', size: 18 },
        { label: '$(text-size) Extra Large (22px)', description: currentSize === 22 ? 'Active' : '', size: 22 },
        { label: '$(text-size) Huge (26px)', description: currentSize === 26 ? 'Active' : '', size: 26 },
        { label: '$(edit) Custom Size...', description: 'Type an exact pixel size', size: -1 }
      ];

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: `Select scripture font size (Current: ${currentSize === 0 ? `Auto / Match Editor (${editorSize}px)` : `${currentSize}px`})`
      });

      if (!picked) return;

      if (picked.size === -1) {
        const input = await vscode.window.showInputBox({
          prompt: 'Enter scripture font size in pixels (10 - 48, or 0 for Auto / Match Editor)',
          value: currentSize === 0 ? editorSize.toString() : currentSize.toString(),
          validateInput: val => {
            const n = parseInt(val, 10);
            return isNaN(n) || n < 0 || n > 48 ? 'Please enter a number between 10 and 48 (or 0 for Auto)' : null;
          }
        });
        if (input !== undefined) {
          const val = parseInt(input, 10);
          await vscode.workspace.getConfiguration('dailyBread').update('fontSize', val, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage(
            `Daily Bible font size set to ${val === 0 ? `Auto / Match Editor (${editorSize}px)` : `${val}px`}`
          );
        }
      } else {
        await vscode.workspace.getConfiguration('dailyBread').update('fontSize', picked.size, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(
          `Daily Bible font size set to ${picked.size === 0 ? `Auto / Match Editor (${editorSize}px)` : `${picked.size}px`}`
        );
      }
    })
  );

  // 17. Change Font Family Command
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.changeFontFamily', async () => {
      const editorFont = vscode.workspace.getConfiguration('editor').get<string>('fontFamily', 'monospace');
      const currentFamily = vscode.workspace.getConfiguration('dailyBread').get<string>('fontFamily', 'editor');

      const items = [
        {
          label: '$(editor) Match Editor Font',
          description: currentFamily === 'editor' ? 'Currently Active' : editorFont,
          detail: 'Syncs automatically with your active VS Code code editor font',
          family: 'editor'
        },
        {
          label: '$(book) Book Serif',
          description: currentFamily === 'serif' ? 'Currently Active' : 'Georgia, Garamond, Times New Roman, serif',
          detail: 'Classic, warm editorial book typesetting',
          family: 'serif'
        },
        {
          label: '$(symbol-text) Clean Sans-Serif',
          description: currentFamily === 'sans-serif' ? 'Currently Active' : 'Segoe UI, -apple-system, Roboto, sans-serif',
          detail: 'Modern crisp user interface typography',
          family: 'sans-serif'
        },
        {
          label: '$(terminal) Monospace Code Font',
          description: currentFamily === 'monospace' ? 'Currently Active' : 'Consolas, Courier New, monospace',
          detail: 'Fixed-width developer aesthetic',
          family: 'monospace'
        },
        {
          label: '$(device-desktop) System Default',
          description: currentFamily === 'system' ? 'Currently Active' : 'Operating system native font',
          detail: 'Native OS font rendering',
          family: 'system'
        }
      ];

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: `Select Bible reader font family (Current: ${currentFamily})`
      });

      if (!picked) return;

      await vscode.workspace.getConfiguration('dailyBread').update('fontFamily', picked.family, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Daily Bible font family set to: ${picked.label.replace(/\$\([^)]+\)\s*/, '')}`);
    })
  );

  // 18. Toggle Pause Rotation Command (Reading Mode)
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.togglePauseRotation', () => {
      isRotationPaused = !isRotationPaused;
      if (isRotationPaused) {
        if (rotationTimer) {
          clearInterval(rotationTimer);
          rotationTimer = undefined;
        }
        vscode.window.showInformationMessage('⏸ Daily Bible: Auto-rotation paused (Reading Mode active). Verses will not change while you read.');
      } else {
        setupRotation();
        vscode.window.showInformationMessage('▶ Daily Bible: Auto-rotation resumed.');
      }
      if (currentVerse) {
        updateVerseDisplay(currentVerse);
      }
      toolsProvider.refresh();
    })
  );

  // 19. Set Rotation Schedule Command
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.setRotationSchedule', async () => {
      const current = getSettings().rotationSchedule;
      const items = [
        {
          label: '$(clock) Every 15 minutes',
          description: current === '15min' ? 'Currently Active' : '',
          detail: 'Recommended: Balanced rotation frequency',
          value: '15min'
        },
        {
          label: '$(clock) Every 30 minutes',
          description: current === '30min' ? 'Currently Active' : '',
          detail: 'Spacious interval for longer reading',
          value: '30min'
        },
        {
          label: '$(clock) Every 60 minutes',
          description: current === '60min' ? 'Currently Active' : '',
          detail: 'One verse per hour',
          value: '60min'
        },
        {
          label: '$(clock) Every 5 minutes',
          description: current === '5min' ? 'Currently Active' : '',
          detail: 'Frequent rotation',
          value: '5min'
        },
        {
          label: '$(edit) On Editor Open',
          description: current === 'onEditorOpen' ? 'Currently Active' : '',
          detail: 'Rotate whenever you switch or open an editor file',
          value: 'onEditorOpen'
        },
        {
          label: '$(debug-pause) Manual Only (Never change automatically)',
          description: current === 'manual' ? 'Currently Active' : '',
          detail: 'Verses only change when you press Ctrl+Alt+B / Cmd+Alt+B or click Next',
          value: 'manual'
        }
      ];

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: `Select how often the status bar scripture rotates (Current: ${current})`
      });

      if (!picked) return;

      await vscode.workspace.getConfiguration('dailyBread').update('rotationSchedule', picked.value, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Daily Bible rotation schedule set to: ${picked.label.replace(/\$\([^)]+\)\s*/, '')}`);
    })
  );

  context.subscriptions.push(statusBarController);
}

export function deactivate() {
  if (rotationTimer) {
    clearInterval(rotationTimer);
    rotationTimer = undefined;
  }
}

