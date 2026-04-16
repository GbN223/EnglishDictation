import { useDictationStore } from '../store/dictationStore';
import { FileText, Trash2, Loader2 } from 'lucide-react';

export default function DraftsManager() {
  const { drafts, loadDraft, deleteDraft } = useDictationStore();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (drafts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">No saved drafts yet</p>
        <p className="text-xs text-muted-foreground">Save your dictation to access it later</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">Saved Drafts ({drafts.length})</h3>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {drafts.map((draft) => (
          <div
            key={draft.id}
            className="flex items-start justify-between border-b border-border px-4 py-3 last:border-0 hover:bg-accent/50 transition-colors"
          >
            <button
              onClick={() => loadDraft(draft.id)}
              className="flex-1 text-left"
            >
              <p className="line-clamp-2 text-sm font-medium">{draft.content || 'Empty draft'}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatDate(draft.updatedAt)}</span>
                <span>{draft.wordCount} words</span>
              </div>
            </button>
            <button
              onClick={() => deleteDraft(draft.id)}
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-md hover:bg-destructive/10 transition-colors"
              aria-label="Delete draft"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
