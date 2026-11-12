import * as vscode from 'vscode';
import { StudyNote, VerseData } from './types';

export class NotesManager {
  private static readonly STORAGE_KEY = 'dailyBread.studyNotes';
  private context: vscode.ExtensionContext;
  private onDidChangeEmitter = new vscode.EventEmitter<void>();
  public readonly onDidChangeNotes = this.onDidChangeEmitter.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public getNotes(): StudyNote[] {
    const data = this.context.globalState.get<StudyNote[]>(NotesManager.STORAGE_KEY, []);
    return [...data].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getNote(id: string): StudyNote | undefined {
    return this.getNotes().find(n => n.id === id);
  }

  public getNotesForVerse(bookId: number, chapter: number, verse?: number): StudyNote[] {
    return this.getNotes().filter(n => {
      if (n.bookId !== bookId || n.chapter !== chapter) return false;
      if (verse !== undefined && n.verse !== verse) return false;
      return true;
    });
  }

  public async saveNote(input: {
    id?: string;
    title: string;
    content: string;
    tags?: string[];
    verseData?: VerseData;
    bookId?: number;
    bookName?: string;
    chapter?: number;
    verse?: number;
    translation?: string;
    verseText?: string;
  }): Promise<StudyNote> {
    const list = this.getNotes();
    const now = Date.now();
    const existing = input.id ? list.find(n => n.id === input.id) : undefined;

    const v = input.verseData;
    const bookName = v
      ? v.translation === 'zulu'
        ? v.zuluBookName
        : v.bookName
      : input.bookName;

    const note: StudyNote = {
      id: existing ? existing.id : input.id || `note_${now}_${Math.random().toString(36).slice(2, 7)}`,
      bookId: v ? v.bookId : input.bookId ?? existing?.bookId,
      bookName: bookName ?? existing?.bookName,
      chapter: v ? v.chapter : input.chapter ?? existing?.chapter,
      verse: v ? v.verse : input.verse ?? existing?.verse,
      translation: v ? v.translation : input.translation ?? existing?.translation,
      verseText: v ? v.text : input.verseText ?? existing?.verseText,
      title: input.title.trim() || 'Untitled Study Note',
      content: input.content,
      tags: input.tags && input.tags.length > 0 ? input.tags : undefined,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };

    const filtered = list.filter(n => n.id !== note.id);
    filtered.unshift(note);
    await this.context.globalState.update(NotesManager.STORAGE_KEY, filtered);
    this.onDidChangeEmitter.fire();
    return note;
  }

  public async deleteNote(id: string): Promise<void> {
    const filtered = this.getNotes().filter(n => n.id !== id);
    await this.context.globalState.update(NotesManager.STORAGE_KEY, filtered);
    this.onDidChangeEmitter.fire();
  }

  public async importNotes(notes: StudyNote[]): Promise<number> {
    if (!Array.isArray(notes) || notes.length === 0) return 0;
    const current = this.getNotes();
    const existingIds = new Set(current.map(n => n.id));
    let count = 0;

    for (const n of notes) {
      if (n && typeof n.content === 'string') {
        const id = n.id || `note_${n.createdAt || Date.now()}_${count}`;
        if (!existingIds.has(id)) {
          current.push({
            ...n,
            id,
            title: n.title || 'Imported Study Note',
            createdAt: n.createdAt || Date.now(),
            updatedAt: n.updatedAt || n.createdAt || Date.now()
          });
          existingIds.add(id);
          count++;
        }
      }
    }

    if (count > 0) {
      await this.context.globalState.update(NotesManager.STORAGE_KEY, current);
      this.onDidChangeEmitter.fire();
    }
    return count;
  }
}
