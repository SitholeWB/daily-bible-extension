const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Mapping from TSV book name to canonical book ID (1..66)
const BOOK_NAME_TO_ID = {
  'Gen': 1, 'Exod': 2, 'Lev': 3, 'Num': 4, 'Deut': 5,
  'Josh': 6, 'Judg': 7, 'Ruth': 8, '1 Sam': 9, '2 Sam': 10,
  '1 Kgs': 11, '2 Kgs': 12, '1 Chr': 13, '2 Chr': 14, 'Ezra': 15,
  'Neh': 16, 'Esth': 17, 'Job': 18, 'Ps': 19, 'Prov': 20,
  'Eccl': 21, 'Song': 22, 'Isa': 23, 'Jer': 24, 'Lam': 25,
  'Ezek': 26, 'Dan': 27, 'Hos': 28, 'Joel': 29, 'Amos': 30,
  'Obad': 31, 'Jonah': 32, 'Mic': 33, 'Nah': 34, 'Hab': 35,
  'Zeph': 36, 'Hag': 37, 'Zech': 38, 'Mal': 39, 'Matt': 40,
  'Mark': 41, 'Luke': 42, 'John': 43, 'Acts': 44, 'Rom': 45,
  '1 Cor': 46, '2 Cor': 47, 'Gal': 48, 'Eph': 49, 'Phil': 50,
  'Col': 51, '1 Thess': 52, '2 Thess': 53, '1 Tim': 54, '2 Tim': 55,
  'Titus': 56, 'Phlm': 57, 'Heb': 58, 'Jas': 59, '1 Pet': 60,
  '2 Pet': 61, '1 John': 62, '2 John': 63, '3 John': 64, 'Jude': 65,
  'Rev': 66
};

async function processCrossReferences() {
  const tsvPath = '/tmp/crossreferences_kjv.tsv';
  if (!fs.existsSync(tsvPath)) {
    console.error('TSV file not found at ' + tsvPath);
    process.exit(1);
  }

  const outDir = path.join(__dirname, '../data/cross_references');
  fs.mkdirSync(outDir, { recursive: true });

  // Map of bookId -> chapter -> verse -> array of { anchor, refs }
  const booksMap = new Map();
  for (let i = 1; i <= 66; i++) {
    booksMap.set(i, {});
  }

  const fileStream = fs.createReadStream(tsvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) continue; // Header

    const parts = line.split('\t');
    if (parts.length < 5) continue;

    const [bookStr, chStr, vStr, anchor, refsStr] = parts;
    const bookId = BOOK_NAME_TO_ID[bookStr.trim()];
    if (!bookId) continue;

    const chapter = parseInt(chStr, 10);
    const verse = parseInt(vStr, 10);
    if (isNaN(chapter) || isNaN(verse)) continue;

    const refs = refsStr.split('|').map(r => r.trim()).filter(Boolean);
    if (refs.length === 0) continue;

    const bookObj = booksMap.get(bookId);
    if (!bookObj[chapter]) {
      bookObj[chapter] = {};
    }
    if (!bookObj[chapter][verse]) {
      bookObj[chapter][verse] = [];
    }

    bookObj[chapter][verse].push({
      anchor: anchor.trim(),
      refs: refs.slice(0, 8) // Limit to top 8 most relevant per anchor to keep size optimal
    });
  }

  // Write out per book
  for (let i = 1; i <= 66; i++) {
    const data = booksMap.get(i);
    const outFilePath = path.join(outDir, `${i}.json`);
    fs.writeFileSync(outFilePath, JSON.stringify(data));
  }

  console.log(`Cross references processed for all 66 books from ${lineCount} lines.`);
}

processCrossReferences().catch(console.error);

