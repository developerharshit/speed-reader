import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSpeedReader } from '../hooks/useSpeedReader';
import WordDisplay from './WordDisplay';
import TextContextView from './TextContextView';
import Controls from './Controls';
import ChapterNav from './ChapterNav';
import SettingsPanel from './SettingsPanel';

export default function SpeedReader({ bookData, settings, onSettingsChange, onBack }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsHidden, setControlsHidden] = useState(false);
  const [wasPlaying, setWasPlaying] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [footerHidden, setFooterHidden] = useState(false);

  const {
    currentWord,
    currentIndex,
    isPlaying,
    wpm,
    progress,
    togglePlay,
    skipBack,
    skipForward,
    jumpTo,
    changeWpm,
  } = useSpeedReader(bookData, settings.wpm);

  // Display word(s) based on chunk size
  const displayWord = useMemo(() => {
    if (!bookData) return '';
    const chunk = settings.chunkSize || 1;
    if (chunk === 1) return currentWord;
    const words = [];
    for (let i = 0; i < chunk && currentIndex + i < bookData.words.length; i++) {
      words.push(bookData.words[currentIndex + i]);
    }
    return words.join(' ');
  }, [bookData, currentWord, currentIndex, settings.chunkSize]);

  const handleWpmChange = useCallback((newWpm) => {
    changeWpm(newWpm);
    onSettingsChange(s => ({ ...s, wpm: newWpm }));
  }, [changeWpm, onSettingsChange]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          skipBack(e.shiftKey ? 50 : 10);
          break;
        case 'ArrowRight':
          skipForward(e.shiftKey ? 50 : 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleWpmChange(Math.min(1000, wpm + 25));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleWpmChange(Math.max(100, wpm - 25));
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlay, skipBack, skipForward, changeWpm, wpm, toggleFullscreen]);

  // Estimated time remaining
  const etaMinutes = useMemo(() => {
    if (!bookData) return 0;
    const remaining = bookData.words.length - currentIndex;
    return Math.ceil(remaining / wpm);
  }, [bookData, currentIndex, wpm]);

  // Show text view whenever paused (not playing), regardless of position
  const showTextView = !isPlaying;
  const justPaused = wasPlaying && !isPlaying;

  // Track playing state and detect pause
  useEffect(() => {
    setWasPlaying(isPlaying);
  }, [isPlaying]);

  // When switching away from text view, reset ui visibility
  useEffect(() => {
    if (!showTextView) {
      setHeaderHidden(false);
      setFooterHidden(false);
    }
  }, [showTextView]);

  // Scroll up → hide both; scroll down → show only header, footer stays hidden
  const handleUiHide = useCallback(() => { setHeaderHidden(true); setFooterHidden(true); }, []);
  const handleUiShow = useCallback(() => { setHeaderHidden(false); setFooterHidden(true); }, []);
  // Tap when hidden → restore everything
  const handleUiTapRestore = useCallback(() => { setHeaderHidden(false); setFooterHidden(false); }, []);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      {/* Header — fixed overlay in text view, slides up when UI hidden */}
      <header className={`flex items-center justify-between px-3 py-2 border-b border-theme bg-card transition-transform duration-300 ease-in-out ${showTextView
        ? `fixed top-0 left-0 right-0 z-30 ${headerHidden ? '-translate-y-full' : 'translate-y-0'}`
        : 'flex-shrink-0'
        }`}>
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-secondary hover:bg-[var(--border-color)] transition-colors flex-shrink-0"
            title="Back to library"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <ChapterNav
            chapters={bookData.chapters}
            currentIndex={currentIndex}
            onJumpTo={jumpTo}
          />
        </div>

        <div className="flex items-center gap-2 min-w-0 mx-2">
          <h2 className="text-sm font-medium text-primary truncate max-w-[140px] sm:max-w-[220px]">
            {bookData.title}
          </h2>
          {showTextView && (
            <span className="text-xs text-secondary hidden sm:inline bg-secondary px-2 py-0.5 rounded-full flex-shrink-0">
              Paused
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-secondary hidden md:block mr-1">
            ~{etaMinutes} min left
          </span>
          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-secondary hover:bg-[var(--border-color)] transition-colors"
            title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
          >
            {isFullscreen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>
          <SettingsPanel settings={settings} onSettingsChange={onSettingsChange} />
        </div>
      </header>

      {/* Content — flex-1, scrolls internally */}
      {showTextView ? (
        <TextContextView
          words={bookData.words}
          paragraphs={bookData.paragraphs}
          currentIndex={currentIndex}
          onWordClick={jumpTo}
          fontSize={settings.fontSize}
          disableAutoScroll={justPaused}
          overlayMode
          uiHidden={headerHidden || footerHidden}
          onUiHide={handleUiHide}
          onUiShow={handleUiShow}
          onUiTapRestore={handleUiTapRestore}
          bookTitle={bookData.title}
          chapters={bookData.chapters}
        />
      ) : (
        <main
          className="flex-1 flex flex-col items-center justify-center cursor-pointer select-none px-4 overflow-hidden"
          onClick={togglePlay}
        >
          {settings.chunkSize === 1 ? (
            <WordDisplay word={displayWord} fontSize={settings.fontSize} />
          ) : (
            <div
              className="flex items-center justify-center font-mono tracking-wide text-primary"
              style={{ fontSize: `${settings.fontSize}px` }}
            >
              {displayWord}
            </div>
          )}
          {!isPlaying && currentIndex === 0 && (
            <p className="text-secondary text-sm mt-4 animate-pulse">
              Tap anywhere or press Space to start
            </p>
          )}
        </main>
      )}

      {/* Footer — fixed overlay in text view, slides down when UI hidden */}
      <footer className={`bg-card border-t border-theme transition-transform duration-300 ease-in-out ${showTextView
        ? `fixed bottom-0 left-0 right-0 z-30 ${footerHidden ? 'translate-y-full' : 'translate-y-0'}`
        : 'flex-shrink-0'
        }`}>
        <div className="pb-5 pt-3">
            <Controls
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              onSkipBack={skipBack}
              onSkipForward={skipForward}
              wpm={wpm}
              onWpmChange={handleWpmChange}
              progress={progress}
              currentIndex={currentIndex}
              totalWords={bookData.totalWords}
            />
            {showTextView ? (
              <p className="text-center text-xs text-secondary mt-2">
                Tap a paragraph to jump · Click Play or Space to resume
              </p>
            ) : (
              <div className="hidden md:flex justify-center gap-4 mt-3 text-xs text-secondary">
                <span>Space: Play/Pause</span>
                <span>← →: Skip words</span>
                <span>↑ ↓: Speed</span>
                <span>F: Fullscreen</span>
              </div>
            )}
          </div>
      </footer>
    </div>
  );
}
