"use strict";var oe=Object.create;var J=Object.defineProperty;var re=Object.getOwnPropertyDescriptor;var ae=Object.getOwnPropertyNames;var ne=Object.getPrototypeOf,se=Object.prototype.hasOwnProperty;var ie=(d,e)=>{for(var a in e)J(d,a,{get:e[a],enumerable:!0})},ee=(d,e,a,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let t of ae(e))!se.call(d,t)&&t!==a&&J(d,t,{get:()=>e[t],enumerable:!(o=re(e,t))||o.enumerable});return d};var E=(d,e,a)=>(a=d!=null?oe(ne(d)):{},ee(e||!d||!d.__esModule?J(a,"default",{value:d,enumerable:!0}):a,d)),ce=d=>ee(J({},"__esModule",{value:!0}),d);var pe={};ie(pe,{activate:()=>le,deactivate:()=>de});module.exports=ce(pe);var s=E(require("vscode"));var V=E(require("fs")),M=E(require("path")),U=class{constructor(e){this.books=[];this.booksById=new Map;this.aliasMap=new Map;this.topics={};this.cache=new Map;this.crossRefCache=new Map;this.curatedVerseList=[];let a=[M.join(e,"data"),M.join(e,"..","data"),M.resolve(__dirname,"..","data"),M.resolve(__dirname,"data"),M.resolve(process.cwd(),"data")],o=a[0];for(let t of a)if(V.existsSync(M.join(t,"books.json"))){o=t;break}this.dataDir=o,this.loadMetadata()}loadMetadata(){let e=M.join(this.dataDir,"books.json");if(V.existsSync(e)){this.books=JSON.parse(V.readFileSync(e,"utf8"));for(let o of this.books)this.booksById.set(o.id,o),this.indexBookAliases(o)}let a=M.join(this.dataDir,"curated_topics.json");if(V.existsSync(a)){this.topics=JSON.parse(V.readFileSync(a,"utf8"));let o=new Set;for(let t of Object.values(this.topics))for(let n of t.verses){let l=`${n.bookId}:${n.chapter}:${n.verse}`;o.has(l)||(o.add(l),this.curatedVerseList.push(n))}}}normalizeText(e){return e.toLowerCase().replace(/[\u2018\u2019\u201C\u201D'"`\-_—–:.,;!]/g,"").replace(/\s+/g," ").trim()}indexBookAliases(e){let a=t=>{let n=this.normalizeText(t);n&&this.aliasMap.set(n,e)};a(e.name),a(e.zuluName),a(e.code);for(let t of e.aliases)a(t);let o=["u-","u","ku","kuma","kwabase","eka","aba","ama","izi","isi","um"];for(let t of o){let n=e.zuluName.toLowerCase();n.startsWith(t)&&n.length>t.length+2&&a(n.slice(t.length))}}getBooks(){return this.books}getBook(e){return this.booksById.get(e)}getCuratedTopics(){return this.topics}findBook(e){let a=this.normalizeText(e);if(!a)return;if(this.aliasMap.has(a))return this.aliasMap.get(a);let o=a.replace(/\s+/g,"");for(let[t,n]of this.aliasMap.entries())if(t.replace(/\s+/g,"")===o)return n;for(let[t,n]of this.aliasMap.entries())if(t.startsWith(a)||a.startsWith(t))return n;if(a.length>=3){for(let[t,n]of this.aliasMap.entries())if(t.includes(a)||a.includes(t))return n}}parseReference(e){let a=e.trim();if(!a)return;let o=a.match(/^([1-3]?\s*[A-Za-z\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/);if(!o){let c=a.match(/^([1-3]?\s*[\p{L}\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/u);if(!c)return;let g=c[1].trim(),h=parseInt(c[2],10),u=c[3]?parseInt(c[3],10):void 0,$=c[4]?parseInt(c[4],10):void 0,k=this.findBook(g);return k?{book:k,chapter:h,verse:u,endVerse:$}:void 0}let t=o[1].trim(),n=parseInt(o[2],10),l=o[3]?parseInt(o[3],10):void 0,m=o[4]?parseInt(o[4],10):void 0,v=this.findBook(t);if(v&&!(n<1||n>v.chapters))return{book:v,chapter:n,verse:l,endVerse:m}}getVerseRange(e,a,o,t,n="kjv"){let l=this.getChapter(e,a,n);if(l.length===0||o<1||o>l.length)return"";if(!t||t<=o)return l[o-1]||"";let m=Math.min(t,l.length,o+2),v=[];for(let c=o;c<=m;c++){let g=l[c-1];g&&v.push(`[${c}] ${g}`)}return t>m&&v.push("..."),v.join(" ")}resolveCrossReferences(e,a,o,t="kjv",n=8){let l=this.getCrossReferences(e,a,o),m=[],v=new Set;for(let c of l)for(let g of c.refs){if(v.has(g))continue;v.add(g);let h=this.parseReference(g);if(h&&h.verse){let u=this.getVerseRange(h.book.id,h.chapter,h.verse,h.endVerse,t);u&&m.push({ref:g,bookId:h.book.id,bookName:h.book.name,zuluBookName:h.book.zuluName,chapter:h.chapter,verse:h.verse,endVerse:h.endVerse,text:u,anchor:c.anchor})}if(m.length>=n)return m}return m}loadBookChapters(e,a){let o=`${a}:${e}`;if(this.cache.has(o))return this.cache.get(o);let t=M.join(this.dataDir,"translations",a,`${e}.json`);if(!V.existsSync(t))return[];try{let n=JSON.parse(V.readFileSync(t,"utf8"));return this.cache.set(o,n),n}catch{return[]}}loadBookCrossReferences(e){if(this.crossRefCache.has(e))return this.crossRefCache.get(e);let a=M.join(this.dataDir,"cross_references",`${e}.json`);if(!V.existsSync(a))return{};try{let o=JSON.parse(V.readFileSync(a,"utf8"));return this.crossRefCache.set(e,o),o}catch{return{}}}getCrossReferences(e,a,o){let t=this.loadBookCrossReferences(e);return t[a.toString()]&&t[a.toString()][o.toString()]||[]}getFlattenedCrossReferences(e,a,o){let t=this.getCrossReferences(e,a,o),n=new Set;for(let l of t)for(let m of l.refs)n.add(m);return Array.from(n)}getChapter(e,a,o){let t=this.loadBookChapters(e,o);return a<1||a>t.length?[]:t[a-1]||[]}getVerse(e,a,o,t,n){let l=this.getBook(e);if(!l)return;let m=this.getChapter(e,a,t);if(o<1||o>m.length)return;let v=m[o-1],c;if(n&&n!==t){let u=this.getChapter(e,a,n);o>=1&&o<=u.length&&(c=u[o-1])}let g=this.getCrossReferences(e,a,o),h=this.resolveCrossReferences(e,a,o,t,12);return{bookId:e,bookName:l.name,zuluBookName:l.zuluName,chapter:a,verse:o,text:v,translation:t,parallelText:c,parallelTranslation:n&&n!==t?n:void 0,crossReferences:g.length>0?g:void 0,resolvedCrossReferences:h.length>0?h:void 0,chapterVerses:m}}getRandomVerse(e,a="kjv",o){let t=[];e&&e!=="all"&&this.topics[e]?t=this.topics[e].verses:t=this.curatedVerseList,t.length===0&&(t=[{bookId:43,chapter:3,verse:16}]);let n=Math.floor(Math.random()*t.length),l=t[n],m=this.getVerse(l.bookId,l.chapter,l.verse,a,o);return m||{bookId:43,bookName:"John",zuluBookName:"UJohane",chapter:3,verse:16,text:"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",translation:a}}getNextCuratedVerse(e,a,o="kjv",t){let n=[];if(a&&a!=="all"&&this.topics[a]?n=this.topics[a].verses:n=this.curatedVerseList,n.length===0)return this.getRandomVerse(a,o,t);let m=(n.findIndex(c=>c.bookId===e.bookId&&c.chapter===e.chapter&&c.verse===e.verse)+1)%n.length,v=n[m];return this.getVerse(v.bookId,v.chapter,v.verse,o,t)||this.getRandomVerse(a,o,t)}getNextSequentialVerse(e,a="kjv",o){let t=this.getBook(e.bookId);if(!t)return this.getRandomVerse(void 0,a,o);let n=this.getChapter(e.bookId,e.chapter,a);if(e.verse<n.length)return this.getVerse(e.bookId,e.chapter,e.verse+1,a,o);if(e.chapter<t.chapters)return this.getVerse(e.bookId,e.chapter+1,1,a,o);let l=e.bookId%66+1;return this.getVerse(l,1,1,a,o)}};var te=E(require("vscode")),N=class N{constructor(e){this.onDidChangeEmitter=new te.EventEmitter;this.onDidChangeBookmarks=this.onDidChangeEmitter.event;this.context=e}getBookmarks(){return[...this.context.globalState.get(N.STORAGE_KEY,[])].sort((a,o)=>o.createdAt-a.createdAt)}isBookmarked(e,a,o){return this.getBookmarks().some(n=>n.bookId===e&&n.chapter===a&&n.verse===o)}getBookmark(e){return this.getBookmarks().find(a=>a.id===e)}async addBookmark(e,a,o){let t=this.getBookmarks(),n=`${e.bookId}:${e.chapter}:${e.verse}:${e.translation}`,l=t.filter(c=>c.id!==n),m=e.translation==="zulu"?e.zuluBookName:e.bookName,v={id:n,bookId:e.bookId,chapter:e.chapter,verse:e.verse,translation:e.translation,text:e.text,bookName:m,createdAt:Date.now(),note:a,tags:o};return l.unshift(v),await this.context.globalState.update(N.STORAGE_KEY,l),this.onDidChangeEmitter.fire(),v}async removeBookmark(e){let o=this.getBookmarks().filter(t=>t.id!==e);await this.context.globalState.update(N.STORAGE_KEY,o),this.onDidChangeEmitter.fire()}async updateBookmark(e,a,o){let t=this.getBookmarks(),n=t.find(l=>l.id===e);n&&(a!==void 0&&(n.note=a),o!==void 0&&(n.tags=o),await this.context.globalState.update(N.STORAGE_KEY,t),this.onDidChangeEmitter.fire())}exportBookmarksMarkdown(){let e=this.getBookmarks();if(e.length===0)return`# Daily Bible Bookmarks

No bookmarks saved yet.`;let a=`# \u{1F4D6} Daily Bible \u2014 Saved Bookmarks & Favorites

`;a+=`*Exported on ${new Date().toLocaleDateString()}*

---

`;for(let o of e){let t=new Date(o.createdAt).toLocaleDateString();a+=`### ${o.bookName} ${o.chapter}:${o.verse} (${o.translation.toUpperCase()})
`,a+=`> "${o.text}"

`,o.note&&(a+=`\u{1F4DD} **Note:** ${o.note}

`),o.tags&&o.tags.length>0&&(a+=`\u{1F3F7}\uFE0F **Tags:** ${o.tags.map(n=>"`#"+n+"`").join(" ")}

`),a+=`*Saved on ${t}*

---

`}return a}exportBookmarksJson(){return JSON.stringify(this.getBookmarks(),null,2)}async importBookmarks(e){try{let a=JSON.parse(e);if(!Array.isArray(a))return 0;let o=this.getBookmarks(),t=new Set(o.map(l=>l.id)),n=0;for(let l of a)if(l.bookId&&l.chapter&&l.verse&&l.text){let m=l.id||`${l.bookId}:${l.chapter}:${l.verse}:${l.translation||"zulu"}`;t.has(m)||(o.push({...l,id:m,createdAt:l.createdAt||Date.now()}),t.add(m),n++)}return await this.context.globalState.update(N.STORAGE_KEY,o),this.onDidChangeEmitter.fire(),n}catch{return 0}}};N.STORAGE_KEY="dailyBread.bookmarks";var G=N;var y=E(require("vscode")),T=class d{constructor(e,a,o,t,n=43,l=3,m,v="kjv"){this.disposables=[];this.currentBookId=43;this.currentChapter=3;this.currentVerseTarget=16;this.primaryTranslation="kjv";this.parallelTranslation="zulu";this.isParallel=!1;this.panel=e,this.extensionUri=a,this.bibleManager=o,this.bookmarksManager=t,this.currentBookId=n,this.currentChapter=l,this.currentVerseTarget=m,this.primaryTranslation=v,this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.webview.onDidReceiveMessage(async c=>{switch(c.command){case"prevChapter":this.goToPreviousChapter();break;case"nextChapter":this.goToNextChapter();break;case"setChapter":this.currentChapter=c.chapter,this.currentVerseTarget=void 0,this.update();break;case"setBookAndChapter":this.currentBookId=c.bookId,this.currentChapter=c.chapter,this.currentVerseTarget=c.verse,this.update();break;case"toggleParallel":this.isParallel=!this.isParallel,this.update();break;case"setPrimaryTranslation":this.primaryTranslation=c.translation,this.update();break;case"setParallelTranslation":this.parallelTranslation=c.translation,this.update();break;case"copyVerse":{let g=this.bibleManager.getVerse(c.bookId,c.chapter,c.verse,c.translation);if(g){let h=c.translation==="zulu"?g.zuluBookName:g.bookName,u=`"${g.text}" \u2014 ${h} ${c.chapter}:${c.verse} (${c.translation.toUpperCase()})`;await y.env.clipboard.writeText(u),y.window.showInformationMessage(`Copied: ${h} ${c.chapter}:${c.verse}`)}break}case"bookmarkVerse":{let g=this.bibleManager.getVerse(c.bookId,c.chapter,c.verse,c.translation);if(g){if(this.bookmarksManager.isBookmarked(c.bookId,c.chapter,c.verse)){let h=`${c.bookId}:${c.chapter}:${c.verse}:${c.translation}`;await this.bookmarksManager.removeBookmark(h),y.window.showInformationMessage("Bookmark removed.")}else await this.bookmarksManager.addBookmark(g),y.window.showInformationMessage(`\u2B50 Bookmarked: ${g.bookName} ${c.chapter}:${c.verse}`);this.update()}break}case"openBookPicker":this.showBookPicker();break;case"jumpToReference":{if(c.ref){let g=this.bibleManager.parseReference(c.ref);g?this.navigate(g.book.id,g.chapter,g.verse,this.primaryTranslation):y.window.showInformationMessage(`Could not resolve cross-reference: ${c.ref}`)}break}case"adjustFontSize":{let g=y.workspace.getConfiguration("dailyBread"),h=g.get("fontSize",0),u=y.workspace.getConfiguration("editor").get("fontSize",14),k=Math.max(10,Math.min(36,(h===0?u:h)+c.delta));await g.update("fontSize",k,y.ConfigurationTarget.Global),this.update();break}case"setFontSize":{await y.workspace.getConfiguration("dailyBread").update("fontSize",c.size,y.ConfigurationTarget.Global),this.update();break}case"promptFontSize":{await y.commands.executeCommand("dailyBread.changeFontSize");break}}},null,this.disposables)}static updateCurrent(){var e;(e=d.currentPanel)==null||e.update()}static createOrShow(e,a,o,t=43,n=3,l,m="kjv"){let v=y.window.activeTextEditor?y.window.activeTextEditor.viewColumn:void 0;if(d.currentPanel)return d.currentPanel.panel.reveal(v),d.currentPanel.navigate(t,n,l,m),d.currentPanel;let c=y.window.createWebviewPanel("dailyBreadReader","Daily Bible Reader",v||y.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0,localResourceRoots:[y.Uri.joinPath(e,"media")]});return d.currentPanel=new d(c,e,a,o,t,n,l,m),d.currentPanel}navigate(e,a,o,t){this.currentBookId=e,this.currentChapter=a,this.currentVerseTarget=o,t&&(this.primaryTranslation=t),this.update()}goToPreviousChapter(){if(this.bibleManager.getBook(this.currentBookId)){if(this.currentChapter>1)this.currentChapter--;else if(this.currentBookId>1){this.currentBookId--;let a=this.bibleManager.getBook(this.currentBookId);this.currentChapter=a?a.chapters:1}this.currentVerseTarget=void 0,this.update()}}goToNextChapter(){let e=this.bibleManager.getBook(this.currentBookId);e&&(this.currentChapter<e.chapters?this.currentChapter++:this.currentBookId<66&&(this.currentBookId++,this.currentChapter=1),this.currentVerseTarget=void 0,this.update())}async showBookPicker(){let a=this.bibleManager.getBooks().map(l=>({label:this.primaryTranslation==="zulu"?`${l.zuluName} (${l.name})`:`${l.name} (${l.zuluName})`,description:`${l.testament} \u2022 ${l.chapters} chapters`,book:l})),o=await y.window.showQuickPick(a,{placeHolder:"Select a Book to Read (e.g. USenesisi, AmaHubo, UJohane, Romans)"});if(!o)return;let t=Array.from({length:o.book.chapters},(l,m)=>({label:`Chapter ${m+1}`,chapter:m+1})),n=await y.window.showQuickPick(t,{placeHolder:`Select Chapter (1 to ${o.book.chapters})`});n&&(this.currentBookId=o.book.id,this.currentChapter=n.chapter,this.currentVerseTarget=void 0,this.update())}update(){let e=this.bibleManager.getBook(this.currentBookId);if(!e)return;let a=this.primaryTranslation==="zulu"?e.zuluName:e.name;this.panel.title=`\u{1F4D6} ${a} ${this.currentChapter}`,this.panel.webview.html=this.getHtmlContent(e)}getHtmlContent(e){let a=this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.primaryTranslation),o=this.isParallel?this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.parallelTranslation):[],t=this.primaryTranslation==="zulu"?`${e.zuluName} (${e.name})`:`${e.name} (${e.zuluName})`,n=e.chapters,l="",m=Math.max(a.length,o.length);for(let i=0;i<m;i++){let p=i+1,f=a[i]||"",b=o[i]||"",w=this.bookmarksManager.isBookmarked(e.id,this.currentChapter,p),O=this.currentVerseTarget===p?"target-verse":"",X=w?"is-bookmarked":"",Z=this.bibleManager.resolveCrossReferences(e.id,this.currentChapter,p,this.primaryTranslation,8),_=Z.length>0,q="";_&&(q=`
          <div class="cross-ref-tray" id="cross-tray-${p}" style="display:none;">
            <div class="cross-ref-tray-title">\u{1F517} Cross References & Connected Verses (${Z.length})</div>
            <div class="cross-ref-list">
              ${Z.map(P=>`
                <div class="cross-ref-item" onclick="jumpRef('${P.ref}')" title="Click to open ${P.ref} in reader">
                  <div class="cr-header">
                    <span class="cr-citation">\u{1F517} ${P.bookName} ${P.chapter}:${P.verse}${P.endVerse?"-"+P.endVerse:""}</span>
                    ${P.anchor?`<span class="cr-anchor">on "${P.anchor}"</span>`:""}
                  </div>
                  <div class="cr-verse-text">"${P.text}"</div>
                </div>
              `).join("")}
            </div>
          </div>
        `),this.isParallel?l+=`
          <div class="verse-row ${O}" id="verse-${p}">
            <div class="verse-col primary-col ${X}">
              <span class="verse-num">${p}</span>
              <span class="verse-text">${f}</span>
              <div class="verse-actions">
                ${_?`<button title="Cross References" class="action-btn" onclick="toggleCrossRefs(${p})">\u{1F517}</button>`:""}
                <button title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${p}, '${this.primaryTranslation}')">${w?"\u2B50":"\u2606"}</button>
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${p}, '${this.primaryTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
            <div class="verse-col parallel-col">
              <span class="verse-num">${p}</span>
              <span class="verse-text">${b}</span>
              <div class="verse-actions">
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${p}, '${this.parallelTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
          </div>
          ${q}
        `:l+=`
          <div class="verse-item ${O} ${X}" id="verse-${p}">
            <span class="verse-num">${p}</span>
            <span class="verse-text">${f}</span>
            <span class="verse-actions">
              ${_?`<button class="action-btn" title="View Cross References" onclick="toggleCrossRefs(${p})">\u{1F517}</button>`:""}
              <button class="action-btn" title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${p}, '${this.primaryTranslation}')">${w?"\u2B50":"\u2606"}</button>
              <button class="action-btn" title="Copy Verse" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${p}, '${this.primaryTranslation}')">\u{1F4CB}</button>
            </span>
          </div>
          ${q}
        `}let v=y.workspace.getConfiguration("dailyBread"),c=v.get("fontSize",0),g=v.get("fontFamily","editor"),h=y.workspace.getConfiguration("editor"),u=h.get("fontSize",14),$=h.get("fontFamily",""),k="var(--vscode-editor-font-family, monospace)";g==="serif"?k='Georgia, Garamond, "Times New Roman", serif':g==="sans-serif"?k='var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)':g==="monospace"?k='var(--vscode-editor-font-family, Consolas, "Courier New", monospace)':g==="system"&&(k='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');let R=c===0?`Editor (${u}px)`:`${c}px`,r=c===0?`var(--vscode-editor-font-size, ${u}px)`:`${c}px`;return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t} ${this.currentChapter}</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --font-family: ${k};
      --reader-font-size: ${r};
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
        ${t} \u2014 Chapter ${this.currentChapter} \u25BE
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
          <span id="font-size-label">${R}</span>
        </button>
        <button class="btn font-btn" onclick="adjustFontSize(1)" title="Increase font size (A+)">A+</button>
        <button class="btn font-btn ${c===0?"btn-active":""}" onclick="resetFontSize()" title="Match VS Code Editor Font Size">Auto</button>
      </div>
    </div>
  </div>

  <div class="content-area">
    <div class="chapter-hero">
      <h1>${t}</h1>
      <div class="subtitle">Chapter ${this.currentChapter} of ${n}</div>
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
</html>`}isVisible(){return this.panel.visible}dispose(){for(d.currentPanel=void 0,this.panel.dispose();this.disposables.length;){let e=this.disposables.pop();e&&e.dispose()}}};var F=E(require("vscode")),H=class{constructor(){this.statusBarItem=F.window.createStatusBarItem(F.StatusBarAlignment.Right,100),this.statusBarItem.command="dailyBread.menu"}getVerse(){return this.currentVerse}getIconSymbol(e){switch(e){case"cross":return"\u271D ";case"book":return"\u{1F4D6} ";case"dove":return"\u{1F54A}\uFE0F ";case"none":default:return""}}update(e,a,o,t=!1,n=!1){this.currentVerse=e;let l=this.getIconSymbol(o),m=t?"\u2B50 ":"",v=n?"\u23F8 ":"",g=`${e.translation==="zulu"?e.zuluBookName:e.bookName} ${e.chapter}:${e.verse}`,h="";switch(a){case"compact":h=`${m}${v}${l}${g}`;break;case"preview":{let u=e.text.length>40?e.text.slice(0,37)+"...":e.text;h=`${m}${v}${l}${g} \u2014 "${u}"`;break}case"full":h=`${m}${v}${l}${g} \u2014 "${e.text}"`;break}this.statusBarItem.text=h,this.statusBarItem.tooltip=this.createTooltip(e,t,n),this.statusBarItem.show()}createTooltip(e,a,o=!1){let t=new F.MarkdownString;t.isTrusted=!0,t.supportHtml=!0;let n=e.translation==="zulu"?e.zuluBookName:e.bookName,l=e.translation==="zulu"?"isiZulu (IBhayibheli Elingcwele 1959)":e.translation==="web"?"World English Bible (WEB)":"King James Version (KJV)",m=a?"$(star-full) Bookmarked":"$(star-empty) Bookmark",v=a?"command:dailyBread.removeCurrentBookmark":"command:dailyBread.bookmarkCurrent",c=o?"$(play) Resume Auto-Rotation":"$(debug-pause) Pause Rotation",g=o?"Resume automatic rotating verses":"Pause auto-rotation (Reading Mode: prevents verses from changing while reading)";if(t.appendMarkdown(`| \u{1F4D6} **${n} ${e.chapter}:${e.verse}** | \u{1F310} **${l}** |
| :----------------------------------------------------------------------------- | -------------------------------------------------------------------: |

`),o&&t.appendMarkdown(`> \u23F8 **Reading Mode Active** \u2014 Auto-rotation is paused. Verses will not change automatically while you read.  
> [$(play) Click to Resume Auto-Rotation](command:dailyBread.togglePauseRotation "Resume automatic rotation") &nbsp;&bull;&nbsp; [$(sync) Advance Verse Manually](command:dailyBread.nextVerse "Advance to next verse")

`),t.appendMarkdown(`[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [${c}](command:dailyBread.togglePauseRotation "${g}") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${m}](${v} "Save to favorites") &nbsp;&bull;&nbsp; [$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; [$(copy) Copy](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")

`),t.appendMarkdown(`---

`),t.appendMarkdown(`## \u{1F4D6} **${n} ${e.chapter}:${e.verse}**

`),t.appendMarkdown(`> ### **"${e.text}"**

`),e.parallelText&&e.parallelTranslation){let h=e.parallelTranslation==="zulu"?"isiZulu (1959)":e.parallelTranslation==="web"?"WEB":"KJB";t.appendMarkdown(`> **Parallel (${h}):** *"${e.parallelText}"*

`)}if(t.appendMarkdown(`---

`),e.chapterVerses&&e.chapterVerses.length>0){let h=e.chapterVerses.length;t.appendMarkdown(`### \u{1F4DC} Full Chapter: **${n} Chapter ${e.chapter}** (Verses 1 to ${h})

*Scroll up and down to read all verses in context:*  

`);for(let u=0;u<h;u++){let $=u+1,k=e.chapterVerses[u];$===e.verse?t.appendMarkdown(`\u{1F449} **<mark>&nbsp;[${$}] ${k}&nbsp;</mark>** *(Active Verse)*  

`):t.appendMarkdown(`**${$}.** ${k}  

`)}t.appendMarkdown(`---

`)}if(e.resolvedCrossReferences&&e.resolvedCrossReferences.length>0){let h=e.resolvedCrossReferences;t.appendMarkdown(`### \u{1F517} Cross-References & Scripture Connections (${h.length} Passages)

*Scriptures connected by Treasury of Scripture Knowledge (TSK):*  

`);for(let u of h){let $=e.translation==="zulu"?u.zuluBookName:u.bookName,k=u.endVerse?`-${u.endVerse}`:"",R=`${$} ${u.chapter}:${u.verse}${k}`,r=`command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([u.ref]))}`,i=u.anchor?` &nbsp;*(connecting theme: "${u.anchor}")*`:"";t.appendMarkdown(`* **[\u{1F4D6} ${R}](${r} "Jump to ${R}")**${i}  
`),t.appendMarkdown(`  > *"${u.text}"*

`)}t.appendMarkdown(`---

`)}else if(e.crossReferences&&e.crossReferences.length>0){let h=[],u=new Set;for(let $ of e.crossReferences){for(let k of $.refs)if(!u.has(k)&&(u.add(k),h.push(k),h.length>=12))break;if(h.length>=12)break}if(h.length>0){let $=h.map(k=>`[\u{1F517} ${k}](command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([k]))} "Jump to ${k}")`).join(" &nbsp;&bull;&nbsp; ");t.appendMarkdown(`### \u{1F517} Cross-References:
${$}

---

`)}}return t.appendMarkdown(`### \u{1F9ED} Quick Navigation

[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [${c}](command:dailyBread.togglePauseRotation "${g}") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${m}](${v} "Save to favorites") &nbsp;&bull;&nbsp; [$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; [$(copy) Copy Verse](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")
`),t}dispose(){this.statusBarItem.dispose()}};var S=E(require("vscode")),W=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new S.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(!e)return Promise.resolve([new j("Old Testament (Isivumelwano Esidala)","OT",S.TreeItemCollapsibleState.Expanded,"testament"),new j("New Testament (Isivumelwano Esisha)","NT",S.TreeItemCollapsibleState.Expanded,"testament")]);if(e.itemType==="testament"){let a=this.bibleManager.getBooks().filter(o=>o.testament===e.contextValue);return Promise.resolve(a.map(o=>new j(`${o.name} (${o.zuluName})`,o.id.toString(),S.TreeItemCollapsibleState.Collapsed,"book",o)))}if(e.itemType==="book"&&e.book){let a=[];for(let o=1;o<=e.book.chapters;o++){let t=new j(`Chapter ${o}`,`${e.book.id}:${o}`,S.TreeItemCollapsibleState.None,"chapter",e.book,o);t.command={command:"dailyBread.openReaderAt",title:"Read Chapter",arguments:[e.book.id,o]},a.push(t)}return Promise.resolve(a)}return Promise.resolve([])}},j=class extends S.TreeItem{constructor(a,o,t,n,l,m){super(a,t);this.label=a;this.idValue=o;this.collapsibleState=t;this.itemType=n;this.book=l;this.chapter=m;this.contextValue=n,n==="testament"?this.iconPath=new S.ThemeIcon("library"):n==="book"?(this.iconPath=new S.ThemeIcon("book"),this.description=`${l==null?void 0:l.chapters} ch`):n==="chapter"&&(this.iconPath=new S.ThemeIcon("file-text"))}};var x=E(require("vscode")),K=class{constructor(e){this.bookmarksManager=e;this._onDidChangeTreeData=new x.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event;this.bookmarksManager.onDidChangeBookmarks(()=>{this.refresh()})}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(e)return Promise.resolve([]);let a=this.bookmarksManager.getBookmarks();if(a.length===0){let o=new L("No bookmarks saved yet",x.TreeItemCollapsibleState.None,void 0);return o.description="Click \u2B50 on status bar or reader",Promise.resolve([o])}return Promise.resolve(a.map(o=>{let t=new L(`${o.bookName} ${o.chapter}:${o.verse}`,x.TreeItemCollapsibleState.None,o);return t.description=o.note?`\u{1F4DD} ${o.note}`:`"${o.text.slice(0,30)}..."`,t.tooltip=new x.MarkdownString(`**${o.bookName} ${o.chapter}:${o.verse}** (${o.translation.toUpperCase()})

> "${o.text}"

${o.note?"\u{1F4DD} Note: "+o.note:""}`),t.command={command:"dailyBread.openReaderAt",title:"Open Verse in Reader",arguments:[o.bookId,o.chapter,o.verse,o.translation]},t}))}},L=class extends x.TreeItem{constructor(a,o,t){super(a,o);this.label=a;this.collapsibleState=o;this.bookmark=t;t?(this.contextValue="bookmarkItem",this.iconPath=new x.ThemeIcon("star-full",new x.ThemeColor("charts.yellow"))):(this.contextValue="emptyBookmark",this.iconPath=new x.ThemeIcon("info"))}};var D=E(require("vscode")),Q=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new D.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){let a=this.bibleManager.getCuratedTopics();if(!e)return Promise.resolve(Object.values(a).map(o=>{let t=new Y(`${o.name} (${o.zuluName})`,D.TreeItemCollapsibleState.Collapsed,"topic",o);return t.description=`${o.verses.length} verses`,t.tooltip=o.description,t}));if(e.itemType==="topic"&&e.topic){let o=e.topic.verses.map(t=>{let n=this.bibleManager.getBook(t.bookId),l=`${(n==null?void 0:n.zuluName)||""} / ${(n==null?void 0:n.name)||""} ${t.chapter}:${t.verse}`,m=new Y(l,D.TreeItemCollapsibleState.None,"verse",e.topic,t);return m.command={command:"dailyBread.openReaderAt",title:"Read Verse in Chapter",arguments:[t.bookId,t.chapter,t.verse]},m});return Promise.resolve(o)}return Promise.resolve([])}},Y=class extends D.TreeItem{constructor(a,o,t,n,l){super(a,o);this.label=a;this.collapsibleState=o;this.itemType=t;this.topic=n;this.verse=l;this.contextValue=t,t==="topic"?this.iconPath=new D.ThemeIcon("tag"):this.iconPath=new D.ThemeIcon("quote")}};var C,B,I,z;function le(d){C=new U(d.extensionPath),B=new G(d),I=new H;let e=new W(C);s.window.registerTreeDataProvider("dailyBreadExplorer",e);let a=new K(B);s.window.registerTreeDataProvider("dailyBreadBookmarks",a);let o=new Q(C);s.window.registerTreeDataProvider("dailyBreadTopics",o);let t=()=>{let r=s.workspace.getConfiguration("dailyBread");return{translation:r.get("translation","kjv"),displayMode:r.get("displayMode","preview"),icon:r.get("icon","cross"),rotationSchedule:r.get("rotationSchedule","15min"),rotateOnFileSave:r.get("rotateOnFileSave",!1),preventRotationWhileReading:r.get("preventRotationWhileReading",!0),topic:r.get("topic","all"),dualTranslation:r.get("dualTranslation","none"),fontSize:r.get("fontSize",0),fontFamily:r.get("fontFamily","editor")}},n=!1,l=!1,m=Date.now(),v=()=>{m=Date.now(),l&&!n&&(l=!1,R(!0))},c=r=>{let i=t(),p=B.isBookmarked(r.bookId,r.chapter,r.verse);I.update(r,i.displayMode,i.icon,p,n)},g=t(),h=g.dualTranslation!=="none"?g.dualTranslation:void 0,u=C.getRandomVerse(g.topic,g.translation,h);c(u);let $=()=>{if(z&&(clearInterval(z),z=void 0),n)return;let r=t(),i=0;switch(r.rotationSchedule){case"5min":i=5*60*1e3;break;case"15min":i=15*60*1e3;break;case"30min":i=30*60*1e3;break;case"60min":i=60*60*1e3;break;default:i=0;break}i>0&&(z=setInterval(()=>{R(!1)},i))},k=()=>{!n&&z&&$()},R=(r=!1)=>{if(n||T.currentPanel&&T.currentPanel.isVisible())return;let i=t();if(!r&&i.preventRotationWhileReading&&Date.now()-m>3e3){l=!0;return}l=!1;let p=i.dualTranslation!=="none"?i.dualTranslation:void 0;u=I.getVerse()?C.getNextCuratedVerse(I.getVerse(),i.topic,i.translation,p):C.getRandomVerse(i.topic,i.translation,p),c(u)};$(),d.subscriptions.push(s.window.onDidChangeActiveTextEditor(r=>{v(),r&&t().rotationSchedule==="onEditorOpen"&&R(!0)})),d.subscriptions.push(s.window.onDidChangeTextEditorSelection(()=>{v()})),d.subscriptions.push(s.workspace.onDidChangeTextDocument(r=>{r.contentChanges&&r.contentChanges.length>0&&v()})),d.subscriptions.push(s.window.onDidChangeWindowState(r=>{r.focused&&v()})),d.subscriptions.push(s.workspace.onDidSaveTextDocument(()=>{v(),t().rotateOnFileSave&&R(!0)})),d.subscriptions.push(s.workspace.onDidChangeConfiguration(r=>{if(r.affectsConfiguration("dailyBread")||r.affectsConfiguration("editor.fontSize")||r.affectsConfiguration("editor.fontFamily")){$(),T.updateCurrent();let i=t();if(u){let p=i.dualTranslation!=="none"?i.dualTranslation:void 0,f=C.getVerse(u.bookId,u.chapter,u.verse,i.translation,p);f&&(u=f,c(u))}}})),d.subscriptions.push(s.commands.registerCommand("dailyBread.nextVerse",()=>{l=!1,R(!0),k()})),d.subscriptions.push(s.commands.registerCommand("dailyBread.openReader",()=>{let r=I.getVerse()||u,i=t();T.createOrShow(d.extensionUri,C,B,r.bookId,r.chapter,r.verse,i.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.readChapter",()=>{let r=I.getVerse()||u,i=t();T.createOrShow(d.extensionUri,C,B,r.bookId,r.chapter,r.verse,i.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.openReaderAt",(r,i,p,f)=>{let b=t();T.createOrShow(d.extensionUri,C,B,r,i,p,f||b.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.bookmarkCurrent",async()=>{let r=I.getVerse()||u;if(!r)return;let i=await s.window.showInputBox({prompt:"Add an optional personal note/thought for this verse (leave empty to skip):",placeHolder:"e.g. Remember this for tough days at work"}),p=await s.window.showInputBox({prompt:"Add tags separated by comma (optional):",placeHolder:"e.g. encouragement, coding, hope"}),f=p?p.split(",").map(b=>b.trim()).filter(b=>b.length>0):void 0;await B.addBookmark(r,i,f),c(r),s.window.showInformationMessage(`\u2B50 Bookmarked: ${r.translation==="zulu"?r.zuluBookName:r.bookName} ${r.chapter}:${r.verse}`)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.removeCurrentBookmark",async()=>{let r=I.getVerse()||u;if(!r)return;let i=`${r.bookId}:${r.chapter}:${r.verse}:${r.translation}`;await B.removeBookmark(i),c(r),s.window.showInformationMessage("Bookmark removed.")})),d.subscriptions.push(s.commands.registerCommand("dailyBread.showBookmarks",async()=>{let r=B.getBookmarks();if(r.length===0){s.window.showInformationMessage("You have no saved bookmarks yet.");return}let i=r.map(f=>({label:`\u2B50 ${f.bookName} ${f.chapter}:${f.verse} (${f.translation.toUpperCase()})`,description:f.note?`\u{1F4DD} ${f.note}`:`"${f.text.slice(0,45)}..."`,detail:f.tags&&f.tags.length>0?`Tags: ${f.tags.map(b=>"#"+b).join(" ")}`:void 0,bookmark:f})),p=await s.window.showQuickPick(i,{placeHolder:"Select a saved bookmark to open in reader"});p&&T.createOrShow(d.extensionUri,C,B,p.bookmark.bookId,p.bookmark.chapter,p.bookmark.verse,p.bookmark.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.selectTopic",async()=>{let r=C.getCuratedTopics(),i=t(),p=[{label:"$(sparkle) All Scripture / Any Topic",description:"Cycle across all curated themes",topicId:"all"},...Object.values(r).map(b=>({label:`$(tag) ${b.name} (${b.zuluName})`,description:`${b.verses.length} verses \u2014 ${b.description}`,topicId:b.id}))],f=await s.window.showQuickPick(p,{placeHolder:"Select Scripture Topic / Mood for Status Bar Rotation"});f&&(await s.workspace.getConfiguration("dailyBread").update("topic",f.topicId,s.ConfigurationTarget.Global),R(!0),s.window.showInformationMessage(`Daily Bible topic set to: ${f.label}`))})),d.subscriptions.push(s.commands.registerCommand("dailyBread.switchTranslation",async()=>{let r=[{label:"\u{1F4DC} English \u2014 King James Bible / Version (KJB / KJV)",description:"Classic, majestic, traditional poetic English (1611/1769) [Default]",translation:"kjv"},{label:"\u{1F1EC}\u{1F1E7} English \u2014 World English Bible (WEB)",description:"Clean, modern, highly readable English public domain Bible",translation:"web"},{label:"\u{1F1FF}\u{1F1E6} isiZulu \u2014 IBhayibheli Elingcwele (1959)",description:"South African Zulu 1959 Translation with authentic Zulu book names",translation:"zulu"}],i=await s.window.showQuickPick(r,{placeHolder:"Choose Bible Translation"});if(i){await s.workspace.getConfiguration("dailyBread").update("translation",i.translation,s.ConfigurationTarget.Global);let p=t(),f=p.dualTranslation!=="none"?p.dualTranslation:void 0,b=I.getVerse()||u,w=C.getVerse(b.bookId,b.chapter,b.verse,i.translation,f);w&&(u=w,c(u)),s.window.showInformationMessage(`Active translation: ${i.label}`)}})),d.subscriptions.push(s.commands.registerCommand("dailyBread.jumpTo",async()=>{let r=await s.window.showInputBox({prompt:"Enter book & chapter/verse in English or isiZulu",placeHolder:"e.g. Joh 3:16, AmaHubo 23:1, Phil 4:13, Mathewu 6:33, Gen 1:1"});if(!r)return;let i=C.parseReference(r);if(!i){s.window.showErrorMessage(`Could not find reference: "${r}". Try format like "Joh 3:16" or "Hubo 23:1".`);return}let p=t(),f=i.verse||1,b=C.getVerse(i.book.id,i.chapter,f,p.translation);b&&(u=b,c(u),k()),T.createOrShow(d.extensionUri,C,B,i.book.id,i.chapter,i.verse,p.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.jumpToRef",r=>{if(!r)return;let i=C.parseReference(r);if(!i){s.window.showWarningMessage(`Could not resolve cross-reference: ${r}`);return}let p=t(),f=i.verse||1,b=C.getVerse(i.book.id,i.chapter,f,p.translation);b&&(u=b,c(u),k()),T.createOrShow(d.extensionUri,C,B,i.book.id,i.chapter,i.verse,p.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.showCrossReferences",async()=>{let r=I.getVerse()||u;if(!r)return;let i=t(),p=C.resolveCrossReferences(r.bookId,r.chapter,r.verse,i.translation,20);if(p.length===0){s.window.showInformationMessage(`No cross references indexed for ${r.bookName} ${r.chapter}:${r.verse}`);return}let f=p.map(w=>{let A=i.translation==="zulu"?w.zuluBookName:w.bookName,O=w.endVerse?`-${w.endVerse}`:"";return{label:`\u{1F517} ${A} ${w.chapter}:${w.verse}${O}`,description:w.anchor?`Phrase: "${w.anchor}"`:void 0,detail:`"${w.text}"`,refString:w.ref}}),b=await s.window.showQuickPick(f,{placeHolder:`Cross References with Scriptures for ${r.bookName} ${r.chapter}:${r.verse} (${f.length} passages)`});b&&s.commands.executeCommand("dailyBread.jumpToRef",b.refString)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.randomChapter",()=>{let r=C.getBooks(),i=r[Math.floor(Math.random()*r.length)],p=Math.floor(Math.random()*i.chapters)+1,f=t();T.createOrShow(d.extensionUri,C,B,i.id,p,1,f.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.copyVerse",async()=>{let r=I.getVerse()||u;if(!r)return;let i=r.translation==="zulu"?r.zuluBookName:r.bookName,p=`"${r.text}" \u2014 ${i} ${r.chapter}:${r.verse} (${r.translation.toUpperCase()})`;await s.env.clipboard.writeText(p),s.window.showInformationMessage(`Copied: ${i} ${r.chapter}:${r.verse}`)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.exportBookmarks",async()=>{let r=await s.window.showQuickPick([{label:"Markdown Document (.md)",format:"md"},{label:"JSON Dataset (.json)",format:"json"}],{placeHolder:"Choose Export Format"});if(!r)return;let i=r.format==="md"?B.exportBookmarksMarkdown():B.exportBookmarksJson(),p=await s.workspace.openTextDocument({content:i,language:r.format==="md"?"markdown":"json"});await s.window.showTextDocument(p)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.deleteBookmarkItem",async r=>{r&&r.bookmark&&(await B.removeBookmark(r.bookmark.id),s.window.showInformationMessage("Bookmark removed."))})),d.subscriptions.push(s.commands.registerCommand("dailyBread.menu",async()=>{let r=I.getVerse()||u,i=B.isBookmarked(r.bookId,r.chapter,r.verse),p=r.translation==="zulu"?r.zuluBookName:r.bookName,f=[{label:"$(sync) Next Verse",description:"Ctrl+Alt+B / Cmd+Alt+B",detail:"Fetch next uplifting scripture into status bar"},{label:"$(book) Read Full Chapter in Editor",description:`${p} Chapter ${r.chapter}`,detail:"Open clean in-editor Bible tab with side-by-side translation option"},{label:"$(link) View Verse Cross-References",description:"Treasury of Scripture Knowledge",detail:"Explore connected passages and related scriptures for this verse"},{label:i?"$(star-full) Remove Bookmark":"$(star-empty) Bookmark Current Verse",description:`${p} ${r.chapter}:${r.verse}`,detail:i?"Remove from saved favorites":"Save verse with optional notes and tags"},{label:"$(bookmark) View All Bookmarks",description:`${B.getBookmarks().length} saved verses`,detail:"Browse, filter, and jump to your saved favorites"},{label:n?"$(play) Resume Auto-Rotation":"$(debug-pause) Pause Auto-Rotation (Reading Mode)",description:n?"Auto-rotation currently paused":`Schedule: ${t().rotationSchedule}`,detail:n?"Resume automatic scripture cycling":"Freeze verse so it never changes while you are reading"},{label:"$(clock) Change Rotation Schedule",description:`Current: ${t().rotationSchedule}`,detail:"Adjust how often verses change (5min, 15min, 30min, 60min, onEditorOpen, or Manual)"},{label:"$(tag) Select Topic / Mood",description:`Current: ${t().topic}`,detail:"Filter status bar by Peace, Focus, Strength, Joy, Gratitude, or Comfort"},{label:"$(text-size) Change Font Size",description:t().fontSize===0?`Auto / Match Editor (${s.workspace.getConfiguration("editor").get("fontSize",14)}px)`:`${t().fontSize}px`,detail:"Adjust scripture text size or sync automatically with VS Code editor font"},{label:"$(symbol-text) Change Font Family",description:`Current: ${t().fontFamily}`,detail:"Switch between Editor font, Book Serif, Clean Sans-Serif, or Monospace"},{label:"$(globe) Switch Translation",description:`Current: ${t().translation.toUpperCase()}`,detail:"Toggle between isiZulu 1959, English WEB, and English KJV"},{label:"$(search) Search & Jump to Verse",description:"Type any reference (e.g. Joh 3:16, Hubo 23:1)",detail:"Instantly jump to any chapter and verse in the Bible"},{label:"$(dice) Random Chapter",description:"Explore scripture unpredictably",detail:"Pick a random chapter from Genesis to Revelation"},{label:"$(clippy) Copy Verse to Clipboard",description:`${p} ${r.chapter}:${r.verse}`,detail:"Copy reference and scripture text formatted for sharing"},{label:"$(gear) Configure Extension Settings",description:"Icons, Display modes, Rotation intervals",detail:"Open Daily Bible settings in VS Code Preferences"}],b=await s.window.showQuickPick(f,{placeHolder:`\u{1F4D6} Daily Bible \u2014 ${p} ${r.chapter}:${r.verse}`});b&&(b.label.includes("Next Verse")?R(!0):b.label.includes("Auto-Rotation")?s.commands.executeCommand("dailyBread.togglePauseRotation"):b.label.includes("Change Rotation Schedule")?s.commands.executeCommand("dailyBread.setRotationSchedule"):b.label.includes("Read Full Chapter")?s.commands.executeCommand("dailyBread.readChapter"):b.label.includes("View Verse Cross-References")?s.commands.executeCommand("dailyBread.showCrossReferences"):b.label.includes("Bookmark Current Verse")?s.commands.executeCommand("dailyBread.bookmarkCurrent"):b.label.includes("Remove Bookmark")?s.commands.executeCommand("dailyBread.removeCurrentBookmark"):b.label.includes("View All Bookmarks")?s.commands.executeCommand("dailyBread.showBookmarks"):b.label.includes("Select Topic")?s.commands.executeCommand("dailyBread.selectTopic"):b.label.includes("Change Font Size")?s.commands.executeCommand("dailyBread.changeFontSize"):b.label.includes("Change Font Family")?s.commands.executeCommand("dailyBread.changeFontFamily"):b.label.includes("Switch Translation")?s.commands.executeCommand("dailyBread.switchTranslation"):b.label.includes("Search & Jump")?s.commands.executeCommand("dailyBread.jumpTo"):b.label.includes("Random Chapter")?s.commands.executeCommand("dailyBread.randomChapter"):b.label.includes("Copy Verse")?s.commands.executeCommand("dailyBread.copyVerse"):b.label.includes("Configure Extension Settings")&&s.commands.executeCommand("workbench.action.openSettings","dailyBread"))})),d.subscriptions.push(s.commands.registerCommand("dailyBread.changeFontSize",async()=>{let r=s.workspace.getConfiguration("editor").get("fontSize",14),i=s.workspace.getConfiguration("dailyBread").get("fontSize",0),p=[{label:`$(sync) Auto \u2014 Match Editor Font (${r}px)`,description:i===0?"Currently Active":"Automatically syncs with editor.fontSize",size:0},{label:"$(text-size) Small (12px)",description:i===12?"Active":"",size:12},{label:"$(text-size) Compact (14px)",description:i===14?"Active":"",size:14},{label:"$(text-size) Medium (16px)",description:i===16?"Active":"",size:16},{label:"$(text-size) Large (18px)",description:i===18?"Active":"",size:18},{label:"$(text-size) Extra Large (22px)",description:i===22?"Active":"",size:22},{label:"$(text-size) Huge (26px)",description:i===26?"Active":"",size:26},{label:"$(edit) Custom Size...",description:"Type an exact pixel size",size:-1}],f=await s.window.showQuickPick(p,{placeHolder:`Select scripture font size (Current: ${i===0?`Auto / Match Editor (${r}px)`:`${i}px`})`});if(f)if(f.size===-1){let b=await s.window.showInputBox({prompt:"Enter scripture font size in pixels (10 - 48, or 0 for Auto / Match Editor)",value:i===0?r.toString():i.toString(),validateInput:w=>{let A=parseInt(w,10);return isNaN(A)||A<0||A>48?"Please enter a number between 10 and 48 (or 0 for Auto)":null}});if(b!==void 0){let w=parseInt(b,10);await s.workspace.getConfiguration("dailyBread").update("fontSize",w,s.ConfigurationTarget.Global),s.window.showInformationMessage(`Daily Bible font size set to ${w===0?`Auto / Match Editor (${r}px)`:`${w}px`}`)}}else await s.workspace.getConfiguration("dailyBread").update("fontSize",f.size,s.ConfigurationTarget.Global),s.window.showInformationMessage(`Daily Bible font size set to ${f.size===0?`Auto / Match Editor (${r}px)`:`${f.size}px`}`)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.changeFontFamily",async()=>{let r=s.workspace.getConfiguration("editor").get("fontFamily","monospace"),i=s.workspace.getConfiguration("dailyBread").get("fontFamily","editor"),p=[{label:"$(editor) Match Editor Font",description:i==="editor"?"Currently Active":r,detail:"Syncs automatically with your active VS Code code editor font",family:"editor"},{label:"$(book) Book Serif",description:i==="serif"?"Currently Active":"Georgia, Garamond, Times New Roman, serif",detail:"Classic, warm editorial book typesetting",family:"serif"},{label:"$(symbol-text) Clean Sans-Serif",description:i==="sans-serif"?"Currently Active":"Segoe UI, -apple-system, Roboto, sans-serif",detail:"Modern crisp user interface typography",family:"sans-serif"},{label:"$(terminal) Monospace Code Font",description:i==="monospace"?"Currently Active":"Consolas, Courier New, monospace",detail:"Fixed-width developer aesthetic",family:"monospace"},{label:"$(device-desktop) System Default",description:i==="system"?"Currently Active":"Operating system native font",detail:"Native OS font rendering",family:"system"}],f=await s.window.showQuickPick(p,{placeHolder:`Select Bible reader font family (Current: ${i})`});f&&(await s.workspace.getConfiguration("dailyBread").update("fontFamily",f.family,s.ConfigurationTarget.Global),s.window.showInformationMessage(`Daily Bible font family set to: ${f.label.replace(/\$\([^)]+\)\s*/,"")}`))})),d.subscriptions.push(s.commands.registerCommand("dailyBread.togglePauseRotation",()=>{n=!n,n?(z&&(clearInterval(z),z=void 0),s.window.showInformationMessage("\u23F8 Daily Bible: Auto-rotation paused (Reading Mode active). Verses will not change while you read.")):($(),s.window.showInformationMessage("\u25B6 Daily Bible: Auto-rotation resumed.")),u&&c(u)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.setRotationSchedule",async()=>{let r=t().rotationSchedule,i=[{label:"$(clock) Every 15 minutes",description:r==="15min"?"Currently Active":"",detail:"Recommended: Balanced rotation frequency",value:"15min"},{label:"$(clock) Every 30 minutes",description:r==="30min"?"Currently Active":"",detail:"Spacious interval for longer reading",value:"30min"},{label:"$(clock) Every 60 minutes",description:r==="60min"?"Currently Active":"",detail:"One verse per hour",value:"60min"},{label:"$(clock) Every 5 minutes",description:r==="5min"?"Currently Active":"",detail:"Frequent rotation",value:"5min"},{label:"$(edit) On Editor Open",description:r==="onEditorOpen"?"Currently Active":"",detail:"Rotate whenever you switch or open an editor file",value:"onEditorOpen"},{label:"$(debug-pause) Manual Only (Never change automatically)",description:r==="manual"?"Currently Active":"",detail:"Verses only change when you press Ctrl+Alt+B / Cmd+Alt+B or click Next",value:"manual"}],p=await s.window.showQuickPick(i,{placeHolder:`Select how often the status bar scripture rotates (Current: ${r})`});p&&(await s.workspace.getConfiguration("dailyBread").update("rotationSchedule",p.value,s.ConfigurationTarget.Global),s.window.showInformationMessage(`Daily Bible rotation schedule set to: ${p.label.replace(/\$\([^)]+\)\s*/,"")}`))})),d.subscriptions.push(I)}function de(){z&&(clearInterval(z),z=void 0)}0&&(module.exports={activate,deactivate});
