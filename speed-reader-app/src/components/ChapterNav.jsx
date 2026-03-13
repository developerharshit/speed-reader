import { useState } from 'react';

// Indent widths per nesting level (in px)
const INDENT = [16, 28, 40, 52];

export default function ChapterNav({ chapters, currentIndex, onJumpTo }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!chapters || chapters.length === 0) return null;

  // Find the most specific (deepest / last in list) active chapter
  const currentChapter = [...chapters]
    .reverse()
    .find(ch => currentIndex >= ch.startWordIndex);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-[var(--border-color)] transition-colors text-sm"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        <span className="hidden sm:inline truncate max-w-[150px]">
          {currentChapter?.title || 'Chapters'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-50 w-72 max-h-96 overflow-y-auto rounded-xl bg-card border border-theme shadow-xl">
            {chapters.map((ch, i) => {
              const level = ch.level || 0;
              const paddingLeft = INDENT[Math.min(level, INDENT.length - 1)];
              const isCurrent = currentChapter === ch;
              return (
                <button
                  key={i}
                  onClick={() => {
                    onJumpTo(ch.startWordIndex);
                    setIsOpen(false);
                  }}
                  style={{ paddingLeft }}
                  className={`
                    w-full text-left pr-4 py-2.5 transition-colors
                    border-b border-theme last:border-0
                    hover:bg-secondary
                    ${isCurrent ? 'bg-secondary' : ''}
                    ${level === 0 ? 'text-sm font-medium' : 'text-xs text-secondary'}
                    ${isCurrent ? 'text-primary font-semibold' : ''}
                  `}
                >
                  {level > 0 && (
                    <span className="mr-1.5 opacity-40">{'–'.repeat(level)}</span>
                  )}
                  {ch.title}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
