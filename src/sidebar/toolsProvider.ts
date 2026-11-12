import * as vscode from 'vscode';
import { BibleManager } from '../bibleManager';

export class ToolsProvider implements vscode.TreeDataProvider<ToolTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ToolTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private bibleManager: BibleManager,
    private getPauseState: () => boolean
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ToolTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ToolTreeItem): Thenable<ToolTreeItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    const config = vscode.workspace.getConfiguration('dailyBread');
    const translationId = config.get<string>('translation', 'kjv');
    const transInfo = this.bibleManager.getTranslationInfo(translationId);
    const transDesc = transInfo ? `${transInfo.shortName} (${transInfo.language})` : translationId.toUpperCase();

    const isPaused = this.getPauseState();
    const schedule = config.get<string>('rotationSchedule', '15min');
    const fontSize = config.get<number>('fontSize', 0);
    const editorFontSize = vscode.workspace.getConfiguration('editor').get<number>('fontSize', 14);
    const fontFamily = config.get<string>('fontFamily', 'editor');

    const items: ToolTreeItem[] = [
      new ToolTreeItem(
        'Next Verse',
        'Ctrl+Alt+B',
        'sync',
        'dailyBread.nextVerse',
        'Advance to next scripture in status bar'
      ),
      new ToolTreeItem(
        'Read Current Chapter',
        'In-Editor Reader',
        'book',
        'dailyBread.readChapter',
        'Open current verse & chapter in the Bible Reader tab'
      ),
      new ToolTreeItem(
        'Search & Jump to Verse',
        'e.g. Joh 3:16',
        'search',
        'dailyBread.jumpTo',
        'Jump directly to any book, chapter, or verse'
      ),
      new ToolTreeItem(
        'Switch / Download Translations',
        transDesc,
        'globe',
        'dailyBread.switchTranslation',
        'Search, switch, or download 60+ offline Bible translations'
      ),
      new ToolTreeItem(
        'View Verse Cross-References',
        'TSK',
        'link',
        'dailyBread.showCrossReferences',
        'Explore connected passages for the current verse'
      ),
      new ToolTreeItem(
        'Random Chapter',
        'Genesis – Rev',
        'sparkle',
        'dailyBread.randomChapter',
        'Open a random Bible chapter'
      ),
      new ToolTreeItem(
        isPaused ? 'Resume Auto-Rotation' : 'Pause Auto-Rotation (Reading Mode)',
        isPaused ? 'Paused' : schedule,
        isPaused ? 'play' : 'debug-pause',
        'dailyBread.togglePauseRotation',
        isPaused ? 'Resume automatic verse rotation' : 'Freeze current verse while reading'
      ),
      new ToolTreeItem(
        'Rotation Schedule',
        schedule,
        'clock',
        'dailyBread.setRotationSchedule',
        'Change how often the status bar verse rotates'
      ),
      new ToolTreeItem(
        'Font Size',
        fontSize === 0 ? `Auto (${editorFontSize}px)` : `${fontSize}px`,
        'text-size',
        'dailyBread.changeFontSize',
        'Adjust scripture font size or match VS Code editor'
      ),
      new ToolTreeItem(
        'Font Family',
        fontFamily,
        'symbol-text',
        'dailyBread.changeFontFamily',
        'Switch between Editor font, Book Serif, Sans-Serif, or Monospace'
      ),
      new ToolTreeItem(
        'Export Bookmarks & Backup',
        'JSON / MD / TXT / CSV / HTML',
        'export',
        'dailyBread.exportBookmarks',
        'Export bookmarks, notes, tags, and settings'
      ),
      new ToolTreeItem(
        'Import Bookmarks & Restore Backup',
        'JSON / MD',
        'cloud-upload',
        'dailyBread.importBookmarks',
        'Restore bookmarks, notes, tags, and preferences from a file'
      ),
      new ToolTreeItem(
        'Extension Settings',
        'Preferences',
        'gear',
        'workbench.action.openSettings',
        'Open all Daily Bible settings in VS Code',
        ['dailyBread']
      )
    ];

    return Promise.resolve(items);
  }
}

export class ToolTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    description: string,
    iconId: string,
    commandId: string,
    tooltipText: string,
    commandArgs?: unknown[]
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.tooltip = tooltipText;
    this.iconPath = new vscode.ThemeIcon(iconId);
    this.command = {
      command: commandId,
      title: label,
      arguments: commandArgs
    };
  }
}
