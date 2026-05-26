import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/** Рендер модалки в document.body — иначе fixed обрезается родителями с transform/overflow. */
export default function AdminModalPortal({ children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(children, document.body);
}
