"use strict";var Se=Object.create;var ne=Object.defineProperty;var Ie=Object.getOwnPropertyDescriptor;var Ne=Object.getOwnPropertyNames;var Me=Object.getPrototypeOf,Pe=Object.prototype.hasOwnProperty;var De=(c,e)=>{for(var o in e)ne(c,o,{get:e[o],enumerable:!0})},$e=(c,e,o,a)=>{if(e&&typeof e=="object"||typeof e=="function")for(let t of Ne(e))!Pe.call(c,t)&&t!==o&&ne(c,t,{get:()=>e[t],enumerable:!(a=Ie(e,t))||a.enumerable});return c};var R=(c,e,o)=>(o=c!=null?Se(Me(c)):{},$e(e||!c||!c.__esModule?ne(o,"default",{value:c,enumerable:!0}):o,c)),Re=c=>$e(ne({},"__esModule",{value:!0}),c);var Fe={};De(Fe,{activate:()=>Ae,deactivate:()=>Ee});module.exports=Re(Fe);var xe=R(require("os")),re=R(require("path")),i=R(require("vscode"));var x=R(require("fs")),M=R(require("path"));var Ve=R(require("https")),ze=R(require("http")),Be=R(require("zlib"));function ye(c,e=5){return new Promise((o,a)=>{let r=(c.startsWith("https://")?Ve:ze).get(c,{headers:{"User-Agent":"daily-bread-statusbar-vscode"},timeout:3e4},s=>{let p=s.statusCode||0;if(p>=300&&p<400&&s.headers.location){if(s.resume(),e<=0){a(new Error("Too many HTTP redirects while downloading translation pack."));return}let l=new URL(s.headers.location,c).toString();ye(l,e-1).then(o,a);return}if(p!==200){s.resume(),a(new Error(`Download failed with HTTP ${p} from ${c}`));return}let h=[];s.on("data",l=>h.push(Buffer.isBuffer(l)?l:Buffer.from(l))),s.on("end",()=>o(Buffer.concat(h))),s.on("error",l=>a(l))});r.on("timeout",()=>{r.destroy(new Error("Download timed out after 30 seconds."))}),r.on("error",s=>a(s))})}function we(c){let e=Be.gunzipSync(c),o=JSON.parse(e.toString("utf8"));if(!o||typeof o!="object"||!Array.isArray(o[1])||!Array.isArray(o[66]))throw new Error("Invalid Bible translation pack format (missing expected canonical books).");return o}var se=class{constructor(e,o){this.books=[];this.booksById=new Map;this.aliasMap=new Map;this.topics={};this.catalog=[];this.catalogById=new Map;this.cache=new Map;this.crossRefCache=new Map;this.curatedVerseList=[];this.extensionPath=e,this.globalStoragePath=o;let a=[M.join(e,"data"),M.join(e,"..","data"),M.resolve(__dirname,"..","data"),M.resolve(__dirname,"data"),M.resolve(process.cwd(),"data")],t=a[0];for(let r of a)if(x.existsSync(M.join(r,"books.json"))){t=r;break}this.dataDir=t,this.loadMetadata()}loadMetadata(){let e=M.join(this.dataDir,"books.json");if(x.existsSync(e)){this.books=JSON.parse(x.readFileSync(e,"utf8"));for(let t of this.books)this.booksById.set(t.id,t),this.indexBookAliases(t)}let o=M.join(this.dataDir,"translations_catalog.json");x.existsSync(o)?this.catalog=JSON.parse(x.readFileSync(o,"utf8")):this.catalog=[{id:"kjv",languageCode:"en",language:"English",name:"King James Version (KJV)",shortName:"KJV",direction:"ltr",copyright:"Public Domain (1769 Oxford Standard)",bundled:!0,sizeKB:4200,region:"Default Offline"},{id:"zulu",languageCode:"zu",language:"isiZulu",name:"IBhayibheli Elingcwele (1959)",shortName:"ZULU",direction:"ltr",copyright:"Public Domain (1959 Edition)",bundled:!0,sizeKB:3800,region:"Default Offline"}];for(let t of this.catalog)this.catalogById.set(t.id,t);let a=M.join(this.dataDir,"curated_topics.json");if(x.existsSync(a)){this.topics=JSON.parse(x.readFileSync(a,"utf8"));let t=new Set;for(let r of Object.values(this.topics))for(let s of r.verses){let p=`${s.bookId}:${s.chapter}:${s.verse}`;t.has(p)||(t.add(p),this.curatedVerseList.push(s))}}}normalizeText(e){return e.toLowerCase().replace(/[\u2018\u2019\u201C\u201D'"`\-_—–:.,;!]/g,"").replace(/\s+/g," ").trim()}indexBookAliases(e){let o=t=>{let r=this.normalizeText(t);r&&this.aliasMap.set(r,e)};o(e.name),o(e.zuluName),o(e.code);for(let t of e.aliases)o(t);let a=["u-","u","ku","kuma","kwabase","eka","aba","ama","izi","isi","um"];for(let t of a){let r=e.zuluName.toLowerCase();r.startsWith(t)&&r.length>t.length+2&&o(r.slice(t.length))}}getBooks(){return this.books}getBook(e){return this.booksById.get(e)}getCuratedTopics(){return this.topics}getCatalog(){return this.catalog}getTranslationInfo(e){return this.catalogById.get(e)}getDownloadedPackPath(e){if(this.globalStoragePath)return M.join(this.globalStoragePath,"translations",`${e}.json.gz`)}getDevPackPath(e){let o=[M.join(this.extensionPath,"packs",`${e}.json.gz`),M.join(this.extensionPath,"..","packs",`${e}.json.gz`),M.resolve(__dirname,"..","packs",`${e}.json.gz`),M.resolve(process.cwd(),"packs",`${e}.json.gz`)];for(let a of o)if(x.existsSync(a))return a}isTranslationInstalled(e){if(x.existsSync(M.join(this.dataDir,"translations",e,"1.json")))return!0;let o=this.getDownloadedPackPath(e);return!!(o&&x.existsSync(o)||this.cache.has(`${e}:1`))}getInstalledTranslations(){return this.catalog.filter(e=>this.isTranslationInstalled(e.id))}async downloadTranslation(e){let o=this.catalogById.get(e);if(!o)throw new Error(`Unknown translation ID: ${e}`);if(o.bundled&&x.existsSync(M.join(this.dataDir,"translations",e,"1.json")))return;let a=this.getDownloadedPackPath(e);if(!a)throw new Error("Offline storage path is not configured.");let t,r=this.getDevPackPath(e);if(o.downloadUrl)try{t=await ye(o.downloadUrl)}catch(l){if(r)t=x.readFileSync(r);else throw l}else if(r)t=x.readFileSync(r);else throw new Error(`No download URL configured for ${o.name}`);let s=we(t),p=M.dirname(a);x.mkdirSync(p,{recursive:!0});let h=`${a}.tmp`;x.writeFileSync(h,t),x.renameSync(h,a);for(let[l,b]of Object.entries(s))this.cache.set(`${e}:${l}`,b)}deleteDownloadedTranslation(e){let o=this.catalogById.get(e);if(o!=null&&o.bundled)return!1;let a=this.getDownloadedPackPath(e);a&&x.existsSync(a)&&x.unlinkSync(a);for(let t=1;t<=66;t++)this.cache.delete(`${e}:${t}`);return!0}findBook(e){let o=this.normalizeText(e);if(!o)return;if(this.aliasMap.has(o))return this.aliasMap.get(o);let a=o.replace(/\s+/g,"");for(let[t,r]of this.aliasMap.entries())if(t.replace(/\s+/g,"")===a)return r;for(let[t,r]of this.aliasMap.entries())if(t.startsWith(o)||o.startsWith(t))return r;if(o.length>=3){for(let[t,r]of this.aliasMap.entries())if(t.includes(o)||o.includes(t))return r}}parseReference(e){let o=e.trim();if(!o)return;let a=o.match(/^([1-3]?\s*[A-Za-z\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/);if(!a){let l=o.match(/^([1-3]?\s*[\p{L}\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/u);if(!l)return;let b=l[1].trim(),m=parseInt(l[2],10),w=l[3]?parseInt(l[3],10):void 0,C=l[4]?parseInt(l[4],10):void 0,f=this.findBook(b);return f?{book:f,chapter:m,verse:w,endVerse:C}:void 0}let t=a[1].trim(),r=parseInt(a[2],10),s=a[3]?parseInt(a[3],10):void 0,p=a[4]?parseInt(a[4],10):void 0,h=this.findBook(t);if(h&&!(r<1||r>h.chapters))return{book:h,chapter:r,verse:s,endVerse:p}}getVerseRange(e,o,a,t,r="kjv"){let s=this.getChapter(e,o,r);if(s.length===0||a<1||a>s.length)return"";if(!t||t<=a)return s[a-1]||"";let p=Math.min(t,s.length,a+2),h=[];for(let l=a;l<=p;l++){let b=s[l-1];b&&h.push(`[${l}] ${b}`)}return t>p&&h.push("..."),h.join(" ")}resolveCrossReferences(e,o,a,t="kjv",r=8){let s=this.getCrossReferences(e,o,a),p=[],h=new Set;for(let l of s)for(let b of l.refs){if(h.has(b))continue;h.add(b);let m=this.parseReference(b);if(m&&m.verse){let w=this.getVerseRange(m.book.id,m.chapter,m.verse,m.endVerse,t);w&&p.push({ref:b,bookId:m.book.id,bookName:m.book.name,zuluBookName:m.book.zuluName,chapter:m.chapter,verse:m.verse,endVerse:m.endVerse,text:w,anchor:l.anchor})}if(p.length>=r)return p}return p}loadBookChapters(e,o){let a=`${o}:${e}`;if(this.cache.has(a))return this.cache.get(a);let t=M.join(this.dataDir,"translations",o,`${e}.json`);if(x.existsSync(t))try{let p=JSON.parse(x.readFileSync(t,"utf8"));return this.cache.set(a,p),p}catch{return[]}let r=this.getDownloadedPackPath(o),s=r&&x.existsSync(r)?r:this.getDevPackPath(o);if(s&&x.existsSync(s))try{let p=we(x.readFileSync(s));for(let[h,l]of Object.entries(p))this.cache.set(`${o}:${h}`,l);return this.cache.get(a)||[]}catch{return[]}return[]}loadBookCrossReferences(e){if(this.crossRefCache.has(e))return this.crossRefCache.get(e);let o=M.join(this.dataDir,"cross_references",`${e}.json`);if(!x.existsSync(o))return{};try{let a=JSON.parse(x.readFileSync(o,"utf8"));return this.crossRefCache.set(e,a),a}catch{return{}}}getCrossReferences(e,o,a){let t=this.loadBookCrossReferences(e);return t[o.toString()]&&t[o.toString()][a.toString()]||[]}getFlattenedCrossReferences(e,o,a){let t=this.getCrossReferences(e,o,a),r=new Set;for(let s of t)for(let p of s.refs)r.add(p);return Array.from(r)}getChapter(e,o,a){let t=this.loadBookChapters(e,a);return o<1||o>t.length?[]:t[o-1]||[]}getVerse(e,o,a,t,r){let s=this.getBook(e);if(!s)return;let p=this.getChapter(e,o,t);if(a<1||a>p.length)return;let h=p[a-1],l;if(r&&r!==t){let f=this.getChapter(e,o,r);a>=1&&a<=f.length&&(l=f[a-1])}let b=this.getCrossReferences(e,o,a),m=this.resolveCrossReferences(e,o,a,t,12),w=this.catalogById.get(t),C=r&&r!==t?this.catalogById.get(r):void 0;return{bookId:e,bookName:s.name,zuluBookName:s.zuluName,chapter:o,verse:a,text:h,translation:t,translationName:w?`${w.language} \u2014 ${w.name}`:t.toUpperCase(),direction:(w==null?void 0:w.direction)||"ltr",parallelText:l,parallelTranslation:r&&r!==t?r:void 0,parallelTranslationName:C?C.shortName:r==null?void 0:r.toUpperCase(),crossReferences:b.length>0?b:void 0,resolvedCrossReferences:m.length>0?m:void 0,chapterVerses:p}}getRandomVerse(e,o="kjv",a){let t=[];e&&e!=="all"&&this.topics[e]?t=this.topics[e].verses:t=this.curatedVerseList,t.length===0&&(t=[{bookId:43,chapter:3,verse:16}]);let r=Math.floor(Math.random()*t.length),s=t[r],p=this.getVerse(s.bookId,s.chapter,s.verse,o,a);return p||{bookId:43,bookName:"John",zuluBookName:"UJohane",chapter:3,verse:16,text:"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",translation:o}}getNextCuratedVerse(e,o,a="kjv",t){let r=[];if(o&&o!=="all"&&this.topics[o]?r=this.topics[o].verses:r=this.curatedVerseList,r.length===0)return this.getRandomVerse(o,a,t);let p=(r.findIndex(l=>l.bookId===e.bookId&&l.chapter===e.chapter&&l.verse===e.verse)+1)%r.length,h=r[p];return this.getVerse(h.bookId,h.chapter,h.verse,a,t)||this.getRandomVerse(o,a,t)}getNextSequentialVerse(e,o="kjv",a){let t=this.getBook(e.bookId);if(!t)return this.getRandomVerse(void 0,o,a);let r=this.getChapter(e.bookId,e.chapter,o);if(e.verse<r.length)return this.getVerse(e.bookId,e.chapter,e.verse+1,o,a);if(e.chapter<t.chapters)return this.getVerse(e.bookId,e.chapter+1,1,o,a);let s=e.bookId%66+1;return this.getVerse(s,1,1,o,a)}};var Ce=R(require("vscode")),Z=class Z{constructor(e){this.onDidChangeEmitter=new Ce.EventEmitter;this.onDidChangeBookmarks=this.onDidChangeEmitter.event;this.context=e}getBookmarks(){return[...this.context.globalState.get(Z.STORAGE_KEY,[])].sort((o,a)=>a.createdAt-o.createdAt)}isBookmarked(e,o,a){return this.getBookmarks().some(r=>r.bookId===e&&r.chapter===o&&r.verse===a)}getBookmark(e){return this.getBookmarks().find(o=>o.id===e)}async addBookmark(e,o,a){let t=this.getBookmarks(),r=`${e.bookId}:${e.chapter}:${e.verse}:${e.translation}`,s=t.filter(l=>l.id!==r),p=e.translation==="zulu"?e.zuluBookName:e.bookName,h={id:r,bookId:e.bookId,chapter:e.chapter,verse:e.verse,translation:e.translation,text:e.text,bookName:p,createdAt:Date.now(),note:o,tags:a};return s.unshift(h),await this.context.globalState.update(Z.STORAGE_KEY,s),this.onDidChangeEmitter.fire(),h}async removeBookmark(e){let a=this.getBookmarks().filter(t=>t.id!==e);await this.context.globalState.update(Z.STORAGE_KEY,a),this.onDidChangeEmitter.fire()}async updateBookmark(e,o,a){let t=this.getBookmarks(),r=t.find(s=>s.id===e);r&&(o!==void 0&&(r.note=o),a!==void 0&&(r.tags=a),await this.context.globalState.update(Z.STORAGE_KEY,t),this.onDidChangeEmitter.fire())}exportBookmarksMarkdown(){let e=this.getBookmarks();if(e.length===0)return`# Daily Bible Bookmarks

No bookmarks saved yet.`;let o=`# \u{1F4D6} Daily Bible \u2014 Saved Bookmarks & Favorites

`;o+=`*Exported on ${new Date().toLocaleDateString()}*

---

`;for(let a of e){let t=new Date(a.createdAt).toLocaleDateString();o+=`### ${a.bookName} ${a.chapter}:${a.verse} (${a.translation.toUpperCase()})
`,o+=`> "${a.text}"

`,a.note&&(o+=`\u{1F4DD} **Note:** ${a.note}

`),a.tags&&a.tags.length>0&&(o+=`\u{1F3F7}\uFE0F **Tags:** ${a.tags.map(r=>"`#"+r+"`").join(" ")}

`),o+=`*Saved on ${t}*

---

`}return o}exportBookmarksText(){let e=this.getBookmarks();if(e.length===0)return`Daily Bible \u2014 Saved Bookmarks

No bookmarks saved yet.`;let o=["DAILY BIBLE \u2014 SAVED BOOKMARKS & STUDY NOTES",`Exported on ${new Date().toLocaleDateString()}`,"============================================================",""];for(let a of e){let t=new Date(a.createdAt).toLocaleDateString();o.push(`${a.bookName} ${a.chapter}:${a.verse} (${a.translation.toUpperCase()})`),o.push(`"${a.text}"`),a.note&&o.push(`Note: ${a.note}`),a.tags&&a.tags.length>0&&o.push(`Tags: ${a.tags.map(r=>"#"+r).join(" ")}`),o.push(`Saved on ${t}`),o.push("------------------------------------------------------------"),o.push("")}return o.join(`
`)}exportBookmarksCsv(){let e=this.getBookmarks(),o=t=>`"${(t||"").replace(/"/g,'""')}"`,a=["Book,Chapter,Verse,Translation,Text,Note,Tags,SavedDate"];for(let t of e){let r=t.tags?t.tags.join("; "):"",s=new Date(t.createdAt).toISOString().slice(0,10);a.push([o(t.bookName),t.chapter.toString(),t.verse.toString(),o(t.translation.toUpperCase()),o(t.text),o(t.note||""),o(r),o(s)].join(","))}return a.join(`
`)}exportBookmarksHtml(){let e=this.getBookmarks(),o=t=>(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),a=e.length===0?"<p>No bookmarks saved yet.</p>":e.map(t=>{let r=new Date(t.createdAt).toLocaleDateString(),s=t.note?`<p class="note"><strong>Note:</strong> ${o(t.note)}</p>`:"",p=t.tags&&t.tags.length>0?`<div class="tags">${t.tags.map(h=>`<span>#${o(h)}</span>`).join(" ")}</div>`:"";return`<article class="card">
  <h2>${o(t.bookName)} ${t.chapter}:${t.verse} <small>(${o(t.translation.toUpperCase())})</small></h2>
  <blockquote>"${o(t.text)}"</blockquote>
  ${s}
  ${p}
  <div class="date">Saved on ${o(r)}</div>
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
  <div class="meta">Exported on ${o(new Date().toLocaleDateString())}</div>
  ${a}
</body>
</html>`}exportBookmarksJson(){return JSON.stringify(this.getBookmarks(),null,2)}exportFullBackup(e,o,a){let t={format:"daily-bible-backup",version:1,exportedAt:new Date().toISOString(),bookmarks:this.getBookmarks(),notes:a&&a.length>0?a:void 0,settings:e,installedTranslations:o};return JSON.stringify(t,null,2)}async mergeBookmarkItems(e){let o=this.getBookmarks(),a=new Set(o.map(r=>r.id)),t=0;for(let r of e)if(r&&r.bookId&&r.chapter&&r.verse&&r.text){let s=r.translation||"kjv",p=r.id||`${r.bookId}:${r.chapter}:${r.verse}:${s}`;a.has(p)||(o.push({...r,id:p,translation:s,createdAt:r.createdAt||Date.now()}),a.add(p),t++)}return t>0&&(await this.context.globalState.update(Z.STORAGE_KEY,o),this.onDidChangeEmitter.fire()),t}async importBookmarks(e){return(await this.importBackup(e)).bookmarksImported}async importBackup(e){try{let o=JSON.parse(e);if(Array.isArray(o))return{bookmarksImported:await this.mergeBookmarkItems(o)};if(o&&typeof o=="object"&&Array.isArray(o.bookmarks)){let a=o;return{bookmarksImported:await this.mergeBookmarkItems(a.bookmarks),notes:Array.isArray(a.notes)?a.notes:void 0,settings:a.settings,installedTranslations:Array.isArray(a.installedTranslations)?a.installedTranslations:void 0}}return{bookmarksImported:0}}catch{return{bookmarksImported:0}}}async importBookmarksMarkdown(e,o){let a=e.split(/\n---\s*\n/),t=[];for(let r of a){let s=r.match(/###\s+(.+?)\s+(\d+):(\d+)\s+\(([^)]+)\)/);if(!s)continue;let p=s[1].trim(),h=parseInt(s[2],10),l=parseInt(s[3],10),b=s[4].trim().toLowerCase(),m=o(p);if(!m||isNaN(h)||isNaN(l))continue;let w=r.match(/>\s*"([\s\S]*?)"/),C=w?w[1].trim():"";if(!C)continue;let f=r.match(/📝\s*\*\*Note:\*\*\s*(.+)/),S=f?f[1].trim():void 0,T=r.match(/🏷️\s*\*\*Tags:\*\*\s*(.+)/),D;if(T){let n=Array.from(T[1].matchAll(/#([A-Za-z0-9_\-]+)/g)).map(d=>d[1]);n.length>0&&(D=n)}t.push({id:`${m.id}:${h}:${l}:${b}`,bookId:m.id,chapter:h,verse:l,translation:b,text:C,bookName:p,createdAt:Date.now(),note:S,tags:D})}return this.mergeBookmarkItems(t)}};Z.STORAGE_KEY="dailyBread.bookmarks";var ie=Z;var Te=R(require("vscode")),X=class X{constructor(e){this.onDidChangeEmitter=new Te.EventEmitter;this.onDidChangeNotes=this.onDidChangeEmitter.event;this.context=e}getNotes(){return[...this.context.globalState.get(X.STORAGE_KEY,[])].sort((o,a)=>a.updatedAt-o.updatedAt)}getNote(e){return this.getNotes().find(o=>o.id===e)}getNotesForVerse(e,o,a){return this.getNotes().filter(t=>!(t.bookId!==e||t.chapter!==o||a!==void 0&&t.verse!==a))}async saveNote(e){let o=this.getNotes(),a=Date.now(),t=e.id?o.find(l=>l.id===e.id):void 0,r=e.verseData,s=r?r.translation==="zulu"?r.zuluBookName:r.bookName:e.bookName,p={id:t?t.id:e.id||`note_${a}_${Math.random().toString(36).slice(2,7)}`,bookId:r?r.bookId:e.bookId??(t==null?void 0:t.bookId),bookName:s??(t==null?void 0:t.bookName),chapter:r?r.chapter:e.chapter??(t==null?void 0:t.chapter),verse:r?r.verse:e.verse??(t==null?void 0:t.verse),translation:r?r.translation:e.translation??(t==null?void 0:t.translation),verseText:r?r.text:e.verseText??(t==null?void 0:t.verseText),title:e.title.trim()||"Untitled Study Note",content:e.content,tags:e.tags&&e.tags.length>0?e.tags:void 0,createdAt:t?t.createdAt:a,updatedAt:a},h=o.filter(l=>l.id!==p.id);return h.unshift(p),await this.context.globalState.update(X.STORAGE_KEY,h),this.onDidChangeEmitter.fire(),p}async deleteNote(e){let o=this.getNotes().filter(a=>a.id!==e);await this.context.globalState.update(X.STORAGE_KEY,o),this.onDidChangeEmitter.fire()}async importNotes(e){if(!Array.isArray(e)||e.length===0)return 0;let o=this.getNotes(),a=new Set(o.map(r=>r.id)),t=0;for(let r of e)if(r&&typeof r.content=="string"){let s=r.id||`note_${r.createdAt||Date.now()}_${t}`;a.has(s)||(o.push({...r,id:s,title:r.title||"Imported Study Note",createdAt:r.createdAt||Date.now(),updatedAt:r.updatedAt||r.createdAt||Date.now()}),a.add(s),t++)}return t>0&&(await this.context.globalState.update(X.STORAGE_KEY,o),this.onDidChangeEmitter.fire()),t}};X.STORAGE_KEY="dailyBread.studyNotes";var le=X;var $=R(require("vscode")),O=class c{constructor(e,o,a,t,r=43,s=3,p,h="kjv"){this.disposables=[];this.currentBookId=43;this.currentChapter=3;this.currentVerseTarget=16;this.primaryTranslation="kjv";this.parallelTranslation="zulu";this.isParallel=!1;this.panel=e,this.extensionUri=o,this.bibleManager=a,this.bookmarksManager=t,this.currentBookId=r,this.currentChapter=s,this.currentVerseTarget=p,this.primaryTranslation=h,this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.webview.onDidReceiveMessage(async l=>{switch(l.command){case"prevChapter":this.goToPreviousChapter();break;case"nextChapter":this.goToNextChapter();break;case"setChapter":this.currentChapter=l.chapter,this.currentVerseTarget=void 0,this.update();break;case"setBookAndChapter":this.currentBookId=l.bookId,this.currentChapter=l.chapter,this.currentVerseTarget=l.verse,this.update();break;case"toggleParallel":this.isParallel=!this.isParallel,this.update();break;case"setPrimaryTranslation":if(l.translation==="__more__"){$.commands.executeCommand("dailyBread.switchTranslation","primary"),this.update();break}this.primaryTranslation=l.translation,this.update();break;case"setParallelTranslation":if(l.translation==="__more__"){$.commands.executeCommand("dailyBread.switchTranslation","parallel"),this.update();break}this.parallelTranslation=l.translation,this.update();break;case"openTranslationSwitcher":$.commands.executeCommand("dailyBread.switchTranslation",l.mode||"primary");break;case"copyVerse":{let b=this.bibleManager.getVerse(l.bookId,l.chapter,l.verse,l.translation);if(b){let m=l.translation==="zulu"?b.zuluBookName:b.bookName,w=`"${b.text}" \u2014 ${m} ${l.chapter}:${l.verse} (${l.translation.toUpperCase()})`;await $.env.clipboard.writeText(w),$.window.showInformationMessage(`Copied: ${m} ${l.chapter}:${l.verse}`)}break}case"bookmarkVerse":{let b=this.bibleManager.getVerse(l.bookId,l.chapter,l.verse,l.translation);if(b){if(this.bookmarksManager.isBookmarked(l.bookId,l.chapter,l.verse)){let m=`${l.bookId}:${l.chapter}:${l.verse}:${l.translation}`;await this.bookmarksManager.removeBookmark(m),$.window.showInformationMessage("Bookmark removed.")}else await this.bookmarksManager.addBookmark(b),$.window.showInformationMessage(`\u2B50 Bookmarked: ${b.bookName} ${l.chapter}:${l.verse}`);this.update()}break}case"openBookPicker":this.showBookPicker();break;case"addNoteForVerse":{let b=this.bibleManager.getVerse(l.bookId,l.chapter,l.verse,l.translation);b&&$.commands.executeCommand("dailyBread.addNote",b);break}case"jumpToReference":{if(l.ref){let b=this.bibleManager.parseReference(l.ref);b?this.navigate(b.book.id,b.chapter,b.verse,this.primaryTranslation):$.window.showInformationMessage(`Could not resolve cross-reference: ${l.ref}`)}break}case"adjustFontSize":{let b=$.workspace.getConfiguration("dailyBread"),m=b.get("fontSize",0),w=$.workspace.getConfiguration("editor").get("fontSize",14),f=Math.max(10,Math.min(36,(m===0?w:m)+l.delta));await b.update("fontSize",f,$.ConfigurationTarget.Global),this.update();break}case"setFontSize":{await $.workspace.getConfiguration("dailyBread").update("fontSize",l.size,$.ConfigurationTarget.Global),this.update();break}case"promptFontSize":{await $.commands.executeCommand("dailyBread.changeFontSize");break}}},null,this.disposables)}static updateCurrent(){var e;(e=c.currentPanel)==null||e.update()}static createOrShow(e,o,a,t=43,r=3,s,p="kjv"){let h=$.window.activeTextEditor?$.window.activeTextEditor.viewColumn:void 0;if(c.currentPanel)return c.currentPanel.panel.reveal(h),c.currentPanel.navigate(t,r,s,p),c.currentPanel;let l=$.window.createWebviewPanel("dailyBreadReader","Daily Bible Reader",h||$.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0,localResourceRoots:[$.Uri.joinPath(e,"media")]});return c.currentPanel=new c(l,e,o,a,t,r,s,p),c.currentPanel}navigate(e,o,a,t){this.currentBookId=e,this.currentChapter=o,this.currentVerseTarget=a,t&&(this.primaryTranslation=t),this.update()}goToPreviousChapter(){if(this.bibleManager.getBook(this.currentBookId)){if(this.currentChapter>1)this.currentChapter--;else if(this.currentBookId>1){this.currentBookId--;let o=this.bibleManager.getBook(this.currentBookId);this.currentChapter=o?o.chapters:1}this.currentVerseTarget=void 0,this.update()}}goToNextChapter(){let e=this.bibleManager.getBook(this.currentBookId);e&&(this.currentChapter<e.chapters?this.currentChapter++:this.currentBookId<66&&(this.currentBookId++,this.currentChapter=1),this.currentVerseTarget=void 0,this.update())}async showBookPicker(){let o=this.bibleManager.getBooks().map(s=>({label:this.primaryTranslation==="zulu"?`${s.zuluName} (${s.name})`:`${s.name} (${s.zuluName})`,description:`${s.testament} \u2022 ${s.chapters} chapters`,book:s})),a=await $.window.showQuickPick(o,{placeHolder:"Select a Book to Read (e.g. USenesisi, AmaHubo, UJohane, Romans)"});if(!a)return;let t=Array.from({length:a.book.chapters},(s,p)=>({label:`Chapter ${p+1}`,chapter:p+1})),r=await $.window.showQuickPick(t,{placeHolder:`Select Chapter (1 to ${a.book.chapters})`});r&&(this.currentBookId=a.book.id,this.currentChapter=r.chapter,this.currentVerseTarget=void 0,this.update())}update(){let e=this.bibleManager.getBook(this.currentBookId);if(!e)return;let o=this.primaryTranslation==="zulu"?e.zuluName:e.name;this.panel.title=`\u{1F4D6} ${o} ${this.currentChapter}`,this.panel.webview.html=this.getHtmlContent(e)}getHtmlContent(e){this.bibleManager.isTranslationInstalled(this.primaryTranslation)||(this.primaryTranslation="kjv"),this.bibleManager.isTranslationInstalled(this.parallelTranslation)||(this.parallelTranslation="zulu");let o=this.bibleManager.getInstalledTranslations(),a=this.bibleManager.getTranslationInfo(this.primaryTranslation),t=this.bibleManager.getTranslationInfo(this.parallelTranslation),r=(a==null?void 0:a.direction)||"ltr",s=o.map(y=>`<option value="${y.id}" ${this.primaryTranslation===y.id?"selected":""}>${y.language} (${y.shortName})</option>`).join("")+'<option value="__more__">\u{1F310} Download More Translations...</option>',p=o.map(y=>`<option value="${y.id}" ${this.parallelTranslation===y.id?"selected":""}>Parallel: ${y.language} (${y.shortName})</option>`).join("")+'<option value="__more__">\u{1F310} Download More Translations...</option>',h=this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.primaryTranslation),l=this.isParallel?this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.parallelTranslation):[],b=this.primaryTranslation==="zulu"?`${e.zuluName} (${e.name})`:`${e.name} (${e.zuluName})`,m=e.chapters,w="",C=Math.max(h.length,l.length);for(let y=0;y<C;y++){let k=y+1,V=h[y]||"",z=l[y]||"",P=this.bookmarksManager.isBookmarked(e.id,this.currentChapter,k),E=this.currentVerseTarget===k?"target-verse":"",q=P?"is-bookmarked":"",W=this.bibleManager.resolveCrossReferences(e.id,this.currentChapter,k,this.primaryTranslation,8),ve=W.length>0,ke="";ve&&(ke=`
          <div class="cross-ref-tray" id="cross-tray-${k}" style="display:none;">
            <div class="cross-ref-tray-title">\u{1F517} Cross References & Connected Verses (${W.length})</div>
            <div class="cross-ref-list">
              ${W.map(Q=>`
                <div class="cross-ref-item" onclick="jumpRef('${Q.ref}')" title="Click to open ${Q.ref} in reader">
                  <div class="cr-header">
                    <span class="cr-citation">\u{1F517} ${Q.bookName} ${Q.chapter}:${Q.verse}${Q.endVerse?"-"+Q.endVerse:""}</span>
                    ${Q.anchor?`<span class="cr-anchor">on "${Q.anchor}"</span>`:""}
                  </div>
                  <div class="cr-verse-text">"${Q.text}"</div>
                </div>
              `).join("")}
            </div>
          </div>
        `),this.isParallel?w+=`
          <div class="verse-row ${E}" id="verse-${k}">
            <div class="verse-col primary-col ${q}">
              <span class="verse-num">${k}</span>
              <span class="verse-text">${V}</span>
              <div class="verse-actions">
                ${ve?`<button title="Cross References" class="action-btn" onclick="toggleCrossRefs(${k})">\u{1F517}</button>`:""}
                <button title="Add Study Note" class="action-btn" onclick="addVerseNote(${e.id}, ${this.currentChapter}, ${k}, '${this.primaryTranslation}')">\u{1F4DD}</button>
                <button title="${P?"Remove Bookmark":"Bookmark Verse"}" class="action-btn bookmark-btn ${P?"bookmarked":""}" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${k}, '${this.primaryTranslation}')">${P?"\u2B50":"\u2606"}</button>
                <button title="Copy" class="action-btn" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${k}, '${this.primaryTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
            <div class="verse-col parallel-col">
              <span class="verse-num">${k}</span>
              <span class="verse-text">${z}</span>
              <div class="verse-actions">
                <button title="Copy" class="action-btn" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${k}, '${this.parallelTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
          </div>
          ${ke}
        `:w+=`
          <div class="verse-item ${E} ${q}" id="verse-${k}">
            <span class="verse-num">${k}</span>
            <span class="verse-text">${V}</span>
            <span class="verse-actions">
              ${ve?`<button class="action-btn" title="View Cross References" onclick="toggleCrossRefs(${k})">\u{1F517}</button>`:""}
              <button class="action-btn" title="Add Study Note" onclick="addVerseNote(${e.id}, ${this.currentChapter}, ${k}, '${this.primaryTranslation}')">\u{1F4DD}</button>
              <button class="action-btn bookmark-btn ${P?"bookmarked":""}" title="${P?"Remove Bookmark":"Bookmark Verse"}" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${k}, '${this.primaryTranslation}')">${P?"\u2B50":"\u2606"}</button>
              <button class="action-btn" title="Copy Verse" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${k}, '${this.primaryTranslation}')">\u{1F4CB}</button>
            </span>
          </div>
          ${ke}
        `}let f=$.workspace.getConfiguration("dailyBread"),S=f.get("fontSize",0),T=f.get("fontFamily","editor"),D=$.workspace.getConfiguration("editor"),n=D.get("fontSize",14),d=D.get("fontFamily",""),u="var(--vscode-editor-font-family, monospace)";T==="serif"?u='Georgia, Garamond, "Times New Roman", serif':T==="sans-serif"?u='var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)':T==="monospace"?u='var(--vscode-editor-font-family, Consolas, "Courier New", monospace)':T==="system"&&(u='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');let v=S===0?`Editor (${n}px)`:`${S}px`,g=S===0?`var(--vscode-editor-font-size, ${n}px)`:`${S}px`;return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${b} ${this.currentChapter}</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --font-family: ${u};
      --reader-font-size: ${g};
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
      border: 1px solid transparent;
      color: var(--fg);
      cursor: pointer;
      font-size: 14px;
      padding: 2px 5px;
      border-radius: 4px;
      line-height: 1.2;
      opacity: 0.9;
    }

    .action-btn:hover {
      background: var(--hover-bg);
      border-color: var(--border);
      opacity: 1;
    }

    .bookmark-btn {
      font-size: 15px;
      color: #facc15;
    }

    .is-bookmarked .verse-actions {
      opacity: 1;
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
        ${b} \u2014 Chapter ${this.currentChapter} \u25BE
      </div>
      <button class="btn" onclick="nextChapter()" title="Next Chapter">Next \u25B6</button>
    </div>

    <div class="view-controls">
      <label for="primary-trans" style="font-size:12px;opacity:0.8;">Primary:</label>
      <select id="primary-trans" onchange="changePrimary(this.value)">
        ${s}
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
          <span id="font-size-label">${v}</span>
        </button>
        <button class="btn font-btn" onclick="adjustFontSize(1)" title="Increase font size (A+)">A+</button>
        <button class="btn font-btn ${S===0?"btn-active":""}" onclick="resetFontSize()" title="Match VS Code Editor Font Size">Auto</button>
      </div>
    </div>
  </div>

  <div class="content-area">
    <div class="chapter-hero">
      <h1>${b}</h1>
      <div class="subtitle">Chapter ${this.currentChapter} of ${m} \u2022 ${a?`${a.language} \u2014 ${a.name}`:this.primaryTranslation.toUpperCase()}</div>
    </div>

    ${this.isParallel?`
      <div class="parallel-headers">
        <div>${a?`${a.language} (${a.shortName})`:this.primaryTranslation.toUpperCase()}</div>
        <div>${t?`${t.language} (${t.shortName})`:this.parallelTranslation.toUpperCase()}</div>
      </div>
    `:""}

    <div class="verses-container" dir="${r}">
      ${w}
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

    function addVerseNote(bookId, chapter, verse, translation) {
      vscode.postMessage({ command: 'addNoteForVerse', bookId, chapter, verse, translation });
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
</html>`}isVisible(){return this.panel.visible}dispose(){for(c.currentPanel=void 0,this.panel.dispose();this.disposables.length;){let e=this.disposables.pop();e&&e.dispose()}}};var U=R(require("vscode")),ee=class c{constructor(e,o,a,t){this.disposables=[];this.panel=e,this.notesManager=o,this.activeNote=a,this.linkedVerse=t,this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.webview.onDidReceiveMessage(async r=>{var s,p,h,l,b,m,w,C,f,S,T,D,n,d,u,v,g,y,k;switch(r.command){case"saveNote":{let V=(r.tags||"").split(",").map(P=>P.trim().replace(/^#/,"")).filter(P=>P.length>0),z=await this.notesManager.saveNote({id:(s=this.activeNote)==null?void 0:s.id,title:r.title||"",content:r.content||"",tags:V,verseData:this.linkedVerse,bookId:(p=this.activeNote)==null?void 0:p.bookId,bookName:(h=this.activeNote)==null?void 0:h.bookName,chapter:(l=this.activeNote)==null?void 0:l.chapter,verse:(b=this.activeNote)==null?void 0:b.verse,translation:(m=this.activeNote)==null?void 0:m.translation,verseText:(w=this.activeNote)==null?void 0:w.verseText});this.activeNote=z,this.panel.title=`\u{1F4DD} ${z.title}`,this.panel.webview.postMessage({command:"saved",id:z.id}),U.window.showInformationMessage(`\u{1F4DD} Study note saved: ${z.title}`);break}case"deleteNote":{this.activeNote&&(await this.notesManager.deleteNote(this.activeNote.id),U.window.showInformationMessage("Study note deleted."),this.panel.dispose());break}case"openChapter":{let V=((C=this.linkedVerse)==null?void 0:C.bookId)??((f=this.activeNote)==null?void 0:f.bookId),z=((S=this.linkedVerse)==null?void 0:S.chapter)??((T=this.activeNote)==null?void 0:T.chapter),P=((D=this.linkedVerse)==null?void 0:D.verse)??((n=this.activeNote)==null?void 0:n.verse),A=((d=this.linkedVerse)==null?void 0:d.translation)??((u=this.activeNote)==null?void 0:u.translation);V&&z&&U.commands.executeCommand("dailyBread.openReaderAt",V,z,P,A);break}case"exportSingleMarkdown":{let V=(r.title||((v=this.activeNote)==null?void 0:v.title)||"Study Note").trim(),z=r.content||((g=this.activeNote)==null?void 0:g.content)||"",P=this.getRefDisplay(),A=((y=this.linkedVerse)==null?void 0:y.text)||((k=this.activeNote)==null?void 0:k.verseText)||"",E=`# ${V}

`;P&&(E+=`**Scripture:** ${P}
`,A&&(E+=`> "${A}"
`),E+=`
`),E+=`${z}
`;let q=await U.workspace.openTextDocument({content:E,language:"markdown"});await U.window.showTextDocument(q);break}}},null,this.disposables)}static createOrShow(e,o){let a=U.window.activeTextEditor?U.window.activeTextEditor.viewColumn:void 0;if(c.currentPanel)return c.currentPanel.activeNote=o==null?void 0:o.note,c.currentPanel.linkedVerse=o==null?void 0:o.verseData,c.currentPanel.panel.reveal(a),c.currentPanel.update(),c.currentPanel;let t=U.window.createWebviewPanel("dailyBreadStudyNote","\u{1F4DD} Study Note",a||U.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});return c.currentPanel=new c(t,e,o==null?void 0:o.note,o==null?void 0:o.verseData),c.currentPanel}getRefDisplay(){var e,o;if(this.linkedVerse)return`${this.linkedVerse.translation==="zulu"?this.linkedVerse.zuluBookName:this.linkedVerse.bookName} ${this.linkedVerse.chapter}:${this.linkedVerse.verse} (${this.linkedVerse.translation.toUpperCase()})`;if((e=this.activeNote)!=null&&e.bookName&&((o=this.activeNote)!=null&&o.chapter)){let a=this.activeNote.verse?`:${this.activeNote.verse}`:"",t=this.activeNote.translation?` (${this.activeNote.translation.toUpperCase()})`:"";return`${this.activeNote.bookName} ${this.activeNote.chapter}${a}${t}`}return""}escapeHtml(e){return(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}update(){var s,p,h,l,b;let e=this.getRefDisplay(),o=((s=this.linkedVerse)==null?void 0:s.text)||((p=this.activeNote)==null?void 0:p.verseText)||"",a=((h=this.activeNote)==null?void 0:h.title)||(e?`Study Note \u2014 ${e}`:"New Spiritual / Study Note"),t=((l=this.activeNote)==null?void 0:l.content)||"",r=(b=this.activeNote)!=null&&b.tags?this.activeNote.tags.join(", "):"";this.panel.title=`\u{1F4DD} ${a}`,this.panel.webview.html=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Study Note</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --muted: var(--vscode-descriptionForeground);
      --card: var(--vscode-sideBar-background, rgba(128,128,128,0.08));
      --border: var(--vscode-panel-border, rgba(128,128,128,0.25));
      --accent: var(--vscode-button-background, #007acc);
      --accent-fg: var(--vscode-button-foreground, #ffffff);
      --input-bg: var(--vscode-input-background);
      --input-fg: var(--vscode-input-foreground);
      --input-border: var(--vscode-input-border, var(--border));
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px 32px 48px 32px;
      background: var(--bg);
      color: var(--fg);
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      max-width: 860px;
      margin-left: auto;
      margin-right: auto;
    }
    .scripture-box {
      background: var(--card);
      border-left: 4px solid var(--accent);
      border-radius: 0 8px 8px 0;
      padding: 14px 18px;
      margin-bottom: 20px;
    }
    .scripture-ref {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 13.5px;
      margin-bottom: 6px;
    }
    .scripture-text {
      font-size: 14.5px;
      line-height: 1.6;
      font-style: italic;
      opacity: 0.95;
    }
    .field-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    input[type="text"], textarea {
      width: 100%;
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 6px;
      padding: 10px 13px;
      font-family: inherit;
      font-size: 14px;
      outline: none;
      margin-bottom: 16px;
    }
    input[type="text"]:focus, textarea:focus {
      border-color: var(--vscode-focusBorder, var(--accent));
    }
    #note-title {
      font-size: 17px;
      font-weight: 600;
    }
    #note-content {
      min-height: 300px;
      line-height: 1.65;
      resize: vertical;
      font-size: 14.5px;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .btn-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .btn {
      padding: 8px 15px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--fg);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }
    .btn:hover { background: rgba(128,128,128,0.16); }
    .btn-primary {
      background: var(--accent);
      color: var(--accent-fg);
      border-color: var(--accent);
    }
    .btn-danger {
      color: #f85149;
      border-color: rgba(248, 81, 73, 0.35);
    }
    .status-text {
      font-size: 12px;
      color: var(--muted);
    }
  </style>
</head>
<body>
  ${e?`<div class="scripture-box">
          <div class="scripture-ref">
            <span>\u{1F4D6} ${this.escapeHtml(e)}</span>
            <button class="btn" style="padding:4px 10px;font-size:12px;" onclick="openChapter()">Open Chapter in Reader</button>
          </div>
          ${o?`<div class="scripture-text">"${this.escapeHtml(o)}"</div>`:""}
        </div>`:""}

  <label class="field-label" for="note-title">Note Title</label>
  <input id="note-title" type="text" value="${this.escapeHtml(a)}" placeholder="e.g. Sunday Sermon Notes / Morning Devotion..." />

  <label class="field-label" for="note-content">Study Notes &amp; Reflections</label>
  <textarea id="note-content" placeholder="Write your Bible study notes, sermon outline, prayer, or theological reflections here... (Ctrl+S / Cmd+S to save)" autofocus>${this.escapeHtml(t)}</textarea>

  <label class="field-label" for="note-tags">Tags (comma separated, optional)</label>
  <input id="note-tags" type="text" value="${this.escapeHtml(r)}" placeholder="e.g. sermon, grace, devotion, theology" />

  <div class="toolbar">
    <div class="btn-group">
      <button class="btn btn-primary" onclick="save()">\u{1F4BE} Save Note</button>
      <button class="btn" onclick="exportMd()">\u{1F4C4} Open as Markdown (.md)</button>
      ${this.activeNote?'<button class="btn btn-danger" onclick="deleteNote()">\u{1F5D1} Delete</button>':""}
    </div>
    <span class="status-text" id="status-text">Tip: Press Ctrl+S (Cmd+S) to save anytime</span>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function save() {
      vscode.postMessage({
        command: 'saveNote',
        title: document.getElementById('note-title').value,
        content: document.getElementById('note-content').value,
        tags: document.getElementById('note-tags').value
      });
    }

    function deleteNote() {
      vscode.postMessage({ command: 'deleteNote' });
    }

    function openChapter() {
      vscode.postMessage({ command: 'openChapter' });
    }

    function exportMd() {
      vscode.postMessage({
        command: 'exportSingleMarkdown',
        title: document.getElementById('note-title').value,
        content: document.getElementById('note-content').value
      });
    }

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    });

    window.addEventListener('message', (event) => {
      if (event.data && event.data.command === 'saved') {
        document.getElementById('status-text').textContent = '\u2705 Saved just now';
      }
    });
  </script>
</body>
</html>`}dispose(){for(c.currentPanel=void 0,this.panel.dispose();this.disposables.length;){let e=this.disposables.pop();e==null||e.dispose()}}};var I=R(require("vscode")),te=class c{constructor(e,o,a,t){this.disposables=[];this.targetMode="primary";this.downloadingIds=new Set;this.panel=e,this.bibleManager=o,this.callbacks=a,this.targetMode=t,this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.webview.onDidReceiveMessage(async r=>{switch(r.command){case"setTargetMode":this.targetMode=r.mode==="parallel"?"parallel":"primary",this.update();break;case"activateTranslation":await this.activateTranslation(r.id,r.mode||this.targetMode);break;case"disableParallel":await I.workspace.getConfiguration("dailyBread").update("dualTranslation","none",I.ConfigurationTarget.Global),this.callbacks.onTranslationActivated(),this.update(),I.window.showInformationMessage("Parallel translation disabled.");break;case"downloadTranslation":await this.handleDownload(r.id,!!r.activateAfter,r.mode||this.targetMode);break;case"deleteTranslation":await this.handleDelete(r.id);break}},null,this.disposables)}static createOrShow(e,o,a="primary"){let t=I.window.activeTextEditor?I.window.activeTextEditor.viewColumn:void 0;if(c.currentPanel)return c.currentPanel.targetMode=a,c.currentPanel.panel.reveal(t),c.currentPanel.update(),c.currentPanel;let r=I.window.createWebviewPanel("dailyBreadTranslations","\u{1F310} Bible Translations & Offline Library",t||I.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});return c.currentPanel=new c(r,e,o,a),c.currentPanel}static updateCurrent(){var e;(e=c.currentPanel)==null||e.update()}async activateTranslation(e,o){if(!this.bibleManager.isTranslationInstalled(e)){await this.handleDownload(e,!0,o);return}let a=I.workspace.getConfiguration("dailyBread"),t=this.bibleManager.getTranslationInfo(e),r=t?`${t.language} \u2014 ${t.name}`:e.toUpperCase();o==="parallel"?(await a.update("dualTranslation",e,I.ConfigurationTarget.Global),I.window.showInformationMessage(`\u{1F4D6} Parallel translation set to: ${r}`)):(await a.update("translation",e,I.ConfigurationTarget.Global),I.window.showInformationMessage(`\u{1F310} Active Bible translation switched to: ${r}`)),this.callbacks.onTranslationActivated(),this.update()}async handleDownload(e,o,a){if(this.downloadingIds.has(e))return;let t=this.bibleManager.getTranslationInfo(e),r=t?`${t.language} \u2014 ${t.name}`:e;this.downloadingIds.add(e),this.panel.webview.postMessage({command:"downloadState",id:e,state:"downloading"});try{await I.window.withProgress({location:I.ProgressLocation.Notification,title:`Downloading ${r} for offline use...`,cancellable:!1},async()=>{await this.bibleManager.downloadTranslation(e)}),this.downloadingIds.delete(e),o?await this.activateTranslation(e,a):(this.callbacks.onTranslationActivated(),this.update(),I.window.showInformationMessage(`\u2705 Downloaded for offline use: ${r}`))}catch(s){this.downloadingIds.delete(e),this.panel.webview.postMessage({command:"downloadState",id:e,state:"error",error:(s==null?void 0:s.message)||"Download failed"}),I.window.showErrorMessage(`Failed to download ${r}: ${(s==null?void 0:s.message)||s}. Please check your internet connection and try again.`)}}async handleDelete(e){let o=I.workspace.getConfiguration("dailyBread"),a=o.get("translation","kjv"),t=o.get("dualTranslation","none");a===e&&await o.update("translation","kjv",I.ConfigurationTarget.Global),t===e&&await o.update("dualTranslation","none",I.ConfigurationTarget.Global),this.bibleManager.deleteDownloadedTranslation(e),this.callbacks.onTranslationActivated(),this.update()}update(){this.panel.webview.html=this.getHtml()}escapeHtml(e){return(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}getHtml(){let e=I.workspace.getConfiguration("dailyBread"),o=e.get("translation","kjv"),a=e.get("dualTranslation","none"),r=this.bibleManager.getCatalog().map(m=>({...m,installed:this.bibleManager.isTranslationInstalled(m.id),downloading:this.downloadingIds.has(m.id)})),s=r.filter(m=>m.installed).length,p=Array.from(new Set(r.map(m=>m.region||"Other"))),h=r.find(m=>m.id===o),l=a!=="none"?r.find(m=>m.id===a):void 0,b=JSON.stringify(r).replace(/</g,"\\u003c");return`<!DOCTYPE html>
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
            <strong>${this.escapeHtml(h?`${h.language} (${h.shortName})`:o)}</strong>
          </div>
          <div class="summary-pill">
            <span>Parallel:</span>
            <strong>${l?this.escapeHtml(`${l.language} (${l.shortName})`):"Off"}</strong>
            ${l?'<button class="btn" style="padding:2px 6px;font-size:11px;" onclick="disableParallel()">Off</button>':""}
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
        <button class="filter-pill" data-filter="installed">\u2705 Installed Offline (${s})</button>
        <button class="filter-pill" data-filter="available">\u2601\uFE0F Available to Download (${r.length-s})</button>
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
    const ALL_TRANSLATIONS = ${b};
    let activePrimary = ${JSON.stringify(o)};
    let activeParallel = ${JSON.stringify(a)};
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
</html>`}dispose(){for(c.currentPanel=void 0,this.panel.dispose();this.disposables.length;){let e=this.disposables.pop();e==null||e.dispose()}}};var oe=R(require("vscode")),de=class{constructor(){this.statusBarItem=oe.window.createStatusBarItem(oe.StatusBarAlignment.Right,100),this.statusBarItem.command="dailyBread.menu"}getVerse(){return this.currentVerse}getIconSymbol(e){switch(e){case"cross":return"\u271D ";case"book":return"\u{1F4D6} ";case"dove":return"\u{1F54A}\uFE0F ";case"none":default:return""}}update(e,o,a,t=!1,r=!1){this.currentVerse=e;let s=this.getIconSymbol(a),p=t?"\u2B50 ":"",h=r?"\u23F8 ":"",b=`${e.translation==="zulu"?e.zuluBookName:e.bookName} ${e.chapter}:${e.verse}`,m="";switch(o){case"compact":m=`${p}${h}${s}${b}`;break;case"preview":{let w=e.text.length>40?e.text.slice(0,37)+"...":e.text;m=`${p}${h}${s}${b} \u2014 "${w}"`;break}case"full":m=`${p}${h}${s}${b} \u2014 "${e.text}"`;break}this.statusBarItem.text=m,this.statusBarItem.tooltip=this.createTooltip(e,t,r),this.statusBarItem.show()}createTooltip(e,o,a=!1){let t=new oe.MarkdownString;t.isTrusted=!0,t.supportHtml=!0;let r=e.translation==="zulu"?e.zuluBookName:e.bookName,s=e.translationName||(e.translation==="zulu"?"isiZulu (IBhayibheli Elingcwele 1959)":e.translation==="kjv"?"King James Version (KJV)":e.translation.toUpperCase()),p=o?"\u2B50 Bookmarked (Remove)":"\u{1F516} Bookmark Verse",h=o?"\u2B50 Bookmarked *(Click to Remove)*":"\u{1F516} **Bookmark This Verse**",l=o?"command:dailyBread.removeCurrentBookmark":"command:dailyBread.bookmarkCurrent",b=o?`Remove ${r} ${e.chapter}:${e.verse} from saved bookmarks`:`Bookmark ${r} ${e.chapter}:${e.verse} with optional note & tags`,m=a?"$(play) Resume Auto-Rotation":"$(debug-pause) Pause Rotation",w=a?"Resume automatic rotating verses":"Pause auto-rotation (Reading Mode: prevents verses from changing while reading)";if(t.appendMarkdown(`| \u{1F4D6} **${r} ${e.chapter}:${e.verse}** | \u{1F310} **${s}** |
| :----------------------------------------------------------------------------- | -------------------------------------------------------------------: |

`),a&&t.appendMarkdown(`> \u23F8 **Reading Mode Active** \u2014 Auto-rotation is paused. Verses will not change automatically while you read.  
> [$(play) Click to Resume Auto-Rotation](command:dailyBread.togglePauseRotation "Resume automatic rotation") &nbsp;&bull;&nbsp; [$(sync) Advance Verse Manually](command:dailyBread.nextVerse "Advance to next verse")

`),t.appendMarkdown(`[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [${p}](${l} "${b}") &nbsp;&bull;&nbsp; [\u{1F4DD} Add Note](command:dailyBread.addNote "Write a study note for this verse") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Search, switch, or download Bible translations") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${m}](command:dailyBread.togglePauseRotation "${w}") &nbsp;&bull;&nbsp; [$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; [$(copy) Copy](command:dailyBread.copyVerse "Copy verse to clipboard")

`),t.appendMarkdown(`---

`),t.appendMarkdown(`## \u{1F4D6} **${r} ${e.chapter}:${e.verse}**

`),t.appendMarkdown(`> ### **"${e.text}"**
>
> [${h}](${l} "${b}") &nbsp;&bull;&nbsp; [\u{1F4DD} Add Study Note](command:dailyBread.addNote "Write a study note for this verse") &nbsp;&bull;&nbsp; [$(copy) Copy Verse](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(book) Read Chapter in Editor](command:dailyBread.readChapter "Open full in-editor reader tab")

`),e.parallelText&&e.parallelTranslation){let C=e.parallelTranslationName||(e.parallelTranslation==="zulu"?"isiZulu (1959)":e.parallelTranslation.toUpperCase());t.appendMarkdown(`> **Parallel (${C}):** *"${e.parallelText}"*

`)}if(t.appendMarkdown(`---

`),e.chapterVerses&&e.chapterVerses.length>0){let C=e.chapterVerses.length;t.appendMarkdown(`### \u{1F4DC} Full Chapter: **${r} Chapter ${e.chapter}** (Verses 1 to ${C})

*Scroll up and down to read all verses in context:*  

`);for(let f=0;f<C;f++){let S=f+1,T=e.chapterVerses[f];S===e.verse?t.appendMarkdown(`\u{1F449} **<mark>&nbsp;[${S}] ${T}&nbsp;</mark>** *(Active Verse)*  

`):t.appendMarkdown(`**${S}.** ${T}  

`)}t.appendMarkdown(`---

`)}if(e.resolvedCrossReferences&&e.resolvedCrossReferences.length>0){let C=e.resolvedCrossReferences;t.appendMarkdown(`### \u{1F517} Cross-References & Scripture Connections (${C.length} Passages)

*Scriptures connected by Treasury of Scripture Knowledge (TSK):*  

`);for(let f of C){let S=e.translation==="zulu"?f.zuluBookName:f.bookName,T=f.endVerse?`-${f.endVerse}`:"",D=`${S} ${f.chapter}:${f.verse}${T}`,n=`command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([f.ref]))}`,d=f.anchor?` &nbsp;*(connecting theme: "${f.anchor}")*`:"";t.appendMarkdown(`* **[\u{1F4D6} ${D}](${n} "Jump to ${D}")**${d}  
`),t.appendMarkdown(`  > *"${f.text}"*

`)}t.appendMarkdown(`---

`)}else if(e.crossReferences&&e.crossReferences.length>0){let C=[],f=new Set;for(let S of e.crossReferences){for(let T of S.refs)if(!f.has(T)&&(f.add(T),C.push(T),C.length>=12))break;if(C.length>=12)break}if(C.length>0){let S=C.map(T=>`[\u{1F517} ${T}](command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([T]))} "Jump to ${T}")`).join(" &nbsp;&bull;&nbsp; ");t.appendMarkdown(`### \u{1F517} Cross-References:
${S}

---

`)}}return t.appendMarkdown(`### \u{1F9ED} Quick Navigation

[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Search, switch, or download Bible translations") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${m}](command:dailyBread.togglePauseRotation "${w}") &nbsp;&bull;&nbsp; [$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; [$(copy) Copy Verse](command:dailyBread.copyVerse "Copy verse to clipboard")
`),t}dispose(){this.statusBarItem.dispose()}};var H=R(require("vscode")),ce=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new H.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(!e)return Promise.resolve([new ae("Old Testament (Isivumelwano Esidala)","OT",H.TreeItemCollapsibleState.Expanded,"testament"),new ae("New Testament (Isivumelwano Esisha)","NT",H.TreeItemCollapsibleState.Expanded,"testament")]);if(e.itemType==="testament"){let o=this.bibleManager.getBooks().filter(a=>a.testament===e.contextValue);return Promise.resolve(o.map(a=>new ae(`${a.name} (${a.zuluName})`,a.id.toString(),H.TreeItemCollapsibleState.Collapsed,"book",a)))}if(e.itemType==="book"&&e.book){let o=[];for(let a=1;a<=e.book.chapters;a++){let t=new ae(`Chapter ${a}`,`${e.book.id}:${a}`,H.TreeItemCollapsibleState.None,"chapter",e.book,a);t.command={command:"dailyBread.openReaderAt",title:"Read Chapter",arguments:[e.book.id,a]},o.push(t)}return Promise.resolve(o)}return Promise.resolve([])}},ae=class extends H.TreeItem{constructor(o,a,t,r,s,p){super(o,t);this.label=o;this.idValue=a;this.collapsibleState=t;this.itemType=r;this.book=s;this.chapter=p;this.contextValue=r,r==="testament"?this.iconPath=new H.ThemeIcon("library"):r==="book"?(this.iconPath=new H.ThemeIcon("book"),this.description=`${s==null?void 0:s.chapters} ch`):r==="chapter"&&(this.iconPath=new H.ThemeIcon("file-text"))}};var j=R(require("vscode")),pe=class{constructor(e){this.bookmarksManager=e;this._onDidChangeTreeData=new j.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event;this.bookmarksManager.onDidChangeBookmarks(()=>{this.refresh()})}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(e)return Promise.resolve([]);let o=this.bookmarksManager.getBookmarks();if(o.length===0){let a=new ue("No bookmarks saved yet",j.TreeItemCollapsibleState.None,void 0);return a.description="Click \u2B50 on status bar or reader",Promise.resolve([a])}return Promise.resolve(o.map(a=>{let t=new ue(`${a.bookName} ${a.chapter}:${a.verse}`,j.TreeItemCollapsibleState.None,a);return t.description=a.note?`\u{1F4DD} ${a.note}`:`"${a.text.slice(0,30)}..."`,t.tooltip=new j.MarkdownString(`**${a.bookName} ${a.chapter}:${a.verse}** (${a.translation.toUpperCase()})

> "${a.text}"

${a.note?"\u{1F4DD} Note: "+a.note:""}`),t.command={command:"dailyBread.openReaderAt",title:"Open Verse in Reader",arguments:[a.bookId,a.chapter,a.verse,a.translation]},t}))}},ue=class extends j.TreeItem{constructor(o,a,t){super(o,a);this.label=o;this.collapsibleState=a;this.bookmark=t;t?(this.contextValue="bookmarkItem",this.iconPath=new j.ThemeIcon("star-full",new j.ThemeColor("charts.yellow"))):(this.contextValue="emptyBookmark",this.iconPath=new j.ThemeIcon("info"))}};var J=R(require("vscode")),me=class{constructor(e){this.notesManager=e;this._onDidChangeTreeData=new J.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event;this.notesManager.onDidChangeNotes(()=>this.refresh())}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(e)return Promise.resolve([]);let o=this.notesManager.getNotes();if(o.length===0){let t=new he("No study notes yet \u2014 click + to add one",J.TreeItemCollapsibleState.None);return t.iconPath=new J.ThemeIcon("info"),t.command={command:"dailyBread.addNote",title:"Add Study Note"},Promise.resolve([t])}let a=o.map(t=>{let r=t.bookName&&t.chapter?`${t.bookName} ${t.chapter}${t.verse?":"+t.verse:""}`:"",s=new he(t.title,J.TreeItemCollapsibleState.None,t);return s.description=r||new Date(t.updatedAt).toLocaleDateString(),s.tooltip=new J.MarkdownString(`**${t.title}**${r?` *(${r})*`:""}

${t.content.slice(0,300)}${t.content.length>300?"...":""}`),s.command={command:"dailyBread.openNote",title:"Open Study Note",arguments:[t]},s});return Promise.resolve(a)}},he=class extends J.TreeItem{constructor(o,a,t){super(o,a);this.label=o;this.collapsibleState=a;this.note=t;t&&(this.contextValue="studyNoteItem",this.iconPath=new J.ThemeIcon("note"))}};var _=R(require("vscode")),ge=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new _.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){let o=this.bibleManager.getCuratedTopics();if(!e)return Promise.resolve(Object.values(o).map(a=>{let t=new fe(`${a.name} (${a.zuluName})`,_.TreeItemCollapsibleState.Collapsed,"topic",a);return t.description=`${a.verses.length} verses`,t.tooltip=a.description,t}));if(e.itemType==="topic"&&e.topic){let a=e.topic.verses.map(t=>{let r=this.bibleManager.getBook(t.bookId),s=`${(r==null?void 0:r.zuluName)||""} / ${(r==null?void 0:r.name)||""} ${t.chapter}:${t.verse}`,p=new fe(s,_.TreeItemCollapsibleState.None,"verse",e.topic,t);return p.command={command:"dailyBread.openReaderAt",title:"Read Verse in Chapter",arguments:[t.bookId,t.chapter,t.verse]},p});return Promise.resolve(a)}return Promise.resolve([])}},fe=class extends _.TreeItem{constructor(o,a,t,r,s){super(o,a);this.label=o;this.collapsibleState=a;this.itemType=t;this.topic=r;this.verse=s;this.contextValue=t,t==="topic"?this.iconPath=new _.ThemeIcon("tag"):this.iconPath=new _.ThemeIcon("quote")}};var G=R(require("vscode")),be=class{constructor(e,o){this.bibleManager=e;this.getPauseState=o;this._onDidChangeTreeData=new G.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(e)return Promise.resolve([]);let o=G.workspace.getConfiguration("dailyBread"),a=o.get("translation","kjv"),t=this.bibleManager.getTranslationInfo(a),r=t?`${t.shortName} (${t.language})`:a.toUpperCase(),s=this.getPauseState(),p=o.get("rotationSchedule","15min"),h=o.get("fontSize",0),l=G.workspace.getConfiguration("editor").get("fontSize",14),b=o.get("fontFamily","editor"),m=[new F("Next Verse","Ctrl+Alt+B","sync","dailyBread.nextVerse","Advance to next scripture in status bar"),new F("Read Current Chapter","In-Editor Reader","book","dailyBread.readChapter","Open current verse & chapter in the Bible Reader tab"),new F("Search & Jump to Verse","e.g. Joh 3:16","search","dailyBread.jumpTo","Jump directly to any book, chapter, or verse"),new F("Switch / Download Translations",r,"globe","dailyBread.switchTranslation","Search, switch, or download 60+ offline Bible translations"),new F("Add Study Note","Write & Save","edit","dailyBread.addNote","Write a personal Bible study note linked to the current verse"),new F("View Verse Cross-References","TSK","link","dailyBread.showCrossReferences","Explore connected passages for the current verse"),new F("Random Chapter","Genesis \u2013 Rev","sparkle","dailyBread.randomChapter","Open a random Bible chapter"),new F(s?"Resume Auto-Rotation":"Pause Auto-Rotation (Reading Mode)",s?"Paused":p,s?"play":"debug-pause","dailyBread.togglePauseRotation",s?"Resume automatic verse rotation":"Freeze current verse while reading"),new F("Rotation Schedule",p,"clock","dailyBread.setRotationSchedule","Change how often the status bar verse rotates"),new F("Font Size",h===0?`Auto (${l}px)`:`${h}px`,"text-size","dailyBread.changeFontSize","Adjust scripture font size or match VS Code editor"),new F("Font Family",b,"symbol-text","dailyBread.changeFontFamily","Switch between Editor font, Book Serif, Sans-Serif, or Monospace"),new F("Export Bookmarks & Backup","JSON / MD / TXT / CSV / HTML","export","dailyBread.exportBookmarks","Export bookmarks, notes, tags, and settings"),new F("Import Bookmarks & Restore Backup","JSON / MD","cloud-upload","dailyBread.importBookmarks","Restore bookmarks, notes, tags, and preferences from a file"),new F("Extension Settings","Preferences","gear","workbench.action.openSettings","Open all Daily Bible settings in VS Code",["dailyBread"])];return Promise.resolve(m)}},F=class extends G.TreeItem{constructor(o,a,t,r,s,p){super(o,G.TreeItemCollapsibleState.None);this.label=o;this.description=a,this.tooltip=s,this.iconPath=new G.ThemeIcon(t),this.command={command:r,title:o,arguments:p}}};var B,N,Y,L,K;function Ae(c){B=new se(c.extensionPath,c.globalStorageUri.fsPath),N=new ie(c),Y=new le(c),L=new de;let e=new ce(B),o=new pe(N),a=new me(Y),t=new ge(B),r=new be(B,()=>p);c.subscriptions.push(i.window.registerTreeDataProvider("dailyBreadExplorer",e),i.window.registerTreeDataProvider("dailyBreadTools",r),i.window.registerTreeDataProvider("dailyBreadBookmarks",o),i.window.registerTreeDataProvider("dailyBreadNotes",a),i.window.registerTreeDataProvider("dailyBreadTopics",t));let s=()=>{let n=i.workspace.getConfiguration("dailyBread"),d=n.get("translation","kjv"),u=n.get("dualTranslation","none"),v=B.isTranslationInstalled(d)?d:"kjv",g=u!=="none"&&B.isTranslationInstalled(u)?u:"none";return{translation:v,displayMode:n.get("displayMode","preview"),icon:n.get("icon","cross"),rotationSchedule:n.get("rotationSchedule","15min"),rotateOnFileSave:n.get("rotateOnFileSave",!1),preventRotationWhileReading:n.get("preventRotationWhileReading",!0),topic:n.get("topic","all"),dualTranslation:g,fontSize:n.get("fontSize",0),fontFamily:n.get("fontFamily","editor")}},p=!1,h=!1,l=Date.now(),b=()=>{l=Date.now(),h&&!p&&(h=!1,D(!0))},m=n=>{let d=s(),u=N.isBookmarked(n.bookId,n.chapter,n.verse);L.update(n,d.displayMode,d.icon,u,p)},w=s(),C=w.dualTranslation!=="none"?w.dualTranslation:void 0,f=B.getRandomVerse(w.topic,w.translation,C);m(f);let S=()=>{if(K&&(clearInterval(K),K=void 0),p)return;let n=s(),d=0;switch(n.rotationSchedule){case"5min":d=5*60*1e3;break;case"15min":d=15*60*1e3;break;case"30min":d=30*60*1e3;break;case"60min":d=60*60*1e3;break;default:d=0;break}d>0&&(K=setInterval(()=>{D(!1)},d))},T=()=>{!p&&K&&S()},D=(n=!1)=>{if(p||O.currentPanel&&O.currentPanel.isVisible())return;let d=s();if(!n&&d.preventRotationWhileReading&&Date.now()-l>3e3){h=!0;return}h=!1;let u=d.dualTranslation!=="none"?d.dualTranslation:void 0;f=L.getVerse()?B.getNextCuratedVerse(L.getVerse(),d.topic,d.translation,u):B.getRandomVerse(d.topic,d.translation,u),m(f)};S(),c.subscriptions.push(i.window.onDidChangeActiveTextEditor(n=>{b(),n&&s().rotationSchedule==="onEditorOpen"&&D(!0)})),c.subscriptions.push(i.window.onDidChangeTextEditorSelection(()=>{b()})),c.subscriptions.push(i.workspace.onDidChangeTextDocument(n=>{n.contentChanges&&n.contentChanges.length>0&&b()})),c.subscriptions.push(i.window.onDidChangeWindowState(n=>{n.focused&&b()})),c.subscriptions.push(i.workspace.onDidSaveTextDocument(()=>{b(),s().rotateOnFileSave&&D(!0)})),c.subscriptions.push(i.workspace.onDidChangeConfiguration(n=>{if(n.affectsConfiguration("dailyBread")||n.affectsConfiguration("editor.fontSize")||n.affectsConfiguration("editor.fontFamily")){S(),O.updateCurrent(),te.updateCurrent(),r.refresh();let d=s();if(f){let u=d.dualTranslation!=="none"?d.dualTranslation:void 0,v=B.getVerse(f.bookId,f.chapter,f.verse,d.translation,u);v&&(f=v,m(f))}}})),c.subscriptions.push(i.commands.registerCommand("dailyBread.nextVerse",()=>{h=!1,D(!0),T()})),c.subscriptions.push(i.commands.registerCommand("dailyBread.openReader",()=>{let n=L.getVerse()||f,d=s();O.createOrShow(c.extensionUri,B,N,n.bookId,n.chapter,n.verse,d.translation)})),c.subscriptions.push(i.commands.registerCommand("dailyBread.readChapter",()=>{let n=L.getVerse()||f,d=s();O.createOrShow(c.extensionUri,B,N,n.bookId,n.chapter,n.verse,d.translation)})),c.subscriptions.push(i.commands.registerCommand("dailyBread.openReaderAt",(n,d,u,v)=>{let g=s();O.createOrShow(c.extensionUri,B,N,n,d,u,v||g.translation)})),c.subscriptions.push(i.commands.registerCommand("dailyBread.bookmarkCurrent",async()=>{let n=L.getVerse()||f;if(!n)return;let d=await i.window.showInputBox({prompt:"Add an optional personal note/thought for this verse (leave empty to skip):",placeHolder:"e.g. Remember this for tough days at work"}),u=await i.window.showInputBox({prompt:"Add tags separated by comma (optional):",placeHolder:"e.g. encouragement, coding, hope"}),v=u?u.split(",").map(g=>g.trim()).filter(g=>g.length>0):void 0;await N.addBookmark(n,d,v),m(n),i.window.showInformationMessage(`\u2B50 Bookmarked: ${n.translation==="zulu"?n.zuluBookName:n.bookName} ${n.chapter}:${n.verse}`)})),c.subscriptions.push(i.commands.registerCommand("dailyBread.removeCurrentBookmark",async()=>{let n=L.getVerse()||f;if(!n)return;let d=`${n.bookId}:${n.chapter}:${n.verse}:${n.translation}`;await N.removeBookmark(d),m(n),i.window.showInformationMessage("Bookmark removed.")})),c.subscriptions.push(i.commands.registerCommand("dailyBread.showBookmarks",async()=>{let n=N.getBookmarks();if(n.length===0){i.window.showInformationMessage("You have no saved bookmarks yet.");return}let d=n.map(v=>({label:`\u2B50 ${v.bookName} ${v.chapter}:${v.verse} (${v.translation.toUpperCase()})`,description:v.note?`\u{1F4DD} ${v.note}`:`"${v.text.slice(0,45)}..."`,detail:v.tags&&v.tags.length>0?`Tags: ${v.tags.map(g=>"#"+g).join(" ")}`:void 0,bookmark:v})),u=await i.window.showQuickPick(d,{placeHolder:"Select a saved bookmark to open in reader"});u&&O.createOrShow(c.extensionUri,B,N,u.bookmark.bookId,u.bookmark.chapter,u.bookmark.verse,u.bookmark.translation)})),c.subscriptions.push(i.commands.registerCommand("dailyBread.selectTopic",async()=>{let n=B.getCuratedTopics(),d=s(),u=[{label:"$(sparkle) All Scripture / Any Topic",description:"Cycle across all curated themes",topicId:"all"},...Object.values(n).map(g=>({label:`$(tag) ${g.name} (${g.zuluName})`,description:`${g.verses.length} verses \u2014 ${g.description}`,topicId:g.id}))],v=await i.window.showQuickPick(u,{placeHolder:"Select Scripture Topic / Mood for Status Bar Rotation"});v&&(await i.workspace.getConfiguration("dailyBread").update("topic",v.topicId,i.ConfigurationTarget.Global),D(!0),i.window.showInformationMessage(`Daily Bible topic set to: ${v.label}`))})),c.subscriptions.push(i.commands.registerCommand("dailyBread.switchTranslation",n=>{let d=n==="parallel"?"parallel":"primary";te.createOrShow(B,{onTranslationActivated:()=>{let u=s(),v=u.dualTranslation!=="none"?u.dualTranslation:void 0,g=L.getVerse()||f,y=B.getVerse(g.bookId,g.chapter,g.verse,u.translation,v);y&&(f=y,m(f)),O.updateCurrent()}},d)})),c.subscriptions.push(i.commands.registerCommand("dailyBread.jumpTo",async()=>{let n=await i.window.showInputBox({prompt:"Enter book & chapter/verse in English or isiZulu",placeHolder:"e.g. Joh 3:16, AmaHubo 23:1, Phil 4:13, Mathewu 6:33, Gen 1:1"});if(!n)return;let d=B.parseReference(n);if(!d){i.window.showErrorMessage(`Could not find reference: "${n}". Try format like "Joh 3:16" or "Hubo 23:1".`);return}let u=s(),v=d.verse||1,g=B.getVerse(d.book.id,d.chapter,v,u.translation);g&&(f=g,m(f),T()),O.createOrShow(c.extensionUri,B,N,d.book.id,d.chapter,d.verse,u.translation)})),c.subscriptions.push(i.commands.registerCommand("dailyBread.jumpToRef",n=>{if(!n)return;let d=B.parseReference(n);if(!d){i.window.showWarningMessage(`Could not resolve cross-reference: ${n}`);return}let u=s(),v=d.verse||1,g=B.getVerse(d.book.id,d.chapter,v,u.translation);g&&(f=g,m(f),T()),O.createOrShow(c.extensionUri,B,N,d.book.id,d.chapter,d.verse,u.translation)})),c.subscriptions.push(i.commands.registerCommand("dailyBread.showCrossReferences",async()=>{let n=L.getVerse()||f;if(!n)return;let d=s(),u=B.resolveCrossReferences(n.bookId,n.chapter,n.verse,d.translation,20);if(u.length===0){i.window.showInformationMessage(`No cross references indexed for ${n.bookName} ${n.chapter}:${n.verse}`);return}let v=u.map(y=>{let k=d.translation==="zulu"?y.zuluBookName:y.bookName,V=y.endVerse?`-${y.endVerse}`:"";return{label:`\u{1F517} ${k} ${y.chapter}:${y.verse}${V}`,description:y.anchor?`Phrase: "${y.anchor}"`:void 0,detail:`"${y.text}"`,refString:y.ref}}),g=await i.window.showQuickPick(v,{placeHolder:`Cross References with Scriptures for ${n.bookName} ${n.chapter}:${n.verse} (${v.length} passages)`});g&&i.commands.executeCommand("dailyBread.jumpToRef",g.refString)})),c.subscriptions.push(i.commands.registerCommand("dailyBread.randomChapter",()=>{let n=B.getBooks(),d=n[Math.floor(Math.random()*n.length)],u=Math.floor(Math.random()*d.chapters)+1,v=s();O.createOrShow(c.extensionUri,B,N,d.id,u,1,v.translation)})),c.subscriptions.push(i.commands.registerCommand("dailyBread.copyVerse",async()=>{let n=L.getVerse()||f;if(!n)return;let d=n.translation==="zulu"?n.zuluBookName:n.bookName,u=`"${n.text}" \u2014 ${d} ${n.chapter}:${n.verse} (${n.translation.toUpperCase()})`;await i.env.clipboard.writeText(u),i.window.showInformationMessage(`Copied: ${d} ${n.chapter}:${n.verse}`)})),c.subscriptions.push(i.commands.registerCommand("dailyBread.exportBookmarks",async()=>{let n=await i.window.showQuickPick([{label:"$(archive) Full Backup (.json)",description:"\u2705 Re-importable \u2014 Bookmarks, notes, tags, settings & offline translations",detail:"Best for moving to another computer or restoring everything later",format:"backup",reimportable:!0},{label:"$(json) Bookmarks Only (.json)",description:"\u2705 Re-importable \u2014 Saved bookmarks, notes & tags",detail:"Portable JSON list of your saved verses",format:"json",reimportable:!0},{label:"$(markdown) Markdown Study Document (.md)",description:"\u2705 Re-importable \u2014 Formatted study doc (Obsidian / VS Code / Notion)",detail:"Readable Markdown with verses, notes & tags that can also be imported back",format:"md",reimportable:!0},{label:"$(file-text) Plain Text (.txt)",description:"\u26A0\uFE0F Export-only (cannot be imported back)",detail:"Clean plain text for printing, emails, or Word/Notepad",format:"txt",reimportable:!1},{label:"$(table) CSV Spreadsheet (.csv)",description:"\u26A0\uFE0F Export-only (cannot be imported back)",detail:"Spreadsheet table for Excel, Google Sheets, or LibreOffice Calc",format:"csv",reimportable:!1},{label:"$(globe) Styled HTML Study Sheet (.html)",description:"\u26A0\uFE0F Export-only (cannot be imported back)",detail:"Formatted webpage ready to open in a browser or print to PDF",format:"html",reimportable:!1}],{placeHolder:"Choose export format (JSON & Markdown can be imported back; TXT/CSV/HTML are export-only)"});if(!n)return;let d=new Date().toISOString().slice(0,10),u="",v="",g={};if(n.format==="backup"){let V=B.getInstalledTranslations().map(z=>z.id);u=N.exportFullBackup(s(),V,Y.getNotes()),v=`daily-bible-backup-${d}.json`,g={"Daily Bible Backup (JSON)":["json"]}}else n.format==="md"?(u=N.exportBookmarksMarkdown(),v=`daily-bible-bookmarks-${d}.md`,g={"Markdown Document":["md"]}):n.format==="txt"?(u=N.exportBookmarksText(),v=`daily-bible-bookmarks-${d}.txt`,g={"Plain Text":["txt"]}):n.format==="csv"?(u=N.exportBookmarksCsv(),v=`daily-bible-bookmarks-${d}.csv`,g={"CSV Spreadsheet":["csv"]}):n.format==="html"?(u=N.exportBookmarksHtml(),v=`daily-bible-bookmarks-${d}.html`,g={"HTML Document":["html"]}):(u=N.exportBookmarksJson(),v=`daily-bible-bookmarks-${d}.json`,g={"JSON File":["json"]});let y=i.workspace.workspaceFolders&&i.workspace.workspaceFolders.length>0?i.workspace.workspaceFolders[0].uri.fsPath:xe.homedir(),k=await i.window.showSaveDialog({defaultUri:i.Uri.file(re.join(y,v)),filters:g,saveLabel:"Export"});if(k){await i.workspace.fs.writeFile(k,Buffer.from(u,"utf8"));let V=n.reimportable?"":" (Export-only format \u2014 cannot be imported back. Use .json or .md for backups.)";if(await i.window.showInformationMessage(`\u2705 Exported to ${re.basename(k.fsPath)}${V}`,"Open File")==="Open File"){let P=await i.workspace.openTextDocument(k);await i.window.showTextDocument(P)}}})),c.subscriptions.push(i.commands.registerCommand("dailyBread.importBookmarks",async()=>{let n=i.workspace.workspaceFolders&&i.workspace.workspaceFolders.length>0?i.workspace.workspaceFolders[0].uri.fsPath:xe.homedir(),d=await i.window.showOpenDialog({defaultUri:i.Uri.file(n),canSelectMany:!1,openLabel:"Import / Restore",filters:{"Daily Bible Backups & Exports":["json","md"]}});if(!d||d.length===0)return;let u=d[0],v=await i.workspace.fs.readFile(u),g=Buffer.from(v).toString("utf8");if(re.extname(u.fsPath).toLowerCase()===".md"){let A=await N.importBookmarksMarkdown(g,E=>B.findBook(E));f&&m(f),i.window.showInformationMessage(A>0?`\u2705 Imported ${A} bookmark(s) from Markdown.`:"No new bookmarks found in Markdown file (duplicates skipped).");return}let k=await N.importBackup(g),V=!1;if(k.settings&&Object.keys(k.settings).length>0){let A=await i.window.showQuickPick([{label:"$(check) Restore Settings & Preferences Too",description:"Apply saved translation, font size, rotation schedule, and display mode",restore:!0},{label:"$(bookmark) Import Bookmarks Only",description:"Keep my current settings untouched",restore:!1}],{placeHolder:`Backup contains ${k.bookmarksImported} new bookmark(s) and extension settings`});if(A!=null&&A.restore){let E=i.workspace.getConfiguration("dailyBread"),q=["translation","dualTranslation","displayMode","icon","rotationSchedule","rotateOnFileSave","preventRotationWhileReading","topic","fontSize","fontFamily"];for(let W of q)k.settings[W]!==void 0&&await E.update(W,k.settings[W],i.ConfigurationTarget.Global);V=!0}}if(k.installedTranslations&&k.installedTranslations.length>0){let A=k.installedTranslations.filter(E=>B.getTranslationInfo(E)&&!B.isTranslationInstalled(E));A.length>0&&await i.window.showInformationMessage(`This backup used ${A.length} additional offline translation(s): ${A.join(", ")}. Download them now?`,"Download Missing Translations","Skip")==="Download Missing Translations"&&await i.window.withProgress({location:i.ProgressLocation.Notification,title:"Restoring offline Bible translations from backup...",cancellable:!1},async q=>{for(let W of A){q.report({message:W});try{await B.downloadTranslation(W)}catch{}}})}let z=0;k.notes&&k.notes.length>0&&(z=await Y.importNotes(k.notes)),f&&m(f),O.updateCurrent(),te.updateCurrent();let P=z>0?`, ${z} study note(s)`:"";i.window.showInformationMessage(`\u2705 Import complete: ${k.bookmarksImported} new bookmark(s)${P} added${V?" and preferences restored":""}.`)})),c.subscriptions.push(i.commands.registerCommand("dailyBread.deleteBookmarkItem",async n=>{n&&n.bookmark&&(await N.removeBookmark(n.bookmark.id),i.window.showInformationMessage("Bookmark removed."))})),c.subscriptions.push(i.commands.registerCommand("dailyBread.addNote",n=>{let d=n||L.getVerse()||f,u=d?Y.getNotesForVerse(d.bookId,d.chapter,d.verse)[0]:void 0;ee.createOrShow(Y,{note:u,verseData:d})})),c.subscriptions.push(i.commands.registerCommand("dailyBread.newNote",()=>{ee.createOrShow(Y,{})})),c.subscriptions.push(i.commands.registerCommand("dailyBread.openNote",n=>{n&&ee.createOrShow(Y,{note:n})})),c.subscriptions.push(i.commands.registerCommand("dailyBread.deleteNoteItem",async n=>{n&&n.note&&(await Y.deleteNote(n.note.id),i.window.showInformationMessage("Study note deleted."))})),c.subscriptions.push(i.commands.registerCommand("dailyBread.menu",async()=>{let n=L.getVerse()||f,d=N.isBookmarked(n.bookId,n.chapter,n.verse),u=n.translation==="zulu"?n.zuluBookName:n.bookName,v=[{label:"Scripture & Reading",kind:i.QuickPickItemKind.Separator},{label:"$(sync) Next Verse",description:"Ctrl+Alt+B / Cmd+Alt+B",detail:"Fetch next uplifting scripture into status bar"},{label:"$(book) Read Full Chapter in Editor",description:`${u} Chapter ${n.chapter}`,detail:"Open clean in-editor Bible tab with side-by-side translation option"},{label:"$(search) Search & Jump to Verse",description:"Type any reference (e.g. Joh 3:16, Hubo 23:1)",detail:"Instantly jump to any chapter and verse in the Bible"},{label:"$(globe) Switch / Download Translations",description:`Current: ${s().translation.toUpperCase()}`,detail:"Search, switch, or download 60+ offline Bible translations & languages"},{label:d?"$(star-full) Remove Bookmark":"$(star-empty) Bookmark Current Verse",description:`${u} ${n.chapter}:${n.verse}`,detail:d?"Remove from saved favorites":"Save verse with optional notes and tags"},{label:"$(edit) Add / Edit Study Note",description:`${u} ${n.chapter}:${n.verse} (${Y.getNotes().length} saved notes)`,detail:"Open in-editor note writer for reflections, sermon outlines, or study notes"},{label:"$(link) View Verse Cross-References",description:"Treasury of Scripture Knowledge",detail:"Explore connected passages and related scriptures for this verse"},{label:"Browse & Share",kind:i.QuickPickItemKind.Separator},{label:"$(bookmark) View All Bookmarks",description:`${N.getBookmarks().length} saved verses`,detail:"Browse, filter, and jump to your saved favorites"},{label:"$(tag) Select Topic / Mood",description:`Current: ${s().topic}`,detail:"Filter status bar by Peace, Focus, Strength, Joy, Gratitude, or Comfort"},{label:"$(dice) Random Chapter",description:"Explore scripture unpredictably",detail:"Pick a random chapter from Genesis to Revelation"},{label:"$(clippy) Copy Verse to Clipboard",description:`${u} ${n.chapter}:${n.verse}`,detail:"Copy reference and scripture text formatted for sharing"},{label:"Reading Mode & Display",kind:i.QuickPickItemKind.Separator},{label:p?"$(play) Resume Auto-Rotation":"$(debug-pause) Pause Auto-Rotation (Reading Mode)",description:p?"Auto-rotation currently paused":`Schedule: ${s().rotationSchedule}`,detail:p?"Resume automatic scripture cycling":"Freeze verse so it never changes while you are reading"},{label:"$(clock) Change Rotation Schedule",description:`Current: ${s().rotationSchedule}`,detail:"Adjust how often verses change (5min, 15min, 30min, 60min, onEditorOpen, or Manual)"},{label:"$(text-size) Change Font Size",description:s().fontSize===0?`Auto / Match Editor (${i.workspace.getConfiguration("editor").get("fontSize",14)}px)`:`${s().fontSize}px`,detail:"Adjust scripture text size or sync automatically with VS Code editor font"},{label:"$(symbol-text) Change Font Family",description:`Current: ${s().fontFamily}`,detail:"Switch between Editor font, Book Serif, Clean Sans-Serif, or Monospace"},{label:"Backup & Settings",kind:i.QuickPickItemKind.Separator},{label:"$(export) Export Bookmarks & Backup",description:"JSON, Markdown, TXT, CSV, or HTML",detail:"Save your bookmarks, notes, tags, and settings to a file"},{label:"$(cloud-upload) Import Bookmarks & Restore Backup",description:"Restore from .json backup or .md export",detail:"Load saved bookmarks, notes, tags, and preferences from a file"},{label:"$(gear) Configure Extension Settings",description:"Icons, Display modes, Rotation intervals",detail:"Open Daily Bible settings in VS Code Preferences"}],g=await i.window.showQuickPick(v,{placeHolder:`\u{1F4D6} Daily Bible \u2014 ${u} ${n.chapter}:${n.verse}`});g&&(g.label.includes("Next Verse")?D(!0):g.label.includes("Auto-Rotation")?i.commands.executeCommand("dailyBread.togglePauseRotation"):g.label.includes("Change Rotation Schedule")?i.commands.executeCommand("dailyBread.setRotationSchedule"):g.label.includes("Read Full Chapter")?i.commands.executeCommand("dailyBread.readChapter"):g.label.includes("View Verse Cross-References")?i.commands.executeCommand("dailyBread.showCrossReferences"):g.label.includes("Bookmark Current Verse")?i.commands.executeCommand("dailyBread.bookmarkCurrent"):g.label.includes("Remove Bookmark")?i.commands.executeCommand("dailyBread.removeCurrentBookmark"):g.label.includes("Add / Edit Study Note")?i.commands.executeCommand("dailyBread.addNote"):g.label.includes("View All Bookmarks")?i.commands.executeCommand("dailyBread.showBookmarks"):g.label.includes("Select Topic")?i.commands.executeCommand("dailyBread.selectTopic"):g.label.includes("Change Font Size")?i.commands.executeCommand("dailyBread.changeFontSize"):g.label.includes("Change Font Family")?i.commands.executeCommand("dailyBread.changeFontFamily"):g.label.includes("Switch / Download Translations")?i.commands.executeCommand("dailyBread.switchTranslation"):g.label.includes("Search & Jump")?i.commands.executeCommand("dailyBread.jumpTo"):g.label.includes("Random Chapter")?i.commands.executeCommand("dailyBread.randomChapter"):g.label.includes("Copy Verse")?i.commands.executeCommand("dailyBread.copyVerse"):g.label.includes("Export Bookmarks")?i.commands.executeCommand("dailyBread.exportBookmarks"):g.label.includes("Import Bookmarks")?i.commands.executeCommand("dailyBread.importBookmarks"):g.label.includes("Configure Extension Settings")&&i.commands.executeCommand("workbench.action.openSettings","dailyBread"))})),c.subscriptions.push(i.commands.registerCommand("dailyBread.changeFontSize",async()=>{let n=i.workspace.getConfiguration("editor").get("fontSize",14),d=i.workspace.getConfiguration("dailyBread").get("fontSize",0),u=[{label:`$(sync) Auto \u2014 Match Editor Font (${n}px)`,description:d===0?"Currently Active":"Automatically syncs with editor.fontSize",size:0},{label:"$(text-size) Small (12px)",description:d===12?"Active":"",size:12},{label:"$(text-size) Compact (14px)",description:d===14?"Active":"",size:14},{label:"$(text-size) Medium (16px)",description:d===16?"Active":"",size:16},{label:"$(text-size) Large (18px)",description:d===18?"Active":"",size:18},{label:"$(text-size) Extra Large (22px)",description:d===22?"Active":"",size:22},{label:"$(text-size) Huge (26px)",description:d===26?"Active":"",size:26},{label:"$(edit) Custom Size...",description:"Type an exact pixel size",size:-1}],v=await i.window.showQuickPick(u,{placeHolder:`Select scripture font size (Current: ${d===0?`Auto / Match Editor (${n}px)`:`${d}px`})`});if(v)if(v.size===-1){let g=await i.window.showInputBox({prompt:"Enter scripture font size in pixels (10 - 48, or 0 for Auto / Match Editor)",value:d===0?n.toString():d.toString(),validateInput:y=>{let k=parseInt(y,10);return isNaN(k)||k<0||k>48?"Please enter a number between 10 and 48 (or 0 for Auto)":null}});if(g!==void 0){let y=parseInt(g,10);await i.workspace.getConfiguration("dailyBread").update("fontSize",y,i.ConfigurationTarget.Global),i.window.showInformationMessage(`Daily Bible font size set to ${y===0?`Auto / Match Editor (${n}px)`:`${y}px`}`)}}else await i.workspace.getConfiguration("dailyBread").update("fontSize",v.size,i.ConfigurationTarget.Global),i.window.showInformationMessage(`Daily Bible font size set to ${v.size===0?`Auto / Match Editor (${n}px)`:`${v.size}px`}`)})),c.subscriptions.push(i.commands.registerCommand("dailyBread.changeFontFamily",async()=>{let n=i.workspace.getConfiguration("editor").get("fontFamily","monospace"),d=i.workspace.getConfiguration("dailyBread").get("fontFamily","editor"),u=[{label:"$(editor) Match Editor Font",description:d==="editor"?"Currently Active":n,detail:"Syncs automatically with your active VS Code code editor font",family:"editor"},{label:"$(book) Book Serif",description:d==="serif"?"Currently Active":"Georgia, Garamond, Times New Roman, serif",detail:"Classic, warm editorial book typesetting",family:"serif"},{label:"$(symbol-text) Clean Sans-Serif",description:d==="sans-serif"?"Currently Active":"Segoe UI, -apple-system, Roboto, sans-serif",detail:"Modern crisp user interface typography",family:"sans-serif"},{label:"$(terminal) Monospace Code Font",description:d==="monospace"?"Currently Active":"Consolas, Courier New, monospace",detail:"Fixed-width developer aesthetic",family:"monospace"},{label:"$(device-desktop) System Default",description:d==="system"?"Currently Active":"Operating system native font",detail:"Native OS font rendering",family:"system"}],v=await i.window.showQuickPick(u,{placeHolder:`Select Bible reader font family (Current: ${d})`});v&&(await i.workspace.getConfiguration("dailyBread").update("fontFamily",v.family,i.ConfigurationTarget.Global),i.window.showInformationMessage(`Daily Bible font family set to: ${v.label.replace(/\$\([^)]+\)\s*/,"")}`))})),c.subscriptions.push(i.commands.registerCommand("dailyBread.togglePauseRotation",()=>{p=!p,p?(K&&(clearInterval(K),K=void 0),i.window.showInformationMessage("\u23F8 Daily Bible: Auto-rotation paused (Reading Mode active). Verses will not change while you read.")):(S(),i.window.showInformationMessage("\u25B6 Daily Bible: Auto-rotation resumed.")),f&&m(f),r.refresh()})),c.subscriptions.push(i.commands.registerCommand("dailyBread.setRotationSchedule",async()=>{let n=s().rotationSchedule,d=[{label:"$(clock) Every 15 minutes",description:n==="15min"?"Currently Active":"",detail:"Recommended: Balanced rotation frequency",value:"15min"},{label:"$(clock) Every 30 minutes",description:n==="30min"?"Currently Active":"",detail:"Spacious interval for longer reading",value:"30min"},{label:"$(clock) Every 60 minutes",description:n==="60min"?"Currently Active":"",detail:"One verse per hour",value:"60min"},{label:"$(clock) Every 5 minutes",description:n==="5min"?"Currently Active":"",detail:"Frequent rotation",value:"5min"},{label:"$(edit) On Editor Open",description:n==="onEditorOpen"?"Currently Active":"",detail:"Rotate whenever you switch or open an editor file",value:"onEditorOpen"},{label:"$(debug-pause) Manual Only (Never change automatically)",description:n==="manual"?"Currently Active":"",detail:"Verses only change when you press Ctrl+Alt+B / Cmd+Alt+B or click Next",value:"manual"}],u=await i.window.showQuickPick(d,{placeHolder:`Select how often the status bar scripture rotates (Current: ${n})`});u&&(await i.workspace.getConfiguration("dailyBread").update("rotationSchedule",u.value,i.ConfigurationTarget.Global),i.window.showInformationMessage(`Daily Bible rotation schedule set to: ${u.label.replace(/\$\([^)]+\)\s*/,"")}`))})),c.subscriptions.push(L)}function Ee(){K&&(clearInterval(K),K=void 0)}0&&(module.exports={activate,deactivate});
