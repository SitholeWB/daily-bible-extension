"use strict";var ve=Object.create;var Y=Object.defineProperty;var ke=Object.getOwnPropertyDescriptor;var we=Object.getOwnPropertyNames;var ye=Object.getPrototypeOf,xe=Object.prototype.hasOwnProperty;var $e=(d,e)=>{for(var a in e)Y(d,a,{get:e[a],enumerable:!0})},he=(d,e,a,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of we(e))!xe.call(d,o)&&o!==a&&Y(d,o,{get:()=>e[o],enumerable:!(t=ke(e,o))||t.enumerable});return d};var z=(d,e,a)=>(a=d!=null?ve(ye(d)):{},he(e||!d||!d.__esModule?Y(a,"default",{value:d,enumerable:!0}):a,d)),Be=d=>he(Y({},"__esModule",{value:!0}),d);var Me={};$e(Me,{activate:()=>Se,deactivate:()=>Ie});module.exports=Be(Me);var ue=z(require("os")),q=z(require("path")),s=z(require("vscode"));var y=z(require("fs")),R=z(require("path"));var Ce=z(require("https")),Te=z(require("http")),fe=z(require("zlib"));function de(d,e=5){return new Promise((a,t)=>{let r=(d.startsWith("https://")?Ce:Te).get(d,{headers:{"User-Agent":"daily-bread-statusbar-vscode"},timeout:3e4},i=>{let p=i.statusCode||0;if(p>=300&&p<400&&i.headers.location){if(i.resume(),e<=0){t(new Error("Too many HTTP redirects while downloading translation pack."));return}let c=new URL(i.headers.location,d).toString();de(c,e-1).then(a,t);return}if(p!==200){i.resume(),t(new Error(`Download failed with HTTP ${p} from ${d}`));return}let b=[];i.on("data",c=>b.push(Buffer.isBuffer(c)?c:Buffer.from(c))),i.on("end",()=>a(Buffer.concat(b))),i.on("error",c=>t(c))});r.on("timeout",()=>{r.destroy(new Error("Download timed out after 30 seconds."))}),r.on("error",i=>t(i))})}function pe(d){let e=fe.gunzipSync(d),a=JSON.parse(e.toString("utf8"));if(!a||typeof a!="object"||!Array.isArray(a[1])||!Array.isArray(a[66]))throw new Error("Invalid Bible translation pack format (missing expected canonical books).");return a}var Z=class{constructor(e,a){this.books=[];this.booksById=new Map;this.aliasMap=new Map;this.topics={};this.catalog=[];this.catalogById=new Map;this.cache=new Map;this.crossRefCache=new Map;this.curatedVerseList=[];this.extensionPath=e,this.globalStoragePath=a;let t=[R.join(e,"data"),R.join(e,"..","data"),R.resolve(__dirname,"..","data"),R.resolve(__dirname,"data"),R.resolve(process.cwd(),"data")],o=t[0];for(let r of t)if(y.existsSync(R.join(r,"books.json"))){o=r;break}this.dataDir=o,this.loadMetadata()}loadMetadata(){let e=R.join(this.dataDir,"books.json");if(y.existsSync(e)){this.books=JSON.parse(y.readFileSync(e,"utf8"));for(let o of this.books)this.booksById.set(o.id,o),this.indexBookAliases(o)}let a=R.join(this.dataDir,"translations_catalog.json");y.existsSync(a)?this.catalog=JSON.parse(y.readFileSync(a,"utf8")):this.catalog=[{id:"kjv",languageCode:"en",language:"English",name:"King James Version (KJV)",shortName:"KJV",direction:"ltr",copyright:"Public Domain (1769 Oxford Standard)",bundled:!0,sizeKB:4200,region:"Default Offline"},{id:"zulu",languageCode:"zu",language:"isiZulu",name:"IBhayibheli Elingcwele (1959)",shortName:"ZULU",direction:"ltr",copyright:"Public Domain (1959 Edition)",bundled:!0,sizeKB:3800,region:"Default Offline"}];for(let o of this.catalog)this.catalogById.set(o.id,o);let t=R.join(this.dataDir,"curated_topics.json");if(y.existsSync(t)){this.topics=JSON.parse(y.readFileSync(t,"utf8"));let o=new Set;for(let r of Object.values(this.topics))for(let i of r.verses){let p=`${i.bookId}:${i.chapter}:${i.verse}`;o.has(p)||(o.add(p),this.curatedVerseList.push(i))}}}normalizeText(e){return e.toLowerCase().replace(/[\u2018\u2019\u201C\u201D'"`\-_—–:.,;!]/g,"").replace(/\s+/g," ").trim()}indexBookAliases(e){let a=o=>{let r=this.normalizeText(o);r&&this.aliasMap.set(r,e)};a(e.name),a(e.zuluName),a(e.code);for(let o of e.aliases)a(o);let t=["u-","u","ku","kuma","kwabase","eka","aba","ama","izi","isi","um"];for(let o of t){let r=e.zuluName.toLowerCase();r.startsWith(o)&&r.length>o.length+2&&a(r.slice(o.length))}}getBooks(){return this.books}getBook(e){return this.booksById.get(e)}getCuratedTopics(){return this.topics}getCatalog(){return this.catalog}getTranslationInfo(e){return this.catalogById.get(e)}getDownloadedPackPath(e){if(this.globalStoragePath)return R.join(this.globalStoragePath,"translations",`${e}.json.gz`)}getDevPackPath(e){let a=[R.join(this.extensionPath,"packs",`${e}.json.gz`),R.join(this.extensionPath,"..","packs",`${e}.json.gz`),R.resolve(__dirname,"..","packs",`${e}.json.gz`),R.resolve(process.cwd(),"packs",`${e}.json.gz`)];for(let t of a)if(y.existsSync(t))return t}isTranslationInstalled(e){if(y.existsSync(R.join(this.dataDir,"translations",e,"1.json")))return!0;let a=this.getDownloadedPackPath(e);return!!(a&&y.existsSync(a)||this.cache.has(`${e}:1`))}getInstalledTranslations(){return this.catalog.filter(e=>this.isTranslationInstalled(e.id))}async downloadTranslation(e){let a=this.catalogById.get(e);if(!a)throw new Error(`Unknown translation ID: ${e}`);if(a.bundled&&y.existsSync(R.join(this.dataDir,"translations",e,"1.json")))return;let t=this.getDownloadedPackPath(e);if(!t)throw new Error("Offline storage path is not configured.");let o,r=this.getDevPackPath(e);if(a.downloadUrl)try{o=await de(a.downloadUrl)}catch(c){if(r)o=y.readFileSync(r);else throw c}else if(r)o=y.readFileSync(r);else throw new Error(`No download URL configured for ${a.name}`);let i=pe(o),p=R.dirname(t);y.mkdirSync(p,{recursive:!0});let b=`${t}.tmp`;y.writeFileSync(b,o),y.renameSync(b,t);for(let[c,g]of Object.entries(i))this.cache.set(`${e}:${c}`,g)}deleteDownloadedTranslation(e){let a=this.catalogById.get(e);if(a!=null&&a.bundled)return!1;let t=this.getDownloadedPackPath(e);t&&y.existsSync(t)&&y.unlinkSync(t);for(let o=1;o<=66;o++)this.cache.delete(`${e}:${o}`);return!0}findBook(e){let a=this.normalizeText(e);if(!a)return;if(this.aliasMap.has(a))return this.aliasMap.get(a);let t=a.replace(/\s+/g,"");for(let[o,r]of this.aliasMap.entries())if(o.replace(/\s+/g,"")===t)return r;for(let[o,r]of this.aliasMap.entries())if(o.startsWith(a)||a.startsWith(o))return r;if(a.length>=3){for(let[o,r]of this.aliasMap.entries())if(o.includes(a)||a.includes(o))return r}}parseReference(e){let a=e.trim();if(!a)return;let t=a.match(/^([1-3]?\s*[A-Za-z\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/);if(!t){let c=a.match(/^([1-3]?\s*[\p{L}\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/u);if(!c)return;let g=c[1].trim(),m=parseInt(c[2],10),C=c[3]?parseInt(c[3],10):void 0,v=c[4]?parseInt(c[4],10):void 0,w=this.findBook(g);return w?{book:w,chapter:m,verse:C,endVerse:v}:void 0}let o=t[1].trim(),r=parseInt(t[2],10),i=t[3]?parseInt(t[3],10):void 0,p=t[4]?parseInt(t[4],10):void 0,b=this.findBook(o);if(b&&!(r<1||r>b.chapters))return{book:b,chapter:r,verse:i,endVerse:p}}getVerseRange(e,a,t,o,r="kjv"){let i=this.getChapter(e,a,r);if(i.length===0||t<1||t>i.length)return"";if(!o||o<=t)return i[t-1]||"";let p=Math.min(o,i.length,t+2),b=[];for(let c=t;c<=p;c++){let g=i[c-1];g&&b.push(`[${c}] ${g}`)}return o>p&&b.push("..."),b.join(" ")}resolveCrossReferences(e,a,t,o="kjv",r=8){let i=this.getCrossReferences(e,a,t),p=[],b=new Set;for(let c of i)for(let g of c.refs){if(b.has(g))continue;b.add(g);let m=this.parseReference(g);if(m&&m.verse){let C=this.getVerseRange(m.book.id,m.chapter,m.verse,m.endVerse,o);C&&p.push({ref:g,bookId:m.book.id,bookName:m.book.name,zuluBookName:m.book.zuluName,chapter:m.chapter,verse:m.verse,endVerse:m.endVerse,text:C,anchor:c.anchor})}if(p.length>=r)return p}return p}loadBookChapters(e,a){let t=`${a}:${e}`;if(this.cache.has(t))return this.cache.get(t);let o=R.join(this.dataDir,"translations",a,`${e}.json`);if(y.existsSync(o))try{let p=JSON.parse(y.readFileSync(o,"utf8"));return this.cache.set(t,p),p}catch{return[]}let r=this.getDownloadedPackPath(a),i=r&&y.existsSync(r)?r:this.getDevPackPath(a);if(i&&y.existsSync(i))try{let p=pe(y.readFileSync(i));for(let[b,c]of Object.entries(p))this.cache.set(`${a}:${b}`,c);return this.cache.get(t)||[]}catch{return[]}return[]}loadBookCrossReferences(e){if(this.crossRefCache.has(e))return this.crossRefCache.get(e);let a=R.join(this.dataDir,"cross_references",`${e}.json`);if(!y.existsSync(a))return{};try{let t=JSON.parse(y.readFileSync(a,"utf8"));return this.crossRefCache.set(e,t),t}catch{return{}}}getCrossReferences(e,a,t){let o=this.loadBookCrossReferences(e);return o[a.toString()]&&o[a.toString()][t.toString()]||[]}getFlattenedCrossReferences(e,a,t){let o=this.getCrossReferences(e,a,t),r=new Set;for(let i of o)for(let p of i.refs)r.add(p);return Array.from(r)}getChapter(e,a,t){let o=this.loadBookChapters(e,t);return a<1||a>o.length?[]:o[a-1]||[]}getVerse(e,a,t,o,r){let i=this.getBook(e);if(!i)return;let p=this.getChapter(e,a,o);if(t<1||t>p.length)return;let b=p[t-1],c;if(r&&r!==o){let w=this.getChapter(e,a,r);t>=1&&t<=w.length&&(c=w[t-1])}let g=this.getCrossReferences(e,a,t),m=this.resolveCrossReferences(e,a,t,o,12),C=this.catalogById.get(o),v=r&&r!==o?this.catalogById.get(r):void 0;return{bookId:e,bookName:i.name,zuluBookName:i.zuluName,chapter:a,verse:t,text:b,translation:o,translationName:C?`${C.language} \u2014 ${C.name}`:o.toUpperCase(),direction:(C==null?void 0:C.direction)||"ltr",parallelText:c,parallelTranslation:r&&r!==o?r:void 0,parallelTranslationName:v?v.shortName:r==null?void 0:r.toUpperCase(),crossReferences:g.length>0?g:void 0,resolvedCrossReferences:m.length>0?m:void 0,chapterVerses:p}}getRandomVerse(e,a="kjv",t){let o=[];e&&e!=="all"&&this.topics[e]?o=this.topics[e].verses:o=this.curatedVerseList,o.length===0&&(o=[{bookId:43,chapter:3,verse:16}]);let r=Math.floor(Math.random()*o.length),i=o[r],p=this.getVerse(i.bookId,i.chapter,i.verse,a,t);return p||{bookId:43,bookName:"John",zuluBookName:"UJohane",chapter:3,verse:16,text:"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",translation:a}}getNextCuratedVerse(e,a,t="kjv",o){let r=[];if(a&&a!=="all"&&this.topics[a]?r=this.topics[a].verses:r=this.curatedVerseList,r.length===0)return this.getRandomVerse(a,t,o);let p=(r.findIndex(c=>c.bookId===e.bookId&&c.chapter===e.chapter&&c.verse===e.verse)+1)%r.length,b=r[p];return this.getVerse(b.bookId,b.chapter,b.verse,t,o)||this.getRandomVerse(a,t,o)}getNextSequentialVerse(e,a="kjv",t){let o=this.getBook(e.bookId);if(!o)return this.getRandomVerse(void 0,a,t);let r=this.getChapter(e.bookId,e.chapter,a);if(e.verse<r.length)return this.getVerse(e.bookId,e.chapter,e.verse+1,a,t);if(e.chapter<o.chapters)return this.getVerse(e.bookId,e.chapter+1,1,a,t);let i=e.bookId%66+1;return this.getVerse(i,1,1,a,t)}};var be=z(require("vscode")),H=class H{constructor(e){this.onDidChangeEmitter=new be.EventEmitter;this.onDidChangeBookmarks=this.onDidChangeEmitter.event;this.context=e}getBookmarks(){return[...this.context.globalState.get(H.STORAGE_KEY,[])].sort((a,t)=>t.createdAt-a.createdAt)}isBookmarked(e,a,t){return this.getBookmarks().some(r=>r.bookId===e&&r.chapter===a&&r.verse===t)}getBookmark(e){return this.getBookmarks().find(a=>a.id===e)}async addBookmark(e,a,t){let o=this.getBookmarks(),r=`${e.bookId}:${e.chapter}:${e.verse}:${e.translation}`,i=o.filter(c=>c.id!==r),p=e.translation==="zulu"?e.zuluBookName:e.bookName,b={id:r,bookId:e.bookId,chapter:e.chapter,verse:e.verse,translation:e.translation,text:e.text,bookName:p,createdAt:Date.now(),note:a,tags:t};return i.unshift(b),await this.context.globalState.update(H.STORAGE_KEY,i),this.onDidChangeEmitter.fire(),b}async removeBookmark(e){let t=this.getBookmarks().filter(o=>o.id!==e);await this.context.globalState.update(H.STORAGE_KEY,t),this.onDidChangeEmitter.fire()}async updateBookmark(e,a,t){let o=this.getBookmarks(),r=o.find(i=>i.id===e);r&&(a!==void 0&&(r.note=a),t!==void 0&&(r.tags=t),await this.context.globalState.update(H.STORAGE_KEY,o),this.onDidChangeEmitter.fire())}exportBookmarksMarkdown(){let e=this.getBookmarks();if(e.length===0)return`# Daily Bible Bookmarks

No bookmarks saved yet.`;let a=`# \u{1F4D6} Daily Bible \u2014 Saved Bookmarks & Favorites

`;a+=`*Exported on ${new Date().toLocaleDateString()}*

---

`;for(let t of e){let o=new Date(t.createdAt).toLocaleDateString();a+=`### ${t.bookName} ${t.chapter}:${t.verse} (${t.translation.toUpperCase()})
`,a+=`> "${t.text}"

`,t.note&&(a+=`\u{1F4DD} **Note:** ${t.note}

`),t.tags&&t.tags.length>0&&(a+=`\u{1F3F7}\uFE0F **Tags:** ${t.tags.map(r=>"`#"+r+"`").join(" ")}

`),a+=`*Saved on ${o}*

---

`}return a}exportBookmarksText(){let e=this.getBookmarks();if(e.length===0)return`Daily Bible \u2014 Saved Bookmarks

No bookmarks saved yet.`;let a=["DAILY BIBLE \u2014 SAVED BOOKMARKS & STUDY NOTES",`Exported on ${new Date().toLocaleDateString()}`,"============================================================",""];for(let t of e){let o=new Date(t.createdAt).toLocaleDateString();a.push(`${t.bookName} ${t.chapter}:${t.verse} (${t.translation.toUpperCase()})`),a.push(`"${t.text}"`),t.note&&a.push(`Note: ${t.note}`),t.tags&&t.tags.length>0&&a.push(`Tags: ${t.tags.map(r=>"#"+r).join(" ")}`),a.push(`Saved on ${o}`),a.push("------------------------------------------------------------"),a.push("")}return a.join(`
`)}exportBookmarksCsv(){let e=this.getBookmarks(),a=o=>`"${(o||"").replace(/"/g,'""')}"`,t=["Book,Chapter,Verse,Translation,Text,Note,Tags,SavedDate"];for(let o of e){let r=o.tags?o.tags.join("; "):"",i=new Date(o.createdAt).toISOString().slice(0,10);t.push([a(o.bookName),o.chapter.toString(),o.verse.toString(),a(o.translation.toUpperCase()),a(o.text),a(o.note||""),a(r),a(i)].join(","))}return t.join(`
`)}exportBookmarksHtml(){let e=this.getBookmarks(),a=o=>(o||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),t=e.length===0?"<p>No bookmarks saved yet.</p>":e.map(o=>{let r=new Date(o.createdAt).toLocaleDateString(),i=o.note?`<p class="note"><strong>Note:</strong> ${a(o.note)}</p>`:"",p=o.tags&&o.tags.length>0?`<div class="tags">${o.tags.map(b=>`<span>#${a(b)}</span>`).join(" ")}</div>`:"";return`<article class="card">
  <h2>${a(o.bookName)} ${o.chapter}:${o.verse} <small>(${a(o.translation.toUpperCase())})</small></h2>
  <blockquote>"${a(o.text)}"</blockquote>
  ${i}
  ${p}
  <div class="date">Saved on ${a(r)}</div>
</article>`}).join(`
`);return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Daily Bible \u2014 Saved Bookmarks &amp; Study Notes</title>
  <style>
    body { font-family: Georgia, serif; max-width: 780px; margin: 40px auto; padding: 0 20px; color: #1f2328; line-height: 1.65; }
    h1 { border-bottom: 2px solid #d0d7de; padding-bottom: 10px; }
    .meta { color: #57606a; font-style: italic; margin-bottom: 28px; }
    .card { border: 1px solid #d0d7de; border-radius: 8px; padding: 16px 20px; margin-bottom: 18px; page-break-inside: avoid; }
    .card h2 { margin: 0 0 8px 0; font-size: 1.15em; font-family: system-ui, sans-serif; }
    .card h2 small { color: #57606a; font-weight: normal; }
    blockquote { margin: 8px 0 12px 0; padding-left: 14px; border-left: 3px solid #0969da; font-size: 1.05em; }
    .note { background: #f6f8fa; padding: 8px 12px; border-radius: 6px; font-family: system-ui, sans-serif; font-size: 0.92em; }
    .tags span { display: inline-block; background: #ddf4ff; color: #0969da; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-family: system-ui, sans-serif; margin-right: 4px; }
    .date { font-size: 0.8em; color: #57606a; margin-top: 8px; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <h1>\u{1F4D6} Daily Bible \u2014 Saved Bookmarks &amp; Study Notes</h1>
  <div class="meta">Exported on ${a(new Date().toLocaleDateString())}</div>
  ${t}
</body>
</html>`}exportBookmarksJson(){return JSON.stringify(this.getBookmarks(),null,2)}exportFullBackup(e,a){let t={format:"daily-bible-backup",version:1,exportedAt:new Date().toISOString(),bookmarks:this.getBookmarks(),settings:e,installedTranslations:a};return JSON.stringify(t,null,2)}async mergeBookmarkItems(e){let a=this.getBookmarks(),t=new Set(a.map(r=>r.id)),o=0;for(let r of e)if(r&&r.bookId&&r.chapter&&r.verse&&r.text){let i=r.translation||"kjv",p=r.id||`${r.bookId}:${r.chapter}:${r.verse}:${i}`;t.has(p)||(a.push({...r,id:p,translation:i,createdAt:r.createdAt||Date.now()}),t.add(p),o++)}return o>0&&(await this.context.globalState.update(H.STORAGE_KEY,a),this.onDidChangeEmitter.fire()),o}async importBookmarks(e){return(await this.importBackup(e)).bookmarksImported}async importBackup(e){try{let a=JSON.parse(e);if(Array.isArray(a))return{bookmarksImported:await this.mergeBookmarkItems(a)};if(a&&typeof a=="object"&&Array.isArray(a.bookmarks)){let t=a;return{bookmarksImported:await this.mergeBookmarkItems(t.bookmarks),settings:t.settings,installedTranslations:Array.isArray(t.installedTranslations)?t.installedTranslations:void 0}}return{bookmarksImported:0}}catch{return{bookmarksImported:0}}}async importBookmarksMarkdown(e,a){let t=e.split(/\n---\s*\n/),o=[];for(let r of t){let i=r.match(/###\s+(.+?)\s+(\d+):(\d+)\s+\(([^)]+)\)/);if(!i)continue;let p=i[1].trim(),b=parseInt(i[2],10),c=parseInt(i[3],10),g=i[4].trim().toLowerCase(),m=a(p);if(!m||isNaN(b)||isNaN(c))continue;let C=r.match(/>\s*"([\s\S]*?)"/),v=C?C[1].trim():"";if(!v)continue;let w=r.match(/📝\s*\*\*Note:\*\*\s*(.+)/),$=w?w[1].trim():void 0,T=r.match(/🏷️\s*\*\*Tags:\*\*\s*(.+)/),n;if(T){let l=Array.from(T[1].matchAll(/#([A-Za-z0-9_\-]+)/g)).map(u=>u[1]);l.length>0&&(n=l)}o.push({id:`${m.id}:${b}:${c}:${g}`,bookId:m.id,chapter:b,verse:c,translation:g,text:v,bookName:p,createdAt:Date.now(),note:$,tags:n})}return this.mergeBookmarkItems(o)}};H.STORAGE_KEY="dailyBread.bookmarks";var X=H;var B=z(require("vscode")),V=class d{constructor(e,a,t,o,r=43,i=3,p,b="kjv"){this.disposables=[];this.currentBookId=43;this.currentChapter=3;this.currentVerseTarget=16;this.primaryTranslation="kjv";this.parallelTranslation="zulu";this.isParallel=!1;this.panel=e,this.extensionUri=a,this.bibleManager=t,this.bookmarksManager=o,this.currentBookId=r,this.currentChapter=i,this.currentVerseTarget=p,this.primaryTranslation=b,this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.webview.onDidReceiveMessage(async c=>{switch(c.command){case"prevChapter":this.goToPreviousChapter();break;case"nextChapter":this.goToNextChapter();break;case"setChapter":this.currentChapter=c.chapter,this.currentVerseTarget=void 0,this.update();break;case"setBookAndChapter":this.currentBookId=c.bookId,this.currentChapter=c.chapter,this.currentVerseTarget=c.verse,this.update();break;case"toggleParallel":this.isParallel=!this.isParallel,this.update();break;case"setPrimaryTranslation":if(c.translation==="__more__"){B.commands.executeCommand("dailyBread.switchTranslation","primary"),this.update();break}this.primaryTranslation=c.translation,this.update();break;case"setParallelTranslation":if(c.translation==="__more__"){B.commands.executeCommand("dailyBread.switchTranslation","parallel"),this.update();break}this.parallelTranslation=c.translation,this.update();break;case"openTranslationSwitcher":B.commands.executeCommand("dailyBread.switchTranslation",c.mode||"primary");break;case"copyVerse":{let g=this.bibleManager.getVerse(c.bookId,c.chapter,c.verse,c.translation);if(g){let m=c.translation==="zulu"?g.zuluBookName:g.bookName,C=`"${g.text}" \u2014 ${m} ${c.chapter}:${c.verse} (${c.translation.toUpperCase()})`;await B.env.clipboard.writeText(C),B.window.showInformationMessage(`Copied: ${m} ${c.chapter}:${c.verse}`)}break}case"bookmarkVerse":{let g=this.bibleManager.getVerse(c.bookId,c.chapter,c.verse,c.translation);if(g){if(this.bookmarksManager.isBookmarked(c.bookId,c.chapter,c.verse)){let m=`${c.bookId}:${c.chapter}:${c.verse}:${c.translation}`;await this.bookmarksManager.removeBookmark(m),B.window.showInformationMessage("Bookmark removed.")}else await this.bookmarksManager.addBookmark(g),B.window.showInformationMessage(`\u2B50 Bookmarked: ${g.bookName} ${c.chapter}:${c.verse}`);this.update()}break}case"openBookPicker":this.showBookPicker();break;case"jumpToReference":{if(c.ref){let g=this.bibleManager.parseReference(c.ref);g?this.navigate(g.book.id,g.chapter,g.verse,this.primaryTranslation):B.window.showInformationMessage(`Could not resolve cross-reference: ${c.ref}`)}break}case"adjustFontSize":{let g=B.workspace.getConfiguration("dailyBread"),m=g.get("fontSize",0),C=B.workspace.getConfiguration("editor").get("fontSize",14),w=Math.max(10,Math.min(36,(m===0?C:m)+c.delta));await g.update("fontSize",w,B.ConfigurationTarget.Global),this.update();break}case"setFontSize":{await B.workspace.getConfiguration("dailyBread").update("fontSize",c.size,B.ConfigurationTarget.Global),this.update();break}case"promptFontSize":{await B.commands.executeCommand("dailyBread.changeFontSize");break}}},null,this.disposables)}static updateCurrent(){var e;(e=d.currentPanel)==null||e.update()}static createOrShow(e,a,t,o=43,r=3,i,p="kjv"){let b=B.window.activeTextEditor?B.window.activeTextEditor.viewColumn:void 0;if(d.currentPanel)return d.currentPanel.panel.reveal(b),d.currentPanel.navigate(o,r,i,p),d.currentPanel;let c=B.window.createWebviewPanel("dailyBreadReader","Daily Bible Reader",b||B.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0,localResourceRoots:[B.Uri.joinPath(e,"media")]});return d.currentPanel=new d(c,e,a,t,o,r,i,p),d.currentPanel}navigate(e,a,t,o){this.currentBookId=e,this.currentChapter=a,this.currentVerseTarget=t,o&&(this.primaryTranslation=o),this.update()}goToPreviousChapter(){if(this.bibleManager.getBook(this.currentBookId)){if(this.currentChapter>1)this.currentChapter--;else if(this.currentBookId>1){this.currentBookId--;let a=this.bibleManager.getBook(this.currentBookId);this.currentChapter=a?a.chapters:1}this.currentVerseTarget=void 0,this.update()}}goToNextChapter(){let e=this.bibleManager.getBook(this.currentBookId);e&&(this.currentChapter<e.chapters?this.currentChapter++:this.currentBookId<66&&(this.currentBookId++,this.currentChapter=1),this.currentVerseTarget=void 0,this.update())}async showBookPicker(){let a=this.bibleManager.getBooks().map(i=>({label:this.primaryTranslation==="zulu"?`${i.zuluName} (${i.name})`:`${i.name} (${i.zuluName})`,description:`${i.testament} \u2022 ${i.chapters} chapters`,book:i})),t=await B.window.showQuickPick(a,{placeHolder:"Select a Book to Read (e.g. USenesisi, AmaHubo, UJohane, Romans)"});if(!t)return;let o=Array.from({length:t.book.chapters},(i,p)=>({label:`Chapter ${p+1}`,chapter:p+1})),r=await B.window.showQuickPick(o,{placeHolder:`Select Chapter (1 to ${t.book.chapters})`});r&&(this.currentBookId=t.book.id,this.currentChapter=r.chapter,this.currentVerseTarget=void 0,this.update())}update(){let e=this.bibleManager.getBook(this.currentBookId);if(!e)return;let a=this.primaryTranslation==="zulu"?e.zuluName:e.name;this.panel.title=`\u{1F4D6} ${a} ${this.currentChapter}`,this.panel.webview.html=this.getHtmlContent(e)}getHtmlContent(e){this.bibleManager.isTranslationInstalled(this.primaryTranslation)||(this.primaryTranslation="kjv"),this.bibleManager.isTranslationInstalled(this.parallelTranslation)||(this.parallelTranslation="zulu");let a=this.bibleManager.getInstalledTranslations(),t=this.bibleManager.getTranslationInfo(this.primaryTranslation),o=this.bibleManager.getTranslationInfo(this.parallelTranslation),r=(t==null?void 0:t.direction)||"ltr",i=a.map(k=>`<option value="${k.id}" ${this.primaryTranslation===k.id?"selected":""}>${k.language} (${k.shortName})</option>`).join("")+'<option value="__more__">\u{1F310} Download More Translations...</option>',p=a.map(k=>`<option value="${k.id}" ${this.parallelTranslation===k.id?"selected":""}>Parallel: ${k.language} (${k.shortName})</option>`).join("")+'<option value="__more__">\u{1F310} Download More Translations...</option>',b=this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.primaryTranslation),c=this.isParallel?this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.parallelTranslation):[],g=this.primaryTranslation==="zulu"?`${e.zuluName} (${e.name})`:`${e.name} (${e.zuluName})`,m=e.chapters,C="",v=Math.max(b.length,c.length);for(let k=0;k<v;k++){let S=k+1,D=b[k]||"",O=c[k]||"",G=this.bookmarksManager.isBookmarked(e.id,this.currentChapter,S),me=this.currentVerseTarget===S?"target-verse":"",ge=G?"is-bookmarked":"",ie=this.bibleManager.resolveCrossReferences(e.id,this.currentChapter,S,this.primaryTranslation,8),le=ie.length>0,ce="";le&&(ce=`
          <div class="cross-ref-tray" id="cross-tray-${S}" style="display:none;">
            <div class="cross-ref-tray-title">\u{1F517} Cross References & Connected Verses (${ie.length})</div>
            <div class="cross-ref-list">
              ${ie.map(U=>`
                <div class="cross-ref-item" onclick="jumpRef('${U.ref}')" title="Click to open ${U.ref} in reader">
                  <div class="cr-header">
                    <span class="cr-citation">\u{1F517} ${U.bookName} ${U.chapter}:${U.verse}${U.endVerse?"-"+U.endVerse:""}</span>
                    ${U.anchor?`<span class="cr-anchor">on "${U.anchor}"</span>`:""}
                  </div>
                  <div class="cr-verse-text">"${U.text}"</div>
                </div>
              `).join("")}
            </div>
          </div>
        `),this.isParallel?C+=`
          <div class="verse-row ${me}" id="verse-${S}">
            <div class="verse-col primary-col ${ge}">
              <span class="verse-num">${S}</span>
              <span class="verse-text">${D}</span>
              <div class="verse-actions">
                ${le?`<button title="Cross References" class="action-btn" onclick="toggleCrossRefs(${S})">\u{1F517}</button>`:""}
                <button title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${S}, '${this.primaryTranslation}')">${G?"\u2B50":"\u2606"}</button>
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${S}, '${this.primaryTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
            <div class="verse-col parallel-col">
              <span class="verse-num">${S}</span>
              <span class="verse-text">${O}</span>
              <div class="verse-actions">
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${S}, '${this.parallelTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
          </div>
          ${ce}
        `:C+=`
          <div class="verse-item ${me} ${ge}" id="verse-${S}">
            <span class="verse-num">${S}</span>
            <span class="verse-text">${D}</span>
            <span class="verse-actions">
              ${le?`<button class="action-btn" title="View Cross References" onclick="toggleCrossRefs(${S})">\u{1F517}</button>`:""}
              <button class="action-btn" title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${S}, '${this.primaryTranslation}')">${G?"\u2B50":"\u2606"}</button>
              <button class="action-btn" title="Copy Verse" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${S}, '${this.primaryTranslation}')">\u{1F4CB}</button>
            </span>
          </div>
          ${ce}
        `}let w=B.workspace.getConfiguration("dailyBread"),$=w.get("fontSize",0),T=w.get("fontFamily","editor"),n=B.workspace.getConfiguration("editor"),l=n.get("fontSize",14),u=n.get("fontFamily",""),h="var(--vscode-editor-font-family, monospace)";T==="serif"?h='Georgia, Garamond, "Times New Roman", serif':T==="sans-serif"?h='var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)':T==="monospace"?h='var(--vscode-editor-font-family, Consolas, "Courier New", monospace)':T==="system"&&(h='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');let f=$===0?`Editor (${l}px)`:`${$}px`,M=$===0?`var(--vscode-editor-font-size, ${l}px)`:`${$}px`;return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${g} ${this.currentChapter}</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --font-family: ${h};
      --reader-font-size: ${M};
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
        ${g} \u2014 Chapter ${this.currentChapter} \u25BE
      </div>
      <button class="btn" onclick="nextChapter()" title="Next Chapter">Next \u25B6</button>
    </div>

    <div class="view-controls">
      <label for="primary-trans" style="font-size:12px;opacity:0.8;">Primary:</label>
      <select id="primary-trans" onchange="changePrimary(this.value)">
        ${i}
      </select>
      <button class="btn" onclick="openTranslationLibrary()" title="Search, Switch &amp; Download More Offline Bible Translations">\u{1F310} More</button>

      <button class="btn ${this.isParallel?"btn-primary":""}" onclick="toggleParallel()" title="Toggle Side-by-Side Dual Translation View">
        ${this.isParallel?"Parallel: ON":"Parallel: OFF"}
      </button>

      ${this.isParallel?`
        <select id="parallel-trans" onchange="changeParallel(this.value)">
          ${p}
        </select>
      `:""}

      <div class="font-controls" title="Scripture Font Size">
        <button class="btn font-btn" onclick="adjustFontSize(-1)" title="Decrease font size (A-)">A\u2212</button>
        <button class="btn font-pill" onclick="promptFontSize()" title="Click to choose or customize font size">
          <span style="font-weight:700;">Aa</span>
          <span id="font-size-label">${f}</span>
        </button>
        <button class="btn font-btn" onclick="adjustFontSize(1)" title="Increase font size (A+)">A+</button>
        <button class="btn font-btn ${$===0?"btn-active":""}" onclick="resetFontSize()" title="Match VS Code Editor Font Size">Auto</button>
      </div>
    </div>
  </div>

  <div class="content-area">
    <div class="chapter-hero">
      <h1>${g}</h1>
      <div class="subtitle">Chapter ${this.currentChapter} of ${m} \u2022 ${t?`${t.language} \u2014 ${t.name}`:this.primaryTranslation.toUpperCase()}</div>
    </div>

    ${this.isParallel?`
      <div class="parallel-headers">
        <div>${t?`${t.language} (${t.shortName})`:this.primaryTranslation.toUpperCase()}</div>
        <div>${o?`${o.language} (${o.shortName})`:this.parallelTranslation.toUpperCase()}</div>
      </div>
    `:""}

    <div class="verses-container" dir="${r}">
      ${C}
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

    function openTranslationLibrary() {
      vscode.postMessage({ command: 'openTranslationSwitcher', mode: 'primary' });
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
</html>`}isVisible(){return this.panel.visible}dispose(){for(d.currentPanel=void 0,this.panel.dispose();this.disposables.length;){let e=this.disposables.pop();e&&e.dispose()}}};var I=z(require("vscode")),Q=class d{constructor(e,a,t,o){this.disposables=[];this.targetMode="primary";this.downloadingIds=new Set;this.panel=e,this.bibleManager=a,this.callbacks=t,this.targetMode=o,this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.webview.onDidReceiveMessage(async r=>{switch(r.command){case"setTargetMode":this.targetMode=r.mode==="parallel"?"parallel":"primary",this.update();break;case"activateTranslation":await this.activateTranslation(r.id,r.mode||this.targetMode);break;case"disableParallel":await I.workspace.getConfiguration("dailyBread").update("dualTranslation","none",I.ConfigurationTarget.Global),this.callbacks.onTranslationActivated(),this.update(),I.window.showInformationMessage("Parallel translation disabled.");break;case"downloadTranslation":await this.handleDownload(r.id,!!r.activateAfter,r.mode||this.targetMode);break;case"deleteTranslation":await this.handleDelete(r.id);break}},null,this.disposables)}static createOrShow(e,a,t="primary"){let o=I.window.activeTextEditor?I.window.activeTextEditor.viewColumn:void 0;if(d.currentPanel)return d.currentPanel.targetMode=t,d.currentPanel.panel.reveal(o),d.currentPanel.update(),d.currentPanel;let r=I.window.createWebviewPanel("dailyBreadTranslations","\u{1F310} Bible Translations & Offline Library",o||I.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});return d.currentPanel=new d(r,e,a,t),d.currentPanel}static updateCurrent(){var e;(e=d.currentPanel)==null||e.update()}async activateTranslation(e,a){if(!this.bibleManager.isTranslationInstalled(e)){await this.handleDownload(e,!0,a);return}let t=I.workspace.getConfiguration("dailyBread"),o=this.bibleManager.getTranslationInfo(e),r=o?`${o.language} \u2014 ${o.name}`:e.toUpperCase();a==="parallel"?(await t.update("dualTranslation",e,I.ConfigurationTarget.Global),I.window.showInformationMessage(`\u{1F4D6} Parallel translation set to: ${r}`)):(await t.update("translation",e,I.ConfigurationTarget.Global),I.window.showInformationMessage(`\u{1F310} Active Bible translation switched to: ${r}`)),this.callbacks.onTranslationActivated(),this.update()}async handleDownload(e,a,t){if(this.downloadingIds.has(e))return;let o=this.bibleManager.getTranslationInfo(e),r=o?`${o.language} \u2014 ${o.name}`:e;this.downloadingIds.add(e),this.panel.webview.postMessage({command:"downloadState",id:e,state:"downloading"});try{await I.window.withProgress({location:I.ProgressLocation.Notification,title:`Downloading ${r} for offline use...`,cancellable:!1},async()=>{await this.bibleManager.downloadTranslation(e)}),this.downloadingIds.delete(e),a?await this.activateTranslation(e,t):(this.callbacks.onTranslationActivated(),this.update(),I.window.showInformationMessage(`\u2705 Downloaded for offline use: ${r}`))}catch(i){this.downloadingIds.delete(e),this.panel.webview.postMessage({command:"downloadState",id:e,state:"error",error:(i==null?void 0:i.message)||"Download failed"}),I.window.showErrorMessage(`Failed to download ${r}: ${(i==null?void 0:i.message)||i}. Please check your internet connection and try again.`)}}async handleDelete(e){let a=I.workspace.getConfiguration("dailyBread"),t=a.get("translation","kjv"),o=a.get("dualTranslation","none");t===e&&await a.update("translation","kjv",I.ConfigurationTarget.Global),o===e&&await a.update("dualTranslation","none",I.ConfigurationTarget.Global),this.bibleManager.deleteDownloadedTranslation(e),this.callbacks.onTranslationActivated(),this.update()}update(){this.panel.webview.html=this.getHtml()}escapeHtml(e){return(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}getHtml(){let e=I.workspace.getConfiguration("dailyBread"),a=e.get("translation","kjv"),t=e.get("dualTranslation","none"),r=this.bibleManager.getCatalog().map(m=>({...m,installed:this.bibleManager.isTranslationInstalled(m.id),downloading:this.downloadingIds.has(m.id)})),i=r.filter(m=>m.installed).length,p=Array.from(new Set(r.map(m=>m.region||"Other"))),b=r.find(m=>m.id===a),c=t!=="none"?r.find(m=>m.id===t):void 0,g=JSON.stringify(r).replace(/</g,"\\u003c");return`<!DOCTYPE html>
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
          <h1>\u{1F310} Bible Translations &amp; Offline Library</h1>
          <div class="subtitle">
            <strong>KJV</strong> &amp; <strong>isiZulu</strong> are bundled offline by default. Download any additional language once to read 100% offline forever.
          </div>
        </div>
        <div class="active-summary">
          <div class="summary-pill">
            <span>Primary:</span>
            <strong>${this.escapeHtml(b?`${b.language} (${b.shortName})`:a)}</strong>
          </div>
          <div class="summary-pill">
            <span>Parallel:</span>
            <strong>${c?this.escapeHtml(`${c.language} (${c.shortName})`):"Off"}</strong>
            ${c?'<button class="btn" style="padding:2px 6px;font-size:11px;" onclick="disableParallel()">Off</button>':""}
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
          <button id="mode-primary" class="mode-btn ${this.targetMode==="primary"?"active":""}" onclick="setMode('primary')">Switch Primary</button>
          <button id="mode-parallel" class="mode-btn ${this.targetMode==="parallel"?"active":""}" onclick="setMode('parallel')">Set Parallel</button>
        </div>
      </div>

      <div class="filters" id="filter-bar">
        <button class="filter-pill active" data-filter="all">All (${r.length})</button>
        <button class="filter-pill" data-filter="installed">\u2705 Installed Offline (${i})</button>
        <button class="filter-pill" data-filter="available">\u2601\uFE0F Available to Download (${r.length-i})</button>
        ${p.filter(m=>m!=="Default Offline").map(m=>`<button class="filter-pill" data-filter="region:${this.escapeHtml(m)}">${this.escapeHtml(m)}</button>`).join("")}
      </div>
    </div>
  </div>

  <div class="list-area">
    <div class="result-meta" id="result-meta"></div>
    <div id="cards-container" style="display:flex;flex-direction:column;gap:10px;"></div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const ALL_TRANSLATIONS = ${g};
    let activePrimary = ${JSON.stringify(a)};
    let activeParallel = ${JSON.stringify(t)};
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
          badges += '<span class="badge offline">\u2705 Bundled Offline</span>';
        } else if (t.installed) {
          badges += '<span class="badge offline">\u2705 Downloaded Offline</span>';
        }
        if (isPrimary) badges += '<span class="badge active-tag">Primary Active</span>';
        if (isParallel) badges += '<span class="badge active-tag">Parallel Active</span>';
        if (t.direction === 'rtl') badges += '<span class="badge">RTL</span>';

        let actions = '';
        if (t.downloading) {
          actions = '<button class="btn btn-primary" disabled>\u23F3 Downloading...</button>';
        } else if (t.installed) {
          const useLabel = currentMode === 'parallel'
            ? (isParallel ? 'Parallel Active \u2713' : 'Set as Parallel')
            : (isPrimary ? 'Active \u2713' : 'Use Translation');
          actions += '<button class="btn ' + (isTargetActive ? '' : 'btn-primary') + '" ' + (isTargetActive ? 'disabled' : '') + ' onclick="activate(\\'' + esc(t.id) + '\\')">' + useLabel + '</button>';
          if (!t.bundled) {
            actions += '<button class="btn btn-danger" title="Remove offline download to free disk space" onclick="removePack(\\'' + esc(t.id) + '\\')">Remove</button>';
          }
        } else {
          const dlUseLabel = currentMode === 'parallel' ? '\u2601\uFE0F Download &amp; Set Parallel' : '\u2601\uFE0F Download &amp; Use';
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
</html>`}dispose(){for(d.currentPanel=void 0,this.panel.dispose();this.disposables.length;){let e=this.disposables.pop();e==null||e.dispose()}}};var _=z(require("vscode")),ee=class{constructor(){this.statusBarItem=_.window.createStatusBarItem(_.StatusBarAlignment.Right,100),this.statusBarItem.command="dailyBread.menu"}getVerse(){return this.currentVerse}getIconSymbol(e){switch(e){case"cross":return"\u271D ";case"book":return"\u{1F4D6} ";case"dove":return"\u{1F54A}\uFE0F ";case"none":default:return""}}update(e,a,t,o=!1,r=!1){this.currentVerse=e;let i=this.getIconSymbol(t),p=o?"\u2B50 ":"",b=r?"\u23F8 ":"",g=`${e.translation==="zulu"?e.zuluBookName:e.bookName} ${e.chapter}:${e.verse}`,m="";switch(a){case"compact":m=`${p}${b}${i}${g}`;break;case"preview":{let C=e.text.length>40?e.text.slice(0,37)+"...":e.text;m=`${p}${b}${i}${g} \u2014 "${C}"`;break}case"full":m=`${p}${b}${i}${g} \u2014 "${e.text}"`;break}this.statusBarItem.text=m,this.statusBarItem.tooltip=this.createTooltip(e,o,r),this.statusBarItem.show()}createTooltip(e,a,t=!1){let o=new _.MarkdownString;o.isTrusted=!0,o.supportHtml=!0;let r=e.translation==="zulu"?e.zuluBookName:e.bookName,i=e.translationName||(e.translation==="zulu"?"isiZulu (IBhayibheli Elingcwele 1959)":e.translation==="kjv"?"King James Version (KJV)":e.translation.toUpperCase()),p=a?"\u2B50 Bookmarked (Remove)":"\u{1F516} Bookmark Verse",b=a?"\u2B50 Bookmarked *(Click to Remove)*":"\u{1F516} **Bookmark This Verse**",c=a?"\u2B50 Bookmarked":"\u{1F516} Bookmark",g=a?"command:dailyBread.removeCurrentBookmark":"command:dailyBread.bookmarkCurrent",m=a?`Remove ${r} ${e.chapter}:${e.verse} from saved bookmarks`:`Bookmark ${r} ${e.chapter}:${e.verse} with optional note & tags`,C=t?"$(play) Resume Auto-Rotation":"$(debug-pause) Pause Rotation",v=t?"Resume automatic rotating verses":"Pause auto-rotation (Reading Mode: prevents verses from changing while reading)";if(o.appendMarkdown(`| \u{1F4D6} **${r} ${e.chapter}:${e.verse}** | \u{1F310} **${i}** |
| :----------------------------------------------------------------------------- | -------------------------------------------------------------------: |

`),t&&o.appendMarkdown(`> \u23F8 **Reading Mode Active** \u2014 Auto-rotation is paused. Verses will not change automatically while you read.  
> [$(play) Click to Resume Auto-Rotation](command:dailyBread.togglePauseRotation "Resume automatic rotation") &nbsp;&bull;&nbsp; [$(sync) Advance Verse Manually](command:dailyBread.nextVerse "Advance to next verse")

`),o.appendMarkdown(`[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [${p}](${g} "${m}") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Search, switch, or download Bible translations") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${C}](command:dailyBread.togglePauseRotation "${v}") &nbsp;&bull;&nbsp; [$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; [$(copy) Copy](command:dailyBread.copyVerse "Copy verse to clipboard")

`),o.appendMarkdown(`---

`),o.appendMarkdown(`## \u{1F4D6} **${r} ${e.chapter}:${e.verse}** &nbsp;&nbsp;|&nbsp;&nbsp; [${b}](${g} "${m}")

`),o.appendMarkdown(`> ### **"${e.text}"** &nbsp; [${c}](${g} "${m}")
>
> [${b}](${g} "${m}") &nbsp;&bull;&nbsp; [$(copy) Copy Verse](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(book) Read Chapter in Editor](command:dailyBread.readChapter "Open full in-editor reader tab")

`),e.parallelText&&e.parallelTranslation){let w=e.parallelTranslationName||(e.parallelTranslation==="zulu"?"isiZulu (1959)":e.parallelTranslation.toUpperCase());o.appendMarkdown(`> **Parallel (${w}):** *"${e.parallelText}"*

`)}if(o.appendMarkdown(`---

`),e.chapterVerses&&e.chapterVerses.length>0){let w=e.chapterVerses.length;o.appendMarkdown(`### \u{1F4DC} Full Chapter: **${r} Chapter ${e.chapter}** (Verses 1 to ${w})

*Scroll up and down to read all verses in context:*  

`);for(let $=0;$<w;$++){let T=$+1,n=e.chapterVerses[$];T===e.verse?o.appendMarkdown(`\u{1F449} **<mark>&nbsp;[${T}] ${n}&nbsp;</mark>** *(Active Verse)* &nbsp;&mdash;&nbsp; [${c}](${g} "${m}")  

`):o.appendMarkdown(`**${T}.** ${n}  

`)}o.appendMarkdown(`---

`)}if(e.resolvedCrossReferences&&e.resolvedCrossReferences.length>0){let w=e.resolvedCrossReferences;o.appendMarkdown(`### \u{1F517} Cross-References & Scripture Connections (${w.length} Passages)

*Scriptures connected by Treasury of Scripture Knowledge (TSK):*  

`);for(let $ of w){let T=e.translation==="zulu"?$.zuluBookName:$.bookName,n=$.endVerse?`-${$.endVerse}`:"",l=`${T} ${$.chapter}:${$.verse}${n}`,u=`command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([$.ref]))}`,h=$.anchor?` &nbsp;*(connecting theme: "${$.anchor}")*`:"";o.appendMarkdown(`* **[\u{1F4D6} ${l}](${u} "Jump to ${l}")**${h}  
`),o.appendMarkdown(`  > *"${$.text}"*

`)}o.appendMarkdown(`---

`)}else if(e.crossReferences&&e.crossReferences.length>0){let w=[],$=new Set;for(let T of e.crossReferences){for(let n of T.refs)if(!$.has(n)&&($.add(n),w.push(n),w.length>=12))break;if(w.length>=12)break}if(w.length>0){let T=w.map(n=>`[\u{1F517} ${n}](command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([n]))} "Jump to ${n}")`).join(" &nbsp;&bull;&nbsp; ");o.appendMarkdown(`### \u{1F517} Cross-References:
${T}

---

`)}}return o.appendMarkdown(`### \u{1F9ED} Quick Navigation

[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [${p}](${g} "${m}") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Search, switch, or download Bible translations") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${C}](command:dailyBread.togglePauseRotation "${v}") &nbsp;&bull;&nbsp; [$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; [$(copy) Copy Verse](command:dailyBread.copyVerse "Copy verse to clipboard")
`),o}dispose(){this.statusBarItem.dispose()}};var E=z(require("vscode")),te=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new E.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(!e)return Promise.resolve([new W("Old Testament (Isivumelwano Esidala)","OT",E.TreeItemCollapsibleState.Expanded,"testament"),new W("New Testament (Isivumelwano Esisha)","NT",E.TreeItemCollapsibleState.Expanded,"testament")]);if(e.itemType==="testament"){let a=this.bibleManager.getBooks().filter(t=>t.testament===e.contextValue);return Promise.resolve(a.map(t=>new W(`${t.name} (${t.zuluName})`,t.id.toString(),E.TreeItemCollapsibleState.Collapsed,"book",t)))}if(e.itemType==="book"&&e.book){let a=[];for(let t=1;t<=e.book.chapters;t++){let o=new W(`Chapter ${t}`,`${e.book.id}:${t}`,E.TreeItemCollapsibleState.None,"chapter",e.book,t);o.command={command:"dailyBread.openReaderAt",title:"Read Chapter",arguments:[e.book.id,t]},a.push(o)}return Promise.resolve(a)}return Promise.resolve([])}},W=class extends E.TreeItem{constructor(a,t,o,r,i,p){super(a,o);this.label=a;this.idValue=t;this.collapsibleState=o;this.itemType=r;this.book=i;this.chapter=p;this.contextValue=r,r==="testament"?this.iconPath=new E.ThemeIcon("library"):r==="book"?(this.iconPath=new E.ThemeIcon("book"),this.description=`${i==null?void 0:i.chapters} ch`):r==="chapter"&&(this.iconPath=new E.ThemeIcon("file-text"))}};var A=z(require("vscode")),ae=class{constructor(e){this.bookmarksManager=e;this._onDidChangeTreeData=new A.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event;this.bookmarksManager.onDidChangeBookmarks(()=>{this.refresh()})}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(e)return Promise.resolve([]);let a=this.bookmarksManager.getBookmarks();if(a.length===0){let t=new oe("No bookmarks saved yet",A.TreeItemCollapsibleState.None,void 0);return t.description="Click \u2B50 on status bar or reader",Promise.resolve([t])}return Promise.resolve(a.map(t=>{let o=new oe(`${t.bookName} ${t.chapter}:${t.verse}`,A.TreeItemCollapsibleState.None,t);return o.description=t.note?`\u{1F4DD} ${t.note}`:`"${t.text.slice(0,30)}..."`,o.tooltip=new A.MarkdownString(`**${t.bookName} ${t.chapter}:${t.verse}** (${t.translation.toUpperCase()})

> "${t.text}"

${t.note?"\u{1F4DD} Note: "+t.note:""}`),o.command={command:"dailyBread.openReaderAt",title:"Open Verse in Reader",arguments:[t.bookId,t.chapter,t.verse,t.translation]},o}))}},oe=class extends A.TreeItem{constructor(a,t,o){super(a,t);this.label=a;this.collapsibleState=t;this.bookmark=o;o?(this.contextValue="bookmarkItem",this.iconPath=new A.ThemeIcon("star-full",new A.ThemeColor("charts.yellow"))):(this.contextValue="emptyBookmark",this.iconPath=new A.ThemeIcon("info"))}};var J=z(require("vscode")),re=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new J.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){let a=this.bibleManager.getCuratedTopics();if(!e)return Promise.resolve(Object.values(a).map(t=>{let o=new ne(`${t.name} (${t.zuluName})`,J.TreeItemCollapsibleState.Collapsed,"topic",t);return o.description=`${t.verses.length} verses`,o.tooltip=t.description,o}));if(e.itemType==="topic"&&e.topic){let t=e.topic.verses.map(o=>{let r=this.bibleManager.getBook(o.bookId),i=`${(r==null?void 0:r.zuluName)||""} / ${(r==null?void 0:r.name)||""} ${o.chapter}:${o.verse}`,p=new ne(i,J.TreeItemCollapsibleState.None,"verse",e.topic,o);return p.command={command:"dailyBread.openReaderAt",title:"Read Verse in Chapter",arguments:[o.bookId,o.chapter,o.verse]},p});return Promise.resolve(t)}return Promise.resolve([])}},ne=class extends J.TreeItem{constructor(a,t,o,r,i){super(a,t);this.label=a;this.collapsibleState=t;this.itemType=o;this.topic=r;this.verse=i;this.contextValue=o,o==="topic"?this.iconPath=new J.ThemeIcon("tag"):this.iconPath=new J.ThemeIcon("quote")}};var j=z(require("vscode")),se=class{constructor(e,a){this.bibleManager=e;this.getPauseState=a;this._onDidChangeTreeData=new j.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(e)return Promise.resolve([]);let a=j.workspace.getConfiguration("dailyBread"),t=a.get("translation","kjv"),o=this.bibleManager.getTranslationInfo(t),r=o?`${o.shortName} (${o.language})`:t.toUpperCase(),i=this.getPauseState(),p=a.get("rotationSchedule","15min"),b=a.get("fontSize",0),c=j.workspace.getConfiguration("editor").get("fontSize",14),g=a.get("fontFamily","editor"),m=[new N("Next Verse","Ctrl+Alt+B","sync","dailyBread.nextVerse","Advance to next scripture in status bar"),new N("Read Current Chapter","In-Editor Reader","book","dailyBread.readChapter","Open current verse & chapter in the Bible Reader tab"),new N("Search & Jump to Verse","e.g. Joh 3:16","search","dailyBread.jumpTo","Jump directly to any book, chapter, or verse"),new N("Switch / Download Translations",r,"globe","dailyBread.switchTranslation","Search, switch, or download 60+ offline Bible translations"),new N("View Verse Cross-References","TSK","link","dailyBread.showCrossReferences","Explore connected passages for the current verse"),new N("Random Chapter","Genesis \u2013 Rev","sparkle","dailyBread.randomChapter","Open a random Bible chapter"),new N(i?"Resume Auto-Rotation":"Pause Auto-Rotation (Reading Mode)",i?"Paused":p,i?"play":"debug-pause","dailyBread.togglePauseRotation",i?"Resume automatic verse rotation":"Freeze current verse while reading"),new N("Rotation Schedule",p,"clock","dailyBread.setRotationSchedule","Change how often the status bar verse rotates"),new N("Font Size",b===0?`Auto (${c}px)`:`${b}px`,"text-size","dailyBread.changeFontSize","Adjust scripture font size or match VS Code editor"),new N("Font Family",g,"symbol-text","dailyBread.changeFontFamily","Switch between Editor font, Book Serif, Sans-Serif, or Monospace"),new N("Export Bookmarks & Backup","JSON / MD / TXT / CSV / HTML","export","dailyBread.exportBookmarks","Export bookmarks, notes, tags, and settings"),new N("Import Bookmarks & Restore Backup","JSON / MD","cloud-upload","dailyBread.importBookmarks","Restore bookmarks, notes, tags, and preferences from a file"),new N("Extension Settings","Preferences","gear","workbench.action.openSettings","Open all Daily Bible settings in VS Code",["dailyBread"])];return Promise.resolve(m)}},N=class extends j.TreeItem{constructor(a,t,o,r,i,p){super(a,j.TreeItemCollapsibleState.None);this.label=a;this.description=t,this.tooltip=i,this.iconPath=new j.ThemeIcon(o),this.command={command:r,title:a,arguments:p}}};var x,P,F,L;function Se(d){x=new Z(d.extensionPath,d.globalStorageUri.fsPath),P=new X(d),F=new ee;let e=new te(x);s.window.registerTreeDataProvider("dailyBreadExplorer",e);let a=new ae(P);s.window.registerTreeDataProvider("dailyBreadBookmarks",a);let t=new re(x);s.window.registerTreeDataProvider("dailyBreadTopics",t);let o=new se(x,()=>i);s.window.registerTreeDataProvider("dailyBreadTools",o);let r=()=>{let n=s.workspace.getConfiguration("dailyBread"),l=n.get("translation","kjv"),u=n.get("dualTranslation","none"),h=x.isTranslationInstalled(l)?l:"kjv",f=u!=="none"&&x.isTranslationInstalled(u)?u:"none";return{translation:h,displayMode:n.get("displayMode","preview"),icon:n.get("icon","cross"),rotationSchedule:n.get("rotationSchedule","15min"),rotateOnFileSave:n.get("rotateOnFileSave",!1),preventRotationWhileReading:n.get("preventRotationWhileReading",!0),topic:n.get("topic","all"),dualTranslation:f,fontSize:n.get("fontSize",0),fontFamily:n.get("fontFamily","editor")}},i=!1,p=!1,b=Date.now(),c=()=>{b=Date.now(),p&&!i&&(p=!1,T(!0))},g=n=>{let l=r(),u=P.isBookmarked(n.bookId,n.chapter,n.verse);F.update(n,l.displayMode,l.icon,u,i)},m=r(),C=m.dualTranslation!=="none"?m.dualTranslation:void 0,v=x.getRandomVerse(m.topic,m.translation,C);g(v);let w=()=>{if(L&&(clearInterval(L),L=void 0),i)return;let n=r(),l=0;switch(n.rotationSchedule){case"5min":l=5*60*1e3;break;case"15min":l=15*60*1e3;break;case"30min":l=30*60*1e3;break;case"60min":l=60*60*1e3;break;default:l=0;break}l>0&&(L=setInterval(()=>{T(!1)},l))},$=()=>{!i&&L&&w()},T=(n=!1)=>{if(i||V.currentPanel&&V.currentPanel.isVisible())return;let l=r();if(!n&&l.preventRotationWhileReading&&Date.now()-b>3e3){p=!0;return}p=!1;let u=l.dualTranslation!=="none"?l.dualTranslation:void 0;v=F.getVerse()?x.getNextCuratedVerse(F.getVerse(),l.topic,l.translation,u):x.getRandomVerse(l.topic,l.translation,u),g(v)};w(),d.subscriptions.push(s.window.onDidChangeActiveTextEditor(n=>{c(),n&&r().rotationSchedule==="onEditorOpen"&&T(!0)})),d.subscriptions.push(s.window.onDidChangeTextEditorSelection(()=>{c()})),d.subscriptions.push(s.workspace.onDidChangeTextDocument(n=>{n.contentChanges&&n.contentChanges.length>0&&c()})),d.subscriptions.push(s.window.onDidChangeWindowState(n=>{n.focused&&c()})),d.subscriptions.push(s.workspace.onDidSaveTextDocument(()=>{c(),r().rotateOnFileSave&&T(!0)})),d.subscriptions.push(s.workspace.onDidChangeConfiguration(n=>{if(n.affectsConfiguration("dailyBread")||n.affectsConfiguration("editor.fontSize")||n.affectsConfiguration("editor.fontFamily")){w(),V.updateCurrent(),Q.updateCurrent(),o.refresh();let l=r();if(v){let u=l.dualTranslation!=="none"?l.dualTranslation:void 0,h=x.getVerse(v.bookId,v.chapter,v.verse,l.translation,u);h&&(v=h,g(v))}}})),d.subscriptions.push(s.commands.registerCommand("dailyBread.nextVerse",()=>{p=!1,T(!0),$()})),d.subscriptions.push(s.commands.registerCommand("dailyBread.openReader",()=>{let n=F.getVerse()||v,l=r();V.createOrShow(d.extensionUri,x,P,n.bookId,n.chapter,n.verse,l.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.readChapter",()=>{let n=F.getVerse()||v,l=r();V.createOrShow(d.extensionUri,x,P,n.bookId,n.chapter,n.verse,l.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.openReaderAt",(n,l,u,h)=>{let f=r();V.createOrShow(d.extensionUri,x,P,n,l,u,h||f.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.bookmarkCurrent",async()=>{let n=F.getVerse()||v;if(!n)return;let l=await s.window.showInputBox({prompt:"Add an optional personal note/thought for this verse (leave empty to skip):",placeHolder:"e.g. Remember this for tough days at work"}),u=await s.window.showInputBox({prompt:"Add tags separated by comma (optional):",placeHolder:"e.g. encouragement, coding, hope"}),h=u?u.split(",").map(f=>f.trim()).filter(f=>f.length>0):void 0;await P.addBookmark(n,l,h),g(n),s.window.showInformationMessage(`\u2B50 Bookmarked: ${n.translation==="zulu"?n.zuluBookName:n.bookName} ${n.chapter}:${n.verse}`)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.removeCurrentBookmark",async()=>{let n=F.getVerse()||v;if(!n)return;let l=`${n.bookId}:${n.chapter}:${n.verse}:${n.translation}`;await P.removeBookmark(l),g(n),s.window.showInformationMessage("Bookmark removed.")})),d.subscriptions.push(s.commands.registerCommand("dailyBread.showBookmarks",async()=>{let n=P.getBookmarks();if(n.length===0){s.window.showInformationMessage("You have no saved bookmarks yet.");return}let l=n.map(h=>({label:`\u2B50 ${h.bookName} ${h.chapter}:${h.verse} (${h.translation.toUpperCase()})`,description:h.note?`\u{1F4DD} ${h.note}`:`"${h.text.slice(0,45)}..."`,detail:h.tags&&h.tags.length>0?`Tags: ${h.tags.map(f=>"#"+f).join(" ")}`:void 0,bookmark:h})),u=await s.window.showQuickPick(l,{placeHolder:"Select a saved bookmark to open in reader"});u&&V.createOrShow(d.extensionUri,x,P,u.bookmark.bookId,u.bookmark.chapter,u.bookmark.verse,u.bookmark.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.selectTopic",async()=>{let n=x.getCuratedTopics(),l=r(),u=[{label:"$(sparkle) All Scripture / Any Topic",description:"Cycle across all curated themes",topicId:"all"},...Object.values(n).map(f=>({label:`$(tag) ${f.name} (${f.zuluName})`,description:`${f.verses.length} verses \u2014 ${f.description}`,topicId:f.id}))],h=await s.window.showQuickPick(u,{placeHolder:"Select Scripture Topic / Mood for Status Bar Rotation"});h&&(await s.workspace.getConfiguration("dailyBread").update("topic",h.topicId,s.ConfigurationTarget.Global),T(!0),s.window.showInformationMessage(`Daily Bible topic set to: ${h.label}`))})),d.subscriptions.push(s.commands.registerCommand("dailyBread.switchTranslation",n=>{let l=n==="parallel"?"parallel":"primary";Q.createOrShow(x,{onTranslationActivated:()=>{let u=r(),h=u.dualTranslation!=="none"?u.dualTranslation:void 0,f=F.getVerse()||v,M=x.getVerse(f.bookId,f.chapter,f.verse,u.translation,h);M&&(v=M,g(v)),V.updateCurrent()}},l)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.jumpTo",async()=>{let n=await s.window.showInputBox({prompt:"Enter book & chapter/verse in English or isiZulu",placeHolder:"e.g. Joh 3:16, AmaHubo 23:1, Phil 4:13, Mathewu 6:33, Gen 1:1"});if(!n)return;let l=x.parseReference(n);if(!l){s.window.showErrorMessage(`Could not find reference: "${n}". Try format like "Joh 3:16" or "Hubo 23:1".`);return}let u=r(),h=l.verse||1,f=x.getVerse(l.book.id,l.chapter,h,u.translation);f&&(v=f,g(v),$()),V.createOrShow(d.extensionUri,x,P,l.book.id,l.chapter,l.verse,u.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.jumpToRef",n=>{if(!n)return;let l=x.parseReference(n);if(!l){s.window.showWarningMessage(`Could not resolve cross-reference: ${n}`);return}let u=r(),h=l.verse||1,f=x.getVerse(l.book.id,l.chapter,h,u.translation);f&&(v=f,g(v),$()),V.createOrShow(d.extensionUri,x,P,l.book.id,l.chapter,l.verse,u.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.showCrossReferences",async()=>{let n=F.getVerse()||v;if(!n)return;let l=r(),u=x.resolveCrossReferences(n.bookId,n.chapter,n.verse,l.translation,20);if(u.length===0){s.window.showInformationMessage(`No cross references indexed for ${n.bookName} ${n.chapter}:${n.verse}`);return}let h=u.map(M=>{let k=l.translation==="zulu"?M.zuluBookName:M.bookName,S=M.endVerse?`-${M.endVerse}`:"";return{label:`\u{1F517} ${k} ${M.chapter}:${M.verse}${S}`,description:M.anchor?`Phrase: "${M.anchor}"`:void 0,detail:`"${M.text}"`,refString:M.ref}}),f=await s.window.showQuickPick(h,{placeHolder:`Cross References with Scriptures for ${n.bookName} ${n.chapter}:${n.verse} (${h.length} passages)`});f&&s.commands.executeCommand("dailyBread.jumpToRef",f.refString)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.randomChapter",()=>{let n=x.getBooks(),l=n[Math.floor(Math.random()*n.length)],u=Math.floor(Math.random()*l.chapters)+1,h=r();V.createOrShow(d.extensionUri,x,P,l.id,u,1,h.translation)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.copyVerse",async()=>{let n=F.getVerse()||v;if(!n)return;let l=n.translation==="zulu"?n.zuluBookName:n.bookName,u=`"${n.text}" \u2014 ${l} ${n.chapter}:${n.verse} (${n.translation.toUpperCase()})`;await s.env.clipboard.writeText(u),s.window.showInformationMessage(`Copied: ${l} ${n.chapter}:${n.verse}`)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.exportBookmarks",async()=>{let n=await s.window.showQuickPick([{label:"$(archive) Full Backup (.json)",description:"\u2705 Re-importable \u2014 Bookmarks, notes, tags, settings & offline translations",detail:"Best for moving to another computer or restoring everything later",format:"backup",reimportable:!0},{label:"$(json) Bookmarks Only (.json)",description:"\u2705 Re-importable \u2014 Saved bookmarks, notes & tags",detail:"Portable JSON list of your saved verses",format:"json",reimportable:!0},{label:"$(markdown) Markdown Study Document (.md)",description:"\u2705 Re-importable \u2014 Formatted study doc (Obsidian / VS Code / Notion)",detail:"Readable Markdown with verses, notes & tags that can also be imported back",format:"md",reimportable:!0},{label:"$(file-text) Plain Text (.txt)",description:"\u26A0\uFE0F Export-only (cannot be imported back)",detail:"Clean plain text for printing, emails, or Word/Notepad",format:"txt",reimportable:!1},{label:"$(table) CSV Spreadsheet (.csv)",description:"\u26A0\uFE0F Export-only (cannot be imported back)",detail:"Spreadsheet table for Excel, Google Sheets, or LibreOffice Calc",format:"csv",reimportable:!1},{label:"$(globe) Styled HTML Study Sheet (.html)",description:"\u26A0\uFE0F Export-only (cannot be imported back)",detail:"Formatted webpage ready to open in a browser or print to PDF",format:"html",reimportable:!1}],{placeHolder:"Choose export format (JSON & Markdown can be imported back; TXT/CSV/HTML are export-only)"});if(!n)return;let l=new Date().toISOString().slice(0,10),u="",h="",f={};if(n.format==="backup"){let S=x.getInstalledTranslations().map(D=>D.id);u=P.exportFullBackup(r(),S),h=`daily-bible-backup-${l}.json`,f={"Daily Bible Backup (JSON)":["json"]}}else n.format==="md"?(u=P.exportBookmarksMarkdown(),h=`daily-bible-bookmarks-${l}.md`,f={"Markdown Document":["md"]}):n.format==="txt"?(u=P.exportBookmarksText(),h=`daily-bible-bookmarks-${l}.txt`,f={"Plain Text":["txt"]}):n.format==="csv"?(u=P.exportBookmarksCsv(),h=`daily-bible-bookmarks-${l}.csv`,f={"CSV Spreadsheet":["csv"]}):n.format==="html"?(u=P.exportBookmarksHtml(),h=`daily-bible-bookmarks-${l}.html`,f={"HTML Document":["html"]}):(u=P.exportBookmarksJson(),h=`daily-bible-bookmarks-${l}.json`,f={"JSON File":["json"]});let M=s.workspace.workspaceFolders&&s.workspace.workspaceFolders.length>0?s.workspace.workspaceFolders[0].uri.fsPath:ue.homedir(),k=await s.window.showSaveDialog({defaultUri:s.Uri.file(q.join(M,h)),filters:f,saveLabel:"Export"});if(k){await s.workspace.fs.writeFile(k,Buffer.from(u,"utf8"));let S=n.reimportable?"":" (Export-only format \u2014 cannot be imported back. Use .json or .md for backups.)";if(await s.window.showInformationMessage(`\u2705 Exported to ${q.basename(k.fsPath)}${S}`,"Open File")==="Open File"){let O=await s.workspace.openTextDocument(k);await s.window.showTextDocument(O)}}})),d.subscriptions.push(s.commands.registerCommand("dailyBread.importBookmarks",async()=>{let n=s.workspace.workspaceFolders&&s.workspace.workspaceFolders.length>0?s.workspace.workspaceFolders[0].uri.fsPath:ue.homedir(),l=await s.window.showOpenDialog({defaultUri:s.Uri.file(n),canSelectMany:!1,openLabel:"Import / Restore",filters:{"Daily Bible Backups & Exports":["json","md"]}});if(!l||l.length===0)return;let u=l[0],h=await s.workspace.fs.readFile(u),f=Buffer.from(h).toString("utf8");if(q.extname(u.fsPath).toLowerCase()===".md"){let D=await P.importBookmarksMarkdown(f,O=>x.findBook(O));v&&g(v),s.window.showInformationMessage(D>0?`\u2705 Imported ${D} bookmark(s) from Markdown.`:"No new bookmarks found in Markdown file (duplicates skipped).");return}let k=await P.importBackup(f),S=!1;if(k.settings&&Object.keys(k.settings).length>0){let D=await s.window.showQuickPick([{label:"$(check) Restore Settings & Preferences Too",description:"Apply saved translation, font size, rotation schedule, and display mode",restore:!0},{label:"$(bookmark) Import Bookmarks Only",description:"Keep my current settings untouched",restore:!1}],{placeHolder:`Backup contains ${k.bookmarksImported} new bookmark(s) and extension settings`});if(D!=null&&D.restore){let O=s.workspace.getConfiguration("dailyBread"),G=["translation","dualTranslation","displayMode","icon","rotationSchedule","rotateOnFileSave","preventRotationWhileReading","topic","fontSize","fontFamily"];for(let K of G)k.settings[K]!==void 0&&await O.update(K,k.settings[K],s.ConfigurationTarget.Global);S=!0}}if(k.installedTranslations&&k.installedTranslations.length>0){let D=k.installedTranslations.filter(O=>x.getTranslationInfo(O)&&!x.isTranslationInstalled(O));D.length>0&&await s.window.showInformationMessage(`This backup used ${D.length} additional offline translation(s): ${D.join(", ")}. Download them now?`,"Download Missing Translations","Skip")==="Download Missing Translations"&&await s.window.withProgress({location:s.ProgressLocation.Notification,title:"Restoring offline Bible translations from backup...",cancellable:!1},async G=>{for(let K of D){G.report({message:K});try{await x.downloadTranslation(K)}catch{}}})}v&&g(v),V.updateCurrent(),Q.updateCurrent(),s.window.showInformationMessage(`\u2705 Import complete: ${k.bookmarksImported} new bookmark(s) added${S?" and preferences restored":""}.`)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.deleteBookmarkItem",async n=>{n&&n.bookmark&&(await P.removeBookmark(n.bookmark.id),s.window.showInformationMessage("Bookmark removed."))})),d.subscriptions.push(s.commands.registerCommand("dailyBread.menu",async()=>{let n=F.getVerse()||v,l=P.isBookmarked(n.bookId,n.chapter,n.verse),u=n.translation==="zulu"?n.zuluBookName:n.bookName,h=[{label:"Scripture & Reading",kind:s.QuickPickItemKind.Separator},{label:"$(sync) Next Verse",description:"Ctrl+Alt+B / Cmd+Alt+B",detail:"Fetch next uplifting scripture into status bar"},{label:"$(book) Read Full Chapter in Editor",description:`${u} Chapter ${n.chapter}`,detail:"Open clean in-editor Bible tab with side-by-side translation option"},{label:"$(search) Search & Jump to Verse",description:"Type any reference (e.g. Joh 3:16, Hubo 23:1)",detail:"Instantly jump to any chapter and verse in the Bible"},{label:"$(globe) Switch / Download Translations",description:`Current: ${r().translation.toUpperCase()}`,detail:"Search, switch, or download 60+ offline Bible translations & languages"},{label:l?"$(star-full) Remove Bookmark":"$(star-empty) Bookmark Current Verse",description:`${u} ${n.chapter}:${n.verse}`,detail:l?"Remove from saved favorites":"Save verse with optional notes and tags"},{label:"$(link) View Verse Cross-References",description:"Treasury of Scripture Knowledge",detail:"Explore connected passages and related scriptures for this verse"},{label:"Browse & Share",kind:s.QuickPickItemKind.Separator},{label:"$(bookmark) View All Bookmarks",description:`${P.getBookmarks().length} saved verses`,detail:"Browse, filter, and jump to your saved favorites"},{label:"$(tag) Select Topic / Mood",description:`Current: ${r().topic}`,detail:"Filter status bar by Peace, Focus, Strength, Joy, Gratitude, or Comfort"},{label:"$(dice) Random Chapter",description:"Explore scripture unpredictably",detail:"Pick a random chapter from Genesis to Revelation"},{label:"$(clippy) Copy Verse to Clipboard",description:`${u} ${n.chapter}:${n.verse}`,detail:"Copy reference and scripture text formatted for sharing"},{label:"Reading Mode & Display",kind:s.QuickPickItemKind.Separator},{label:i?"$(play) Resume Auto-Rotation":"$(debug-pause) Pause Auto-Rotation (Reading Mode)",description:i?"Auto-rotation currently paused":`Schedule: ${r().rotationSchedule}`,detail:i?"Resume automatic scripture cycling":"Freeze verse so it never changes while you are reading"},{label:"$(clock) Change Rotation Schedule",description:`Current: ${r().rotationSchedule}`,detail:"Adjust how often verses change (5min, 15min, 30min, 60min, onEditorOpen, or Manual)"},{label:"$(text-size) Change Font Size",description:r().fontSize===0?`Auto / Match Editor (${s.workspace.getConfiguration("editor").get("fontSize",14)}px)`:`${r().fontSize}px`,detail:"Adjust scripture text size or sync automatically with VS Code editor font"},{label:"$(symbol-text) Change Font Family",description:`Current: ${r().fontFamily}`,detail:"Switch between Editor font, Book Serif, Clean Sans-Serif, or Monospace"},{label:"Backup & Settings",kind:s.QuickPickItemKind.Separator},{label:"$(export) Export Bookmarks & Backup",description:"JSON, Markdown, TXT, CSV, or HTML",detail:"Save your bookmarks, notes, tags, and settings to a file"},{label:"$(cloud-upload) Import Bookmarks & Restore Backup",description:"Restore from .json backup or .md export",detail:"Load saved bookmarks, notes, tags, and preferences from a file"},{label:"$(gear) Configure Extension Settings",description:"Icons, Display modes, Rotation intervals",detail:"Open Daily Bible settings in VS Code Preferences"}],f=await s.window.showQuickPick(h,{placeHolder:`\u{1F4D6} Daily Bible \u2014 ${u} ${n.chapter}:${n.verse}`});f&&(f.label.includes("Next Verse")?T(!0):f.label.includes("Auto-Rotation")?s.commands.executeCommand("dailyBread.togglePauseRotation"):f.label.includes("Change Rotation Schedule")?s.commands.executeCommand("dailyBread.setRotationSchedule"):f.label.includes("Read Full Chapter")?s.commands.executeCommand("dailyBread.readChapter"):f.label.includes("View Verse Cross-References")?s.commands.executeCommand("dailyBread.showCrossReferences"):f.label.includes("Bookmark Current Verse")?s.commands.executeCommand("dailyBread.bookmarkCurrent"):f.label.includes("Remove Bookmark")?s.commands.executeCommand("dailyBread.removeCurrentBookmark"):f.label.includes("View All Bookmarks")?s.commands.executeCommand("dailyBread.showBookmarks"):f.label.includes("Select Topic")?s.commands.executeCommand("dailyBread.selectTopic"):f.label.includes("Change Font Size")?s.commands.executeCommand("dailyBread.changeFontSize"):f.label.includes("Change Font Family")?s.commands.executeCommand("dailyBread.changeFontFamily"):f.label.includes("Switch / Download Translations")?s.commands.executeCommand("dailyBread.switchTranslation"):f.label.includes("Search & Jump")?s.commands.executeCommand("dailyBread.jumpTo"):f.label.includes("Random Chapter")?s.commands.executeCommand("dailyBread.randomChapter"):f.label.includes("Copy Verse")?s.commands.executeCommand("dailyBread.copyVerse"):f.label.includes("Export Bookmarks")?s.commands.executeCommand("dailyBread.exportBookmarks"):f.label.includes("Import Bookmarks")?s.commands.executeCommand("dailyBread.importBookmarks"):f.label.includes("Configure Extension Settings")&&s.commands.executeCommand("workbench.action.openSettings","dailyBread"))})),d.subscriptions.push(s.commands.registerCommand("dailyBread.changeFontSize",async()=>{let n=s.workspace.getConfiguration("editor").get("fontSize",14),l=s.workspace.getConfiguration("dailyBread").get("fontSize",0),u=[{label:`$(sync) Auto \u2014 Match Editor Font (${n}px)`,description:l===0?"Currently Active":"Automatically syncs with editor.fontSize",size:0},{label:"$(text-size) Small (12px)",description:l===12?"Active":"",size:12},{label:"$(text-size) Compact (14px)",description:l===14?"Active":"",size:14},{label:"$(text-size) Medium (16px)",description:l===16?"Active":"",size:16},{label:"$(text-size) Large (18px)",description:l===18?"Active":"",size:18},{label:"$(text-size) Extra Large (22px)",description:l===22?"Active":"",size:22},{label:"$(text-size) Huge (26px)",description:l===26?"Active":"",size:26},{label:"$(edit) Custom Size...",description:"Type an exact pixel size",size:-1}],h=await s.window.showQuickPick(u,{placeHolder:`Select scripture font size (Current: ${l===0?`Auto / Match Editor (${n}px)`:`${l}px`})`});if(h)if(h.size===-1){let f=await s.window.showInputBox({prompt:"Enter scripture font size in pixels (10 - 48, or 0 for Auto / Match Editor)",value:l===0?n.toString():l.toString(),validateInput:M=>{let k=parseInt(M,10);return isNaN(k)||k<0||k>48?"Please enter a number between 10 and 48 (or 0 for Auto)":null}});if(f!==void 0){let M=parseInt(f,10);await s.workspace.getConfiguration("dailyBread").update("fontSize",M,s.ConfigurationTarget.Global),s.window.showInformationMessage(`Daily Bible font size set to ${M===0?`Auto / Match Editor (${n}px)`:`${M}px`}`)}}else await s.workspace.getConfiguration("dailyBread").update("fontSize",h.size,s.ConfigurationTarget.Global),s.window.showInformationMessage(`Daily Bible font size set to ${h.size===0?`Auto / Match Editor (${n}px)`:`${h.size}px`}`)})),d.subscriptions.push(s.commands.registerCommand("dailyBread.changeFontFamily",async()=>{let n=s.workspace.getConfiguration("editor").get("fontFamily","monospace"),l=s.workspace.getConfiguration("dailyBread").get("fontFamily","editor"),u=[{label:"$(editor) Match Editor Font",description:l==="editor"?"Currently Active":n,detail:"Syncs automatically with your active VS Code code editor font",family:"editor"},{label:"$(book) Book Serif",description:l==="serif"?"Currently Active":"Georgia, Garamond, Times New Roman, serif",detail:"Classic, warm editorial book typesetting",family:"serif"},{label:"$(symbol-text) Clean Sans-Serif",description:l==="sans-serif"?"Currently Active":"Segoe UI, -apple-system, Roboto, sans-serif",detail:"Modern crisp user interface typography",family:"sans-serif"},{label:"$(terminal) Monospace Code Font",description:l==="monospace"?"Currently Active":"Consolas, Courier New, monospace",detail:"Fixed-width developer aesthetic",family:"monospace"},{label:"$(device-desktop) System Default",description:l==="system"?"Currently Active":"Operating system native font",detail:"Native OS font rendering",family:"system"}],h=await s.window.showQuickPick(u,{placeHolder:`Select Bible reader font family (Current: ${l})`});h&&(await s.workspace.getConfiguration("dailyBread").update("fontFamily",h.family,s.ConfigurationTarget.Global),s.window.showInformationMessage(`Daily Bible font family set to: ${h.label.replace(/\$\([^)]+\)\s*/,"")}`))})),d.subscriptions.push(s.commands.registerCommand("dailyBread.togglePauseRotation",()=>{i=!i,i?(L&&(clearInterval(L),L=void 0),s.window.showInformationMessage("\u23F8 Daily Bible: Auto-rotation paused (Reading Mode active). Verses will not change while you read.")):(w(),s.window.showInformationMessage("\u25B6 Daily Bible: Auto-rotation resumed.")),v&&g(v),o.refresh()})),d.subscriptions.push(s.commands.registerCommand("dailyBread.setRotationSchedule",async()=>{let n=r().rotationSchedule,l=[{label:"$(clock) Every 15 minutes",description:n==="15min"?"Currently Active":"",detail:"Recommended: Balanced rotation frequency",value:"15min"},{label:"$(clock) Every 30 minutes",description:n==="30min"?"Currently Active":"",detail:"Spacious interval for longer reading",value:"30min"},{label:"$(clock) Every 60 minutes",description:n==="60min"?"Currently Active":"",detail:"One verse per hour",value:"60min"},{label:"$(clock) Every 5 minutes",description:n==="5min"?"Currently Active":"",detail:"Frequent rotation",value:"5min"},{label:"$(edit) On Editor Open",description:n==="onEditorOpen"?"Currently Active":"",detail:"Rotate whenever you switch or open an editor file",value:"onEditorOpen"},{label:"$(debug-pause) Manual Only (Never change automatically)",description:n==="manual"?"Currently Active":"",detail:"Verses only change when you press Ctrl+Alt+B / Cmd+Alt+B or click Next",value:"manual"}],u=await s.window.showQuickPick(l,{placeHolder:`Select how often the status bar scripture rotates (Current: ${n})`});u&&(await s.workspace.getConfiguration("dailyBread").update("rotationSchedule",u.value,s.ConfigurationTarget.Global),s.window.showInformationMessage(`Daily Bible rotation schedule set to: ${u.label.replace(/\$\([^)]+\)\s*/,"")}`))})),d.subscriptions.push(F)}function Ie(){L&&(clearInterval(L),L=void 0)}0&&(module.exports={activate,deactivate});
