export default function Controls({
  isPlaying,
  onTogglePlay,
  onSkipBack,
  onSkipForward,
  wpm,
  onWpmChange,
  progress,
  currentIndex,
  totalWords,
}) {
  return (
    <div className="w-full max-w-lg mx-auto px-4">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-[width] duration-100"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-secondary">
            {currentIndex.toLocaleString()} / {totalWords.toLocaleString()} words
          </span>
          <span className="text-xs text-secondary">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <button
          onClick={() => onSkipBack(50)}
          className="p-2.5 rounded-full bg-secondary hover:bg-[var(--border-color)] transition-colors"
          title="Back 50 words"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="11 17 6 12 11 7" />
            <polyline points="18 17 13 12 18 7" />
          </svg>
        </button>

        <button
          onClick={() => onSkipBack(10)}
          className="p-2.5 rounded-full bg-secondary hover:bg-[var(--border-color)] transition-colors"
          title="Back 10 words"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          onClick={onTogglePlay}
          className="p-4 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-lg"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          )}
        </button>

        <button
          onClick={() => onSkipForward(10)}
          className="p-2.5 rounded-full bg-secondary hover:bg-[var(--border-color)] transition-colors"
          title="Forward 10 words"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          onClick={() => onSkipForward(50)}
          className="p-2.5 rounded-full bg-secondary hover:bg-[var(--border-color)] transition-colors"
          title="Forward 50 words"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </button>
      </div>

      {/* WPM slider */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-secondary">Speed</span>
          <span className="text-sm font-mono font-medium text-primary">{wpm} WPM</span>
        </div>
        <input
          type="range"
          min="100"
          max="1000"
          step="25"
          value={wpm}
          onChange={(e) => onWpmChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-secondary mt-0.5">
          <span>100</span>
          <span>1000</span>
        </div>
      </div>
    </div>
  );
}
