"use strict";var L=Object.create;var z=Object.defineProperty;var Q=Object.getOwnPropertyDescriptor;var Y=Object.getOwnPropertyNames;var Z=Object.getPrototypeOf,_=Object.prototype.hasOwnProperty;var q=(p,e)=>{for(var a in e)z(p,a,{get:e[a],enumerable:!0})},G=(p,e,a,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of Y(e))!_.call(p,r)&&r!==a&&z(p,r,{get:()=>e[r],enumerable:!(t=Q(e,r))||t.enumerable});return p};var M=(p,e,a)=>(a=p!=null?L(Z(p)):{},G(e||!p||!p.__esModule?z(a,"default",{value:p,enumerable:!0}):a,p)),X=p=>G(z({},"__esModule",{value:!0}),p);var oe={};q(oe,{activate:()=>ee,deactivate:()=>te});module.exports=X(oe);var d=M(require("vscode"));var x=M(require("fs")),$=M(require("path")),j=class{constructor(e){this.books=[];this.booksById=new Map;this.aliasMap=new Map;this.topics={};this.cache=new Map;this.crossRefCache=new Map;this.curatedVerseList=[];let a=[$.join(e,"data"),$.join(e,"..","data"),$.resolve(__dirname,"..","data"),$.resolve(__dirname,"data"),$.resolve(process.cwd(),"data")],t=a[0];for(let r of a)if(x.existsSync($.join(r,"books.json"))){t=r;break}this.dataDir=t,this.loadMetadata()}loadMetadata(){let e=$.join(this.dataDir,"books.json");if(x.existsSync(e)){this.books=JSON.parse(x.readFileSync(e,"utf8"));for(let t of this.books)this.booksById.set(t.id,t),this.indexBookAliases(t)}let a=$.join(this.dataDir,"curated_topics.json");if(x.existsSync(a)){this.topics=JSON.parse(x.readFileSync(a,"utf8"));let t=new Set;for(let r of Object.values(this.topics))for(let s of r.verses){let c=`${s.bookId}:${s.chapter}:${s.verse}`;t.has(c)||(t.add(c),this.curatedVerseList.push(s))}}}normalizeText(e){return e.toLowerCase().replace(/[\u2018\u2019\u201C\u201D'"`\-_—–:.,;!]/g,"").replace(/\s+/g," ").trim()}indexBookAliases(e){let a=r=>{let s=this.normalizeText(r);s&&this.aliasMap.set(s,e)};a(e.name),a(e.zuluName),a(e.code);for(let r of e.aliases)a(r);let t=["u-","u","ku","kuma","kwabase","eka","aba","ama","izi","isi","um"];for(let r of t){let s=e.zuluName.toLowerCase();s.startsWith(r)&&s.length>r.length+2&&a(s.slice(r.length))}}getBooks(){return this.books}getBook(e){return this.booksById.get(e)}getCuratedTopics(){return this.topics}findBook(e){let a=this.normalizeText(e);if(!a)return;if(this.aliasMap.has(a))return this.aliasMap.get(a);let t=a.replace(/\s+/g,"");for(let[r,s]of this.aliasMap.entries())if(r.replace(/\s+/g,"")===t)return s;for(let[r,s]of this.aliasMap.entries())if(r.startsWith(a)||a.startsWith(r))return s;if(a.length>=3){for(let[r,s]of this.aliasMap.entries())if(r.includes(a)||a.includes(r))return s}}parseReference(e){let a=e.trim();if(!a)return;let t=a.match(/^([1-3]?\s*[A-Za-z\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/);if(!t){let n=a.match(/^([1-3]?\s*[\p{L}\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/u);if(!n)return;let u=n[1].trim(),o=parseInt(n[2],10),i=n[3]?parseInt(n[3],10):void 0,h=n[4]?parseInt(n[4],10):void 0,f=this.findBook(u);return f?{book:f,chapter:o,verse:i,endVerse:h}:void 0}let r=t[1].trim(),s=parseInt(t[2],10),c=t[3]?parseInt(t[3],10):void 0,m=t[4]?parseInt(t[4],10):void 0,l=this.findBook(r);if(l&&!(s<1||s>l.chapters))return{book:l,chapter:s,verse:c,endVerse:m}}getVerseRange(e,a,t,r,s="kjv"){let c=this.getChapter(e,a,s);if(c.length===0||t<1||t>c.length)return"";if(!r||r<=t)return c[t-1]||"";let m=Math.min(r,c.length,t+2),l=[];for(let n=t;n<=m;n++){let u=c[n-1];u&&l.push(`[${n}] ${u}`)}return r>m&&l.push("..."),l.join(" ")}resolveCrossReferences(e,a,t,r="kjv",s=8){let c=this.getCrossReferences(e,a,t),m=[],l=new Set;for(let n of c)for(let u of n.refs){if(l.has(u))continue;l.add(u);let o=this.parseReference(u);if(o&&o.verse){let i=this.getVerseRange(o.book.id,o.chapter,o.verse,o.endVerse,r);i&&m.push({ref:u,bookId:o.book.id,bookName:o.book.name,zuluBookName:o.book.zuluName,chapter:o.chapter,verse:o.verse,endVerse:o.endVerse,text:i,anchor:n.anchor})}if(m.length>=s)return m}return m}loadBookChapters(e,a){let t=`${a}:${e}`;if(this.cache.has(t))return this.cache.get(t);let r=$.join(this.dataDir,"translations",a,`${e}.json`);if(!x.existsSync(r))return[];try{let s=JSON.parse(x.readFileSync(r,"utf8"));return this.cache.set(t,s),s}catch{return[]}}loadBookCrossReferences(e){if(this.crossRefCache.has(e))return this.crossRefCache.get(e);let a=$.join(this.dataDir,"cross_references",`${e}.json`);if(!x.existsSync(a))return{};try{let t=JSON.parse(x.readFileSync(a,"utf8"));return this.crossRefCache.set(e,t),t}catch{return{}}}getCrossReferences(e,a,t){let r=this.loadBookCrossReferences(e);return r[a.toString()]&&r[a.toString()][t.toString()]||[]}getFlattenedCrossReferences(e,a,t){let r=this.getCrossReferences(e,a,t),s=new Set;for(let c of r)for(let m of c.refs)s.add(m);return Array.from(s)}getChapter(e,a,t){let r=this.loadBookChapters(e,t);return a<1||a>r.length?[]:r[a-1]||[]}getVerse(e,a,t,r,s){let c=this.getBook(e);if(!c)return;let m=this.getChapter(e,a,r);if(t<1||t>m.length)return;let l=m[t-1],n;if(s&&s!==r){let i=this.getChapter(e,a,s);t>=1&&t<=i.length&&(n=i[t-1])}let u=this.getCrossReferences(e,a,t),o=this.resolveCrossReferences(e,a,t,r,6);return{bookId:e,bookName:c.name,zuluBookName:c.zuluName,chapter:a,verse:t,text:l,translation:r,parallelText:n,parallelTranslation:s&&s!==r?s:void 0,crossReferences:u.length>0?u:void 0,resolvedCrossReferences:o.length>0?o:void 0,chapterVerses:m}}getRandomVerse(e,a="kjv",t){let r=[];e&&e!=="all"&&this.topics[e]?r=this.topics[e].verses:r=this.curatedVerseList,r.length===0&&(r=[{bookId:43,chapter:3,verse:16}]);let s=Math.floor(Math.random()*r.length),c=r[s],m=this.getVerse(c.bookId,c.chapter,c.verse,a,t);return m||{bookId:43,bookName:"John",zuluBookName:"UJohane",chapter:3,verse:16,text:"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",translation:a}}getNextCuratedVerse(e,a,t="kjv",r){let s=[];if(a&&a!=="all"&&this.topics[a]?s=this.topics[a].verses:s=this.curatedVerseList,s.length===0)return this.getRandomVerse(a,t,r);let m=(s.findIndex(n=>n.bookId===e.bookId&&n.chapter===e.chapter&&n.verse===e.verse)+1)%s.length,l=s[m];return this.getVerse(l.bookId,l.chapter,l.verse,t,r)||this.getRandomVerse(a,t,r)}getNextSequentialVerse(e,a="kjv",t){let r=this.getBook(e.bookId);if(!r)return this.getRandomVerse(void 0,a,t);let s=this.getChapter(e.bookId,e.chapter,a);if(e.verse<s.length)return this.getVerse(e.bookId,e.chapter,e.verse+1,a,t);if(e.chapter<r.chapters)return this.getVerse(e.bookId,e.chapter+1,1,a,t);let c=e.bookId%66+1;return this.getVerse(c,1,1,a,t)}};var K=M(require("vscode")),S=class S{constructor(e){this.onDidChangeEmitter=new K.EventEmitter;this.onDidChangeBookmarks=this.onDidChangeEmitter.event;this.context=e}getBookmarks(){return[...this.context.globalState.get(S.STORAGE_KEY,[])].sort((a,t)=>t.createdAt-a.createdAt)}isBookmarked(e,a,t){return this.getBookmarks().some(s=>s.bookId===e&&s.chapter===a&&s.verse===t)}getBookmark(e){return this.getBookmarks().find(a=>a.id===e)}async addBookmark(e,a,t){let r=this.getBookmarks(),s=`${e.bookId}:${e.chapter}:${e.verse}:${e.translation}`,c=r.filter(n=>n.id!==s),m=e.translation==="zulu"?e.zuluBookName:e.bookName,l={id:s,bookId:e.bookId,chapter:e.chapter,verse:e.verse,translation:e.translation,text:e.text,bookName:m,createdAt:Date.now(),note:a,tags:t};return c.unshift(l),await this.context.globalState.update(S.STORAGE_KEY,c),this.onDidChangeEmitter.fire(),l}async removeBookmark(e){let t=this.getBookmarks().filter(r=>r.id!==e);await this.context.globalState.update(S.STORAGE_KEY,t),this.onDidChangeEmitter.fire()}async updateBookmark(e,a,t){let r=this.getBookmarks(),s=r.find(c=>c.id===e);s&&(a!==void 0&&(s.note=a),t!==void 0&&(s.tags=t),await this.context.globalState.update(S.STORAGE_KEY,r),this.onDidChangeEmitter.fire())}exportBookmarksMarkdown(){let e=this.getBookmarks();if(e.length===0)return`# Daily Bible Bookmarks

No bookmarks saved yet.`;let a=`# \u{1F4D6} Daily Bible \u2014 Saved Bookmarks & Favorites

`;a+=`*Exported on ${new Date().toLocaleDateString()}*

---

`;for(let t of e){let r=new Date(t.createdAt).toLocaleDateString();a+=`### ${t.bookName} ${t.chapter}:${t.verse} (${t.translation.toUpperCase()})
`,a+=`> "${t.text}"

`,t.note&&(a+=`\u{1F4DD} **Note:** ${t.note}

`),t.tags&&t.tags.length>0&&(a+=`\u{1F3F7}\uFE0F **Tags:** ${t.tags.map(s=>"`#"+s+"`").join(" ")}

`),a+=`*Saved on ${r}*

---

`}return a}exportBookmarksJson(){return JSON.stringify(this.getBookmarks(),null,2)}async importBookmarks(e){try{let a=JSON.parse(e);if(!Array.isArray(a))return 0;let t=this.getBookmarks(),r=new Set(t.map(c=>c.id)),s=0;for(let c of a)if(c.bookId&&c.chapter&&c.verse&&c.text){let m=c.id||`${c.bookId}:${c.chapter}:${c.verse}:${c.translation||"zulu"}`;r.has(m)||(t.push({...c,id:m,createdAt:c.createdAt||Date.now()}),r.add(m),s++)}return await this.context.globalState.update(S.STORAGE_KEY,t),this.onDidChangeEmitter.fire(),s}catch{return 0}}};S.STORAGE_KEY="dailyBread.bookmarks";var A=S;var w=M(require("vscode")),I=class p{constructor(e,a,t,r,s=43,c=3,m,l="kjv"){this.disposables=[];this.currentBookId=43;this.currentChapter=3;this.currentVerseTarget=16;this.primaryTranslation="kjv";this.parallelTranslation="zulu";this.isParallel=!1;this.panel=e,this.extensionUri=a,this.bibleManager=t,this.bookmarksManager=r,this.currentBookId=s,this.currentChapter=c,this.currentVerseTarget=m,this.primaryTranslation=l,this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.webview.onDidReceiveMessage(async n=>{switch(n.command){case"prevChapter":this.goToPreviousChapter();break;case"nextChapter":this.goToNextChapter();break;case"setChapter":this.currentChapter=n.chapter,this.currentVerseTarget=void 0,this.update();break;case"setBookAndChapter":this.currentBookId=n.bookId,this.currentChapter=n.chapter,this.currentVerseTarget=n.verse,this.update();break;case"toggleParallel":this.isParallel=!this.isParallel,this.update();break;case"setPrimaryTranslation":this.primaryTranslation=n.translation,this.update();break;case"setParallelTranslation":this.parallelTranslation=n.translation,this.update();break;case"copyVerse":{let u=this.bibleManager.getVerse(n.bookId,n.chapter,n.verse,n.translation);if(u){let o=n.translation==="zulu"?u.zuluBookName:u.bookName,i=`"${u.text}" \u2014 ${o} ${n.chapter}:${n.verse} (${n.translation.toUpperCase()})`;await w.env.clipboard.writeText(i),w.window.showInformationMessage(`Copied: ${o} ${n.chapter}:${n.verse}`)}break}case"bookmarkVerse":{let u=this.bibleManager.getVerse(n.bookId,n.chapter,n.verse,n.translation);if(u){if(this.bookmarksManager.isBookmarked(n.bookId,n.chapter,n.verse)){let o=`${n.bookId}:${n.chapter}:${n.verse}:${n.translation}`;await this.bookmarksManager.removeBookmark(o),w.window.showInformationMessage("Bookmark removed.")}else await this.bookmarksManager.addBookmark(u),w.window.showInformationMessage(`\u2B50 Bookmarked: ${u.bookName} ${n.chapter}:${n.verse}`);this.update()}break}case"openBookPicker":this.showBookPicker();break;case"jumpToReference":{if(n.ref){let u=this.bibleManager.parseReference(n.ref);u?this.navigate(u.book.id,u.chapter,u.verse,this.primaryTranslation):w.window.showInformationMessage(`Could not resolve cross-reference: ${n.ref}`)}break}}},null,this.disposables)}static createOrShow(e,a,t,r=43,s=3,c,m="kjv"){let l=w.window.activeTextEditor?w.window.activeTextEditor.viewColumn:void 0;if(p.currentPanel)return p.currentPanel.panel.reveal(l),p.currentPanel.navigate(r,s,c,m),p.currentPanel;let n=w.window.createWebviewPanel("dailyBreadReader","Daily Bible Reader",l||w.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0,localResourceRoots:[w.Uri.joinPath(e,"media")]});return p.currentPanel=new p(n,e,a,t,r,s,c,m),p.currentPanel}navigate(e,a,t,r){this.currentBookId=e,this.currentChapter=a,this.currentVerseTarget=t,r&&(this.primaryTranslation=r),this.update()}goToPreviousChapter(){if(this.bibleManager.getBook(this.currentBookId)){if(this.currentChapter>1)this.currentChapter--;else if(this.currentBookId>1){this.currentBookId--;let a=this.bibleManager.getBook(this.currentBookId);this.currentChapter=a?a.chapters:1}this.currentVerseTarget=void 0,this.update()}}goToNextChapter(){let e=this.bibleManager.getBook(this.currentBookId);e&&(this.currentChapter<e.chapters?this.currentChapter++:this.currentBookId<66&&(this.currentBookId++,this.currentChapter=1),this.currentVerseTarget=void 0,this.update())}async showBookPicker(){let a=this.bibleManager.getBooks().map(c=>({label:this.primaryTranslation==="zulu"?`${c.zuluName} (${c.name})`:`${c.name} (${c.zuluName})`,description:`${c.testament} \u2022 ${c.chapters} chapters`,book:c})),t=await w.window.showQuickPick(a,{placeHolder:"Select a Book to Read (e.g. USenesisi, AmaHubo, UJohane, Romans)"});if(!t)return;let r=Array.from({length:t.book.chapters},(c,m)=>({label:`Chapter ${m+1}`,chapter:m+1})),s=await w.window.showQuickPick(r,{placeHolder:`Select Chapter (1 to ${t.book.chapters})`});s&&(this.currentBookId=t.book.id,this.currentChapter=s.chapter,this.currentVerseTarget=void 0,this.update())}update(){let e=this.bibleManager.getBook(this.currentBookId);if(!e)return;let a=this.primaryTranslation==="zulu"?e.zuluName:e.name;this.panel.title=`\u{1F4D6} ${a} ${this.currentChapter}`,this.panel.webview.html=this.getHtmlContent(e)}getHtmlContent(e){let a=this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.primaryTranslation),t=this.isParallel?this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.parallelTranslation):[],r=this.primaryTranslation==="zulu"?`${e.zuluName} (${e.name})`:`${e.name} (${e.zuluName})`,s=e.chapters,c="",m=Math.max(a.length,t.length);for(let l=0;l<m;l++){let n=l+1,u=a[l]||"",o=t[l]||"",i=this.bookmarksManager.isBookmarked(e.id,this.currentChapter,n),f=this.currentVerseTarget===n?"target-verse":"",b=i?"is-bookmarked":"",g=this.bibleManager.resolveCrossReferences(e.id,this.currentChapter,n,this.primaryTranslation,8),N=g.length>0,E="";N&&(E=`
          <div class="cross-ref-tray" id="cross-tray-${n}" style="display:none;">
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
          <div class="verse-row ${f}" id="verse-${n}">
            <div class="verse-col primary-col ${b}">
              <span class="verse-num">${n}</span>
              <span class="verse-text">${u}</span>
              <div class="verse-actions">
                ${N?`<button title="Cross References" class="action-btn" onclick="toggleCrossRefs(${n})">\u{1F517}</button>`:""}
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
          ${E}
        `:c+=`
          <div class="verse-item ${f} ${b}" id="verse-${n}">
            <span class="verse-num">${n}</span>
            <span class="verse-text">${u}</span>
            <span class="verse-actions">
              ${N?`<button class="action-btn" title="View Cross References" onclick="toggleCrossRefs(${n})">\u{1F517}</button>`:""}
              <button class="action-btn" title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${n}, '${this.primaryTranslation}')">${i?"\u2B50":"\u2606"}</button>
              <button class="action-btn" title="Copy Verse" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${n}, '${this.primaryTranslation}')">\u{1F4CB}</button>
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
</html>`}dispose(){for(p.currentPanel=void 0,this.panel.dispose();this.disposables.length;){let e=this.disposables.pop();e&&e.dispose()}}};var P=M(require("vscode")),O=class{constructor(){this.statusBarItem=P.window.createStatusBarItem(P.StatusBarAlignment.Right,100),this.statusBarItem.command="dailyBread.menu"}getVerse(){return this.currentVerse}getIconSymbol(e){switch(e){case"cross":return"\u271D ";case"book":return"\u{1F4D6} ";case"dove":return"\u{1F54A}\uFE0F ";case"none":default:return""}}update(e,a,t,r=!1){this.currentVerse=e;let s=this.getIconSymbol(t),c=r?"\u2B50 ":"",l=`${e.translation==="zulu"?e.zuluBookName:e.bookName} ${e.chapter}:${e.verse}`,n="";switch(a){case"compact":n=`${c}${s}${l}`;break;case"preview":{let u=e.text.length>40?e.text.slice(0,37)+"...":e.text;n=`${c}${s}${l} \u2014 "${u}"`;break}case"full":n=`${c}${s}${l} \u2014 "${e.text}"`;break}this.statusBarItem.text=n,this.statusBarItem.tooltip=this.createTooltip(e,r),this.statusBarItem.show()}createTooltip(e,a){let t=new P.MarkdownString;t.isTrusted=!0,t.supportHtml=!0;let r=e.translation==="zulu"?e.zuluBookName:e.bookName,s=e.translation==="zulu"?"isiZulu (IBhayibheli Elingcwele 1959)":e.translation==="web"?"World English Bible (WEB)":"King James Version (KJV)";if(t.appendMarkdown(`### \u{1F4D6} **${r} ${e.chapter}:${e.verse}**

`),t.appendMarkdown(`*${s}*

`),t.appendMarkdown(`---

`),t.appendMarkdown(`> ### **"${e.text}"**

`),e.parallelText&&e.parallelTranslation){let l=e.parallelTranslation==="zulu"?"isiZulu (1959)":e.parallelTranslation==="web"?"WEB":"KJB";t.appendMarkdown(`**Parallel (${l}):**
`),t.appendMarkdown(`> *"${e.parallelText}"*

`)}if(t.appendMarkdown(`---

`),e.chapterVerses&&e.chapterVerses.length>0){let l=e.chapterVerses.length;t.appendMarkdown(`<details open>
<summary><b>\u{1F4DC} Context: ${r} Chapter ${e.chapter} (Verses 1 to ${l})</b></summary>
<br/>

`);let n="";for(let u=0;u<l;u++){let o=u+1,i=e.chapterVerses[u];o===e.verse?n+=`**<mark>&nbsp;\u{1F449} [${o}] ${i}&nbsp;</mark>** `:n+=`<sup><b>${o}</b></sup> ${i} `}t.appendMarkdown(`${n}

`),t.appendMarkdown(`</details>

---

`)}if(e.resolvedCrossReferences&&e.resolvedCrossReferences.length>0){let l=e.resolvedCrossReferences;t.appendMarkdown(`<details open>
<summary><b>\u{1F517} Cross References & Connected Scriptures (${l.length} passages)</b></summary>
<br/>

`);for(let n of l){let u=e.translation==="zulu"?n.zuluBookName:n.bookName,o=n.endVerse?`-${n.endVerse}`:"",i=`${u} ${n.chapter}:${n.verse}${o}`,h=`command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([n.ref]))}`;t.appendMarkdown(`**[\u{1F517} ${i}](${h} "Jump to ${i}")**`),n.anchor&&t.appendMarkdown(` *(on "${n.anchor}")*`),t.appendMarkdown(`
> *"${n.text}"*

`)}t.appendMarkdown(`</details>

---

`)}else if(e.crossReferences&&e.crossReferences.length>0){let l=[],n=new Set;for(let u of e.crossReferences){for(let o of u.refs)if(!n.has(o)&&(n.add(o),l.push(o),l.length>=6))break;if(l.length>=6)break}if(l.length>0){let u=l.map(o=>`[\u{1F517} ${o}](command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([o]))} "Jump to ${o}")`).join(" &nbsp;&bull;&nbsp; ");t.appendMarkdown(`**Cross-References:**
${u}

---

`)}}let c=a?"$(star-full) Bookmarked":"$(star-empty) Bookmark",m=a?"command:dailyBread.removeCurrentBookmark":"command:dailyBread.bookmarkCurrent";return t.appendMarkdown(`[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${c}](${m} "Save to favorites") &nbsp;&bull;&nbsp; [$(copy) Copy](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")`),t}dispose(){this.statusBarItem.dispose()}};var B=M(require("vscode")),J=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new B.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(!e)return Promise.resolve([new D("Old Testament (Isivumelwano Esidala)","OT",B.TreeItemCollapsibleState.Expanded,"testament"),new D("New Testament (Isivumelwano Esisha)","NT",B.TreeItemCollapsibleState.Expanded,"testament")]);if(e.itemType==="testament"){let a=this.bibleManager.getBooks().filter(t=>t.testament===e.contextValue);return Promise.resolve(a.map(t=>new D(`${t.name} (${t.zuluName})`,t.id.toString(),B.TreeItemCollapsibleState.Collapsed,"book",t)))}if(e.itemType==="book"&&e.book){let a=[];for(let t=1;t<=e.book.chapters;t++){let r=new D(`Chapter ${t}`,`${e.book.id}:${t}`,B.TreeItemCollapsibleState.None,"chapter",e.book,t);r.command={command:"dailyBread.openReaderAt",title:"Read Chapter",arguments:[e.book.id,t]},a.push(r)}return Promise.resolve(a)}return Promise.resolve([])}},D=class extends B.TreeItem{constructor(a,t,r,s,c,m){super(a,r);this.label=a;this.idValue=t;this.collapsibleState=r;this.itemType=s;this.book=c;this.chapter=m;this.contextValue=s,s==="testament"?this.iconPath=new B.ThemeIcon("library"):s==="book"?(this.iconPath=new B.ThemeIcon("book"),this.description=`${c==null?void 0:c.chapters} ch`):s==="chapter"&&(this.iconPath=new B.ThemeIcon("file-text"))}};var y=M(require("vscode")),U=class{constructor(e){this.bookmarksManager=e;this._onDidChangeTreeData=new y.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event;this.bookmarksManager.onDidChangeBookmarks(()=>{this.refresh()})}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(e)return Promise.resolve([]);let a=this.bookmarksManager.getBookmarks();if(a.length===0){let t=new H("No bookmarks saved yet",y.TreeItemCollapsibleState.None,void 0);return t.description="Click \u2B50 on status bar or reader",Promise.resolve([t])}return Promise.resolve(a.map(t=>{let r=new H(`${t.bookName} ${t.chapter}:${t.verse}`,y.TreeItemCollapsibleState.None,t);return r.description=t.note?`\u{1F4DD} ${t.note}`:`"${t.text.slice(0,30)}..."`,r.tooltip=new y.MarkdownString(`**${t.bookName} ${t.chapter}:${t.verse}** (${t.translation.toUpperCase()})

> "${t.text}"

${t.note?"\u{1F4DD} Note: "+t.note:""}`),r.command={command:"dailyBread.openReaderAt",title:"Open Verse in Reader",arguments:[t.bookId,t.chapter,t.verse,t.translation]},r}))}},H=class extends y.TreeItem{constructor(a,t,r){super(a,t);this.label=a;this.collapsibleState=t;this.bookmark=r;r?(this.contextValue="bookmarkItem",this.iconPath=new y.ThemeIcon("star-full",new y.ThemeColor("charts.yellow"))):(this.contextValue="emptyBookmark",this.iconPath=new y.ThemeIcon("info"))}};var V=M(require("vscode")),F=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new V.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){let a=this.bibleManager.getCuratedTopics();if(!e)return Promise.resolve(Object.values(a).map(t=>{let r=new W(`${t.name} (${t.zuluName})`,V.TreeItemCollapsibleState.Collapsed,"topic",t);return r.description=`${t.verses.length} verses`,r.tooltip=t.description,r}));if(e.itemType==="topic"&&e.topic){let t=e.topic.verses.map(r=>{let s=this.bibleManager.getBook(r.bookId),c=`${(s==null?void 0:s.zuluName)||""} / ${(s==null?void 0:s.name)||""} ${r.chapter}:${r.verse}`,m=new W(c,V.TreeItemCollapsibleState.None,"verse",e.topic,r);return m.command={command:"dailyBread.openReaderAt",title:"Read Verse in Chapter",arguments:[r.bookId,r.chapter,r.verse]},m});return Promise.resolve(t)}return Promise.resolve([])}},W=class extends V.TreeItem{constructor(a,t,r,s,c){super(a,t);this.label=a;this.collapsibleState=t;this.itemType=r;this.topic=s;this.verse=c;this.contextValue=r,r==="topic"?this.iconPath=new V.ThemeIcon("tag"):this.iconPath=new V.ThemeIcon("quote")}};var v,k,C,R;function ee(p){v=new j(p.extensionPath),k=new A(p),C=new O;let e=new J(v);d.window.registerTreeDataProvider("dailyBreadExplorer",e);let a=new U(k);d.window.registerTreeDataProvider("dailyBreadBookmarks",a);let t=new F(v);d.window.registerTreeDataProvider("dailyBreadTopics",t);let r=()=>{let o=d.workspace.getConfiguration("dailyBread");return{translation:o.get("translation","kjv"),displayMode:o.get("displayMode","preview"),icon:o.get("icon","cross"),rotationSchedule:o.get("rotationSchedule","15min"),rotateOnFileSave:o.get("rotateOnFileSave",!1),topic:o.get("topic","all"),dualTranslation:o.get("dualTranslation","none")}},s=o=>{let i=r(),h=k.isBookmarked(o.bookId,o.chapter,o.verse);C.update(o,i.displayMode,i.icon,h)},c=r(),m=c.dualTranslation!=="none"?c.dualTranslation:void 0,l=v.getRandomVerse(c.topic,c.translation,m);s(l);let n=()=>{R&&(clearInterval(R),R=void 0);let o=r(),i=0;switch(o.rotationSchedule){case"5min":i=5*60*1e3;break;case"15min":i=15*60*1e3;break;case"30min":i=30*60*1e3;break;case"60min":i=60*60*1e3;break;default:i=0;break}i>0&&(R=setInterval(()=>{u()},i))},u=()=>{let o=r(),i=o.dualTranslation!=="none"?o.dualTranslation:void 0;l=C.getVerse()?v.getNextCuratedVerse(C.getVerse(),o.topic,o.translation,i):v.getRandomVerse(o.topic,o.translation,i),s(l)};n(),p.subscriptions.push(d.window.onDidChangeActiveTextEditor(o=>{o&&r().rotationSchedule==="onEditorOpen"&&u()})),p.subscriptions.push(d.workspace.onDidSaveTextDocument(()=>{r().rotateOnFileSave&&u()})),p.subscriptions.push(d.workspace.onDidChangeConfiguration(o=>{if(o.affectsConfiguration("dailyBread")){n();let i=r();if(l){let h=i.dualTranslation!=="none"?i.dualTranslation:void 0,f=v.getVerse(l.bookId,l.chapter,l.verse,i.translation,h);f&&(l=f,s(l))}}})),p.subscriptions.push(d.commands.registerCommand("dailyBread.nextVerse",()=>{u()})),p.subscriptions.push(d.commands.registerCommand("dailyBread.openReader",()=>{let o=C.getVerse()||l,i=r();I.createOrShow(p.extensionUri,v,k,o.bookId,o.chapter,o.verse,i.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.readChapter",()=>{let o=C.getVerse()||l,i=r();I.createOrShow(p.extensionUri,v,k,o.bookId,o.chapter,o.verse,i.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.openReaderAt",(o,i,h,f)=>{let b=r();I.createOrShow(p.extensionUri,v,k,o,i,h,f||b.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.bookmarkCurrent",async()=>{let o=C.getVerse()||l;if(!o)return;let i=await d.window.showInputBox({prompt:"Add an optional personal note/thought for this verse (leave empty to skip):",placeHolder:"e.g. Remember this for tough days at work"}),h=await d.window.showInputBox({prompt:"Add tags separated by comma (optional):",placeHolder:"e.g. encouragement, coding, hope"}),f=h?h.split(",").map(b=>b.trim()).filter(b=>b.length>0):void 0;await k.addBookmark(o,i,f),s(o),d.window.showInformationMessage(`\u2B50 Bookmarked: ${o.translation==="zulu"?o.zuluBookName:o.bookName} ${o.chapter}:${o.verse}`)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.removeCurrentBookmark",async()=>{let o=C.getVerse()||l;if(!o)return;let i=`${o.bookId}:${o.chapter}:${o.verse}:${o.translation}`;await k.removeBookmark(i),s(o),d.window.showInformationMessage("Bookmark removed.")})),p.subscriptions.push(d.commands.registerCommand("dailyBread.showBookmarks",async()=>{let o=k.getBookmarks();if(o.length===0){d.window.showInformationMessage("You have no saved bookmarks yet.");return}let i=o.map(f=>({label:`\u2B50 ${f.bookName} ${f.chapter}:${f.verse} (${f.translation.toUpperCase()})`,description:f.note?`\u{1F4DD} ${f.note}`:`"${f.text.slice(0,45)}..."`,detail:f.tags&&f.tags.length>0?`Tags: ${f.tags.map(b=>"#"+b).join(" ")}`:void 0,bookmark:f})),h=await d.window.showQuickPick(i,{placeHolder:"Select a saved bookmark to open in reader"});h&&I.createOrShow(p.extensionUri,v,k,h.bookmark.bookId,h.bookmark.chapter,h.bookmark.verse,h.bookmark.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.selectTopic",async()=>{let o=v.getCuratedTopics(),i=r(),h=[{label:"$(sparkle) All Scripture / Any Topic",description:"Cycle across all curated themes",topicId:"all"},...Object.values(o).map(b=>({label:`$(tag) ${b.name} (${b.zuluName})`,description:`${b.verses.length} verses \u2014 ${b.description}`,topicId:b.id}))],f=await d.window.showQuickPick(h,{placeHolder:"Select Scripture Topic / Mood for Status Bar Rotation"});f&&(await d.workspace.getConfiguration("dailyBread").update("topic",f.topicId,d.ConfigurationTarget.Global),u(),d.window.showInformationMessage(`Daily Bible topic set to: ${f.label}`))})),p.subscriptions.push(d.commands.registerCommand("dailyBread.switchTranslation",async()=>{let o=[{label:"\u{1F4DC} English \u2014 King James Bible / Version (KJB / KJV)",description:"Classic, majestic, traditional poetic English (1611/1769) [Default]",translation:"kjv"},{label:"\u{1F1EC}\u{1F1E7} English \u2014 World English Bible (WEB)",description:"Clean, modern, highly readable English public domain Bible",translation:"web"},{label:"\u{1F1FF}\u{1F1E6} isiZulu \u2014 IBhayibheli Elingcwele (1959)",description:"South African Zulu 1959 Translation with authentic Zulu book names",translation:"zulu"}],i=await d.window.showQuickPick(o,{placeHolder:"Choose Bible Translation"});if(i){await d.workspace.getConfiguration("dailyBread").update("translation",i.translation,d.ConfigurationTarget.Global);let h=r(),f=h.dualTranslation!=="none"?h.dualTranslation:void 0,b=C.getVerse()||l,g=v.getVerse(b.bookId,b.chapter,b.verse,i.translation,f);g&&(l=g,s(l)),d.window.showInformationMessage(`Active translation: ${i.label}`)}})),p.subscriptions.push(d.commands.registerCommand("dailyBread.jumpTo",async()=>{let o=await d.window.showInputBox({prompt:"Enter book & chapter/verse in English or isiZulu",placeHolder:"e.g. Joh 3:16, AmaHubo 23:1, Phil 4:13, Mathewu 6:33, Gen 1:1"});if(!o)return;let i=v.parseReference(o);if(!i){d.window.showErrorMessage(`Could not find reference: "${o}". Try format like "Joh 3:16" or "Hubo 23:1".`);return}let h=r(),f=i.verse||1,b=v.getVerse(i.book.id,i.chapter,f,h.translation);b&&(l=b,s(l)),I.createOrShow(p.extensionUri,v,k,i.book.id,i.chapter,i.verse,h.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.jumpToRef",o=>{if(!o)return;let i=v.parseReference(o);if(!i){d.window.showWarningMessage(`Could not resolve cross-reference: ${o}`);return}let h=r(),f=i.verse||1,b=v.getVerse(i.book.id,i.chapter,f,h.translation);b&&(l=b,s(l)),I.createOrShow(p.extensionUri,v,k,i.book.id,i.chapter,i.verse,h.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.showCrossReferences",async()=>{let o=C.getVerse()||l;if(!o)return;let i=r(),h=v.resolveCrossReferences(o.bookId,o.chapter,o.verse,i.translation,20);if(h.length===0){d.window.showInformationMessage(`No cross references indexed for ${o.bookName} ${o.chapter}:${o.verse}`);return}let f=h.map(g=>{let N=i.translation==="zulu"?g.zuluBookName:g.bookName,E=g.endVerse?`-${g.endVerse}`:"";return{label:`\u{1F517} ${N} ${g.chapter}:${g.verse}${E}`,description:g.anchor?`Phrase: "${g.anchor}"`:void 0,detail:`"${g.text}"`,refString:g.ref}}),b=await d.window.showQuickPick(f,{placeHolder:`Cross References with Scriptures for ${o.bookName} ${o.chapter}:${o.verse} (${f.length} passages)`});b&&d.commands.executeCommand("dailyBread.jumpToRef",b.refString)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.randomChapter",()=>{let o=v.getBooks(),i=o[Math.floor(Math.random()*o.length)],h=Math.floor(Math.random()*i.chapters)+1,f=r();I.createOrShow(p.extensionUri,v,k,i.id,h,1,f.translation)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.copyVerse",async()=>{let o=C.getVerse()||l;if(!o)return;let i=o.translation==="zulu"?o.zuluBookName:o.bookName,h=`"${o.text}" \u2014 ${i} ${o.chapter}:${o.verse} (${o.translation.toUpperCase()})`;await d.env.clipboard.writeText(h),d.window.showInformationMessage(`Copied: ${i} ${o.chapter}:${o.verse}`)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.exportBookmarks",async()=>{let o=await d.window.showQuickPick([{label:"Markdown Document (.md)",format:"md"},{label:"JSON Dataset (.json)",format:"json"}],{placeHolder:"Choose Export Format"});if(!o)return;let i=o.format==="md"?k.exportBookmarksMarkdown():k.exportBookmarksJson(),h=await d.workspace.openTextDocument({content:i,language:o.format==="md"?"markdown":"json"});await d.window.showTextDocument(h)})),p.subscriptions.push(d.commands.registerCommand("dailyBread.deleteBookmarkItem",async o=>{o&&o.bookmark&&(await k.removeBookmark(o.bookmark.id),d.window.showInformationMessage("Bookmark removed."))})),p.subscriptions.push(d.commands.registerCommand("dailyBread.menu",async()=>{let o=C.getVerse()||l,i=k.isBookmarked(o.bookId,o.chapter,o.verse),h=o.translation==="zulu"?o.zuluBookName:o.bookName,f=[{label:"$(sync) Next Verse",description:"Ctrl+Alt+B / Cmd+Alt+B",detail:"Fetch next uplifting scripture into status bar"},{label:"$(book) Read Full Chapter in Editor",description:`${h} Chapter ${o.chapter}`,detail:"Open clean in-editor Bible tab with side-by-side translation option"},{label:"$(link) View Verse Cross-References",description:"Treasury of Scripture Knowledge",detail:"Explore connected passages and related scriptures for this verse"},{label:i?"$(star-full) Remove Bookmark":"$(star-empty) Bookmark Current Verse",description:`${h} ${o.chapter}:${o.verse}`,detail:i?"Remove from saved favorites":"Save verse with optional notes and tags"},{label:"$(bookmark) View All Bookmarks",description:`${k.getBookmarks().length} saved verses`,detail:"Browse, filter, and jump to your saved favorites"},{label:"$(tag) Select Topic / Mood",description:`Current: ${r().topic}`,detail:"Filter status bar by Peace, Focus, Strength, Joy, Gratitude, or Comfort"},{label:"$(globe) Switch Translation",description:`Current: ${r().translation.toUpperCase()}`,detail:"Toggle between isiZulu 1959, English WEB, and English KJV"},{label:"$(search) Search & Jump to Verse",description:"Type any reference (e.g. Joh 3:16, Hubo 23:1)",detail:"Instantly jump to any chapter and verse in the Bible"},{label:"$(dice) Random Chapter",description:"Explore scripture unpredictably",detail:"Pick a random chapter from Genesis to Revelation"},{label:"$(clippy) Copy Verse to Clipboard",description:`${h} ${o.chapter}:${o.verse}`,detail:"Copy reference and scripture text formatted for sharing"},{label:"$(gear) Configure Extension Settings",description:"Icons, Display modes, Rotation intervals",detail:"Open Daily Bible settings in VS Code Preferences"}],b=await d.window.showQuickPick(f,{placeHolder:`\u{1F4D6} Daily Bible \u2014 ${h} ${o.chapter}:${o.verse}`});b&&(b.label.includes("Next Verse")?u():b.label.includes("Read Full Chapter")?d.commands.executeCommand("dailyBread.readChapter"):b.label.includes("View Verse Cross-References")?d.commands.executeCommand("dailyBread.showCrossReferences"):b.label.includes("Bookmark Current Verse")?d.commands.executeCommand("dailyBread.bookmarkCurrent"):b.label.includes("Remove Bookmark")?d.commands.executeCommand("dailyBread.removeCurrentBookmark"):b.label.includes("View All Bookmarks")?d.commands.executeCommand("dailyBread.showBookmarks"):b.label.includes("Select Topic")?d.commands.executeCommand("dailyBread.selectTopic"):b.label.includes("Switch Translation")?d.commands.executeCommand("dailyBread.switchTranslation"):b.label.includes("Search & Jump")?d.commands.executeCommand("dailyBread.jumpTo"):b.label.includes("Random Chapter")?d.commands.executeCommand("dailyBread.randomChapter"):b.label.includes("Copy Verse")?d.commands.executeCommand("dailyBread.copyVerse"):b.label.includes("Configure Extension Settings")&&d.commands.executeCommand("workbench.action.openSettings","dailyBread"))})),p.subscriptions.push(C)}function te(){R&&(clearInterval(R),R=void 0)}0&&(module.exports={activate,deactivate});
