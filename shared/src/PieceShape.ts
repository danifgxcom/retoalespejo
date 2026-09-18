/**
 * Fuente única de verdad de la forma de una pieza.
 *
 * La pieza es un cuadrado central con tres triángulos pegados: uno grande a la
 * izquierda, y dos isósceles (de media altura) arriba y a la derecha.
 *
 *            /\                     Coordenadas "de unidad": el lado del
 *      _____/  \                    cuadrado central vale 1, el eje Y apunta
 *     |\   |    |\                  hacia ARRIBA (al contrario que el canvas).
 *     | \  |    | >
 *     |__\_|____|/
 *     0    1    2   2.5
 *
 * `piece.x` / `piece.y` son el CENTRO de la pieza, que es también su pivote de
 * rotación: el centro del cuadrado central. Se eligió ese punto y no el
 * centroide de área porque cae en la retícula, así que los giros de 45° y el
 * encaje entre piezas siguen siendo exactos.
 *
 * `pieceSize` es sólo el mando de escala; la pieza NO mide `pieceSize` de lado
 * (ver `getPieceExtent`).
 */

import type { PieceType } from './types';

export type { PieceType } from './types';

/** Lado del cuadrado central, en múltiplos de `pieceSize`. */
export const PIECE_UNIT_RATIO = 1.28;

/** Centro de la pieza (= centro del cuadrado central) en coordenadas de unidad. */
const CENTRE_UNITS = { x: 1.5, y: 0.5 } as const;

/** Contorno exterior, en orden, sin repetir el vértice de cierre. */
export const PIECE_OUTLINE_UNITS: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [1, 0], [2, 0], [2.5, 0.5], [2, 1], [1.5, 1.5], [1, 1],
];

/**
 * Piezas de color que componen la figura, en orden de pintado: los triángulos
 * primero y el cuadrado encima, para que el solape mínimo entre bordes no deje
 * costuras claras.
 */
export const PIECE_PARTS: ReadonlyArray<{
  readonly kind: 'center' | 'triangle';
  readonly units: ReadonlyArray<readonly [number, number]>;
}> = [
  { kind: 'triangle', units: [[0, 0], [1, 0], [1, 1]] },
  { kind: 'triangle', units: [[1, 1], [2, 1], [1.5, 1.5]] },
  { kind: 'triangle', units: [[2, 0], [2, 1], [2.5, 0.5]] },
  { kind: 'center', units: [[1, 0], [2, 0], [2, 1], [1, 1]] },
];

/** Lado del cuadrado central en píxeles. */
export const getUnit = (pieceSize: number): number => pieceSize * PIECE_UNIT_RATIO;

/**
 * Convierte un punto de coordenadas de unidad a píxeles relativos al centro de
 * la pieza, ya en el sistema del canvas (Y hacia abajo).
 *
 * No aplica el volteo del tipo B: al dibujar lo hace el propio contexto con
 * `scale(-1, 1)`, y en los cálculos lo aplica `getLocalVertices`.
 */
export const toLocalPoint = (
  xUnits: number,
  yUnits: number,
  pieceSize: number
): [number, number] => {
  const unit = getUnit(pieceSize);
  return [(xUnits - CENTRE_UNITS.x) * unit, -(yUnits - CENTRE_UNITS.y) * unit];
};

/** Contorno en píxeles relativo al centro, con el volteo del tipo ya aplicado. */
export const getLocalVertices = (
  type: PieceType,
  pieceSize: number
): Array<[number, number]> =>
  PIECE_OUTLINE_UNITS.map(([xUnits, yUnits]) => {
    const [x, y] = toLocalPoint(xUnits, yUnits, pieceSize);
    return [type === 'B' ? -x : x, y];
  });

/** Contorno en coordenadas de pantalla, con posición y rotación aplicadas. */
export const getWorldVertices = (
  piece: { type: PieceType; x: number; y: number; rotation: number },
  pieceSize: number
): Array<[number, number]> => {
  const rad = (piece.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return getLocalVertices(piece.type, pieceSize).map(([x, y]) => [
    piece.x + x * cos - y * sin,
    piece.y + x * sin + y * cos,
  ]);
};

/**
 * Extensión real de la pieza sin rotar, en píxeles. Es lo que hay que usar
 * donde antes se asumía, erróneamente, una caja de `pieceSize` × `pieceSize`.
 */
export const getPieceExtent = (pieceSize: number): { width: number; height: number } => {
  const unit = getUnit(pieceSize);
  return { width: 2.5 * unit, height: 1.5 * unit };
};

/** Radio del círculo que envuelve a la pieza: cota válida para cualquier giro. */
export const getPieceRadius = (pieceSize: number): number =>
  getLocalVertices('A', pieceSize).reduce(
    (max, [x, y]) => Math.max(max, Math.hypot(x, y)),
    0
  );
