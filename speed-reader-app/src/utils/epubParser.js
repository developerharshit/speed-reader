import ePub from 'epubjs';

const BLOCK_SELECTORS = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th';
const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

export async function parseEPUB(file) {
  const arrayBuffer = await file.arrayBuffer();
  const book = ePub(arrayBuffer);
  await book.ready;
  await book.loaded.spine;

  const chapters = [];
  const paragraphs = [];
  let allWords = [];

  // Load navigation for chapter titles
  const nav = await book.loaded.navigation;
  const tocMap = {};
  if (nav && nav.toc) {
    nav.toc.forEach(item => {
      const href = item.href.split('#')[0];
      tocMap[href] = item.label.trim();
    });
  }

  const sections = [];
  book.spine.each(section => sections.push(section));

  for (const section of sections) {
    try {
      const doc = await book.load(section.href);

      let docBody = null;
      if (doc && doc.body) {
        docBody = doc.body;
      } else if (doc && doc.documentElement) {
        docBody = doc.documentElement;
      } else if (typeof doc === 'string') {
        const parser = new DOMParser();
        docBody = parser.parseFromString(doc, 'text/html').body;
      }

      if (!docBody) continue;

      const chapterStartWord = allWords.length;
      const elements = docBody.querySelectorAll(BLOCK_SELECTORS);

      if (elements.length === 0) {
        // Fallback: treat whole section as one paragraph
        const text = docBody.textContent.replace(/\s+/g, ' ').trim();
        if (text) {
          const words = text.split(/\s+/).filter(w => w.length > 0);
          const wordStart = allWords.length;
          allWords = allWords.concat(words);
          paragraphs.push({ text, wordStart, wordEnd: wordStart + words.length - 1, isHeading: false });
        }
      } else {
        for (const el of elements) {
          const text = el.textContent.replace(/\s+/g, ' ').trim();
          if (!text) continue;
          const words = text.split(/\s+/).filter(w => w.length > 0);
          const wordStart = allWords.length;
          allWords = allWords.concat(words);
          paragraphs.push({
            text,
            wordStart,
            wordEnd: wordStart + words.length - 1,
            isHeading: HEADING_TAGS.has(el.tagName),
          });
        }
      }

      if (allWords.length > chapterStartWord) {
        const sectionHref = section.href ? section.href.split('#')[0] : '';
        const chapterTitle = tocMap[sectionHref] || `Section ${chapters.length + 1}`;
        chapters.push({ title: chapterTitle, startWordIndex: chapterStartWord });
      }
    } catch (err) {
      console.warn('Failed to load section:', section.href, err);
    }
  }

  const title = book.packaging?.metadata?.title || file.name.replace(/\.epub$/i, '');

  return {
    title,
    words: allWords,
    paragraphs,
    chapters,
    totalWords: allWords.length,
  };
}
