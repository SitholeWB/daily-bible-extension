import * as vscode from 'vscode';
import { BibleManager } from '../bibleManager';
import { BookMetadata } from '../types';

export class BibleExplorerProvider implements vscode.TreeDataProvider<BibleTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<BibleTreeItem | undefined | null | void> = new vscode.EventEmitter<BibleTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<BibleTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private bibleManager: BibleManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: BibleTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: BibleTreeItem): Thenable<BibleTreeItem[]> {
    if (!element) {
      // Root level: Testaments
      return Promise.resolve([
        new BibleTreeItem('Old Testament (Isivumelwano Esidala)', 'OT', vscode.TreeItemCollapsibleState.Expanded, 'testament'),
        new BibleTreeItem('New Testament (Isivumelwano Esisha)', 'NT', vscode.TreeItemCollapsibleState.Expanded, 'testament')
      ]);
    }

    if (element.itemType === 'testament') {
      const books = this.bibleManager.getBooks().filter(b => b.testament === element.contextValue);
      return Promise.resolve(
        books.map(b => new BibleTreeItem(
          `${b.name} (${b.zuluName})`,
          b.id.toString(),
          vscode.TreeItemCollapsibleState.Collapsed,
          'book',
          b
        ))
      );
    }

    if (element.itemType === 'book' && element.book) {
      const chapters: BibleTreeItem[] = [];
      for (let ch = 1; ch <= element.book.chapters; ch++) {
        const item = new BibleTreeItem(
          `Chapter ${ch}`,
          `${element.book.id}:${ch}`,
          vscode.TreeItemCollapsibleState.None,
          'chapter',
          element.book,
          ch
        );
        item.command = {
          command: 'dailyBread.openReaderAt',
          title: 'Read Chapter',
          arguments: [element.book.id, ch]
        };
        chapters.push(item);
      }
      return Promise.resolve(chapters);
    }

    return Promise.resolve([]);
  }
}

export class BibleTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly idValue: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: 'testament' | 'book' | 'chapter',
    public readonly book?: BookMetadata,
    public readonly chapter?: number
  ) {
    super(label, collapsibleState);
    this.contextValue = itemType;

    if (itemType === 'testament') {
      this.iconPath = new vscode.ThemeIcon('library');
    } else if (itemType === 'book') {
      this.iconPath = new vscode.ThemeIcon('book');
      this.description = `${book?.chapters} ch`;
    } else if (itemType === 'chapter') {
      this.iconPath = new vscode.ThemeIcon('file-text');
    }
  }
}

