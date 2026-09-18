import { loadGameProgress, saveGameProgress, loadTutorialSeen, saveTutorialSeen } from '../../utils/progress/gameProgress';

/**
 * F03: persistencia en localStorage. jsdom aporta un localStorage real para
 * el caso feliz; el modo privado (localStorage que lanza) se simula.
 */
describe('gameProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('sin nada guardado, devuelve progreso vacío', () => {
    expect(loadGameProgress()).toEqual({ lastChallenge: 0, completed: [], bestTimes: {} });
  });

  test('guarda y recupera el progreso tal cual', () => {
    const progress = { lastChallenge: 3, completed: [1, 2, 3], bestTimes: { 1: 42, 3: 17 } };
    saveGameProgress(progress);
    expect(loadGameProgress()).toEqual(progress);
  });

  test('datos corruptos en localStorage no rompen la carga', () => {
    localStorage.setItem('reto-al-espejo:progress:v1', '{ esto no es JSON');
    expect(loadGameProgress()).toEqual({ lastChallenge: 0, completed: [], bestTimes: {} });
  });

  test('datos con forma inesperada se sanean en vez de propagarse', () => {
    localStorage.setItem('reto-al-espejo:progress:v1', JSON.stringify({
      lastChallenge: 'no-es-un-numero',
      completed: [1, 'dos', 3, null],
      bestTimes: 'tampoco-un-objeto'
    }));
    expect(loadGameProgress()).toEqual({ lastChallenge: 0, completed: [1, 3], bestTimes: {} });
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
      expect(() => saveGameProgress({ lastChallenge: 1, completed: [1], bestTimes: {} })).not.toThrow();
      expect(loadGameProgress()).toEqual({ lastChallenge: 0, completed: [], bestTimes: {} });
    } finally {
      Object.defineProperty(window, 'localStorage', { configurable: true, value: original });
    }
  });
});

/**
 * F06: bandera de "tutorial ya visto", en su propia clave para no depender
 * de que cada guardado de GameProgress (que reescribe el objeto entero) la
 * incluya.
 */
describe('tutorialSeen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('sin nada guardado, no se considera visto', () => {
    expect(loadTutorialSeen()).toBe(false);
  });

  test('guardar lo marca como visto de forma persistente', () => {
    saveTutorialSeen();
    expect(loadTutorialSeen()).toBe(true);
  });

  test('no interfiere con el progreso guardado por separado', () => {
    saveGameProgress({ lastChallenge: 3, completed: [1, 2, 3], bestTimes: { 1: 42 } });
    saveTutorialSeen();
    expect(loadGameProgress()).toEqual({ lastChallenge: 3, completed: [1, 2, 3], bestTimes: { 1: 42 } });
    expect(loadTutorialSeen()).toBe(true);
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
      expect(() => saveTutorialSeen()).not.toThrow();
      expect(loadTutorialSeen()).toBe(false);
    } finally {
      Object.defineProperty(window, 'localStorage', { configurable: true, value: original });
    }
  });
});
