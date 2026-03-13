import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const chapters = [];
  const paragraphs = [];
  let allWords = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items.filter(item => item.str && item.str.trim());
    if (!items.length) continue;

    // Group items into paragraphs using Y-position gaps
    // PDF Y increases bottom-to-top, so sort descending
    const avgHeight = items.reduce((s, it) => s + (it.height || 12), 0) / items.length;
    const gapThreshold = avgHeight * 1.4;

    let currentText = '';
    let lastY = null;

    const flushParagraph = () => {
      const text = currentText.replace(/\s+/g, ' ').trim();
      if (!text) return;
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const wordStart = allWords.length;
      allWords = allWords.concat(words);
      paragraphs.push({
        text,
        wordStart,
        wordEnd: wordStart + words.length - 1,
        isHeading: false,
      });
      currentText = '';
    };

    for (const item of items) {
      const y = item.transform ? item.transform[5] : 0;
      if (lastY !== null && Math.abs(y - lastY) > gapThreshold) {
        flushParagraph();
      }
      const sep = currentText && !currentText.endsWith(' ') ? ' ' : '';
      currentText += sep + item.str;
      lastY = y;
    }
    flushParagraph();

    // Chapter grouping every 10 pages
    const chapterIndex = Math.floor((pageNum - 1) / 10);
    if (!chapters[chapterIndex]) {
      chapters[chapterIndex] = {
        title: `Pages ${chapterIndex * 10 + 1}–${Math.min((chapterIndex + 1) * 10, totalPages)}`,
        startWordIndex: allWords.length - (paragraphs[paragraphs.length - 1]?.wordEnd - paragraphs[paragraphs.length - 1]?.wordStart + 1 || 0),
      };
    }
  }

  // Rebuild chapters with correct startWordIndex
  const rebuiltChapters = [];
  for (let i = 0; i < totalPages; i += 10) {
    const groupPageStart = i + 1;
    const groupPageEnd = Math.min(i + 10, totalPages);
    rebuiltChapters.push({
      title: `Pages ${groupPageStart}–${groupPageEnd}`,
      startWordIndex: 0,
    });
  }
  // Assign startWordIndex by distributing paragraphs evenly across chapters
  if (rebuiltChapters.length > 1 && paragraphs.length > 0) {
    const parasPerChapter = Math.ceil(paragraphs.length / rebuiltChapters.length);
    rebuiltChapters.forEach((ch, i) => {
      const paraIdx = i * parasPerChapter;
      ch.startWordIndex = paragraphs[Math.min(paraIdx, paragraphs.length - 1)]?.wordStart || 0;
    });
  }

  return {
    title: file.name.replace(/\.pdf$/i, ''),
    words: allWords,
    paragraphs,
    chapters: rebuiltChapters,
    totalWords: allWords.length,
  };
}
