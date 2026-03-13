import { useState, useRef } from 'react';

export default function FileUpload({ onFileLoaded, isLoading }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && ext !== 'epub') {
      alert('Please upload a PDF or EPUB file.');
      return;
    }
    onFileLoaded(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3">
          Speed Reader
        </h1>
        <p className="text-secondary text-lg">
          Upload a book and read at lightning speed
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          w-full max-w-md cursor-pointer rounded-2xl border-2 border-dashed p-10 md:p-14
          transition-all duration-200 text-center
          ${isDragging
            ? 'border-[var(--accent)] bg-[var(--accent)]/10 scale-105'
            : 'border-theme hover:border-[var(--accent)] hover:bg-secondary'
          }
          ${isLoading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-secondary">Parsing book...</p>
          </div>
        ) : (
          <>
            <div className="text-5xl mb-4">📚</div>
            <p className="text-primary font-medium text-lg mb-2">
              Drop your book here
            </p>
            <p className="text-secondary text-sm">
              or tap to browse
            </p>
            <p className="text-secondary text-xs mt-3">
              Supports PDF and EPUB
            </p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.epub"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}
