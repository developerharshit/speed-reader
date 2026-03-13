import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useSpeedReader } from '../hooks/useSpeedReader';
import WordDisplay from './WordDisplay';
import TextContextView from './TextContextView';
import Controls from './Controls';
import ChapterNav from './ChapterNav';
import SettingsPanel from './SettingsPanel';

export default function SpeedReader({ bookData, settings, onSettingsChange, onBack }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTextView, setShowTextView] = useState(true);
  const [textViewJustOpened, setTextViewJustOpened] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [footerHidden, setFooterHidden] = useState(false);
  const [countdown, setCountdown] = useState(null); // 3 | 2 | 1 | null

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

  // 3-second countdown before starting playback
  const countdownRef = useRef(null);
  const startCountdown = useCallback(() => {
    if (isPlaying || countdown !== null) return;
    setShowTextView(false);
    setCountdown(3);
  }, [isPlaying, countdown]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      togglePlay(); // actually start
      return;
    }
    countdownRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(countdownRef.current);
  }, [countdown, togglePlay]);

  // Wrap togglePlay: if pausing just call through; if starting, do countdown
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      togglePlay(); // immediate pause
    } else if (countdown !== null) {
      // cancel countdown
      clearTimeout(countdownRef.current);
      setCountdown(null);
    } else {
      startCountdown();
    }
  }, [isPlaying, countdown, togglePlay, startCountdown]);

  // Skip with slide-direction tracking for animation
  const handleSkipBack = useCallback((count = 10) => {
    skipBack(count);
  }, [skipBack]);

  const handleSkipForward = useCallback((count = 10) => {
    skipForward(count);
  }, [skipForward]);

  const openTextView = useCallback(() => {
    setTextViewJustOpened(true);
    setShowTextView(true);
  }, []);

  const closeTextView = useCallback(() => {
    setShowTextView(false);
  }, []);

  // ── Tape scrubber ─────────────────────────────────────────────────────────
  // estimating monospace 16px char width so we can center on the current word
  const CHAR_W = 9.6;  // px per character at font-size 16px mono
  const WORD_PAD = 10; // 5px left + 5px right padding per word slot
  const TAPE_WINDOW = 15;
  const AVG_WORD_PX = 55; // used for snap physics only

  // Returns estimated total pixel width of a word span
  const wordPx = useCallback((word) => (word ? word.length * CHAR_W + WORD_PAD : WORD_PAD), []);

  const stripRef = useRef(null);
  const centreOffRef = useRef(0);  // px from strip left-edge to center-of-current-word
  const touchStartXRef = useRef(null);
  const liveOffsetRef = useRef(0);
  const swipedRef = useRef(false);
  const rafRef = useRef(null);
  const velocityRef = useRef(0);
  const velSamplesRef = useRef([]);
  const currentIndexRef = useRef(currentIndex);
  const bookDataRef = useRef(bookData);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { bookDataRef.current = bookData; }, [bookData]);

  const cancelMomentum = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  // Build the transform string: strip left-edge sits so center-word's center = 50% of container
  // left: 50% puts strip's left edge at container centre;
  // then shift left by centreOff (so center-word centre aligns) + liveOffset for drag
  const tapeTransform = useCallback((liveOff, transition = 'none') => {
    if (!stripRef.current) return;
    stripRef.current.style.transition = transition;
    stripRef.current.style.transform =
      `translateX(calc(-${centreOffRef.current}px + ${liveOff}px)) translateY(-50%)`;
  }, []);

  // Recompute centreOff whenever the rendered word set changes, then re-centre
  useEffect(() => {
    const words = bookDataRef.current?.words || [];
    let leftW = 0;
    for (let i = 1; i <= TAPE_WINDOW; i++) {
      const idx = currentIndexRef.current - i;
      leftW += wordPx(idx >= 0 ? words[idx] : '');
    }
    const centerW = wordPx(words[currentIndexRef.current] || '');
    centreOffRef.current = leftW + centerW / 2;

    if (touchStartXRef.current === null && rafRef.current === null) {
      liveOffsetRef.current = 0;
      tapeTransform(0);
    }
  }, [currentIndex, bookData, wordPx, tapeTransform]);

  const snapAndJump = useCallback((offsetPx) => {
    const wordsToSkip = -Math.round(offsetPx / AVG_WORD_PX);
    const snappedPx = -wordsToSkip * AVG_WORD_PX;
    tapeTransform(snappedPx, 'transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)');
    liveOffsetRef.current = snappedPx;
    if (wordsToSkip !== 0) {
      const newIdx = Math.max(0, Math.min(bookDataRef.current.words.length - 1, currentIndexRef.current + wordsToSkip));
      setTimeout(() => jumpTo(newIdx), 230);
    }
  }, [tapeTransform, jumpTo]);

  const handleTouchStart = useCallback((e) => {
    if (isPlaying) return;
    cancelMomentum();
    touchStartXRef.current = e.touches[0].clientX;
    velSamplesRef.current = [{ x: e.touches[0].clientX, t: performance.now() }];
    velocityRef.current = 0;
    swipedRef.current = false;
    tapeTransform(liveOffsetRef.current, 'none');
  }, [isPlaying, cancelMomentum, tapeTransform]);

  const handleTouchMove = useCallback((e) => {
    if (touchStartXRef.current === null) return;
    e.stopPropagation();
    const dx = e.touches[0].clientX - touchStartXRef.current;
    tapeTransform(liveOffsetRef.current + dx, 'none');
    const now = performance.now();
    velSamplesRef.current.push({ x: e.touches[0].clientX, t: now });
    velSamplesRef.current = velSamplesRef.current.filter(s => now - s.t < 80);
  }, [tapeTransform]);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    liveOffsetRef.current += dx;
    touchStartXRef.current = null;

    if (Math.abs(liveOffsetRef.current) < 20 && Math.abs(dx) < 20) return;
    swipedRef.current = true;

    const samples = velSamplesRef.current;
    let vel = 0;
    if (samples.length >= 2) {
      const first = samples[0], last = samples[samples.length - 1];
      const dt = last.t - first.t;
      if (dt > 0) vel = (last.x - first.x) / dt;
    }
    velocityRef.current = vel * 16;

    const FRICTION = 0.93;
    const MIN_VEL = 0.3;
    const animate = () => {
      velocityRef.current *= FRICTION;
      liveOffsetRef.current += velocityRef.current;
      tapeTransform(liveOffsetRef.current, 'none');
      if (Math.abs(velocityRef.current) > MIN_VEL) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
        snapAndJump(liveOffsetRef.current);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [tapeTransform, snapAndJump]);

  const handleMainClick = useCallback(() => {
    if (swipedRef.current) { swipedRef.current = false; return; }
    handleTogglePlay();
  }, [handleTogglePlay]);

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
          handleTogglePlay();
          break;
        case 'ArrowLeft':
          handleSkipBack(e.shiftKey ? 50 : 10);
          break;
        case 'ArrowRight':
          handleSkipForward(e.shiftKey ? 50 : 10);
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
  }, [handleTogglePlay, handleSkipBack, handleSkipForward, handleWpmChange, wpm, toggleFullscreen]);

  // Estimated time remaining
  const etaMinutes = useMemo(() => {
    if (!bookData) return 0;
    const remaining = bookData.words.length - currentIndex;
    return Math.ceil(remaining / wpm);
  }, [bookData, currentIndex, wpm]);

  // Close text view when playback resumes
  useEffect(() => {
    if (isPlaying) setShowTextView(false);
  }, [isPlaying]);

  // Reset textViewJustOpened after one render cycle
  useEffect(() => {
    if (textViewJustOpened) setTextViewJustOpened(false);
  }, [textViewJustOpened]);

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
              {isPlaying ? '' : 'Paused'}
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
          disableAutoScroll={textViewJustOpened}
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
          className="flex-1 flex flex-col items-center justify-center select-none px-4 overflow-hidden relative"
          style={!isPlaying ? { touchAction: 'pan-y' } : undefined}
          onClick={handleMainClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Tape word strip — paused only (not during countdown) */}
          {!isPlaying && countdown === null && (
            <>
              {/* Large current word (reading position) */}
              <WordDisplay word={displayWord} fontSize={settings.fontSize} />

              {/* Navigation tape — all words same uniform size, no overlap possible */}
              <div
                className="relative w-full"
                style={{ height: 44, overflow: 'hidden', flexShrink: 0 }}
              >
                <div
                  ref={stripRef}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    // initial render: let the useEffect fire and set centreOffRef then call tapeTransform
                    // we compute it inline here too so the first paint is correct
                    transform: (() => {
                      const words = bookData?.words || [];
                      let lw = 0;
                      for (let i = 1; i <= TAPE_WINDOW; i++) {
                        const idx = currentIndex - i;
                        lw += (idx >= 0 && words[idx] ? words[idx].length * CHAR_W + WORD_PAD : WORD_PAD);
                      }
                      const cw = (words[currentIndex] ? words[currentIndex].length * CHAR_W + WORD_PAD : WORD_PAD);
                      const co = lw + cw / 2;
                      return `translateX(calc(-${co}px)) translateY(-50%)`;
                    })(),
                    display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    willChange: 'transform',
                  }}
                >
                  {Array.from({ length: TAPE_WINDOW * 2 + 1 }, (_, i) => {
                    const offset = i - TAPE_WINDOW;
                    const idx = currentIndex + offset;
                    const word = (idx >= 0 && idx < bookData.words.length) ? bookData.words[idx] : '';
                    const isCurrent = offset === 0;
                    const absOffset = Math.abs(offset);
                    const opacity = isCurrent ? 1 : Math.max(0.1, 0.6 - absOffset * 0.04);
                    return (
                      <div
                        key={offset}
                        style={{ padding: '0 5px', flexShrink: 0 }}
                        onClick={e => { if (word && !isCurrent) { e.stopPropagation(); jumpTo(idx); } }}
                      >
                        <span
                          style={{
                            fontSize: 16,
                            opacity,
                            cursor: word && !isCurrent ? 'pointer' : 'default',
                            whiteSpace: 'nowrap',
                          }}
                          className={`font-mono ${isCurrent ? 'text-primary font-bold' : 'text-secondary'}`}
                        >
                          {word}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Centre tick */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-2 bg-accent opacity-50" />
              </div>
            </>
          )}

          {/* Word display — shown while playing AND during countdown; style never changes */}
          {(isPlaying || countdown !== null) && (
            settings.chunkSize === 1 ? (
              <WordDisplay word={displayWord} fontSize={settings.fontSize} />
            ) : (
              <div
                className="flex items-center justify-center font-mono tracking-wide text-primary min-h-[200px] md:min-h-[280px]"
                style={{ fontSize: `${settings.fontSize}px` }}
              >
                {displayWord}
              </div>
            )
          )}

          {/* Fixed-height block below word — always present while playing/counting down so layout never shifts */}
          {(isPlaying || countdown !== null) && (
            <div
              style={{
                marginTop: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                // Fixed height = countdown-number line-height + cancel-hint line-height + gap
                height: `calc(${settings.fontSize * 1.6}px + 1.5rem)`,
                visibility: countdown !== null ? 'visible' : 'hidden',
              }}
            >
              <div
                key={countdown}
                className={`font-bold font-mono text-accent ${countdown !== null ? 'animate-slide-from-right' : ''}`}
                style={{ fontSize: `${settings.fontSize * 1.6}px`, lineHeight: 1 }}
              >
                {countdown ?? ''}
              </div>
              <p className="text-secondary text-xs">Tap to cancel</p>
            </div>
          )}

          {/* X button — go back to text reader (paused, not counting down) */}
          {!isPlaying && countdown === null && (
            <button
              onClick={e => { e.stopPropagation(); openTextView(); }}
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-secondary hover:bg-[var(--border-color)] transition-colors"
              title="Back to text reader"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          {!isPlaying && countdown === null && currentIndex === 0 && (
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
              onTogglePlay={handleTogglePlay}
              onSkipBack={handleSkipBack}
              onSkipForward={handleSkipForward}
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
