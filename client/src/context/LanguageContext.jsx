import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState } from
'react';
import ru from '../locales/ru';
import en from '../locales/en';
import kk from '../locales/kk';

const DICTS = { ru, en, kk };
export const LANGS = [
{ code: 'ru', short: 'RU', name: 'Русский' },
{ code: 'kk', short: 'KK', name: 'Қазақша' },
{ code: 'en', short: 'EN', name: 'English' }];


const STORAGE_KEY = 'burnout_ui_lang_v1';

const LanguageContext = createContext(null);

function getNested(obj, path) {
  return path.split('.').reduce((o, key) => o == null ? o : o[key], obj);
}

function applyParams(str, params) {
  if (!params || typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (_, k) =>
  params[k] != null ? String(params[k]) : ''
  );
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s && ['ru', 'en', 'kk'].includes(s)) return s;
    } catch {

    }
    return 'ru';
  });

  const dict = DICTS[lang] || DICTS.ru;

  const setLang = useCallback((code) => {
    if (!['ru', 'en', 'kk'].includes(code)) return;
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {

    }
  }, []);

  const t = useCallback(
    (key, params) => {
      const raw = getNested(dict, key);
      if (raw == null) {
        const fb = getNested(DICTS.ru, key);
        if (typeof fb === 'string') return applyParams(fb, params);
        return key;
      }
      if (typeof raw === 'string') return applyParams(raw, params);
      return key;
    },
    [dict]
  );


  const tRaw = useCallback(
    (key) => {
      const v = getNested(DICTS[lang], key);
      if (v != null) return v;
      return getNested(DICTS.ru, key);
    },
    [lang]
  );

  useEffect(() => {
    try {
      document.documentElement.setAttribute('lang', lang === 'kk' ? 'kk' : lang);
    } catch {

    }
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t, tRaw, langs: LANGS }),
    [lang, setLang, t, tRaw]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>);

}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}