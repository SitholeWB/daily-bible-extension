import * as vscode from 'vscode';
import { BibleManager } from '../bibleManager';
import { CuratedTopic, VerseRef } from '../types';

export class TopicsProvider implements vscode.TreeDataProvider<TopicTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TopicTreeItem | undefined | null | void> = new vscode.EventEmitter<TopicTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TopicTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private bibleManager: BibleManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TopicTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TopicTreeItem): Thenable<TopicTreeItem[]> {
    const topics = this.bibleManager.getCuratedTopics();

    if (!element) {
      // List all topics
      return Promise.resolve(
        Object.values(topics).map(t => {
          const item = new TopicTreeItem(
            `${t.name} (${t.zuluName})`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'topic',
            t
          );
          item.description = `${t.verses.length} verses`;
          item.tooltip = t.description;
          return item;
        })
      );
    }

    if (element.itemType === 'topic' && element.topic) {
      // List verses under this topic
      const items = element.topic.verses.map(v => {
        const book = this.bibleManager.getBook(v.bookId);
        const label = `${book?.zuluName || ''} / ${book?.name || ''} ${v.chapter}:${v.verse}`;
        const item = new TopicTreeItem(
          label,
          vscode.TreeItemCollapsibleState.None,
          'verse',
          element.topic,
          v
        );
        item.command = {
          command: 'dailyBread.openReaderAt',
          title: 'Read Verse in Chapter',
          arguments: [v.bookId, v.chapter, v.verse]
        };
        return item;
      });
      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  }
}

export class TopicTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: 'topic' | 'verse',
    public readonly topic?: CuratedTopic,
    public readonly verse?: VerseRef
  ) {
    super(label, collapsibleState);
    this.contextValue = itemType;

    if (itemType === 'topic') {
      this.iconPath = new vscode.ThemeIcon('tag');
    } else {
      this.iconPath = new vscode.ThemeIcon('quote');
    }
  }
}

