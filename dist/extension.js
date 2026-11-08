"use strict";var te=Object.create;var A=Object.defineProperty;var oe=Object.getOwnPropertyDescriptor;var re=Object.getOwnPropertyNames;var ae=Object.getPrototypeOf,ne=Object.prototype.hasOwnProperty;var se=(d,e)=>{for(var a in e)A(d,a,{get:e[a],enumerable:!0})},X=(d,e,a,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let t of re(e))!ne.call(d,t)&&t!==a&&A(d,t,{get:()=>e[t],enumerable:!(o=oe(e,t))||o.enumerable});return d};var z=(d,e,a)=>(a=d!=null?te(ae(d)):{},X(e||!d||!d.__esModule?A(a,"default",{value:d,enumerable:!0}):a,d)),ie=d=>X(A({},"__esModule",{value:!0}),d);var de={};se(de,{activate:()=>ce,deactivate:()=>le});module.exports=ie(de);var c=z(require("vscode"));var I=z(require("fs")),S=z(require("path")),F=class{constructor(e){this.books=[];this.booksById=new Map;this.aliasMap=new Map;this.topics={};this.cache=new Map;this.crossRefCache=new Map;this.curatedVerseList=[];let a=[S.join(e,"data"),S.join(e,"..","data"),S.resolve(__dirname,"..","data"),S.resolve(__dirname,"data"),S.resolve(process.cwd(),"data")],o=a[0];for(let t of a)if(I.existsSync(S.join(t,"books.json"))){o=t;break}this.dataDir=o,this.loadMetadata()}loadMetadata(){let e=S.join(this.dataDir,"books.json");if(I.existsSync(e)){this.books=JSON.parse(I.readFileSync(e,"utf8"));for(let o of this.books)this.booksById.set(o.id,o),this.indexBookAliases(o)}let a=S.join(this.dataDir,"curated_topics.json");if(I.existsSync(a)){this.topics=JSON.parse(I.readFileSync(a,"utf8"));let o=new Set;for(let t of Object.values(this.topics))for(let s of t.verses){let l=`${s.bookId}:${s.chapter}:${s.verse}`;o.has(l)||(o.add(l),this.curatedVerseList.push(s))}}}normalizeText(e){return e.toLowerCase().replace(/[\u2018\u2019\u201C\u201D'"`\-_—–:.,;!]/g,"").replace(/\s+/g," ").trim()}indexBookAliases(e){let a=t=>{let s=this.normalizeText(t);s&&this.aliasMap.set(s,e)};a(e.name),a(e.zuluName),a(e.code);for(let t of e.aliases)a(t);let o=["u-","u","ku","kuma","kwabase","eka","aba","ama","izi","isi","um"];for(let t of o){let s=e.zuluName.toLowerCase();s.startsWith(t)&&s.length>t.length+2&&a(s.slice(t.length))}}getBooks(){return this.books}getBook(e){return this.booksById.get(e)}getCuratedTopics(){return this.topics}findBook(e){let a=this.normalizeText(e);if(!a)return;if(this.aliasMap.has(a))return this.aliasMap.get(a);let o=a.replace(/\s+/g,"");for(let[t,s]of this.aliasMap.entries())if(t.replace(/\s+/g,"")===o)return s;for(let[t,s]of this.aliasMap.entries())if(t.startsWith(a)||a.startsWith(t))return s;if(a.length>=3){for(let[t,s]of this.aliasMap.entries())if(t.includes(a)||a.includes(t))return s}}parseReference(e){let a=e.trim();if(!a)return;let o=a.match(/^([1-3]?\s*[A-Za-z\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/);if(!o){let i=a.match(/^([1-3]?\s*[\p{L}\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/u);if(!i)return;let b=i[1].trim(),h=parseInt(i[2],10),g=i[3]?parseInt(i[3],10):void 0,r=i[4]?parseInt(i[4],10):void 0,n=this.findBook(b);return n?{book:n,chapter:h,verse:g,endVerse:r}:void 0}let t=o[1].trim(),s=parseInt(o[2],10),l=o[3]?parseInt(o[3],10):void 0,u=o[4]?parseInt(o[4],10):void 0,v=this.findBook(t);if(v&&!(s<1||s>v.chapters))return{book:v,chapter:s,verse:l,endVerse:u}}getVerseRange(e,a,o,t,s="kjv"){let l=this.getChapter(e,a,s);if(l.length===0||o<1||o>l.length)return"";if(!t||t<=o)return l[o-1]||"";let u=Math.min(t,l.length,o+2),v=[];for(let i=o;i<=u;i++){let b=l[i-1];b&&v.push(`[${i}] ${b}`)}return t>u&&v.push("..."),v.join(" ")}resolveCrossReferences(e,a,o,t="kjv",s=8){let l=this.getCrossReferences(e,a,o),u=[],v=new Set;for(let i of l)for(let b of i.refs){if(v.has(b))continue;v.add(b);let h=this.parseReference(b);if(h&&h.verse){let g=this.getVerseRange(h.book.id,h.chapter,h.verse,h.endVerse,t);g&&u.push({ref:b,bookId:h.book.id,bookName:h.book.name,zuluBookName:h.book.zuluName,chapter:h.chapter,verse:h.verse,endVerse:h.endVerse,text:g,anchor:i.anchor})}if(u.length>=s)return u}return u}loadBookChapters(e,a){let o=`${a}:${e}`;if(this.cache.has(o))return this.cache.get(o);let t=S.join(this.dataDir,"translations",a,`${e}.json`);if(!I.existsSync(t))return[];try{let s=JSON.parse(I.readFileSync(t,"utf8"));return this.cache.set(o,s),s}catch{return[]}}loadBookCrossReferences(e){if(this.crossRefCache.has(e))return this.crossRefCache.get(e);let a=S.join(this.dataDir,"cross_references",`${e}.json`);if(!I.existsSync(a))return{};try{let o=JSON.parse(I.readFileSync(a,"utf8"));return this.crossRefCache.set(e,o),o}catch{return{}}}getCrossReferences(e,a,o){let t=this.loadBookCrossReferences(e);return t[a.toString()]&&t[a.toString()][o.toString()]||[]}getFlattenedCrossReferences(e,a,o){let t=this.getCrossReferences(e,a,o),s=new Set;for(let l of t)for(let u of l.refs)s.add(u);return Array.from(s)}getChapter(e,a,o){let t=this.loadBookChapters(e,o);return a<1||a>t.length?[]:t[a-1]||[]}getVerse(e,a,o,t,s){let l=this.getBook(e);if(!l)return;let u=this.getChapter(e,a,t);if(o<1||o>u.length)return;let v=u[o-1],i;if(s&&s!==t){let g=this.getChapter(e,a,s);o>=1&&o<=g.length&&(i=g[o-1])}let b=this.getCrossReferences(e,a,o),h=this.resolveCrossReferences(e,a,o,t,12);return{bookId:e,bookName:l.name,zuluBookName:l.zuluName,chapter:a,verse:o,text:v,translation:t,parallelText:i,parallelTranslation:s&&s!==t?s:void 0,crossReferences:b.length>0?b:void 0,resolvedCrossReferences:h.length>0?h:void 0,chapterVerses:u}}getRandomVerse(e,a="kjv",o){let t=[];e&&e!=="all"&&this.topics[e]?t=this.topics[e].verses:t=this.curatedVerseList,t.length===0&&(t=[{bookId:43,chapter:3,verse:16}]);let s=Math.floor(Math.random()*t.length),l=t[s],u=this.getVerse(l.bookId,l.chapter,l.verse,a,o);return u||{bookId:43,bookName:"John",zuluBookName:"UJohane",chapter:3,verse:16,text:"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",translation:a}}getNextCuratedVerse(e,a,o="kjv",t){let s=[];if(a&&a!=="all"&&this.topics[a]?s=this.topics[a].verses:s=this.curatedVerseList,s.length===0)return this.getRandomVerse(a,o,t);let u=(s.findIndex(i=>i.bookId===e.bookId&&i.chapter===e.chapter&&i.verse===e.verse)+1)%s.length,v=s[u];return this.getVerse(v.bookId,v.chapter,v.verse,o,t)||this.getRandomVerse(a,o,t)}getNextSequentialVerse(e,a="kjv",o){let t=this.getBook(e.bookId);if(!t)return this.getRandomVerse(void 0,a,o);let s=this.getChapter(e.bookId,e.chapter,a);if(e.verse<s.length)return this.getVerse(e.bookId,e.chapter,e.verse+1,a,o);if(e.chapter<t.chapters)return this.getVerse(e.bookId,e.chapter+1,1,a,o);let l=e.bookId%66+1;return this.getVerse(l,1,1,a,o)}};var ee=z(require("vscode")),D=class D{constructor(e){this.onDidChangeEmitter=new ee.EventEmitter;this.onDidChangeBookmarks=this.onDidChangeEmitter.event;this.context=e}getBookmarks(){return[...this.context.globalState.get(D.STORAGE_KEY,[])].sort((a,o)=>o.createdAt-a.createdAt)}isBookmarked(e,a,o){return this.getBookmarks().some(s=>s.bookId===e&&s.chapter===a&&s.verse===o)}getBookmark(e){return this.getBookmarks().find(a=>a.id===e)}async addBookmark(e,a,o){let t=this.getBookmarks(),s=`${e.bookId}:${e.chapter}:${e.verse}:${e.translation}`,l=t.filter(i=>i.id!==s),u=e.translation==="zulu"?e.zuluBookName:e.bookName,v={id:s,bookId:e.bookId,chapter:e.chapter,verse:e.verse,translation:e.translation,text:e.text,bookName:u,createdAt:Date.now(),note:a,tags:o};return l.unshift(v),await this.context.globalState.update(D.STORAGE_KEY,l),this.onDidChangeEmitter.fire(),v}async removeBookmark(e){let o=this.getBookmarks().filter(t=>t.id!==e);await this.context.globalState.update(D.STORAGE_KEY,o),this.onDidChangeEmitter.fire()}async updateBookmark(e,a,o){let t=this.getBookmarks(),s=t.find(l=>l.id===e);s&&(a!==void 0&&(s.note=a),o!==void 0&&(s.tags=o),await this.context.globalState.update(D.STORAGE_KEY,t),this.onDidChangeEmitter.fire())}exportBookmarksMarkdown(){let e=this.getBookmarks();if(e.length===0)return`# Daily Bible Bookmarks

No bookmarks saved yet.`;let a=`# \u{1F4D6} Daily Bible \u2014 Saved Bookmarks & Favorites

`;a+=`*Exported on ${new Date().toLocaleDateString()}*

---

`;for(let o of e){let t=new Date(o.createdAt).toLocaleDateString();a+=`### ${o.bookName} ${o.chapter}:${o.verse} (${o.translation.toUpperCase()})
`,a+=`> "${o.text}"

`,o.note&&(a+=`\u{1F4DD} **Note:** ${o.note}

`),o.tags&&o.tags.length>0&&(a+=`\u{1F3F7}\uFE0F **Tags:** ${o.tags.map(s=>"`#"+s+"`").join(" ")}

`),a+=`*Saved on ${t}*

---

`}return a}exportBookmarksJson(){return JSON.stringify(this.getBookmarks(),null,2)}async importBookmarks(e){try{let a=JSON.parse(e);if(!Array.isArray(a))return 0;let o=this.getBookmarks(),t=new Set(o.map(l=>l.id)),s=0;for(let l of a)if(l.bookId&&l.chapter&&l.verse&&l.text){let u=l.id||`${l.bookId}:${l.chapter}:${l.verse}:${l.translation||"zulu"}`;t.has(u)||(o.push({...l,id:u,createdAt:l.createdAt||Date.now()}),t.add(u),s++)}return await this.context.globalState.update(D.STORAGE_KEY,o),this.onDidChangeEmitter.fire(),s}catch{return 0}}};D.STORAGE_KEY="dailyBread.bookmarks";var j=D;var y=z(require("vscode")),x=class d{constructor(e,a,o,t,s=43,l=3,u,v="kjv"){this.disposables=[];this.currentBookId=43;this.currentChapter=3;this.currentVerseTarget=16;this.primaryTranslation="kjv";this.parallelTranslation="zulu";this.isParallel=!1;this.panel=e,this.extensionUri=a,this.bibleManager=o,this.bookmarksManager=t,this.currentBookId=s,this.currentChapter=l,this.currentVerseTarget=u,this.primaryTranslation=v,this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.webview.onDidReceiveMessage(async i=>{switch(i.command){case"prevChapter":this.goToPreviousChapter();break;case"nextChapter":this.goToNextChapter();break;case"setChapter":this.currentChapter=i.chapter,this.currentVerseTarget=void 0,this.update();break;case"setBookAndChapter":this.currentBookId=i.bookId,this.currentChapter=i.chapter,this.currentVerseTarget=i.verse,this.update();break;case"toggleParallel":this.isParallel=!this.isParallel,this.update();break;case"setPrimaryTranslation":this.primaryTranslation=i.translation,this.update();break;case"setParallelTranslation":this.parallelTranslation=i.translation,this.update();break;case"copyVerse":{let b=this.bibleManager.getVerse(i.bookId,i.chapter,i.verse,i.translation);if(b){let h=i.translation==="zulu"?b.zuluBookName:b.bookName,g=`"${b.text}" \u2014 ${h} ${i.chapter}:${i.verse} (${i.translation.toUpperCase()})`;await y.env.clipboard.writeText(g),y.window.showInformationMessage(`Copied: ${h} ${i.chapter}:${i.verse}`)}break}case"bookmarkVerse":{let b=this.bibleManager.getVerse(i.bookId,i.chapter,i.verse,i.translation);if(b){if(this.bookmarksManager.isBookmarked(i.bookId,i.chapter,i.verse)){let h=`${i.bookId}:${i.chapter}:${i.verse}:${i.translation}`;await this.bookmarksManager.removeBookmark(h),y.window.showInformationMessage("Bookmark removed.")}else await this.bookmarksManager.addBookmark(b),y.window.showInformationMessage(`\u2B50 Bookmarked: ${b.bookName} ${i.chapter}:${i.verse}`);this.update()}break}case"openBookPicker":this.showBookPicker();break;case"jumpToReference":{if(i.ref){let b=this.bibleManager.parseReference(i.ref);b?this.navigate(b.book.id,b.chapter,b.verse,this.primaryTranslation):y.window.showInformationMessage(`Could not resolve cross-reference: ${i.ref}`)}break}case"adjustFontSize":{let b=y.workspace.getConfiguration("dailyBread"),h=b.get("fontSize",0),g=y.workspace.getConfiguration("editor").get("fontSize",14),n=Math.max(10,Math.min(36,(h===0?g:h)+i.delta));await b.update("fontSize",n,y.ConfigurationTarget.Global),this.update();break}case"setFontSize":{await y.workspace.getConfiguration("dailyBread").update("fontSize",i.size,y.ConfigurationTarget.Global),this.update();break}case"promptFontSize":{await y.commands.executeCommand("dailyBread.changeFontSize");break}}},null,this.disposables)}static updateCurrent(){var e;(e=d.currentPanel)==null||e.update()}static createOrShow(e,a,o,t=43,s=3,l,u="kjv"){let v=y.window.activeTextEditor?y.window.activeTextEditor.viewColumn:void 0;if(d.currentPanel)return d.currentPanel.panel.reveal(v),d.currentPanel.navigate(t,s,l,u),d.currentPanel;let i=y.window.createWebviewPanel("dailyBreadReader","Daily Bible Reader",v||y.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0,localResourceRoots:[y.Uri.joinPath(e,"media")]});return d.currentPanel=new d(i,e,a,o,t,s,l,u),d.currentPanel}navigate(e,a,o,t){this.currentBookId=e,this.currentChapter=a,this.currentVerseTarget=o,t&&(this.primaryTranslation=t),this.update()}goToPreviousChapter(){if(this.bibleManager.getBook(this.currentBookId)){if(this.currentChapter>1)this.currentChapter--;else if(this.currentBookId>1){this.currentBookId--;let a=this.bibleManager.getBook(this.currentBookId);this.currentChapter=a?a.chapters:1}this.currentVerseTarget=void 0,this.update()}}goToNextChapter(){let e=this.bibleManager.getBook(this.currentBookId);e&&(this.currentChapter<e.chapters?this.currentChapter++:this.currentBookId<66&&(this.currentBookId++,this.currentChapter=1),this.currentVerseTarget=void 0,this.update())}async showBookPicker(){let a=this.bibleManager.getBooks().map(l=>({label:this.primaryTranslation==="zulu"?`${l.zuluName} (${l.name})`:`${l.name} (${l.zuluName})`,description:`${l.testament} \u2022 ${l.chapters} chapters`,book:l})),o=await y.window.showQuickPick(a,{placeHolder:"Select a Book to Read (e.g. USenesisi, AmaHubo, UJohane, Romans)"});if(!o)return;let t=Array.from({length:o.book.chapters},(l,u)=>({label:`Chapter ${u+1}`,chapter:u+1})),s=await y.window.showQuickPick(t,{placeHolder:`Select Chapter (1 to ${o.book.chapters})`});s&&(this.currentBookId=o.book.id,this.currentChapter=s.chapter,this.currentVerseTarget=void 0,this.update())}update(){let e=this.bibleManager.getBook(this.currentBookId);if(!e)return;let a=this.primaryTranslation==="zulu"?e.zuluName:e.name;this.panel.title=`\u{1F4D6} ${a} ${this.currentChapter}`,this.panel.webview.html=this.getHtmlContent(e)}getHtmlContent(e){let a=this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.primaryTranslation),o=this.isParallel?this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.parallelTranslation):[],t=this.primaryTranslation==="zulu"?`${e.zuluName} (${e.name})`:`${e.name} (${e.zuluName})`,s=e.chapters,l="",u=Math.max(a.length,o.length);for(let p=0;p<u;p++){let k=p+1,P=a[p]||"",L=o[p]||"",W=this.bookmarksManager.isBookmarked(e.id,this.currentChapter,k),_=this.currentVerseTarget===k?"target-verse":"",q=W?"is-bookmarked":"",Q=this.bibleManager.resolveCrossReferences(e.id,this.currentChapter,k,this.primaryTranslation,8),Y=Q.length>0,Z="";Y&&(Z=`
          <div class="cross-ref-tray" id="cross-tray-${k}" style="display:none;">
            <div class="cross-ref-tray-title">\u{1F517} Cross References & Connected Verses (${Q.length})</div>
            <div class="cross-ref-list">
              ${Q.map(R=>`
                <div class="cross-ref-item" onclick="jumpRef('${R.ref}')" title="Click to open ${R.ref} in reader">
                  <div class="cr-header">
                    <span class="cr-citation">\u{1F517} ${R.bookName} ${R.chapter}:${R.verse}${R.endVerse?"-"+R.endVerse:""}</span>
                    ${R.anchor?`<span class="cr-anchor">on "${R.anchor}"</span>`:""}
                  </div>
                  <div class="cr-verse-text">"${R.text}"</div>
                </div>
              `).join("")}
            </div>
          </div>
        `),this.isParallel?l+=`
          <div class="verse-row ${_}" id="verse-${k}">
            <div class="verse-col primary-col ${q}">
              <span class="verse-num">${k}</span>
              <span class="verse-text">${P}</span>
              <div class="verse-actions">
                ${Y?`<button title="Cross References" class="action-btn" onclick="toggleCrossRefs(${k})">\u{1F517}</button>`:""}
                <button title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${k}, '${this.primaryTranslation}')">${W?"\u2B50":"\u2606"}</button>
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${k}, '${this.primaryTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
            <div class="verse-col parallel-col">
              <span class="verse-num">${k}</span>
              <span class="verse-text">${L}</span>
              <div class="verse-actions">
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${k}, '${this.parallelTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
          </div>
          ${Z}
        `:l+=`
          <div class="verse-item ${_} ${q}" id="verse-${k}">
            <span class="verse-num">${k}</span>
            <span class="verse-text">${P}</span>
            <span class="verse-actions">
              ${Y?`<button class="action-btn" title="View Cross References" onclick="toggleCrossRefs(${k})">\u{1F517}</button>`:""}
              <button class="action-btn" title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${k}, '${this.primaryTranslation}')">${W?"\u2B50":"\u2606"}</button>
              <button class="action-btn" title="Copy Verse" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${k}, '${this.primaryTranslation}')">\u{1F4CB}</button>
            </span>
          </div>
          ${Z}
        `}let v=y.workspace.getConfiguration("dailyBread"),i=v.get("fontSize",0),b=v.get("fontFamily","editor"),h=y.workspace.getConfiguration("editor"),g=h.get("fontSize",14),r=h.get("fontFamily",""),n="var(--vscode-editor-font-family, monospace)";b==="serif"?n='Georgia, Garamond, "Times New Roman", serif':b==="sans-serif"?n='var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)':b==="monospace"?n='var(--vscode-editor-font-family, Consolas, "Courier New", monospace)':b==="system"&&(n='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');let m=i===0?`Editor (${g}px)`:`${i}px`,f=i===0?`var(--vscode-editor-font-size, ${g}px)`:`${i}px`;return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t} ${this.currentChapter}</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --font-family: ${n};
      --reader-font-size: ${f};
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
          <span id="font-size-label">${m}</span>
        </button>
        <button class="btn font-btn" onclick="adjustFontSize(1)" title="Increase font size (A+)">A+</button>
        <button class="btn font-btn ${i===0?"btn-active":""}" onclick="resetFontSize()" title="Match VS Code Editor Font Size">Auto</button>
      </div>
    </div>
  </div>

  <div class="content-area">
    <div class="chapter-hero">
      <h1>${t}</h1>
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
</html>`}isVisible(){return this.panel.visible}dispose(){for(d.currentPanel=void 0,this.panel.dispose();this.disposables.length;){let e=this.disposables.pop();e&&e.dispose()}}};var E=z(require("vscode")),O=class{constructor(){this.statusBarItem=E.window.createStatusBarItem(E.StatusBarAlignment.Right,100),this.statusBarItem.command="dailyBread.menu"}getVerse(){return this.currentVerse}getIconSymbol(e){switch(e){case"cross":return"\u271D ";case"book":return"\u{1F4D6} ";case"dove":return"\u{1F54A}\uFE0F ";case"none":default:return""}}update(e,a,o,t=!1,s=!1){this.currentVerse=e;let l=this.getIconSymbol(o),u=t?"\u2B50 ":"",v=s?"\u23F8 ":"",b=`${e.translation==="zulu"?e.zuluBookName:e.bookName} ${e.chapter}:${e.verse}`,h="";switch(a){case"compact":h=`${u}${v}${l}${b}`;break;case"preview":{let g=e.text.length>40?e.text.slice(0,37)+"...":e.text;h=`${u}${v}${l}${b} \u2014 "${g}"`;break}case"full":h=`${u}${v}${l}${b} \u2014 "${e.text}"`;break}this.statusBarItem.text=h,this.statusBarItem.tooltip=this.createTooltip(e,t,s),this.statusBarItem.show()}createTooltip(e,a,o=!1){let t=new E.MarkdownString;t.isTrusted=!0,t.supportHtml=!0;let s=e.translation==="zulu"?e.zuluBookName:e.bookName,l=e.translation==="zulu"?"isiZulu (IBhayibheli Elingcwele 1959)":e.translation==="web"?"World English Bible (WEB)":"King James Version (KJV)",u=a?"$(star-full) Bookmarked":"$(star-empty) Bookmark",v=a?"command:dailyBread.removeCurrentBookmark":"command:dailyBread.bookmarkCurrent",i=o?"$(play) Resume Auto-Rotation":"$(debug-pause) Pause Rotation",b=o?"Resume automatic rotating verses":"Pause auto-rotation (Reading Mode: prevents verses from changing while reading)";if(t.appendMarkdown(`| \u{1F4D6} **${s} ${e.chapter}:${e.verse}** | \u{1F310} **${l}** |
| :----------------------------------------------------------------------------- | -------------------------------------------------------------------: |

`),o&&t.appendMarkdown(`> \u23F8 **Reading Mode Active** \u2014 Auto-rotation is paused. Verses will not change automatically while you read.  
> [$(play) Click to Resume Auto-Rotation](command:dailyBread.togglePauseRotation "Resume automatic rotation") &nbsp;&bull;&nbsp; [$(sync) Advance Verse Manually](command:dailyBread.nextVerse "Advance to next verse")

`),t.appendMarkdown(`[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [${i}](command:dailyBread.togglePauseRotation "${b}") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${u}](${v} "Save to favorites") &nbsp;&bull;&nbsp; [$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; [$(copy) Copy](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")

`),t.appendMarkdown(`---

`),t.appendMarkdown(`## \u{1F4D6} **${s} ${e.chapter}:${e.verse}**

`),t.appendMarkdown(`> ### **"${e.text}"**

`),e.parallelText&&e.parallelTranslation){let h=e.parallelTranslation==="zulu"?"isiZulu (1959)":e.parallelTranslation==="web"?"WEB":"KJB";t.appendMarkdown(`> **Parallel (${h}):** *"${e.parallelText}"*

`)}if(t.appendMarkdown(`---

`),e.chapterVerses&&e.chapterVerses.length>0){let h=e.chapterVerses.length;t.appendMarkdown(`### \u{1F4DC} Full Chapter: **${s} Chapter ${e.chapter}** (Verses 1 to ${h})

*Scroll up and down to read all verses in context:*  

`);for(let g=0;g<h;g++){let r=g+1,n=e.chapterVerses[g];r===e.verse?t.appendMarkdown(`\u{1F449} **<mark>&nbsp;[${r}] ${n}&nbsp;</mark>** *(Active Verse)*  

`):t.appendMarkdown(`**${r}.** ${n}  

`)}t.appendMarkdown(`---

`)}if(e.resolvedCrossReferences&&e.resolvedCrossReferences.length>0){let h=e.resolvedCrossReferences;t.appendMarkdown(`### \u{1F517} Cross-References & Scripture Connections (${h.length} Passages)

*Scriptures connected by Treasury of Scripture Knowledge (TSK):*  

`);for(let g of h){let r=e.translation==="zulu"?g.zuluBookName:g.bookName,n=g.endVerse?`-${g.endVerse}`:"",m=`${r} ${g.chapter}:${g.verse}${n}`,f=`command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([g.ref]))}`,p=g.anchor?` &nbsp;*(connecting theme: "${g.anchor}")*`:"";t.appendMarkdown(`* **[\u{1F4D6} ${m}](${f} "Jump to ${m}")**${p}  
`),t.appendMarkdown(`  > *"${g.text}"*

`)}t.appendMarkdown(`---

`)}else if(e.crossReferences&&e.crossReferences.length>0){let h=[],g=new Set;for(let r of e.crossReferences){for(let n of r.refs)if(!g.has(n)&&(g.add(n),h.push(n),h.length>=12))break;if(h.length>=12)break}if(h.length>0){let r=h.map(n=>`[\u{1F517} ${n}](command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([n]))} "Jump to ${n}")`).join(" &nbsp;&bull;&nbsp; ");t.appendMarkdown(`### \u{1F517} Cross-References:
${r}

---

`)}}return t.appendMarkdown(`### \u{1F9ED} Quick Navigation

[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [${i}](command:dailyBread.togglePauseRotation "${b}") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${u}](${v} "Save to favorites") &nbsp;&bull;&nbsp; [$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; [$(copy) Copy Verse](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")
`),t}dispose(){this.statusBarItem.dispose()}};var T=z(require("vscode")),J=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new T.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(!e)return Promise.resolve([new N("Old Testament (Isivumelwano Esidala)","OT",T.TreeItemCollapsibleState.Expanded,"testament"),new N("New Testament (Isivumelwano Esisha)","NT",T.TreeItemCollapsibleState.Expanded,"testament")]);if(e.itemType==="testament"){let a=this.bibleManager.getBooks().filter(o=>o.testament===e.contextValue);return Promise.resolve(a.map(o=>new N(`${o.name} (${o.zuluName})`,o.id.toString(),T.TreeItemCollapsibleState.Collapsed,"book",o)))}if(e.itemType==="book"&&e.book){let a=[];for(let o=1;o<=e.book.chapters;o++){let t=new N(`Chapter ${o}`,`${e.book.id}:${o}`,T.TreeItemCollapsibleState.None,"chapter",e.book,o);t.command={command:"dailyBread.openReaderAt",title:"Read Chapter",arguments:[e.book.id,o]},a.push(t)}return Promise.resolve(a)}return Promise.resolve([])}},N=class extends T.TreeItem{constructor(a,o,t,s,l,u){super(a,t);this.label=a;this.idValue=o;this.collapsibleState=t;this.itemType=s;this.book=l;this.chapter=u;this.contextValue=s,s==="testament"?this.iconPath=new T.ThemeIcon("library"):s==="book"?(this.iconPath=new T.ThemeIcon("book"),this.description=`${l==null?void 0:l.chapters} ch`):s==="chapter"&&(this.iconPath=new T.ThemeIcon("file-text"))}};var B=z(require("vscode")),U=class{constructor(e){this.bookmarksManager=e;this._onDidChangeTreeData=new B.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event;this.bookmarksManager.onDidChangeBookmarks(()=>{this.refresh()})}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(e)return Promise.resolve([]);let a=this.bookmarksManager.getBookmarks();if(a.length===0){let o=new G("No bookmarks saved yet",B.TreeItemCollapsibleState.None,void 0);return o.description="Click \u2B50 on status bar or reader",Promise.resolve([o])}return Promise.resolve(a.map(o=>{let t=new G(`${o.bookName} ${o.chapter}:${o.verse}`,B.TreeItemCollapsibleState.None,o);return t.description=o.note?`\u{1F4DD} ${o.note}`:`"${o.text.slice(0,30)}..."`,t.tooltip=new B.MarkdownString(`**${o.bookName} ${o.chapter}:${o.verse}** (${o.translation.toUpperCase()})

> "${o.text}"

${o.note?"\u{1F4DD} Note: "+o.note:""}`),t.command={command:"dailyBread.openReaderAt",title:"Open Verse in Reader",arguments:[o.bookId,o.chapter,o.verse,o.translation]},t}))}},G=class extends B.TreeItem{constructor(a,o,t){super(a,o);this.label=a;this.collapsibleState=o;this.bookmark=t;t?(this.contextValue="bookmarkItem",this.iconPath=new B.ThemeIcon("star-full",new B.ThemeColor("charts.yellow"))):(this.contextValue="emptyBookmark",this.iconPath=new B.ThemeIcon("info"))}};var V=z(require("vscode")),H=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new V.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){let a=this.bibleManager.getCuratedTopics();if(!e)return Promise.resolve(Object.values(a).map(o=>{let t=new K(`${o.name} (${o.zuluName})`,V.TreeItemCollapsibleState.Collapsed,"topic",o);return t.description=`${o.verses.length} verses`,t.tooltip=o.description,t}));if(e.itemType==="topic"&&e.topic){let o=e.topic.verses.map(t=>{let s=this.bibleManager.getBook(t.bookId),l=`${(s==null?void 0:s.zuluName)||""} / ${(s==null?void 0:s.name)||""} ${t.chapter}:${t.verse}`,u=new K(l,V.TreeItemCollapsibleState.None,"verse",e.topic,t);return u.command={command:"dailyBread.openReaderAt",title:"Read Verse in Chapter",arguments:[t.bookId,t.chapter,t.verse]},u});return Promise.resolve(o)}return Promise.resolve([])}},K=class extends V.TreeItem{constructor(a,o,t,s,l){super(a,o);this.label=a;this.collapsibleState=o;this.itemType=t;this.topic=s;this.verse=l;this.contextValue=t,t==="topic"?this.iconPath=new V.ThemeIcon("tag"):this.iconPath=new V.ThemeIcon("quote")}};var w,C,$,M;function ce(d){w=new F(d.extensionPath),C=new j(d),$=new O;let e=new J(w);c.window.registerTreeDataProvider("dailyBreadExplorer",e);let a=new U(C);c.window.registerTreeDataProvider("dailyBreadBookmarks",a);let o=new H(w);c.window.registerTreeDataProvider("dailyBreadTopics",o);let t=()=>{let r=c.workspace.getConfiguration("dailyBread");return{translation:r.get("translation","kjv"),displayMode:r.get("displayMode","preview"),icon:r.get("icon","cross"),rotationSchedule:r.get("rotationSchedule","15min"),rotateOnFileSave:r.get("rotateOnFileSave",!1),topic:r.get("topic","all"),dualTranslation:r.get("dualTranslation","none"),fontSize:r.get("fontSize",0),fontFamily:r.get("fontFamily","editor")}},s=!1,l=r=>{let n=t(),m=C.isBookmarked(r.bookId,r.chapter,r.verse);$.update(r,n.displayMode,n.icon,m,s)},u=t(),v=u.dualTranslation!=="none"?u.dualTranslation:void 0,i=w.getRandomVerse(u.topic,u.translation,v);l(i);let b=()=>{if(M&&(clearInterval(M),M=void 0),s)return;let r=t(),n=0;switch(r.rotationSchedule){case"5min":n=5*60*1e3;break;case"15min":n=15*60*1e3;break;case"30min":n=30*60*1e3;break;case"60min":n=60*60*1e3;break;default:n=0;break}n>0&&(M=setInterval(()=>{g()},n))},h=()=>{!s&&M&&b()},g=()=>{if(s||x.currentPanel&&x.currentPanel.isVisible())return;let r=t(),n=r.dualTranslation!=="none"?r.dualTranslation:void 0;i=$.getVerse()?w.getNextCuratedVerse($.getVerse(),r.topic,r.translation,n):w.getRandomVerse(r.topic,r.translation,n),l(i)};b(),d.subscriptions.push(c.window.onDidChangeActiveTextEditor(r=>{r&&t().rotationSchedule==="onEditorOpen"&&g()})),d.subscriptions.push(c.workspace.onDidSaveTextDocument(()=>{t().rotateOnFileSave&&g()})),d.subscriptions.push(c.workspace.onDidChangeConfiguration(r=>{if(r.affectsConfiguration("dailyBread")||r.affectsConfiguration("editor.fontSize")||r.affectsConfiguration("editor.fontFamily")){b(),x.updateCurrent();let n=t();if(i){let m=n.dualTranslation!=="none"?n.dualTranslation:void 0,f=w.getVerse(i.bookId,i.chapter,i.verse,n.translation,m);f&&(i=f,l(i))}}})),d.subscriptions.push(c.commands.registerCommand("dailyBread.nextVerse",()=>{let r=t(),n=r.dualTranslation!=="none"?r.dualTranslation:void 0;i=$.getVerse()?w.getNextCuratedVerse($.getVerse(),r.topic,r.translation,n):w.getRandomVerse(r.topic,r.translation,n),l(i),h()})),d.subscriptions.push(c.commands.registerCommand("dailyBread.openReader",()=>{let r=$.getVerse()||i,n=t();x.createOrShow(d.extensionUri,w,C,r.bookId,r.chapter,r.verse,n.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.readChapter",()=>{let r=$.getVerse()||i,n=t();x.createOrShow(d.extensionUri,w,C,r.bookId,r.chapter,r.verse,n.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.openReaderAt",(r,n,m,f)=>{let p=t();x.createOrShow(d.extensionUri,w,C,r,n,m,f||p.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.bookmarkCurrent",async()=>{let r=$.getVerse()||i;if(!r)return;let n=await c.window.showInputBox({prompt:"Add an optional personal note/thought for this verse (leave empty to skip):",placeHolder:"e.g. Remember this for tough days at work"}),m=await c.window.showInputBox({prompt:"Add tags separated by comma (optional):",placeHolder:"e.g. encouragement, coding, hope"}),f=m?m.split(",").map(p=>p.trim()).filter(p=>p.length>0):void 0;await C.addBookmark(r,n,f),l(r),c.window.showInformationMessage(`\u2B50 Bookmarked: ${r.translation==="zulu"?r.zuluBookName:r.bookName} ${r.chapter}:${r.verse}`)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.removeCurrentBookmark",async()=>{let r=$.getVerse()||i;if(!r)return;let n=`${r.bookId}:${r.chapter}:${r.verse}:${r.translation}`;await C.removeBookmark(n),l(r),c.window.showInformationMessage("Bookmark removed.")})),d.subscriptions.push(c.commands.registerCommand("dailyBread.showBookmarks",async()=>{let r=C.getBookmarks();if(r.length===0){c.window.showInformationMessage("You have no saved bookmarks yet.");return}let n=r.map(f=>({label:`\u2B50 ${f.bookName} ${f.chapter}:${f.verse} (${f.translation.toUpperCase()})`,description:f.note?`\u{1F4DD} ${f.note}`:`"${f.text.slice(0,45)}..."`,detail:f.tags&&f.tags.length>0?`Tags: ${f.tags.map(p=>"#"+p).join(" ")}`:void 0,bookmark:f})),m=await c.window.showQuickPick(n,{placeHolder:"Select a saved bookmark to open in reader"});m&&x.createOrShow(d.extensionUri,w,C,m.bookmark.bookId,m.bookmark.chapter,m.bookmark.verse,m.bookmark.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.selectTopic",async()=>{let r=w.getCuratedTopics(),n=t(),m=[{label:"$(sparkle) All Scripture / Any Topic",description:"Cycle across all curated themes",topicId:"all"},...Object.values(r).map(p=>({label:`$(tag) ${p.name} (${p.zuluName})`,description:`${p.verses.length} verses \u2014 ${p.description}`,topicId:p.id}))],f=await c.window.showQuickPick(m,{placeHolder:"Select Scripture Topic / Mood for Status Bar Rotation"});f&&(await c.workspace.getConfiguration("dailyBread").update("topic",f.topicId,c.ConfigurationTarget.Global),g(),c.window.showInformationMessage(`Daily Bible topic set to: ${f.label}`))})),d.subscriptions.push(c.commands.registerCommand("dailyBread.switchTranslation",async()=>{let r=[{label:"\u{1F4DC} English \u2014 King James Bible / Version (KJB / KJV)",description:"Classic, majestic, traditional poetic English (1611/1769) [Default]",translation:"kjv"},{label:"\u{1F1EC}\u{1F1E7} English \u2014 World English Bible (WEB)",description:"Clean, modern, highly readable English public domain Bible",translation:"web"},{label:"\u{1F1FF}\u{1F1E6} isiZulu \u2014 IBhayibheli Elingcwele (1959)",description:"South African Zulu 1959 Translation with authentic Zulu book names",translation:"zulu"}],n=await c.window.showQuickPick(r,{placeHolder:"Choose Bible Translation"});if(n){await c.workspace.getConfiguration("dailyBread").update("translation",n.translation,c.ConfigurationTarget.Global);let m=t(),f=m.dualTranslation!=="none"?m.dualTranslation:void 0,p=$.getVerse()||i,k=w.getVerse(p.bookId,p.chapter,p.verse,n.translation,f);k&&(i=k,l(i)),c.window.showInformationMessage(`Active translation: ${n.label}`)}})),d.subscriptions.push(c.commands.registerCommand("dailyBread.jumpTo",async()=>{let r=await c.window.showInputBox({prompt:"Enter book & chapter/verse in English or isiZulu",placeHolder:"e.g. Joh 3:16, AmaHubo 23:1, Phil 4:13, Mathewu 6:33, Gen 1:1"});if(!r)return;let n=w.parseReference(r);if(!n){c.window.showErrorMessage(`Could not find reference: "${r}". Try format like "Joh 3:16" or "Hubo 23:1".`);return}let m=t(),f=n.verse||1,p=w.getVerse(n.book.id,n.chapter,f,m.translation);p&&(i=p,l(i),h()),x.createOrShow(d.extensionUri,w,C,n.book.id,n.chapter,n.verse,m.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.jumpToRef",r=>{if(!r)return;let n=w.parseReference(r);if(!n){c.window.showWarningMessage(`Could not resolve cross-reference: ${r}`);return}let m=t(),f=n.verse||1,p=w.getVerse(n.book.id,n.chapter,f,m.translation);p&&(i=p,l(i),h()),x.createOrShow(d.extensionUri,w,C,n.book.id,n.chapter,n.verse,m.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.showCrossReferences",async()=>{let r=$.getVerse()||i;if(!r)return;let n=t(),m=w.resolveCrossReferences(r.bookId,r.chapter,r.verse,n.translation,20);if(m.length===0){c.window.showInformationMessage(`No cross references indexed for ${r.bookName} ${r.chapter}:${r.verse}`);return}let f=m.map(k=>{let P=n.translation==="zulu"?k.zuluBookName:k.bookName,L=k.endVerse?`-${k.endVerse}`:"";return{label:`\u{1F517} ${P} ${k.chapter}:${k.verse}${L}`,description:k.anchor?`Phrase: "${k.anchor}"`:void 0,detail:`"${k.text}"`,refString:k.ref}}),p=await c.window.showQuickPick(f,{placeHolder:`Cross References with Scriptures for ${r.bookName} ${r.chapter}:${r.verse} (${f.length} passages)`});p&&c.commands.executeCommand("dailyBread.jumpToRef",p.refString)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.randomChapter",()=>{let r=w.getBooks(),n=r[Math.floor(Math.random()*r.length)],m=Math.floor(Math.random()*n.chapters)+1,f=t();x.createOrShow(d.extensionUri,w,C,n.id,m,1,f.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.copyVerse",async()=>{let r=$.getVerse()||i;if(!r)return;let n=r.translation==="zulu"?r.zuluBookName:r.bookName,m=`"${r.text}" \u2014 ${n} ${r.chapter}:${r.verse} (${r.translation.toUpperCase()})`;await c.env.clipboard.writeText(m),c.window.showInformationMessage(`Copied: ${n} ${r.chapter}:${r.verse}`)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.exportBookmarks",async()=>{let r=await c.window.showQuickPick([{label:"Markdown Document (.md)",format:"md"},{label:"JSON Dataset (.json)",format:"json"}],{placeHolder:"Choose Export Format"});if(!r)return;let n=r.format==="md"?C.exportBookmarksMarkdown():C.exportBookmarksJson(),m=await c.workspace.openTextDocument({content:n,language:r.format==="md"?"markdown":"json"});await c.window.showTextDocument(m)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.deleteBookmarkItem",async r=>{r&&r.bookmark&&(await C.removeBookmark(r.bookmark.id),c.window.showInformationMessage("Bookmark removed."))})),d.subscriptions.push(c.commands.registerCommand("dailyBread.menu",async()=>{let r=$.getVerse()||i,n=C.isBookmarked(r.bookId,r.chapter,r.verse),m=r.translation==="zulu"?r.zuluBookName:r.bookName,f=[{label:"$(sync) Next Verse",description:"Ctrl+Alt+B / Cmd+Alt+B",detail:"Fetch next uplifting scripture into status bar"},{label:"$(book) Read Full Chapter in Editor",description:`${m} Chapter ${r.chapter}`,detail:"Open clean in-editor Bible tab with side-by-side translation option"},{label:"$(link) View Verse Cross-References",description:"Treasury of Scripture Knowledge",detail:"Explore connected passages and related scriptures for this verse"},{label:n?"$(star-full) Remove Bookmark":"$(star-empty) Bookmark Current Verse",description:`${m} ${r.chapter}:${r.verse}`,detail:n?"Remove from saved favorites":"Save verse with optional notes and tags"},{label:"$(bookmark) View All Bookmarks",description:`${C.getBookmarks().length} saved verses`,detail:"Browse, filter, and jump to your saved favorites"},{label:s?"$(play) Resume Auto-Rotation":"$(debug-pause) Pause Auto-Rotation (Reading Mode)",description:s?"Auto-rotation currently paused":`Schedule: ${t().rotationSchedule}`,detail:s?"Resume automatic scripture cycling":"Freeze verse so it never changes while you are reading"},{label:"$(clock) Change Rotation Schedule",description:`Current: ${t().rotationSchedule}`,detail:"Adjust how often verses change (5min, 15min, 30min, 60min, onEditorOpen, or Manual)"},{label:"$(tag) Select Topic / Mood",description:`Current: ${t().topic}`,detail:"Filter status bar by Peace, Focus, Strength, Joy, Gratitude, or Comfort"},{label:"$(text-size) Change Font Size",description:t().fontSize===0?`Auto / Match Editor (${c.workspace.getConfiguration("editor").get("fontSize",14)}px)`:`${t().fontSize}px`,detail:"Adjust scripture text size or sync automatically with VS Code editor font"},{label:"$(symbol-text) Change Font Family",description:`Current: ${t().fontFamily}`,detail:"Switch between Editor font, Book Serif, Clean Sans-Serif, or Monospace"},{label:"$(globe) Switch Translation",description:`Current: ${t().translation.toUpperCase()}`,detail:"Toggle between isiZulu 1959, English WEB, and English KJV"},{label:"$(search) Search & Jump to Verse",description:"Type any reference (e.g. Joh 3:16, Hubo 23:1)",detail:"Instantly jump to any chapter and verse in the Bible"},{label:"$(dice) Random Chapter",description:"Explore scripture unpredictably",detail:"Pick a random chapter from Genesis to Revelation"},{label:"$(clippy) Copy Verse to Clipboard",description:`${m} ${r.chapter}:${r.verse}`,detail:"Copy reference and scripture text formatted for sharing"},{label:"$(gear) Configure Extension Settings",description:"Icons, Display modes, Rotation intervals",detail:"Open Daily Bible settings in VS Code Preferences"}],p=await c.window.showQuickPick(f,{placeHolder:`\u{1F4D6} Daily Bible \u2014 ${m} ${r.chapter}:${r.verse}`});p&&(p.label.includes("Next Verse")?g():p.label.includes("Auto-Rotation")?c.commands.executeCommand("dailyBread.togglePauseRotation"):p.label.includes("Change Rotation Schedule")?c.commands.executeCommand("dailyBread.setRotationSchedule"):p.label.includes("Read Full Chapter")?c.commands.executeCommand("dailyBread.readChapter"):p.label.includes("View Verse Cross-References")?c.commands.executeCommand("dailyBread.showCrossReferences"):p.label.includes("Bookmark Current Verse")?c.commands.executeCommand("dailyBread.bookmarkCurrent"):p.label.includes("Remove Bookmark")?c.commands.executeCommand("dailyBread.removeCurrentBookmark"):p.label.includes("View All Bookmarks")?c.commands.executeCommand("dailyBread.showBookmarks"):p.label.includes("Select Topic")?c.commands.executeCommand("dailyBread.selectTopic"):p.label.includes("Change Font Size")?c.commands.executeCommand("dailyBread.changeFontSize"):p.label.includes("Change Font Family")?c.commands.executeCommand("dailyBread.changeFontFamily"):p.label.includes("Switch Translation")?c.commands.executeCommand("dailyBread.switchTranslation"):p.label.includes("Search & Jump")?c.commands.executeCommand("dailyBread.jumpTo"):p.label.includes("Random Chapter")?c.commands.executeCommand("dailyBread.randomChapter"):p.label.includes("Copy Verse")?c.commands.executeCommand("dailyBread.copyVerse"):p.label.includes("Configure Extension Settings")&&c.commands.executeCommand("workbench.action.openSettings","dailyBread"))})),d.subscriptions.push(c.commands.registerCommand("dailyBread.changeFontSize",async()=>{let r=c.workspace.getConfiguration("editor").get("fontSize",14),n=c.workspace.getConfiguration("dailyBread").get("fontSize",0),m=[{label:`$(sync) Auto \u2014 Match Editor Font (${r}px)`,description:n===0?"Currently Active":"Automatically syncs with editor.fontSize",size:0},{label:"$(text-size) Small (12px)",description:n===12?"Active":"",size:12},{label:"$(text-size) Compact (14px)",description:n===14?"Active":"",size:14},{label:"$(text-size) Medium (16px)",description:n===16?"Active":"",size:16},{label:"$(text-size) Large (18px)",description:n===18?"Active":"",size:18},{label:"$(text-size) Extra Large (22px)",description:n===22?"Active":"",size:22},{label:"$(text-size) Huge (26px)",description:n===26?"Active":"",size:26},{label:"$(edit) Custom Size...",description:"Type an exact pixel size",size:-1}],f=await c.window.showQuickPick(m,{placeHolder:`Select scripture font size (Current: ${n===0?`Auto / Match Editor (${r}px)`:`${n}px`})`});if(f)if(f.size===-1){let p=await c.window.showInputBox({prompt:"Enter scripture font size in pixels (10 - 48, or 0 for Auto / Match Editor)",value:n===0?r.toString():n.toString(),validateInput:k=>{let P=parseInt(k,10);return isNaN(P)||P<0||P>48?"Please enter a number between 10 and 48 (or 0 for Auto)":null}});if(p!==void 0){let k=parseInt(p,10);await c.workspace.getConfiguration("dailyBread").update("fontSize",k,c.ConfigurationTarget.Global),c.window.showInformationMessage(`Daily Bible font size set to ${k===0?`Auto / Match Editor (${r}px)`:`${k}px`}`)}}else await c.workspace.getConfiguration("dailyBread").update("fontSize",f.size,c.ConfigurationTarget.Global),c.window.showInformationMessage(`Daily Bible font size set to ${f.size===0?`Auto / Match Editor (${r}px)`:`${f.size}px`}`)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.changeFontFamily",async()=>{let r=c.workspace.getConfiguration("editor").get("fontFamily","monospace"),n=c.workspace.getConfiguration("dailyBread").get("fontFamily","editor"),m=[{label:"$(editor) Match Editor Font",description:n==="editor"?"Currently Active":r,detail:"Syncs automatically with your active VS Code code editor font",family:"editor"},{label:"$(book) Book Serif",description:n==="serif"?"Currently Active":"Georgia, Garamond, Times New Roman, serif",detail:"Classic, warm editorial book typesetting",family:"serif"},{label:"$(symbol-text) Clean Sans-Serif",description:n==="sans-serif"?"Currently Active":"Segoe UI, -apple-system, Roboto, sans-serif",detail:"Modern crisp user interface typography",family:"sans-serif"},{label:"$(terminal) Monospace Code Font",description:n==="monospace"?"Currently Active":"Consolas, Courier New, monospace",detail:"Fixed-width developer aesthetic",family:"monospace"},{label:"$(device-desktop) System Default",description:n==="system"?"Currently Active":"Operating system native font",detail:"Native OS font rendering",family:"system"}],f=await c.window.showQuickPick(m,{placeHolder:`Select Bible reader font family (Current: ${n})`});f&&(await c.workspace.getConfiguration("dailyBread").update("fontFamily",f.family,c.ConfigurationTarget.Global),c.window.showInformationMessage(`Daily Bible font family set to: ${f.label.replace(/\$\([^)]+\)\s*/,"")}`))})),d.subscriptions.push(c.commands.registerCommand("dailyBread.togglePauseRotation",()=>{s=!s,s?(M&&(clearInterval(M),M=void 0),c.window.showInformationMessage("\u23F8 Daily Bible: Auto-rotation paused (Reading Mode active). Verses will not change while you read.")):(b(),c.window.showInformationMessage("\u25B6 Daily Bible: Auto-rotation resumed.")),i&&l(i)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.setRotationSchedule",async()=>{let r=t().rotationSchedule,n=[{label:"$(clock) Every 15 minutes",description:r==="15min"?"Currently Active":"",detail:"Recommended: Balanced rotation frequency",value:"15min"},{label:"$(clock) Every 30 minutes",description:r==="30min"?"Currently Active":"",detail:"Spacious interval for longer reading",value:"30min"},{label:"$(clock) Every 60 minutes",description:r==="60min"?"Currently Active":"",detail:"One verse per hour",value:"60min"},{label:"$(clock) Every 5 minutes",description:r==="5min"?"Currently Active":"",detail:"Frequent rotation",value:"5min"},{label:"$(edit) On Editor Open",description:r==="onEditorOpen"?"Currently Active":"",detail:"Rotate whenever you switch or open an editor file",value:"onEditorOpen"},{label:"$(debug-pause) Manual Only (Never change automatically)",description:r==="manual"?"Currently Active":"",detail:"Verses only change when you press Ctrl+Alt+B / Cmd+Alt+B or click Next",value:"manual"}],m=await c.window.showQuickPick(n,{placeHolder:`Select how often the status bar scripture rotates (Current: ${r})`});m&&(await c.workspace.getConfiguration("dailyBread").update("rotationSchedule",m.value,c.ConfigurationTarget.Global),c.window.showInformationMessage(`Daily Bible rotation schedule set to: ${m.label.replace(/\$\([^)]+\)\s*/,"")}`))})),d.subscriptions.push($)}function le(){M&&(clearInterval(M),M=void 0)}0&&(module.exports={activate,deactivate});
