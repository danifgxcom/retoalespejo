import { loadThemePreferences, saveThemePreferences, resolveClarity } from '../../utils/theme/themePreferences';

/**
 * F12/F21: persistencia de las preferencias de tema y resolución de 'auto'.
 * Mismo patrón que gameProgress.test.ts (F03): jsdom aporta un localStorage
 * real para el caso feliz, el modo privado (localStorage que lanza) se simula.
 */
describe('themePreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('sin nada guardado, devuelve auto + normal', () => {
    expect(loadThemePreferences()).toEqual({ clarity: 'auto', palette: 'normal' });
  });

  test('guarda y recupera las preferencias tal cual', () => {
    const preferences = { clarity: 'dark' as const, palette: 'high' as const };
    saveThemePreferences(preferences);
    expect(loadThemePreferences()).toEqual(preferences);
  });

  test('datos corruptos en localStorage no rompen la carga', () => {
    localStorage.setItem('reto-al-espejo:theme:v1', '{ esto no es JSON');
    expect(loadThemePreferences()).toEqual({ clarity: 'auto', palette: 'normal' });
  });

  test('valores fuera del conjunto válido se sanean en vez de propagarse', () => {
    localStorage.setItem('reto-al-espejo:theme:v1', JSON.stringify({ clarity: 'oscurísimo', palette: 'arcoiris' }));
    expect(loadThemePreferences()).toEqual({ clarity: 'auto', palette: 'normal' });
  });

  test('localStorage que lanza (modo privado) no rompe ni lectura ni escritura', () => {
    const original = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => { throw new Error('QuotaExceededError'); },
        setItem: () => { throw new Error('QuotaExceededError'); }
      }
    });

    try {
      expect(() => saveThemePreferences({ clarity: 'light', palette: 'normal' })).not.toThrow();
      expect(loadThemePreferences()).toEqual({ clarity: 'auto', palette: 'normal' });
    } finally {
      Object.defineProperty(window, 'localStorage', { configurable: true, value: original });
    }
  });

  describe('resolveClarity', () => {
    test('auto sigue la preferencia del sistema', () => {
      expect(resolveClarity('auto', true)).toBe('dark');
      expect(resolveClarity('auto', false)).toBe('light');
    });

    test('light y dark ignoran la preferencia del sistema', () => {
      expect(resolveClarity('light', true)).toBe('light');
      expect(resolveClarity('dark', false)).toBe('dark');
    });
  });
});
