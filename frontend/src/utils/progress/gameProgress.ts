/**
 * Persistencia de progreso en localStorage (F03).
 *
 * Guarda por ID de reto, no por índice: así sobrevive a un reordenamiento del
 * array de retos (F11) sin desincronizarse.
 *
 * localStorage puede lanzar (modo privado de Safari, cuota agotada...), así
 * que toda lectura y escritura va protegida con try/catch: sin persistencia
 * el juego debe seguir funcionando con normalidad, sólo en memoria.
 */

export interface GameProgress {
  lastChallenge: number;
  completed: number[];
  bestTimes: Record<number, number>;
}

const STORAGE_KEY = 'reto-al-espejo:progress:v1';

const EMPTY_PROGRESS: GameProgress = { lastChallenge: 0, completed: [], bestTimes: {} };

export const loadGameProgress = (scope: 'campaign' | 'free' = 'campaign'): GameProgress => {
  try {
    const raw = localStorage.getItem(scope === 'free' ? `${STORAGE_KEY}:free` : STORAGE_KEY);
    if (!raw) return { ...EMPTY_PROGRESS };

    const parsed = JSON.parse(raw);
    return {
      lastChallenge: typeof parsed?.lastChallenge === 'number' ? parsed.lastChallenge : 0,
      completed: Array.isArray(parsed?.completed) ? parsed.completed.filter((id: unknown) => typeof id === 'number') : [],
      bestTimes: parsed?.bestTimes && typeof parsed.bestTimes === 'object' ? parsed.bestTimes : {}
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
};

export const saveGameProgress = (progress: GameProgress, scope: 'campaign' | 'free' = 'campaign'): void => {
  try {
    localStorage.setItem(scope === 'free' ? `${STORAGE_KEY}:free` : STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Modo privado, cuota agotada, etc: el progreso sigue vivo sólo en memoria.
  }
};

/**
 * F06: bandera de "tutorial ya visto", en una clave propia en vez de dentro
 * de GameProgress. persistProgress (useGameLogic) reescribe ese objeto entero
 * en cada movimiento de pieza; si la bandera viviera ahí, cualquier guardado
 * que no la conociera la resetearía a false sin querer. Aislada en su propia
 * clave, no depende de que todos los guardados de progreso la incluyan.
 */
const TUTORIAL_SEEN_KEY = 'reto-al-espejo:tutorial-seen:v1';

export const loadTutorialSeen = (): boolean => {
  try {
    return localStorage.getItem(TUTORIAL_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

export const saveTutorialSeen = (): void => {
  try {
    localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
  } catch {
    // Modo privado, cuota agotada, etc: el tutorial podría repetirse esta sesión.
  }
};
