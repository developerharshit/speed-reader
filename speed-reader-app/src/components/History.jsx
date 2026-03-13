import { useEffect, useState } from 'react';
import { loadHistory, removeFromHistory } from '../utils/storage';
import { getCachedFile, removeCachedFile } from '../utils/fileCache';

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function History({ onResume, refreshKey }) {
  const history = loadHistory();
  const [cachedTitles, setCachedTitles] = useState(new Set());

  useEffect(() => {
    // Check which history entries have a cached file
    let cancelled = false;
    async function checkCache() {
      const results = await Promise.all(
        history.map(async (entry) => {
          const cached = await getCachedFile(entry.title);
          return cached ? entry.title : null;
        })
      );
      if (!cancelled) {
        setCachedTitles(new Set(results.filter(Boolean)));
      }
    }
    checkCache();
    return () => { cancelled = true; };
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-md mt-8 px-4">
      <h3 className="text-sm font-medium text-secondary mb-3 uppercase tracking-wide">
        Recent Books
      </h3>
      <div className="flex flex-col gap-2">
        {history.map((entry) => {
          const pct = Math.round((entry.wordIndex / entry.totalWords) * 100);
          const isCached = cachedTitles.has(entry.title);
          return (
            <div
              key={entry.title}
              className="rounded-xl border border-theme bg-card p-3 hover:bg-secondary transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => onResume(entry)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary uppercase font-mono">
                      {entry.type}
                    </span>
                    <span className="text-xs text-secondary">{timeAgo(entry.lastRead)}</span>
                    {isCached && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] font-medium">
                        Tap to open
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-primary text-sm truncate">{entry.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-secondary flex-shrink-0">{pct}%</span>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(entry.title);
                    removeCachedFile(entry.title);
                    onResume(null);
                  }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-primary"
                  title="Remove from history"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
