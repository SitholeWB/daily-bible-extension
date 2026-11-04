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

    md.appendMarkdown(`### 📖 **${bookTitle} ${verse.chapter}:${verse.verse}**\n\n`);
    md.appendMarkdown(`*${translationName}*\n\n`);
    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`> *"${verse.text}"*\n\n`);

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

    if (verse.crossReferences && verse.crossReferences.length > 0) {
      const topRefs: string[] = [];
      const seen = new Set<string>();
      for (const g of verse.crossReferences) {
        for (const r of g.refs) {
          if (!seen.has(r)) {
            seen.add(r);
            topRefs.push(r);
            if (topRefs.length >= 5) break;
          }
        }
        if (topRefs.length >= 5) break;
      }

      if (topRefs.length > 0) {
        const links = topRefs.map(r => `[🔗 ${r}](command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([r]))} "Jump to ${r}")`).join(' &nbsp;&bull;&nbsp; ');
        md.appendMarkdown(`**Cross-References:**\n${links}\n\n`);
      }
    }

    md.appendMarkdown(`---\n\n`);

    const bookmarkLabel = isBookmarked ? '$(star-full) Bookmarked' : '$(star-empty) Bookmark';
    const bookmarkCmd = isBookmarked ? 'command:dailyBread.removeCurrentBookmark' : 'command:dailyBread.bookmarkCurrent';

    md.appendMarkdown(
      `[$(sync) Next Verse](command:dailyBread.nextVerse "Get next rotating verse") &nbsp;&bull;&nbsp; ` +
      `[$(book) Open Chapter](command:dailyBread.readChapter "Read full chapter in editor") &nbsp;&bull;&nbsp; ` +
      `[🔗 Cross Refs](command:dailyBread.showCrossReferences "View verse cross-references") &nbsp;&bull;&nbsp; ` +
      `[${bookmarkLabel}](${bookmarkCmd} "Save to favorites") &nbsp;&bull;&nbsp; ` +
      `[$(copy) Copy](command:dailyBread.copyVerse "Copy scripture to clipboard")`
    );

    return md;
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}

