"use strict";var L=Object.create;var P=Object.defineProperty;var Q=Object.getOwnPropertyDescriptor;var Y=Object.getOwnPropertyNames;var Z=Object.getPrototypeOf,_=Object.prototype.hasOwnProperty;var q=(l,e)=>{for(var a in e)P(l,a,{get:e[a],enumerable:!0})},W=(l,e,a,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of Y(e))!_.call(l,r)&&r!==a&&P(l,r,{get:()=>e[r],enumerable:!(t=Q(e,r))||t.enumerable});return l};var I=(l,e,a)=>(a=l!=null?L(Z(l)):{},W(e||!l||!l.__esModule?P(a,"default",{value:l,enumerable:!0}):a,l)),X=l=>W(P({},"__esModule",{value:!0}),l);var oe={};q(oe,{activate:()=>ee,deactivate:()=>te});module.exports=X(oe);var d=I(require("vscode"));var $=I(require("fs")),C=I(require("path")),D=class{dataDir;books=[];booksById=new Map;aliasMap=new Map;topics={};cache=new Map;crossRefCache=new Map;curatedVerseList=[];constructor(e){let a=[C.join(e,"data"),C.join(e,"..","data"),C.resolve(__dirname,"..","data"),C.resolve(__dirname,"data"),C.resolve(process.cwd(),"data")],t=a[0];for(let r of a)if($.existsSync(C.join(r,"books.json"))){t=r;break}this.dataDir=t,this.loadMetadata()}loadMetadata(){let e=C.join(this.dataDir,"books.json");if($.existsSync(e)){this.books=JSON.parse($.readFileSync(e,"utf8"));for(let t of this.books)this.booksById.set(t.id,t),this.indexBookAliases(t)}let a=C.join(this.dataDir,"curated_topics.json");if($.existsSync(a)){this.topics=JSON.parse($.readFileSync(a,"utf8"));let t=new Set;for(let r of Object.values(this.topics))for(let s of r.verses){let c=`${s.bookId}:${s.chapter}:${s.verse}`;t.has(c)||(t.add(c),this.curatedVerseList.push(s))}}}normalizeText(e){return e.toLowerCase().replace(/[\u2018\u2019\u201C\u201D'"`\-_—–:.,;!]/g,"").replace(/\s+/g," ").trim()}indexBookAliases(e){let a=r=>{let s=this.normalizeText(r);s&&this.aliasMap.set(s,e)};a(e.name),a(e.zuluName),a(e.code);for(let r of e.aliases)a(r);let t=["u-","u","ku","kuma","kwabase","eka","aba","ama","izi","isi","um"];for(let r of t){let s=e.zuluName.toLowerCase();s.startsWith(r)&&s.length>r.length+2&&a(s.slice(r.length))}}getBooks(){return this.books}getBook(e){return this.booksById.get(e)}getCuratedTopics(){return this.topics}findBook(e){let a=this.normalizeText(e);if(!a)return;if(this.aliasMap.has(a))return this.aliasMap.get(a);let t=a.replace(/\s+/g,"");for(let[r,s]of this.aliasMap.entries())if(r.replace(/\s+/g,"")===t)return s;for(let[r,s]of this.aliasMap.entries())if(r.startsWith(a)||a.startsWith(r))return s;if(a.length>=3){for(let[r,s]of this.aliasMap.entries())if(r.includes(a)||a.includes(r))return s}}parseReference(e){let a=e.trim();if(!a)return;let t=a.match(/^([1-3]?\s*[A-Za-z\-]+)\s*(\d+)(?:[:.\s](\d+))?$/);if(!t){let p=a.match(/^([1-3]?\s*[\p{L}\-]+)\s*(\d+)(?:[:.\s](\d+))?$/u);if(!p)return;let n=p[1].trim(),k=parseInt(p[2],10),o=p[3]?parseInt(p[3],10):void 0,i=this.findBook(n);return i?{book:i,chapter:k,verse:o}:void 0}let r=t[1].trim(),s=parseInt(t[2],10),c=t[3]?parseInt(t[3],10):void 0,h=this.findBook(r);if(h&&!(s<1||s>h.chapters))return{book:h,chapter:s,verse:c}}loadBookChapters(e,a){let t=`${a}:${e}`;if(this.cache.has(t))return this.cache.get(t);let r=C.join(this.dataDir,"translations",a,`${e}.json`);if(!$.existsSync(r))return[];try{let s=JSON.parse($.readFileSync(r,"utf8"));return this.cache.set(t,s),s}catch{return[]}}loadBookCrossReferences(e){if(this.crossRefCache.has(e))return this.crossRefCache.get(e);let a=C.join(this.dataDir,"cross_references",`${e}.json`);if(!$.existsSync(a))return{};try{let t=JSON.parse($.readFileSync(a,"utf8"));return this.crossRefCache.set(e,t),t}catch{return{}}}getCrossReferences(e,a,t){let r=this.loadBookCrossReferences(e);return r[a.toString()]&&r[a.toString()][t.toString()]||[]}getFlattenedCrossReferences(e,a,t){let r=this.getCrossReferences(e,a,t),s=new Set;for(let c of r)for(let h of c.refs)s.add(h);return Array.from(s)}getChapter(e,a,t){let r=this.loadBookChapters(e,t);return a<1||a>r.length?[]:r[a-1]||[]}getVerse(e,a,t,r,s){let c=this.getBook(e);if(!c)return;let h=this.getChapter(e,a,r);if(t<1||t>h.length)return;let p=h[t-1],n;if(s&&s!==r){let o=this.getChapter(e,a,s);t>=1&&t<=o.length&&(n=o[t-1])}let k=this.getCrossReferences(e,a,t);return{bookId:e,bookName:c.name,zuluBookName:c.zuluName,chapter:a,verse:t,text:p,translation:r,parallelText:n,parallelTranslation:s&&s!==r?s:void 0,crossReferences:k.length>0?k:void 0}}getRandomVerse(e,a="kjv",t){let r=[];e&&e!=="all"&&this.topics[e]?r=this.topics[e].verses:r=this.curatedVerseList,r.length===0&&(r=[{bookId:43,chapter:3,verse:16}]);let s=Math.floor(Math.random()*r.length),c=r[s],h=this.getVerse(c.bookId,c.chapter,c.verse,a,t);return h||{bookId:43,bookName:"John",zuluBookName:"UJohane",chapter:3,verse:16,text:"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",translation:a}}getNextCuratedVerse(e,a,t="kjv",r){let s=[];if(a&&a!=="all"&&this.topics[a]?s=this.topics[a].verses:s=this.curatedVerseList,s.length===0)return this.getRandomVerse(a,t,r);let h=(s.findIndex(n=>n.bookId===e.bookId&&n.chapter===e.chapter&&n.verse===e.verse)+1)%s.length,p=s[h];return this.getVerse(p.bookId,p.chapter,p.verse,t,r)||this.getRandomVerse(a,t,r)}getNextSequentialVerse(e,a="kjv",t){let r=this.getBook(e.bookId);if(!r)return this.getRandomVerse(void 0,a,t);let s=this.getChapter(e.bookId,e.chapter,a);if(e.verse<s.length)return this.getVerse(e.bookId,e.chapter,e.verse+1,a,t);if(e.chapter<r.chapters)return this.getVerse(e.bookId,e.chapter+1,1,a,t);let c=e.bookId%66+1;return this.getVerse(c,1,1,a,t)}};var K=I(require("vscode")),E=class l{static STORAGE_KEY="dailyBread.bookmarks";context;onDidChangeEmitter=new K.EventEmitter;onDidChangeBookmarks=this.onDidChangeEmitter.event;constructor(e){this.context=e}getBookmarks(){return[...this.context.globalState.get(l.STORAGE_KEY,[])].sort((a,t)=>t.createdAt-a.createdAt)}isBookmarked(e,a,t){return this.getBookmarks().some(s=>s.bookId===e&&s.chapter===a&&s.verse===t)}getBookmark(e){return this.getBookmarks().find(a=>a.id===e)}async addBookmark(e,a,t){let r=this.getBookmarks(),s=`${e.bookId}:${e.chapter}:${e.verse}:${e.translation}`,c=r.filter(n=>n.id!==s),h=e.translation==="zulu"?e.zuluBookName:e.bookName,p={id:s,bookId:e.bookId,chapter:e.chapter,verse:e.verse,translation:e.translation,text:e.text,bookName:h,createdAt:Date.now(),note:a,tags:t};return c.unshift(p),await this.context.globalState.update(l.STORAGE_KEY,c),this.onDidChangeEmitter.fire(),p}async removeBookmark(e){let t=this.getBookmarks().filter(r=>r.id!==e);await this.context.globalState.update(l.STORAGE_KEY,t),this.onDidChangeEmitter.fire()}async updateBookmark(e,a,t){let r=this.getBookmarks(),s=r.find(c=>c.id===e);s&&(a!==void 0&&(s.note=a),t!==void 0&&(s.tags=t),await this.context.globalState.update(l.STORAGE_KEY,r),this.onDidChangeEmitter.fire())}exportBookmarksMarkdown(){let e=this.getBookmarks();if(e.length===0)return`# Daily Bible Bookmarks

No bookmarks saved yet.`;let a=`# \u{1F4D6} Daily Bible \u2014 Saved Bookmarks & Favorites

`;a+=`*Exported on ${new Date().toLocaleDateString()}*

---

`;for(let t of e){let r=new Date(t.createdAt).toLocaleDateString();a+=`### ${t.bookName} ${t.chapter}:${t.verse} (${t.translation.toUpperCase()})
`,a+=`> "${t.text}"

`,t.note&&(a+=`\u{1F4DD} **Note:** ${t.note}

`),t.tags&&t.tags.length>0&&(a+=`\u{1F3F7}\uFE0F **Tags:** ${t.tags.map(s=>"`#"+s+"`").join(" ")}

`),a+=`*Saved on ${r}*

---

`}return a}exportBookmarksJson(){return JSON.stringify(this.getBookmarks(),null,2)}async importBookmarks(e){try{let a=JSON.parse(e);if(!Array.isArray(a))return 0;let t=this.getBookmarks(),r=new Set(t.map(c=>c.id)),s=0;for(let c of a)if(c.bookId&&c.chapter&&c.verse&&c.text){let h=c.id||`${c.bookId}:${c.chapter}:${c.verse}:${c.translation||"zulu"}`;r.has(h)||(t.push({...c,id:h,createdAt:c.createdAt||Date.now()}),r.add(h),s++)}return await this.context.globalState.update(l.STORAGE_KEY,t),this.onDidChangeEmitter.fire(),s}catch{return 0}}};var f=I(require("vscode")),T=class l{static currentPanel;panel;extensionUri;bibleManager;bookmarksManager;disposables=[];currentBookId=43;currentChapter=3;currentVerseTarget=16;primaryTranslation="kjv";parallelTranslation="zulu";isParallel=!1;constructor(e,a,t,r,s=43,c=3,h,p="kjv"){this.panel=e,this.extensionUri=a,this.bibleManager=t,this.bookmarksManager=r,this.currentBookId=s,this.currentChapter=c,this.currentVerseTarget=h,this.primaryTranslation=p,this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.webview.onDidReceiveMessage(async n=>{switch(n.command){case"prevChapter":this.goToPreviousChapter();break;case"nextChapter":this.goToNextChapter();break;case"setChapter":this.currentChapter=n.chapter,this.currentVerseTarget=void 0,this.update();break;case"setBookAndChapter":this.currentBookId=n.bookId,this.currentChapter=n.chapter,this.currentVerseTarget=n.verse,this.update();break;case"toggleParallel":this.isParallel=!this.isParallel,this.update();break;case"setPrimaryTranslation":this.primaryTranslation=n.translation,this.update();break;case"setParallelTranslation":this.parallelTranslation=n.translation,this.update();break;case"copyVerse":{let k=this.bibleManager.getVerse(n.bookId,n.chapter,n.verse,n.translation);if(k){let o=n.translation==="zulu"?k.zuluBookName:k.bookName,i=`"${k.text}" \u2014 ${o} ${n.chapter}:${n.verse} (${n.translation.toUpperCase()})`;await f.env.clipboard.writeText(i),f.window.showInformationMessage(`Copied: ${o} ${n.chapter}:${n.verse}`)}break}case"bookmarkVerse":{let k=this.bibleManager.getVerse(n.bookId,n.chapter,n.verse,n.translation);if(k){if(this.bookmarksManager.isBookmarked(n.bookId,n.chapter,n.verse)){let o=`${n.bookId}:${n.chapter}:${n.verse}:${n.translation}`;await this.bookmarksManager.removeBookmark(o),f.window.showInformationMessage("Bookmark removed.")}else await this.bookmarksManager.addBookmark(k),f.window.showInformationMessage(`\u2B50 Bookmarked: ${k.bookName} ${n.chapter}:${n.verse}`);this.update()}break}case"openBookPicker":this.showBookPicker();break;case"jumpToReference":{if(n.ref){let k=this.bibleManager.parseReference(n.ref);k?this.navigate(k.book.id,k.chapter,k.verse,this.primaryTranslation):f.window.showInformationMessage(`Could not resolve cross-reference: ${n.ref}`)}break}}},null,this.disposables)}static createOrShow(e,a,t,r=43,s=3,c,h="kjv"){let p=f.window.activeTextEditor?f.window.activeTextEditor.viewColumn:void 0;if(l.currentPanel)return l.currentPanel.panel.reveal(p),l.currentPanel.navigate(r,s,c,h),l.currentPanel;let n=f.window.createWebviewPanel("dailyBreadReader","Daily Bible Reader",p||f.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0,localResourceRoots:[f.Uri.joinPath(e,"media")]});return l.currentPanel=new l(n,e,a,t,r,s,c,h),l.currentPanel}navigate(e,a,t,r){this.currentBookId=e,this.currentChapter=a,this.currentVerseTarget=t,r&&(this.primaryTranslation=r),this.update()}goToPreviousChapter(){if(this.bibleManager.getBook(this.currentBookId)){if(this.currentChapter>1)this.currentChapter--;else if(this.currentBookId>1){this.currentBookId--;let a=this.bibleManager.getBook(this.currentBookId);this.currentChapter=a?a.chapters:1}this.currentVerseTarget=void 0,this.update()}}goToNextChapter(){let e=this.bibleManager.getBook(this.currentBookId);e&&(this.currentChapter<e.chapters?this.currentChapter++:this.currentBookId<66&&(this.currentBookId++,this.currentChapter=1),this.currentVerseTarget=void 0,this.update())}async showBookPicker(){let a=this.bibleManager.getBooks().map(c=>({label:this.primaryTranslation==="zulu"?`${c.zuluName} (${c.name})`:`${c.name} (${c.zuluName})`,description:`${c.testament} \u2022 ${c.chapters} chapters`,book:c})),t=await f.window.showQuickPick(a,{placeHolder:"Select a Book to Read (e.g. USenesisi, AmaHubo, UJohane, Romans)"});if(!t)return;let r=Array.from({length:t.book.chapters},(c,h)=>({label:`Chapter ${h+1}`,chapter:h+1})),s=await f.window.showQuickPick(r,{placeHolder:`Select Chapter (1 to ${t.book.chapters})`});s&&(this.currentBookId=t.book.id,this.currentChapter=s.chapter,this.currentVerseTarget=void 0,this.update())}update(){let e=this.bibleManager.getBook(this.currentBookId);if(!e)return;let a=this.primaryTranslation==="zulu"?e.zuluName:e.name;this.panel.title=`\u{1F4D6} ${a} ${this.currentChapter}`,this.panel.webview.html=this.getHtmlContent(e)}getHtmlContent(e){let a=this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.primaryTranslation),t=this.isParallel?this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.parallelTranslation):[],r=this.primaryTranslation==="zulu"?`${e.zuluName} (${e.name})`:`${e.name} (${e.zuluName})`,s=e.chapters,c="",h=Math.max(a.length,t.length);for(let p=0;p<h;p++){let n=p+1,k=a[p]||"",o=t[p]||"",i=this.bookmarksManager.isBookmarked(e.id,this.currentChapter,n),b=this.currentVerseTarget===n?"target-verse":"",u=i?"is-bookmarked":"",V=this.bibleManager.getCrossReferences(e.id,this.currentChapter,n),U=V.length>0,H="";U&&(H=`
          <div class="cross-ref-tray" id="cross-tray-${n}" style="display:none;">
            ${V.map(F=>`
              <div class="anchor-row">
                <span class="anchor-tag">\u{1F517} "${F.anchor}":</span>
                ${F.refs.map(G=>`<span class="ref-pill" onclick="jumpRef('${G}')">${G}</span>`).join("")}
              </div>
            `).join("")}
          </div>
        `),this.isParallel?c+=`
          <div class="verse-row ${b}" id="verse-${n}">
            <div class="verse-col primary-col ${u}">
              <span class="verse-num">${n}</span>
              <span class="verse-text">${k}</span>
              <div class="verse-actions">
                ${U?`<button title="Cross References" class="action-btn" onclick="toggleCrossRefs(${n})">\u{1F517}</button>`:""}
                <button title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${n}, '${this.primaryTranslation}')">${i?"\u2B50":"\u2606"}</button>
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${n}, '${this.primaryTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
            <div class="verse-col parallel-col">
              <span class="verse-num">${n}</span>
              <span class="verse-text">${o}</span>
              <div class="verse-actions">
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${n}, '${this.parallelTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
          </div>
          ${H}
        `:c+=`
          <div class="verse-item ${b} ${u}" id="verse-${n}">
            <span class="verse-num">${n}</span>
            <span class="verse-text">${k}</span>
            <span class="verse-actions">
              ${U?`<button class="action-btn" title="View Cross References" onclick="toggleCrossRefs(${n})">\u{1F517}</button>`:""}
              <button class="action-btn" title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${n}, '${this.primaryTranslation}')">${i?"\u2B50":"\u2606"}</button>
              <button class="action-btn" title="Copy Verse" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${n}, '${this.primaryTranslation}')">\u{1F4CB}</button>
            </span>
          </div>
          ${H}
        `}return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${r} ${this.currentChapter}</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Georgia, serif);
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
      margin: 0;
      padding: 0;
      line-height: 1.7;
      font-size: 15px;
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
      margin: 4px 0 10px 32px;
      padding: 10px 14px;
      background: var(--card-bg);
      border-left: 3px solid var(--accent);
      border-radius: 0 6px 6px 0;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .anchor-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }

    .anchor-tag {
      font-weight: 600;
      font-style: italic;
      color: var(--fg);
      opacity: 0.85;
      font-size: 12px;
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
      ${c}
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
</html>`}dispose(){for(l.currentPanel=void 0,this.panel.dispose();this.disposables.length;){let e=this.disposables.pop();e&&e.dispose()}}};var S=I(require("vscode")),N=class{statusBarItem;currentVerse;constructor(){this.statusBarItem=S.window.createStatusBarItem(S.StatusBarAlignment.Right,100),this.statusBarItem.command="dailyBread.menu"}getVerse(){return this.currentVerse}getIconSymbol(e){switch(e){case"cross":return"\u271D ";case"book":return"\u{1F4D6} ";case"dove":return"\u{1F54A}\uFE0F ";default:return""}}update(e,a,t,r=!1){this.currentVerse=e;let s=this.getIconSymbol(t),c=r?"\u2B50 ":"",p=`${e.translation==="zulu"?e.zuluBookName:e.bookName} ${e.chapter}:${e.verse}`,n="";switch(a){case"compact":n=`${c}${s}${p}`;break;case"preview":{let k=e.text.length>40?e.text.slice(0,37)+"...":e.text;n=`${c}${s}${p} \u2014 "${k}"`;break}case"full":n=`${c}${s}${p} \u2014 "${e.text}"`;break}this.statusBarItem.text=n,this.statusBarItem.tooltip=this.createTooltip(e,r),this.statusBarItem.show()}createTooltip(e,a){let t=new S.MarkdownString;t.isTrusted=!0,t.supportHtml=!0;let r=e.translation==="zulu"?e.zuluBookName:e.bookName,s=e.translation==="zulu"?"isiZulu (IBhayibheli Elingcwele 1959)":e.translation==="web"?"World English Bible (WEB)":"King James Version (KJV)";if(t.appendMarkdown(`### \u{1F4D6} **${r} ${e.chapter}:${e.verse}**

`),t.appendMarkdown(`*${s}*

`),t.appendMarkdown(`---

`),t.appendMarkdown(`> *"${e.text}"*

`),e.parallelText&&e.parallelTranslation){let p=e.parallelTranslation==="zulu"?"isiZulu (1959)":e.parallelTranslation==="web"?"WEB":"KJB";t.appendMarkdown(`**Parallel (${p}):**
`),t.appendMarkdown(`> *"${e.parallelText}"*

`)}if(e.crossReferences&&e.crossReferences.length>0){let p=[],n=new Set;for(let k of e.crossReferences){for(let o of k.refs)if(!n.has(o)&&(n.add(o),p.push(o),p.length>=5))break;if(p.length>=5)break}if(p.length>0){let k=p.map(o=>`[\u{1F517} ${o}](command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([o]))} "Jump to ${o}")`).join(" &nbsp;&bull;&nbsp; ");t.appendMarkdown(`**Cross-References:**
${k}

`)}}t.appendMarkdown(`---

`);let c=a?"$(star-full) Bookmarked":"$(star-empty) Bookmark",h=a?"command:dailyBread.removeCurrentBookmark":"command:dailyBread.bookmarkCurrent";return t.appendMarkdown(`[$(sync) Next Verse](command:dailyBread.nextVerse "Get next rotating verse") &nbsp;&bull;&nbsp; [$(book) Open Chapter](command:dailyBread.readChapter "Read full chapter in editor") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs](command:dailyBread.showCrossReferences "View verse cross-references") &nbsp;&bull;&nbsp; [${c}](${h} "Save to favorites") &nbsp;&bull;&nbsp; [$(copy) Copy](command:dailyBread.copyVerse "Copy scripture to clipboard")`),t}dispose(){this.statusBarItem.dispose()}};var y=I(require("vscode")),z=class{constructor(e){this.bibleManager=e}bibleManager;_onDidChangeTreeData=new y.EventEmitter;onDidChangeTreeData=this._onDidChangeTreeData.event;refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(!e)return Promise.resolve([new R("Old Testament (Isivumelwano Esidala)","OT",y.TreeItemCollapsibleState.Expanded,"testament"),new R("New Testament (Isivumelwano Esisha)","NT",y.TreeItemCollapsibleState.Expanded,"testament")]);if(e.itemType==="testament"){let a=this.bibleManager.getBooks().filter(t=>t.testament===e.contextValue);return Promise.resolve(a.map(t=>new R(`${t.name} (${t.zuluName})`,t.id.toString(),y.TreeItemCollapsibleState.Collapsed,"book",t)))}if(e.itemType==="book"&&e.book){let a=[];for(let t=1;t<=e.book.chapters;t++){let r=new R(`Chapter ${t}`,`${e.book.id}:${t}`,y.TreeItemCollapsibleState.None,"chapter",e.book,t);r.command={command:"dailyBread.openReaderAt",title:"Read Chapter",arguments:[e.book.id,t]},a.push(r)}return Promise.resolve(a)}return Promise.resolve([])}},R=class extends y.TreeItem{constructor(a,t,r,s,c,h){super(a,r);this.label=a;this.idValue=t;this.collapsibleState=r;this.itemType=s;this.book=c;this.chapter=h;this.contextValue=s,s==="testament"?this.iconPath=new y.ThemeIcon("library"):s==="book"?(this.iconPath=new y.ThemeIcon("book"),this.description=`${c?.chapters} ch`):s==="chapter"&&(this.iconPath=new y.ThemeIcon("file-text"))}label;idValue;collapsibleState;itemType;book;chapter};var w=I(require("vscode")),j=class{constructor(e){this.bookmarksManager=e;this.bookmarksManager.onDidChangeBookmarks(()=>{this.refresh()})}bookmarksManager;_onDidChangeTreeData=new w.EventEmitter;onDidChangeTreeData=this._onDidChangeTreeData.event;refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(e)return Promise.resolve([]);let a=this.bookmarksManager.getBookmarks();if(a.length===0){let t=new A("No bookmarks saved yet",w.TreeItemCollapsibleState.None,void 0);return t.description="Click \u2B50 on status bar or reader",Promise.resolve([t])}return Promise.resolve(a.map(t=>{let r=new A(`${t.bookName} ${t.chapter}:${t.verse}`,w.TreeItemCollapsibleState.None,t);return r.description=t.note?`\u{1F4DD} ${t.note}`:`"${t.text.slice(0,30)}..."`,r.tooltip=new w.MarkdownString(`**${t.bookName} ${t.chapter}:${t.verse}** (${t.translation.toUpperCase()})

> "${t.text}"

${t.note?"\u{1F4DD} Note: "+t.note:""}`),r.command={command:"dailyBread.openReaderAt",title:"Open Verse in Reader",arguments:[t.bookId,t.chapter,t.verse,t.translation]},r}))}},A=class extends w.TreeItem{constructor(a,t,r){super(a,t);this.label=a;this.collapsibleState=t;this.bookmark=r;r?(this.contextValue="bookmarkItem",this.iconPath=new w.ThemeIcon("star-full",new w.ThemeColor("charts.yellow"))):(this.contextValue="emptyBookmark",this.iconPath=new w.ThemeIcon("info"))}label;collapsibleState;bookmark};var x=I(require("vscode")),O=class{constructor(e){this.bibleManager=e}bibleManager;_onDidChangeTreeData=new x.EventEmitter;onDidChangeTreeData=this._onDidChangeTreeData.event;refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){let a=this.bibleManager.getCuratedTopics();if(!e)return Promise.resolve(Object.values(a).map(t=>{let r=new J(`${t.name} (${t.zuluName})`,x.TreeItemCollapsibleState.Collapsed,"topic",t);return r.description=`${t.verses.length} verses`,r.tooltip=t.description,r}));if(e.itemType==="topic"&&e.topic){let t=e.topic.verses.map(r=>{let s=this.bibleManager.getBook(r.bookId),c=`${s?.zuluName||""} / ${s?.name||""} ${r.chapter}:${r.verse}`,h=new J(c,x.TreeItemCollapsibleState.None,"verse",e.topic,r);return h.command={command:"dailyBread.openReaderAt",title:"Read Verse in Chapter",arguments:[r.bookId,r.chapter,r.verse]},h});return Promise.resolve(t)}return Promise.resolve([])}},J=class extends x.TreeItem{constructor(a,t,r,s,c){super(a,t);this.label=a;this.collapsibleState=t;this.itemType=r;this.topic=s;this.verse=c;this.contextValue=r,r==="topic"?this.iconPath=new x.ThemeIcon("tag"):this.iconPath=new x.ThemeIcon("quote")}label;collapsibleState;itemType;topic;verse};var v,g,B,M;function ee(l){v=new D(l.extensionPath),g=new E(l),B=new N;let e=new z(v);d.window.registerTreeDataProvider("dailyBreadExplorer",e);let a=new j(g);d.window.registerTreeDataProvider("dailyBreadBookmarks",a);let t=new O(v);d.window.registerTreeDataProvider("dailyBreadTopics",t);let r=()=>{let o=d.workspace.getConfiguration("dailyBread");return{translation:o.get("translation","kjv"),displayMode:o.get("displayMode","preview"),icon:o.get("icon","cross"),rotationSchedule:o.get("rotationSchedule","15min"),rotateOnFileSave:o.get("rotateOnFileSave",!1),topic:o.get("topic","all"),dualTranslation:o.get("dualTranslation","none")}},s=o=>{let i=r(),m=g.isBookmarked(o.bookId,o.chapter,o.verse);B.update(o,i.displayMode,i.icon,m)},c=r(),h=c.dualTranslation!=="none"?c.dualTranslation:void 0,p=v.getRandomVerse(c.topic,c.translation,h);s(p);let n=()=>{M&&(clearInterval(M),M=void 0);let o=r(),i=0;switch(o.rotationSchedule){case"5min":i=300*1e3;break;case"15min":i=900*1e3;break;case"30min":i=1800*1e3;break;case"60min":i=3600*1e3;break;default:i=0;break}i>0&&(M=setInterval(()=>{k()},i))},k=()=>{let o=r(),i=o.dualTranslation!=="none"?o.dualTranslation:void 0;p=B.getVerse()?v.getNextCuratedVerse(B.getVerse(),o.topic,o.translation,i):v.getRandomVerse(o.topic,o.translation,i),s(p)};n(),l.subscriptions.push(d.window.onDidChangeActiveTextEditor(o=>{o&&r().rotationSchedule==="onEditorOpen"&&k()})),l.subscriptions.push(d.workspace.onDidSaveTextDocument(()=>{r().rotateOnFileSave&&k()})),l.subscriptions.push(d.workspace.onDidChangeConfiguration(o=>{if(o.affectsConfiguration("dailyBread")){n();let i=r();if(p){let m=i.dualTranslation!=="none"?i.dualTranslation:void 0,b=v.getVerse(p.bookId,p.chapter,p.verse,i.translation,m);b&&(p=b,s(p))}}})),l.subscriptions.push(d.commands.registerCommand("dailyBread.nextVerse",()=>{k()})),l.subscriptions.push(d.commands.registerCommand("dailyBread.openReader",()=>{let o=B.getVerse()||p,i=r();T.createOrShow(l.extensionUri,v,g,o.bookId,o.chapter,o.verse,i.translation)})),l.subscriptions.push(d.commands.registerCommand("dailyBread.readChapter",()=>{let o=B.getVerse()||p,i=r();T.createOrShow(l.extensionUri,v,g,o.bookId,o.chapter,o.verse,i.translation)})),l.subscriptions.push(d.commands.registerCommand("dailyBread.openReaderAt",(o,i,m,b)=>{let u=r();T.createOrShow(l.extensionUri,v,g,o,i,m,b||u.translation)})),l.subscriptions.push(d.commands.registerCommand("dailyBread.bookmarkCurrent",async()=>{let o=B.getVerse()||p;if(!o)return;let i=await d.window.showInputBox({prompt:"Add an optional personal note/thought for this verse (leave empty to skip):",placeHolder:"e.g. Remember this for tough days at work"}),m=await d.window.showInputBox({prompt:"Add tags separated by comma (optional):",placeHolder:"e.g. encouragement, coding, hope"}),b=m?m.split(",").map(u=>u.trim()).filter(u=>u.length>0):void 0;await g.addBookmark(o,i,b),s(o),d.window.showInformationMessage(`\u2B50 Bookmarked: ${o.translation==="zulu"?o.zuluBookName:o.bookName} ${o.chapter}:${o.verse}`)})),l.subscriptions.push(d.commands.registerCommand("dailyBread.removeCurrentBookmark",async()=>{let o=B.getVerse()||p;if(!o)return;let i=`${o.bookId}:${o.chapter}:${o.verse}:${o.translation}`;await g.removeBookmark(i),s(o),d.window.showInformationMessage("Bookmark removed.")})),l.subscriptions.push(d.commands.registerCommand("dailyBread.showBookmarks",async()=>{let o=g.getBookmarks();if(o.length===0){d.window.showInformationMessage("You have no saved bookmarks yet.");return}let i=o.map(b=>({label:`\u2B50 ${b.bookName} ${b.chapter}:${b.verse} (${b.translation.toUpperCase()})`,description:b.note?`\u{1F4DD} ${b.note}`:`"${b.text.slice(0,45)}..."`,detail:b.tags&&b.tags.length>0?`Tags: ${b.tags.map(u=>"#"+u).join(" ")}`:void 0,bookmark:b})),m=await d.window.showQuickPick(i,{placeHolder:"Select a saved bookmark to open in reader"});m&&T.createOrShow(l.extensionUri,v,g,m.bookmark.bookId,m.bookmark.chapter,m.bookmark.verse,m.bookmark.translation)})),l.subscriptions.push(d.commands.registerCommand("dailyBread.selectTopic",async()=>{let o=v.getCuratedTopics(),i=r(),m=[{label:"$(sparkle) All Scripture / Any Topic",description:"Cycle across all curated themes",topicId:"all"},...Object.values(o).map(u=>({label:`$(tag) ${u.name} (${u.zuluName})`,description:`${u.verses.length} verses \u2014 ${u.description}`,topicId:u.id}))],b=await d.window.showQuickPick(m,{placeHolder:"Select Scripture Topic / Mood for Status Bar Rotation"});b&&(await d.workspace.getConfiguration("dailyBread").update("topic",b.topicId,d.ConfigurationTarget.Global),k(),d.window.showInformationMessage(`Daily Bible topic set to: ${b.label}`))})),l.subscriptions.push(d.commands.registerCommand("dailyBread.switchTranslation",async()=>{let o=[{label:"\u{1F4DC} English \u2014 King James Bible / Version (KJB / KJV)",description:"Classic, majestic, traditional poetic English (1611/1769) [Default]",translation:"kjv"},{label:"\u{1F1EC}\u{1F1E7} English \u2014 World English Bible (WEB)",description:"Clean, modern, highly readable English public domain Bible",translation:"web"},{label:"\u{1F1FF}\u{1F1E6} isiZulu \u2014 IBhayibheli Elingcwele (1959)",description:"South African Zulu 1959 Translation with authentic Zulu book names",translation:"zulu"}],i=await d.window.showQuickPick(o,{placeHolder:"Choose Bible Translation"});if(i){await d.workspace.getConfiguration("dailyBread").update("translation",i.translation,d.ConfigurationTarget.Global);let m=r(),b=m.dualTranslation!=="none"?m.dualTranslation:void 0,u=B.getVerse()||p,V=v.getVerse(u.bookId,u.chapter,u.verse,i.translation,b);V&&(p=V,s(p)),d.window.showInformationMessage(`Active translation: ${i.label}`)}})),l.subscriptions.push(d.commands.registerCommand("dailyBread.jumpTo",async()=>{let o=await d.window.showInputBox({prompt:"Enter book & chapter/verse in English or isiZulu",placeHolder:"e.g. Joh 3:16, AmaHubo 23:1, Phil 4:13, Mathewu 6:33, Gen 1:1"});if(!o)return;let i=v.parseReference(o);if(!i){d.window.showErrorMessage(`Could not find reference: "${o}". Try format like "Joh 3:16" or "Hubo 23:1".`);return}let m=r(),b=i.verse||1,u=v.getVerse(i.book.id,i.chapter,b,m.translation);u&&(p=u,s(p)),T.createOrShow(l.extensionUri,v,g,i.book.id,i.chapter,i.verse,m.translation)})),l.subscriptions.push(d.commands.registerCommand("dailyBread.jumpToRef",o=>{if(!o)return;let i=v.parseReference(o);if(!i){d.window.showWarningMessage(`Could not resolve cross-reference: ${o}`);return}let m=r(),b=i.verse||1,u=v.getVerse(i.book.id,i.chapter,b,m.translation);u&&(p=u,s(p)),T.createOrShow(l.extensionUri,v,g,i.book.id,i.chapter,i.verse,m.translation)})),l.subscriptions.push(d.commands.registerCommand("dailyBread.showCrossReferences",async()=>{let o=B.getVerse()||p;if(!o)return;let i=v.getCrossReferences(o.bookId,o.chapter,o.verse);if(i.length===0){d.window.showInformationMessage(`No cross references indexed for ${o.bookName} ${o.chapter}:${o.verse}`);return}let m=[];for(let u of i)for(let V of u.refs)m.push({label:`\u{1F517} ${V}`,description:`Phrase: "${u.anchor}"`,detail:`Cross reference from ${o.bookName} ${o.chapter}:${o.verse}`,refString:V});let b=await d.window.showQuickPick(m,{placeHolder:`Cross References for ${o.bookName} ${o.chapter}:${o.verse} (${m.length} total)`});b&&d.commands.executeCommand("dailyBread.jumpToRef",b.refString)})),l.subscriptions.push(d.commands.registerCommand("dailyBread.randomChapter",()=>{let o=v.getBooks(),i=o[Math.floor(Math.random()*o.length)],m=Math.floor(Math.random()*i.chapters)+1,b=r();T.createOrShow(l.extensionUri,v,g,i.id,m,1,b.translation)})),l.subscriptions.push(d.commands.registerCommand("dailyBread.copyVerse",async()=>{let o=B.getVerse()||p;if(!o)return;let i=o.translation==="zulu"?o.zuluBookName:o.bookName,m=`"${o.text}" \u2014 ${i} ${o.chapter}:${o.verse} (${o.translation.toUpperCase()})`;await d.env.clipboard.writeText(m),d.window.showInformationMessage(`Copied: ${i} ${o.chapter}:${o.verse}`)})),l.subscriptions.push(d.commands.registerCommand("dailyBread.exportBookmarks",async()=>{let o=await d.window.showQuickPick([{label:"Markdown Document (.md)",format:"md"},{label:"JSON Dataset (.json)",format:"json"}],{placeHolder:"Choose Export Format"});if(!o)return;let i=o.format==="md"?g.exportBookmarksMarkdown():g.exportBookmarksJson(),m=await d.workspace.openTextDocument({content:i,language:o.format==="md"?"markdown":"json"});await d.window.showTextDocument(m)})),l.subscriptions.push(d.commands.registerCommand("dailyBread.deleteBookmarkItem",async o=>{o&&o.bookmark&&(await g.removeBookmark(o.bookmark.id),d.window.showInformationMessage("Bookmark removed."))})),l.subscriptions.push(d.commands.registerCommand("dailyBread.menu",async()=>{let o=B.getVerse()||p,i=g.isBookmarked(o.bookId,o.chapter,o.verse),m=o.translation==="zulu"?o.zuluBookName:o.bookName,b=[{label:"$(sync) Next Verse",description:"Ctrl+Alt+B / Cmd+Alt+B",detail:"Fetch next uplifting scripture into status bar"},{label:"$(book) Read Full Chapter in Editor",description:`${m} Chapter ${o.chapter}`,detail:"Open clean in-editor Bible tab with side-by-side translation option"},{label:"$(link) View Verse Cross-References",description:"Treasury of Scripture Knowledge",detail:"Explore connected passages and related scriptures for this verse"},{label:i?"$(star-full) Remove Bookmark":"$(star-empty) Bookmark Current Verse",description:`${m} ${o.chapter}:${o.verse}`,detail:i?"Remove from saved favorites":"Save verse with optional notes and tags"},{label:"$(bookmark) View All Bookmarks",description:`${g.getBookmarks().length} saved verses`,detail:"Browse, filter, and jump to your saved favorites"},{label:"$(tag) Select Topic / Mood",description:`Current: ${r().topic}`,detail:"Filter status bar by Peace, Focus, Strength, Joy, Gratitude, or Comfort"},{label:"$(globe) Switch Translation",description:`Current: ${r().translation.toUpperCase()}`,detail:"Toggle between isiZulu 1959, English WEB, and English KJV"},{label:"$(search) Search & Jump to Verse",description:"Type any reference (e.g. Joh 3:16, Hubo 23:1)",detail:"Instantly jump to any chapter and verse in the Bible"},{label:"$(dice) Random Chapter",description:"Explore scripture unpredictably",detail:"Pick a random chapter from Genesis to Revelation"},{label:"$(clippy) Copy Verse to Clipboard",description:`${m} ${o.chapter}:${o.verse}`,detail:"Copy reference and scripture text formatted for sharing"},{label:"$(gear) Configure Extension Settings",description:"Icons, Display modes, Rotation intervals",detail:"Open Daily Bible settings in VS Code Preferences"}],u=await d.window.showQuickPick(b,{placeHolder:`\u{1F4D6} Daily Bible \u2014 ${m} ${o.chapter}:${o.verse}`});u&&(u.label.includes("Next Verse")?k():u.label.includes("Read Full Chapter")?d.commands.executeCommand("dailyBread.readChapter"):u.label.includes("View Verse Cross-References")?d.commands.executeCommand("dailyBread.showCrossReferences"):u.label.includes("Bookmark Current Verse")?d.commands.executeCommand("dailyBread.bookmarkCurrent"):u.label.includes("Remove Bookmark")?d.commands.executeCommand("dailyBread.removeCurrentBookmark"):u.label.includes("View All Bookmarks")?d.commands.executeCommand("dailyBread.showBookmarks"):u.label.includes("Select Topic")?d.commands.executeCommand("dailyBread.selectTopic"):u.label.includes("Switch Translation")?d.commands.executeCommand("dailyBread.switchTranslation"):u.label.includes("Search & Jump")?d.commands.executeCommand("dailyBread.jumpTo"):u.label.includes("Random Chapter")?d.commands.executeCommand("dailyBread.randomChapter"):u.label.includes("Copy Verse")?d.commands.executeCommand("dailyBread.copyVerse"):u.label.includes("Configure Extension Settings")&&d.commands.executeCommand("workbench.action.openSettings","dailyBread"))})),l.subscriptions.push(B)}function te(){M&&(clearInterval(M),M=void 0)}0&&(module.exports={activate,deactivate});
