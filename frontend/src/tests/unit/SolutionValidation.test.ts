import { ValidationService, SOLUTION_TOLERANCE, PiecePosition } from '@reto/geometry';

const pieza = (over: Partial<PiecePosition> = {}): PiecePosition => ({
  type: 'A',
  face: 'front',
  x: 600,
  y: 250,
  rotation: 0,
  ...over,
});

const mover = (piezas: PiecePosition[], dx: number, dy: number) =>
  piezas.map(p => ({ ...p, x: p.x + dx, y: p.y + dy }));

describe('tolerancias de la solución', () => {
  const objetivo = [pieza(), pieza({ type: 'B', x: 450, y: 300, rotation: 45 })];

  test('una colocación exacta es correcta', () => {
    expect(ValidationService.checkRelativePositions(objetivo, objetivo).isCorrect).toBe(true);
  });

  test('una pieza girada un paso entero (45°) se rechaza', () => {
    // Con la tolerancia anterior (45° con comparación `>`) esto se daba por
    // bueno: era posible resolver un reto con una pieza mal girada.
    const conGiro = [pieza({ rotation: 45 }), objetivo[1]];
    expect(ValidationService.checkRelativePositions(conGiro, objetivo).isCorrect).toBe(false);
  });

  test('media vuelta de giro se acepta dentro del margen', () => {
    const casiBien = [pieza({ rotation: SOLUTION_TOLERANCE.rotation }), objetivo[1]];
    expect(ValidationService.checkRelativePositions(casiBien, objetivo).isCorrect).toBe(true);
  });

  test('desplazar la figura en horizontal se rechaza: cambia la distancia al espejo', () => {
    // Antes la validación normalizaba también en X, así que una figura alejada
    // del espejo —que en el reflejo compone otra cosa— pasaba como correcta.
    expect(ValidationService.checkRelativePositions(mover(objetivo, -80, 0), objetivo).isCorrect).toBe(false);
  });

  test('desplazar la figura en vertical se acepta: compone la misma figura', () => {
    expect(ValidationService.checkRelativePositions(mover(objetivo, 0, 60), objetivo).isCorrect).toBe(true);
  });

  test('una pieza a 100 px de su sitio se rechaza', () => {
    // La tolerancia vieja era de 200 px en un tablero de 700: casi todo valía.
    const desviada = [pieza({ x: 500 }), objetivo[1]];
    expect(ValidationService.checkRelativePositions(desviada, objetivo).isCorrect).toBe(false);
  });
});

describe('emparejamiento de piezas', () => {
  test('dos piezas del mismo tipo intercambiadas siguen siendo correctas', () => {
    // El emparejamiento voraz anterior ordenaba sólo por diferencia de giro e
    // ignoraba la posición, así que aquí asignaba cruzado y fallaba.
    const objetivo = [pieza({ x: 600, y: 200 }), pieza({ x: 600, y: 350 })];
    const colocadas = [objetivo[1], objetivo[0]];
    expect(ValidationService.findMatching(colocadas, objetivo)).toEqual([1, 0]);
  });

  test('no hay correspondencia si falta una pieza del tipo pedido', () => {
    const objetivo = [pieza(), pieza({ type: 'B' })];
    expect(ValidationService.findMatching([pieza(), pieza()], objetivo)).toBeNull();
  });

  test('no reutiliza la misma pieza para dos objetivos', () => {
    const objetivo = [pieza({ x: 600 }), pieza({ x: 610 })];
    expect(ValidationService.findMatching([pieza({ x: 605 })], objetivo)).toBeNull();
  });
});

describe('validateSolution', () => {
  const challenge = { piecesNeeded: 1, objective: { playerPieces: [pieza()] } };

  test('exige colocar el número de piezas del reto', () => {
    const resultado = ValidationService.validateSolution(
      [{ ...pieza(), placed: true }, { ...pieza({ x: 400 }), placed: true }],
      challenge
    );
    expect(resultado).toEqual({ isCorrect: false, reason: 'piece_count_mismatch', message: 'Necesitas 1 piezas. Tienes 2.' });
  });

  test('ignora las piezas que siguen en el almacén', () => {
    const resultado = ValidationService.validateSolution(
      [{ ...pieza(), placed: true }, { ...pieza({ y: 800 }), placed: false }],
      challenge
    );
    expect(resultado.isCorrect).toBe(true);
  });

  test('el mensaje de error dice qué mirar', () => {
    const resultado = ValidationService.validateSolution(
      [{ ...pieza({ rotation: 90 }), placed: true }],
      challenge
    );
    expect(resultado.isCorrect).toBe(false);
    expect(resultado.message).toMatch(/girada/);
  });

  // F10: reason + pieceIndex permiten resaltar en el lienzo la pieza que falla,
  // sin tocar los mensajes de explainMismatch (que ya son buenos).
  test('señala el índice, dentro del array original, de la pieza mal girada', () => {
    const dosPiezas = { piecesNeeded: 2, objective: { playerPieces: [pieza({ x: 600 }), pieza({ type: 'B', x: 450, rotation: 45 })] } };
    const resultado = ValidationService.validateSolution(
      [
        { ...pieza({ type: 'B', x: 450, rotation: 45 }), placed: true }, // índice 0: correcta
        { ...pieza({ x: 600, rotation: 90 }), placed: true },            // índice 1: mal girada
      ],
      dosPiezas
    );
    expect(resultado.isCorrect).toBe(false);
    expect(resultado.reason).toBe('wrong_rotation');
    expect(resultado.pieceIndex).toBe(1);
  });

  test('sin correspondencia por pieza que falta, no señala ningún índice', () => {
    const resultado = ValidationService.validateSolution(
      [{ ...pieza({ type: 'B' }), placed: true }],
      challenge
    );
    expect(resultado.isCorrect).toBe(false);
    expect(resultado.reason).toBe('missing_piece');
    expect(resultado.pieceIndex).toBeUndefined();
  });

  test('con piezas sin colocar antes en el array, el índice sigue apuntando a la pieza real', () => {
    const dosPiezas = { piecesNeeded: 1, objective: { playerPieces: [pieza()] } };
    const resultado = ValidationService.validateSolution(
      [
        { ...pieza({ y: 800 }), placed: false }, // índice 0: en el almacén, se ignora
        { ...pieza({ rotation: 90 }), placed: true }, // índice 1: la única colocada, mal girada
      ],
      dosPiezas
    );
    expect(resultado.pieceIndex).toBe(1);
  });
});

// Heredado de src/services/__tests__/ValidationService.test.ts, que probaba lo
// mismo con la semántica antigua (normalización también en X) y se eliminó para
// no tener dos ficheros de test sobre la misma clase.
describe('centroide', () => {
  test('el centroide de un conjunto vacío es el origen', () => {
    expect(ValidationService.calculateCentroid([])).toEqual({ x: 0, y: 0 });
  });

  test('el centroide es la media de las posiciones', () => {
    expect(ValidationService.calculateCentroid([pieza({ x: 0, y: 0 }), pieza({ x: 100, y: 100 })]))
      .toEqual({ x: 50, y: 50 });
  });

  test('normalizar al centroide deja las piezas centradas en el origen', () => {
    const [a, b] = ValidationService.normalizePiecesToCentroid([pieza({ x: 0, y: 0 }), pieza({ x: 100, y: 100 })]);
    expect([a.x, a.y, b.x, b.y]).toEqual([-50, -50, 50, 50]);
  });

  test('normalizar sólo en vertical conserva la X, que mide la distancia al espejo', () => {
    const [a, b] = ValidationService.normalizeVertically([pieza({ x: 0, y: 0 }), pieza({ x: 100, y: 100 })]);
    expect([a.x, a.y, b.x, b.y]).toEqual([0, -50, 100, 50]);
  });
});
