class BibleBook {
  final int id;
  final String code;
  final String name;
  final String zuluName;
  final int chapters;
  final String testament;
  final List<String> aliases;

  const BibleBook({
    required this.id,
    required this.code,
    required this.name,
    required this.zuluName,
    required this.chapters,
    required this.testament,
    required this.aliases,
  });

  factory BibleBook.fromJson(Map<String, dynamic> json) {
    return BibleBook(
      id: json['id'] as int,
      code: (json['code'] ?? '') as String,
      name: json['name'] as String,
      zuluName: (json['zuluName'] ?? json['name']) as String,
      chapters: json['chapters'] as int,
      testament: (json['testament'] ?? 'OT') as String,
      aliases: List<String>.from(json['aliases'] ?? const []),
    );
  }

  String displayName(String translationId) {
    if (translationId == 'zulu' && zuluName.isNotEmpty) {
      return zuluName;
    }
    return name;
  }
}

class TranslationInfo {
  final String id;
  final String languageCode;
  final String language;
  final String name;
  final String shortName;
  final String direction;
  final String copyright;
  final bool bundled;
  final int sizeKB;
  final String region;
  final String? downloadUrl;

  const TranslationInfo({
    required this.id,
    required this.languageCode,
    required this.language,
    required this.name,
    required this.shortName,
    required this.direction,
    required this.copyright,
    required this.bundled,
    required this.sizeKB,
    required this.region,
    this.downloadUrl,
  });

  factory TranslationInfo.fromJson(Map<String, dynamic> json) {
    return TranslationInfo(
      id: json['id'] as String,
      languageCode: (json['languageCode'] ?? '') as String,
      language: (json['language'] ?? '') as String,
      name: json['name'] as String,
      shortName: (json['shortName'] ?? json['id']) as String,
      direction: (json['direction'] ?? 'ltr') as String,
      copyright: (json['copyright'] ?? '') as String,
      bundled: (json['bundled'] ?? false) as bool,
      sizeKB: (json['sizeKB'] ?? 0) as int,
      region: (json['region'] ?? 'Other') as String,
      downloadUrl: json['downloadUrl'] as String?,
    );
  }
}

class VerseRef {
  final int bookId;
  final int chapter;
  final int verse;

  const VerseRef({
    required this.bookId,
    required this.chapter,
    required this.verse,
  });

  factory VerseRef.fromJson(Map<String, dynamic> json) {
    return VerseRef(
      bookId: json['bookId'] as int,
      chapter: json['chapter'] as int,
      verse: json['verse'] as int,
    );
  }

  Map<String, dynamic> toJson() => {
        'bookId': bookId,
        'chapter': chapter,
        'verse': verse,
      };

  String get key => '$bookId:$chapter:$verse';

  @override
  bool operator ==(Object other) =>
      other is VerseRef &&
      other.bookId == bookId &&
      other.chapter == chapter &&
      other.verse == verse;

  @override
  int get hashCode => Object.hash(bookId, chapter, verse);
}

class CrossRefGroup {
  final String anchor;
  final List<String> refs;

  const CrossRefGroup({required this.anchor, required this.refs});

  factory CrossRefGroup.fromJson(Map<String, dynamic> json) {
    return CrossRefGroup(
      anchor: (json['anchor'] ?? '') as String,
      refs: List<String>.from(json['refs'] ?? const []),
    );
  }
}

class CuratedTopic {
  final String id;
  final String name;
  final String zuluName;
  final String description;
  final List<VerseRef> verses;

  const CuratedTopic({
    required this.id,
    required this.name,
    required this.zuluName,
    required this.description,
    required this.verses,
  });

  factory CuratedTopic.fromJson(Map<String, dynamic> json) {
    return CuratedTopic(
      id: json['id'] as String,
      name: json['name'] as String,
      zuluName: (json['zuluName'] ?? json['name']) as String,
      description: (json['description'] ?? '') as String,
      verses: (json['verses'] as List<dynamic>? ?? [])
          .map((e) => VerseRef.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class Bookmark {
  final String id;
  final int bookId;
  final int chapter;
  final int verse;
  final String translationId;
  final String note;
  final DateTime createdAt;

  const Bookmark({
    required this.id,
    required this.bookId,
    required this.chapter,
    required this.verse,
    required this.translationId,
    this.note = '',
    required this.createdAt,
  });

  factory Bookmark.fromJson(Map<String, dynamic> json) {
    return Bookmark(
      id: json['id'] as String,
      bookId: json['bookId'] as int,
      chapter: json['chapter'] as int,
      verse: json['verse'] as int,
      translationId: (json['translationId'] ?? 'kjv') as String,
      note: (json['note'] ?? '') as String,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'bookId': bookId,
        'chapter': chapter,
        'verse': verse,
        'translationId': translationId,
        'note': note,
        'createdAt': createdAt.toIso8601String(),
      };
}

class StudyNote {
  final String id;
  final String title;
  final String content;
  final VerseRef? verseRef;
  final List<String> tags;
  final DateTime createdAt;
  final DateTime updatedAt;

  const StudyNote({
    required this.id,
    required this.title,
    required this.content,
    this.verseRef,
    this.tags = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  StudyNote copyWith({
    String? title,
    String? content,
    VerseRef? verseRef,
    List<String>? tags,
    DateTime? updatedAt,
  }) {
    return StudyNote(
      id: id,
      title: title ?? this.title,
      content: content ?? this.content,
      verseRef: verseRef ?? this.verseRef,
      tags: tags ?? this.tags,
      createdAt: createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }

  factory StudyNote.fromJson(Map<String, dynamic> json) {
    return StudyNote(
      id: json['id'] as String,
      title: (json['title'] ?? 'Untitled Note') as String,
      content: (json['content'] ?? '') as String,
      verseRef: json['verseRef'] != null
          ? VerseRef.fromJson(json['verseRef'] as Map<String, dynamic>)
          : null,
      tags: List<String>.from(json['tags'] ?? const []),
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'content': content,
        'verseRef': verseRef?.toJson(),
        'tags': tags,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

class SearchResult {
  final int bookId;
  final int chapter;
  final int verse;
  final String text;

  const SearchResult({
    required this.bookId,
    required this.chapter,
    required this.verse,
    required this.text,
  });
}
