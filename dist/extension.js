"use strict";var L=Object.create;var z=Object.defineProperty;var Q=Object.getOwnPropertyDescriptor;var Y=Object.getOwnPropertyNames;var Z=Object.getPrototypeOf,_=Object.prototype.hasOwnProperty;var q=(p,e)=>{for(var a in e)z(p,a,{get:e[a],enumerable:!0})},W=(p,e,a,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of Y(e))!_.call(p,r)&&r!==a&&z(p,r,{get:()=>e[r],enumerable:!(t=Q(e,r))||t.enumerable});return p};var S=(p,e,a)=>(a=p!=null?L(Z(p)):{},W(e||!p||!p.__esModule?z(a,"default",{value:p,enumerable:!0}):a,p)),X=p=>W(z({},"__esModule",{value:!0}),p);var oe={};q(oe,{activate:()=>ee,deactivate:()=>te});module.exports=X(oe);var d=S(require("vscode"));var x=S(require("fs")),C=S(require("path")),j=class{constructor(e){this.books=[];this.booksById=new Map;this.aliasMap=new Map;this.topics={};this.cache=new Map;this.crossRefCache=new Map;this.curatedVerseList=[];let a=[C.join(e,"data"),C.join(e,"..","data"),C.resolve(__dirname,"..","data"),C.resolve(__dirname,"data"),C.resolve(process.cwd(),"data")],t=a[0];for(let r of a)if(x.existsSync(C.join(r,"books.json"))){t=r;break}this.dataDir=t,this.loadMetadata()}loadMetadata(){let e=C.join(this.dataDir,"books.json");if(x.existsSync(e)){this.books=JSON.parse(x.readFileSync(e,"utf8"));for(let t of this.books)this.booksById.set(t.id,t),this.indexBookAliases(t)}let a=C.join(this.dataDir,"curated_topics.json");if(x.existsSync(a)){this.topics=JSON.parse(x.readFileSync(a,"utf8"));let t=new Set;for(let r of Object.values(this.topics))for(let n of r.verses){let c=`${n.bookId}:${n.chapter}:${n.verse}`;t.has(c)||(t.add(c),this.curatedVerseList.push(n))}}}normalizeText(e){return e.toLowerCase().replace(/[\u2018\u2019\u201C\u201D'"`\-_—–:.,;!]/g,"").replace(/\s+/g," ").trim()}indexBookAliases(e){let a=r=>{let n=this.normalizeText(r);n&&this.aliasMap.set(n,e)};a(e.name),a(e.zuluName),a(e.code);for(let r of e.aliases)a(r);let t=["u-","u","ku","kuma","kwabase","eka","aba","ama","izi","isi","um"];for(let r of t){let n=e.zuluName.toLowerCase();n.startsWith(r)&&n.length>r.length+2&&a(n.slice(r.length))}}getBooks(){return this.books}getBook(e){return this.booksById.get(e)}getCuratedTopics(){return this.topics}findBook(e){let a=this.normalizeText(e);if(!a)return;if(this.aliasMap.has(a))return this.aliasMap.get(a);let t=a.replace(/\s+/g,"");for(let[r,n]of this.aliasMap.entries())if(r.replace(/\s+/g,"")===t)return n;for(let[r,n]of this.aliasMap.entries())if(r.startsWith(a)||a.startsWith(r))return n;if(a.length>=3){for(let[r,n]of this.aliasMap.entries())if(r.includes(a)||a.includes(r))return n}}parseReference(e){let a=e.trim();if(!a)return;let t=a.match(/^([1-3]?\s*[A-Za-z\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/);if(!t){let s=a.match(/^([1-3]?\s*[\p{L}\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/u);if(!s)return;let u=s[1].trim(),o=parseInt(s[2],10),i=s[3]?parseInt(s[3],10):void 0,h=s[4]?parseInt(s[4],10):void 0,b=this.findBook(u);return b?{book:b,chapter:o,verse:i,endVerse:h}:void 0}let r=t[1].trim(),n=parseInt(t[2],10),c=t[3]?parseInt(t[3],10):void 0,m=t[4]?parseInt(t[4],10):void 0,l=this.findBook(r);if(l&&!(n<1||n>l.chapters))return{book:l,chapter:n,verse:c,endVerse:m}}getVerseRange(e,a,t,r,n="kjv"){let c=this.getChapter(e,a,n);if(c.length===0||t<1||t>c.length)return"";if(!r||r<=t)return c[t-1]||"";let m=Math.min(r,c.length,t+2),l=[];for(let s=t;s<=m;s++){let u=c[s-1];u&&l.push(`[${s}] ${u}`)}return r>m&&l.push("..."),l.join(" ")}resolveCrossReferences(e,a,t,r="kjv",n=8){let c=this.getCrossReferences(e,a,t),m=[],l=new Set;for(let s of c)for(let u of s.refs){if(l.has(u))continue;l.add(u);let o=this.parseReference(u);if(o&&o.verse){let i=this.getVerseRange(o.book.id,o.chapter,o.verse,o.endVerse,r);i&&m.push({ref:u,bookId:o.book.id,bookName:o.book.name,zuluBookName:o.book.zuluName,chapter:o.chapter,verse:o.verse,endVerse:o.endVerse,text:i,anchor:s.anchor})}if(m.length>=n)return m}return m}loadBookChapters(e,a){let t=`${a}:${e}`;if(this.cache.has(t))return this.cache.get(t);let r=C.join(this.dataDir,"translations",a,`${e}.json`);if(!x.existsSync(r))return[];try{let n=JSON.parse(x.readFileSync(r,"utf8"));return this.cache.set(t,n),n}catch{return[]}}loadBookCrossReferences(e){if(this.crossRefCache.has(e))return this.crossRefCache.get(e);let a=C.join(this.dataDir,"cross_references",`${e}.json`);if(!x.existsSync(a))return{};try{let t=JSON.parse(x.readFileSync(a,"utf8"));return this.crossRefCache.set(e,t),t}catch{return{}}}getCrossReferences(e,a,t){let r=this.loadBookCrossReferences(e);return r[a.toString()]&&r[a.toString()][t.toString()]||[]}getFlattenedCrossReferences(e,a,t){let r=this.getCrossReferences(e,a,t),n=new Set;for(let c of r)for(let m of c.refs)n.add(m);return Array.from(n)}getChapter(e,a,t){let r=this.loadBookChapters(e,t);return a<1||a>r.length?[]:r[a-1]||[]}getVerse(e,a,t,r,n){let c=this.getBook(e);if(!c)return;let m=this.getChapter(e,a,r);if(t<1||t>m.length)return;let l=m[t-1],s;if(n&&n!==r){let i=this.getChapter(e,a,n);t>=1&&t<=i.length&&(s=i[t-1])}let u=this.getCrossReferences(e,a,t),o=this.resolveCrossReferences(e,a,t,r,12);return{bookId:e,bookName:c.name,zuluBookName:c.zuluName,chapter:a,verse:t,text:l,translation:r,parallelText:s,parallelTranslation:n&&n!==r?n:void 0,crossReferences:u.length>0?u:void 0,resolvedCrossReferences:o.length>0?o:void 0,chapterVerses:m}}getRandomVerse(e,a="kjv",t){let r=[];e&&e!=="all"&&this.topics[e]?r=this.topics[e].verses:r=this.curatedVerseList,r.length===0&&(r=[{bookId:43,chapter:3,verse:16}]);let n=Math.floor(Math.random()*r.length),c=r[n],m=this.getVerse(c.bookId,c.chapter,c.verse,a,t);return m||{bookId:43,bookName:"John",zuluBookName:"UJohane",chapter:3,verse:16,text:"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",translation:a}}getNextCuratedVerse(e,a,t="kjv",r){let n=[];if(a&&a!=="all"&&this.topics[a]?n=this.topics[a].verses:n=this.curatedVerseList,n.length===0)return this.getRandomVerse(a,t,r);let m=(n.findIndex(s=>s.bookId===e.bookId&&s.chapter===e.chapter&&s.verse===e.verse)+1)%n.length,l=n[m];return this.getVerse(l.bookId,l.chapter,l.verse,t,r)||this.getRandomVerse(a,t,r)}getNextSequentialVerse(e,a="kjv",t){let r=this.getBook(e.bookId);if(!r)return this.getRandomVerse(void 0,a,t);let n=this.getChapter(e.bookId,e.chapter,a);if(e.verse<n.length)return this.getVerse(e.bookId,e.chapter,e.verse+1,a,t);if(e.chapter<r.chapters)return this.getVerse(e.bookId,e.chapter+1,1,a,t);let c=e.bookId%66+1;return this.getVerse(c,1,1,a,t)}};var G=S(require("vscode")),M=class M{constructor(e){this.onDidChangeEmitter=new G.EventEmitter;this.onDidChangeBookmarks=this.onDidChangeEmitter.event;this.context=e}getBookmarks(){return[...this.context.globalState.get(M.STORAGE_KEY,[])].sort((a,t)=>t.createdAt-a.createdAt)}isBookmarked(e,a,t){return this.getBookmarks().some(n=>n.bookId===e&&n.chapter===a&&n.verse===t)}getBookmark(e){return this.getBookmarks().find(a=>a.id===e)}async addBookmark(e,a,t){let r=this.getBookmarks(),n=`${e.bookId}:${e.chapter}:${e.verse}:${e.translation}`,c=r.filter(s=>s.id!==n),m=e.translation==="zulu"?e.zuluBookName:e.bookName,l={id:n,bookId:e.bookId,chapter:e.chapter,verse:e.verse,translation:e.translation,text:e.text,bookName:m,createdAt:Date.now(),note:a,tags:t};return c.unshift(l),await this.context.globalState.update(M.STORAGE_KEY,c),this.onDidChangeEmitter.fire(),l}async removeBookmark(e){let t=this.getBookmarks().filter(r=>r.id!==e);await this.context.globalState.update(M.STORAGE_KEY,t),this.onDidChangeEmitter.fire()}async updateBookmark(e,a,t){let r=this.getBookmarks(),n=r.find(c=>c.id===e);n&&(a!==void 0&&(n.note=a),t!==void 0&&(n.tags=t),await this.context.globalState.update(M.STORAGE_KEY,r),this.onDidChangeEmitter.fire())}exportBookmarksMarkdown(){let e=this.getBookmarks();if(e.length===0)return`# Daily Bible Bookmarks

No bookmarks saved yet.`;let a=`# \u{1F4D6} Daily Bible \u2014 Saved Bookmarks & Favorites

`;a+=`*Exported on ${new Date().toLocaleDateString()}*

---

`;for(let t of e){let r=new Date(t.createdAt).toLocaleDateString();a+=`### ${t.bookName} ${t.chapter}:${t.verse} (${t.translation.toUpperCase()})
`,a+=`> "${t.text}"

`,t.note&&(a+=`\u{1F4DD} **Note:** ${t.note}

`),t.tags&&t.tags.length>0&&(a+=`\u{1F3F7}\uFE0F **Tags:** ${t.tags.map(n=>"`#"+n+"`").join(" ")}

`),a+=`*Saved on ${r}*

---

`}return a}exportBookmarksJson(){return JSON.stringify(this.getBookmarks(),null,2)}async importBookmarks(e){try{let a=JSON.parse(e);if(!Array.isArray(a))return 0;let t=this.getBookmarks(),r=new Set(t.map(c=>c.id)),n=0;for(let c of a)if(c.bookId&&c.chapter&&c.verse&&c.text){let m=c.id||`${c.bookId}:${c.chapter}:${c.verse}:${c.translation||"zulu"}`;r.has(m)||(t.push({...c,id:m,createdAt:c.createdAt||Date.now()}),r.add(m),n++)}return await this.context.globalState.update(M.STORAGE_KEY,t),this.onDidChangeEmitter.fire(),n}catch{return 0}}};M.STORAGE_KEY="dailyBread.bookmarks";var A=M;var y=S(require("vscode")),I=class p{constructor(e,a,t,r,n=43,c=3,m,l="kjv"){this.disposables=[];this.currentBookId=43;this.currentChapter=3;this.currentVerseTarget=16;this.primaryTranslation="kjv";this.parallelTranslation="zulu";this.isParallel=!1;this.panel=e,this.extensionUri=a,this.bibleManager=t,this.bookmarksManager=r,this.currentBookId=n,this.currentChapter=c,this.currentVerseTarget=m,this.primaryTranslation=l,this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.webview.onDidReceiveMessage(async s=>{switch(s.command){case"prevChapter":this.goToPreviousChapter();break;case"nextChapter":this.goToNextChapter();break;case"setChapter":this.currentChapter=s.chapter,this.currentVerseTarget=void 0,this.update();break;case"setBookAndChapter":this.currentBookId=s.bookId,this.currentChapter=s.chapter,this.currentVerseTarget=s.verse,this.update();break;case"toggleParallel":this.isParallel=!this.isParallel,this.update();break;case"setPrimaryTranslation":this.primaryTranslation=s.translation,this.update();break;case"setParallelTranslation":this.parallelTranslation=s.translation,this.update();break;case"copyVerse":{let u=this.bibleManager.getVerse(s.bookId,s.chapter,s.verse,s.translation);if(u){let o=s.translation==="zulu"?u.zuluBookName:u.bookName,i=`"${u.text}" \u2014 ${o} ${s.chapter}:${s.verse} (${s.translation.toUpperCase()})`;await y.env.clipboard.writeText(i),y.window.showInformationMessage(`Copied: ${o} ${s.chapter}:${s.verse}`)}break}case"bookmarkVerse":{let u=this.bibleManager.getVerse(s.bookId,s.chapter,s.verse,s.translation);if(u){if(this.bookmarksManager.isBookmarked(s.bookId,s.chapter,s.verse)){let o=`${s.bookId}:${s.chapter}:${s.verse}:${s.translation}`;await this.bookmarksManager.removeBookmark(o),y.window.showInformationMessage("Bookmark removed.")}else await this.bookmarksManager.addBookmark(u),y.window.showInformationMessage(`\u2B50 Bookmarked: ${u.bookName} ${s.chapter}:${s.verse}`);this.update()}break}case"openBookPicker":this.showBookPicker();break;case"jumpToReference":{if(s.ref){let u=this.bibleManager.parseReference(s.ref);u?this.navigate(u.book.id,u.chapter,u.verse,this.primaryTranslation):y.window.showInformationMessage(`Could not resolve cross-reference: ${s.ref}`)}break}}},null,this.disposables)}static createOrShow(e,a,t,r=43,n=3,c,m="kjv"){let l=y.window.activeTextEditor?y.window.activeTextEditor.viewColumn:void 0;if(p.currentPanel)return p.currentPanel.panel.reveal(l),p.currentPanel.navigate(r,n,c,m),p.currentPanel;let s=y.window.createWebviewPanel("dailyBreadReader","Daily Bible Reader",l||y.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0,localResourceRoots:[y.Uri.joinPath(e,"media")]});return p.currentPanel=new p(s,e,a,t,r,n,c,m),p.currentPanel}navigate(e,a,t,r){this.currentBookId=e,this.currentChapter=a,this.currentVerseTarget=t,r&&(this.primaryTranslation=r),this.update()}goToPreviousChapter(){if(this.bibleManager.getBook(this.currentBookId)){if(this.currentChapter>1)this.currentChapter--;else if(this.currentBookId>1){this.currentBookId--;let a=this.bibleManager.getBook(this.currentBookId);this.currentChapter=a?a.chapters:1}this.currentVerseTarget=void 0,this.update()}}goToNextChapter(){let e=this.bibleManager.getBook(this.currentBookId);e&&(this.currentChapter<e.chapters?this.currentChapter++:this.currentBookId<66&&(this.currentBookId++,this.currentChapter=1),this.currentVerseTarget=void 0,this.update())}async showBookPicker(){let a=this.bibleManager.getBooks().map(c=>({label:this.primaryTranslation==="zulu"?`${c.zuluName} (${c.name})`:`${c.name} (${c.zuluName})`,description:`${c.testament} \u2022 ${c.chapters} chapters`,book:c})),t=await y.window.showQuickPick(a,{placeHolder:"Select a Book to Read (e.g. USenesisi, AmaHubo, UJohane, Romans)"});if(!t)return;let r=Array.from({length:t.book.chapters},(c,m)=>({label:`Chapter ${m+1}`,chapter:m+1})),n=await y.window.showQuickPick(r,{placeHolder:`Select Chapter (1 to ${t.book.chapters})`});n&&(this.currentBookId=t.book.id,this.currentChapter=n.chapter,this.currentVerseTarget=void 0,this.update())}update(){let e=this.bibleManager.getBook(this.currentBookId);if(!e)return;let a=this.primaryTranslation==="zulu"?e.zuluName:e.name;this.panel.title=`\u{1F4D6} ${a} ${this.currentChapter}`,this.panel.webview.html=this.getHtmlContent(e)}getHtmlContent(e){let a=this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.primaryTranslation),t=this.isParallel?this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.parallelTranslation):[],r=this.primaryTranslation==="zulu"?`${e.zuluName} (${e.name})`:`${e.name} (${e.zuluName})`,n=e.chapters,c="",m=Math.max(a.length,t.length);for(let l=0;l<m;l++){let s=l+1,u=a[l]||"",o=t[l]||"",i=this.bookmarksManager.isBookmarked(e.id,this.currentChapter,s),b=this.currentVerseTarget===s?"target-verse":"",f=i?"is-bookmarked":"",g=this.bibleManager.resolveCrossReferences(e.id,this.currentChapter,s,this.primaryTranslation,8),N=g.length>0,E="";N&&(E=`
          <div class="cross-ref-tray" id="cross-tray-${s}" style="display:none;">
            <div class="cross-ref-tray-title">\u{1F517} Cross References & Connected Verses (${g.length})</div>
            <div class="cross-ref-list">
              ${g.map(T=>`
                <div class="cross-ref-item" onclick="jumpRef('${T.ref}')" title="Click to open ${T.ref} in reader">
                  <div class="cr-header">
                    <span class="cr-citation">\u{1F517} ${T.bookName} ${T.chapter}:${T.verse}${T.endVerse?"-"+T.endVerse:""}</span>
                    ${T.anchor?`<span class="cr-anchor">on "${T.anchor}"</span>`:""}
                  </div>
                  <div class="cr-verse-text">"${T.text}"</div>
                </div>
              `).join("")}
            </div>
          </div>
        `),this.isParallel?c+=`
          <div class="verse-row ${b}" id="verse-${s}">
            <div class="verse-col primary-col ${f}">
              <span class="verse-num">${s}</span>
              <span class="verse-text">${u}</span>
              <div class="verse-actions">
                ${N?`<button title="Cross References" class="action-btn" onclick="toggleCrossRefs(${s})">\u{1F517}</button>`:""}
                <button title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${s}, '${this.primaryTranslation}')">${i?"\u2B50":"\u2606"}</button>
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${s}, '${this.primaryTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
            <div class="verse-col parallel-col">
              <span class="verse-num">${s}</span>
              <span class="verse-text">${o}</span>
              <div class="verse-actions">
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${s}, '${this.parallelTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
          </div>
          ${E}
        `:c+=`
          <div class="verse-item ${b} ${f}" id="verse-${s}">
            <span class="verse-num">${s}</span>
            <span class="verse-text">${u}</span>
            <span class="verse-actions">
              ${N?`<button class="action-btn" title="View Cross References" onclick="toggleCrossRefs(${s})">\u{1F517}</button>`:""}
              <button class="action-btn" title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${s}, '${this.primaryTranslation}')">${i?"\u2B50":"\u2606"}</button>
              <button class="action-btn" title="Copy Verse" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${s}, '${this.primaryTranslation}')">\u{1F4CB}</button>
            </span>
          </div>
          ${E}
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
      <div class="subtitle">Chapter ${this.currentChapter} of ${n}</div>
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
</html>`}dispose(){for(p.currentPanel=void 0,this.panel.dispose();this.disposables.length;){let e=this.disposables.pop();e&&e.dispose()}}};var P=S(require("vscode")),O=class{constructor(){this.statusBarItem=P.window.createStatusBarItem(P.StatusBarAlignment.Right,100),this.statusBarItem.command="dailyBread.menu"}getVerse(){return this.currentVerse}getIconSymbol(e){switch(e){case"cross":return"\u271D ";case"book":return"\u{1F4D6} ";case"dove":return"\u{1F54A}\uFE0F ";case"none":default:return""}}update(e,a,t,r=!1){this.currentVerse=e;let n=this.getIconSymbol(t),c=r?"\u2B50 ":"",l=`${e.translation==="zulu"?e.zuluBookName:e.bookName} ${e.chapter}:${e.verse}`,s="";switch(a){case"compact":s=`${c}${n}${l}`;break;case"preview":{let u=e.text.length>40?e.text.slice(0,37)+"...":e.text;s=`${c}${n}${l} \u2014 "${u}"`;break}case"full":s=`${c}${n}${l} \u2014 "${e.text}"`;break}this.statusBarItem.text=s,this.statusBarItem.tooltip=this.createTooltip(e,r),this.statusBarItem.show()}createTooltip(e,a){let t=new P.MarkdownString;t.isTrusted=!0,t.supportHtml=!0;let r=e.translation==="zulu"?e.zuluBookName:e.bookName,n=e.translation==="zulu"?"isiZulu (IBhayibheli Elingcwele 1959)":e.translation==="web"?"World English Bible (WEB)":"King James Version (KJV)",c=a?"$(star-full) Bookmarked":"$(star-empty) Bookmark",m=a?"command:dailyBread.removeCurrentBookmark":"command:dailyBread.bookmarkCurrent";if(t.appendMarkdown(`| \u{1F4D6} **${r} ${e.chapter}:${e.verse}** | \u{1F310} **${n}** |
| :----------------------------------------------------------------------------- | -------------------------------------------------------------------: |

`),t.appendMarkdown(`[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${c}](${m} "Save to favorites") &nbsp;&bull;&nbsp; [$(copy) Copy](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")

`),t.appendMarkdown(`---

`),t.appendMarkdown(`## \u{1F4D6} **${r} ${e.chapter}:${e.verse}**

`),t.appendMarkdown(`> ### **"${e.text}"**

`),e.parallelText&&e.parallelTranslation){let l=e.parallelTranslation==="zulu"?"isiZulu (1959)":e.parallelTranslation==="web"?"WEB":"KJB";t.appendMarkdown(`> **Parallel (${l}):** *"${e.parallelText}"*

`)}if(t.appendMarkdown(`---

`),e.chapterVerses&&e.chapterVerses.length>0){let l=e.chapterVerses.length;t.appendMarkdown(`### \u{1F4DC} Full Chapter: **${r} Chapter ${e.chapter}** (Verses 1 to ${l})

*Scroll up and down to read all verses in context:*  

`);for(let s=0;s<l;s++){let u=s+1,o=e.chapterVerses[s];u===e.verse?t.appendMarkdown(`\u{1F449} **<mark>&nbsp;[${u}] ${o}&nbsp;</mark>** *(Active Verse)*  

`):t.appendMarkdown(`**${u}.** ${o}  

`)}t.appendMarkdown(`---

`)}if(e.resolvedCrossReferences&&e.resolvedCrossReferences.length>0){let l=e.resolvedCrossReferences;t.appendMarkdown(`### \u{1F517} Cross-References & Scripture Connections (${l.length} Passages)

*Scriptures connected by Treasury of Scripture Knowledge (TSK):*  

`);for(let s of l){let u=e.translation==="zulu"?s.zuluBookName:s.bookName,o=s.endVerse?`-${s.endVerse}`:"",i=`${u} ${s.chapter}:${s.verse}${o}`,h=`command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([s.ref]))}`,b=s.anchor?` &nbsp;*(connecting theme: "${s.anchor}")*`:"";t.appendMarkdown(`* **[\u{1F4D6} ${i}](${h} "Jump to ${i}")**${b}  
`),t.appendMarkdown(`  > *"${s.text}"*

`)}t.appendMarkdown(`---

`)}else if(e.crossReferences&&e.crossReferences.length>0){let l=[],s=new Set;for(let u of e.crossReferences){for(let o of u.refs)if(!s.has(o)&&(s.add(o),l.push(o),l.length>=12))break;if(l.length>=12)break}if(l.length>0){let u=l.map(o=>`[\u{1F517} ${o}](command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([o]))} "Jump to ${o}")`).join(" &nbsp;&bull;&nbsp; ");t.appendMarkdown(`### \u{1F517} Cross-References:
${u}

---

`)}}return t.appendMarkdown(`### \u{1F9ED} Quick Navigation

[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${c}](${m} "Save to favorites") &nbsp;&bull;&nbsp; [$(copy) Copy Verse](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")
`),t}dispose(){this.statusBarItem.dispose()}};var B=S(require("vscode")),J=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new B.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(!e)return Promise.resolve([new D("Old Testament (Isivumelwano Esidala)","OT",B.TreeItemCollapsibleState.Expanded,"testament"),new D("New Testament (Isivumelwano Esisha)","NT",B.TreeItemCollapsibleState.Expanded,"testament")]);if(e.itemType==="testament"){let a=this.bibleManager.getBooks().filter(t=>t.testament===e.contextValue);return Promise.resolve(a.map(t=>new D(`${t.name} (${t.zuluName})`,t.id.toString(),B.TreeItemCollapsibleState.Collapsed,"book",t)))}if(e.itemType==="book"&&e.book){let a=[];for(let t=1;t<=e.book.chapters;t++){let r=new D(`Chapter ${t}`,`${e.book.id}:${t}`,B.TreeItemCollapsibleState.None,"chapter",e.book,t);r.command={command:"dailyBread.openReaderAt",title:"Read Chapter",arguments:[e.book.id,t]},a.push(r)}return Promise.resolve(a)}return Promise.resolve([])}},D=class extends B.TreeItem{constructor(a,t,r,n,c,m){super(a,r);this.label=a;this.idValue=t;this.collapsibleState=r;this.itemType=n;this.book=c;this.chapter=m;this.contextValue=n,n==="testament"?this.iconPath=new B.ThemeIcon("library"):n==="book"?(this.iconPath=new B.ThemeIcon("book"),this.description=`${c==null?void 0:c.chapters} ch`):n==="chapter"&&(this.iconPath=new B.ThemeIcon("file-text"))}};var w=S(require("vscode")),U=class{constructor(e){this.bookmarksManager=e;this._onDidChangeTreeData=new w.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event;this.bookmarksManager.onDidChangeBookmarks(()=>{this.refresh()})}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(e)return Promise.resolve([]);let a=this.bookmarksManager.getBookmarks();if(a.length===0){let t=new H("No bookmarks saved yet",w.TreeItemCollapsibleState.None,void 0);return t.description="Click \u2B50 on status bar or reader",Promise.resolve([t])}return Promise.resolve(a.map(t=>{let r=new H(`${t.bookName} ${t.chapter}:${t.verse}`,w.TreeItemCollapsibleState.None,t);return r.description=t.note?`\u{1F4DD} ${t.note}`:`"${t.text.slice(0,30)}..."`,r.tooltip=new w.MarkdownString(`**${t.bookName} ${t.chapter}:${t.verse}** (${t.translation.toUpperCase()})

> "${t.text}"

${t.note?"\u{1F4DD} Note: "+t.note:""}`),r.command={command:"dailyBread.openReaderAt",title:"Open Verse in Reader",arguments:[t.bookId,t.chapter,t.verse,t.translation]},r}))}},H=class extends w.TreeItem{constructor(a,t,r){super(a,t);this.label=a;this.collapsibleState=t;this.bookmark=r;r?(this.contextValue="bookmarkItem",this.iconPath=new w.ThemeIcon("star-full",new w.ThemeColor("charts.yellow"))):(this.contextValue="emptyBookmark",this.iconPath=new w.ThemeIcon("info"))}};var V=S(require("vscode")),F=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new V.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){let a=this.bibleManager.getCuratedTopics();if(!e)return Promise.resolve(Object.values(a).map(t=>{let r=new K(`${t.name} (${t.zuluName})`,V.TreeItemCollapsibleState.Collapsed,"topic",t);return r.description=`${t.verses.length} verses`,r.tooltip=t.description,r}));if(e.itemType==="topic"&&e.topic){let t=e.topic.verses.map(r=>{let n=this.bibleManager.getBook(r.bookId),c=`${(n==null?void 0:n.zuluName)||""} / ${(n==null?void 0:n.name)||""} ${r.chapter}:${r.verse}`,m=new K(c,V.TreeItemCollapsibleState.None,"verse",e.topic,r);return m.command={command:"dailyBread.openReaderAt",title:"Read Verse in Chapter",arguments:[r.bookId,r.chapter,r.verse]},m});return Promise.resolve(t)}return Promise.resolve([])}},K=class extends V.TreeItem{constructor(a,t,r,n,c){super(a,t);this.label=a;this.collapsibleState=t;this.itemType=r;this.topic=n;this.verse=c;this.contextValue=r,r==="topic"?this.iconPath=new V.ThemeIcon("tag"):this.iconPath=new V.ThemeIcon("quote")}};var v,k,$,R;function ee(p){v=new j(p.extensionPath),k=new A(p),$=new O;let e=new J(v);d.window.registerTreeDataProvider("dailyBreadExplorer",e);let a=new U(k);d.window.registerTreeDataProvider("dailyBreadBookmarks",a);let t=new F(v);d.window.registerTreeDataProvider("dailyBreadTopics",t);let r=()=>{let o=d.workspace.getConfiguration("dailyBread");return{translation:o.get("translation","kjv"),displayMode:o.get("displayMode","preview"),icon:o.get("icon","cross"),rotationSchedule:o.get("rotationSchedule","15min"),rotateOnFileSave:o.get("rotateOnFileSave",!1),topic:o.get("topic","all"),dualTranslation:o.get("dualTranslation","none")}},n=o=>{let i=r(),h=k.isBookmarked(o.bookId,o.chapter,o.verse);$.update(o,i.displayMode,i.icon,h)},c=r(),m=c.dualTranslation!=="none"?c.dualTranslation:void 0,l=v.getRandomVerse(c.topic,c.translation,m);n(l);let s=()=>{R&&(clearInterval(R),R=void 0);let o=r(),i=0;switch(o.rotationSchedule){case"5min":i=5*60*1e3;break;case"15min":i=15*60*1e3;break;case"30min":i=30*60*1e3;break;case"60min":i=60*60*1e3;break;default:i=0;break}i>0&&(R=setInterval(()=>{u()},i))},u=()=>{let o=r(),i=o.dualTranslation!=="none"?o.dualTranslation:void 0;l=$.getVerse()?v.getNextCuratedVerse($.getVerse(),o.topic,o.translation,i):v.getRandomVerse(o.topic,o.translation,i),n(l)};s(),p.subscriptions.push(d.window.onDidChangeActiveTextEditor(o=>{o&&r().rotationSchedule==="onEditorOpen"&&u()})),p.subscriptions.push(d.workspace.onDidSaveTextDocument(()=>{r().rotateOnFileSave&&u()})),p.subscriptions.push(d.workspace.onDidChangeConfiguration(o=>{if(o.affectsConfiguration("dailyBread")){s();let i=r();if(l){let h=i.dualTranslation!=="none"?i.dualTranslation:void 0,b=v.getVerse(l.bookId,l.chapter,l.verse,i.translation,h);b&&(l=b,n(l))}}})),p.subscriptions.push(d.commands.registerCommand("dailyBread.nextVerse",()=>{u()})),p.subscriptions.push(d.commands.registerCommand("dailyBread.openReader",()=>{let o=$.getVerse()||l,i=r();I.createOrShow(p.extensionUri,v,k,o.bookId,o.chapter,o.verse,i.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.readChapter",()=>{let o=$.getVerse()||l,i=r();I.createOrShow(p.extensionUri,v,k,o.bookId,o.chapter,o.verse,i.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.openReaderAt",(o,i,h,b)=>{let f=r();I.createOrShow(p.extensionUri,v,k,o,i,h,b||f.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.bookmarkCurrent",async()=>{let o=$.getVerse()||l;if(!o)return;let i=await d.window.showInputBox({prompt:"Add an optional personal note/thought for this verse (leave empty to skip):",placeHolder:"e.g. Remember this for tough days at work"}),h=await d.window.showInputBox({prompt:"Add tags separated by comma (optional):",placeHolder:"e.g. encouragement, coding, hope"}),b=h?h.split(",").map(f=>f.trim()).filter(f=>f.length>0):void 0;await k.addBookmark(o,i,b),n(o),d.window.showInformationMessage(`\u2B50 Bookmarked: ${o.translation==="zulu"?o.zuluBookName:o.bookName} ${o.chapter}:${o.verse}`)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.removeCurrentBookmark",async()=>{let o=$.getVerse()||l;if(!o)return;let i=`${o.bookId}:${o.chapter}:${o.verse}:${o.translation}`;await k.removeBookmark(i),n(o),d.window.showInformationMessage("Bookmark removed.")})),p.subscriptions.push(d.commands.registerCommand("dailyBread.showBookmarks",async()=>{let o=k.getBookmarks();if(o.length===0){d.window.showInformationMessage("You have no saved bookmarks yet.");return}let i=o.map(b=>({label:`\u2B50 ${b.bookName} ${b.chapter}:${b.verse} (${b.translation.toUpperCase()})`,description:b.note?`\u{1F4DD} ${b.note}`:`"${b.text.slice(0,45)}..."`,detail:b.tags&&b.tags.length>0?`Tags: ${b.tags.map(f=>"#"+f).join(" ")}`:void 0,bookmark:b})),h=await d.window.showQuickPick(i,{placeHolder:"Select a saved bookmark to open in reader"});h&&I.createOrShow(p.extensionUri,v,k,h.bookmark.bookId,h.bookmark.chapter,h.bookmark.verse,h.bookmark.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.selectTopic",async()=>{let o=v.getCuratedTopics(),i=r(),h=[{label:"$(sparkle) All Scripture / Any Topic",description:"Cycle across all curated themes",topicId:"all"},...Object.values(o).map(f=>({label:`$(tag) ${f.name} (${f.zuluName})`,description:`${f.verses.length} verses \u2014 ${f.description}`,topicId:f.id}))],b=await d.window.showQuickPick(h,{placeHolder:"Select Scripture Topic / Mood for Status Bar Rotation"});b&&(await d.workspace.getConfiguration("dailyBread").update("topic",b.topicId,d.ConfigurationTarget.Global),u(),d.window.showInformationMessage(`Daily Bible topic set to: ${b.label}`))})),p.subscriptions.push(d.commands.registerCommand("dailyBread.switchTranslation",async()=>{let o=[{label:"\u{1F4DC} English \u2014 King James Bible / Version (KJB / KJV)",description:"Classic, majestic, traditional poetic English (1611/1769) [Default]",translation:"kjv"},{label:"\u{1F1EC}\u{1F1E7} English \u2014 World English Bible (WEB)",description:"Clean, modern, highly readable English public domain Bible",translation:"web"},{label:"\u{1F1FF}\u{1F1E6} isiZulu \u2014 IBhayibheli Elingcwele (1959)",description:"South African Zulu 1959 Translation with authentic Zulu book names",translation:"zulu"}],i=await d.window.showQuickPick(o,{placeHolder:"Choose Bible Translation"});if(i){await d.workspace.getConfiguration("dailyBread").update("translation",i.translation,d.ConfigurationTarget.Global);let h=r(),b=h.dualTranslation!=="none"?h.dualTranslation:void 0,f=$.getVerse()||l,g=v.getVerse(f.bookId,f.chapter,f.verse,i.translation,b);g&&(l=g,n(l)),d.window.showInformationMessage(`Active translation: ${i.label}`)}})),p.subscriptions.push(d.commands.registerCommand("dailyBread.jumpTo",async()=>{let o=await d.window.showInputBox({prompt:"Enter book & chapter/verse in English or isiZulu",placeHolder:"e.g. Joh 3:16, AmaHubo 23:1, Phil 4:13, Mathewu 6:33, Gen 1:1"});if(!o)return;let i=v.parseReference(o);if(!i){d.window.showErrorMessage(`Could not find reference: "${o}". Try format like "Joh 3:16" or "Hubo 23:1".`);return}let h=r(),b=i.verse||1,f=v.getVerse(i.book.id,i.chapter,b,h.translation);f&&(l=f,n(l)),I.createOrShow(p.extensionUri,v,k,i.book.id,i.chapter,i.verse,h.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.jumpToRef",o=>{if(!o)return;let i=v.parseReference(o);if(!i){d.window.showWarningMessage(`Could not resolve cross-reference: ${o}`);return}let h=r(),b=i.verse||1,f=v.getVerse(i.book.id,i.chapter,b,h.translation);f&&(l=f,n(l)),I.createOrShow(p.extensionUri,v,k,i.book.id,i.chapter,i.verse,h.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.showCrossReferences",async()=>{let o=$.getVerse()||l;if(!o)return;let i=r(),h=v.resolveCrossReferences(o.bookId,o.chapter,o.verse,i.translation,20);if(h.length===0){d.window.showInformationMessage(`No cross references indexed for ${o.bookName} ${o.chapter}:${o.verse}`);return}let b=h.map(g=>{let N=i.translation==="zulu"?g.zuluBookName:g.bookName,E=g.endVerse?`-${g.endVerse}`:"";return{label:`\u{1F517} ${N} ${g.chapter}:${g.verse}${E}`,description:g.anchor?`Phrase: "${g.anchor}"`:void 0,detail:`"${g.text}"`,refString:g.ref}}),f=await d.window.showQuickPick(b,{placeHolder:`Cross References with Scriptures for ${o.bookName} ${o.chapter}:${o.verse} (${b.length} passages)`});f&&d.commands.executeCommand("dailyBread.jumpToRef",f.refString)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.randomChapter",()=>{let o=v.getBooks(),i=o[Math.floor(Math.random()*o.length)],h=Math.floor(Math.random()*i.chapters)+1,b=r();I.createOrShow(p.extensionUri,v,k,i.id,h,1,b.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.copyVerse",async()=>{let o=$.getVerse()||l;if(!o)return;let i=o.translation==="zulu"?o.zuluBookName:o.bookName,h=`"${o.text}" \u2014 ${i} ${o.chapter}:${o.verse} (${o.translation.toUpperCase()})`;await d.env.clipboard.writeText(h),d.window.showInformationMessage(`Copied: ${i} ${o.chapter}:${o.verse}`)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.exportBookmarks",async()=>{let o=await d.window.showQuickPick([{label:"Markdown Document (.md)",format:"md"},{label:"JSON Dataset (.json)",format:"json"}],{placeHolder:"Choose Export Format"});if(!o)return;let i=o.format==="md"?k.exportBookmarksMarkdown():k.exportBookmarksJson(),h=await d.workspace.openTextDocument({content:i,language:o.format==="md"?"markdown":"json"});await d.window.showTextDocument(h)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.deleteBookmarkItem",async o=>{o&&o.bookmark&&(await k.removeBookmark(o.bookmark.id),d.window.showInformationMessage("Bookmark removed."))})),p.subscriptions.push(d.commands.registerCommand("dailyBread.menu",async()=>{let o=$.getVerse()||l,i=k.isBookmarked(o.bookId,o.chapter,o.verse),h=o.translation==="zulu"?o.zuluBookName:o.bookName,b=[{label:"$(sync) Next Verse",description:"Ctrl+Alt+B / Cmd+Alt+B",detail:"Fetch next uplifting scripture into status bar"},{label:"$(book) Read Full Chapter in Editor",description:`${h} Chapter ${o.chapter}`,detail:"Open clean in-editor Bible tab with side-by-side translation option"},{label:"$(link) View Verse Cross-References",description:"Treasury of Scripture Knowledge",detail:"Explore connected passages and related scriptures for this verse"},{label:i?"$(star-full) Remove Bookmark":"$(star-empty) Bookmark Current Verse",description:`${h} ${o.chapter}:${o.verse}`,detail:i?"Remove from saved favorites":"Save verse with optional notes and tags"},{label:"$(bookmark) View All Bookmarks",description:`${k.getBookmarks().length} saved verses`,detail:"Browse, filter, and jump to your saved favorites"},{label:"$(tag) Select Topic / Mood",description:`Current: ${r().topic}`,detail:"Filter status bar by Peace, Focus, Strength, Joy, Gratitude, or Comfort"},{label:"$(globe) Switch Translation",description:`Current: ${r().translation.toUpperCase()}`,detail:"Toggle between isiZulu 1959, English WEB, and English KJV"},{label:"$(search) Search & Jump to Verse",description:"Type any reference (e.g. Joh 3:16, Hubo 23:1)",detail:"Instantly jump to any chapter and verse in the Bible"},{label:"$(dice) Random Chapter",description:"Explore scripture unpredictably",detail:"Pick a random chapter from Genesis to Revelation"},{label:"$(clippy) Copy Verse to Clipboard",description:`${h} ${o.chapter}:${o.verse}`,detail:"Copy reference and scripture text formatted for sharing"},{label:"$(gear) Configure Extension Settings",description:"Icons, Display modes, Rotation intervals",detail:"Open Daily Bible settings in VS Code Preferences"}],f=await d.window.showQuickPick(b,{placeHolder:`\u{1F4D6} Daily Bible \u2014 ${h} ${o.chapter}:${o.verse}`});f&&(f.label.includes("Next Verse")?u():f.label.includes("Read Full Chapter")?d.commands.executeCommand("dailyBread.readChapter"):f.label.includes("View Verse Cross-References")?d.commands.executeCommand("dailyBread.showCrossReferences"):f.label.includes("Bookmark Current Verse")?d.commands.executeCommand("dailyBread.bookmarkCurrent"):f.label.includes("Remove Bookmark")?d.commands.executeCommand("dailyBread.removeCurrentBookmark"):f.label.includes("View All Bookmarks")?d.commands.executeCommand("dailyBread.showBookmarks"):f.label.includes("Select Topic")?d.commands.executeCommand("dailyBread.selectTopic"):f.label.includes("Switch Translation")?d.commands.executeCommand("dailyBread.switchTranslation"):f.label.includes("Search & Jump")?d.commands.executeCommand("dailyBread.jumpTo"):f.label.includes("Random Chapter")?d.commands.executeCommand("dailyBread.randomChapter"):f.label.includes("Copy Verse")?d.commands.executeCommand("dailyBread.copyVerse"):f.label.includes("Configure Extension Settings")&&d.commands.executeCommand("workbench.action.openSettings","dailyBread"))})),p.subscriptions.push($)}function te(){R&&(clearInterval(R),R=void 0)}0&&(module.exports={activate,deactivate});
