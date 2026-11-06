"use strict";var te=Object.create;var E=Object.defineProperty;var oe=Object.getOwnPropertyDescriptor;var re=Object.getOwnPropertyNames;var ae=Object.getPrototypeOf,se=Object.prototype.hasOwnProperty;var ne=(p,e)=>{for(var a in e)E(p,a,{get:e[a],enumerable:!0})},q=(p,e,a,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of re(e))!se.call(p,r)&&r!==a&&E(p,r,{get:()=>e[r],enumerable:!(t=oe(e,r))||t.enumerable});return p};var V=(p,e,a)=>(a=p!=null?te(ae(p)):{},q(e||!p||!p.__esModule?E(a,"default",{value:p,enumerable:!0}):a,p)),ie=p=>q(E({},"__esModule",{value:!0}),p);var de={};ne(de,{activate:()=>ce,deactivate:()=>le});module.exports=ie(de);var c=V(require("vscode"));var S=V(require("fs")),B=V(require("path")),F=class{constructor(e){this.books=[];this.booksById=new Map;this.aliasMap=new Map;this.topics={};this.cache=new Map;this.crossRefCache=new Map;this.curatedVerseList=[];let a=[B.join(e,"data"),B.join(e,"..","data"),B.resolve(__dirname,"..","data"),B.resolve(__dirname,"data"),B.resolve(process.cwd(),"data")],t=a[0];for(let r of a)if(S.existsSync(B.join(r,"books.json"))){t=r;break}this.dataDir=t,this.loadMetadata()}loadMetadata(){let e=B.join(this.dataDir,"books.json");if(S.existsSync(e)){this.books=JSON.parse(S.readFileSync(e,"utf8"));for(let t of this.books)this.booksById.set(t.id,t),this.indexBookAliases(t)}let a=B.join(this.dataDir,"curated_topics.json");if(S.existsSync(a)){this.topics=JSON.parse(S.readFileSync(a,"utf8"));let t=new Set;for(let r of Object.values(this.topics))for(let s of r.verses){let l=`${s.bookId}:${s.chapter}:${s.verse}`;t.has(l)||(t.add(l),this.curatedVerseList.push(s))}}}normalizeText(e){return e.toLowerCase().replace(/[\u2018\u2019\u201C\u201D'"`\-_—–:.,;!]/g,"").replace(/\s+/g," ").trim()}indexBookAliases(e){let a=r=>{let s=this.normalizeText(r);s&&this.aliasMap.set(s,e)};a(e.name),a(e.zuluName),a(e.code);for(let r of e.aliases)a(r);let t=["u-","u","ku","kuma","kwabase","eka","aba","ama","izi","isi","um"];for(let r of t){let s=e.zuluName.toLowerCase();s.startsWith(r)&&s.length>r.length+2&&a(s.slice(r.length))}}getBooks(){return this.books}getBook(e){return this.booksById.get(e)}getCuratedTopics(){return this.topics}findBook(e){let a=this.normalizeText(e);if(!a)return;if(this.aliasMap.has(a))return this.aliasMap.get(a);let t=a.replace(/\s+/g,"");for(let[r,s]of this.aliasMap.entries())if(r.replace(/\s+/g,"")===t)return s;for(let[r,s]of this.aliasMap.entries())if(r.startsWith(a)||a.startsWith(r))return s;if(a.length>=3){for(let[r,s]of this.aliasMap.entries())if(r.includes(a)||a.includes(r))return s}}parseReference(e){let a=e.trim();if(!a)return;let t=a.match(/^([1-3]?\s*[A-Za-z\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/);if(!t){let i=a.match(/^([1-3]?\s*[\p{L}\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/u);if(!i)return;let m=i[1].trim(),o=parseInt(i[2],10),n=i[3]?parseInt(i[3],10):void 0,h=i[4]?parseInt(i[4],10):void 0,u=this.findBook(m);return u?{book:u,chapter:o,verse:n,endVerse:h}:void 0}let r=t[1].trim(),s=parseInt(t[2],10),l=t[3]?parseInt(t[3],10):void 0,b=t[4]?parseInt(t[4],10):void 0,d=this.findBook(r);if(d&&!(s<1||s>d.chapters))return{book:d,chapter:s,verse:l,endVerse:b}}getVerseRange(e,a,t,r,s="kjv"){let l=this.getChapter(e,a,s);if(l.length===0||t<1||t>l.length)return"";if(!r||r<=t)return l[t-1]||"";let b=Math.min(r,l.length,t+2),d=[];for(let i=t;i<=b;i++){let m=l[i-1];m&&d.push(`[${i}] ${m}`)}return r>b&&d.push("..."),d.join(" ")}resolveCrossReferences(e,a,t,r="kjv",s=8){let l=this.getCrossReferences(e,a,t),b=[],d=new Set;for(let i of l)for(let m of i.refs){if(d.has(m))continue;d.add(m);let o=this.parseReference(m);if(o&&o.verse){let n=this.getVerseRange(o.book.id,o.chapter,o.verse,o.endVerse,r);n&&b.push({ref:m,bookId:o.book.id,bookName:o.book.name,zuluBookName:o.book.zuluName,chapter:o.chapter,verse:o.verse,endVerse:o.endVerse,text:n,anchor:i.anchor})}if(b.length>=s)return b}return b}loadBookChapters(e,a){let t=`${a}:${e}`;if(this.cache.has(t))return this.cache.get(t);let r=B.join(this.dataDir,"translations",a,`${e}.json`);if(!S.existsSync(r))return[];try{let s=JSON.parse(S.readFileSync(r,"utf8"));return this.cache.set(t,s),s}catch{return[]}}loadBookCrossReferences(e){if(this.crossRefCache.has(e))return this.crossRefCache.get(e);let a=B.join(this.dataDir,"cross_references",`${e}.json`);if(!S.existsSync(a))return{};try{let t=JSON.parse(S.readFileSync(a,"utf8"));return this.crossRefCache.set(e,t),t}catch{return{}}}getCrossReferences(e,a,t){let r=this.loadBookCrossReferences(e);return r[a.toString()]&&r[a.toString()][t.toString()]||[]}getFlattenedCrossReferences(e,a,t){let r=this.getCrossReferences(e,a,t),s=new Set;for(let l of r)for(let b of l.refs)s.add(b);return Array.from(s)}getChapter(e,a,t){let r=this.loadBookChapters(e,t);return a<1||a>r.length?[]:r[a-1]||[]}getVerse(e,a,t,r,s){let l=this.getBook(e);if(!l)return;let b=this.getChapter(e,a,r);if(t<1||t>b.length)return;let d=b[t-1],i;if(s&&s!==r){let n=this.getChapter(e,a,s);t>=1&&t<=n.length&&(i=n[t-1])}let m=this.getCrossReferences(e,a,t),o=this.resolveCrossReferences(e,a,t,r,12);return{bookId:e,bookName:l.name,zuluBookName:l.zuluName,chapter:a,verse:t,text:d,translation:r,parallelText:i,parallelTranslation:s&&s!==r?s:void 0,crossReferences:m.length>0?m:void 0,resolvedCrossReferences:o.length>0?o:void 0,chapterVerses:b}}getRandomVerse(e,a="kjv",t){let r=[];e&&e!=="all"&&this.topics[e]?r=this.topics[e].verses:r=this.curatedVerseList,r.length===0&&(r=[{bookId:43,chapter:3,verse:16}]);let s=Math.floor(Math.random()*r.length),l=r[s],b=this.getVerse(l.bookId,l.chapter,l.verse,a,t);return b||{bookId:43,bookName:"John",zuluBookName:"UJohane",chapter:3,verse:16,text:"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",translation:a}}getNextCuratedVerse(e,a,t="kjv",r){let s=[];if(a&&a!=="all"&&this.topics[a]?s=this.topics[a].verses:s=this.curatedVerseList,s.length===0)return this.getRandomVerse(a,t,r);let b=(s.findIndex(i=>i.bookId===e.bookId&&i.chapter===e.chapter&&i.verse===e.verse)+1)%s.length,d=s[b];return this.getVerse(d.bookId,d.chapter,d.verse,t,r)||this.getRandomVerse(a,t,r)}getNextSequentialVerse(e,a="kjv",t){let r=this.getBook(e.bookId);if(!r)return this.getRandomVerse(void 0,a,t);let s=this.getChapter(e.bookId,e.chapter,a);if(e.verse<s.length)return this.getVerse(e.bookId,e.chapter,e.verse+1,a,t);if(e.chapter<r.chapters)return this.getVerse(e.bookId,e.chapter+1,1,a,t);let l=e.bookId%66+1;return this.getVerse(l,1,1,a,t)}};var X=V(require("vscode")),R=class R{constructor(e){this.onDidChangeEmitter=new X.EventEmitter;this.onDidChangeBookmarks=this.onDidChangeEmitter.event;this.context=e}getBookmarks(){return[...this.context.globalState.get(R.STORAGE_KEY,[])].sort((a,t)=>t.createdAt-a.createdAt)}isBookmarked(e,a,t){return this.getBookmarks().some(s=>s.bookId===e&&s.chapter===a&&s.verse===t)}getBookmark(e){return this.getBookmarks().find(a=>a.id===e)}async addBookmark(e,a,t){let r=this.getBookmarks(),s=`${e.bookId}:${e.chapter}:${e.verse}:${e.translation}`,l=r.filter(i=>i.id!==s),b=e.translation==="zulu"?e.zuluBookName:e.bookName,d={id:s,bookId:e.bookId,chapter:e.chapter,verse:e.verse,translation:e.translation,text:e.text,bookName:b,createdAt:Date.now(),note:a,tags:t};return l.unshift(d),await this.context.globalState.update(R.STORAGE_KEY,l),this.onDidChangeEmitter.fire(),d}async removeBookmark(e){let t=this.getBookmarks().filter(r=>r.id!==e);await this.context.globalState.update(R.STORAGE_KEY,t),this.onDidChangeEmitter.fire()}async updateBookmark(e,a,t){let r=this.getBookmarks(),s=r.find(l=>l.id===e);s&&(a!==void 0&&(s.note=a),t!==void 0&&(s.tags=t),await this.context.globalState.update(R.STORAGE_KEY,r),this.onDidChangeEmitter.fire())}exportBookmarksMarkdown(){let e=this.getBookmarks();if(e.length===0)return`# Daily Bible Bookmarks

No bookmarks saved yet.`;let a=`# \u{1F4D6} Daily Bible \u2014 Saved Bookmarks & Favorites

`;a+=`*Exported on ${new Date().toLocaleDateString()}*

---

`;for(let t of e){let r=new Date(t.createdAt).toLocaleDateString();a+=`### ${t.bookName} ${t.chapter}:${t.verse} (${t.translation.toUpperCase()})
`,a+=`> "${t.text}"

`,t.note&&(a+=`\u{1F4DD} **Note:** ${t.note}

`),t.tags&&t.tags.length>0&&(a+=`\u{1F3F7}\uFE0F **Tags:** ${t.tags.map(s=>"`#"+s+"`").join(" ")}

`),a+=`*Saved on ${r}*

---

`}return a}exportBookmarksJson(){return JSON.stringify(this.getBookmarks(),null,2)}async importBookmarks(e){try{let a=JSON.parse(e);if(!Array.isArray(a))return 0;let t=this.getBookmarks(),r=new Set(t.map(l=>l.id)),s=0;for(let l of a)if(l.bookId&&l.chapter&&l.verse&&l.text){let b=l.id||`${l.bookId}:${l.chapter}:${l.verse}:${l.translation||"zulu"}`;r.has(b)||(t.push({...l,id:b,createdAt:l.createdAt||Date.now()}),r.add(b),s++)}return await this.context.globalState.update(R.STORAGE_KEY,t),this.onDidChangeEmitter.fire(),s}catch{return 0}}};R.STORAGE_KEY="dailyBread.bookmarks";var A=R;var g=V(require("vscode")),I=class p{constructor(e,a,t,r,s=43,l=3,b,d="kjv"){this.disposables=[];this.currentBookId=43;this.currentChapter=3;this.currentVerseTarget=16;this.primaryTranslation="kjv";this.parallelTranslation="zulu";this.isParallel=!1;this.panel=e,this.extensionUri=a,this.bibleManager=t,this.bookmarksManager=r,this.currentBookId=s,this.currentChapter=l,this.currentVerseTarget=b,this.primaryTranslation=d,this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.webview.onDidReceiveMessage(async i=>{switch(i.command){case"prevChapter":this.goToPreviousChapter();break;case"nextChapter":this.goToNextChapter();break;case"setChapter":this.currentChapter=i.chapter,this.currentVerseTarget=void 0,this.update();break;case"setBookAndChapter":this.currentBookId=i.bookId,this.currentChapter=i.chapter,this.currentVerseTarget=i.verse,this.update();break;case"toggleParallel":this.isParallel=!this.isParallel,this.update();break;case"setPrimaryTranslation":this.primaryTranslation=i.translation,this.update();break;case"setParallelTranslation":this.parallelTranslation=i.translation,this.update();break;case"copyVerse":{let m=this.bibleManager.getVerse(i.bookId,i.chapter,i.verse,i.translation);if(m){let o=i.translation==="zulu"?m.zuluBookName:m.bookName,n=`"${m.text}" \u2014 ${o} ${i.chapter}:${i.verse} (${i.translation.toUpperCase()})`;await g.env.clipboard.writeText(n),g.window.showInformationMessage(`Copied: ${o} ${i.chapter}:${i.verse}`)}break}case"bookmarkVerse":{let m=this.bibleManager.getVerse(i.bookId,i.chapter,i.verse,i.translation);if(m){if(this.bookmarksManager.isBookmarked(i.bookId,i.chapter,i.verse)){let o=`${i.bookId}:${i.chapter}:${i.verse}:${i.translation}`;await this.bookmarksManager.removeBookmark(o),g.window.showInformationMessage("Bookmark removed.")}else await this.bookmarksManager.addBookmark(m),g.window.showInformationMessage(`\u2B50 Bookmarked: ${m.bookName} ${i.chapter}:${i.verse}`);this.update()}break}case"openBookPicker":this.showBookPicker();break;case"jumpToReference":{if(i.ref){let m=this.bibleManager.parseReference(i.ref);m?this.navigate(m.book.id,m.chapter,m.verse,this.primaryTranslation):g.window.showInformationMessage(`Could not resolve cross-reference: ${i.ref}`)}break}case"adjustFontSize":{let m=g.workspace.getConfiguration("dailyBread"),o=m.get("fontSize",0),n=g.workspace.getConfiguration("editor").get("fontSize",14),u=Math.max(10,Math.min(36,(o===0?n:o)+i.delta));await m.update("fontSize",u,g.ConfigurationTarget.Global),this.update();break}case"setFontSize":{await g.workspace.getConfiguration("dailyBread").update("fontSize",i.size,g.ConfigurationTarget.Global),this.update();break}case"promptFontSize":{await g.commands.executeCommand("dailyBread.changeFontSize");break}}},null,this.disposables)}static updateCurrent(){var e;(e=p.currentPanel)==null||e.update()}static createOrShow(e,a,t,r=43,s=3,l,b="kjv"){let d=g.window.activeTextEditor?g.window.activeTextEditor.viewColumn:void 0;if(p.currentPanel)return p.currentPanel.panel.reveal(d),p.currentPanel.navigate(r,s,l,b),p.currentPanel;let i=g.window.createWebviewPanel("dailyBreadReader","Daily Bible Reader",d||g.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0,localResourceRoots:[g.Uri.joinPath(e,"media")]});return p.currentPanel=new p(i,e,a,t,r,s,l,b),p.currentPanel}navigate(e,a,t,r){this.currentBookId=e,this.currentChapter=a,this.currentVerseTarget=t,r&&(this.primaryTranslation=r),this.update()}goToPreviousChapter(){if(this.bibleManager.getBook(this.currentBookId)){if(this.currentChapter>1)this.currentChapter--;else if(this.currentBookId>1){this.currentBookId--;let a=this.bibleManager.getBook(this.currentBookId);this.currentChapter=a?a.chapters:1}this.currentVerseTarget=void 0,this.update()}}goToNextChapter(){let e=this.bibleManager.getBook(this.currentBookId);e&&(this.currentChapter<e.chapters?this.currentChapter++:this.currentBookId<66&&(this.currentBookId++,this.currentChapter=1),this.currentVerseTarget=void 0,this.update())}async showBookPicker(){let a=this.bibleManager.getBooks().map(l=>({label:this.primaryTranslation==="zulu"?`${l.zuluName} (${l.name})`:`${l.name} (${l.zuluName})`,description:`${l.testament} \u2022 ${l.chapters} chapters`,book:l})),t=await g.window.showQuickPick(a,{placeHolder:"Select a Book to Read (e.g. USenesisi, AmaHubo, UJohane, Romans)"});if(!t)return;let r=Array.from({length:t.book.chapters},(l,b)=>({label:`Chapter ${b+1}`,chapter:b+1})),s=await g.window.showQuickPick(r,{placeHolder:`Select Chapter (1 to ${t.book.chapters})`});s&&(this.currentBookId=t.book.id,this.currentChapter=s.chapter,this.currentVerseTarget=void 0,this.update())}update(){let e=this.bibleManager.getBook(this.currentBookId);if(!e)return;let a=this.primaryTranslation==="zulu"?e.zuluName:e.name;this.panel.title=`\u{1F4D6} ${a} ${this.currentChapter}`,this.panel.webview.html=this.getHtmlContent(e)}getHtmlContent(e){let a=this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.primaryTranslation),t=this.isParallel?this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.parallelTranslation):[],r=this.primaryTranslation==="zulu"?`${e.zuluName} (${e.name})`:`${e.name} (${e.zuluName})`,s=e.chapters,l="",b=Math.max(a.length,t.length);for(let T=0;T<b;T++){let y=T+1,Y=a[T]||"",ee=t[T]||"",K=this.bookmarksManager.isBookmarked(e.id,this.currentChapter,y),Z=this.currentVerseTarget===y?"target-verse":"",_=K?"is-bookmarked":"",W=this.bibleManager.resolveCrossReferences(e.id,this.currentChapter,y,this.primaryTranslation,8),L=W.length>0,Q="";L&&(Q=`
          <div class="cross-ref-tray" id="cross-tray-${y}" style="display:none;">
            <div class="cross-ref-tray-title">\u{1F517} Cross References & Connected Verses (${W.length})</div>
            <div class="cross-ref-list">
              ${W.map(M=>`
                <div class="cross-ref-item" onclick="jumpRef('${M.ref}')" title="Click to open ${M.ref} in reader">
                  <div class="cr-header">
                    <span class="cr-citation">\u{1F517} ${M.bookName} ${M.chapter}:${M.verse}${M.endVerse?"-"+M.endVerse:""}</span>
                    ${M.anchor?`<span class="cr-anchor">on "${M.anchor}"</span>`:""}
                  </div>
                  <div class="cr-verse-text">"${M.text}"</div>
                </div>
              `).join("")}
            </div>
          </div>
        `),this.isParallel?l+=`
          <div class="verse-row ${Z}" id="verse-${y}">
            <div class="verse-col primary-col ${_}">
              <span class="verse-num">${y}</span>
              <span class="verse-text">${Y}</span>
              <div class="verse-actions">
                ${L?`<button title="Cross References" class="action-btn" onclick="toggleCrossRefs(${y})">\u{1F517}</button>`:""}
                <button title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${y}, '${this.primaryTranslation}')">${K?"\u2B50":"\u2606"}</button>
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${y}, '${this.primaryTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
            <div class="verse-col parallel-col">
              <span class="verse-num">${y}</span>
              <span class="verse-text">${ee}</span>
              <div class="verse-actions">
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${y}, '${this.parallelTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
          </div>
          ${Q}
        `:l+=`
          <div class="verse-item ${Z} ${_}" id="verse-${y}">
            <span class="verse-num">${y}</span>
            <span class="verse-text">${Y}</span>
            <span class="verse-actions">
              ${L?`<button class="action-btn" title="View Cross References" onclick="toggleCrossRefs(${y})">\u{1F517}</button>`:""}
              <button class="action-btn" title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${y}, '${this.primaryTranslation}')">${K?"\u2B50":"\u2606"}</button>
              <button class="action-btn" title="Copy Verse" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${y}, '${this.primaryTranslation}')">\u{1F4CB}</button>
            </span>
          </div>
          ${Q}
        `}let d=g.workspace.getConfiguration("dailyBread"),i=d.get("fontSize",0),m=d.get("fontFamily","editor"),o=g.workspace.getConfiguration("editor"),n=o.get("fontSize",14),h=o.get("fontFamily",""),u="var(--vscode-editor-font-family, monospace)";m==="serif"?u='Georgia, Garamond, "Times New Roman", serif':m==="sans-serif"?u='var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)':m==="monospace"?u='var(--vscode-editor-font-family, Consolas, "Courier New", monospace)':m==="system"&&(u='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');let f=i===0?`Editor (${n}px)`:`${i}px`,k=i===0?`var(--vscode-editor-font-size, ${n}px)`:`${i}px`;return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${r} ${this.currentChapter}</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --font-family: ${u};
      --reader-font-size: ${k};
      --accent: var(--vscode-textLink-foreground, #3794ff);
      --card-bg: var(--vscode-editorWidget-background, rgba(128, 128, 128, 0.08));
      --border: var(--vscode-editorWidget-border, rgba(128, 128, 128, 0.2));
      --hover-bg: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.12));
      --highlight: var(--vscode-editor-findMatchHighlightBackground, rgba(234, 179, 8, 0.25));
    }

    * { box-sizing: border-box; }

    body {
      background-color: var(--bg);
      color: var(--fg);
      font-family: var(--font-family);
      font-size: var(--reader-font-size);
      margin: 0;
      padding: 0;
      line-height: 1.7;
    }

    .header-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      padding: 10px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      backdrop-filter: blur(8px);
    }

    .nav-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn {
      background: var(--card-bg);
      color: var(--fg);
      border: 1px solid var(--border);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .btn:hover {
      background: var(--hover-bg);
      border-color: var(--accent);
    }

    .btn-primary {
      background: var(--accent);
      color: #ffffff;
      border: none;
    }

    .title-pill {
      font-size: 16px;
      font-weight: 600;
      padding: 4px 12px;
      cursor: pointer;
      border-radius: 4px;
    }

    .title-pill:hover {
      background: var(--hover-bg);
      color: var(--accent);
    }

    .view-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    select {
      background: var(--card-bg);
      color: var(--fg);
      border: 1px solid var(--border);
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
    }

    .content-area {
      max-width: ${this.isParallel?"1200px":"820px"};
      margin: 0 auto;
      padding: 32px 24px 64px 24px;
    }

    .chapter-hero {
      text-align: center;
      margin-bottom: 32px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
    }

    .chapter-hero h1 {
      margin: 0 0 6px 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }

    .chapter-hero .subtitle {
      opacity: 0.75;
      font-size: 14px;
    }

    .parallel-headers {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }

    /* Single view layout */
    .verse-item {
      position: relative;
      padding: 6px 10px;
      border-radius: 6px;
      margin-bottom: 4px;
      transition: background 0.15s ease;
      display: flex;
      align-items: baseline;
      gap: 10px;
    }

    .verse-item:hover {
      background: var(--hover-bg);
    }

    .verse-num {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
      min-width: 22px;
      user-select: none;
      opacity: 0.85;
    }

    .verse-text {
      flex: 1;
    }

    .verse-actions {
      opacity: 0;
      transition: opacity 0.15s ease;
      display: inline-flex;
      gap: 4px;
    }

    .verse-item:hover .verse-actions,
    .verse-col:hover .verse-actions {
      opacity: 1;
    }

    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 13px;
      padding: 2px 4px;
      border-radius: 3px;
    }

    .action-btn:hover {
      background: var(--hover-bg);
    }

    /* Parallel view layout */
    .verse-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 8px 10px;
      border-radius: 6px;
      margin-bottom: 4px;
    }

    .verse-row:hover {
      background: var(--hover-bg);
    }

    .verse-col {
      display: flex;
      align-items: baseline;
      gap: 10px;
      position: relative;
    }

    .target-verse {
      background: var(--highlight) !important;
      border-left: 3px solid var(--accent);
    }

    .is-bookmarked .verse-num {
      color: #eab308;
    }

    /* Cross References Tray */
    .cross-ref-tray {
      margin: 6px 0 12px 32px;
      padding: 12px 16px;
      background: var(--card-bg);
      border-left: 3px solid var(--accent);
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 280px;
      overflow-y: auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .cross-ref-tray-title {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.85;
      color: var(--accent);
    }

    .cross-ref-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cross-ref-item {
      padding: 8px 12px;
      border-radius: 6px;
      background: var(--hover-bg);
      border: 1px solid var(--border);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .cross-ref-item:hover {
      border-color: var(--accent);
      background: var(--card-bg);
      transform: translateX(3px);
    }

    .cr-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .cr-citation {
      font-weight: 600;
      color: var(--accent);
      font-size: 12px;
    }

    .cr-anchor {
      font-size: 11px;
      font-style: italic;
      opacity: 0.75;
    }

    .cr-verse-text {
      font-size: 13px;
      line-height: 1.5;
      opacity: 0.95;
      font-style: italic;
    }

    .ref-pill {
      background: var(--hover-bg);
      border: 1px solid var(--border);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      color: var(--accent);
      transition: all 0.15s ease;
      user-select: none;
    }

    .ref-pill:hover {
      background: var(--accent);
      color: #ffffff;
      border-color: var(--accent);
    }

    .bottom-nav {
      display: flex;
      justify-content: space-between;
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }

    .font-controls {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 1px 3px;
    }

    .font-btn {
      border: none !important;
      background: transparent !important;
      padding: 3px 6px !important;
      font-size: 11px !important;
      font-weight: 600;
      border-radius: 3px;
      cursor: pointer;
    }

    .font-btn:hover {
      background: var(--hover-bg) !important;
      color: var(--accent);
    }

    .font-btn.btn-active {
      color: var(--accent);
      font-weight: 700;
    }

    .font-pill {
      border: none !important;
      background: transparent !important;
      padding: 3px 7px !important;
      font-size: 11px !important;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border-left: 1px solid var(--border) !important;
      border-right: 1px solid var(--border) !important;
      border-radius: 0 !important;
      cursor: pointer;
    }

    .font-pill:hover {
      background: var(--hover-bg) !important;
      color: var(--accent);
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="nav-controls">
      <button class="btn" onclick="prevChapter()" title="Previous Chapter">\u25C0 Prev</button>
      <div class="title-pill" onclick="openPicker()" title="Click to browse books and chapters">
        ${r} \u2014 Chapter ${this.currentChapter} \u25BE
      </div>
      <button class="btn" onclick="nextChapter()" title="Next Chapter">Next \u25B6</button>
    </div>

    <div class="view-controls">
      <label for="primary-trans" style="font-size:12px;opacity:0.8;">Primary:</label>
      <select id="primary-trans" onchange="changePrimary(this.value)">
        <option value="kjv" ${this.primaryTranslation==="kjv"?"selected":""}>English (KJB / KJV)</option>
        <option value="web" ${this.primaryTranslation==="web"?"selected":""}>English (WEB)</option>
        <option value="zulu" ${this.primaryTranslation==="zulu"?"selected":""}>isiZulu 1959</option>
      </select>

      <button class="btn ${this.isParallel?"btn-primary":""}" onclick="toggleParallel()" title="Toggle Side-by-Side Dual Translation View">
        ${this.isParallel?"Parallel: ON":"Parallel: OFF"}
      </button>

      ${this.isParallel?`
        <select id="parallel-trans" onchange="changeParallel(this.value)">
          <option value="zulu" ${this.parallelTranslation==="zulu"?"selected":""}>Parallel: isiZulu</option>
          <option value="web" ${this.parallelTranslation==="web"?"selected":""}>Parallel: WEB</option>
          <option value="kjv" ${this.parallelTranslation==="kjv"?"selected":""}>Parallel: KJB</option>
        </select>
      `:""}

      <div class="font-controls" title="Scripture Font Size">
        <button class="btn font-btn" onclick="adjustFontSize(-1)" title="Decrease font size (A-)">A\u2212</button>
        <button class="btn font-pill" onclick="promptFontSize()" title="Click to choose or customize font size">
          <span style="font-weight:700;">Aa</span>
          <span id="font-size-label">${f}</span>
        </button>
        <button class="btn font-btn" onclick="adjustFontSize(1)" title="Increase font size (A+)">A+</button>
        <button class="btn font-btn ${i===0?"btn-active":""}" onclick="resetFontSize()" title="Match VS Code Editor Font Size">Auto</button>
      </div>
    </div>
  </div>

  <div class="content-area">
    <div class="chapter-hero">
      <h1>${r}</h1>
      <div class="subtitle">Chapter ${this.currentChapter} of ${s}</div>
    </div>

    ${this.isParallel?`
      <div class="parallel-headers">
        <div>${this.primaryTranslation.toUpperCase()} Translation</div>
        <div>${this.parallelTranslation.toUpperCase()} Translation</div>
      </div>
    `:""}

    <div class="verses-container">
      ${l}
    </div>

    <div class="bottom-nav">
      <button class="btn" onclick="prevChapter()">\u25C0 Previous Chapter</button>
      <button class="btn" onclick="openPicker()">Jump to Book / Chapter</button>
      <button class="btn" onclick="nextChapter()">Next Chapter \u25B6</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function prevChapter() {
      vscode.postMessage({ command: 'prevChapter' });
    }

    function nextChapter() {
      vscode.postMessage({ command: 'nextChapter' });
    }

    function openPicker() {
      vscode.postMessage({ command: 'openBookPicker' });
    }

    function toggleParallel() {
      vscode.postMessage({ command: 'toggleParallel' });
    }

    function changePrimary(val) {
      vscode.postMessage({ command: 'setPrimaryTranslation', translation: val });
    }

    function changeParallel(val) {
      vscode.postMessage({ command: 'setParallelTranslation', translation: val });
    }

    function copyVerse(bookId, chapter, verse, translation) {
      vscode.postMessage({ command: 'copyVerse', bookId, chapter, verse, translation });
    }

    function bookmarkVerse(bookId, chapter, verse, translation) {
      vscode.postMessage({ command: 'bookmarkVerse', bookId, chapter, verse, translation });
    }

    function toggleCrossRefs(vNum) {
      const tray = document.getElementById('cross-tray-' + vNum);
      if (tray) {
        if (tray.style.display === 'none' || !tray.style.display) {
          tray.style.display = 'flex';
        } else {
          tray.style.display = 'none';
        }
      }
    }

    function jumpRef(ref) {
      vscode.postMessage({ command: 'jumpToReference', ref: ref });
    }

    function adjustFontSize(delta) {
      vscode.postMessage({ command: 'adjustFontSize', delta: delta });
    }

    function resetFontSize() {
      vscode.postMessage({ command: 'setFontSize', size: 0 });
    }

    function promptFontSize() {
      vscode.postMessage({ command: 'promptFontSize' });
    }

    // Auto-scroll to target verse if specified
    window.addEventListener('DOMContentLoaded', () => {
      ${this.currentVerseTarget?`
        const target = document.getElementById('verse-${this.currentVerseTarget}');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      `:""}
    });
  </script>
</body>
</html>`}dispose(){for(p.currentPanel=void 0,this.panel.dispose();this.disposables.length;){let e=this.disposables.pop();e&&e.dispose()}}};var D=V(require("vscode")),j=class{constructor(){this.statusBarItem=D.window.createStatusBarItem(D.StatusBarAlignment.Right,100),this.statusBarItem.command="dailyBread.menu"}getVerse(){return this.currentVerse}getIconSymbol(e){switch(e){case"cross":return"\u271D ";case"book":return"\u{1F4D6} ";case"dove":return"\u{1F54A}\uFE0F ";case"none":default:return""}}update(e,a,t,r=!1){this.currentVerse=e;let s=this.getIconSymbol(t),l=r?"\u2B50 ":"",d=`${e.translation==="zulu"?e.zuluBookName:e.bookName} ${e.chapter}:${e.verse}`,i="";switch(a){case"compact":i=`${l}${s}${d}`;break;case"preview":{let m=e.text.length>40?e.text.slice(0,37)+"...":e.text;i=`${l}${s}${d} \u2014 "${m}"`;break}case"full":i=`${l}${s}${d} \u2014 "${e.text}"`;break}this.statusBarItem.text=i,this.statusBarItem.tooltip=this.createTooltip(e,r),this.statusBarItem.show()}createTooltip(e,a){let t=new D.MarkdownString;t.isTrusted=!0,t.supportHtml=!0;let r=e.translation==="zulu"?e.zuluBookName:e.bookName,s=e.translation==="zulu"?"isiZulu (IBhayibheli Elingcwele 1959)":e.translation==="web"?"World English Bible (WEB)":"King James Version (KJV)",l=a?"$(star-full) Bookmarked":"$(star-empty) Bookmark",b=a?"command:dailyBread.removeCurrentBookmark":"command:dailyBread.bookmarkCurrent";if(t.appendMarkdown(`| \u{1F4D6} **${r} ${e.chapter}:${e.verse}** | \u{1F310} **${s}** |
| :----------------------------------------------------------------------------- | -------------------------------------------------------------------: |

`),t.appendMarkdown(`[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${l}](${b} "Save to favorites") &nbsp;&bull;&nbsp; [$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; [$(copy) Copy](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")

`),t.appendMarkdown(`---

`),t.appendMarkdown(`## \u{1F4D6} **${r} ${e.chapter}:${e.verse}**

`),t.appendMarkdown(`> ### **"${e.text}"**

`),e.parallelText&&e.parallelTranslation){let d=e.parallelTranslation==="zulu"?"isiZulu (1959)":e.parallelTranslation==="web"?"WEB":"KJB";t.appendMarkdown(`> **Parallel (${d}):** *"${e.parallelText}"*

`)}if(t.appendMarkdown(`---

`),e.chapterVerses&&e.chapterVerses.length>0){let d=e.chapterVerses.length;t.appendMarkdown(`### \u{1F4DC} Full Chapter: **${r} Chapter ${e.chapter}** (Verses 1 to ${d})

*Scroll up and down to read all verses in context:*  

`);for(let i=0;i<d;i++){let m=i+1,o=e.chapterVerses[i];m===e.verse?t.appendMarkdown(`\u{1F449} **<mark>&nbsp;[${m}] ${o}&nbsp;</mark>** *(Active Verse)*  

`):t.appendMarkdown(`**${m}.** ${o}  

`)}t.appendMarkdown(`---

`)}if(e.resolvedCrossReferences&&e.resolvedCrossReferences.length>0){let d=e.resolvedCrossReferences;t.appendMarkdown(`### \u{1F517} Cross-References & Scripture Connections (${d.length} Passages)

*Scriptures connected by Treasury of Scripture Knowledge (TSK):*  

`);for(let i of d){let m=e.translation==="zulu"?i.zuluBookName:i.bookName,o=i.endVerse?`-${i.endVerse}`:"",n=`${m} ${i.chapter}:${i.verse}${o}`,h=`command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([i.ref]))}`,u=i.anchor?` &nbsp;*(connecting theme: "${i.anchor}")*`:"";t.appendMarkdown(`* **[\u{1F4D6} ${n}](${h} "Jump to ${n}")**${u}  
`),t.appendMarkdown(`  > *"${i.text}"*

`)}t.appendMarkdown(`---

`)}else if(e.crossReferences&&e.crossReferences.length>0){let d=[],i=new Set;for(let m of e.crossReferences){for(let o of m.refs)if(!i.has(o)&&(i.add(o),d.push(o),d.length>=12))break;if(d.length>=12)break}if(d.length>0){let m=d.map(o=>`[\u{1F517} ${o}](command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([o]))} "Jump to ${o}")`).join(" &nbsp;&bull;&nbsp; ");t.appendMarkdown(`### \u{1F517} Cross-References:
${m}

---

`)}}return t.appendMarkdown(`### \u{1F9ED} Quick Navigation

[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${l}](${b} "Save to favorites") &nbsp;&bull;&nbsp; [$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; [$(copy) Copy Verse](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")
`),t}dispose(){this.statusBarItem.dispose()}};var $=V(require("vscode")),O=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new $.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(!e)return Promise.resolve([new N("Old Testament (Isivumelwano Esidala)","OT",$.TreeItemCollapsibleState.Expanded,"testament"),new N("New Testament (Isivumelwano Esisha)","NT",$.TreeItemCollapsibleState.Expanded,"testament")]);if(e.itemType==="testament"){let a=this.bibleManager.getBooks().filter(t=>t.testament===e.contextValue);return Promise.resolve(a.map(t=>new N(`${t.name} (${t.zuluName})`,t.id.toString(),$.TreeItemCollapsibleState.Collapsed,"book",t)))}if(e.itemType==="book"&&e.book){let a=[];for(let t=1;t<=e.book.chapters;t++){let r=new N(`Chapter ${t}`,`${e.book.id}:${t}`,$.TreeItemCollapsibleState.None,"chapter",e.book,t);r.command={command:"dailyBread.openReaderAt",title:"Read Chapter",arguments:[e.book.id,t]},a.push(r)}return Promise.resolve(a)}return Promise.resolve([])}},N=class extends $.TreeItem{constructor(a,t,r,s,l,b){super(a,r);this.label=a;this.idValue=t;this.collapsibleState=r;this.itemType=s;this.book=l;this.chapter=b;this.contextValue=s,s==="testament"?this.iconPath=new $.ThemeIcon("library"):s==="book"?(this.iconPath=new $.ThemeIcon("book"),this.description=`${l==null?void 0:l.chapters} ch`):s==="chapter"&&(this.iconPath=new $.ThemeIcon("file-text"))}};var C=V(require("vscode")),J=class{constructor(e){this.bookmarksManager=e;this._onDidChangeTreeData=new C.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event;this.bookmarksManager.onDidChangeBookmarks(()=>{this.refresh()})}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(e)return Promise.resolve([]);let a=this.bookmarksManager.getBookmarks();if(a.length===0){let t=new U("No bookmarks saved yet",C.TreeItemCollapsibleState.None,void 0);return t.description="Click \u2B50 on status bar or reader",Promise.resolve([t])}return Promise.resolve(a.map(t=>{let r=new U(`${t.bookName} ${t.chapter}:${t.verse}`,C.TreeItemCollapsibleState.None,t);return r.description=t.note?`\u{1F4DD} ${t.note}`:`"${t.text.slice(0,30)}..."`,r.tooltip=new C.MarkdownString(`**${t.bookName} ${t.chapter}:${t.verse}** (${t.translation.toUpperCase()})

> "${t.text}"

${t.note?"\u{1F4DD} Note: "+t.note:""}`),r.command={command:"dailyBread.openReaderAt",title:"Open Verse in Reader",arguments:[t.bookId,t.chapter,t.verse,t.translation]},r}))}},U=class extends C.TreeItem{constructor(a,t,r){super(a,t);this.label=a;this.collapsibleState=t;this.bookmark=r;r?(this.contextValue="bookmarkItem",this.iconPath=new C.ThemeIcon("star-full",new C.ThemeColor("charts.yellow"))):(this.contextValue="emptyBookmark",this.iconPath=new C.ThemeIcon("info"))}};var z=V(require("vscode")),G=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new z.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){let a=this.bibleManager.getCuratedTopics();if(!e)return Promise.resolve(Object.values(a).map(t=>{let r=new H(`${t.name} (${t.zuluName})`,z.TreeItemCollapsibleState.Collapsed,"topic",t);return r.description=`${t.verses.length} verses`,r.tooltip=t.description,r}));if(e.itemType==="topic"&&e.topic){let t=e.topic.verses.map(r=>{let s=this.bibleManager.getBook(r.bookId),l=`${(s==null?void 0:s.zuluName)||""} / ${(s==null?void 0:s.name)||""} ${r.chapter}:${r.verse}`,b=new H(l,z.TreeItemCollapsibleState.None,"verse",e.topic,r);return b.command={command:"dailyBread.openReaderAt",title:"Read Verse in Chapter",arguments:[r.bookId,r.chapter,r.verse]},b});return Promise.resolve(t)}return Promise.resolve([])}},H=class extends z.TreeItem{constructor(a,t,r,s,l){super(a,t);this.label=a;this.collapsibleState=t;this.itemType=r;this.topic=s;this.verse=l;this.contextValue=r,r==="topic"?this.iconPath=new z.ThemeIcon("tag"):this.iconPath=new z.ThemeIcon("quote")}};var v,w,x,P;function ce(p){v=new F(p.extensionPath),w=new A(p),x=new j;let e=new O(v);c.window.registerTreeDataProvider("dailyBreadExplorer",e);let a=new J(w);c.window.registerTreeDataProvider("dailyBreadBookmarks",a);let t=new G(v);c.window.registerTreeDataProvider("dailyBreadTopics",t);let r=()=>{let o=c.workspace.getConfiguration("dailyBread");return{translation:o.get("translation","kjv"),displayMode:o.get("displayMode","preview"),icon:o.get("icon","cross"),rotationSchedule:o.get("rotationSchedule","15min"),rotateOnFileSave:o.get("rotateOnFileSave",!1),topic:o.get("topic","all"),dualTranslation:o.get("dualTranslation","none"),fontSize:o.get("fontSize",0),fontFamily:o.get("fontFamily","editor")}},s=o=>{let n=r(),h=w.isBookmarked(o.bookId,o.chapter,o.verse);x.update(o,n.displayMode,n.icon,h)},l=r(),b=l.dualTranslation!=="none"?l.dualTranslation:void 0,d=v.getRandomVerse(l.topic,l.translation,b);s(d);let i=()=>{P&&(clearInterval(P),P=void 0);let o=r(),n=0;switch(o.rotationSchedule){case"5min":n=5*60*1e3;break;case"15min":n=15*60*1e3;break;case"30min":n=30*60*1e3;break;case"60min":n=60*60*1e3;break;default:n=0;break}n>0&&(P=setInterval(()=>{m()},n))},m=()=>{let o=r(),n=o.dualTranslation!=="none"?o.dualTranslation:void 0;d=x.getVerse()?v.getNextCuratedVerse(x.getVerse(),o.topic,o.translation,n):v.getRandomVerse(o.topic,o.translation,n),s(d)};i(),p.subscriptions.push(c.window.onDidChangeActiveTextEditor(o=>{o&&r().rotationSchedule==="onEditorOpen"&&m()})),p.subscriptions.push(c.workspace.onDidSaveTextDocument(()=>{r().rotateOnFileSave&&m()})),p.subscriptions.push(c.workspace.onDidChangeConfiguration(o=>{if(o.affectsConfiguration("dailyBread")||o.affectsConfiguration("editor.fontSize")||o.affectsConfiguration("editor.fontFamily")){i(),I.updateCurrent();let n=r();if(d){let h=n.dualTranslation!=="none"?n.dualTranslation:void 0,u=v.getVerse(d.bookId,d.chapter,d.verse,n.translation,h);u&&(d=u,s(d))}}})),p.subscriptions.push(c.commands.registerCommand("dailyBread.nextVerse",()=>{m()})),p.subscriptions.push(c.commands.registerCommand("dailyBread.openReader",()=>{let o=x.getVerse()||d,n=r();I.createOrShow(p.extensionUri,v,w,o.bookId,o.chapter,o.verse,n.translation)})),p.subscriptions.push(c.commands.registerCommand("dailyBread.readChapter",()=>{let o=x.getVerse()||d,n=r();I.createOrShow(p.extensionUri,v,w,o.bookId,o.chapter,o.verse,n.translation)})),p.subscriptions.push(c.commands.registerCommand("dailyBread.openReaderAt",(o,n,h,u)=>{let f=r();I.createOrShow(p.extensionUri,v,w,o,n,h,u||f.translation)})),p.subscriptions.push(c.commands.registerCommand("dailyBread.bookmarkCurrent",async()=>{let o=x.getVerse()||d;if(!o)return;let n=await c.window.showInputBox({prompt:"Add an optional personal note/thought for this verse (leave empty to skip):",placeHolder:"e.g. Remember this for tough days at work"}),h=await c.window.showInputBox({prompt:"Add tags separated by comma (optional):",placeHolder:"e.g. encouragement, coding, hope"}),u=h?h.split(",").map(f=>f.trim()).filter(f=>f.length>0):void 0;await w.addBookmark(o,n,u),s(o),c.window.showInformationMessage(`\u2B50 Bookmarked: ${o.translation==="zulu"?o.zuluBookName:o.bookName} ${o.chapter}:${o.verse}`)})),p.subscriptions.push(c.commands.registerCommand("dailyBread.removeCurrentBookmark",async()=>{let o=x.getVerse()||d;if(!o)return;let n=`${o.bookId}:${o.chapter}:${o.verse}:${o.translation}`;await w.removeBookmark(n),s(o),c.window.showInformationMessage("Bookmark removed.")})),p.subscriptions.push(c.commands.registerCommand("dailyBread.showBookmarks",async()=>{let o=w.getBookmarks();if(o.length===0){c.window.showInformationMessage("You have no saved bookmarks yet.");return}let n=o.map(u=>({label:`\u2B50 ${u.bookName} ${u.chapter}:${u.verse} (${u.translation.toUpperCase()})`,description:u.note?`\u{1F4DD} ${u.note}`:`"${u.text.slice(0,45)}..."`,detail:u.tags&&u.tags.length>0?`Tags: ${u.tags.map(f=>"#"+f).join(" ")}`:void 0,bookmark:u})),h=await c.window.showQuickPick(n,{placeHolder:"Select a saved bookmark to open in reader"});h&&I.createOrShow(p.extensionUri,v,w,h.bookmark.bookId,h.bookmark.chapter,h.bookmark.verse,h.bookmark.translation)})),p.subscriptions.push(c.commands.registerCommand("dailyBread.selectTopic",async()=>{let o=v.getCuratedTopics(),n=r(),h=[{label:"$(sparkle) All Scripture / Any Topic",description:"Cycle across all curated themes",topicId:"all"},...Object.values(o).map(f=>({label:`$(tag) ${f.name} (${f.zuluName})`,description:`${f.verses.length} verses \u2014 ${f.description}`,topicId:f.id}))],u=await c.window.showQuickPick(h,{placeHolder:"Select Scripture Topic / Mood for Status Bar Rotation"});u&&(await c.workspace.getConfiguration("dailyBread").update("topic",u.topicId,c.ConfigurationTarget.Global),m(),c.window.showInformationMessage(`Daily Bible topic set to: ${u.label}`))})),p.subscriptions.push(c.commands.registerCommand("dailyBread.switchTranslation",async()=>{let o=[{label:"\u{1F4DC} English \u2014 King James Bible / Version (KJB / KJV)",description:"Classic, majestic, traditional poetic English (1611/1769) [Default]",translation:"kjv"},{label:"\u{1F1EC}\u{1F1E7} English \u2014 World English Bible (WEB)",description:"Clean, modern, highly readable English public domain Bible",translation:"web"},{label:"\u{1F1FF}\u{1F1E6} isiZulu \u2014 IBhayibheli Elingcwele (1959)",description:"South African Zulu 1959 Translation with authentic Zulu book names",translation:"zulu"}],n=await c.window.showQuickPick(o,{placeHolder:"Choose Bible Translation"});if(n){await c.workspace.getConfiguration("dailyBread").update("translation",n.translation,c.ConfigurationTarget.Global);let h=r(),u=h.dualTranslation!=="none"?h.dualTranslation:void 0,f=x.getVerse()||d,k=v.getVerse(f.bookId,f.chapter,f.verse,n.translation,u);k&&(d=k,s(d)),c.window.showInformationMessage(`Active translation: ${n.label}`)}})),p.subscriptions.push(c.commands.registerCommand("dailyBread.jumpTo",async()=>{let o=await c.window.showInputBox({prompt:"Enter book & chapter/verse in English or isiZulu",placeHolder:"e.g. Joh 3:16, AmaHubo 23:1, Phil 4:13, Mathewu 6:33, Gen 1:1"});if(!o)return;let n=v.parseReference(o);if(!n){c.window.showErrorMessage(`Could not find reference: "${o}". Try format like "Joh 3:16" or "Hubo 23:1".`);return}let h=r(),u=n.verse||1,f=v.getVerse(n.book.id,n.chapter,u,h.translation);f&&(d=f,s(d)),I.createOrShow(p.extensionUri,v,w,n.book.id,n.chapter,n.verse,h.translation)})),p.subscriptions.push(c.commands.registerCommand("dailyBread.jumpToRef",o=>{if(!o)return;let n=v.parseReference(o);if(!n){c.window.showWarningMessage(`Could not resolve cross-reference: ${o}`);return}let h=r(),u=n.verse||1,f=v.getVerse(n.book.id,n.chapter,u,h.translation);f&&(d=f,s(d)),I.createOrShow(p.extensionUri,v,w,n.book.id,n.chapter,n.verse,h.translation)})),p.subscriptions.push(c.commands.registerCommand("dailyBread.showCrossReferences",async()=>{let o=x.getVerse()||d;if(!o)return;let n=r(),h=v.resolveCrossReferences(o.bookId,o.chapter,o.verse,n.translation,20);if(h.length===0){c.window.showInformationMessage(`No cross references indexed for ${o.bookName} ${o.chapter}:${o.verse}`);return}let u=h.map(k=>{let T=n.translation==="zulu"?k.zuluBookName:k.bookName,y=k.endVerse?`-${k.endVerse}`:"";return{label:`\u{1F517} ${T} ${k.chapter}:${k.verse}${y}`,description:k.anchor?`Phrase: "${k.anchor}"`:void 0,detail:`"${k.text}"`,refString:k.ref}}),f=await c.window.showQuickPick(u,{placeHolder:`Cross References with Scriptures for ${o.bookName} ${o.chapter}:${o.verse} (${u.length} passages)`});f&&c.commands.executeCommand("dailyBread.jumpToRef",f.refString)})),p.subscriptions.push(c.commands.registerCommand("dailyBread.randomChapter",()=>{let o=v.getBooks(),n=o[Math.floor(Math.random()*o.length)],h=Math.floor(Math.random()*n.chapters)+1,u=r();I.createOrShow(p.extensionUri,v,w,n.id,h,1,u.translation)})),p.subscriptions.push(c.commands.registerCommand("dailyBread.copyVerse",async()=>{let o=x.getVerse()||d;if(!o)return;let n=o.translation==="zulu"?o.zuluBookName:o.bookName,h=`"${o.text}" \u2014 ${n} ${o.chapter}:${o.verse} (${o.translation.toUpperCase()})`;await c.env.clipboard.writeText(h),c.window.showInformationMessage(`Copied: ${n} ${o.chapter}:${o.verse}`)})),p.subscriptions.push(c.commands.registerCommand("dailyBread.exportBookmarks",async()=>{let o=await c.window.showQuickPick([{label:"Markdown Document (.md)",format:"md"},{label:"JSON Dataset (.json)",format:"json"}],{placeHolder:"Choose Export Format"});if(!o)return;let n=o.format==="md"?w.exportBookmarksMarkdown():w.exportBookmarksJson(),h=await c.workspace.openTextDocument({content:n,language:o.format==="md"?"markdown":"json"});await c.window.showTextDocument(h)})),p.subscriptions.push(c.commands.registerCommand("dailyBread.deleteBookmarkItem",async o=>{o&&o.bookmark&&(await w.removeBookmark(o.bookmark.id),c.window.showInformationMessage("Bookmark removed."))})),p.subscriptions.push(c.commands.registerCommand("dailyBread.menu",async()=>{let o=x.getVerse()||d,n=w.isBookmarked(o.bookId,o.chapter,o.verse),h=o.translation==="zulu"?o.zuluBookName:o.bookName,u=[{label:"$(sync) Next Verse",description:"Ctrl+Alt+B / Cmd+Alt+B",detail:"Fetch next uplifting scripture into status bar"},{label:"$(book) Read Full Chapter in Editor",description:`${h} Chapter ${o.chapter}`,detail:"Open clean in-editor Bible tab with side-by-side translation option"},{label:"$(link) View Verse Cross-References",description:"Treasury of Scripture Knowledge",detail:"Explore connected passages and related scriptures for this verse"},{label:n?"$(star-full) Remove Bookmark":"$(star-empty) Bookmark Current Verse",description:`${h} ${o.chapter}:${o.verse}`,detail:n?"Remove from saved favorites":"Save verse with optional notes and tags"},{label:"$(bookmark) View All Bookmarks",description:`${w.getBookmarks().length} saved verses`,detail:"Browse, filter, and jump to your saved favorites"},{label:"$(tag) Select Topic / Mood",description:`Current: ${r().topic}`,detail:"Filter status bar by Peace, Focus, Strength, Joy, Gratitude, or Comfort"},{label:"$(text-size) Change Font Size",description:r().fontSize===0?`Auto / Match Editor (${c.workspace.getConfiguration("editor").get("fontSize",14)}px)`:`${r().fontSize}px`,detail:"Adjust scripture text size or sync automatically with VS Code editor font"},{label:"$(symbol-text) Change Font Family",description:`Current: ${r().fontFamily}`,detail:"Switch between Editor font, Book Serif, Clean Sans-Serif, or Monospace"},{label:"$(globe) Switch Translation",description:`Current: ${r().translation.toUpperCase()}`,detail:"Toggle between isiZulu 1959, English WEB, and English KJV"},{label:"$(search) Search & Jump to Verse",description:"Type any reference (e.g. Joh 3:16, Hubo 23:1)",detail:"Instantly jump to any chapter and verse in the Bible"},{label:"$(dice) Random Chapter",description:"Explore scripture unpredictably",detail:"Pick a random chapter from Genesis to Revelation"},{label:"$(clippy) Copy Verse to Clipboard",description:`${h} ${o.chapter}:${o.verse}`,detail:"Copy reference and scripture text formatted for sharing"},{label:"$(gear) Configure Extension Settings",description:"Icons, Display modes, Rotation intervals",detail:"Open Daily Bible settings in VS Code Preferences"}],f=await c.window.showQuickPick(u,{placeHolder:`\u{1F4D6} Daily Bible \u2014 ${h} ${o.chapter}:${o.verse}`});f&&(f.label.includes("Next Verse")?m():f.label.includes("Read Full Chapter")?c.commands.executeCommand("dailyBread.readChapter"):f.label.includes("View Verse Cross-References")?c.commands.executeCommand("dailyBread.showCrossReferences"):f.label.includes("Bookmark Current Verse")?c.commands.executeCommand("dailyBread.bookmarkCurrent"):f.label.includes("Remove Bookmark")?c.commands.executeCommand("dailyBread.removeCurrentBookmark"):f.label.includes("View All Bookmarks")?c.commands.executeCommand("dailyBread.showBookmarks"):f.label.includes("Select Topic")?c.commands.executeCommand("dailyBread.selectTopic"):f.label.includes("Change Font Size")?c.commands.executeCommand("dailyBread.changeFontSize"):f.label.includes("Change Font Family")?c.commands.executeCommand("dailyBread.changeFontFamily"):f.label.includes("Switch Translation")?c.commands.executeCommand("dailyBread.switchTranslation"):f.label.includes("Search & Jump")?c.commands.executeCommand("dailyBread.jumpTo"):f.label.includes("Random Chapter")?c.commands.executeCommand("dailyBread.randomChapter"):f.label.includes("Copy Verse")?c.commands.executeCommand("dailyBread.copyVerse"):f.label.includes("Configure Extension Settings")&&c.commands.executeCommand("workbench.action.openSettings","dailyBread"))})),p.subscriptions.push(c.commands.registerCommand("dailyBread.changeFontSize",async()=>{let o=c.workspace.getConfiguration("editor").get("fontSize",14),n=c.workspace.getConfiguration("dailyBread").get("fontSize",0),h=[{label:`$(sync) Auto \u2014 Match Editor Font (${o}px)`,description:n===0?"Currently Active":"Automatically syncs with editor.fontSize",size:0},{label:"$(text-size) Small (12px)",description:n===12?"Active":"",size:12},{label:"$(text-size) Compact (14px)",description:n===14?"Active":"",size:14},{label:"$(text-size) Medium (16px)",description:n===16?"Active":"",size:16},{label:"$(text-size) Large (18px)",description:n===18?"Active":"",size:18},{label:"$(text-size) Extra Large (22px)",description:n===22?"Active":"",size:22},{label:"$(text-size) Huge (26px)",description:n===26?"Active":"",size:26},{label:"$(edit) Custom Size...",description:"Type an exact pixel size",size:-1}],u=await c.window.showQuickPick(h,{placeHolder:`Select scripture font size (Current: ${n===0?`Auto / Match Editor (${o}px)`:`${n}px`})`});if(u)if(u.size===-1){let f=await c.window.showInputBox({prompt:"Enter scripture font size in pixels (10 - 48, or 0 for Auto / Match Editor)",value:n===0?o.toString():n.toString(),validateInput:k=>{let T=parseInt(k,10);return isNaN(T)||T<0||T>48?"Please enter a number between 10 and 48 (or 0 for Auto)":null}});if(f!==void 0){let k=parseInt(f,10);await c.workspace.getConfiguration("dailyBread").update("fontSize",k,c.ConfigurationTarget.Global),c.window.showInformationMessage(`Daily Bible font size set to ${k===0?`Auto / Match Editor (${o}px)`:`${k}px`}`)}}else await c.workspace.getConfiguration("dailyBread").update("fontSize",u.size,c.ConfigurationTarget.Global),c.window.showInformationMessage(`Daily Bible font size set to ${u.size===0?`Auto / Match Editor (${o}px)`:`${u.size}px`}`)})),p.subscriptions.push(c.commands.registerCommand("dailyBread.changeFontFamily",async()=>{let o=c.workspace.getConfiguration("editor").get("fontFamily","monospace"),n=c.workspace.getConfiguration("dailyBread").get("fontFamily","editor"),h=[{label:"$(editor) Match Editor Font",description:n==="editor"?"Currently Active":o,detail:"Syncs automatically with your active VS Code code editor font",family:"editor"},{label:"$(book) Book Serif",description:n==="serif"?"Currently Active":"Georgia, Garamond, Times New Roman, serif",detail:"Classic, warm editorial book typesetting",family:"serif"},{label:"$(symbol-text) Clean Sans-Serif",description:n==="sans-serif"?"Currently Active":"Segoe UI, -apple-system, Roboto, sans-serif",detail:"Modern crisp user interface typography",family:"sans-serif"},{label:"$(terminal) Monospace Code Font",description:n==="monospace"?"Currently Active":"Consolas, Courier New, monospace",detail:"Fixed-width developer aesthetic",family:"monospace"},{label:"$(device-desktop) System Default",description:n==="system"?"Currently Active":"Operating system native font",detail:"Native OS font rendering",family:"system"}],u=await c.window.showQuickPick(h,{placeHolder:`Select Bible reader font family (Current: ${n})`});u&&(await c.workspace.getConfiguration("dailyBread").update("fontFamily",u.family,c.ConfigurationTarget.Global),c.window.showInformationMessage(`Daily Bible font family set to: ${u.label.replace(/\$\([^)]+\)\s*/,"")}`))})),p.subscriptions.push(x)}function le(){P&&(clearInterval(P),P=void 0)}0&&(module.exports={activate,deactivate});
