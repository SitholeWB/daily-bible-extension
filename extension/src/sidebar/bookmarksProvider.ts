import * as vscode from 'vscode';
import { BookmarksManager } from '../bookmarks';
import { Bookmark } from '../types';

export class BookmarksProvider implements vscode.TreeDataProvider<BookmarkTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<BookmarkTreeItem | undefined | null | void> = new vscode.EventEmitter<BookmarkTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<BookmarkTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private bookmarksManager: BookmarksManager) {
    this.bookmarksManager.onDidChangeBookmarks(() => {
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: BookmarkTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: BookmarkTreeItem): Thenable<BookmarkTreeItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    const bookmarks = this.bookmarksManager.getBookmarks();
    if (bookmarks.length === 0) {
      const empty = new BookmarkTreeItem(
        'No bookmarks saved yet',
        vscode.TreeItemCollapsibleState.None,
        undefined
      );
      empty.description = 'Click ⭐ on status bar or reader';
      return Promise.resolve([empty]);
    }

    return Promise.resolve(
      bookmarks.map(b => {
        const item = new BookmarkTreeItem(
          `${b.bookName} ${b.chapter}:${b.verse}`,
          vscode.TreeItemCollapsibleState.None,
          b
        );
        item.description = b.note ? `📝 ${b.note}` : `"${b.text.slice(0, 30)}..."`;
        item.tooltip = new vscode.MarkdownString(`**${b.bookName} ${b.chapter}:${b.verse}** (${b.translation.toUpperCase()})\n\n> "${b.text}"\n\n${b.note ? '📝 Note: ' + b.note : ''}`);
        item.command = {
          command: 'dailyBread.openReaderAt',
          title: 'Open Verse in Reader',
          arguments: [b.bookId, b.chapter, b.verse, b.translation]
        };
        return item;
      })
    );
  }
}

export class BookmarkTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly bookmark?: Bookmark
  ) {
    super(label, collapsibleState);
    if (bookmark) {
      this.contextValue = 'bookmarkItem';
      this.iconPath = new vscode.ThemeIcon('star-full', new vscode.ThemeColor('charts.yellow'));
    } else {
      this.contextValue = 'emptyBookmark';
      this.iconPath = new vscode.ThemeIcon('info');
    }
  }
}

