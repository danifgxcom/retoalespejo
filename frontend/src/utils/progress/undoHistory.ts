/**
 * F13: mecánica de deshacer/rehacer.
 *
 * Lógica pura (sin React) sobre un historial {past, future}: el estado
 * "present" vive fuera (en useGameLogic, como `pieces`), aquí sólo se anota
 * de dónde viene y a dónde se puede volver. Así se puede comprobar con un
 * test directo, sin montar el hook completo ni simular fetch.
 */

export interface HistoryState<T> {
  past: T[];
  future: T[];
}

export interface HistoryStep<T> {
  history: HistoryState<T>;
  value: T;
}

const MAX_HISTORY = 10;

export const createHistory = <T,>(): HistoryState<T> => ({ past: [], future: [] });

/**
 * Registra el estado ANTERIOR a una acción discreta (soltar un arrastre,
 * girar, voltear, reiniciar). Cualquier acción nueva descarta el rehacer
 * pendiente: es la semántica estándar de undo/redo. La pila conserva como
 * máximo `maxHistory` estados.
 */
export const pushSnapshot = <T,>(
  history: HistoryState<T>,
  snapshot: T,
  maxHistory: number = MAX_HISTORY
): HistoryState<T> => ({
  past: [...history.past, snapshot].slice(-maxHistory),
  future: []
});

/**
 * Deshace un paso: `null` si no hay nada que deshacer. `present` es el
 * estado actual (antes de deshacer), que pasa a la pila de rehacer.
 */
export const undoStep = <T,>(
  history: HistoryState<T>,
  present: T,
  maxHistory: number = MAX_HISTORY
): HistoryStep<T> | null => {
  if (history.past.length === 0) return null;

  const value = history.past[history.past.length - 1];
  return {
    value,
    history: {
      past: history.past.slice(0, -1),
      future: [...history.future, present].slice(-maxHistory)
    }
  };
};

/**
 * Rehace un paso: `null` si no hay nada que rehacer. `present` es el estado
 * actual (antes de rehacer), que vuelve a la pila de deshacer.
 */
export const redoStep = <T,>(
  history: HistoryState<T>,
  present: T,
  maxHistory: number = MAX_HISTORY
): HistoryStep<T> | null => {
  if (history.future.length === 0) return null;

  const value = history.future[history.future.length - 1];
  return {
    value,
    history: {
      past: [...history.past, present].slice(-maxHistory),
      future: history.future.slice(0, -1)
    }
  };
};
