import { useState, useRef, useCallback, useEffect } from 'react';
import { saveProgress, updateHistoryProgress } from '../utils/storage';

export function useSpeedReader(bookData, initialWpm = 300) {
  const initialIndex = bookData?.resumeIndex || 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(initialWpm);
  const timerRef = useRef(null);
  const indexRef = useRef(initialIndex);
  const wpmRef = useRef(initialWpm);
  const isPlayingRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    wpmRef.current = wpm;
  }, [wpm]);

  // Save progress periodically and on unmount
  useEffect(() => {
    if (!bookData) return;
    const interval = setInterval(() => {
      saveProgress(bookData.title, indexRef.current);
      updateHistoryProgress(bookData.title, indexRef.current);
    }, 3000);
    return () => {
      clearInterval(interval);
      // Save immediately when leaving the reader
      saveProgress(bookData.title, indexRef.current);
      updateHistoryProgress(bookData.title, indexRef.current);
    };
  }, [bookData]);

  const getDelay = useCallback((word) => {
    const baseDelay = 60000 / wpmRef.current;
    // Add extra delay for longer words, punctuation
    let multiplier = 1;
    if (word.length > 8) multiplier = 1.3;
    if (word.length > 12) multiplier = 1.5;
    if (/[.!?;]$/.test(word)) multiplier *= 1.5;
    if (/[,:]$/.test(word)) multiplier *= 1.2;
    return baseDelay * multiplier;
  }, []);

  const tick = useCallback(() => {
    if (!bookData || !isPlayingRef.current) return;
    const idx = indexRef.current;
    if (idx >= bookData.words.length - 1) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }
    const nextIdx = idx + 1;
    setCurrentIndex(nextIdx);
    indexRef.current = nextIdx;

    const delay = getDelay(bookData.words[nextIdx]);
    timerRef.current = setTimeout(tick, delay);
  }, [bookData, getDelay]);

  const play = useCallback(() => {
    if (!bookData || indexRef.current >= bookData.words.length - 1) return;
    if (isPlayingRef.current) return; // guard against double-tap
    isPlayingRef.current = true;
    setIsPlaying(true);
    const delay = getDelay(bookData.words[indexRef.current]);
    timerRef.current = setTimeout(tick, delay);
  }, [bookData, tick, getDelay]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const skipBack = useCallback((count = 10) => {
    pause();
    const newIndex = Math.max(0, indexRef.current - count);
    setCurrentIndex(newIndex);
    indexRef.current = newIndex;
  }, [pause]);

  const skipForward = useCallback((count = 10) => {
    if (!bookData) return;
    pause();
    const newIndex = Math.min(bookData.words.length - 1, indexRef.current + count);
    setCurrentIndex(newIndex);
    indexRef.current = newIndex;
  }, [bookData, pause]);

  const jumpTo = useCallback((index) => {
    pause();
    const clamped = Math.max(0, Math.min(bookData ? bookData.words.length - 1 : 0, index));
    setCurrentIndex(clamped);
    indexRef.current = clamped;
  }, [bookData, pause]);

  const changeWpm = useCallback((newWpm) => {
    setWpm(newWpm);
    wpmRef.current = newWpm;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const currentWord = bookData?.words[currentIndex] || '';
  const progress = bookData ? (currentIndex / (bookData.words.length - 1)) * 100 : 0;

  return {
    currentWord,
    currentIndex,
    isPlaying,
    wpm,
    progress,
    play,
    pause,
    togglePlay,
    skipBack,
    skipForward,
    jumpTo,
    changeWpm,
    setCurrentIndex: jumpTo,
  };
}
