import { createHistory, pushSnapshot, undoStep, redoStep, HistoryState } from '../../utils/progress/undoHistory';

/**
 * F13: deshacer/rehacer. Estados de prueba mínimos (números en vez de Piece[]
 * completos): lo que importa es la mecánica de la pila, no la forma del dato.
 */
describe('undoHistory', () => {
  test('createHistory empieza vacío: no hay nada que deshacer ni rehacer', () => {
    const history = createHistory<number>();
    expect(history).toEqual({ past: [], future: [] });
    expect(undoStep(history, 0)).toBeNull();
    expect(redoStep(history, 0)).toBeNull();
  });

  test('deshacer devuelve exactamente el estado anterior', () => {
    let history = createHistory<number>();
    history = pushSnapshot(history, 1); // antes de pasar de 1 a 2
    const present = 2;

    const result = undoStep(history, present);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(1);
    expect(result!.history.past).toEqual([]);
  });

  test('rehacer devuelve exactamente el estado posterior', () => {
    let history = createHistory<number>();
    history = pushSnapshot(history, 1);
    const undone = undoStep(history, 2)!; // vuelve a 1, guarda 2 como futuro

    const redone = redoStep(undone.history, undone.value);
    expect(redone).not.toBeNull();
    expect(redone!.value).toBe(2);
    expect(redone!.history.future).toEqual([]);
  });

  test('deshacer y rehacer encadenados son inversos exactos', () => {
    let history = createHistory<number>();
    let present = 0;
    [1, 2, 3].forEach(next => {
      history = pushSnapshot(history, present);
      present = next;
    });
    // Estado: past=[0,1,2], present=3

    const u1 = undoStep(history, present)!;
    expect(u1.value).toBe(2);
    const u2 = undoStep(u1.history, u1.value)!;
    expect(u2.value).toBe(1);

    const r1 = redoStep(u2.history, u2.value)!;
    expect(r1.value).toBe(2);
    const r2 = redoStep(r1.history, r1.value)!;
    expect(r2.value).toBe(3);
    // Vuelta al punto de partida: nada más que rehacer.
    expect(redoStep(r2.history, r2.value)).toBeNull();
  });

  test('una acción nueva descarta el futuro pendiente', () => {
    let history = createHistory<number>();
    history = pushSnapshot(history, 1);
    const undone = undoStep(history, 2)!; // future = [2]
    expect(undone.history.future).toEqual([2]);

    // Nueva acción discreta desde el estado restaurado (1 -> 5).
    const afterNewAction = pushSnapshot(undone.history, undone.value);
    expect(afterNewAction.future).toEqual([]);
    expect(redoStep(afterNewAction, 5)).toBeNull();
  });

  test('la pila respeta el tope: sólo conserva los últimos `maxHistory` estados', () => {
    let history = createHistory<number>();
    for (let i = 0; i < 15; i++) {
      history = pushSnapshot(history, i, 10);
    }
    expect(history.past).toHaveLength(10);
    // Se descartan los más antiguos (0..4), quedan 5..14.
    expect(history.past).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  test('cambiar de reto vacía la pila: un historial nuevo no arrastra nada', () => {
    let history = createHistory<number>();
    history = pushSnapshot(history, 1);
    history = undoStep(history, 2)!.history; // deja también futuro pendiente
    expect(history.past.length + history.future.length).toBeGreaterThan(0);

    // Cambiar de reto = sustituir el historial por uno nuevo, no mutarlo.
    const freshHistory: HistoryState<number> = createHistory<number>();
    expect(undoStep(freshHistory, 99)).toBeNull();
    expect(redoStep(freshHistory, 99)).toBeNull();
  });
});
