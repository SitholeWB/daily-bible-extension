import * as vscode from 'vscode';
import { NotesManager } from '../notesManager';
import { StudyNote } from '../types';

export class NotesProvider implements vscode.TreeDataProvider<NoteTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<NoteTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private notesManager: NotesManager) {
    this.notesManager.onDidChangeNotes(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: NoteTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: NoteTreeItem): Thenable<NoteTreeItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    const notes = this.notesManager.getNotes();
    if (notes.length === 0) {
      const empty = new NoteTreeItem(
        'No study notes yet — click + to add one',
        vscode.TreeItemCollapsibleState.None
      );
      empty.iconPath = new vscode.ThemeIcon('info');
      empty.command = {
        command: 'dailyBread.addNote',
        title: 'Add Study Note'
      };
      return Promise.resolve([empty]);
    }

    const items = notes.map(note => {
      const refPart =
        note.bookName && note.chapter
          ? `${note.bookName} ${note.chapter}${note.verse ? ':' + note.verse : ''}`
          : '';
      const item = new NoteTreeItem(note.title, vscode.TreeItemCollapsibleState.None, note);
      item.description = refPart || new Date(note.updatedAt).toLocaleDateString();
      item.tooltip = new vscode.MarkdownString(
        `**${note.title}**${refPart ? ` *(${refPart})*` : ''}\n\n${note.content.slice(0, 300)}${note.content.length > 300 ? '...' : ''}`
      );
      item.command = {
        command: 'dailyBread.openNote',
        title: 'Open Study Note',
        arguments: [note]
      };
      return item;
    });

    return Promise.resolve(items);
  }
}

export class NoteTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly note?: StudyNote
  ) {
    super(label, collapsibleState);
    if (note) {
      this.contextValue = 'studyNoteItem';
      this.iconPath = new vscode.ThemeIcon('note');
    }
  }
}
