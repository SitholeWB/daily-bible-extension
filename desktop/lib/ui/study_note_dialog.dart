import 'package:flutter/material.dart';
import '../models/bible_models.dart';

class StudyNoteDialog extends StatefulWidget {
  final StudyNote? existing;
  final VerseRef? initialVerseRef;
  final String? verseLabel;

  const StudyNoteDialog({
    super.key,
    this.existing,
    this.initialVerseRef,
    this.verseLabel,
  });

  @override
  State<StudyNoteDialog> createState() => _StudyNoteDialogState();
}

class _StudyNoteDialogState extends State<StudyNoteDialog> {
  late final TextEditingController _titleController;
  late final TextEditingController _contentController;
  late final TextEditingController _tagsController;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(
      text: widget.existing?.title ??
          (widget.verseLabel != null ? 'Study Note: ${widget.verseLabel}' : ''),
    );
    _contentController =
        TextEditingController(text: widget.existing?.content ?? '');
    _tagsController = TextEditingController(
      text: widget.existing?.tags.join(', ') ?? '',
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  void _submit() {
    final title = _titleController.text.trim();
    final content = _contentController.text.trim();
    if (title.isEmpty && content.isEmpty) return;

    final tags = _tagsController.text
        .split(',')
        .map((t) => t.trim())
        .where((t) => t.isNotEmpty)
        .toList();

    final now = DateTime.now();
    final note = widget.existing != null
        ? widget.existing!.copyWith(
            title: title.isEmpty ? 'Untitled Note' : title,
            content: content,
            tags: tags,
            updatedAt: now,
          )
        : StudyNote(
            id: 'note_${now.millisecondsSinceEpoch}',
            title: title.isEmpty ? 'Untitled Note' : title,
            content: content,
            verseRef: widget.initialVerseRef,
            tags: tags,
            createdAt: now,
            updatedAt: now,
          );

    Navigator.of(context).pop(note);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.existing != null ? 'Edit Study Note' : 'New Study Note'),
      content: SizedBox(
        width: 560,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (widget.verseLabel != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    const Icon(Icons.menu_book_outlined, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      widget.verseLabel!,
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                  ],
                ),
              ),
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Title',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _contentController,
              maxLines: 10,
              minLines: 7,
              decoration: const InputDecoration(
                labelText: 'Study Notes (Markdown supported)',
                alignLabelWithHint: true,
                border: OutlineInputBorder(),
                hintText: 'Write reflections, sermon notes, or word studies...',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _tagsController,
              decoration: const InputDecoration(
                labelText: 'Tags (comma-separated)',
                border: OutlineInputBorder(),
                hintText: 'grace, prayer, sermon',
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton.icon(
          onPressed: _submit,
          icon: const Icon(Icons.save_outlined, size: 18),
          label: const Text('Save Note'),
        ),
      ],
    );
  }
}
