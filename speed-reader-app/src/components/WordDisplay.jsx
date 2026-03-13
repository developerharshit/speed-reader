import { useMemo } from 'react';

function findFocalPoint(word) {
  const len = word.length;
  if (len <= 1) return 0;
  if (len <= 3) return 1;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}

export default function WordDisplay({ word, fontSize }) {
  const parts = useMemo(() => {
    if (!word) return { before: '', focal: '', after: '' };
    const idx = findFocalPoint(word);
    return {
      before: word.slice(0, idx),
      focal: word[idx] || '',
      after: word.slice(idx + 1),
    };
  }, [word]);

  return (
    <div className="flex items-center justify-center min-h-[200px] md:min-h-[280px] select-none">
      <div
        className="relative flex items-center justify-center"
        style={{ fontSize: `${fontSize}px` }}
      >
        {/* Top and bottom focal markers */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[var(--accent)] opacity-40" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[var(--accent)] opacity-40" />

        <span className="font-mono tracking-wide">
          <span className="text-secondary">{parts.before}</span>
          <span className="text-[var(--accent)] font-bold">{parts.focal}</span>
          <span className="text-secondary">{parts.after}</span>
        </span>
      </div>
    </div>
  );
}
