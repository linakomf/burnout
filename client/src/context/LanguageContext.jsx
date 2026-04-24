import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'burnout_lang';
const LanguageContext = createContext(null);

const EXACT_REPLACEMENTS = new Map([
  ['Связаться с психологом', 'Психологпен байланысу'],
  ['Ответим в ближайшее время', 'Жақын арада жауап береміз'],
  ['Форма связи', 'Байланыс формасы'],
  ['Главная', 'Басты бет'],
  ['Аналитика', 'Талдау'],
  ['Тесты', 'Тесттер'],
  ['Практики', 'Жаттығулар'],
  ['ИИ Дневник', 'ЖИ күнделігі'],
  ['Профиль', 'Профиль'],
  ['Настройки', 'Баптаулар'],
  ['Уведомления', 'Хабарландырулар'],
  ['Приватность', 'Құпиялылық'],
  ['Тёмная тема', 'Қараңғы тақырып'],
  ['Язык', 'Тіл'],
  ['Русский', 'Орысша'],
  ['Казахский', 'Қазақша'],
  ['Сохранить изменения', 'Өзгерістерді сақтау'],
  ['Сохранение...', 'Сақталуда...'],
  ['Выйти из аккаунта', 'Аккаунттан шығу'],
  ['Отправить заявку', 'Өтінім жіберу'],
  ['Отправка...', 'Жіберілуде...'],
  ['Отправить ещё заявку', 'Тағы өтінім жіберу'],
  ['Контакт', 'Байланыс'],
  ['Способ связи', 'Байланыс тәсілі'],
  ['Другое', 'Басқа'],
  ['Телефон', 'Телефон'],
  ['Удобное время (опционально)', 'Ыңғайлы уақыт (міндетті емес)'],
  ['С чем нужна помощь', 'Қандай көмек керек'],
  ['Закрыть', 'Жабу'],
  ['Перейти к тестам', 'Тесттерге өту'],
  ['Пропустить', 'Өткізіп жіберу'],
  ['Опрос', 'Сауалнама'],
  ['Вопрос', 'Сұрақ'],
  ['Дальше', 'Келесі'],
  ['Назад', 'Артқа'],
  ['К тестам', 'Тесттерге'],
  ['Начать тест', 'Тестті бастау'],
  ['Тест завершён', 'Тест аяқталды'],
  ['Все тесты', 'Барлық тесттер'],
  ['Практики для меня', 'Маған арналған жаттығулар'],
  ['Подробнее', 'Толығырақ'],
  ['Каталог опросов', 'Сауалнамалар тізімі'],
  ['Каталог практик', 'Жаттығулар тізімі'],
  ['Быстрый старт', 'Жылдам бастау'],
  ['Открыть', 'Ашу'],
  ['Недоступно', 'Қолжетімсіз'],
  ['Настроение', 'Көңіл-күй'],
  ['Тревога', 'Мазасыздық'],
  ['Баланс', 'Теңгерім'],
  ['Обзор', 'Шолу'],
  ['Пользователи', 'Пайдаланушылар'],
  ['Категории', 'Санаттар'],
  ['Администратор', 'Әкімші'],
  ['Студент', 'Студент'],
  ['Преподаватель', 'Оқытушы'],
  ['Дневник', 'Күнделік'],
  ['Тесты', 'Тесттер'],
  ['Практики', 'Жаттығулар'],
  ['Профиль', 'Профиль'],
  ['Сегодня', 'Бүгін'],
  ['За неделю', 'Апта бойынша'],
  ['Сохранить', 'Сақтау'],
  ['Отправить', 'Жіберу'],
  ['Закрыть', 'Жабу'],
  ['Пропустить', 'Өткізіп жіберу'],
  ['Перейти к тестам', 'Тесттерге өту'],
  ['Стресс', 'Стресс'],
  ['Энергия', 'Энергия'],
  ['Ваше настроение', 'Сіздің көңіл-күйіңіз'],
]);

const FRAGMENT_REPLACEMENTS = [
  ['Привет', 'Сәлем'],
  ['Сегодня', 'Бүгін'],
  ['За неделю', 'Апта бойынша'],
  ['Доброе утро', 'Қайырлы таң'],
  ['Добрый день', 'Қайырлы күн'],
  ['Добрый вечер', 'Қайырлы кеш'],
  ['Рекомендации дня', 'Күннің ұсыныстары'],
  ['Показатели подробно', 'Көрсеткіштер толық'],
  ['Перейти в аналитику', 'Талдауға өту'],
  ['Главная', 'Басты бет'],
  ['Данные аккаунта', 'Аккаунт деректері'],
  ['настройки приложения', 'қосымша баптаулары'],
  ['Редактировать данные', 'Деректерді өңдеу'],
  ['Имя', 'Аты'],
  ['Возраст', 'Жасы'],
  ['Текущий пароль', 'Ағымдағы құпиясөз'],
  ['Новый пароль', 'Жаңа құпиясөз'],
  ['Изменить пароль', 'Құпиясөзді өзгерту'],
  ['необязательно', 'міндетті емес'],
  ['Сохранить изменения', 'Өзгерістерді сақтау'],
  ['Уведомления', 'Хабарландырулар'],
  ['Приватность', 'Құпиялылық'],
  ['Тёмная тема', 'Қараңғы тақырып'],
  ['Комфорт для глаз вечером', 'Кешке көзге жайлы'],
  ['Язык', 'Тіл'],
  ['Русский', 'Орысша'],
  ['Казахский', 'Қазақша'],
  ['Русский или казахский интерфейс', 'Орысша немесе қазақша интерфейс'],
  ['Связаться с психологом', 'Психологпен байланысу'],
  ['Можно отправить заявку и получить обратную связь от специалиста.', 'Өтінім жіберіп, маманнан кері байланыс алуға болады.'],
  ['Способ связи', 'Байланыс тәсілі'],
  ['Удобное время', 'Ыңғайлы уақыт'],
  ['Кратко опишите', 'Қысқаша сипаттаңыз'],
  ['Отправить заявку', 'Өтінім жіберу'],
  ['Отправить ещё заявку', 'Тағы өтінім жіберу'],
  ['Выйти из аккаунта', 'Аккаунттан шығу'],
  ['Тесты', 'Тесттер'],
  ['Практики', 'Жаттығулар'],
  ['Аналитика', 'Талдау'],
  ['Профиль', 'Профиль'],
  ['Опрос', 'Сауалнама'],
  ['Вопрос', 'Сұрақ'],
  ['Начать опрос', 'Сауалнаманы бастау'],
  ['Выберите', 'Таңдаңыз'],
  ['Настроение', 'Көңіл-күй'],
  ['Стресс', 'Стресс'],
  ['Энергия', 'Энергия'],
  ['Тревога', 'Мазасыздық'],
  ['Дневник', 'Күнделік'],
  ['ориентир, а не диагноз', 'бағдар ғана, диагноз емес'],
  ['Связаться', 'Байланысу'],
  ['заявка', 'өтінім'],
  ['заявку', 'өтінімді'],
  ['Отправить', 'Жіберу'],
  ['Сброс', 'Қалпына келтіру'],
  ['Пауза', 'Үзіліс'],
  ['Продолжить', 'Жалғастыру'],
  ['Стоп', 'Тоқтату'],
  ['Таймер', 'Таймер'],
  ['Прогресс', 'Прогресс'],
  ['Практика завершена', 'Жаттығу аяқталды'],
];

function translateRuToKz(text) {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  if (EXACT_REPLACEMENTS.has(trimmed)) {
    return text.replace(trimmed, EXACT_REPLACEMENTS.get(trimmed));
  }

  let out = text;
  for (const [ru, kz] of FRAGMENT_REPLACEMENTS) {
    out = out.replaceAll(ru, kz);
  }
  return out;
}

const originalTextNodes = new WeakMap();
const originalAttrValues = new WeakMap();

function applyOnTextNode(node, language) {
  if (!node || typeof node.nodeValue !== 'string') return;
  if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue);
  const original = originalTextNodes.get(node);
  const nextValue = language === 'kz' ? translateRuToKz(original) : original;
  if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
}

function applyOnElementAttrs(element, language) {
  if (!element || element.nodeType !== 1) return;
  const attrs = ['placeholder', 'title', 'aria-label'];
  let store = originalAttrValues.get(element);
  if (!store) {
    store = {};
    originalAttrValues.set(element, store);
  }
  for (const attr of attrs) {
    const current = element.getAttribute(attr);
    if (current == null) continue;
    if (!(attr in store)) store[attr] = current;
    const nextValue = language === 'kz' ? translateRuToKz(store[attr]) : store[attr];
    if (current !== nextValue) element.setAttribute(attr, nextValue);
  }
}

function translateSubtree(root, language) {
  if (!root || root.nodeType !== 1) return;

  const showTextFlag = typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;
  const walker = document.createTreeWalker(root, showTextFlag);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent && !parent.closest('script,style,textarea,[data-no-translate]')) {
      applyOnTextNode(node, language);
    }
    node = walker.nextNode();
  }

  const attrNodes = root.querySelectorAll('[placeholder],[title],[aria-label]');
  attrNodes.forEach((el) => applyOnElementAttrs(el, language));
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'kz') return 'kz';
    } catch {
      /* ignore */
    }
    return 'kz';
  });

  useEffect(() => {
    document.documentElement.setAttribute('lang', language === 'kz' ? 'kk' : 'ru');
    document.documentElement.setAttribute('data-ui-lang', language);
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* ignore */
    }
  }, [language]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    let applying = false;

    const apply = (root = document.body) => {
      if (applying) return;
      applying = true;
      try {
        translateSubtree(root, language);
      } finally {
        applying = false;
      }
    };

    apply(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target) {
          applyOnTextNode(mutation.target, language);
          continue;
        }
        mutation.addedNodes.forEach((n) => {
          if (n.nodeType === 3) applyOnTextNode(n, language);
          if (n.nodeType === 1) apply(n);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  const setLanguage = useCallback((lang) => {
    if (lang === 'ru' || lang === 'kz') setLanguageState(lang);
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, isKazakh: language === 'kz' }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
