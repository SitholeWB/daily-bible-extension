import * as vscode from 'vscode';
import { BibleManager } from './bibleManager';
import { BookmarksManager } from './bookmarks';
import { BibleReaderView } from './readerView';
import { StatusBarController } from './statusBar';
import { BibleExplorerProvider } from './sidebar/bibleExplorerProvider';
import { BookmarksProvider, BookmarkTreeItem } from './sidebar/bookmarksProvider';
import { TopicsProvider } from './sidebar/topicsProvider';
import { Bookmark, ExtensionSettings, RotationSchedule, StatusDisplayMode, StatusIconType, Translation, VerseData } from './types';

let bibleManager: BibleManager;
let bookmarksManager: BookmarksManager;
let statusBarController: StatusBarController;
let rotationTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
  bibleManager = new BibleManager(context.extensionPath);
  bookmarksManager = new BookmarksManager(context);
  statusBarController = new StatusBarController();

  // Register Tree Views
  const explorerProvider = new BibleExplorerProvider(bibleManager);
  vscode.window.registerTreeDataProvider('dailyBreadExplorer', explorerProvider);

  const bookmarksProvider = new BookmarksProvider(bookmarksManager);
  vscode.window.registerTreeDataProvider('dailyBreadBookmarks', bookmarksProvider);

  const topicsProvider = new TopicsProvider(bibleManager);
  vscode.window.registerTreeDataProvider('dailyBreadTopics', topicsProvider);

  // Settings
  const getSettings = (): ExtensionSettings => {
    const config = vscode.workspace.getConfiguration('dailyBread');
    return {
      translation: config.get<Translation>('translation', 'kjv'),
      displayMode: config.get<StatusDisplayMode>('displayMode', 'preview'),
      icon: config.get<StatusIconType>('icon', 'cross'),
      rotationSchedule: config.get<RotationSchedule>('rotationSchedule', '15min'),
      rotateOnFileSave: config.get<boolean>('rotateOnFileSave', false),
      topic: config.get<string>('topic', 'all'),
      dualTranslation: config.get<Translation | 'none'>('dualTranslation', 'none')
    };
  };

  const updateVerseDisplay = (verse: VerseData) => {
    const settings = getSettings();
    const isBookmarked = bookmarksManager.isBookmarked(verse.bookId, verse.chapter, verse.verse);
    statusBarController.update(verse, settings.displayMode, settings.icon, isBookmarked);
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
        rotateNextVerse();
      }, ms);
    }
  };

  const rotateNextVerse = () => {
    const settings = getSettings();
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

  // On Editor Open trigger
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && getSettings().rotationSchedule === 'onEditorOpen') {
        rotateNextVerse();
      }
    })
  );

  // Rotate on File Save trigger
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(() => {
      if (getSettings().rotateOnFileSave) {
        rotateNextVerse();
      }
    })
  );

  // Listen for config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('dailyBread')) {
        setupRotation();
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
      rotateNextVerse();
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
        rotateNextVerse();
        vscode.window.showInformationMessage(`Daily Bible topic set to: ${selected.label}`);
      }
    })
  );

  // 9. Switch Translation
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.switchTranslation', async () => {
      const items = [
        {
          label: '📜 English — King James Bible / Version (KJB / KJV)',
          description: 'Classic, majestic, traditional poetic English (1611/1769) [Default]',
          translation: 'kjv' as Translation
        },
        {
          label: '🇬🇧 English — World English Bible (WEB)',
          description: 'Clean, modern, highly readable English public domain Bible',
          translation: 'web' as Translation
        },
        {
          label: '🇿🇦 isiZulu — IBhayibheli Elingcwele (1959)',
          description: 'South African Zulu 1959 Translation with authentic Zulu book names',
          translation: 'zulu' as Translation
        }
      ];

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Choose Bible Translation'
      });

      if (selected) {
        await vscode.workspace.getConfiguration('dailyBread').update('translation', selected.translation, vscode.ConfigurationTarget.Global);
        const settings = getSettings();
        const dual = settings.dualTranslation !== 'none' ? settings.dualTranslation : undefined;
        const current = statusBarController.getVerse() || currentVerse;
        const reloaded = bibleManager.getVerse(current.bookId, current.chapter, current.verse, selected.translation, dual);
        if (reloaded) {
          currentVerse = reloaded;
          updateVerseDisplay(currentVerse);
        }
        vscode.window.showInformationMessage(`Active translation: ${selected.label}`);
      }
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

  // 13. Export Bookmarks
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.exportBookmarks', async () => {
      const format = await vscode.window.showQuickPick(
        [
          { label: 'Markdown Document (.md)', format: 'md' },
          { label: 'JSON Dataset (.json)', format: 'json' }
        ],
        { placeHolder: 'Choose Export Format' }
      );

      if (!format) return;

      const content =
        format.format === 'md'
          ? bookmarksManager.exportBookmarksMarkdown()
          : bookmarksManager.exportBookmarksJson();

      const doc = await vscode.workspace.openTextDocument({
        content,
        language: format.format === 'md' ? 'markdown' : 'json'
      });
      await vscode.window.showTextDocument(doc);
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

  // 15. Status Bar Click Menu (Rich QuickPick)
  context.subscriptions.push(
    vscode.commands.registerCommand('dailyBread.menu', async () => {
      const v = statusBarController.getVerse() || currentVerse;
      const isBookmarked = bookmarksManager.isBookmarked(v.bookId, v.chapter, v.verse);
      const bTitle = v.translation === 'zulu' ? v.zuluBookName : v.bookName;

      const items: vscode.QuickPickItem[] = [
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
          label: '$(link) View Verse Cross-References',
          description: `Treasury of Scripture Knowledge`,
          detail: 'Explore connected passages and related scriptures for this verse'
        },
        {
          label: isBookmarked ? '$(star-full) Remove Bookmark' : '$(star-empty) Bookmark Current Verse',
          description: `${bTitle} ${v.chapter}:${v.verse}`,
          detail: isBookmarked ? 'Remove from saved favorites' : 'Save verse with optional notes and tags'
        },
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
          label: '$(globe) Switch Translation',
          description: `Current: ${getSettings().translation.toUpperCase()}`,
          detail: 'Toggle between isiZulu 1959, English WEB, and English KJV'
        },
        {
          label: '$(search) Search & Jump to Verse',
          description: 'Type any reference (e.g. Joh 3:16, Hubo 23:1)',
          detail: 'Instantly jump to any chapter and verse in the Bible'
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
        rotateNextVerse();
      } else if (selected.label.includes('Read Full Chapter')) {
        vscode.commands.executeCommand('dailyBread.readChapter');
      } else if (selected.label.includes('View Verse Cross-References')) {
        vscode.commands.executeCommand('dailyBread.showCrossReferences');
      } else if (selected.label.includes('Bookmark Current Verse')) {
        vscode.commands.executeCommand('dailyBread.bookmarkCurrent');
      } else if (selected.label.includes('Remove Bookmark')) {
        vscode.commands.executeCommand('dailyBread.removeCurrentBookmark');
      } else if (selected.label.includes('View All Bookmarks')) {
        vscode.commands.executeCommand('dailyBread.showBookmarks');
      } else if (selected.label.includes('Select Topic')) {
        vscode.commands.executeCommand('dailyBread.selectTopic');
      } else if (selected.label.includes('Switch Translation')) {
        vscode.commands.executeCommand('dailyBread.switchTranslation');
      } else if (selected.label.includes('Search & Jump')) {
        vscode.commands.executeCommand('dailyBread.jumpTo');
      } else if (selected.label.includes('Random Chapter')) {
        vscode.commands.executeCommand('dailyBread.randomChapter');
      } else if (selected.label.includes('Copy Verse')) {
        vscode.commands.executeCommand('dailyBread.copyVerse');
      } else if (selected.label.includes('Configure Extension Settings')) {
        vscode.commands.executeCommand('workbench.action.openSettings', 'dailyBread');
      }
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

