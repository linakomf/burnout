import React, { createContext, useCallback, useContext, useLayoutEffect } from 'react';

const STORAGE_KEY = 'burnout_theme';
const THEME = 'light';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', THEME);
    try {
      localStorage.setItem(STORAGE_KEY, THEME);
    } catch {
    }
  }, []);

  const setTheme = useCallback(() => {}, []);
  const toggleTheme = useCallback(() => {}, []);

  return (
    <ThemeContext.Provider value={{ theme: THEME, setTheme, toggleTheme, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
