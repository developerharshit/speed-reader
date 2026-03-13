import { useState, useCallback, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import SpeedReader from './components/SpeedReader';
import History from './components/History';
import { parsePDF } from './utils/pdfParser';
import { parseEPUB } from './utils/epubParser';
import { loadProgress, saveProgress, loadSettings, saveSettings, saveToHistory } from './utils/storage';
import { cacheFile, getCachedFile } from './utils/fileCache';

const DEFAULT_SETTINGS = {
  theme: 'light',
  fontSize: 42,
  chunkSize: 1,
  wpm: 300,
};

function App() {
  const [bookData, setBookData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [settings, setSettings] = useState(() => {
    return loadSettings() || DEFAULT_SETTINGS;
  });

  // Apply theme to body
  useEffect(() => {
    document.body.className = `theme-${settings.theme}`;
  }, [settings.theme]);

  // Persist settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const loadBook = useCallback(async (file, type, skipCache = false) => {
    setIsLoading(true);
    setError(null);
    try {
      let parsed;
      if (type === 'pdf') {
        parsed = await parsePDF(file);
      } else if (type === 'epub') {
        parsed = await parseEPUB(file);
      }

      if (!parsed || parsed.words.length === 0) {
        throw new Error('No readable text found in this file.');
      }

      // Cache file for future history resumption
      if (!skipCache) {
        cacheFile(parsed.title, file);
      }

      // Restore saved progress
      const savedIndex = loadProgress(parsed.title);
      if (savedIndex > 0 && savedIndex < parsed.words.length) {
        parsed.resumeIndex = savedIndex;
      }

      // Save to history
      saveToHistory({
        title: parsed.title,
        type,
        totalWords: parsed.words.length,
        wordIndex: savedIndex || 0,
        lastRead: Date.now(),
      });

      setBookData(parsed);
      setHistoryKey(k => k + 1);
    } catch (err) {
      console.error('Parse error:', err);
      setError(err.message || 'Failed to parse the file. Please try another file.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileLoaded = useCallback(async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    await loadBook(file, ext);
  }, [loadBook]);

  const handleHistoryResume = useCallback(async (entry) => {
    // entry is null when user deletes a history item — just refresh the list
    if (!entry) {
      setHistoryKey(k => k + 1);
      return;
    }
    // Try to load from IndexedDB cache
    setIsLoading(true);
    setError(null);
    try {
      const cached = await getCachedFile(entry.title);
      if (cached) {
        await loadBook(cached.file, cached.type, true);
      } else {
        setIsLoading(false);
        setError(`Re-upload "${entry.title}" to read it again — progress will resume at ${Math.round((entry.wordIndex / entry.totalWords) * 100)}%`);
      }
    } catch {
      setIsLoading(false);
      setError(`Re-upload "${entry.title}" to read it again.`);
    }
  }, [loadBook]);

  const handleBack = useCallback(() => {
    setBookData(null);
    setError(null);
    setHistoryKey(k => k + 1);
  }, []);

  if (bookData) {
    return (
      <SpeedReader
        bookData={bookData}
        settings={settings}
        onSettingsChange={setSettings}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center pb-12">
      <FileUpload onFileLoaded={handleFileLoaded} isLoading={isLoading} />
      <History onResume={handleHistoryResume} refreshKey={historyKey} />

      {error && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white px-5 py-3 rounded-xl shadow-lg text-sm max-w-sm text-center cursor-pointer z-50"
          onClick={() => setError(null)}
        >
          {error}
          <div className="text-xs opacity-75 mt-1">Tap to dismiss</div>
        </div>
      )}
    </div>
  );
}

export default App;
