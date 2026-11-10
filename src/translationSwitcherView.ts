import * as vscode from 'vscode';
import { BibleManager } from './bibleManager';
import { Translation, TranslationInfo } from './types';

export interface TranslationSwitchCallbacks {
  onTranslationActivated: () => void;
}

/**
 * Rich In-Editor Webview Panel for searching, switching, and downloading
 * offline Bible translations across languages.
 */
export class TranslationSwitcherView {
  public static currentPanel: TranslationSwitcherView | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly bibleManager: BibleManager;
  private readonly callbacks: TranslationSwitchCallbacks;
  private disposables: vscode.Disposable[] = [];
  private targetMode: 'primary' | 'parallel' = 'primary';
  private downloadingIds: Set<string> = new Set();

  public static createOrShow(
    bibleManager: BibleManager,
    callbacks: TranslationSwitchCallbacks,
    initialMode: 'primary' | 'parallel' = 'primary'
  ): TranslationSwitcherView {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    if (TranslationSwitcherView.currentPanel) {
      TranslationSwitcherView.currentPanel.targetMode = initialMode;
      TranslationSwitcherView.currentPanel.panel.reveal(column);
      TranslationSwitcherView.currentPanel.update();
      return TranslationSwitcherView.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      'dailyBreadTranslations',
      '🌐 Bible Translations & Offline Library',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    TranslationSwitcherView.currentPanel = new TranslationSwitcherView(panel, bibleManager, callbacks, initialMode);
    return TranslationSwitcherView.currentPanel;
  }

  public static updateCurrent(): void {
    TranslationSwitcherView.currentPanel?.update();
  }

  private constructor(
    panel: vscode.WebviewPanel,
    bibleManager: BibleManager,
    callbacks: TranslationSwitchCallbacks,
    initialMode: 'primary' | 'parallel'
  ) {
    this.panel = panel;
    this.bibleManager = bibleManager;
    this.callbacks = callbacks;
    this.targetMode = initialMode;

    this.update();
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'setTargetMode':
            this.targetMode = message.mode === 'parallel' ? 'parallel' : 'primary';
            this.update();
            break;

          case 'activateTranslation':
            await this.activateTranslation(message.id, message.mode || this.targetMode);
            break;

          case 'disableParallel':
            await vscode.workspace
              .getConfiguration('dailyBread')
              .update('dualTranslation', 'none', vscode.ConfigurationTarget.Global);
            this.callbacks.onTranslationActivated();
            this.update();
            vscode.window.showInformationMessage('Parallel translation disabled.');
            break;

          case 'downloadTranslation':
            await this.handleDownload(message.id, Boolean(message.activateAfter), message.mode || this.targetMode);
            break;

          case 'deleteTranslation':
            await this.handleDelete(message.id);
            break;
        }
      },
      null,
      this.disposables
    );
  }

  private async activateTranslation(id: string, mode: 'primary' | 'parallel'): Promise<void> {
    if (!this.bibleManager.isTranslationInstalled(id)) {
      await this.handleDownload(id, true, mode);
      return;
    }

    const config = vscode.workspace.getConfiguration('dailyBread');
    const info = this.bibleManager.getTranslationInfo(id);
    const label = info ? `${info.language} — ${info.name}` : id.toUpperCase();

    if (mode === 'parallel') {
      await config.update('dualTranslation', id as Translation, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`📖 Parallel translation set to: ${label}`);
    } else {
      await config.update('translation', id as Translation, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`🌐 Active Bible translation switched to: ${label}`);
    }

    this.callbacks.onTranslationActivated();
    this.update();
  }

  private async handleDownload(
    id: string,
    activateAfter: boolean,
    mode: 'primary' | 'parallel'
  ): Promise<void> {
    if (this.downloadingIds.has(id)) {
      return;
    }
    const info = this.bibleManager.getTranslationInfo(id);
    const label = info ? `${info.language} — ${info.name}` : id;

    this.downloadingIds.add(id);
    this.panel.webview.postMessage({ command: 'downloadState', id, state: 'downloading' });

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Downloading ${label} for offline use...`,
          cancellable: false
        },
        async () => {
          await this.bibleManager.downloadTranslation(id);
        }
      );

      this.downloadingIds.delete(id);

      if (activateAfter) {
        await this.activateTranslation(id, mode);
      } else {
        this.callbacks.onTranslationActivated();
        this.update();
        vscode.window.showInformationMessage(`✅ Downloaded for offline use: ${label}`);
      }
    } catch (err: any) {
      this.downloadingIds.delete(id);
      this.panel.webview.postMessage({
        command: 'downloadState',
        id,
        state: 'error',
        error: err?.message || 'Download failed'
      });
      vscode.window.showErrorMessage(
        `Failed to download ${label}: ${err?.message || err}. Please check your internet connection and try again.`
      );
    }
  }

  private async handleDelete(id: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('dailyBread');
    const activePrimary = config.get<string>('translation', 'kjv');
    const activeParallel = config.get<string>('dualTranslation', 'none');

    if (activePrimary === id) {
      await config.update('translation', 'kjv', vscode.ConfigurationTarget.Global);
    }
    if (activeParallel === id) {
      await config.update('dualTranslation', 'none', vscode.ConfigurationTarget.Global);
    }

    this.bibleManager.deleteDownloadedTranslation(id);
    this.callbacks.onTranslationActivated();
    this.update();
  }

  private update(): void {
    this.panel.webview.html = this.getHtml();
  }

  private escapeHtml(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private getHtml(): string {
    const config = vscode.workspace.getConfiguration('dailyBread');
    const activePrimary = config.get<string>('translation', 'kjv');
    const activeParallel = config.get<string>('dualTranslation', 'none');

    const catalog = this.bibleManager.getCatalog();
    const enriched = catalog.map((item: TranslationInfo) => ({
      ...item,
      installed: this.bibleManager.isTranslationInstalled(item.id),
      downloading: this.downloadingIds.has(item.id)
    }));

    const installedCount = enriched.filter(t => t.installed).length;
    const regions = Array.from(new Set(enriched.map(t => t.region || 'Other')));

    const activePrimaryInfo = enriched.find(t => t.id === activePrimary);
    const activeParallelInfo = activeParallel !== 'none' ? enriched.find(t => t.id === activeParallel) : undefined;

    const payloadJson = JSON.stringify(enriched).replace(/</g, '\\u003c');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bible Translations &amp; Offline Library</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --muted: var(--vscode-descriptionForeground);
      --card: var(--vscode-sideBar-background, rgba(128,128,128,0.08));
      --border: var(--vscode-panel-border, rgba(128,128,128,0.22));
      --accent: var(--vscode-button-background, #007acc);
      --accent-fg: var(--vscode-button-foreground, #ffffff);
      --accent-hover: var(--vscode-button-hoverBackground, #0062a3);
      --input-bg: var(--vscode-input-background);
      --input-fg: var(--vscode-input-foreground);
      --input-border: var(--vscode-input-border, var(--border));
      --badge-bg: var(--vscode-badge-background, rgba(128,128,128,0.2));
      --badge-fg: var(--vscode-badge-foreground, var(--fg));
      --success: #2ea043;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--fg);
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      font-size: 13px;
    }

    .sticky-top {
      position: sticky;
      top: 0;
      z-index: 50;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      padding: 18px 28px 14px 28px;
    }

    .container {
      max-width: 980px;
      margin: 0 auto;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }

    h1 {
      margin: 0 0 4px 0;
      font-size: 20px;
      font-weight: 700;
    }

    .subtitle {
      color: var(--muted);
      font-size: 12.5px;
    }

    .active-summary {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }

    .summary-pill {
      padding: 5px 10px;
      border-radius: 6px;
      background: var(--card);
      border: 1px solid var(--border);
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .search-row {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 260px;
      padding: 9px 13px;
      border-radius: 6px;
      border: 1px solid var(--input-border);
      background: var(--input-bg);
      color: var(--input-fg);
      font-size: 13.5px;
      outline: none;
    }

    .search-box:focus {
      border-color: var(--vscode-focusBorder, var(--accent));
    }

    .mode-switch {
      display: inline-flex;
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
    }

    .mode-btn {
      border: none;
      background: var(--card);
      color: var(--fg);
      padding: 8px 14px;
      cursor: pointer;
      font-size: 12.5px;
      font-weight: 500;
    }

    .mode-btn.active {
      background: var(--accent);
      color: var(--accent-fg);
    }

    .filters {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-pill {
      border: 1px solid var(--border);
      background: transparent;
      color: var(--fg);
      padding: 4px 11px;
      border-radius: 14px;
      cursor: pointer;
      font-size: 12px;
      opacity: 0.85;
    }

    .filter-pill:hover {
      background: var(--card);
      opacity: 1;
    }

    .filter-pill.active {
      background: var(--accent);
      color: var(--accent-fg);
      border-color: var(--accent);
      opacity: 1;
    }

    .list-area {
      max-width: 980px;
      margin: 0 auto;
      padding: 18px 28px 48px 28px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .result-meta {
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 4px;
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 13px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .card.is-active {
      border-color: var(--accent);
      box-shadow: inset 3px 0 0 var(--accent);
    }

    .card-info {
      flex: 1;
      min-width: 240px;
    }

    .card-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }

    .lang-name {
      font-weight: 700;
      font-size: 14px;
    }

    .trans-name {
      font-size: 13.5px;
      opacity: 0.92;
    }

    .badge {
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 4px;
      background: var(--badge-bg);
      color: var(--badge-fg);
      font-weight: 600;
    }

    .badge.offline {
      background: rgba(46, 160, 67, 0.18);
      color: #3fb950;
      border: 1px solid rgba(46, 160, 67, 0.35);
    }

    .badge.active-tag {
      background: var(--accent);
      color: var(--accent-fg);
    }

    .card-meta {
      font-size: 11.5px;
      color: var(--muted);
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .card-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 6px 12px;
      border-radius: 5px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--fg);
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
    }

    .btn:hover:not(:disabled) {
      background: rgba(128, 128, 128, 0.15);
    }

    .btn-primary {
      background: var(--accent);
      color: var(--accent-fg);
      border-color: var(--accent);
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--accent-hover);
    }

    .btn:disabled {
      opacity: 0.55;
      cursor: default;
    }

    .btn-danger {
      color: #f85149;
      border-color: rgba(248, 81, 73, 0.35);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="sticky-top">
    <div class="container">
      <div class="header-row">
        <div>
          <h1>🌐 Bible Translations &amp; Offline Library</h1>
          <div class="subtitle">
            <strong>KJV</strong> &amp; <strong>isiZulu</strong> are bundled offline by default. Download any additional language once to read 100% offline forever.
          </div>
        </div>
        <div class="active-summary">
          <div class="summary-pill">
            <span>Primary:</span>
            <strong>${this.escapeHtml(activePrimaryInfo ? `${activePrimaryInfo.language} (${activePrimaryInfo.shortName})` : activePrimary)}</strong>
          </div>
          <div class="summary-pill">
            <span>Parallel:</span>
            <strong>${activeParallelInfo ? this.escapeHtml(`${activeParallelInfo.language} (${activeParallelInfo.shortName})`) : 'Off'}</strong>
            ${activeParallelInfo ? `<button class="btn" style="padding:2px 6px;font-size:11px;" onclick="disableParallel()">Off</button>` : ''}
          </div>
        </div>
      </div>

      <div class="search-row">
        <input
          id="search-input"
          class="search-box"
          type="text"
          placeholder="Search language, translation, or code (e.g. Spanish, Swahili, WEB, Chinese, French, KJV)..."
          autofocus
        />
        <div class="mode-switch" title="Choose whether clicking Use sets Primary or Parallel translation">
          <button id="mode-primary" class="mode-btn ${this.targetMode === 'primary' ? 'active' : ''}" onclick="setMode('primary')">Switch Primary</button>
          <button id="mode-parallel" class="mode-btn ${this.targetMode === 'parallel' ? 'active' : ''}" onclick="setMode('parallel')">Set Parallel</button>
        </div>
      </div>

      <div class="filters" id="filter-bar">
        <button class="filter-pill active" data-filter="all">All (${enriched.length})</button>
        <button class="filter-pill" data-filter="installed">✅ Installed Offline (${installedCount})</button>
        <button class="filter-pill" data-filter="available">☁️ Available to Download (${enriched.length - installedCount})</button>
        ${regions
          .filter(r => r !== 'Default Offline')
          .map(r => `<button class="filter-pill" data-filter="region:${this.escapeHtml(r)}">${this.escapeHtml(r)}</button>`)
          .join('')}
      </div>
    </div>
  </div>

  <div class="list-area">
    <div class="result-meta" id="result-meta"></div>
    <div id="cards-container" style="display:flex;flex-direction:column;gap:10px;"></div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const ALL_TRANSLATIONS = ${payloadJson};
    let activePrimary = ${JSON.stringify(activePrimary)};
    let activeParallel = ${JSON.stringify(activeParallel)};
    let currentMode = ${JSON.stringify(this.targetMode)};
    let currentFilter = 'all';
    let searchQuery = '';

    const searchInput = document.getElementById('search-input');
    const cardsContainer = document.getElementById('cards-container');
    const resultMeta = document.getElementById('result-meta');

    searchInput.addEventListener('input', (e) => {
      searchQuery = (e.target.value || '').trim().toLowerCase();
      render();
    });

    document.getElementById('filter-bar').addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-pill');
      if (!btn) return;
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter') || 'all';
      render();
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.command === 'downloadState') {
        const item = ALL_TRANSLATIONS.find(t => t.id === msg.id);
        if (item) {
          item.downloading = msg.state === 'downloading';
          render();
        }
      }
    });

    function setMode(mode) {
      currentMode = mode;
      document.getElementById('mode-primary').classList.toggle('active', mode === 'primary');
      document.getElementById('mode-parallel').classList.toggle('active', mode === 'parallel');
      vscode.postMessage({ command: 'setTargetMode', mode });
      render();
    }

    function activate(id) {
      vscode.postMessage({ command: 'activateTranslation', id, mode: currentMode });
    }

    function download(id, activateAfter) {
      const item = ALL_TRANSLATIONS.find(t => t.id === id);
      if (item) {
        item.downloading = true;
        render();
      }
      vscode.postMessage({ command: 'downloadTranslation', id, activateAfter, mode: currentMode });
    }

    function removePack(id) {
      vscode.postMessage({ command: 'deleteTranslation', id });
    }

    function disableParallel() {
      vscode.postMessage({ command: 'disableParallel' });
    }

    function esc(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function formatSize(kb) {
      if (!kb) return '';
      if (kb >= 1024) return (kb / 1024).toFixed(1) + ' MB';
      return kb + ' KB';
    }

    function render() {
      const filtered = ALL_TRANSLATIONS.filter(t => {
        if (currentFilter === 'installed' && !t.installed) return false;
        if (currentFilter === 'available' && t.installed) return false;
        if (currentFilter.startsWith('region:') && t.region !== currentFilter.slice(7)) return false;

        if (searchQuery) {
          const hay = [t.id, t.language, t.name, t.shortName, t.region, t.languageCode].join(' ').toLowerCase();
          return searchQuery.split(/\\s+/).every(tok => hay.includes(tok));
        }
        return true;
      });

      // Keep installed/bundled sorted cleanly to top when browsing All without search
      const sorted = [...filtered].sort((a, b) => {
        if (a.id === activePrimary) return -1;
        if (b.id === activePrimary) return 1;
        if (a.bundled !== b.bundled) return a.bundled ? -1 : 1;
        if (a.installed !== b.installed) return a.installed ? -1 : 1;
        return 0;
      });

      resultMeta.textContent = 'Showing ' + sorted.length + ' of ' + ALL_TRANSLATIONS.length + ' translations';

      if (sorted.length === 0) {
        cardsContainer.innerHTML = '<div class="empty-state">No translations match "' + esc(searchQuery) + '". Try another language or version name.</div>';
        return;
      }

      cardsContainer.innerHTML = sorted.map(t => {
        const isPrimary = t.id === activePrimary;
        const isParallel = t.id === activeParallel;
        const isTargetActive = currentMode === 'primary' ? isPrimary : isParallel;

        let badges = '<span class="badge">' + esc(t.shortName) + '</span>';
        if (t.bundled) {
          badges += '<span class="badge offline">✅ Bundled Offline</span>';
        } else if (t.installed) {
          badges += '<span class="badge offline">✅ Downloaded Offline</span>';
        }
        if (isPrimary) badges += '<span class="badge active-tag">Primary Active</span>';
        if (isParallel) badges += '<span class="badge active-tag">Parallel Active</span>';
        if (t.direction === 'rtl') badges += '<span class="badge">RTL</span>';

        let actions = '';
        if (t.downloading) {
          actions = '<button class="btn btn-primary" disabled>⏳ Downloading...</button>';
        } else if (t.installed) {
          const useLabel = currentMode === 'parallel'
            ? (isParallel ? 'Parallel Active ✓' : 'Set as Parallel')
            : (isPrimary ? 'Active ✓' : 'Use Translation');
          actions += '<button class="btn ' + (isTargetActive ? '' : 'btn-primary') + '" ' + (isTargetActive ? 'disabled' : '') + ' onclick="activate(\\'' + esc(t.id) + '\\')">' + useLabel + '</button>';
          if (!t.bundled) {
            actions += '<button class="btn btn-danger" title="Remove offline download to free disk space" onclick="removePack(\\'' + esc(t.id) + '\\')">Remove</button>';
          }
        } else {
          const dlUseLabel = currentMode === 'parallel' ? '☁️ Download &amp; Set Parallel' : '☁️ Download &amp; Use';
          actions += '<button class="btn btn-primary" onclick="download(\\'' + esc(t.id) + '\\', true)">' + dlUseLabel + ' (' + formatSize(t.sizeKB) + ')</button>';
          actions += '<button class="btn" title="Save offline without switching yet" onclick="download(\\'' + esc(t.id) + '\\', false)">Download Only</button>';
        }

        return '<div class="card ' + (isTargetActive ? 'is-active' : '') + '">' +
          '<div class="card-info">' +
            '<div class="card-title-row">' +
              '<span class="lang-name">' + esc(t.language) + '</span>' +
              '<span class="trans-name">' + esc(t.name) + '</span>' +
              badges +
            '</div>' +
            '<div class="card-meta">' +
              '<span>ID: <code>' + esc(t.id) + '</code></span>' +
              (t.region ? '<span>Region: ' + esc(t.region) + '</span>' : '') +
              '<span>' + esc(t.copyright) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="card-actions">' + actions + '</div>' +
        '</div>';
      }).join('');
    }

    render();
    searchInput.focus();
  </script>
</body>
</html>`;
  }

  public dispose(): void {
    TranslationSwitcherView.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      d?.dispose();
    }
  }
}
