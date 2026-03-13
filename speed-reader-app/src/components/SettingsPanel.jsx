import { useState } from 'react';

export default function SettingsPanel({ settings, onSettingsChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { id: 'light', label: 'Light', preview: 'bg-white text-gray-900 border-gray-200' },
    { id: 'dark', label: 'Dark', preview: 'bg-gray-800 text-gray-100 border-gray-600' },
    { id: 'sepia', label: 'Sepia', preview: 'bg-[#f4ecd8] text-[#5b4636] border-[#d4c4a8]' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-secondary hover:bg-[var(--border-color)] transition-colors"
        title="Settings"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-xl bg-card border border-theme shadow-xl p-4">
            <h3 className="font-medium text-primary mb-4">Settings</h3>

            {/* Theme */}
            <div className="mb-4">
              <label className="text-sm text-secondary mb-2 block">Theme</label>
              <div className="flex gap-2">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onSettingsChange({ ...settings, theme: t.id })}
                    className={`
                      flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all
                      ${t.preview}
                      ${settings.theme === t.id ? 'ring-2 ring-[var(--accent)] scale-105' : 'opacity-70 hover:opacity-100'}
                    `}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-secondary">Font Size</label>
                <span className="text-sm font-mono text-primary">{settings.fontSize}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="72"
                step="2"
                value={settings.fontSize}
                onChange={(e) => onSettingsChange({ ...settings, fontSize: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Words per flash */}
            <div className="mb-2">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-secondary">Chunk Size</label>
                <span className="text-sm font-mono text-primary">{settings.chunkSize} word{settings.chunkSize > 1 ? 's' : ''}</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={settings.chunkSize}
                onChange={(e) => onSettingsChange({ ...settings, chunkSize: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
