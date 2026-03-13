import { useEffect, useRef } from 'react';

export default function TextContextView({ words, paragraphs, currentIndex, onWordClick, fontSize }) {
  const currentParaRef = useRef(null);
  const containerRef = useRef(null);
  const justJumpedRef = useRef(false);
  const lastJumpIndexRef = useRef(-1);

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

  // Only scroll when component mounts or after user jumps to a paragraph
  useEffect(() => {
    if (!currentParaRef.current || !containerRef.current) return;

    // Check if this is a user-initiated jump (large index change)
    const isJump = Math.abs(currentIndex - lastJumpIndexRef.current) > 50;

    if (isJump || justJumpedRef.current) {
      const container = containerRef.current;
      const el = currentParaRef.current;
      const elTop = el.offsetTop;
      const elHeight = el.offsetHeight;
      const containerHeight = container.clientHeight;
      // Center the current paragraph
      container.scrollTo({
        top: elTop - containerHeight / 2 + elHeight / 2,
        behavior: 'smooth',
      });
      justJumpedRef.current = false;
    }
    lastJumpIndexRef.current = currentIndex;
  }, [currentParaIndex, currentIndex]);

  // Mark when user clicks a word (potential jump)
  const wrappedOnWordClick = (idx) => {
    justJumpedRef.current = true;
    onWordClick(idx);
  };

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
                onClick={() => wrappedOnWordClick(i)}
                className={`cursor-pointer rounded transition-colors ${
                  i === currentIndex
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
              className={`transition-colors duration-150 ${
                isHeading ? 'mt-8 mb-3' : 'mb-[1.1em]'
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
                          onClick={() => wrappedOnWordClick(globalIdx)}
                          className={`cursor-pointer rounded transition-colors ${
                            isActiveWord
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
                  className={`text-primary cursor-pointer hover:bg-secondary/40 rounded transition-colors px-1 -mx-1 ${
                    isHeading ? 'font-bold text-[1.2em]' : ''
                  }`}
                  onClick={() => wrappedOnWordClick(para.wordStart)}
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
