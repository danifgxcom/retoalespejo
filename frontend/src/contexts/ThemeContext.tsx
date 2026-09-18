import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  ThemeClarity,
  ThemePalette,
  loadThemePreferences,
  saveThemePreferences,
  resolveClarity,
} from '../utils/theme/themePreferences';

export type { ThemeClarity, ThemePalette };

interface ThemeContextType {
  /** Preferencia elegida por el usuario: 'auto' sigue al sistema. */
  clarity: ThemeClarity;
  /** 'auto' ya resuelto a 'light' | 'dark'. Es lo que usa el dibujo. */
  resolvedClarity: 'light' | 'dark';
  palette: ThemePalette;
  /** Atajo para el dibujo: equivalente a `palette === 'high'`. */
  highContrast: boolean;
  setClarity: (clarity: ThemeClarity) => void;
  setPalette: (palette: ThemePalette) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  clarity: 'auto',
  resolvedClarity: 'light',
  palette: 'normal',
  highContrast: false,
  setClarity: () => {},
  setPalette: () => {},
});

// Custom hook for using the theme context
export const useTheme = () => useContext(ThemeContext);

const getSystemPrefersDark = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * F21: única fuente de verdad del tema en tiempo de ejecución.
 *
 * Lee y persiste las preferencias (themePreferences.ts), resuelve 'auto'
 * contra la preferencia del sistema (y reacciona si cambia mientras el juego
 * está abierto), y refleja el resultado en `<html data-theme data-palette>`
 * para que theme.css lo aplique. Ningún otro sitio del código debe leer
 * `localStorage.getItem('theme')` ni decidir el tema por su cuenta: todo pasa
 * por este contexto.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [{ clarity, palette }, setPreferences] = useState(() => loadThemePreferences());
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const resolvedClarity = resolveClarity(clarity, systemPrefersDark);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedClarity;
    document.documentElement.dataset.palette = palette;
  }, [resolvedClarity, palette]);

  const setClarity = useCallback((next: ThemeClarity) => {
    setPreferences(prev => {
      const updated = { ...prev, clarity: next };
      saveThemePreferences(updated);
      return updated;
    });
  }, []);

  const setPalette = useCallback((next: ThemePalette) => {
    setPreferences(prev => {
      const updated = { ...prev, palette: next };
      saveThemePreferences(updated);
      return updated;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        clarity,
        resolvedClarity,
        palette,
        highContrast: palette === 'high',
        setClarity,
        setPalette,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
