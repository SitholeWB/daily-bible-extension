import * as vscode from 'vscode';
import { StatusDisplayMode, StatusIconType, VerseData } from './types';

export class StatusBarController {
  private statusBarItem: vscode.StatusBarItem;
  private currentVerse: VerseData | undefined;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'dailyBread.menu';
  }

  public getVerse(): VerseData | undefined {
    return this.currentVerse;
  }

  private getIconSymbol(iconType: StatusIconType): string {
    switch (iconType) {
      case 'cross':
        return '✝ ';
      case 'book':
        return '📖 ';
      case 'dove':
        return '🕊️ ';
      case 'none':
      default:
        return '';
    }
  }

  public update(
    verse: VerseData,
    displayMode: StatusDisplayMode,
    iconType: StatusIconType,
    isBookmarked: boolean = false,
    isPaused: boolean = false
  ): void {
    this.currentVerse = verse;

    const icon = this.getIconSymbol(iconType);
    const star = isBookmarked ? '⭐ ' : '';
    const pausePrefix = isPaused ? '⏸ ' : '';
    const bookTitle = verse.translation === 'zulu' ? verse.zuluBookName : verse.bookName;
    const ref = `${bookTitle} ${verse.chapter}:${verse.verse}`;

    let displayText = '';
    switch (displayMode) {
      case 'compact':
        displayText = `${star}${pausePrefix}${icon}${ref}`;
        break;

      case 'preview': {
        const snippet = verse.text.length > 40 ? verse.text.slice(0, 37) + '...' : verse.text;
        displayText = `${star}${pausePrefix}${icon}${ref} — "${snippet}"`;
        break;
      }

      case 'full':
        displayText = `${star}${pausePrefix}${icon}${ref} — "${verse.text}"`;
        break;
    }

    this.statusBarItem.text = displayText;
    this.statusBarItem.tooltip = this.createTooltip(verse, isBookmarked, isPaused);
    this.statusBarItem.show();
  }

  private createTooltip(verse: VerseData, isBookmarked: boolean, isPaused: boolean = false): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    const bookTitle = verse.translation === 'zulu' ? verse.zuluBookName : verse.bookName;
    const translationName =
      verse.translation === 'zulu'
        ? 'isiZulu (IBhayibheli Elingcwele 1959)'
        : verse.translation === 'web'
        ? 'World English Bible (WEB)'
        : 'King James Version (KJV)';

    const bookmarkLabel = isBookmarked ? '$(star-full) Bookmarked' : '$(star-empty) Bookmark';
    const bookmarkCmd = isBookmarked ? 'command:dailyBread.removeCurrentBookmark' : 'command:dailyBread.bookmarkCurrent';

    const pauseLabel = isPaused ? '$(play) Resume Auto-Rotation' : '$(debug-pause) Pause Rotation';
    const pauseTooltip = isPaused
      ? 'Resume automatic rotating verses'
      : 'Pause auto-rotation (Reading Mode: prevents verses from changing while reading)';

    // --- 1. HEADER & TOP ACTION BAR (Stretches tooltip width for comfortable reading) ---
    md.appendMarkdown(
      `| 📖 **${bookTitle} ${verse.chapter}:${verse.verse}** | 🌐 **${translationName}** |\n` +
      `| :----------------------------------------------------------------------------- | -------------------------------------------------------------------: |\n\n`
    );

    if (isPaused) {
      md.appendMarkdown(
        `> ⏸ **Reading Mode Active** — Auto-rotation is paused. Verses will not change automatically while you read.  \n` +
        `> [$(play) Click to Resume Auto-Rotation](command:dailyBread.togglePauseRotation "Resume automatic rotation") &nbsp;&bull;&nbsp; ` +
        `[$(sync) Advance Verse Manually](command:dailyBread.nextVerse "Advance to next verse")\n\n`
      );
    }

    md.appendMarkdown(
      `[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; ` +
      `[${pauseLabel}](command:dailyBread.togglePauseRotation "${pauseTooltip}") &nbsp;&bull;&nbsp; ` +
      `[$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; ` +
      `[🔗 Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; ` +
      `[${bookmarkLabel}](${bookmarkCmd} "Save to favorites") &nbsp;&bull;&nbsp; ` +
      `[$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; ` +
      `[$(copy) Copy](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; ` +
      `[$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; ` +
      `[$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")\n\n`
    );

    md.appendMarkdown(`---\n\n`);

    // --- 2. ACTIVE VERSE SECTION ---
    md.appendMarkdown(`## 📖 **${bookTitle} ${verse.chapter}:${verse.verse}**\n\n`);
    md.appendMarkdown(`> ### **"${verse.text}"**\n\n`);

    if (verse.parallelText && verse.parallelTranslation) {
      const parallelName =
        verse.parallelTranslation === 'zulu'
          ? 'isiZulu (1959)'
          : verse.parallelTranslation === 'web'
          ? 'WEB'
          : 'KJB';
      md.appendMarkdown(`> **Parallel (${parallelName}):** *"${verse.parallelText}"*\n\n`);
    }

    md.appendMarkdown(`---\n\n`);

    // --- 3. FULL CHAPTER CONTEXT SECTION (Long, verse-by-verse format for smooth scrolling) ---
    if (verse.chapterVerses && verse.chapterVerses.length > 0) {
      const totalV = verse.chapterVerses.length;
      md.appendMarkdown(
        `### 📜 Full Chapter: **${bookTitle} Chapter ${verse.chapter}** (Verses 1 to ${totalV})\n\n` +
        `*Scroll up and down to read all verses in context:*  \n\n`
      );

      for (let i = 0; i < totalV; i++) {
        const vNum = i + 1;
        const vText = verse.chapterVerses[i];
        if (vNum === verse.verse) {
          md.appendMarkdown(`👉 **<mark>&nbsp;[${vNum}] ${vText}&nbsp;</mark>** *(Active Verse)*  \n\n`);
        } else {
          md.appendMarkdown(`**${vNum}.** ${vText}  \n\n`);
        }
      }

      md.appendMarkdown(`---\n\n`);
    }

    // --- 4. CROSS REFERENCES SECTION (Scrollable list of actual scriptures with refs) ---
    if (verse.resolvedCrossReferences && verse.resolvedCrossReferences.length > 0) {
      const crList = verse.resolvedCrossReferences;
      md.appendMarkdown(
        `### 🔗 Cross-References & Scripture Connections (${crList.length} Passages)\n\n` +
        `*Scriptures connected by Treasury of Scripture Knowledge (TSK):*  \n\n`
      );

      for (const cr of crList) {
        const crBook = verse.translation === 'zulu' ? cr.zuluBookName : cr.bookName;
        const rangeStr = cr.endVerse ? `-${cr.endVerse}` : '';
        const citation = `${crBook} ${cr.chapter}:${cr.verse}${rangeStr}`;
        const cmdLink = `command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([cr.ref]))}`;

        const anchorText = cr.anchor ? ` &nbsp;*(connecting theme: "${cr.anchor}")*` : '';
        md.appendMarkdown(`* **[📖 ${citation}](${cmdLink} "Jump to ${citation}")**${anchorText}  \n`);
        md.appendMarkdown(`  > *"${cr.text}"*\n\n`);
      }

      md.appendMarkdown(`---\n\n`);
    } else if (verse.crossReferences && verse.crossReferences.length > 0) {
      const topRefs: string[] = [];
      const seen = new Set<string>();
      for (const g of verse.crossReferences) {
        for (const r of g.refs) {
          if (!seen.has(r)) {
            seen.add(r);
            topRefs.push(r);
            if (topRefs.length >= 12) break;
          }
        }
        if (topRefs.length >= 12) break;
      }

      if (topRefs.length > 0) {
        const links = topRefs
          .map(r => `[🔗 ${r}](command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([r]))} "Jump to ${r}")`)
          .join(' &nbsp;&bull;&nbsp; ');
        md.appendMarkdown(`### 🔗 Cross-References:\n${links}\n\n---\n\n`);
      }
    }

    // --- 5. BOTTOM NAVIGATION BAR ---
    md.appendMarkdown(
      `### 🧭 Quick Navigation\n\n` +
      `[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; ` +
      `[${pauseLabel}](command:dailyBread.togglePauseRotation "${pauseTooltip}") &nbsp;&bull;&nbsp; ` +
      `[$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; ` +
      `[🔗 Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; ` +
      `[${bookmarkLabel}](${bookmarkCmd} "Save to favorites") &nbsp;&bull;&nbsp; ` +
      `[$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; ` +
      `[$(copy) Copy Verse](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; ` +
      `[$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; ` +
      `[$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")\n`
    );

    return md;
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}

