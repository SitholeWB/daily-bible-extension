const fs = require('fs');
const path = require('path');

const BOOKS_METADATA = [
  { id: 1, code: 'GEN', name: 'Genesis', zuluName: 'USenesisi', chapters: 50, testament: 'OT', aliases: ['gen', 'genesis', 'sen', 'senesisi', 'usenesisi', 'genesise'] },
  { id: 2, code: 'EXO', name: 'Exodus', zuluName: 'UEksodusi', chapters: 40, testament: 'OT', aliases: ['exo', 'exod', 'exodus', 'eks', 'eksodusi', 'ueksodusi'] },
  { id: 3, code: 'LEV', name: 'Leviticus', zuluName: 'ULevitikusi', chapters: 27, testament: 'OT', aliases: ['lev', 'leviticus', 'ulevitikusi', 'levitikusi'] },
  { id: 4, code: 'NUM', name: 'Numbers', zuluName: 'UNumeri', chapters: 36, testament: 'OT', aliases: ['num', 'numbers', 'numeri', 'unumeri'] },
  { id: 5, code: 'DEU', name: 'Deuteronomy', zuluName: 'UDuteronomi', chapters: 34, testament: 'OT', aliases: ['deu', 'deut', 'deuteronomy', 'duteronomi', 'uduteronomi'] },
  { id: 6, code: 'JOS', name: 'Joshua', zuluName: 'UJoshuwa', chapters: 24, testament: 'OT', aliases: ['jos', 'josh', 'joshua', 'joshuwa', 'ujoshuwa'] },
  { id: 7, code: 'JDG', name: 'Judges', zuluName: 'AbAhluleli', chapters: 21, testament: 'OT', aliases: ['jdg', 'judg', 'judges', 'abahluleli', 'ahluleli', 'ahl'] },
  { id: 8, code: 'RUT', name: 'Ruth', zuluName: 'URuthe', chapters: 4, testament: 'OT', aliases: ['rut', 'ruth', 'ruthe', 'uruthe'] },
  { id: 9, code: '1SA', name: '1 Samuel', zuluName: '1 Samuweli', chapters: 31, testament: 'OT', aliases: ['1sa', '1sam', '1 samuel', '1samuel', '1 samuweli', '1samuweli'] },
  { id: 10, code: '2SA', name: '2 Samuel', zuluName: '2 Samuweli', chapters: 24, testament: 'OT', aliases: ['2sa', '2sam', '2 samuel', '2samuel', '2 samuweli', '2samuweli'] },
  { id: 11, code: '1KI', name: '1 Kings', zuluName: '1 AmaKhosi', chapters: 22, testament: 'OT', aliases: ['1ki', '1kin', '1 kgs', '1kgs', '1 kings', '1kings', '1 amakhosi', '1amakhosi', '1kho'] },
  { id: 12, code: '2KI', name: '2 Kings', zuluName: '2 AmaKhosi', chapters: 25, testament: 'OT', aliases: ['2ki', '2kin', '2 kgs', '2kgs', '2 kings', '2kings', '2 amakhosi', '2amakhosi', '2kho'] },
  { id: 13, code: '1CH', name: '1 Chronicles', zuluName: '1 IziKronike', chapters: 29, testament: 'OT', aliases: ['1ch', '1chr', '1 chronicles', '1chronicles', '1 izikronike', '1izikronike', '1kro'] },
  { id: 14, code: '2CH', name: '2 Chronicles', zuluName: '2 IziKronike', chapters: 36, testament: 'OT', aliases: ['2ch', '2chr', '2 chronicles', '2chronicles', '2 izikronike', '2izikronike', '2kro'] },
  { id: 15, code: 'EZR', name: 'Ezra', zuluName: 'UEzra', chapters: 10, testament: 'OT', aliases: ['ezr', 'ezra', 'uezra'] },
  { id: 16, code: 'NEH', name: 'Nehemiah', zuluName: 'UNehemiya', chapters: 13, testament: 'OT', aliases: ['neh', 'nehemiah', 'nehemiya', 'unehemiya'] },
  { id: 17, code: 'EST', name: 'Esther', zuluName: 'UEsteri', chapters: 10, testament: 'OT', aliases: ['est', 'esth', 'esther', 'esteri', 'uesteri'] },
  { id: 18, code: 'JOB', name: 'Job', zuluName: 'UJobe', chapters: 42, testament: 'OT', aliases: ['job', 'jobe', 'ujobe'] },
  { id: 19, code: 'PSA', name: 'Psalms', zuluName: 'AmaHubo', chapters: 150, testament: 'OT', aliases: ['psa', 'ps', 'psalm', 'psalms', 'hubo', 'amahubo', 'hub'] },
  { id: 20, code: 'PRO', name: 'Proverbs', zuluName: 'IzAga', chapters: 31, testament: 'OT', aliases: ['pro', 'prov', 'proverbs', 'izaga', 'aga'] },
  { id: 21, code: 'ECC', name: 'Ecclesiastes', zuluName: 'UmShumayeli', chapters: 12, testament: 'OT', aliases: ['ecc', 'eccl', 'ecclesiastes', 'umshumayeli', 'shumayeli', 'shum'] },
  { id: 22, code: 'SNG', name: 'Song of Solomon', zuluName: 'IsiHlabelelo', chapters: 8, testament: 'OT', aliases: ['sng', 'song', 'song of solomon', 'canticles', 'isihlabelelo', 'hlabelelo', 'hlab'] },
  { id: 23, code: 'ISA', name: 'Isaiah', zuluName: 'U-Isaya', chapters: 66, testament: 'OT', aliases: ['isa', 'isaiah', 'isaya', 'u-isaya', 'uisaya'] },
  { id: 24, code: 'JER', name: 'Jeremiah', zuluName: 'UJeremiya', chapters: 52, testament: 'OT', aliases: ['jer', 'jeremiah', 'jeremiya', 'ujeremiya'] },
  { id: 25, code: 'LAM', name: 'Lamentations', zuluName: 'IsiLilo', chapters: 5, testament: 'OT', aliases: ['lam', 'lamentations', 'isililo', 'lilo'] },
  { id: 26, code: 'EZK', name: 'Ezekiel', zuluName: 'UHezekeli', chapters: 48, testament: 'OT', aliases: ['ezk', 'ezek', 'ezekiel', 'hezekeli', 'uhezekeli', 'hez'] },
  { id: 27, code: 'DAN', name: 'Daniel', zuluName: 'UDaniyeli', chapters: 12, testament: 'OT', aliases: ['dan', 'daniel', 'daniyeli', 'udaniyeli'] },
  { id: 28, code: 'HOS', name: 'Hosea', zuluName: 'UHoseya', chapters: 14, testament: 'OT', aliases: ['hos', 'hosea', 'hoseya', 'uhoseya'] },
  { id: 29, code: 'JOL', name: 'Joel', zuluName: 'UJoweli', chapters: 3, testament: 'OT', aliases: ['jol', 'joel', 'joweli', 'ujoweli'] },
  { id: 30, code: 'AMO', name: 'Amos', zuluName: 'U-Amose', chapters: 9, testament: 'OT', aliases: ['amo', 'amos', 'amose', 'u-amose', 'uamose'] },
  { id: 31, code: 'OBA', name: 'Obadiah', zuluName: 'U-Obadiya', chapters: 1, testament: 'OT', aliases: ['oba', 'obad', 'obadiah', 'obadiya', 'u-obadiya', 'uobadiya'] },
  { id: 32, code: 'JON', name: 'Jonah', zuluName: 'UJona', chapters: 4, testament: 'OT', aliases: ['jon', 'jonah', 'jona', 'ujona'] },
  { id: 33, code: 'MIC', name: 'Micah', zuluName: 'UMika', chapters: 7, testament: 'OT', aliases: ['mic', 'micah', 'mika', 'umika'] },
  { id: 34, code: 'NAM', name: 'Nahum', zuluName: 'UNahume', chapters: 3, testament: 'OT', aliases: ['nam', 'nah', 'nahum', 'nahume', 'unahume'] },
  { id: 35, code: 'HAB', name: 'Habakkuk', zuluName: 'UHabakuki', chapters: 3, testament: 'OT', aliases: ['hab', 'habakkuk', 'habakuki', 'uhabakuki'] },
  { id: 36, code: 'ZEP', name: 'Zephaniah', zuluName: 'UZefaniya', chapters: 3, testament: 'OT', aliases: ['zep', 'zeph', 'zephaniah', 'zefaniya', 'uzefaniya'] },
  { id: 37, code: 'HAG', name: 'Haggai', zuluName: 'UHagayi', chapters: 2, testament: 'OT', aliases: ['hag', 'haggai', 'hagayi', 'uhagayi'] },
  { id: 38, code: 'ZEC', name: 'Zechariah', zuluName: 'UZakariya', chapters: 14, testament: 'OT', aliases: ['zec', 'zech', 'zechariah', 'zakariya', 'uzakariya', 'zak'] },
  { id: 39, code: 'MAL', name: 'Malachi', zuluName: 'UMalaki', chapters: 4, testament: 'OT', aliases: ['mal', 'malachi', 'malaki', 'umalaki'] },
  { id: 40, code: 'MAT', name: 'Matthew', zuluName: 'UMathewu', chapters: 28, testament: 'NT', aliases: ['mat', 'matt', 'matthew', 'mathewu', 'umathewu'] },
  { id: 41, code: 'MRK', name: 'Mark', zuluName: 'UMarku', chapters: 16, testament: 'NT', aliases: ['mrk', 'mark', 'marku', 'umarku'] },
  { id: 42, code: 'LUK', name: 'Luke', zuluName: 'ULuka', chapters: 24, testament: 'NT', aliases: ['luk', 'luke', 'luka', 'uluka'] },
  { id: 43, code: 'JHN', name: 'John', zuluName: 'UJohane', chapters: 21, testament: 'NT', aliases: ['jhn', 'john', 'joh', 'johane', 'ujohane'] },
  { id: 44, code: 'ACT', name: 'Acts', zuluName: 'IzEnzo', chapters: 28, testament: 'NT', aliases: ['act', 'acts', 'izenzo', 'zenzo'] },
  { id: 45, code: 'ROM', name: 'Romans', zuluName: 'KwabaseRoma', chapters: 16, testament: 'NT', aliases: ['rom', 'romans', 'amaroma', 'kwabaseroma', 'roma'] },
  { id: 46, code: '1CO', name: '1 Corinthians', zuluName: '1 KwabaseKorinte', chapters: 16, testament: 'NT', aliases: ['1co', '1cor', '1 corinthians', '1 kwabasekorinte', '1korinte', '1kor'] },
  { id: 47, code: '2CO', name: '2 Corinthians', zuluName: '2 KwabaseKorinte', chapters: 13, testament: 'NT', aliases: ['2co', '2cor', '2 corinthians', '2 kwabasekorinte', '2korinte', '2kor'] },
  { id: 48, code: 'GAL', name: 'Galatians', zuluName: 'KwabaseGalathiya', chapters: 6, testament: 'NT', aliases: ['gal', 'galatians', 'kwabasegalathiya', 'galathiya'] },
  { id: 49, code: 'EPH', name: 'Ephesians', zuluName: 'Kwabase-Efesu', chapters: 6, testament: 'NT', aliases: ['eph', 'ephesians', 'kwabase-efesu', 'efesu', 'efe'] },
  { id: 50, code: 'PHP', name: 'Philippians', zuluName: 'KwabaseFilipi', chapters: 4, testament: 'NT', aliases: ['php', 'phil', 'philippians', 'kwabasefilipi', 'filipi', 'fil'] },
  { id: 51, code: 'COL', name: 'Colossians', zuluName: 'KwabaseKolose', chapters: 4, testament: 'NT', aliases: ['col', 'colossians', 'kwabasekolose', 'kolose', 'kol'] },
  { id: 52, code: '1TH', name: '1 Thessalonians', zuluName: '1 KwabaseThesalonika', chapters: 5, testament: 'NT', aliases: ['1th', '1thess', '1 thessalonians', '1 thesalonika', '1kwabasethesalonika', '1thes'] },
  { id: 53, code: '2TH', name: '2 Thessalonians', zuluName: '2 KwabaseThesalonika', chapters: 3, testament: 'NT', aliases: ['2th', '2thess', '2 thessalonians', '2 thesalonika', '2kwabasethesalonika', '2thes'] },
  { id: 54, code: '1TI', name: '1 Timothy', zuluName: '1 KuThimothewu', chapters: 6, testament: 'NT', aliases: ['1ti', '1tim', '1 timothy', '1 kuthimothewu', '1thimothewu', '1timothewu'] },
  { id: 55, code: '2TI', name: '2 Timothy', zuluName: '2 KuThimothewu', chapters: 4, testament: 'NT', aliases: ['2ti', '2tim', '2 timothy', '2 kuthimothewu', '2thimothewu', '2timothewu'] },
  { id: 56, code: 'TIT', name: 'Titus', zuluName: 'KuThithu', chapters: 3, testament: 'NT', aliases: ['tit', 'titus', 'kuthithu', 'thithu'] },
  { id: 57, code: 'PHM', name: 'Philemon', zuluName: 'KuFilemoni', chapters: 1, testament: 'NT', aliases: ['phm', 'phlm', 'philem', 'philemon', 'kufilemoni', 'filemoni'] },
  { id: 58, code: 'HEB', name: 'Hebrews', zuluName: 'KumaHeberu', chapters: 13, testament: 'NT', aliases: ['heb', 'hebrews', 'kumaheberu', 'heberu'] },
  { id: 59, code: 'JAS', name: 'James', zuluName: 'EkaJakobe', chapters: 5, testament: 'NT', aliases: ['jas', 'james', 'ekajakobe', 'jakobe', 'jak'] },
  { id: 60, code: '1PE', name: '1 Peter', zuluName: '1 EkaPetru', chapters: 5, testament: 'NT', aliases: ['1pe', '1pet', '1 peter', '1 ekapetru', '1petru', '1pet'] },
  { id: 61, code: '2PE', name: '2 Peter', zuluName: '2 EkaPetru', chapters: 3, testament: 'NT', aliases: ['2pe', '2pet', '2 peter', '2 ekapetru', '2petru', '2pet'] },
  { id: 62, code: '1JN', name: '1 John', zuluName: '1 EkaJohane', chapters: 5, testament: 'NT', aliases: ['1jn', '1joh', '1 john', '1 ekajohane', '1johane'] },
  { id: 63, code: '2JN', name: '2 John', zuluName: '2 EkaJohane', chapters: 1, testament: 'NT', aliases: ['2jn', '2joh', '2 john', '2 ekajohane', '2johane'] },
  { id: 64, code: '3JN', name: '3 John', zuluName: '3 EkaJohane', chapters: 1, testament: 'NT', aliases: ['3jn', '3joh', '3 john', '3 ekajohane', '3johane'] },
  { id: 65, code: 'JUD', name: 'Jude', zuluName: 'EkaJuda', chapters: 1, testament: 'NT', aliases: ['jud', 'jude', 'ekajuda', 'juda'] },
  { id: 66, code: 'REV', name: 'Revelation', zuluName: 'IsAmbulo', chapters: 22, testament: 'NT', aliases: ['rev', 'revelation', 'isambulo', 'zambulo', 'sambulo'] }
];

const CURATED_TOPICS = {
  peace: {
    id: 'peace',
    name: 'Peace & Rest',
    zuluName: 'Ukuthula Nokuphumula',
    description: 'Verses bringing calm, comfort, and peaceful quietness to your mind.',
    verses: [
      { bookId: 43, chapter: 14, verse: 27 }, // John 14:27
      { bookId: 50, chapter: 4, verse: 6 },   // Phil 4:6
      { bookId: 50, chapter: 4, verse: 7 },   // Phil 4:7
      { bookId: 40, chapter: 11, verse: 28 }, // Matt 11:28
      { bookId: 19, chapter: 23, verse: 1 },  // Ps 23:1
      { bookId: 19, chapter: 23, verse: 2 },  // Ps 23:2
      { bookId: 19, chapter: 23, verse: 3 },  // Ps 23:3
      { bookId: 19, chapter: 4, verse: 8 },   // Ps 4:8
      { bookId: 23, chapter: 26, verse: 3 },  // Isa 26:3
      { bookId: 43, chapter: 16, verse: 33 }  // John 16:33
    ]
  },
  wisdom: {
    id: 'wisdom',
    name: 'Focus & Wisdom',
    zuluName: 'Ukuhlakanipha Nokugxila',
    description: 'Divine guidance, clear thinking, and problem solving while coding.',
    verses: [
      { bookId: 59, chapter: 1, verse: 5 },   // James 1:5
      { bookId: 20, chapter: 3, verse: 5 },   // Prov 3:5
      { bookId: 20, chapter: 3, verse: 6 },   // Prov 3:6
      { bookId: 20, chapter: 16, verse: 3 },  // Prov 16:3
      { bookId: 20, chapter: 2, verse: 6 },   // Prov 2:6
      { bookId: 19, chapter: 119, verse: 105 },// Ps 119:105
      { bookId: 51, chapter: 3, verse: 23 },  // Col 3:23
      { bookId: 20, chapter: 4, verse: 7 },   // Prov 4:7
      { bookId: 19, chapter: 90, verse: 12 }, // Ps 90:12
      { bookId: 50, chapter: 4, verse: 8 }    // Phil 4:8
    ]
  },
  strength: {
    id: 'strength',
    name: 'Strength & Courage',
    zuluName: 'Amandla Nesibindi',
    description: 'Overcoming obstacles, resilience, and renewed stamina.',
    verses: [
      { bookId: 50, chapter: 4, verse: 13 },  // Phil 4:13
      { bookId: 23, chapter: 40, verse: 31 }, // Isa 40:31
      { bookId: 6, chapter: 1, verse: 9 },    // Joshua 1:9
      { bookId: 23, chapter: 41, verse: 10 }, // Isa 41:10
      { bookId: 19, chapter: 46, verse: 1 },  // Ps 46:1
      { bookId: 19, chapter: 27, verse: 1 },  // Ps 27:1
      { bookId: 49, chapter: 6, verse: 10 },  // Eph 6:10
      { bookId: 55, chapter: 1, verse: 7 },   // 2 Tim 1:7
      { bookId: 19, chapter: 18, verse: 2 },  // Ps 18:2
      { bookId: 47, chapter: 12, verse: 9 }   // 2 Cor 12:9
    ]
  },
  comfort: {
    id: 'comfort',
    name: 'Hard Times & Comfort',
    zuluName: 'Izikhathi Ezinzima Nenduduzo',
    description: 'Solace, hope, and healing during stress and frustration.',
    verses: [
      { bookId: 19, chapter: 34, verse: 18 }, // Ps 34:18
      { bookId: 45, chapter: 8, verse: 28 },  // Rom 8:28
      { bookId: 45, chapter: 8, verse: 38 },  // Rom 8:38
      { bookId: 45, chapter: 8, verse: 39 },  // Rom 8:39
      { bookId: 47, chapter: 1, verse: 3 },   // 2 Cor 1:3
      { bookId: 47, chapter: 1, verse: 4 },   // 2 Cor 1:4
      { bookId: 60, chapter: 5, verse: 7 },   // 1 Peter 5:7
      { bookId: 24, chapter: 29, verse: 11 }, // Jer 29:11
      { bookId: 19, chapter: 91, verse: 1 },  // Ps 91:1
      { bookId: 19, chapter: 91, verse: 2 }   // Ps 91:2
    ]
  },
  gratitude: {
    id: 'gratitude',
    name: 'Gratitude & Praise',
    zuluName: 'Ukubonga Nokudumisa',
    description: 'Thankfulness for milestones, breakthroughs, and life blessings.',
    verses: [
      { bookId: 52, chapter: 5, verse: 16 },  // 1 Thess 5:16
      { bookId: 52, chapter: 5, verse: 17 },  // 1 Thess 5:17
      { bookId: 52, chapter: 5, verse: 18 },  // 1 Thess 5:18
      { bookId: 19, chapter: 100, verse: 4 }, // Ps 100:4
      { bookId: 19, chapter: 103, verse: 1 }, // Ps 103:1
      { bookId: 19, chapter: 103, verse: 2 }, // Ps 103:2
      { bookId: 19, chapter: 118, verse: 24 },// Ps 118:24
      { bookId: 51, chapter: 3, verse: 17 },  // Col 3:17
      { bookId: 19, chapter: 107, verse: 1 }, // Ps 107:1
      { bookId: 19, chapter: 150, verse: 6 }  // Ps 150:6
    ]
  },
  joy: {
    id: 'joy',
    name: 'Joy & Hope',
    zuluName: 'Injabulo Nethemba',
    description: 'Radiant uplifting joy to brighten the workday.',
    verses: [
      { bookId: 50, chapter: 4, verse: 4 },   // Phil 4:4
      { bookId: 45, chapter: 15, verse: 13 }, // Rom 15:13
      { bookId: 16, chapter: 8, verse: 10 },  // Neh 8:10
      { bookId: 19, chapter: 16, verse: 11 }, // Ps 16:11
      { bookId: 19, chapter: 30, verse: 5 },  // Ps 30:5
      { bookId: 20, chapter: 17, verse: 22 }, // Prov 17:22
      { bookId: 25, chapter: 3, verse: 22 },  // Lam 3:22
      { bookId: 25, chapter: 3, verse: 23 },  // Lam 3:23
      { bookId: 43, chapter: 15, verse: 11 }, // John 15:11
      { bookId: 58, chapter: 11, verse: 1 }   // Heb 11:1
    ]
  }
};

function processZuluAndKjv() {
  console.log('Processing Zulu...');
  const zuluRaw = JSON.parse(fs.readFileSync('/tmp/zulu_bible.json', 'utf8'));
  const kjvRaw = JSON.parse(fs.readFileSync('/tmp/kjv_bible.json', 'utf8'));

  const outZuluDir = path.join(__dirname, '../data/translations/zulu');
  const outKjvDir = path.join(__dirname, '../data/translations/kjv');
  fs.mkdirSync(outZuluDir, { recursive: true });
  fs.mkdirSync(outKjvDir, { recursive: true });

  // Each Book in zuluRaw.Book is an array of 66 books
  if (zuluRaw.Book.length !== 66 || kjvRaw.Book.length !== 66) {
    console.error(`Expected 66 books, got Zulu: ${zuluRaw.Book.length}, KJV: ${kjvRaw.Book.length}`);
  }

  for (let i = 0; i < 66; i++) {
    const bookId = i + 1;
    const zuluBook = zuluRaw.Book[i];
    const kjvBook = kjvRaw.Book[i];

    // chapters: array of array of strings
    const zuluChapters = zuluBook.Chapter.map(ch => {
      // ch.Verse is array of { Verseid, Verse }
      return ch.Verse.map(v => v.Verse.trim());
    });

    const kjvChapters = kjvBook.Chapter.map(ch => {
      return ch.Verse.map(v => v.Verse.trim());
    });

    fs.writeFileSync(path.join(outZuluDir, `${bookId}.json`), JSON.stringify(zuluChapters));
    fs.writeFileSync(path.join(outKjvDir, `${bookId}.json`), JSON.stringify(kjvChapters));
  }
  console.log('Zulu and KJV converted successfully.');
}

function processWeb() {
  console.log('Processing WEB from /tmp/web_bible...');
  const outWebDir = path.join(__dirname, '../data/translations/web');
  fs.mkdirSync(outWebDir, { recursive: true });

  for (const meta of BOOKS_METADATA) {
    const filePath = path.join('/tmp/web_bible', `engwebu_${meta.code}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`WEB file not found for ${meta.code}`);
      continue;
    }
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Array of { _b: "GEN", _c: "1", _v: "1", __text: "..." }
    const chapters = [];
    for (const item of raw) {
      const c = parseInt(item._c, 10);
      const v = parseInt(item._v, 10);
      const text = (item.__text || '').trim();
      while (chapters.length < c) {
        chapters.push([]);
      }
      chapters[c - 1][v - 1] = text;
    }

    // Fill any nulls/undefined in verses if any
    for (let c = 0; c < chapters.length; c++) {
      for (let v = 0; v < chapters[c].length; v++) {
        if (!chapters[c][v]) {
          chapters[c][v] = '';
        }
      }
    }

    fs.writeFileSync(path.join(outWebDir, `${meta.id}.json`), JSON.stringify(chapters));
  }
  console.log('WEB converted successfully.');
}

function writeMetadata() {
  fs.writeFileSync(
    path.join(__dirname, '../data/books.json'),
    JSON.stringify(BOOKS_METADATA, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, '../data/curated_topics.json'),
    JSON.stringify(CURATED_TOPICS, null, 2)
  );
  console.log('Metadata written.');
}

processZuluAndKjv();
processWeb();
writeMetadata();
console.log('All Bible databases and metadata prepared successfully!');

