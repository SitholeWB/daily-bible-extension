export type Translation = 'zulu' | 'web' | 'kjv';

export interface BookMetadata {
  id: number;
  code: string;
  name: string;
  zuluName: string;
  chapters: number;
  testament: 'OT' | 'NT';
  aliases: string[];
}

export interface VerseRef {
  bookId: number;
  chapter: number;
  verse: number;
}

export interface CrossReferenceGroup {
  anchor: string;
  refs: string[];
}

export interface ResolvedCrossReference {
  ref: string;
  bookId: number;
  bookName: string;
  zuluBookName: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  text: string;
  anchor: string;
}

export interface VerseData {
  bookId: number;
  bookName: string;
  zuluBookName: string;
  chapter: number;
  verse: number;
  text: string;
  translation: Translation;
  parallelText?: string;
  parallelTranslation?: Translation;
  crossReferences?: CrossReferenceGroup[];
  resolvedCrossReferences?: ResolvedCrossReference[];
  chapterVerses?: string[];
}

export interface Bookmark {
  id: string; // e.g. "43:3:16:kjv"
  bookId: number;
  chapter: number;
  verse: number;
  translation: Translation;
  text: string;
  bookName: string;
  createdAt: number;
  note?: string;
  tags?: string[];
}

export interface CuratedTopic {
  id: string;
  name: string;
  zuluName: string;
  description: string;
  verses: VerseRef[];
}

export type StatusDisplayMode = 'compact' | 'preview' | 'full';
export type StatusIconType = 'cross' | 'book' | 'dove' | 'none';
export type RotationSchedule = 'manual' | '5min' | '15min' | '30min' | '60min' | 'onEditorOpen';

export interface ExtensionSettings {
  translation: Translation;
  displayMode: StatusDisplayMode;
  icon: StatusIconType;
  rotationSchedule: RotationSchedule;
  rotateOnFileSave: boolean;
  topic: string; // 'all' or topic id
  dualTranslation: Translation | 'none';
  fontSize: number; // 0 = match editor font size
  fontFamily: string; // 'editor' | 'serif' | 'sans-serif' | 'monospace' | 'system'
}
