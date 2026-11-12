import 'package:flutter/material.dart';
import '../models/bible_models.dart';
import '../services/bible_repository.dart';

class CrossRefPanel extends StatelessWidget {
  final BibleRepository repo;
  final String translationId;
  final VerseRef? selectedVerse;
  final List<CrossRefGroup> crossRefs;
  final List<StudyNote> verseNotes;
  final void Function(VerseRef ref) onNavigate;
  final VoidCallback onAddNote;
  final void Function(StudyNote note) onEditNote;
  final VoidCallback onClose;

  const CrossRefPanel({
    super.key,
    required this.repo,
    required this.translationId,
    required this.selectedVerse,
    required this.crossRefs,
    required this.verseNotes,
    required this.onNavigate,
    required this.onAddNote,
    required this.onEditNote,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final book =
        selectedVerse != null ? repo.getBook(selectedVerse!.bookId) : null;
    final headerTitle = selectedVerse != null && book != null
        ? '${book.displayName(translationId)} ${selectedVerse!.chapter}:${selectedVerse!.verse}'
        : 'Study Inspector';

    return Container(
      width: 340,
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        border: Border(
          left: BorderSide(color: theme.dividerColor, width: 1),
        ),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
            child: Row(
              children: [
                const Icon(Icons.auto_stories_outlined, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    headerTitle,
                    style: theme.textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.w600),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(
                  tooltip: 'Close Inspector',
                  icon: const Icon(Icons.close, size: 18),
                  onPressed: onClose,
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: selectedVerse == null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'Select any verse to view Treasury of Scripture Knowledge cross-references and study notes.',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.all(14),
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Study Notes (${verseNotes.length})',
                            style: theme.textTheme.labelLarge,
                          ),
                          TextButton.icon(
                            onPressed: onAddNote,
                            icon: const Icon(Icons.add, size: 16),
                            label: const Text('Add Note'),
                          ),
                        ],
                      ),
                      if (verseNotes.isEmpty)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(
                            'No notes for this verse yet.',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        )
                      else
                        ...verseNotes.map(
                          (note) => Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(10),
                              onTap: () => onEditNote(note),
                              child: Padding(
                                padding: const EdgeInsets.all(10),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      note.title,
                                      style: theme.textTheme.titleSmall,
                                    ),
                                    if (note.content.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        note.content,
                                        maxLines: 3,
                                        overflow: TextOverflow.ellipsis,
                                        style: theme.textTheme.bodySmall,
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      const SizedBox(height: 12),
                      Text(
                        'Cross-References (${crossRefs.fold<int>(0, (sum, g) => sum + g.refs.length)})',
                        style: theme.textTheme.labelLarge,
                      ),
                      const SizedBox(height: 8),
                      if (crossRefs.isEmpty)
                        Text(
                          'No cross-references indexed for this verse.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        )
                      else
                        ...crossRefs.map(
                          (group) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (group.anchor.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 6),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color:
                                            theme.colorScheme.primaryContainer,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        '"${group.anchor}"',
                                        style: theme.textTheme.labelSmall
                                            ?.copyWith(
                                          color: theme
                                              .colorScheme.onPrimaryContainer,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ),
                                ...group.refs.map((refStr) {
                                  final parsed = repo.parseReference(refStr);
                                  return _CrossRefTile(
                                    repo: repo,
                                    translationId: translationId,
                                    refLabel: refStr,
                                    parsedRef: parsed,
                                    onTap: parsed != null
                                        ? () => onNavigate(parsed)
                                        : null,
                                  );
                                }),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _CrossRefTile extends StatelessWidget {
  final BibleRepository repo;
  final String translationId;
  final String refLabel;
  final VerseRef? parsedRef;
  final VoidCallback? onTap;

  const _CrossRefTile({
    required this.repo,
    required this.translationId,
    required this.refLabel,
    required this.parsedRef,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      elevation: 0,
      color: theme.colorScheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: theme.dividerColor.withValues(alpha: 0.5)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    refLabel,
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  if (onTap != null)
                    Icon(Icons.arrow_forward,
                        size: 14, color: theme.colorScheme.primary),
                ],
              ),
              if (parsedRef != null)
                FutureBuilder<String?>(
                  future: repo.getVerseText(
                    translationId,
                    parsedRef!.bookId,
                    parsedRef!.chapter,
                    parsedRef!.verse,
                  ),
                  builder: (context, snapshot) {
                    final text = snapshot.data;
                    if (text == null || text.isEmpty) {
                      return const SizedBox.shrink();
                    }
                    return Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        text,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall,
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
