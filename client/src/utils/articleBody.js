const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'IMG',
  'STRONG',
  'EM',
  'B',
  'I',
  'UL',
  'OL',
  'LI',
  'H2',
  'H3',
  'A',
  'DIV',
  'FIGURE',
  'FIGCAPTION',
]);

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function isSafeArticleImageSrc(src) {
  const s = String(src || '').trim();
  if (!s) return false;
  if (s.startsWith('/uploads/')) return true;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isSafeArticleLinkHref(href) {
  const s = String(href || '').trim();
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeArticleHtml(unsafeHtml) {
  const raw = String(unsafeHtml || '').trim();
  if (!raw) return '';

  if (typeof DOMParser === 'undefined') {
    return escapeHtml(raw).replace(/\n/g, '<br />');
  }

  const doc = new DOMParser().parseFromString(raw, 'text/html');

  function cleanElement(el) {
    const tag = el.tagName;
    if (!ALLOWED_TAGS.has(tag)) {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      return;
    }

    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (tag === 'IMG') {
        if (name === 'src' && isSafeArticleImageSrc(attr.value)) return;
        if (name === 'alt' || name === 'class' || name === 'loading') return;
        el.removeAttribute(attr.name);
        return;
      }
      if (tag === 'A' && name === 'href' && isSafeArticleLinkHref(attr.value)) {
        el.setAttribute('rel', 'noopener noreferrer');
        el.setAttribute('target', '_blank');
        return;
      }
      if (name === 'class' && (tag === 'P' || tag === 'DIV' || tag === 'FIGURE')) return;
      el.removeAttribute(attr.name);
    });

    if (tag === 'IMG') {
      const src = el.getAttribute('src');
      if (!isSafeArticleImageSrc(src)) {
        el.remove();
        return;
      }
      if (!el.classList.contains('article-inline-img')) {
        el.classList.add('article-inline-img');
      }
      el.setAttribute('loading', 'lazy');
    }

    if (tag === 'A') {
      const href = el.getAttribute('href');
      if (!isSafeArticleLinkHref(href)) {
        el.removeAttribute('href');
      }
    }

    [...el.children].forEach((child) => cleanElement(child));
  }

  [...doc.body.children].forEach((child) => cleanElement(child));
  return doc.body.innerHTML;
}

export function formatArticleBodyToHtml(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';

  const withMarkdownImages = text.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt, src) => {
      if (!isSafeArticleImageSrc(src)) return '';
      const safeAlt = escapeHtml(alt);
      return `<img src="${src}" alt="${safeAlt}" class="article-inline-img" loading="lazy" />`;
    }
  );

  if (/<[a-z][\s\S]*>/i.test(withMarkdownImages)) {
    return sanitizeArticleHtml(withMarkdownImages);
  }

  const blocks = withMarkdownImages.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const line = block.trim();
      if (!line) return '';
      if (/^<img\b/i.test(line)) return line;
      const inner = escapeHtml(line).replace(/\n/g, '<br />');
      return `<p>${inner}</p>`;
    })
    .filter(Boolean)
    .join('');
}
