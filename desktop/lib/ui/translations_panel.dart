import 'package:flutter/material.dart';
import '../models/bible_models.dart';
import '../services/bible_repository.dart';

class TranslationsPanel extends StatefulWidget {
  final BibleRepository repo;
  final String activeTranslationId;
  final void Function(String translationId) onSelectTranslation;
  final VoidCallback onCatalogUpdated;

  const TranslationsPanel({
    super.key,
    required this.repo,
    required this.activeTranslationId,
    required this.onSelectTranslation,
    required this.onCatalogUpdated,
  });

  @override
  State<TranslationsPanel> createState() => _TranslationsPanelState();
}

class _TranslationsPanelState extends State<TranslationsPanel> {
  String _filter = '';
  final Set<String> _downloading = {};

  Future<void> _download(TranslationInfo info) async {
    setState(() => _downloading.add(info.id));
    try {
      await widget.repo.downloadTranslation(info);
      widget.onCatalogUpdated();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${info.name} is ready offline!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to download ${info.shortName}: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _downloading.remove(info.id));
    }
  }

  Future<void> _delete(TranslationInfo info) async {
    await widget.repo.deleteTranslation(info.id);
    if (widget.activeTranslationId == info.id) {
      widget.onSelectTranslation('kjv');
    } else {
      widget.onCatalogUpdated();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final q = _filter.trim().toLowerCase();
    final filtered = widget.repo.catalog.where((t) {
      if (q.isEmpty) return true;
      return t.name.toLowerCase().contains(q) ||
          t.language.toLowerCase().contains(q) ||
          t.shortName.toLowerCase().contains(q) ||
          t.region.toLowerCase().contains(q);
    }).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            decoration: const InputDecoration(
              hintText: 'Filter 60 languages & packs...',
              prefixIcon: Icon(Icons.search, size: 18),
              isDense: true,
              border: OutlineInputBorder(),
            ),
            onChanged: (v) => setState(() => _filter = v),
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            itemCount: filtered.length,
            itemBuilder: (context, idx) {
              final item = filtered[idx];
              final available = widget.repo.isTranslationAvailable(item.id);
              final isActive = widget.activeTranslationId == item.id;
              final isBusy = _downloading.contains(item.id);

              return Card(
                margin: const EdgeInsets.only(bottom: 6),
                elevation: 0,
                color: isActive
                    ? theme.colorScheme.primaryContainer.withValues(alpha: 0.45)
                    : theme.colorScheme.surface,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: BorderSide(
                    color: isActive
                        ? theme.colorScheme.primary
                        : theme.dividerColor.withValues(alpha: 0.4),
                  ),
                ),
                child: ListTile(
                  dense: true,
                  onTap: available
                      ? () => widget.onSelectTranslation(item.id)
                      : null,
                  title: Text(
                    item.name,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                    ),
                  ),
                  subtitle: Text(
                    '${item.language} • ${item.region} • ${(item.sizeKB / 1024).toStringAsFixed(1)} MB',
                    style: theme.textTheme.bodySmall,
                  ),
                  trailing: isBusy
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : available
                          ? Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (isActive)
                                  Icon(Icons.check_circle,
                                      size: 18,
                                      color: theme.colorScheme.primary),
                                if (!item.bundled)
                                  IconButton(
                                    tooltip: 'Remove offline pack',
                                    icon: const Icon(Icons.delete_outline,
                                        size: 18),
                                    onPressed: () => _delete(item),
                                  ),
                              ],
                            )
                          : IconButton(
                              tooltip: 'Download offline pack',
                              icon: const Icon(Icons.download_outlined,
                                  size: 19),
                              onPressed: () => _download(item),
                            ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
