import ePub from 'epubjs';

const BLOCK_SELECTORS = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th';
const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

// Recursively flatten the TOC tree into a flat array, preserving depth via `level`
function flattenToc(items, level = 0) {
  const result = [];
  for (const item of items) {
    if (item.label) {
      result.push({ title: item.label.trim(), href: item.href || '', level });
    }
    if (item.subitems && item.subitems.length > 0) {
      result.push(...flattenToc(item.subitems, level + 1));
    }
  }
  return result;
}

export async function parseEPUB(file) {
  const arrayBuffer = await file.arrayBuffer();
  const book = ePub(arrayBuffer);
  await book.ready;
  await book.loaded.spine;

  const paragraphs = [];
  let allWords = [];
  // Maps "sectionFile" and "sectionFile#id" → first word index at that location
  const fragWordMap = {};

  const nav = await book.loaded.navigation;

  const sections = [];
  book.spine.each(section => sections.push(section));

  for (const section of sections) {
    try {
      const doc = await book.load(section.href);
      const sectionFile = section.href ? section.href.split('#')[0] : '';

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
          const wordStart = allWords.length;
          // Record IDs from this element and its ancestors so fragment-based TOC
          // entries (e.g. chapter.xhtml#section2) resolve to the right word index
          let node = el;
          while (node && node !== docBody) {
            if (node.id) {
              const key = `${sectionFile}#${node.id}`;
              if (fragWordMap[key] === undefined) fragWordMap[key] = wordStart;
            }
            node = node.parentElement;
          }
          const text = el.textContent.replace(/\s+/g, ' ').trim();
          if (!text) continue;
          const words = text.split(/\s+/).filter(w => w.length > 0);
          allWords = allWords.concat(words);
          paragraphs.push({
            text,
            wordStart,
            wordEnd: wordStart + words.length - 1,
            isHeading: HEADING_TAGS.has(el.tagName),
          });
        }
      }

      // Record the section file's starting word (first occurrence only)
      if (allWords.length > chapterStartWord && fragWordMap[sectionFile] === undefined) {
        fragWordMap[sectionFile] = chapterStartWord;
      }
    } catch (err) {
      console.warn('Failed to load section:', section.href, err);
    }
  }

  // Build chapters exclusively from the TOC — this avoids spurious "Section N"
  // entries for spine items that don't have a real TOC entry (cover, copyright, etc.)
  const flatToc = flattenToc(nav?.toc || []);
  const chapters = [];
  for (const item of flatToc) {
    const href = item.href;
    const hrefFile = href.split('#')[0];
    let wordIndex;
    if (href.includes('#') && fragWordMap[href] !== undefined) {
      wordIndex = fragWordMap[href];
    } else if (fragWordMap[hrefFile] !== undefined) {
      wordIndex = fragWordMap[hrefFile];
    } else {
      continue; // TOC entry points to content we couldn't find, skip it
    }
    chapters.push({ title: item.title, startWordIndex: wordIndex, level: item.level });
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
