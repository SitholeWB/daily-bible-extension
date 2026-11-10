"use strict";var ue=Object.create;var H=Object.defineProperty;var me=Object.getOwnPropertyDescriptor;var he=Object.getOwnPropertyNames;var ge=Object.getPrototypeOf,fe=Object.prototype.hasOwnProperty;var be=(d,e)=>{for(var o in e)H(d,o,{get:e[o],enumerable:!0})},le=(d,e,o,a)=>{if(e&&typeof e=="object"||typeof e=="function")for(let t of he(e))!fe.call(d,t)&&t!==o&&H(d,t,{get:()=>e[t],enumerable:!(a=me(e,t))||a.enumerable});return d};var V=(d,e,o)=>(o=d!=null?ue(ge(d)):{},le(e||!d||!d.__esModule?H(o,"default",{value:d,enumerable:!0}):o,d)),ve=d=>le(H({},"__esModule",{value:!0}),d);var $e={};be($e,{activate:()=>we,deactivate:()=>xe});module.exports=ve($e);var c=V(require("vscode"));var y=V(require("fs")),B=V(require("path"));var ke=V(require("https")),ye=V(require("http")),ce=V(require("zlib"));function oe(d,e=5){return new Promise((o,a)=>{let r=(d.startsWith("https://")?ke:ye).get(d,{headers:{"User-Agent":"daily-bread-statusbar-vscode"},timeout:3e4},s=>{let p=s.statusCode||0;if(p>=300&&p<400&&s.headers.location){if(s.resume(),e<=0){a(new Error("Too many HTTP redirects while downloading translation pack."));return}let l=new URL(s.headers.location,d).toString();oe(l,e-1).then(o,a);return}if(p!==200){s.resume(),a(new Error(`Download failed with HTTP ${p} from ${d}`));return}let f=[];s.on("data",l=>f.push(Buffer.isBuffer(l)?l:Buffer.from(l))),s.on("end",()=>o(Buffer.concat(f))),s.on("error",l=>a(l))});r.on("timeout",()=>{r.destroy(new Error("Download timed out after 30 seconds."))}),r.on("error",s=>a(s))})}function re(d){let e=ce.gunzipSync(d),o=JSON.parse(e.toString("utf8"));if(!o||typeof o!="object"||!Array.isArray(o[1])||!Array.isArray(o[66]))throw new Error("Invalid Bible translation pack format (missing expected canonical books).");return o}var G=class{constructor(e,o){this.books=[];this.booksById=new Map;this.aliasMap=new Map;this.topics={};this.catalog=[];this.catalogById=new Map;this.cache=new Map;this.crossRefCache=new Map;this.curatedVerseList=[];this.extensionPath=e,this.globalStoragePath=o;let a=[B.join(e,"data"),B.join(e,"..","data"),B.resolve(__dirname,"..","data"),B.resolve(__dirname,"data"),B.resolve(process.cwd(),"data")],t=a[0];for(let r of a)if(y.existsSync(B.join(r,"books.json"))){t=r;break}this.dataDir=t,this.loadMetadata()}loadMetadata(){let e=B.join(this.dataDir,"books.json");if(y.existsSync(e)){this.books=JSON.parse(y.readFileSync(e,"utf8"));for(let t of this.books)this.booksById.set(t.id,t),this.indexBookAliases(t)}let o=B.join(this.dataDir,"translations_catalog.json");y.existsSync(o)?this.catalog=JSON.parse(y.readFileSync(o,"utf8")):this.catalog=[{id:"kjv",languageCode:"en",language:"English",name:"King James Version (KJV)",shortName:"KJV",direction:"ltr",copyright:"Public Domain (1769 Oxford Standard)",bundled:!0,sizeKB:4200,region:"Default Offline"},{id:"zulu",languageCode:"zu",language:"isiZulu",name:"IBhayibheli Elingcwele (1959)",shortName:"ZULU",direction:"ltr",copyright:"Public Domain (1959 Edition)",bundled:!0,sizeKB:3800,region:"Default Offline"}];for(let t of this.catalog)this.catalogById.set(t.id,t);let a=B.join(this.dataDir,"curated_topics.json");if(y.existsSync(a)){this.topics=JSON.parse(y.readFileSync(a,"utf8"));let t=new Set;for(let r of Object.values(this.topics))for(let s of r.verses){let p=`${s.bookId}:${s.chapter}:${s.verse}`;t.has(p)||(t.add(p),this.curatedVerseList.push(s))}}}normalizeText(e){return e.toLowerCase().replace(/[\u2018\u2019\u201C\u201D'"`\-_—–:.,;!]/g,"").replace(/\s+/g," ").trim()}indexBookAliases(e){let o=t=>{let r=this.normalizeText(t);r&&this.aliasMap.set(r,e)};o(e.name),o(e.zuluName),o(e.code);for(let t of e.aliases)o(t);let a=["u-","u","ku","kuma","kwabase","eka","aba","ama","izi","isi","um"];for(let t of a){let r=e.zuluName.toLowerCase();r.startsWith(t)&&r.length>t.length+2&&o(r.slice(t.length))}}getBooks(){return this.books}getBook(e){return this.booksById.get(e)}getCuratedTopics(){return this.topics}getCatalog(){return this.catalog}getTranslationInfo(e){return this.catalogById.get(e)}getDownloadedPackPath(e){if(this.globalStoragePath)return B.join(this.globalStoragePath,"translations",`${e}.json.gz`)}getDevPackPath(e){let o=[B.join(this.extensionPath,"packs",`${e}.json.gz`),B.join(this.extensionPath,"..","packs",`${e}.json.gz`),B.resolve(__dirname,"..","packs",`${e}.json.gz`),B.resolve(process.cwd(),"packs",`${e}.json.gz`)];for(let a of o)if(y.existsSync(a))return a}isTranslationInstalled(e){if(y.existsSync(B.join(this.dataDir,"translations",e,"1.json")))return!0;let o=this.getDownloadedPackPath(e);return!!(o&&y.existsSync(o)||this.cache.has(`${e}:1`))}getInstalledTranslations(){return this.catalog.filter(e=>this.isTranslationInstalled(e.id))}async downloadTranslation(e){let o=this.catalogById.get(e);if(!o)throw new Error(`Unknown translation ID: ${e}`);if(o.bundled&&y.existsSync(B.join(this.dataDir,"translations",e,"1.json")))return;let a=this.getDownloadedPackPath(e);if(!a)throw new Error("Offline storage path is not configured.");let t,r=this.getDevPackPath(e);if(o.downloadUrl)try{t=await oe(o.downloadUrl)}catch(l){if(r)t=y.readFileSync(r);else throw l}else if(r)t=y.readFileSync(r);else throw new Error(`No download URL configured for ${o.name}`);let s=re(t),p=B.dirname(a);y.mkdirSync(p,{recursive:!0});let f=`${a}.tmp`;y.writeFileSync(f,t),y.renameSync(f,a);for(let[l,g]of Object.entries(s))this.cache.set(`${e}:${l}`,g)}deleteDownloadedTranslation(e){let o=this.catalogById.get(e);if(o!=null&&o.bundled)return!1;let a=this.getDownloadedPackPath(e);a&&y.existsSync(a)&&y.unlinkSync(a);for(let t=1;t<=66;t++)this.cache.delete(`${e}:${t}`);return!0}findBook(e){let o=this.normalizeText(e);if(!o)return;if(this.aliasMap.has(o))return this.aliasMap.get(o);let a=o.replace(/\s+/g,"");for(let[t,r]of this.aliasMap.entries())if(t.replace(/\s+/g,"")===a)return r;for(let[t,r]of this.aliasMap.entries())if(t.startsWith(o)||o.startsWith(t))return r;if(o.length>=3){for(let[t,r]of this.aliasMap.entries())if(t.includes(o)||o.includes(t))return r}}parseReference(e){let o=e.trim();if(!o)return;let a=o.match(/^([1-3]?\s*[A-Za-z\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/);if(!a){let l=o.match(/^([1-3]?\s*[\p{L}\-]+)\s*(\d+)(?:[:.\s](\d+)(?:[-–](\d+))?)?/u);if(!l)return;let g=l[1].trim(),m=parseInt(l[2],10),v=l[3]?parseInt(l[3],10):void 0,P=l[4]?parseInt(l[4],10):void 0,x=this.findBook(g);return x?{book:x,chapter:m,verse:v,endVerse:P}:void 0}let t=a[1].trim(),r=parseInt(a[2],10),s=a[3]?parseInt(a[3],10):void 0,p=a[4]?parseInt(a[4],10):void 0,f=this.findBook(t);if(f&&!(r<1||r>f.chapters))return{book:f,chapter:r,verse:s,endVerse:p}}getVerseRange(e,o,a,t,r="kjv"){let s=this.getChapter(e,o,r);if(s.length===0||a<1||a>s.length)return"";if(!t||t<=a)return s[a-1]||"";let p=Math.min(t,s.length,a+2),f=[];for(let l=a;l<=p;l++){let g=s[l-1];g&&f.push(`[${l}] ${g}`)}return t>p&&f.push("..."),f.join(" ")}resolveCrossReferences(e,o,a,t="kjv",r=8){let s=this.getCrossReferences(e,o,a),p=[],f=new Set;for(let l of s)for(let g of l.refs){if(f.has(g))continue;f.add(g);let m=this.parseReference(g);if(m&&m.verse){let v=this.getVerseRange(m.book.id,m.chapter,m.verse,m.endVerse,t);v&&p.push({ref:g,bookId:m.book.id,bookName:m.book.name,zuluBookName:m.book.zuluName,chapter:m.chapter,verse:m.verse,endVerse:m.endVerse,text:v,anchor:l.anchor})}if(p.length>=r)return p}return p}loadBookChapters(e,o){let a=`${o}:${e}`;if(this.cache.has(a))return this.cache.get(a);let t=B.join(this.dataDir,"translations",o,`${e}.json`);if(y.existsSync(t))try{let p=JSON.parse(y.readFileSync(t,"utf8"));return this.cache.set(a,p),p}catch{return[]}let r=this.getDownloadedPackPath(o),s=r&&y.existsSync(r)?r:this.getDevPackPath(o);if(s&&y.existsSync(s))try{let p=re(y.readFileSync(s));for(let[f,l]of Object.entries(p))this.cache.set(`${o}:${f}`,l);return this.cache.get(a)||[]}catch{return[]}return[]}loadBookCrossReferences(e){if(this.crossRefCache.has(e))return this.crossRefCache.get(e);let o=B.join(this.dataDir,"cross_references",`${e}.json`);if(!y.existsSync(o))return{};try{let a=JSON.parse(y.readFileSync(o,"utf8"));return this.crossRefCache.set(e,a),a}catch{return{}}}getCrossReferences(e,o,a){let t=this.loadBookCrossReferences(e);return t[o.toString()]&&t[o.toString()][a.toString()]||[]}getFlattenedCrossReferences(e,o,a){let t=this.getCrossReferences(e,o,a),r=new Set;for(let s of t)for(let p of s.refs)r.add(p);return Array.from(r)}getChapter(e,o,a){let t=this.loadBookChapters(e,a);return o<1||o>t.length?[]:t[o-1]||[]}getVerse(e,o,a,t,r){let s=this.getBook(e);if(!s)return;let p=this.getChapter(e,o,t);if(a<1||a>p.length)return;let f=p[a-1],l;if(r&&r!==t){let x=this.getChapter(e,o,r);a>=1&&a<=x.length&&(l=x[a-1])}let g=this.getCrossReferences(e,o,a),m=this.resolveCrossReferences(e,o,a,t,12),v=this.catalogById.get(t),P=r&&r!==t?this.catalogById.get(r):void 0;return{bookId:e,bookName:s.name,zuluBookName:s.zuluName,chapter:o,verse:a,text:f,translation:t,translationName:v?`${v.language} \u2014 ${v.name}`:t.toUpperCase(),direction:(v==null?void 0:v.direction)||"ltr",parallelText:l,parallelTranslation:r&&r!==t?r:void 0,parallelTranslationName:P?P.shortName:r==null?void 0:r.toUpperCase(),crossReferences:g.length>0?g:void 0,resolvedCrossReferences:m.length>0?m:void 0,chapterVerses:p}}getRandomVerse(e,o="kjv",a){let t=[];e&&e!=="all"&&this.topics[e]?t=this.topics[e].verses:t=this.curatedVerseList,t.length===0&&(t=[{bookId:43,chapter:3,verse:16}]);let r=Math.floor(Math.random()*t.length),s=t[r],p=this.getVerse(s.bookId,s.chapter,s.verse,o,a);return p||{bookId:43,bookName:"John",zuluBookName:"UJohane",chapter:3,verse:16,text:"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",translation:o}}getNextCuratedVerse(e,o,a="kjv",t){let r=[];if(o&&o!=="all"&&this.topics[o]?r=this.topics[o].verses:r=this.curatedVerseList,r.length===0)return this.getRandomVerse(o,a,t);let p=(r.findIndex(l=>l.bookId===e.bookId&&l.chapter===e.chapter&&l.verse===e.verse)+1)%r.length,f=r[p];return this.getVerse(f.bookId,f.chapter,f.verse,a,t)||this.getRandomVerse(o,a,t)}getNextSequentialVerse(e,o="kjv",a){let t=this.getBook(e.bookId);if(!t)return this.getRandomVerse(void 0,o,a);let r=this.getChapter(e.bookId,e.chapter,o);if(e.verse<r.length)return this.getVerse(e.bookId,e.chapter,e.verse+1,o,a);if(e.chapter<t.chapters)return this.getVerse(e.bookId,e.chapter+1,1,o,a);let s=e.bookId%66+1;return this.getVerse(s,1,1,o,a)}};var de=V(require("vscode")),O=class O{constructor(e){this.onDidChangeEmitter=new de.EventEmitter;this.onDidChangeBookmarks=this.onDidChangeEmitter.event;this.context=e}getBookmarks(){return[...this.context.globalState.get(O.STORAGE_KEY,[])].sort((o,a)=>a.createdAt-o.createdAt)}isBookmarked(e,o,a){return this.getBookmarks().some(r=>r.bookId===e&&r.chapter===o&&r.verse===a)}getBookmark(e){return this.getBookmarks().find(o=>o.id===e)}async addBookmark(e,o,a){let t=this.getBookmarks(),r=`${e.bookId}:${e.chapter}:${e.verse}:${e.translation}`,s=t.filter(l=>l.id!==r),p=e.translation==="zulu"?e.zuluBookName:e.bookName,f={id:r,bookId:e.bookId,chapter:e.chapter,verse:e.verse,translation:e.translation,text:e.text,bookName:p,createdAt:Date.now(),note:o,tags:a};return s.unshift(f),await this.context.globalState.update(O.STORAGE_KEY,s),this.onDidChangeEmitter.fire(),f}async removeBookmark(e){let a=this.getBookmarks().filter(t=>t.id!==e);await this.context.globalState.update(O.STORAGE_KEY,a),this.onDidChangeEmitter.fire()}async updateBookmark(e,o,a){let t=this.getBookmarks(),r=t.find(s=>s.id===e);r&&(o!==void 0&&(r.note=o),a!==void 0&&(r.tags=a),await this.context.globalState.update(O.STORAGE_KEY,t),this.onDidChangeEmitter.fire())}exportBookmarksMarkdown(){let e=this.getBookmarks();if(e.length===0)return`# Daily Bible Bookmarks

No bookmarks saved yet.`;let o=`# \u{1F4D6} Daily Bible \u2014 Saved Bookmarks & Favorites

`;o+=`*Exported on ${new Date().toLocaleDateString()}*

---

`;for(let a of e){let t=new Date(a.createdAt).toLocaleDateString();o+=`### ${a.bookName} ${a.chapter}:${a.verse} (${a.translation.toUpperCase()})
`,o+=`> "${a.text}"

`,a.note&&(o+=`\u{1F4DD} **Note:** ${a.note}

`),a.tags&&a.tags.length>0&&(o+=`\u{1F3F7}\uFE0F **Tags:** ${a.tags.map(r=>"`#"+r+"`").join(" ")}

`),o+=`*Saved on ${t}*

---

`}return o}exportBookmarksJson(){return JSON.stringify(this.getBookmarks(),null,2)}async importBookmarks(e){try{let o=JSON.parse(e);if(!Array.isArray(o))return 0;let a=this.getBookmarks(),t=new Set(a.map(s=>s.id)),r=0;for(let s of o)if(s.bookId&&s.chapter&&s.verse&&s.text){let p=s.id||`${s.bookId}:${s.chapter}:${s.verse}:${s.translation||"zulu"}`;t.has(p)||(a.push({...s,id:p,createdAt:s.createdAt||Date.now()}),t.add(p),r++)}return await this.context.globalState.update(O.STORAGE_KEY,a),this.onDidChangeEmitter.fire(),r}catch{return 0}}};O.STORAGE_KEY="dailyBread.bookmarks";var _=O;var w=V(require("vscode")),R=class d{constructor(e,o,a,t,r=43,s=3,p,f="kjv"){this.disposables=[];this.currentBookId=43;this.currentChapter=3;this.currentVerseTarget=16;this.primaryTranslation="kjv";this.parallelTranslation="zulu";this.isParallel=!1;this.panel=e,this.extensionUri=o,this.bibleManager=a,this.bookmarksManager=t,this.currentBookId=r,this.currentChapter=s,this.currentVerseTarget=p,this.primaryTranslation=f,this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.webview.onDidReceiveMessage(async l=>{switch(l.command){case"prevChapter":this.goToPreviousChapter();break;case"nextChapter":this.goToNextChapter();break;case"setChapter":this.currentChapter=l.chapter,this.currentVerseTarget=void 0,this.update();break;case"setBookAndChapter":this.currentBookId=l.bookId,this.currentChapter=l.chapter,this.currentVerseTarget=l.verse,this.update();break;case"toggleParallel":this.isParallel=!this.isParallel,this.update();break;case"setPrimaryTranslation":if(l.translation==="__more__"){w.commands.executeCommand("dailyBread.switchTranslation","primary"),this.update();break}this.primaryTranslation=l.translation,this.update();break;case"setParallelTranslation":if(l.translation==="__more__"){w.commands.executeCommand("dailyBread.switchTranslation","parallel"),this.update();break}this.parallelTranslation=l.translation,this.update();break;case"openTranslationSwitcher":w.commands.executeCommand("dailyBread.switchTranslation",l.mode||"primary");break;case"copyVerse":{let g=this.bibleManager.getVerse(l.bookId,l.chapter,l.verse,l.translation);if(g){let m=l.translation==="zulu"?g.zuluBookName:g.bookName,v=`"${g.text}" \u2014 ${m} ${l.chapter}:${l.verse} (${l.translation.toUpperCase()})`;await w.env.clipboard.writeText(v),w.window.showInformationMessage(`Copied: ${m} ${l.chapter}:${l.verse}`)}break}case"bookmarkVerse":{let g=this.bibleManager.getVerse(l.bookId,l.chapter,l.verse,l.translation);if(g){if(this.bookmarksManager.isBookmarked(l.bookId,l.chapter,l.verse)){let m=`${l.bookId}:${l.chapter}:${l.verse}:${l.translation}`;await this.bookmarksManager.removeBookmark(m),w.window.showInformationMessage("Bookmark removed.")}else await this.bookmarksManager.addBookmark(g),w.window.showInformationMessage(`\u2B50 Bookmarked: ${g.bookName} ${l.chapter}:${l.verse}`);this.update()}break}case"openBookPicker":this.showBookPicker();break;case"jumpToReference":{if(l.ref){let g=this.bibleManager.parseReference(l.ref);g?this.navigate(g.book.id,g.chapter,g.verse,this.primaryTranslation):w.window.showInformationMessage(`Could not resolve cross-reference: ${l.ref}`)}break}case"adjustFontSize":{let g=w.workspace.getConfiguration("dailyBread"),m=g.get("fontSize",0),v=w.workspace.getConfiguration("editor").get("fontSize",14),x=Math.max(10,Math.min(36,(m===0?v:m)+l.delta));await g.update("fontSize",x,w.ConfigurationTarget.Global),this.update();break}case"setFontSize":{await w.workspace.getConfiguration("dailyBread").update("fontSize",l.size,w.ConfigurationTarget.Global),this.update();break}case"promptFontSize":{await w.commands.executeCommand("dailyBread.changeFontSize");break}}},null,this.disposables)}static updateCurrent(){var e;(e=d.currentPanel)==null||e.update()}static createOrShow(e,o,a,t=43,r=3,s,p="kjv"){let f=w.window.activeTextEditor?w.window.activeTextEditor.viewColumn:void 0;if(d.currentPanel)return d.currentPanel.panel.reveal(f),d.currentPanel.navigate(t,r,s,p),d.currentPanel;let l=w.window.createWebviewPanel("dailyBreadReader","Daily Bible Reader",f||w.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0,localResourceRoots:[w.Uri.joinPath(e,"media")]});return d.currentPanel=new d(l,e,o,a,t,r,s,p),d.currentPanel}navigate(e,o,a,t){this.currentBookId=e,this.currentChapter=o,this.currentVerseTarget=a,t&&(this.primaryTranslation=t),this.update()}goToPreviousChapter(){if(this.bibleManager.getBook(this.currentBookId)){if(this.currentChapter>1)this.currentChapter--;else if(this.currentBookId>1){this.currentBookId--;let o=this.bibleManager.getBook(this.currentBookId);this.currentChapter=o?o.chapters:1}this.currentVerseTarget=void 0,this.update()}}goToNextChapter(){let e=this.bibleManager.getBook(this.currentBookId);e&&(this.currentChapter<e.chapters?this.currentChapter++:this.currentBookId<66&&(this.currentBookId++,this.currentChapter=1),this.currentVerseTarget=void 0,this.update())}async showBookPicker(){let o=this.bibleManager.getBooks().map(s=>({label:this.primaryTranslation==="zulu"?`${s.zuluName} (${s.name})`:`${s.name} (${s.zuluName})`,description:`${s.testament} \u2022 ${s.chapters} chapters`,book:s})),a=await w.window.showQuickPick(o,{placeHolder:"Select a Book to Read (e.g. USenesisi, AmaHubo, UJohane, Romans)"});if(!a)return;let t=Array.from({length:a.book.chapters},(s,p)=>({label:`Chapter ${p+1}`,chapter:p+1})),r=await w.window.showQuickPick(t,{placeHolder:`Select Chapter (1 to ${a.book.chapters})`});r&&(this.currentBookId=a.book.id,this.currentChapter=r.chapter,this.currentVerseTarget=void 0,this.update())}update(){let e=this.bibleManager.getBook(this.currentBookId);if(!e)return;let o=this.primaryTranslation==="zulu"?e.zuluName:e.name;this.panel.title=`\u{1F4D6} ${o} ${this.currentChapter}`,this.panel.webview.html=this.getHtmlContent(e)}getHtmlContent(e){this.bibleManager.isTranslationInstalled(this.primaryTranslation)||(this.primaryTranslation="kjv"),this.bibleManager.isTranslationInstalled(this.parallelTranslation)||(this.parallelTranslation="zulu");let o=this.bibleManager.getInstalledTranslations(),a=this.bibleManager.getTranslationInfo(this.primaryTranslation),t=this.bibleManager.getTranslationInfo(this.parallelTranslation),r=(a==null?void 0:a.direction)||"ltr",s=o.map(I=>`<option value="${I.id}" ${this.primaryTranslation===I.id?"selected":""}>${I.language} (${I.shortName})</option>`).join("")+'<option value="__more__">\u{1F310} Download More Translations...</option>',p=o.map(I=>`<option value="${I.id}" ${this.parallelTranslation===I.id?"selected":""}>Parallel: ${I.language} (${I.shortName})</option>`).join("")+'<option value="__more__">\u{1F310} Download More Translations...</option>',f=this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.primaryTranslation),l=this.isParallel?this.bibleManager.getChapter(this.currentBookId,this.currentChapter,this.parallelTranslation):[],g=this.primaryTranslation==="zulu"?`${e.zuluName} (${e.name})`:`${e.name} (${e.zuluName})`,m=e.chapters,v="",P=Math.max(f.length,l.length);for(let I=0;I<P;I++){let M=I+1,ne=f[I]||"",pe=l[I]||"",X=this.bookmarksManager.isBookmarked(e.id,this.currentChapter,M),se=this.currentVerseTarget===M?"target-verse":"",ie=X?"is-bookmarked":"",ee=this.bibleManager.resolveCrossReferences(e.id,this.currentChapter,M,this.primaryTranslation,8),te=ee.length>0,ae="";te&&(ae=`
          <div class="cross-ref-tray" id="cross-tray-${M}" style="display:none;">
            <div class="cross-ref-tray-title">\u{1F517} Cross References & Connected Verses (${ee.length})</div>
            <div class="cross-ref-list">
              ${ee.map(E=>`
                <div class="cross-ref-item" onclick="jumpRef('${E.ref}')" title="Click to open ${E.ref} in reader">
                  <div class="cr-header">
                    <span class="cr-citation">\u{1F517} ${E.bookName} ${E.chapter}:${E.verse}${E.endVerse?"-"+E.endVerse:""}</span>
                    ${E.anchor?`<span class="cr-anchor">on "${E.anchor}"</span>`:""}
                  </div>
                  <div class="cr-verse-text">"${E.text}"</div>
                </div>
              `).join("")}
            </div>
          </div>
        `),this.isParallel?v+=`
          <div class="verse-row ${se}" id="verse-${M}">
            <div class="verse-col primary-col ${ie}">
              <span class="verse-num">${M}</span>
              <span class="verse-text">${ne}</span>
              <div class="verse-actions">
                ${te?`<button title="Cross References" class="action-btn" onclick="toggleCrossRefs(${M})">\u{1F517}</button>`:""}
                <button title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${M}, '${this.primaryTranslation}')">${X?"\u2B50":"\u2606"}</button>
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${M}, '${this.primaryTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
            <div class="verse-col parallel-col">
              <span class="verse-num">${M}</span>
              <span class="verse-text">${pe}</span>
              <div class="verse-actions">
                <button title="Copy" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${M}, '${this.parallelTranslation}')">\u{1F4CB}</button>
              </div>
            </div>
          </div>
          ${ae}
        `:v+=`
          <div class="verse-item ${se} ${ie}" id="verse-${M}">
            <span class="verse-num">${M}</span>
            <span class="verse-text">${ne}</span>
            <span class="verse-actions">
              ${te?`<button class="action-btn" title="View Cross References" onclick="toggleCrossRefs(${M})">\u{1F517}</button>`:""}
              <button class="action-btn" title="Bookmark" onclick="bookmarkVerse(${e.id}, ${this.currentChapter}, ${M}, '${this.primaryTranslation}')">${X?"\u2B50":"\u2606"}</button>
              <button class="action-btn" title="Copy Verse" onclick="copyVerse(${e.id}, ${this.currentChapter}, ${M}, '${this.primaryTranslation}')">\u{1F4CB}</button>
            </span>
          </div>
          ${ae}
        `}let x=w.workspace.getConfiguration("dailyBread"),k=x.get("fontSize",0),n=x.get("fontFamily","editor"),i=w.workspace.getConfiguration("editor"),u=i.get("fontSize",14),b=i.get("fontFamily",""),h="var(--vscode-editor-font-family, monospace)";n==="serif"?h='Georgia, Garamond, "Times New Roman", serif':n==="sans-serif"?h='var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)':n==="monospace"?h='var(--vscode-editor-font-family, Consolas, "Courier New", monospace)':n==="system"&&(h='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');let T=k===0?`Editor (${u}px)`:`${k}px`,j=k===0?`var(--vscode-editor-font-size, ${u}px)`:`${k}px`;return`<!DOCTYPE html>
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
      --reader-font-size: ${j};
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
          <span id="font-size-label">${T}</span>
        </button>
        <button class="btn font-btn" onclick="adjustFontSize(1)" title="Increase font size (A+)">A+</button>
        <button class="btn font-btn ${k===0?"btn-active":""}" onclick="resetFontSize()" title="Match VS Code Editor Font Size">Auto</button>
      </div>
    </div>
  </div>

  <div class="content-area">
    <div class="chapter-hero">
      <h1>${g}</h1>
      <div class="subtitle">Chapter ${this.currentChapter} of ${m} \u2022 ${a?`${a.language} \u2014 ${a.name}`:this.primaryTranslation.toUpperCase()}</div>
    </div>

    ${this.isParallel?`
      <div class="parallel-headers">
        <div>${a?`${a.language} (${a.shortName})`:this.primaryTranslation.toUpperCase()}</div>
        <div>${t?`${t.language} (${t.shortName})`:this.parallelTranslation.toUpperCase()}</div>
      </div>
    `:""}

    <div class="verses-container" dir="${r}">
      ${v}
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
</html>`}isVisible(){return this.panel.visible}dispose(){for(d.currentPanel=void 0,this.panel.dispose();this.disposables.length;){let e=this.disposables.pop();e&&e.dispose()}}};var $=V(require("vscode")),J=class d{constructor(e,o,a,t){this.disposables=[];this.targetMode="primary";this.downloadingIds=new Set;this.panel=e,this.bibleManager=o,this.callbacks=a,this.targetMode=t,this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.webview.onDidReceiveMessage(async r=>{switch(r.command){case"setTargetMode":this.targetMode=r.mode==="parallel"?"parallel":"primary",this.update();break;case"activateTranslation":await this.activateTranslation(r.id,r.mode||this.targetMode);break;case"disableParallel":await $.workspace.getConfiguration("dailyBread").update("dualTranslation","none",$.ConfigurationTarget.Global),this.callbacks.onTranslationActivated(),this.update(),$.window.showInformationMessage("Parallel translation disabled.");break;case"downloadTranslation":await this.handleDownload(r.id,!!r.activateAfter,r.mode||this.targetMode);break;case"deleteTranslation":await this.handleDelete(r.id);break}},null,this.disposables)}static createOrShow(e,o,a="primary"){let t=$.window.activeTextEditor?$.window.activeTextEditor.viewColumn:void 0;if(d.currentPanel)return d.currentPanel.targetMode=a,d.currentPanel.panel.reveal(t),d.currentPanel.update(),d.currentPanel;let r=$.window.createWebviewPanel("dailyBreadTranslations","\u{1F310} Bible Translations & Offline Library",t||$.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});return d.currentPanel=new d(r,e,o,a),d.currentPanel}static updateCurrent(){var e;(e=d.currentPanel)==null||e.update()}async activateTranslation(e,o){if(!this.bibleManager.isTranslationInstalled(e)){await this.handleDownload(e,!0,o);return}let a=$.workspace.getConfiguration("dailyBread"),t=this.bibleManager.getTranslationInfo(e),r=t?`${t.language} \u2014 ${t.name}`:e.toUpperCase();o==="parallel"?(await a.update("dualTranslation",e,$.ConfigurationTarget.Global),$.window.showInformationMessage(`\u{1F4D6} Parallel translation set to: ${r}`)):(await a.update("translation",e,$.ConfigurationTarget.Global),$.window.showInformationMessage(`\u{1F310} Active Bible translation switched to: ${r}`)),this.callbacks.onTranslationActivated(),this.update()}async handleDownload(e,o,a){if(this.downloadingIds.has(e))return;let t=this.bibleManager.getTranslationInfo(e),r=t?`${t.language} \u2014 ${t.name}`:e;this.downloadingIds.add(e),this.panel.webview.postMessage({command:"downloadState",id:e,state:"downloading"});try{await $.window.withProgress({location:$.ProgressLocation.Notification,title:`Downloading ${r} for offline use...`,cancellable:!1},async()=>{await this.bibleManager.downloadTranslation(e)}),this.downloadingIds.delete(e),o?await this.activateTranslation(e,a):(this.callbacks.onTranslationActivated(),this.update(),$.window.showInformationMessage(`\u2705 Downloaded for offline use: ${r}`))}catch(s){this.downloadingIds.delete(e),this.panel.webview.postMessage({command:"downloadState",id:e,state:"error",error:(s==null?void 0:s.message)||"Download failed"}),$.window.showErrorMessage(`Failed to download ${r}: ${(s==null?void 0:s.message)||s}. Please check your internet connection and try again.`)}}async handleDelete(e){let o=$.workspace.getConfiguration("dailyBread"),a=o.get("translation","kjv"),t=o.get("dualTranslation","none");a===e&&await o.update("translation","kjv",$.ConfigurationTarget.Global),t===e&&await o.update("dualTranslation","none",$.ConfigurationTarget.Global),this.bibleManager.deleteDownloadedTranslation(e),this.callbacks.onTranslationActivated(),this.update()}update(){this.panel.webview.html=this.getHtml()}escapeHtml(e){return(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}getHtml(){let e=$.workspace.getConfiguration("dailyBread"),o=e.get("translation","kjv"),a=e.get("dualTranslation","none"),r=this.bibleManager.getCatalog().map(m=>({...m,installed:this.bibleManager.isTranslationInstalled(m.id),downloading:this.downloadingIds.has(m.id)})),s=r.filter(m=>m.installed).length,p=Array.from(new Set(r.map(m=>m.region||"Other"))),f=r.find(m=>m.id===o),l=a!=="none"?r.find(m=>m.id===a):void 0,g=JSON.stringify(r).replace(/</g,"\\u003c");return`<!DOCTYPE html>
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
            <strong>${this.escapeHtml(f?`${f.language} (${f.shortName})`:o)}</strong>
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
    const ALL_TRANSLATIONS = ${g};
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
</html>`}dispose(){for(d.currentPanel=void 0,this.panel.dispose();this.disposables.length;){let e=this.disposables.pop();e==null||e.dispose()}}};var L=V(require("vscode")),K=class{constructor(){this.statusBarItem=L.window.createStatusBarItem(L.StatusBarAlignment.Right,100),this.statusBarItem.command="dailyBread.menu"}getVerse(){return this.currentVerse}getIconSymbol(e){switch(e){case"cross":return"\u271D ";case"book":return"\u{1F4D6} ";case"dove":return"\u{1F54A}\uFE0F ";case"none":default:return""}}update(e,o,a,t=!1,r=!1){this.currentVerse=e;let s=this.getIconSymbol(a),p=t?"\u2B50 ":"",f=r?"\u23F8 ":"",g=`${e.translation==="zulu"?e.zuluBookName:e.bookName} ${e.chapter}:${e.verse}`,m="";switch(o){case"compact":m=`${p}${f}${s}${g}`;break;case"preview":{let v=e.text.length>40?e.text.slice(0,37)+"...":e.text;m=`${p}${f}${s}${g} \u2014 "${v}"`;break}case"full":m=`${p}${f}${s}${g} \u2014 "${e.text}"`;break}this.statusBarItem.text=m,this.statusBarItem.tooltip=this.createTooltip(e,t,r),this.statusBarItem.show()}createTooltip(e,o,a=!1){let t=new L.MarkdownString;t.isTrusted=!0,t.supportHtml=!0;let r=e.translation==="zulu"?e.zuluBookName:e.bookName,s=e.translationName||(e.translation==="zulu"?"isiZulu (IBhayibheli Elingcwele 1959)":e.translation==="kjv"?"King James Version (KJV)":e.translation.toUpperCase()),p=o?"\u2B50 Bookmarked (Remove)":"\u{1F516} Bookmark Verse",f=o?"\u2B50 Bookmarked *(Click to Remove)*":"\u{1F516} **Bookmark This Verse**",l=o?"\u2B50 Bookmarked":"\u{1F516} Bookmark",g=o?"command:dailyBread.removeCurrentBookmark":"command:dailyBread.bookmarkCurrent",m=o?`Remove ${r} ${e.chapter}:${e.verse} from saved bookmarks`:`Bookmark ${r} ${e.chapter}:${e.verse} with optional note & tags`,v=a?"$(play) Resume Auto-Rotation":"$(debug-pause) Pause Rotation",P=a?"Resume automatic rotating verses":"Pause auto-rotation (Reading Mode: prevents verses from changing while reading)";if(t.appendMarkdown(`| \u{1F4D6} **${r} ${e.chapter}:${e.verse}** | \u{1F310} **${s}** |
| :----------------------------------------------------------------------------- | -------------------------------------------------------------------: |

`),a&&t.appendMarkdown(`> \u23F8 **Reading Mode Active** \u2014 Auto-rotation is paused. Verses will not change automatically while you read.  
> [$(play) Click to Resume Auto-Rotation](command:dailyBread.togglePauseRotation "Resume automatic rotation") &nbsp;&bull;&nbsp; [$(sync) Advance Verse Manually](command:dailyBread.nextVerse "Advance to next verse")

`),t.appendMarkdown(`[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [${v}](command:dailyBread.togglePauseRotation "${P}") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${p}](${g} "${m}") &nbsp;&bull;&nbsp; [$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; [$(copy) Copy](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")

`),t.appendMarkdown(`---

`),t.appendMarkdown(`## \u{1F4D6} **${r} ${e.chapter}:${e.verse}** &nbsp;&nbsp;|&nbsp;&nbsp; [${f}](${g} "${m}")

`),t.appendMarkdown(`> ### **"${e.text}"** &nbsp; [${l}](${g} "${m}")
>
> [${f}](${g} "${m}") &nbsp;&bull;&nbsp; [$(copy) Copy Verse](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(book) Read Chapter in Editor](command:dailyBread.readChapter "Open full in-editor reader tab")

`),e.parallelText&&e.parallelTranslation){let x=e.parallelTranslationName||(e.parallelTranslation==="zulu"?"isiZulu (1959)":e.parallelTranslation.toUpperCase());t.appendMarkdown(`> **Parallel (${x}):** *"${e.parallelText}"*

`)}if(t.appendMarkdown(`---

`),e.chapterVerses&&e.chapterVerses.length>0){let x=e.chapterVerses.length;t.appendMarkdown(`### \u{1F4DC} Full Chapter: **${r} Chapter ${e.chapter}** (Verses 1 to ${x})

*Scroll up and down to read all verses in context:*  

`);for(let k=0;k<x;k++){let n=k+1,i=e.chapterVerses[k];n===e.verse?t.appendMarkdown(`\u{1F449} **<mark>&nbsp;[${n}] ${i}&nbsp;</mark>** *(Active Verse)* &nbsp;&mdash;&nbsp; [${l}](${g} "${m}")  

`):t.appendMarkdown(`**${n}.** ${i}  

`)}t.appendMarkdown(`---

`)}if(e.resolvedCrossReferences&&e.resolvedCrossReferences.length>0){let x=e.resolvedCrossReferences;t.appendMarkdown(`### \u{1F517} Cross-References & Scripture Connections (${x.length} Passages)

*Scriptures connected by Treasury of Scripture Knowledge (TSK):*  

`);for(let k of x){let n=e.translation==="zulu"?k.zuluBookName:k.bookName,i=k.endVerse?`-${k.endVerse}`:"",u=`${n} ${k.chapter}:${k.verse}${i}`,b=`command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([k.ref]))}`,h=k.anchor?` &nbsp;*(connecting theme: "${k.anchor}")*`:"";t.appendMarkdown(`* **[\u{1F4D6} ${u}](${b} "Jump to ${u}")**${h}  
`),t.appendMarkdown(`  > *"${k.text}"*

`)}t.appendMarkdown(`---

`)}else if(e.crossReferences&&e.crossReferences.length>0){let x=[],k=new Set;for(let n of e.crossReferences){for(let i of n.refs)if(!k.has(i)&&(k.add(i),x.push(i),x.length>=12))break;if(x.length>=12)break}if(x.length>0){let n=x.map(i=>`[\u{1F517} ${i}](command:dailyBread.jumpToRef?${encodeURIComponent(JSON.stringify([i]))} "Jump to ${i}")`).join(" &nbsp;&bull;&nbsp; ");t.appendMarkdown(`### \u{1F517} Cross-References:
${n}

---

`)}}return t.appendMarkdown(`### \u{1F9ED} Quick Navigation

[$(sync) Next Verse](command:dailyBread.nextVerse "Advance to next verse") &nbsp;&bull;&nbsp; [${v}](command:dailyBread.togglePauseRotation "${P}") &nbsp;&bull;&nbsp; [$(book) Read In Editor](command:dailyBread.readChapter "Open full in-editor reader tab") &nbsp;&bull;&nbsp; [\u{1F517} Cross Refs Directory](command:dailyBread.showCrossReferences "View full cross-reference list") &nbsp;&bull;&nbsp; [${p}](${g} "${m}") &nbsp;&bull;&nbsp; [$(text-size) Font Size](command:dailyBread.changeFontSize "Adjust scripture font size") &nbsp;&bull;&nbsp; [$(copy) Copy Verse](command:dailyBread.copyVerse "Copy verse to clipboard") &nbsp;&bull;&nbsp; [$(globe) Switch Translation](command:dailyBread.switchTranslation "Change Bible translation") &nbsp;&bull;&nbsp; [$(search) Search / Jump](command:dailyBread.jumpTo "Search any scripture")
`),t}dispose(){this.statusBarItem.dispose()}};var D=V(require("vscode")),Q=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new D.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(!e)return Promise.resolve([new U("Old Testament (Isivumelwano Esidala)","OT",D.TreeItemCollapsibleState.Expanded,"testament"),new U("New Testament (Isivumelwano Esisha)","NT",D.TreeItemCollapsibleState.Expanded,"testament")]);if(e.itemType==="testament"){let o=this.bibleManager.getBooks().filter(a=>a.testament===e.contextValue);return Promise.resolve(o.map(a=>new U(`${a.name} (${a.zuluName})`,a.id.toString(),D.TreeItemCollapsibleState.Collapsed,"book",a)))}if(e.itemType==="book"&&e.book){let o=[];for(let a=1;a<=e.book.chapters;a++){let t=new U(`Chapter ${a}`,`${e.book.id}:${a}`,D.TreeItemCollapsibleState.None,"chapter",e.book,a);t.command={command:"dailyBread.openReaderAt",title:"Read Chapter",arguments:[e.book.id,a]},o.push(t)}return Promise.resolve(o)}return Promise.resolve([])}},U=class extends D.TreeItem{constructor(o,a,t,r,s,p){super(o,t);this.label=o;this.idValue=a;this.collapsibleState=t;this.itemType=r;this.book=s;this.chapter=p;this.contextValue=r,r==="testament"?this.iconPath=new D.ThemeIcon("library"):r==="book"?(this.iconPath=new D.ThemeIcon("book"),this.description=`${s==null?void 0:s.chapters} ch`):r==="chapter"&&(this.iconPath=new D.ThemeIcon("file-text"))}};var z=V(require("vscode")),W=class{constructor(e){this.bookmarksManager=e;this._onDidChangeTreeData=new z.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event;this.bookmarksManager.onDidChangeBookmarks(()=>{this.refresh()})}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){if(e)return Promise.resolve([]);let o=this.bookmarksManager.getBookmarks();if(o.length===0){let a=new Y("No bookmarks saved yet",z.TreeItemCollapsibleState.None,void 0);return a.description="Click \u2B50 on status bar or reader",Promise.resolve([a])}return Promise.resolve(o.map(a=>{let t=new Y(`${a.bookName} ${a.chapter}:${a.verse}`,z.TreeItemCollapsibleState.None,a);return t.description=a.note?`\u{1F4DD} ${a.note}`:`"${a.text.slice(0,30)}..."`,t.tooltip=new z.MarkdownString(`**${a.bookName} ${a.chapter}:${a.verse}** (${a.translation.toUpperCase()})

> "${a.text}"

${a.note?"\u{1F4DD} Note: "+a.note:""}`),t.command={command:"dailyBread.openReaderAt",title:"Open Verse in Reader",arguments:[a.bookId,a.chapter,a.verse,a.translation]},t}))}},Y=class extends z.TreeItem{constructor(o,a,t){super(o,a);this.label=o;this.collapsibleState=a;this.bookmark=t;t?(this.contextValue="bookmarkItem",this.iconPath=new z.ThemeIcon("star-full",new z.ThemeColor("charts.yellow"))):(this.contextValue="emptyBookmark",this.iconPath=new z.ThemeIcon("info"))}};var F=V(require("vscode")),q=class{constructor(e){this.bibleManager=e;this._onDidChangeTreeData=new F.EventEmitter;this.onDidChangeTreeData=this._onDidChangeTreeData.event}refresh(){this._onDidChangeTreeData.fire()}getTreeItem(e){return e}getChildren(e){let o=this.bibleManager.getCuratedTopics();if(!e)return Promise.resolve(Object.values(o).map(a=>{let t=new Z(`${a.name} (${a.zuluName})`,F.TreeItemCollapsibleState.Collapsed,"topic",a);return t.description=`${a.verses.length} verses`,t.tooltip=a.description,t}));if(e.itemType==="topic"&&e.topic){let a=e.topic.verses.map(t=>{let r=this.bibleManager.getBook(t.bookId),s=`${(r==null?void 0:r.zuluName)||""} / ${(r==null?void 0:r.name)||""} ${t.chapter}:${t.verse}`,p=new Z(s,F.TreeItemCollapsibleState.None,"verse",e.topic,t);return p.command={command:"dailyBread.openReaderAt",title:"Read Verse in Chapter",arguments:[t.bookId,t.chapter,t.verse]},p});return Promise.resolve(a)}return Promise.resolve([])}},Z=class extends F.TreeItem{constructor(o,a,t,r,s){super(o,a);this.label=o;this.collapsibleState=a;this.itemType=t;this.topic=r;this.verse=s;this.contextValue=t,t==="topic"?this.iconPath=new F.ThemeIcon("tag"):this.iconPath=new F.ThemeIcon("quote")}};var C,S,A,N;function we(d){C=new G(d.extensionPath,d.globalStorageUri.fsPath),S=new _(d),A=new K;let e=new Q(C);c.window.registerTreeDataProvider("dailyBreadExplorer",e);let o=new W(S);c.window.registerTreeDataProvider("dailyBreadBookmarks",o);let a=new q(C);c.window.registerTreeDataProvider("dailyBreadTopics",a);let t=()=>{let n=c.workspace.getConfiguration("dailyBread"),i=n.get("translation","kjv"),u=n.get("dualTranslation","none"),b=C.isTranslationInstalled(i)?i:"kjv",h=u!=="none"&&C.isTranslationInstalled(u)?u:"none";return{translation:b,displayMode:n.get("displayMode","preview"),icon:n.get("icon","cross"),rotationSchedule:n.get("rotationSchedule","15min"),rotateOnFileSave:n.get("rotateOnFileSave",!1),preventRotationWhileReading:n.get("preventRotationWhileReading",!0),topic:n.get("topic","all"),dualTranslation:h,fontSize:n.get("fontSize",0),fontFamily:n.get("fontFamily","editor")}},r=!1,s=!1,p=Date.now(),f=()=>{p=Date.now(),s&&!r&&(s=!1,k(!0))},l=n=>{let i=t(),u=S.isBookmarked(n.bookId,n.chapter,n.verse);A.update(n,i.displayMode,i.icon,u,r)},g=t(),m=g.dualTranslation!=="none"?g.dualTranslation:void 0,v=C.getRandomVerse(g.topic,g.translation,m);l(v);let P=()=>{if(N&&(clearInterval(N),N=void 0),r)return;let n=t(),i=0;switch(n.rotationSchedule){case"5min":i=5*60*1e3;break;case"15min":i=15*60*1e3;break;case"30min":i=30*60*1e3;break;case"60min":i=60*60*1e3;break;default:i=0;break}i>0&&(N=setInterval(()=>{k(!1)},i))},x=()=>{!r&&N&&P()},k=(n=!1)=>{if(r||R.currentPanel&&R.currentPanel.isVisible())return;let i=t();if(!n&&i.preventRotationWhileReading&&Date.now()-p>3e3){s=!0;return}s=!1;let u=i.dualTranslation!=="none"?i.dualTranslation:void 0;v=A.getVerse()?C.getNextCuratedVerse(A.getVerse(),i.topic,i.translation,u):C.getRandomVerse(i.topic,i.translation,u),l(v)};P(),d.subscriptions.push(c.window.onDidChangeActiveTextEditor(n=>{f(),n&&t().rotationSchedule==="onEditorOpen"&&k(!0)})),d.subscriptions.push(c.window.onDidChangeTextEditorSelection(()=>{f()})),d.subscriptions.push(c.workspace.onDidChangeTextDocument(n=>{n.contentChanges&&n.contentChanges.length>0&&f()})),d.subscriptions.push(c.window.onDidChangeWindowState(n=>{n.focused&&f()})),d.subscriptions.push(c.workspace.onDidSaveTextDocument(()=>{f(),t().rotateOnFileSave&&k(!0)})),d.subscriptions.push(c.workspace.onDidChangeConfiguration(n=>{if(n.affectsConfiguration("dailyBread")||n.affectsConfiguration("editor.fontSize")||n.affectsConfiguration("editor.fontFamily")){P(),R.updateCurrent(),J.updateCurrent();let i=t();if(v){let u=i.dualTranslation!=="none"?i.dualTranslation:void 0,b=C.getVerse(v.bookId,v.chapter,v.verse,i.translation,u);b&&(v=b,l(v))}}})),d.subscriptions.push(c.commands.registerCommand("dailyBread.nextVerse",()=>{s=!1,k(!0),x()})),d.subscriptions.push(c.commands.registerCommand("dailyBread.openReader",()=>{let n=A.getVerse()||v,i=t();R.createOrShow(d.extensionUri,C,S,n.bookId,n.chapter,n.verse,i.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.readChapter",()=>{let n=A.getVerse()||v,i=t();R.createOrShow(d.extensionUri,C,S,n.bookId,n.chapter,n.verse,i.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.openReaderAt",(n,i,u,b)=>{let h=t();R.createOrShow(d.extensionUri,C,S,n,i,u,b||h.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.bookmarkCurrent",async()=>{let n=A.getVerse()||v;if(!n)return;let i=await c.window.showInputBox({prompt:"Add an optional personal note/thought for this verse (leave empty to skip):",placeHolder:"e.g. Remember this for tough days at work"}),u=await c.window.showInputBox({prompt:"Add tags separated by comma (optional):",placeHolder:"e.g. encouragement, coding, hope"}),b=u?u.split(",").map(h=>h.trim()).filter(h=>h.length>0):void 0;await S.addBookmark(n,i,b),l(n),c.window.showInformationMessage(`\u2B50 Bookmarked: ${n.translation==="zulu"?n.zuluBookName:n.bookName} ${n.chapter}:${n.verse}`)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.removeCurrentBookmark",async()=>{let n=A.getVerse()||v;if(!n)return;let i=`${n.bookId}:${n.chapter}:${n.verse}:${n.translation}`;await S.removeBookmark(i),l(n),c.window.showInformationMessage("Bookmark removed.")})),d.subscriptions.push(c.commands.registerCommand("dailyBread.showBookmarks",async()=>{let n=S.getBookmarks();if(n.length===0){c.window.showInformationMessage("You have no saved bookmarks yet.");return}let i=n.map(b=>({label:`\u2B50 ${b.bookName} ${b.chapter}:${b.verse} (${b.translation.toUpperCase()})`,description:b.note?`\u{1F4DD} ${b.note}`:`"${b.text.slice(0,45)}..."`,detail:b.tags&&b.tags.length>0?`Tags: ${b.tags.map(h=>"#"+h).join(" ")}`:void 0,bookmark:b})),u=await c.window.showQuickPick(i,{placeHolder:"Select a saved bookmark to open in reader"});u&&R.createOrShow(d.extensionUri,C,S,u.bookmark.bookId,u.bookmark.chapter,u.bookmark.verse,u.bookmark.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.selectTopic",async()=>{let n=C.getCuratedTopics(),i=t(),u=[{label:"$(sparkle) All Scripture / Any Topic",description:"Cycle across all curated themes",topicId:"all"},...Object.values(n).map(h=>({label:`$(tag) ${h.name} (${h.zuluName})`,description:`${h.verses.length} verses \u2014 ${h.description}`,topicId:h.id}))],b=await c.window.showQuickPick(u,{placeHolder:"Select Scripture Topic / Mood for Status Bar Rotation"});b&&(await c.workspace.getConfiguration("dailyBread").update("topic",b.topicId,c.ConfigurationTarget.Global),k(!0),c.window.showInformationMessage(`Daily Bible topic set to: ${b.label}`))})),d.subscriptions.push(c.commands.registerCommand("dailyBread.switchTranslation",n=>{let i=n==="parallel"?"parallel":"primary";J.createOrShow(C,{onTranslationActivated:()=>{let u=t(),b=u.dualTranslation!=="none"?u.dualTranslation:void 0,h=A.getVerse()||v,T=C.getVerse(h.bookId,h.chapter,h.verse,u.translation,b);T&&(v=T,l(v)),R.updateCurrent()}},i)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.jumpTo",async()=>{let n=await c.window.showInputBox({prompt:"Enter book & chapter/verse in English or isiZulu",placeHolder:"e.g. Joh 3:16, AmaHubo 23:1, Phil 4:13, Mathewu 6:33, Gen 1:1"});if(!n)return;let i=C.parseReference(n);if(!i){c.window.showErrorMessage(`Could not find reference: "${n}". Try format like "Joh 3:16" or "Hubo 23:1".`);return}let u=t(),b=i.verse||1,h=C.getVerse(i.book.id,i.chapter,b,u.translation);h&&(v=h,l(v),x()),R.createOrShow(d.extensionUri,C,S,i.book.id,i.chapter,i.verse,u.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.jumpToRef",n=>{if(!n)return;let i=C.parseReference(n);if(!i){c.window.showWarningMessage(`Could not resolve cross-reference: ${n}`);return}let u=t(),b=i.verse||1,h=C.getVerse(i.book.id,i.chapter,b,u.translation);h&&(v=h,l(v),x()),R.createOrShow(d.extensionUri,C,S,i.book.id,i.chapter,i.verse,u.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.showCrossReferences",async()=>{let n=A.getVerse()||v;if(!n)return;let i=t(),u=C.resolveCrossReferences(n.bookId,n.chapter,n.verse,i.translation,20);if(u.length===0){c.window.showInformationMessage(`No cross references indexed for ${n.bookName} ${n.chapter}:${n.verse}`);return}let b=u.map(T=>{let j=i.translation==="zulu"?T.zuluBookName:T.bookName,I=T.endVerse?`-${T.endVerse}`:"";return{label:`\u{1F517} ${j} ${T.chapter}:${T.verse}${I}`,description:T.anchor?`Phrase: "${T.anchor}"`:void 0,detail:`"${T.text}"`,refString:T.ref}}),h=await c.window.showQuickPick(b,{placeHolder:`Cross References with Scriptures for ${n.bookName} ${n.chapter}:${n.verse} (${b.length} passages)`});h&&c.commands.executeCommand("dailyBread.jumpToRef",h.refString)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.randomChapter",()=>{let n=C.getBooks(),i=n[Math.floor(Math.random()*n.length)],u=Math.floor(Math.random()*i.chapters)+1,b=t();R.createOrShow(d.extensionUri,C,S,i.id,u,1,b.translation)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.copyVerse",async()=>{let n=A.getVerse()||v;if(!n)return;let i=n.translation==="zulu"?n.zuluBookName:n.bookName,u=`"${n.text}" \u2014 ${i} ${n.chapter}:${n.verse} (${n.translation.toUpperCase()})`;await c.env.clipboard.writeText(u),c.window.showInformationMessage(`Copied: ${i} ${n.chapter}:${n.verse}`)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.exportBookmarks",async()=>{let n=await c.window.showQuickPick([{label:"Markdown Document (.md)",format:"md"},{label:"JSON Dataset (.json)",format:"json"}],{placeHolder:"Choose Export Format"});if(!n)return;let i=n.format==="md"?S.exportBookmarksMarkdown():S.exportBookmarksJson(),u=await c.workspace.openTextDocument({content:i,language:n.format==="md"?"markdown":"json"});await c.window.showTextDocument(u)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.deleteBookmarkItem",async n=>{n&&n.bookmark&&(await S.removeBookmark(n.bookmark.id),c.window.showInformationMessage("Bookmark removed."))})),d.subscriptions.push(c.commands.registerCommand("dailyBread.menu",async()=>{let n=A.getVerse()||v,i=S.isBookmarked(n.bookId,n.chapter,n.verse),u=n.translation==="zulu"?n.zuluBookName:n.bookName,b=[{label:"$(sync) Next Verse",description:"Ctrl+Alt+B / Cmd+Alt+B",detail:"Fetch next uplifting scripture into status bar"},{label:"$(book) Read Full Chapter in Editor",description:`${u} Chapter ${n.chapter}`,detail:"Open clean in-editor Bible tab with side-by-side translation option"},{label:"$(link) View Verse Cross-References",description:"Treasury of Scripture Knowledge",detail:"Explore connected passages and related scriptures for this verse"},{label:i?"$(star-full) Remove Bookmark":"$(star-empty) Bookmark Current Verse",description:`${u} ${n.chapter}:${n.verse}`,detail:i?"Remove from saved favorites":"Save verse with optional notes and tags"},{label:"$(bookmark) View All Bookmarks",description:`${S.getBookmarks().length} saved verses`,detail:"Browse, filter, and jump to your saved favorites"},{label:r?"$(play) Resume Auto-Rotation":"$(debug-pause) Pause Auto-Rotation (Reading Mode)",description:r?"Auto-rotation currently paused":`Schedule: ${t().rotationSchedule}`,detail:r?"Resume automatic scripture cycling":"Freeze verse so it never changes while you are reading"},{label:"$(clock) Change Rotation Schedule",description:`Current: ${t().rotationSchedule}`,detail:"Adjust how often verses change (5min, 15min, 30min, 60min, onEditorOpen, or Manual)"},{label:"$(tag) Select Topic / Mood",description:`Current: ${t().topic}`,detail:"Filter status bar by Peace, Focus, Strength, Joy, Gratitude, or Comfort"},{label:"$(text-size) Change Font Size",description:t().fontSize===0?`Auto / Match Editor (${c.workspace.getConfiguration("editor").get("fontSize",14)}px)`:`${t().fontSize}px`,detail:"Adjust scripture text size or sync automatically with VS Code editor font"},{label:"$(symbol-text) Change Font Family",description:`Current: ${t().fontFamily}`,detail:"Switch between Editor font, Book Serif, Clean Sans-Serif, or Monospace"},{label:"$(globe) Switch / Download Translations",description:`Current: ${t().translation.toUpperCase()}`,detail:"Search, switch, or download additional offline Bible translations & languages"},{label:"$(search) Search & Jump to Verse",description:"Type any reference (e.g. Joh 3:16, Hubo 23:1)",detail:"Instantly jump to any chapter and verse in the Bible"},{label:"$(dice) Random Chapter",description:"Explore scripture unpredictably",detail:"Pick a random chapter from Genesis to Revelation"},{label:"$(clippy) Copy Verse to Clipboard",description:`${u} ${n.chapter}:${n.verse}`,detail:"Copy reference and scripture text formatted for sharing"},{label:"$(gear) Configure Extension Settings",description:"Icons, Display modes, Rotation intervals",detail:"Open Daily Bible settings in VS Code Preferences"}],h=await c.window.showQuickPick(b,{placeHolder:`\u{1F4D6} Daily Bible \u2014 ${u} ${n.chapter}:${n.verse}`});h&&(h.label.includes("Next Verse")?k(!0):h.label.includes("Auto-Rotation")?c.commands.executeCommand("dailyBread.togglePauseRotation"):h.label.includes("Change Rotation Schedule")?c.commands.executeCommand("dailyBread.setRotationSchedule"):h.label.includes("Read Full Chapter")?c.commands.executeCommand("dailyBread.readChapter"):h.label.includes("View Verse Cross-References")?c.commands.executeCommand("dailyBread.showCrossReferences"):h.label.includes("Bookmark Current Verse")?c.commands.executeCommand("dailyBread.bookmarkCurrent"):h.label.includes("Remove Bookmark")?c.commands.executeCommand("dailyBread.removeCurrentBookmark"):h.label.includes("View All Bookmarks")?c.commands.executeCommand("dailyBread.showBookmarks"):h.label.includes("Select Topic")?c.commands.executeCommand("dailyBread.selectTopic"):h.label.includes("Change Font Size")?c.commands.executeCommand("dailyBread.changeFontSize"):h.label.includes("Change Font Family")?c.commands.executeCommand("dailyBread.changeFontFamily"):h.label.includes("Switch / Download Translations")?c.commands.executeCommand("dailyBread.switchTranslation"):h.label.includes("Search & Jump")?c.commands.executeCommand("dailyBread.jumpTo"):h.label.includes("Random Chapter")?c.commands.executeCommand("dailyBread.randomChapter"):h.label.includes("Copy Verse")?c.commands.executeCommand("dailyBread.copyVerse"):h.label.includes("Configure Extension Settings")&&c.commands.executeCommand("workbench.action.openSettings","dailyBread"))})),d.subscriptions.push(c.commands.registerCommand("dailyBread.changeFontSize",async()=>{let n=c.workspace.getConfiguration("editor").get("fontSize",14),i=c.workspace.getConfiguration("dailyBread").get("fontSize",0),u=[{label:`$(sync) Auto \u2014 Match Editor Font (${n}px)`,description:i===0?"Currently Active":"Automatically syncs with editor.fontSize",size:0},{label:"$(text-size) Small (12px)",description:i===12?"Active":"",size:12},{label:"$(text-size) Compact (14px)",description:i===14?"Active":"",size:14},{label:"$(text-size) Medium (16px)",description:i===16?"Active":"",size:16},{label:"$(text-size) Large (18px)",description:i===18?"Active":"",size:18},{label:"$(text-size) Extra Large (22px)",description:i===22?"Active":"",size:22},{label:"$(text-size) Huge (26px)",description:i===26?"Active":"",size:26},{label:"$(edit) Custom Size...",description:"Type an exact pixel size",size:-1}],b=await c.window.showQuickPick(u,{placeHolder:`Select scripture font size (Current: ${i===0?`Auto / Match Editor (${n}px)`:`${i}px`})`});if(b)if(b.size===-1){let h=await c.window.showInputBox({prompt:"Enter scripture font size in pixels (10 - 48, or 0 for Auto / Match Editor)",value:i===0?n.toString():i.toString(),validateInput:T=>{let j=parseInt(T,10);return isNaN(j)||j<0||j>48?"Please enter a number between 10 and 48 (or 0 for Auto)":null}});if(h!==void 0){let T=parseInt(h,10);await c.workspace.getConfiguration("dailyBread").update("fontSize",T,c.ConfigurationTarget.Global),c.window.showInformationMessage(`Daily Bible font size set to ${T===0?`Auto / Match Editor (${n}px)`:`${T}px`}`)}}else await c.workspace.getConfiguration("dailyBread").update("fontSize",b.size,c.ConfigurationTarget.Global),c.window.showInformationMessage(`Daily Bible font size set to ${b.size===0?`Auto / Match Editor (${n}px)`:`${b.size}px`}`)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.changeFontFamily",async()=>{let n=c.workspace.getConfiguration("editor").get("fontFamily","monospace"),i=c.workspace.getConfiguration("dailyBread").get("fontFamily","editor"),u=[{label:"$(editor) Match Editor Font",description:i==="editor"?"Currently Active":n,detail:"Syncs automatically with your active VS Code code editor font",family:"editor"},{label:"$(book) Book Serif",description:i==="serif"?"Currently Active":"Georgia, Garamond, Times New Roman, serif",detail:"Classic, warm editorial book typesetting",family:"serif"},{label:"$(symbol-text) Clean Sans-Serif",description:i==="sans-serif"?"Currently Active":"Segoe UI, -apple-system, Roboto, sans-serif",detail:"Modern crisp user interface typography",family:"sans-serif"},{label:"$(terminal) Monospace Code Font",description:i==="monospace"?"Currently Active":"Consolas, Courier New, monospace",detail:"Fixed-width developer aesthetic",family:"monospace"},{label:"$(device-desktop) System Default",description:i==="system"?"Currently Active":"Operating system native font",detail:"Native OS font rendering",family:"system"}],b=await c.window.showQuickPick(u,{placeHolder:`Select Bible reader font family (Current: ${i})`});b&&(await c.workspace.getConfiguration("dailyBread").update("fontFamily",b.family,c.ConfigurationTarget.Global),c.window.showInformationMessage(`Daily Bible font family set to: ${b.label.replace(/\$\([^)]+\)\s*/,"")}`))})),d.subscriptions.push(c.commands.registerCommand("dailyBread.togglePauseRotation",()=>{r=!r,r?(N&&(clearInterval(N),N=void 0),c.window.showInformationMessage("\u23F8 Daily Bible: Auto-rotation paused (Reading Mode active). Verses will not change while you read.")):(P(),c.window.showInformationMessage("\u25B6 Daily Bible: Auto-rotation resumed.")),v&&l(v)})),d.subscriptions.push(c.commands.registerCommand("dailyBread.setRotationSchedule",async()=>{let n=t().rotationSchedule,i=[{label:"$(clock) Every 15 minutes",description:n==="15min"?"Currently Active":"",detail:"Recommended: Balanced rotation frequency",value:"15min"},{label:"$(clock) Every 30 minutes",description:n==="30min"?"Currently Active":"",detail:"Spacious interval for longer reading",value:"30min"},{label:"$(clock) Every 60 minutes",description:n==="60min"?"Currently Active":"",detail:"One verse per hour",value:"60min"},{label:"$(clock) Every 5 minutes",description:n==="5min"?"Currently Active":"",detail:"Frequent rotation",value:"5min"},{label:"$(edit) On Editor Open",description:n==="onEditorOpen"?"Currently Active":"",detail:"Rotate whenever you switch or open an editor file",value:"onEditorOpen"},{label:"$(debug-pause) Manual Only (Never change automatically)",description:n==="manual"?"Currently Active":"",detail:"Verses only change when you press Ctrl+Alt+B / Cmd+Alt+B or click Next",value:"manual"}],u=await c.window.showQuickPick(i,{placeHolder:`Select how often the status bar scripture rotates (Current: ${n})`});u&&(await c.workspace.getConfiguration("dailyBread").update("rotationSchedule",u.value,c.ConfigurationTarget.Global),c.window.showInformationMessage(`Daily Bible rotation schedule set to: ${u.label.replace(/\$\([^)]+\)\s*/,"")}`))})),d.subscriptions.push(A)}function xe(){N&&(clearInterval(N),N=void 0)}0&&(module.exports={activate,deactivate});
