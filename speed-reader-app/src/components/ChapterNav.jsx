import { useState } from 'react';

export default function ChapterNav({ chapters, currentIndex, onJumpTo }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!chapters || chapters.length === 0) return null;

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
          <div className="absolute left-0 top-full mt-1 z-50 w-64 max-h-80 overflow-y-auto rounded-xl bg-card border border-theme shadow-xl">
            {chapters.map((ch, i) => (
              <button
                key={i}
                onClick={() => {
                  onJumpTo(ch.startWordIndex);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-4 py-3 text-sm transition-colors
                  hover:bg-secondary border-b border-theme last:border-0
                  ${currentChapter === ch ? 'bg-secondary font-medium' : ''}
                `}
              >
                <span className="text-secondary text-xs mr-2">{i + 1}.</span>
                {ch.title}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
