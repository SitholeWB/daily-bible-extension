import * as vscode from 'vscode';
import { NotesManager } from './notesManager';
import { StudyNote, VerseData } from './types';

export class StudyNoteView {
  public static currentPanel: StudyNoteView | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly notesManager: NotesManager;
  private disposables: vscode.Disposable[] = [];
  private activeNote: StudyNote | undefined;
  private linkedVerse: VerseData | undefined;

  public static createOrShow(
    notesManager: NotesManager,
    options?: { note?: StudyNote; verseData?: VerseData }
  ): StudyNoteView {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    if (StudyNoteView.currentPanel) {
      StudyNoteView.currentPanel.activeNote = options?.note;
      StudyNoteView.currentPanel.linkedVerse = options?.verseData;
      StudyNoteView.currentPanel.panel.reveal(column);
      StudyNoteView.currentPanel.update();
      return StudyNoteView.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      'dailyBreadStudyNote',
      '📝 Study Note',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    StudyNoteView.currentPanel = new StudyNoteView(panel, notesManager, options?.note, options?.verseData);
    return StudyNoteView.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    notesManager: NotesManager,
    note?: StudyNote,
    verseData?: VerseData
  ) {
    this.panel = panel;
    this.notesManager = notesManager;
    this.activeNote = note;
    this.linkedVerse = verseData;

    this.update();
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'saveNote': {
            const tags = (message.tags || '')
              .split(',')
              .map((t: string) => t.trim().replace(/^#/, ''))
              .filter((t: string) => t.length > 0);

            const saved = await this.notesManager.saveNote({
              id: this.activeNote?.id,
              title: message.title || '',
              content: message.content || '',
              tags,
              verseData: this.linkedVerse,
              bookId: this.activeNote?.bookId,
              bookName: this.activeNote?.bookName,
              chapter: this.activeNote?.chapter,
              verse: this.activeNote?.verse,
              translation: this.activeNote?.translation,
              verseText: this.activeNote?.verseText
            });

            this.activeNote = saved;
            this.panel.title = `📝 ${saved.title}`;
            this.panel.webview.postMessage({ command: 'saved', id: saved.id });
            vscode.window.showInformationMessage(`📝 Study note saved: ${saved.title}`);
            break;
          }

          case 'deleteNote': {
            if (this.activeNote) {
              await this.notesManager.deleteNote(this.activeNote.id);
              vscode.window.showInformationMessage('Study note deleted.');
              this.panel.dispose();
            }
            break;
          }

          case 'openChapter': {
            const bId = this.linkedVerse?.bookId ?? this.activeNote?.bookId;
            const ch = this.linkedVerse?.chapter ?? this.activeNote?.chapter;
            const vs = this.linkedVerse?.verse ?? this.activeNote?.verse;
            const tr = this.linkedVerse?.translation ?? this.activeNote?.translation;
            if (bId && ch) {
              vscode.commands.executeCommand('dailyBread.openReaderAt', bId, ch, vs, tr);
            }
            break;
          }

          case 'exportSingleMarkdown': {
            const title = (message.title || this.activeNote?.title || 'Study Note').trim();
            const content = message.content || this.activeNote?.content || '';
            const ref = this.getRefDisplay();
            const vText = this.linkedVerse?.text || this.activeNote?.verseText || '';
            let md = `# ${title}\n\n`;
            if (ref) {
              md += `**Scripture:** ${ref}\n`;
              if (vText) md += `> "${vText}"\n`;
              md += '\n';
            }
            md += `${content}\n`;

            const doc = await vscode.workspace.openTextDocument({ content: md, language: 'markdown' });
            await vscode.window.showTextDocument(doc);
            break;
          }
        }
      },
      null,
      this.disposables
    );
  }

  private getRefDisplay(): string {
    if (this.linkedVerse) {
      const bTitle =
        this.linkedVerse.translation === 'zulu' ? this.linkedVerse.zuluBookName : this.linkedVerse.bookName;
      return `${bTitle} ${this.linkedVerse.chapter}:${this.linkedVerse.verse} (${this.linkedVerse.translation.toUpperCase()})`;
    }
    if (this.activeNote?.bookName && this.activeNote?.chapter) {
      const vPart = this.activeNote.verse ? `:${this.activeNote.verse}` : '';
      const tPart = this.activeNote.translation ? ` (${this.activeNote.translation.toUpperCase()})` : '';
      return `${this.activeNote.bookName} ${this.activeNote.chapter}${vPart}${tPart}`;
    }
    return '';
  }

  private escapeHtml(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private update(): void {
    const refDisplay = this.getRefDisplay();
    const verseText = this.linkedVerse?.text || this.activeNote?.verseText || '';
    const defaultTitle =
      this.activeNote?.title || (refDisplay ? `Study Note — ${refDisplay}` : 'New Spiritual / Study Note');
    const content = this.activeNote?.content || '';
    const tags = this.activeNote?.tags ? this.activeNote.tags.join(', ') : '';

    this.panel.title = `📝 ${defaultTitle}`;

    this.panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Study Note</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --muted: var(--vscode-descriptionForeground);
      --card: var(--vscode-sideBar-background, rgba(128,128,128,0.08));
      --border: var(--vscode-panel-border, rgba(128,128,128,0.25));
      --accent: var(--vscode-button-background, #007acc);
      --accent-fg: var(--vscode-button-foreground, #ffffff);
      --input-bg: var(--vscode-input-background);
      --input-fg: var(--vscode-input-foreground);
      --input-border: var(--vscode-input-border, var(--border));
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px 32px 48px 32px;
      background: var(--bg);
      color: var(--fg);
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      max-width: 860px;
      margin-left: auto;
      margin-right: auto;
    }
    .scripture-box {
      background: var(--card);
      border-left: 4px solid var(--accent);
      border-radius: 0 8px 8px 0;
      padding: 14px 18px;
      margin-bottom: 20px;
    }
    .scripture-ref {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 13.5px;
      margin-bottom: 6px;
    }
    .scripture-text {
      font-size: 14.5px;
      line-height: 1.6;
      font-style: italic;
      opacity: 0.95;
    }
    .field-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    input[type="text"], textarea {
      width: 100%;
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 6px;
      padding: 10px 13px;
      font-family: inherit;
      font-size: 14px;
      outline: none;
      margin-bottom: 16px;
    }
    input[type="text"]:focus, textarea:focus {
      border-color: var(--vscode-focusBorder, var(--accent));
    }
    #note-title {
      font-size: 17px;
      font-weight: 600;
    }
    #note-content {
      min-height: 300px;
      line-height: 1.65;
      resize: vertical;
      font-size: 14.5px;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .btn-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .btn {
      padding: 8px 15px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--fg);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }
    .btn:hover { background: rgba(128,128,128,0.16); }
    .btn-primary {
      background: var(--accent);
      color: var(--accent-fg);
      border-color: var(--accent);
    }
    .btn-danger {
      color: #f85149;
      border-color: rgba(248, 81, 73, 0.35);
    }
    .status-text {
      font-size: 12px;
      color: var(--muted);
    }
  </style>
</head>
<body>
  ${
    refDisplay
      ? `<div class="scripture-box">
          <div class="scripture-ref">
            <span>📖 ${this.escapeHtml(refDisplay)}</span>
            <button class="btn" style="padding:4px 10px;font-size:12px;" onclick="openChapter()">Open Chapter in Reader</button>
          </div>
          ${verseText ? `<div class="scripture-text">"${this.escapeHtml(verseText)}"</div>` : ''}
        </div>`
      : ''
  }

  <label class="field-label" for="note-title">Note Title</label>
  <input id="note-title" type="text" value="${this.escapeHtml(defaultTitle)}" placeholder="e.g. Sunday Sermon Notes / Morning Devotion..." />

  <label class="field-label" for="note-content">Study Notes &amp; Reflections</label>
  <textarea id="note-content" placeholder="Write your Bible study notes, sermon outline, prayer, or theological reflections here... (Ctrl+S / Cmd+S to save)" autofocus>${this.escapeHtml(content)}</textarea>

  <label class="field-label" for="note-tags">Tags (comma separated, optional)</label>
  <input id="note-tags" type="text" value="${this.escapeHtml(tags)}" placeholder="e.g. sermon, grace, devotion, theology" />

  <div class="toolbar">
    <div class="btn-group">
      <button class="btn btn-primary" onclick="save()">💾 Save Note</button>
      <button class="btn" onclick="exportMd()">📄 Open as Markdown (.md)</button>
      ${this.activeNote ? `<button class="btn btn-danger" onclick="deleteNote()">🗑 Delete</button>` : ''}
    </div>
    <span class="status-text" id="status-text">Tip: Press Ctrl+S (Cmd+S) to save anytime</span>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function save() {
      vscode.postMessage({
        command: 'saveNote',
        title: document.getElementById('note-title').value,
        content: document.getElementById('note-content').value,
        tags: document.getElementById('note-tags').value
      });
    }

    function deleteNote() {
      vscode.postMessage({ command: 'deleteNote' });
    }

    function openChapter() {
      vscode.postMessage({ command: 'openChapter' });
    }

    function exportMd() {
      vscode.postMessage({
        command: 'exportSingleMarkdown',
        title: document.getElementById('note-title').value,
        content: document.getElementById('note-content').value
      });
    }

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    });

    window.addEventListener('message', (event) => {
      if (event.data && event.data.command === 'saved') {
        document.getElementById('status-text').textContent = '✅ Saved just now';
      }
    });
  </script>
</body>
</html>`;
  }

  public dispose(): void {
    StudyNoteView.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      d?.dispose();
    }
  }
}
