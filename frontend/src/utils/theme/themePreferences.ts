/**
 * Persistencia y resolución de las preferencias de tema (F12, F21).
 *
 * Dos ejes ortogonales, cada uno independiente del otro:
 *  - `clarity` (claridad): 'auto' sigue la preferencia del sistema operativo,
 *    'light'/'dark' la fuerzan.
 *  - `palette` (paleta): 'normal' es la identidad visual del juego, 'high' es
 *    la paleta de alto contraste (máximo contraste WCAG).
 *
 * La matriz de las cuatro combinaciones resultantes vive documentada como
 * comentario en styles/theme.css, justo donde se implementa.
 *
 * ThemeContext es la única fuente de verdad en tiempo de ejecución (F21): lee
 * y escribe aquí, y expone el resultado ya resuelto por contexto. Ningún
 * componente de dibujo debe leer localStorage directamente.
 *
 * Igual que gameProgress.ts (F03): localStorage puede lanzar (modo privado,
 * cuota agotada), así que toda lectura y escritura va protegida.
 */

export type ThemeClarity = 'auto' | 'light' | 'dark';
export type ThemePalette = 'normal' | 'high';

export interface ThemePreferences {
  clarity: ThemeClarity;
  palette: ThemePalette;
}

const STORAGE_KEY = 'reto-al-espejo:theme:v1';

const DEFAULT_PREFERENCES: ThemePreferences = { clarity: 'auto', palette: 'normal' };

const isThemeClarity = (value: unknown): value is ThemeClarity =>
  value === 'auto' || value === 'light' || value === 'dark';

const isThemePalette = (value: unknown): value is ThemePalette =>
  value === 'normal' || value === 'high';

export const loadThemePreferences = (): ThemePreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };

    const parsed = JSON.parse(raw);
    return {
      clarity: isThemeClarity(parsed?.clarity) ? parsed.clarity : DEFAULT_PREFERENCES.clarity,
      palette: isThemePalette(parsed?.palette) ? parsed.palette : DEFAULT_PREFERENCES.palette,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
};

export const saveThemePreferences = (preferences: ThemePreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Modo privado, cuota agotada, etc: el tema sigue vivo sólo en memoria.
  }
};

/** Resuelve 'auto' a 'light' o 'dark' según la preferencia del sistema. */
export const resolveClarity = (clarity: ThemeClarity, systemPrefersDark: boolean): 'light' | 'dark' =>
  clarity === 'auto' ? (systemPrefersDark ? 'dark' : 'light') : clarity;
