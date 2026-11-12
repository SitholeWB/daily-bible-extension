import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import '../models/bible_models.dart';

class BibleRepository {
  List<BibleBook> books = [];
  List<TranslationInfo> catalog = [];
  List<CuratedTopic> topics = [];

  final Map<int, BibleBook> _booksById = {};
  final Map<String, int> _aliasToBookId = {};
  final Map<String, List<List<String>>> _chapterCache = {};
  final Map<int, Map<String, Map<String, List<CrossRefGroup>>>> _crossRefCache =
      {};
  final Set<String> _downloadedIds = {};
  Directory? _packsDir;

  Future<void> init() async {
    final supportDir = await getApplicationSupportDirectory();
    _packsDir = Directory('${supportDir.path}/packs');
    if (!await _packsDir!.exists()) {
      await _packsDir!.create(recursive: true);
    }

    await _scanDownloadedPacks();
    await _loadMetadata();
  }

  Future<void> _scanDownloadedPacks() async {
    _downloadedIds.clear();
    if (_packsDir == null || !await _packsDir!.exists()) return;
    await for (final entity in _packsDir!.list()) {
      if (entity is File && entity.path.endsWith('.json.gz')) {
        final name = entity.uri.pathSegments.last;
        final id = name.substring(0, name.length - '.json.gz'.length);
        _downloadedIds.add(id);
      }
    }
  }

  Future<void> _loadMetadata() async {
    final booksStr = await rootBundle.loadString('assets/data/books.json');
    final booksJson = jsonDecode(booksStr) as List<dynamic>;
    books = booksJson
        .map((e) => BibleBook.fromJson(e as Map<String, dynamic>))
        .toList();

    _booksById.clear();
    _aliasToBookId.clear();
    for (final book in books) {
      _booksById[book.id] = book;
      _aliasToBookId[book.name.toLowerCase()] = book.id;
      _aliasToBookId[book.code.toLowerCase()] = book.id;
      _aliasToBookId[book.zuluName.toLowerCase()] = book.id;
      for (final alias in book.aliases) {
        _aliasToBookId[alias.toLowerCase()] = book.id;
      }
    }
    // Common TSK abbreviations
    const tskAliases = {
      'gen': 1,
      'exod': 2,
      'lev': 3,
      'num': 4,
      'deut': 5,
      'josh': 6,
      'judg': 7,
      '1 sam': 9,
      '2 sam': 10,
      '1 kgs': 11,
      '2 kgs': 12,
      '1 chr': 13,
      '2 chr': 14,
      'neh': 16,
      'esth': 17,
      'ps': 19,
      'prov': 20,
      'eccl': 21,
      'song': 22,
      'isa': 23,
      'jer': 24,
      'lam': 25,
      'ezek': 26,
      'dan': 27,
      'hos': 28,
      'obad': 31,
      'mic': 33,
      'nah': 34,
      'hab': 35,
      'zeph': 36,
      'hag': 37,
      'zech': 38,
      'mal': 39,
      'matt': 40,
      'rom': 45,
      '1 cor': 46,
      '2 cor': 47,
      'gal': 48,
      'eph': 49,
      'phil': 50,
      'col': 51,
      '1 thess': 52,
      '2 thess': 53,
      '1 tim': 54,
      '2 tim': 55,
      'phlm': 57,
      'heb': 58,
      'jas': 59,
      '1 pet': 60,
      '2 pet': 61,
      '1 john': 62,
      '2 john': 63,
      '3 john': 64,
      'rev': 66,
    };
    _aliasToBookId.addAll(tskAliases);

    final catStr =
        await rootBundle.loadString('assets/data/translations_catalog.json');
    final catJson = jsonDecode(catStr) as List<dynamic>;
    catalog = catJson
        .map((e) => TranslationInfo.fromJson(e as Map<String, dynamic>))
        .toList();

    final topicsStr =
        await rootBundle.loadString('assets/data/curated_topics.json');
    final topicsJson = jsonDecode(topicsStr) as Map<String, dynamic>;
    topics = topicsJson.values
        .map((e) => CuratedTopic.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  BibleBook? getBook(int bookId) => _booksById[bookId];

  TranslationInfo? getTranslation(String id) {
    for (final t in catalog) {
      if (t.id == id) return t;
    }
    return null;
  }

  bool isTranslationAvailable(String id) {
    final info = getTranslation(id);
    if (info != null && info.bundled) return true;
    return _downloadedIds.contains(id);
  }

  List<TranslationInfo> get availableTranslations =>
      catalog.where((t) => isTranslationAvailable(t.id)).toList();

  Future<List<List<String>>> loadBook(
      String translationId, int bookId) async {
    final cacheKey = '$translationId:$bookId';
    if (_chapterCache.containsKey(cacheKey)) {
      return _chapterCache[cacheKey]!;
    }

    final info = getTranslation(translationId);
    if (info != null && info.bundled) {
      try {
        final raw = await rootBundle
            .loadString('assets/data/translations/$translationId/$bookId.json');
        final decoded = jsonDecode(raw) as List<dynamic>;
        final chapters = decoded
            .map((ch) => (ch as List<dynamic>).map((v) => v.toString()).toList())
            .toList();
        _chapterCache[cacheKey] = chapters;
        return chapters;
      } catch (_) {
        return [];
      }
    }

    // Load downloaded pack into cache for all 66 books
    if (_packsDir != null) {
      final packFile = File('${_packsDir!.path}/$translationId.json.gz');
      if (await packFile.exists()) {
        try {
          final gzBytes = await packFile.readAsBytes();
          final jsonBytes = gzip.decode(gzBytes);
          final bundle =
              jsonDecode(utf8.decode(jsonBytes)) as Map<String, dynamic>;
          for (final entry in bundle.entries) {
            final chapters = (entry.value as List<dynamic>)
                .map((ch) =>
                    (ch as List<dynamic>).map((v) => v.toString()).toList())
                .toList();
            _chapterCache['$translationId:${entry.key}'] = chapters;
          }
          return _chapterCache[cacheKey] ?? [];
        } catch (_) {
          return [];
        }
      }
    }

    return [];
  }

  Future<List<String>> loadChapter(
      String translationId, int bookId, int chapter) async {
    final chapters = await loadBook(translationId, bookId);
    final idx = chapter - 1;
    if (idx < 0 || idx >= chapters.length) return [];
    return chapters[idx];
  }

  Future<String?> getVerseText(
      String translationId, int bookId, int chapter, int verse) async {
    final verses = await loadChapter(translationId, bookId, chapter);
    final idx = verse - 1;
    if (idx < 0 || idx >= verses.length) return null;
    return verses[idx];
  }

  Future<void> downloadTranslation(TranslationInfo info) async {
    final url = info.downloadUrl ??
        'https://raw.githubusercontent.com/SitholeWB/daily-bread-bible/main/packs/${info.id}.json.gz';
    final response =
        await http.get(Uri.parse(url)).timeout(const Duration(seconds: 30));
    if (response.statusCode != 200) {
      throw Exception('HTTP ${response.statusCode} downloading ${info.shortName}');
    }

    final jsonBytes = gzip.decode(response.bodyBytes);
    final parsed = jsonDecode(utf8.decode(jsonBytes)) as Map<String, dynamic>;
    if (!parsed.containsKey('1') || !parsed.containsKey('66')) {
      throw Exception('Invalid translation pack structure.');
    }

    final outFile = File('${_packsDir!.path}/${info.id}.json.gz');
    await outFile.writeAsBytes(response.bodyBytes);
    _downloadedIds.add(info.id);

    // Pre-populate cache
    for (final entry in parsed.entries) {
      final chapters = (entry.value as List<dynamic>)
          .map((ch) => (ch as List<dynamic>).map((v) => v.toString()).toList())
          .toList();
      _chapterCache['${info.id}:${entry.key}'] = chapters;
    }
  }

  Future<void> deleteTranslation(String id) async {
    final info = getTranslation(id);
    if (info != null && info.bundled) return;
    final packFile = File('${_packsDir!.path}/$id.json.gz');
    if (await packFile.exists()) {
      await packFile.delete();
    }
    _downloadedIds.remove(id);
    _chapterCache.removeWhere((k, _) => k.startsWith('$id:'));
  }

  Future<List<CrossRefGroup>> getCrossReferences(
      int bookId, int chapter, int verse) async {
    if (!_crossRefCache.containsKey(bookId)) {
      try {
        final raw = await rootBundle
            .loadString('assets/data/cross_references/$bookId.json');
        final decoded = jsonDecode(raw) as Map<String, dynamic>;
        final bookMap = <String, Map<String, List<CrossRefGroup>>>{};
        for (final chEntry in decoded.entries) {
          final verseMap = <String, List<CrossRefGroup>>{};
          final rawVerses = chEntry.value as Map<String, dynamic>;
          for (final vEntry in rawVerses.entries) {
            verseMap[vEntry.key] = (vEntry.value as List<dynamic>)
                .map((g) => CrossRefGroup.fromJson(g as Map<String, dynamic>))
                .toList();
          }
          bookMap[chEntry.key] = verseMap;
        }
        _crossRefCache[bookId] = bookMap;
      } catch (_) {
        _crossRefCache[bookId] = {};
      }
    }

    final bookData = _crossRefCache[bookId]!;
    return bookData['$chapter']?['$verse'] ?? const [];
  }

  /// Parses strings like "John 3:16", "Prov 8:22-24", "Gen 1:5,8", "1 Cor 13:4"
  VerseRef? parseReference(String ref) {
    final cleaned = ref.trim();
    final match = RegExp(r'^(.+?)\s+(\d+)(?::(\d+))?').firstMatch(cleaned);
    if (match == null) return null;
    final bookPart = match.group(1)!.trim().toLowerCase();
    final chapter = int.tryParse(match.group(2)!) ?? 1;
    final verse = int.tryParse(match.group(3) ?? '1') ?? 1;

    final bookId = _aliasToBookId[bookPart];
    if (bookId == null) return null;
    final book = getBook(bookId);
    if (book == null) return null;
    final clampedChapter = chapter.clamp(1, book.chapters);
    return VerseRef(bookId: bookId, chapter: clampedChapter, verse: verse);
  }

  Future<List<SearchResult>> search(String translationId, String query,
      {int limit = 80}) async {
    final q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    final results = <SearchResult>[];

    for (final book in books) {
      final chapters = await loadBook(translationId, book.id);
      for (int cIdx = 0; cIdx < chapters.length; cIdx++) {
        final verses = chapters[cIdx];
        for (int vIdx = 0; vIdx < verses.length; vIdx++) {
          final text = verses[vIdx];
          if (text.toLowerCase().contains(q)) {
            results.add(SearchResult(
              bookId: book.id,
              chapter: cIdx + 1,
              verse: vIdx + 1,
              text: text,
            ));
            if (results.length >= limit) return results;
          }
        }
      }
    }
    return results;
  }

  static const List<VerseRef> _dailyVerses = [
    VerseRef(bookId: 19, chapter: 23, verse: 1), // Psalm 23:1
    VerseRef(bookId: 43, chapter: 3, verse: 16), // John 3:16
    VerseRef(bookId: 50, chapter: 4, verse: 13), // Phil 4:13
    VerseRef(bookId: 20, chapter: 3, verse: 5), // Prov 3:5
    VerseRef(bookId: 23, chapter: 40, verse: 31), // Isa 40:31
    VerseRef(bookId: 45, chapter: 8, verse: 28), // Rom 8:28
    VerseRef(bookId: 19, chapter: 46, verse: 1), // Psalm 46:1
    VerseRef(bookId: 6, chapter: 1, verse: 9), // Josh 1:9
    VerseRef(bookId: 24, chapter: 29, verse: 11), // Jer 29:11
    VerseRef(bookId: 40, chapter: 11, verse: 28), // Matt 11:28
    VerseRef(bookId: 43, chapter: 14, verse: 27), // John 14:27
    VerseRef(bookId: 19, chapter: 119, verse: 105), // Psalm 119:105
    VerseRef(bookId: 19, chapter: 27, verse: 1), // Psalm 27:1
    VerseRef(bookId: 45, chapter: 12, verse: 12), // Rom 12:12
    VerseRef(bookId: 48, chapter: 5, verse: 22), // Gal 5:22
    VerseRef(bookId: 50, chapter: 4, verse: 6), // Phil 4:6
    VerseRef(bookId: 40, chapter: 6, verse: 33), // Matt 6:33
    VerseRef(bookId: 23, chapter: 41, verse: 10), // Isa 41:10
    VerseRef(bookId: 19, chapter: 91, verse: 1), // Psalm 91:1
    VerseRef(bookId: 47, chapter: 12, verse: 9), // 2 Cor 12:9
    VerseRef(bookId: 58, chapter: 11, verse: 1), // Heb 11:1
    VerseRef(bookId: 62, chapter: 4, verse: 19), // 1 John 4:19
    VerseRef(bookId: 19, chapter: 121, verse: 1), // Psalm 121:1
    VerseRef(bookId: 20, chapter: 16, verse: 3), // Prov 16:3
  ];

  VerseRef getDailyVerseRef({int slotOffset = 0}) {
    final now = DateTime.now();
    final dayOfYear = now.difference(DateTime(now.year, 1, 1)).inDays;
    return _dailyVerses[(dayOfYear * 3 + slotOffset) % _dailyVerses.length];
  }
}
