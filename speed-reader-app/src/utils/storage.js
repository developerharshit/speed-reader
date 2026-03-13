const STORAGE_KEY = 'speed-reader-progress';
const SETTINGS_KEY = 'speed-reader-settings';
const HISTORY_KEY = 'speed-reader-history';
const MAX_HISTORY = 20;

export function saveProgress(bookTitle, wordIndex) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[bookTitle] = { wordIndex, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable
  }
}

export function loadProgress(bookTitle) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[bookTitle]?.wordIndex || 0;
  } catch {
    return 0;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable
  }
}

export function loadSettings() {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveToHistory(entry) {
  // entry: { title, type, totalWords, wordIndex, lastRead }
  try {
    const history = loadHistory();
    const existing = history.findIndex(h => h.title === entry.title);
    if (existing !== -1) history.splice(existing, 1);
    history.unshift(entry);
    if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // localStorage unavailable
  }
}

export function loadHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function updateHistoryProgress(title, wordIndex) {
  try {
    const history = loadHistory();
    const entry = history.find(h => h.title === title);
    if (entry) {
      entry.wordIndex = wordIndex;
      entry.lastRead = Date.now();
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch {
    // localStorage unavailable
  }
}

export function removeFromHistory(title) {
  try {
    const history = loadHistory().filter(h => h.title !== title);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // localStorage unavailable
  }
}
