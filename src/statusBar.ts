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
    isBookmarked: boolean = false
  ): void {
    this.currentVerse = verse;

    const icon = this.getIconSymbol(iconType);
    const star = isBookmarked ? '⭐ ' : '';
    const bookTitle = verse.translation === 'zulu' ? verse.zuluBookName : verse.bookName;
    const ref = `${bookTitle} ${verse.chapter}:${verse.verse}`;

    let displayText = '';
    switch (displayMode) {
      case 'compact':
        displayText = `${star}${icon}${ref}`;
        break;

      case 'preview': {
        const snippet = verse.text.length > 40 ? verse.text.slice(0, 37) + '...' : verse.text;
        displayText = `${star}${icon}${ref} — "${snippet}"`;
        break;
      }

      case 'full':
        displayText = `${star}${icon}${ref} — "${verse.text}"`;
        break;
    }

    this.statusBarItem.text = displayText;
    this.statusBarItem.tooltip = this.createTooltip(verse, isBookmarked);
    this.statusBarItem.show();
  }

  private createTooltip(verse: VerseData, isBookmarked: boolean): vscode.MarkdownString {
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

    // --- 1. VERSE SECTION ---
    md.appendMarkdown(`### 📖 **${bookTitle} ${verse.chapter}:${verse.verse}**\n\n`);
    md.appendMarkdown(`*${translationName}*\n\n`);
    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`> ### **"${verse.text}"**\n\n`);

    if (verse.parallelText && verse.parallelTranslation) {
      const parallelName =
        verse.parallelTranslation === 'zulu'
          ? 'isiZulu (1959)'
          : verse.parallelTranslation === 'web'
          ? 'WEB'
          : 'KJB';
      md.appendMarkdown(`**Parallel (${parallelName}):**\n`);
      md.appendMarkdown(`> *"${verse.parallelText}"*\n\n`);
    }

    md.appendMarkdown(`---\n\n`);

    // --- 2. CHAPTER CONTEXT SECTION (Small, scrollable chapter context for that verse) ---
    if (verse.chapterVerses && verse.chapterVerses.length > 0) {
      const totalV = verse.chapterVerses.length;
      md.appendMarkdown(`<details open>\n<summary><b>📜 Context: ${bookTitle} Chapter ${verse.chapter} (Verses 1 to ${totalV})</b></summary>\n<br/>\n\n`);

      // Render verses in compact flowing format with active verse highlighted
      let chapterContent = '';
      for (let i = 0; i < totalV; i++) {
        const vNum = i + 1;
        const vText = verse.chapterVerses[i];
        if (vNum === verse.verse) {
          chapterContent += `**<mark>&nbsp;👉 [${vNum}] ${vText}&nbsp;</mark>** `;
        } else {
          chapterContent += `<sup><b>${vNum}</b></sup> ${vText} `;
        }
      }

      md.appendMarkdown(`${chapterContent}\n\n`);
      md.appendMarkdown(`</details>\n\n---\n\n`);
    }

    // --- 3. CROSS REFERENCES SECTION (Scrollable with actual verses listed with refs) ---
    if (verse.resolvedCrossReferences && verse.resolvedCrossReferences.length > 0) {
      const crList = verse.resolvedCrossReferences;
      md.appendMarkdown(`<details open>\n<summary><b>🔗 Cross References & Connected Scriptures (${crList.length} passages)</b></summary>\n<br/>\n\n`);

      for (const cr of crList) {
        const crBook = verse.translation === 'zulu' ? cr.zuluBookName : cr.bookName;
        const rangeStr = cr.endVerse ? `-${cr.endVerse}` : '';
        const citation = `${crBook} ${cr.chapter}:${cr.verse}${rangeStr}`;
        const cmdLink = `command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([cr.ref]))}`;

        md.appendMarkdown(`**[🔗 ${citation}](${cmdLink} "Jump to ${citation}")**`);
        if (cr.anchor) {
          md.appendMarkdown(` *(on "${cr.anchor}")*`);
        }
        md.appendMarkdown(`\n> *"${cr.text}"*\n\n`);
      }

      md.appendMarkdown(`</details>\n\n---\n\n`);
    } else if (verse.crossReferences && verse.crossReferences.length > 0) {
      const topRefs: string[] = [];
      const seen = new Set<string>();
      for (const g of verse.crossReferences) {
        for (const r of g.refs) {
          if (!seen.has(r)) {
            seen.add(r);
            topRefs.push(r);
            if (topRefs.length >= 6) break;
          }
        }
        if (topRefs.length >= 6) break;
      }

      if (topRefs.length > 0) {
        const links = topRefs
          .map(r => `[🔗 ${r}](command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([r]))} "Jump to ${r}")`)
          .join(' &nbsp;&bull;&nbsp; ');
        md.appendMarkdown(`**Cross-References:**\n${links}\n\n---\n\n`);
      }
    }

    // --- 4. OTHER NAVIGATIONS SECTION ---
    const bookmarkLabel = isBookmarked ? '$(star-full) Bookmarked' : '$(star-empty) Bookmark';
    const bookmarkCmd = isBookmarked ? 'command:dailyBread.removeCurrentBookmark' : 'command:dailyBread.bookmarkCurrent';

    md.appendMarkdown(
      `[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; ` +
      `[$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; ` +
      `[🔗 Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; ` +
      `[${bookmarkLabel}](${bookmarkCmd} "Save to favorites") &nbsp;&bull;&nbsp; ` +
      `[$(copy) Copy](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; ` +
      `[$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; ` +
      `[$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")`
    );

    return md;
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}

