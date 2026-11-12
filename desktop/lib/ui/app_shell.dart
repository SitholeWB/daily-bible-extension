import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/bible_models.dart';
import '../services/bible_repository.dart';
import '../services/storage_service.dart';
import 'cross_ref_panel.dart';
import 'study_note_dialog.dart';
import 'translations_panel.dart';

enum SidebarTab { books, search, bookmarks, notes, topics, translations }

class AppShell extends StatefulWidget {
  final BibleRepository repo;
  final StorageService storage;
  final VoidCallback onThemeChanged;

  const AppShell({
    super.key,
    required this.repo,
    required this.storage,
    required this.onThemeChanged,
  });

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  SidebarTab _activeTab = SidebarTab.books;
  bool _sidebarOpen = true;
  bool _inspectorOpen = false;
  bool _showDailyBanner = true;

  late int _bookId;
  late int _chapter;
  int? _highlightedVerse;
  List<String> _verses = [];
  List<String> _compareVerses = [];
  bool _loadingChapter = true;

  VerseRef? _selectedVerse;
  List<CrossRefGroup> _selectedCrossRefs = [];

  // Search state
  final TextEditingController _searchController = TextEditingController();
  List<SearchResult> _searchResults = [];
  bool _searching = false;

  // Book filter state
  String _bookFilter = '';
  String _testamentFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _bookId = widget.storage.lastBookId;
    _chapter = widget.storage.lastChapter;
    _loadCurrentChapter();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCurrentChapter({int? scrollToVerse}) async {
    setState(() => _loadingChapter = true);
    final verses = await widget.repo
        .loadChapter(widget.storage.translationId, _bookId, _chapter);
    List<String> compare = [];
    if (widget.storage.compareTranslationId != null) {
      compare = await widget.repo.loadChapter(
          widget.storage.compareTranslationId!, _bookId, _chapter);
    }

    widget.storage.lastBookId = _bookId;
    widget.storage.lastChapter = _chapter;
    await widget.storage.save();

    if (!mounted) return;
    setState(() {
      _verses = verses;
      _compareVerses = compare;
      _highlightedVerse = scrollToVerse;
      _loadingChapter = false;
    });
  }

  Future<void> _navigateTo(int bookId, int chapter, {int? verse}) async {
    final book = widget.repo.getBook(bookId);
    if (book == null) return;
    _bookId = bookId;
    _chapter = chapter.clamp(1, book.chapters);
    await _loadCurrentChapter(scrollToVerse: verse);
    if (verse != null) {
      await _inspectVerse(VerseRef(bookId: _bookId, chapter: _chapter, verse: verse),
          openInspector: false);
    }
  }

  void _prevChapter() {
    if (_chapter > 1) {
      _navigateTo(_bookId, _chapter - 1);
    } else if (_bookId > 1) {
      final prevBook = widget.repo.getBook(_bookId - 1);
      if (prevBook != null) {
        _navigateTo(prevBook.id, prevBook.chapters);
      }
    }
  }

  void _nextChapter() {
    final currentBook = widget.repo.getBook(_bookId);
    if (currentBook == null) return;
    if (_chapter < currentBook.chapters) {
      _navigateTo(_bookId, _chapter + 1);
    } else if (_bookId < 66) {
      _navigateTo(_bookId + 1, 1);
    }
  }

  Future<void> _inspectVerse(VerseRef ref, {bool openInspector = true}) async {
    final refs = await widget.repo
        .getCrossReferences(ref.bookId, ref.chapter, ref.verse);
    if (!mounted) return;
    setState(() {
      _selectedVerse = ref;
      _selectedCrossRefs = refs;
      _highlightedVerse = ref.verse;
      if (openInspector) _inspectorOpen = true;
    });
  }

  Future<void> _runSearch(String query) async {
    final trimmed = query.trim();
    // Direct reference jump (e.g. "John 3:16")
    final parsed = widget.repo.parseReference(trimmed);
    if (parsed != null && trimmed.contains(RegExp(r'\d'))) {
      await _navigateTo(parsed.bookId, parsed.chapter, verse: parsed.verse);
      return;
    }

    if (trimmed.length < 2) {
      setState(() => _searchResults = []);
      return;
    }
    setState(() => _searching = true);
    final results =
        await widget.repo.search(widget.storage.translationId, trimmed);
    if (!mounted) return;
    setState(() {
      _searchResults = results;
      _searching = false;
    });
  }

  Future<void> _openNoteDialog({StudyNote? existing, VerseRef? verseRef}) async {
    String? label;
    final targetRef = verseRef ?? existing?.verseRef;
    if (targetRef != null) {
      final b = widget.repo.getBook(targetRef.bookId);
      if (b != null) {
        label =
            '${b.displayName(widget.storage.translationId)} ${targetRef.chapter}:${targetRef.verse}';
      }
    }
    final saved = await showDialog<StudyNote>(
      context: context,
      builder: (_) => StudyNoteDialog(
        existing: existing,
        initialVerseRef: targetRef,
        verseLabel: label,
      ),
    );
    if (saved != null) {
      await widget.storage.upsertNote(saved);
      if (mounted) setState(() {});
    }
  }

  Future<void> _exportBackup() async {
    final path = await widget.storage.exportBackupToDocuments();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Backup exported to $path')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final book = widget.repo.getBook(_bookId);
    final translationId = widget.storage.translationId;
    final availableTranslations = widget.repo.availableTranslations;

    return Scaffold(
      body: Row(
        children: [
          // 1. Far-left Ubuntu Navigation Rail
          NavigationRail(
            selectedIndex: _activeTab.index,
            onDestinationSelected: (idx) {
              final next = SidebarTab.values[idx];
              setState(() {
                if (_activeTab == next) {
                  _sidebarOpen = !_sidebarOpen;
                } else {
                  _activeTab = next;
                  _sidebarOpen = true;
                }
              });
            },
            labelType: NavigationRailLabelType.all,
            leading: Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.asset('assets/icon.png', width: 32, height: 32),
              ),
            ),
            destinations: const [
              NavigationRailDestination(
                icon: Icon(Icons.menu_book_outlined),
                selectedIcon: Icon(Icons.menu_book),
                label: Text('Books'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.search_outlined),
                selectedIcon: Icon(Icons.search),
                label: Text('Search'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.bookmark_border),
                selectedIcon: Icon(Icons.bookmark),
                label: Text('Saved'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.edit_note_outlined),
                selectedIcon: Icon(Icons.edit_note),
                label: Text('Notes'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.explore_outlined),
                selectedIcon: Icon(Icons.explore),
                label: Text('Topics'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.translate_outlined),
                selectedIcon: Icon(Icons.translate),
                label: Text('Packs'),
              ),
            ],
          ),
          const VerticalDivider(width: 1),

          // 2. Left Sidebar Drawer
          if (_sidebarOpen)
            Container(
              width: 300,
              color: theme.colorScheme.surfaceContainerLow,
              child: _buildSidebarContent(translationId),
            ),
          if (_sidebarOpen) const VerticalDivider(width: 1),

          // 3. Main Scripture Reader Area
          Expanded(
            child: Column(
              children: [
                _buildTopToolbar(theme, book, availableTranslations),
                const Divider(height: 1),
                if (_showDailyBanner) _buildDailyBreadBanner(theme, translationId),
                Expanded(
                  child: _loadingChapter
                      ? const Center(child: CircularProgressIndicator())
                      : _verses.isEmpty
                          ? Center(
                              child: Text(
                                'No verses found for this chapter.',
                                style: theme.textTheme.bodyLarge,
                              ),
                            )
                          : _buildChapterReader(theme, book, translationId),
                ),
              ],
            ),
          ),

          // 4. Right Study Inspector
          if (_inspectorOpen)
            CrossRefPanel(
              repo: widget.repo,
              translationId: translationId,
              selectedVerse: _selectedVerse,
              crossRefs: _selectedCrossRefs,
              verseNotes: _selectedVerse != null
                  ? widget.storage.notesForVerse(
                      _selectedVerse!.bookId,
                      _selectedVerse!.chapter,
                      _selectedVerse!.verse,
                    )
                  : const [],
              onNavigate: (ref) =>
                  _navigateTo(ref.bookId, ref.chapter, verse: ref.verse),
              onAddNote: () => _openNoteDialog(verseRef: _selectedVerse),
              onEditNote: (note) => _openNoteDialog(existing: note),
              onClose: () => setState(() => _inspectorOpen = false),
            ),
        ],
      ),
    );
  }

  Widget _buildTopToolbar(
    ThemeData theme,
    BibleBook? book,
    List<TranslationInfo> availableTranslations,
  ) {
    final translationId = widget.storage.translationId;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      color: theme.colorScheme.surface,
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          IconButton(
            tooltip: _sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar',
            icon: Icon(
              _sidebarOpen ? Icons.menu_open : Icons.menu,
              size: 20,
            ),
            onPressed: () => setState(() => _sidebarOpen = !_sidebarOpen),
          ),
          // Book + Chapter Pill
          if (book != null)
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  tooltip: 'Previous Chapter',
                  icon: const Icon(Icons.chevron_left),
                  onPressed: _prevChapter,
                ),
                DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    value: _bookId,
                    items: widget.repo.books
                        .map((b) => DropdownMenuItem(
                              value: b.id,
                              child: Text(
                                b.displayName(translationId),
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600),
                              ),
                            ))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) _navigateTo(val, 1);
                    },
                  ),
                ),
                const SizedBox(width: 4),
                DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    value: _chapter,
                    items: List.generate(book.chapters, (i) => i + 1)
                        .map((ch) => DropdownMenuItem(
                              value: ch,
                              child: Text('Ch $ch'),
                            ))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) _navigateTo(_bookId, val);
                    },
                  ),
                ),
                IconButton(
                  tooltip: 'Next Chapter',
                  icon: const Icon(Icons.chevron_right),
                  onPressed: _nextChapter,
                ),
              ],
            ),

          // Primary Translation Picker
          DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: availableTranslations
                      .any((t) => t.id == widget.storage.translationId)
                  ? widget.storage.translationId
                  : 'kjv',
              items: availableTranslations
                  .map((t) => DropdownMenuItem(
                        value: t.id,
                        child: Text(t.shortName),
                      ))
                  .toList(),
              onChanged: (val) {
                if (val != null) {
                  setState(() => widget.storage.translationId = val);
                  _loadCurrentChapter();
                }
              },
            ),
          ),

          // Parallel Compare Picker
          DropdownButtonHideUnderline(
            child: DropdownButton<String?>(
              value: widget.storage.compareTranslationId,
              hint: const Text('Compare: Off'),
              items: [
                const DropdownMenuItem<String?>(
                  value: null,
                  child: Text('Compare: Off'),
                ),
                ...availableTranslations
                    .where((t) => t.id != widget.storage.translationId)
                    .map((t) => DropdownMenuItem<String?>(
                          value: t.id,
                          child: Text('vs ${t.shortName}'),
                        )),
              ],
              onChanged: (val) {
                setState(() => widget.storage.compareTranslationId = val);
                _loadCurrentChapter();
              },
            ),
          ),

          // Font size controls
          IconButton(
            tooltip: 'Decrease Font Size',
            icon: const Icon(Icons.text_decrease, size: 19),
            onPressed: () {
              setState(() {
                widget.storage.fontSize =
                    (widget.storage.fontSize - 1).clamp(13.0, 28.0);
              });
              widget.storage.save();
            },
          ),
          IconButton(
            tooltip: 'Increase Font Size',
            icon: const Icon(Icons.text_increase, size: 19),
            onPressed: () {
              setState(() {
                widget.storage.fontSize =
                    (widget.storage.fontSize + 1).clamp(13.0, 28.0);
              });
              widget.storage.save();
            },
          ),

          // Theme mode toggle
          IconButton(
            tooltip: 'Switch Theme (System / Light / Dark)',
            icon: Icon(
              widget.storage.themeMode == ThemeMode.dark
                  ? Icons.dark_mode
                  : widget.storage.themeMode == ThemeMode.light
                      ? Icons.light_mode
                      : Icons.brightness_auto,
              size: 19,
            ),
            onPressed: () {
              widget.storage.themeMode = switch (widget.storage.themeMode) {
                ThemeMode.system => ThemeMode.light,
                ThemeMode.light => ThemeMode.dark,
                ThemeMode.dark => ThemeMode.system,
              };
              widget.storage.save();
              widget.onThemeChanged();
            },
          ),

          // Export backup
          IconButton(
            tooltip: 'Export Notes & Bookmarks Backup',
            icon: const Icon(Icons.save_alt, size: 19),
            onPressed: _exportBackup,
          ),

          // Study Inspector Toggle
          FilledButton.tonalIcon(
            onPressed: () => setState(() => _inspectorOpen = !_inspectorOpen),
            icon: const Icon(Icons.auto_stories_outlined, size: 17),
            label: Text(_inspectorOpen ? 'Hide Study' : 'Cross-Refs'),
          ),
        ],
      ),
    );
  }

  Widget _buildDailyBreadBanner(ThemeData theme, String translationId) {
    final dailyRef = widget.repo.getDailyVerseRef();
    final dailyBook = widget.repo.getBook(dailyRef.bookId);
    return FutureBuilder<String?>(
      future: widget.repo.getVerseText(
          translationId, dailyRef.bookId, dailyRef.chapter, dailyRef.verse),
      builder: (context, snapshot) {
        final text = snapshot.data;
        if (text == null || dailyBook == null) return const SizedBox.shrink();
        return Container(
          width: double.infinity,
          margin: const EdgeInsets.fromLTRB(24, 14, 24, 4),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: theme.colorScheme.primaryContainer.withValues(alpha: 0.45),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: theme.colorScheme.primary.withValues(alpha: 0.25),
            ),
          ),
          child: Row(
            children: [
              Icon(Icons.wb_sunny_outlined, color: theme.colorScheme.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Daily Bread • ${dailyBook.displayName(translationId)} ${dailyRef.chapter}:${dailyRef.verse}',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      text,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: () => _navigateTo(
                    dailyRef.bookId, dailyRef.chapter,
                    verse: dailyRef.verse),
                child: const Text('Read'),
              ),
              IconButton(
                tooltip: 'Dismiss',
                icon: const Icon(Icons.close, size: 16),
                onPressed: () => setState(() => _showDailyBanner = false),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildChapterReader(
      ThemeData theme, BibleBook? book, String translationId) {
    final isComparing = _compareVerses.isNotEmpty &&
        widget.storage.compareTranslationId != null;

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(28, 16, 28, 48),
      itemCount: _verses.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${book?.displayName(translationId) ?? ''} $_chapter',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  widget.repo.getTranslation(translationId)?.name ??
                      translationId.toUpperCase(),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          );
        }

        final verseNum = index;
        final text = _verses[verseNum - 1];
        final compareText =
            isComparing && verseNum - 1 < _compareVerses.length
                ? _compareVerses[verseNum - 1]
                : null;
        final isBookmarked =
            widget.storage.isBookmarked(_bookId, _chapter, verseNum);
        final verseNotes =
            widget.storage.notesForVerse(_bookId, _chapter, verseNum);
        final isSelected = _highlightedVerse == verseNum;

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? theme.colorScheme.primaryContainer.withValues(alpha: 0.35)
                : theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected
                  ? theme.colorScheme.primary.withValues(alpha: 0.5)
                  : theme.dividerColor.withValues(alpha: 0.25),
            ),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(10),
            onTap: () => _inspectVerse(
              VerseRef(bookId: _bookId, chapter: _chapter, verse: verseNum),
              openInspector: false,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 28,
                      alignment: Alignment.topLeft,
                      padding: const EdgeInsets.only(top: 3),
                      child: Text(
                        '$verseNum',
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Expanded(
                      child: isComparing && compareText != null
                          ? Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: SelectableText(
                                    text,
                                    style: TextStyle(
                                      fontSize: widget.storage.fontSize,
                                      height: 1.55,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 20),
                                Expanded(
                                  child: SelectableText(
                                    compareText,
                                    style: TextStyle(
                                      fontSize: widget.storage.fontSize,
                                      height: 1.55,
                                      color:
                                          theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                ),
                              ],
                            )
                          : SelectableText(
                              text,
                              style: TextStyle(
                                fontSize: widget.storage.fontSize,
                                height: 1.55,
                              ),
                            ),
                    ),
                    const SizedBox(width: 8),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          tooltip: isBookmarked
                              ? 'Remove Bookmark'
                              : 'Bookmark Verse',
                          icon: Icon(
                            isBookmarked
                                ? Icons.bookmark
                                : Icons.bookmark_border,
                            size: 18,
                            color: isBookmarked
                                ? theme.colorScheme.primary
                                : theme.colorScheme.onSurfaceVariant,
                          ),
                          onPressed: () async {
                            await widget.storage.toggleBookmark(
                                _bookId, _chapter, verseNum, translationId);
                            setState(() {});
                          },
                        ),
                        IconButton(
                          tooltip: verseNotes.isNotEmpty
                              ? 'Study Notes (${verseNotes.length})'
                              : 'Add Study Note',
                          icon: Icon(
                            verseNotes.isNotEmpty
                                ? Icons.sticky_note_2
                                : Icons.note_add_outlined,
                            size: 18,
                            color: verseNotes.isNotEmpty
                                ? theme.colorScheme.secondary
                                : theme.colorScheme.onSurfaceVariant,
                          ),
                          onPressed: () => _openNoteDialog(
                            verseRef: VerseRef(
                                bookId: _bookId,
                                chapter: _chapter,
                                verse: verseNum),
                          ),
                        ),
                        IconButton(
                          tooltip: 'Cross-References',
                          icon: Icon(
                            Icons.hub_outlined,
                            size: 18,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                          onPressed: () => _inspectVerse(
                            VerseRef(
                                bookId: _bookId,
                                chapter: _chapter,
                                verse: verseNum),
                          ),
                        ),
                        IconButton(
                          tooltip: 'Copy Verse',
                          icon: Icon(
                            Icons.copy,
                            size: 17,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                          onPressed: () {
                            final refLabel =
                                '${book?.displayName(translationId) ?? ''} $_chapter:$verseNum';
                            Clipboard.setData(
                                ClipboardData(text: '$refLabel — $text'));
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Copied $refLabel')),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSidebarContent(String translationId) {
    switch (_activeTab) {
      case SidebarTab.books:
        return _buildBooksSidebar(translationId);
      case SidebarTab.search:
        return _buildSearchSidebar(translationId);
      case SidebarTab.bookmarks:
        return _buildBookmarksSidebar(translationId);
      case SidebarTab.notes:
        return _buildNotesSidebar(translationId);
      case SidebarTab.topics:
        return _buildTopicsSidebar(translationId);
      case SidebarTab.translations:
        return TranslationsPanel(
          repo: widget.repo,
          activeTranslationId: translationId,
          onSelectTranslation: (id) {
            setState(() => widget.storage.translationId = id);
            _loadCurrentChapter();
          },
          onCatalogUpdated: () => setState(() {}),
        );
    }
  }

  Widget _buildBooksSidebar(String translationId) {
    final q = _bookFilter.trim().toLowerCase();
    final filteredBooks = widget.repo.books.where((b) {
      if (_testamentFilter != 'ALL' && b.testament != _testamentFilter) {
        return false;
      }
      if (q.isEmpty) return true;
      return b.name.toLowerCase().contains(q) ||
          b.zuluName.toLowerCase().contains(q);
    }).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
          child: Column(
            children: [
              TextField(
                decoration: const InputDecoration(
                  hintText: 'Filter books...',
                  prefixIcon: Icon(Icons.search, size: 18),
                  isDense: true,
                  border: OutlineInputBorder(),
                ),
                onChanged: (v) => setState(() => _bookFilter = v),
              ),
              const SizedBox(height: 8),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'ALL', label: Text('All')),
                  ButtonSegment(value: 'OT', label: Text('OT')),
                  ButtonSegment(value: 'NT', label: Text('NT')),
                ],
                selected: {_testamentFilter},
                onSelectionChanged: (s) =>
                    setState(() => _testamentFilter = s.first),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: filteredBooks.length,
            itemBuilder: (context, idx) {
              final b = filteredBooks[idx];
              final isSelected = b.id == _bookId;
              return ExpansionTile(
                key: PageStorageKey('book_${b.id}'),
                initiallyExpanded: isSelected,
                title: Text(
                  b.displayName(translationId),
                  style: TextStyle(
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
                subtitle: Text('${b.chapters} chapters'),
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: List.generate(b.chapters, (cIdx) {
                        final ch = cIdx + 1;
                        final active = isSelected && ch == _chapter;
                        return InkWell(
                          borderRadius: BorderRadius.circular(6),
                          onTap: () => _navigateTo(b.id, ch),
                          child: Container(
                            width: 38,
                            height: 30,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: active
                                  ? Theme.of(context).colorScheme.primary
                                  : Theme.of(context)
                                      .colorScheme
                                      .surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '$ch',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: active
                                    ? Theme.of(context).colorScheme.onPrimary
                                    : null,
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSearchSidebar(String translationId) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Word or ref (e.g. John 3:16)...',
              prefixIcon: const Icon(Icons.search, size: 18),
              isDense: true,
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                icon: const Icon(Icons.arrow_forward, size: 18),
                onPressed: () => _runSearch(_searchController.text),
              ),
            ),
            onSubmitted: _runSearch,
          ),
        ),
        if (_searching)
          const Padding(
            padding: EdgeInsets.all(16),
            child: CircularProgressIndicator(),
          )
        else
          Expanded(
            child: ListView.builder(
              itemCount: _searchResults.length,
              itemBuilder: (context, idx) {
                final res = _searchResults[idx];
                final b = widget.repo.getBook(res.bookId);
                return ListTile(
                  dense: true,
                  title: Text(
                    '${b?.displayName(translationId) ?? ''} ${res.chapter}:${res.verse}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text(
                    res.text,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  onTap: () => _navigateTo(res.bookId, res.chapter,
                      verse: res.verse),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildBookmarksSidebar(String translationId) {
    final bookmarks = widget.storage.bookmarks;
    if (bookmarks.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('No bookmarks yet. Tap the bookmark icon on any verse.'),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: bookmarks.length,
      itemBuilder: (context, idx) {
        final bm = bookmarks[idx];
        final b = widget.repo.getBook(bm.bookId);
        return Card(
          margin: const EdgeInsets.only(bottom: 6),
          child: ListTile(
            dense: true,
            title: Text(
              '${b?.displayName(translationId) ?? ''} ${bm.chapter}:${bm.verse}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(bm.translationId.toUpperCase()),
            trailing: IconButton(
              icon: const Icon(Icons.delete_outline, size: 18),
              onPressed: () async {
                await widget.storage.toggleBookmark(
                    bm.bookId, bm.chapter, bm.verse, bm.translationId);
                setState(() {});
              },
            ),
            onTap: () =>
                _navigateTo(bm.bookId, bm.chapter, verse: bm.verse),
          ),
        );
      },
    );
  }

  Widget _buildNotesSidebar(String translationId) {
    final notes = widget.storage.notes;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => _openNoteDialog(),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('New Study Note'),
            ),
          ),
        ),
        Expanded(
          child: notes.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Text('No study notes yet.'),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  itemCount: notes.length,
                  itemBuilder: (context, idx) {
                    final note = notes[idx];
                    final ref = note.verseRef;
                    final refBook =
                        ref != null ? widget.repo.getBook(ref.bookId) : null;
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        title: Text(
                          note.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (ref != null && refBook != null)
                              Text(
                                '${refBook.displayName(translationId)} ${ref.chapter}:${ref.verse}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                            if (note.content.isNotEmpty)
                              Text(
                                note.content,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                          ],
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete_outline, size: 18),
                          onPressed: () async {
                            await widget.storage.deleteNote(note.id);
                            setState(() {});
                          },
                        ),
                        onTap: () {
                          if (ref != null) {
                            _navigateTo(ref.bookId, ref.chapter,
                                verse: ref.verse);
                          }
                          _openNoteDialog(existing: note);
                        },
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildTopicsSidebar(String translationId) {
    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: widget.repo.topics.length,
      itemBuilder: (context, idx) {
        final topic = widget.repo.topics[idx];
        final title = translationId == 'zulu' ? topic.zuluName : topic.name;
        return ExpansionTile(
          title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text(topic.description, maxLines: 2),
          children: topic.verses.map((ref) {
            final b = widget.repo.getBook(ref.bookId);
            return ListTile(
              dense: true,
              title: Text(
                  '${b?.displayName(translationId) ?? ''} ${ref.chapter}:${ref.verse}'),
              onTap: () =>
                  _navigateTo(ref.bookId, ref.chapter, verse: ref.verse),
            );
          }).toList(),
        );
      },
    );
  }
}
