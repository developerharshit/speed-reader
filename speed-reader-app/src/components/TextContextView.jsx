import { useEffect, useRef } from 'react';

export default function TextContextView({ words, paragraphs, currentIndex, onWordClick, fontSize, disableAutoScroll }) {
  const currentParaRef = useRef(null);
  const containerRef = useRef(null);
  const lastDisableAutoScrollRef = useRef(false);

  // Find which paragraph contains the current word
  const currentParaIndex = paragraphs
    ? (() => {
      let lo = 0, hi = paragraphs.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (paragraphs[mid].wordEnd < currentIndex) lo = mid + 1;
        else if (paragraphs[mid].wordStart > currentIndex) hi = mid - 1;
        else return mid;
      }
      return lo;
    })()
    : -1;

  // Scroll current paragraph into view when it changes
  useEffect(() => {
    // Transitioning from disableAutoScroll=true to false means wasPlaying state just
    // settled — the view is already correctly positioned, so skip.
    if (lastDisableAutoScrollRef.current && !disableAutoScroll) {
      lastDisableAutoScrollRef.current = false;
      return;
    }
    lastDisableAutoScrollRef.current = disableAutoScroll;

    if (currentParaRef.current && containerRef.current) {
      const container = containerRef.current;
      const el = currentParaRef.current;
      const elTop = el.offsetTop;
      const elHeight = el.offsetHeight;
      const containerHeight = container.clientHeight;
      const targetTop = elTop - containerHeight / 2 + elHeight / 2;
      // Use instant positioning when the text view first appears (just paused/mounted)
      // so the view jumps directly to the current word instead of scrolling from the top.
      if (disableAutoScroll) {
        container.scrollTop = targetTop;
      } else {
        container.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    }
  }, [currentParaIndex, disableAutoScroll]);

  const textSize = Math.max(14, Math.round(fontSize * 0.4));

  // Fallback: no paragraph data — render words in a flat flowing view
  if (!paragraphs || paragraphs.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-5 py-8 md:px-10"
        style={{ fontSize: `${textSize}px`, lineHeight: '1.9' }}
      >
        <div className="max-w-2xl mx-auto text-primary">
          {words.map((word, i) => (
            <span key={i}>
              <span
                onClick={() => onWordClick(i)}
                className={`cursor-pointer rounded transition-colors ${i === currentIndex
                    ? 'bg-[var(--accent)] text-white font-bold px-1'
                    : 'hover:bg-secondary'
                  }`}
              >
                {word}
              </span>{' '}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-5 py-8 md:px-12 lg:px-20"
      style={{ fontSize: `${textSize}px`, lineHeight: '1.85' }}
    >
      <div className="max-w-2xl mx-auto">
        {paragraphs.map((para, pIdx) => {
          const isCurrent = pIdx === currentParaIndex;
          const isHeading = para.isHeading;

          return (
            <div
              key={pIdx}
              ref={isCurrent ? currentParaRef : null}
              className={`transition-colors duration-150 ${isHeading ? 'mt-8 mb-3' : 'mb-[1.1em]'
                }`}
            >
              {isCurrent ? (
                // Current paragraph: render word by word for precise highlighting
                <p
                  className={`text-primary ${isHeading ? 'font-bold text-[1.2em]' : ''}`}
                >
                  {words.slice(para.wordStart, para.wordEnd + 1).map((word, j) => {
                    const globalIdx = para.wordStart + j;
                    const isActiveWord = globalIdx === currentIndex;
                    return (
                      <span key={globalIdx}>
                        <span
                          onClick={() => onWordClick(globalIdx)}
                          className={`cursor-pointer rounded transition-colors ${isActiveWord
                              ? 'bg-[var(--accent)] text-white font-bold px-1 py-0.5'
                              : 'hover:bg-secondary'
                            }`}
                        >
                          {word}
                        </span>{' '}
                      </span>
                    );
                  })}
                </p>
              ) : (
                // Other paragraphs: plain text, click jumps to paragraph start
                <p
                  className={`text-primary cursor-pointer hover:bg-secondary/40 rounded transition-colors px-1 -mx-1 ${isHeading ? 'font-bold text-[1.2em]' : ''
                    }`}
                  onClick={() => onWordClick(para.wordStart)}
                >
                  {para.text}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
