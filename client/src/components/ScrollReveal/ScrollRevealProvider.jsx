import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  SCROLL_REVEAL_SELECTORS,
  SCROLL_REVEAL_SKIP_SELECTOR,
} from '../../utils/scrollRevealSelectors';

const STAGGER_MS = 120;
const STAGGER_CAP_MS = 840;
const MIN_STAGGER_GROUP = 2;

function sortByDocumentOrder(elements) {
  return [...elements].sort((a, b) => {
    if (a === b) return 0;
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

function shouldSkip(el) {
  if (!el || !(el instanceof Element)) return true;
  if (el.closest(SCROLL_REVEAL_SKIP_SELECTOR)) return true;
  if (el.classList.contains('scroll-reveal-ignore')) return true;
  const tag = el.tagName;
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'SVG') return true;
  return false;
}

function collectRevealNodes(root) {
  const found = new Set();
  try {
    root.querySelectorAll(SCROLL_REVEAL_SELECTORS).forEach((el) => {
      if (!shouldSkip(el)) found.add(el);
    });
  } catch {
    /* ignore */
  }
  return [...found];
}

function applyStagger(groups) {
  groups.forEach((el) => {
    el.style.removeProperty('--reveal-delay');
  });

  const byParent = new Map();
  groups.forEach((el) => {
    const parent = el.parentElement;
    if (!parent) return;
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent).push(el);
  });

  byParent.forEach((children) => {
    if (children.length < MIN_STAGGER_GROUP) return;
    sortByDocumentOrder(children).forEach((el, index) => {
      const delay = Math.min(index * STAGGER_MS, STAGGER_CAP_MS);
      el.style.setProperty('--reveal-delay', `${delay}ms`);
    });
  });
}

function clearReveal(nodes) {
  nodes.forEach((el) => {
    el.classList.remove('scroll-reveal', 'is-revealed');
    el.style.removeProperty('--reveal-delay');
  });
}

export default function ScrollRevealProvider({ children }) {
  const rootRef = useRef(null);
  const observerRef = useRef(null);
  const nodesRef = useRef([]);
  const { pathname } = useLocation();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    let scanTimer = null;

    const teardown = () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      clearReveal(nodesRef.current);
      nodesRef.current = [];
    };

    const scan = () => {
      teardown();

      const nodes = collectRevealNodes(root);
      if (!nodes.length) return;

      applyStagger(nodes);
      nodes.forEach((el) => el.classList.add('scroll-reveal'));
      nodesRef.current = nodes;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
            } else {
              entry.target.classList.remove('is-revealed');
            }
          });
        },
        {
          root: null,
          threshold: [0, 0.06, 0.14],
          /* Начинаем анимацию чуть раньше, пока блок только входит в экран */
          rootMargin: '0px 0px 12% 0px',
        }
      );

      nodes.forEach((el) => observer.observe(el));
      observerRef.current = observer;
    };

    const scheduleScan = () => {
      window.clearTimeout(scanTimer);
      scanTimer = window.setTimeout(scan, 60);
    };

    scheduleScan();

    const mutationObserver = new MutationObserver(scheduleScan);
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(scanTimer);
      mutationObserver.disconnect();
      teardown();
    };
  }, [pathname]);

  return (
    <div ref={rootRef} className="scroll-reveal-root">
      {children}
    </div>
  );
}
