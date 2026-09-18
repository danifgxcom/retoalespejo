import { GameGeometry } from './GameGeometry';
import { getPartsInWorld } from './PieceShape';
import type { Piece, PiecePosition } from './types';

export type { PiecePosition } from './types';

// Validación de la solución del jugador contra el objetivo del reto.
//
// `reason` clasifica el fallo (para poder reaccionar a él, p.ej. en la UI) y
// `pieceIndex` señala, cuando aplica, el índice dentro del array `pieces`
// pasado a `validateSolution` de la pieza implicada - así el llamador puede
// resaltarla en el lienzo (F10). Ambos son opcionales: no todos los fallos
// apuntan a una pieza concreta (p.ej. "faltan piezas").
export type ValidationFailureReason =
  | 'no_pieces'
  | 'piece_count_mismatch'
  | 'not_connected'
  | 'not_touching_mirror'
  | 'overlap'
  | 'enters_mirror'
  | 'invalid_configuration'
  | 'missing_piece'
  | 'wrong_rotation'
  | 'wrong_position'
  | 'mismatch';

export interface ValidationResult {
  isCorrect: boolean;
  message: string;
  reason?: ValidationFailureReason;
  pieceIndex?: number;
}

type PlacedPiece = Piece;
type ValidationChallenge = { piecesNeeded: number; objective: { playerPieces: PiecePosition[] } };

/**
 * Márgenes con los que se da por buena una pieza.
 *
 * El jugador encaja en una retícula de 10 px y las posiciones objetivo no
 * siempre caen en ella, así que exigir coincidencia exacta haría irresolubles
 * algunos retos: 20 px cubre ese desfase y poco más.
 *
 * En giro, el paso es de 45°, así que el margen es medio paso: una pieza girada
 * un paso entero tiene que fallar. (Antes valía 45 y una pieza mal girada se
 * daba por buena.)
 */
export const SOLUTION_TOLERANCE = {
  position: 20,
  rotation: 22,
} as const;

/**
 * Margen con el que se dan por iguales dos figuras compuestas.
 *
 * `step` es el paso de muestreo del área. `jitter` desplaza las muestras para
 * que no caigan justo sobre los bordes, donde el resultado depende de qué pieza
 * reclama el punto. `area` es la fracción de área que pueden discrepar: dos
 * descomposiciones de la MISMA figura discrepan ~0.05% (sólo en las fronteras
 * internas, que están en sitios distintos), mientras que la diferencia más
 * pequeña que puede haber entre dos figuras DISTINTAS es un triángulo pequeño
 * de la pieza, un 1.6% del área de la figura más grande de los 16 retos. El
 * 0.5% cae holgadamente entre las dos.
 */
export const FIGURE_TOLERANCE = {
  step: 4,
  jitter: 0.37,
  area: 0.005,
} as const;

/** Tamaño de pieza del juego; el único que se usa en los 16 retos. */
const DEFAULT_PIECE_SIZE = 100;

type ColourRegion = {
  colour: 1 | 2;
  points: Array<[number, number]>;
  minX: number; maxX: number; minY: number; maxY: number;
};

export class ValidationService {
  static calculateCentroid(pieces: PiecePosition[]): { x: number; y: number } {
    if (pieces.length === 0) return { x: 0, y: 0 };
    const sumX = pieces.reduce((sum, piece) => sum + piece.x, 0);
    const sumY = pieces.reduce((sum, piece) => sum + piece.y, 0);
    return { x: sumX / pieces.length, y: sumY / pieces.length };
  }

  static normalizePiecesToCentroid(pieces: PiecePosition[]): PiecePosition[] {
    const centroid = this.calculateCentroid(pieces);
    return pieces.map(piece => ({ ...piece, x: piece.x - centroid.x, y: piece.y - centroid.y }));
  }

  /**
   * Normaliza SÓLO en vertical.
   *
   * Deslizar la figura entera hacia arriba o hacia abajo produce la misma
   * figura compuesta, así que esa libertad se le concede al jugador. En
   * horizontal no: la X mide la distancia al espejo, y moverla cambia por
   * completo cómo encaja la figura con su reflejo. Por eso la X se compara tal
   * cual. Normalizar también en X — como se hacía antes — daba por buenas
   * figuras que en el espejo no se parecen en nada al objetivo.
   */
  static normalizeVertically(pieces: PiecePosition[]): PiecePosition[] {
    const meanY = this.calculateCentroid(pieces).y;
    return pieces.map(piece => ({ ...piece, y: piece.y - meanY }));
  }

  private static rotationDelta(a: number, b: number): number {
    const diff = Math.abs(((a - b) % 360 + 360) % 360);
    return Math.min(diff, 360 - diff);
  }

  private static isWithinTolerance(placed: PiecePosition, target: PiecePosition): boolean {
    if (placed.type !== target.type || placed.face !== target.face) return false;
    if (this.rotationDelta(placed.rotation, target.rotation) > SOLUTION_TOLERANCE.rotation) return false;
    return Math.hypot(placed.x - target.x, placed.y - target.y) <= SOLUTION_TOLERANCE.position;
  }

  /**
   * Busca una correspondencia completa entre piezas colocadas y objetivo.
   *
   * Es una búsqueda con vuelta atrás en lugar del emparejamiento voraz de
   * antes, que ordenaba sólo por diferencia de giro e ignoraba la posición: con
   * dos piezas del mismo tipo las intercambiaba y declaraba incorrecta una
   * solución buena. Con un puñado de piezas por reto el coste es irrelevante y
   * el resultado es exacto.
   *
   * Devuelve, por cada pieza objetivo, el índice de la pieza colocada que le
   * corresponde, o `null` si no existe ninguna correspondencia válida.
   */
  static findMatching(placed: PiecePosition[], target: PiecePosition[]): number[] | null {
    const assignment: number[] = [];
    const used = new Array(placed.length).fill(false);

    const search = (targetIndex: number): boolean => {
      if (targetIndex === target.length) return true;

      for (let i = 0; i < placed.length; i++) {
        if (used[i] || !this.isWithinTolerance(placed[i], target[targetIndex])) continue;

        used[i] = true;
        assignment[targetIndex] = i;
        if (search(targetIndex + 1)) return true;
        used[i] = false;
      }

      return false;
    };

    return search(0) ? assignment : null;
  }

  /**
   * Regiones de color de la figura, con su caja envolvente para poder descartar
   * rápido al muestrear. `colour` es 1 para el color del cuadrado y 2 para el de
   * los triángulos de la cara "front"; la cara "back" los intercambia, que es
   * justo lo que ve el jugador.
   */
  private static colourRegions(pieces: PiecePosition[], pieceSize: number): ColourRegion[] {
    return pieces.flatMap(piece =>
      getPartsInWorld(piece, pieceSize).map(part => {
        const xs = part.points.map(([x]) => x);
        const ys = part.points.map(([, y]) => y);
        const esCuadrado = part.kind === 'center';
        return {
          colour: (esCuadrado === (piece.face === 'front') ? 1 : 2) as 1 | 2,
          points: part.points,
          minX: Math.min(...xs), maxX: Math.max(...xs),
          minY: Math.min(...ys), maxY: Math.max(...ys),
        };
      })
    );
  }

  private static colourAt(regions: ColourRegion[], x: number, y: number): 0 | 1 | 2 {
    for (const region of regions) {
      if (x < region.minX || x > region.maxX || y < region.minY || y > region.maxY) continue;

      const { points } = region;
      let dentro = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
      }
      if (dentro) return region.colour;
    }
    return 0;
  }

  /**
   * ¿Componen las dos colocaciones la MISMA figura?
   *
   * Es la pregunta que de verdad hace el juego. La tarjeta del reto dibuja la
   * figura por regiones de color a propósito, sin enseñar dónde acaba cada
   * pieza (como las tarjetas originales), así que el jugador no puede saber con
   * qué descomposición se escribió el objetivo — y no tiene por qué: varias
   * descomposiciones distintas dan la misma figura. El reto 16 tiene al menos
   * dos, y exigir la del fichero daba por incorrecta una solución que en
   * pantalla es idéntica al objetivo.
   *
   * Se normaliza en vertical por el borde SUPERIOR de la figura, no por el
   * centroide de las piezas: el centroide depende de cómo se descompuso y aquí
   * hay que comparar figuras, no piezas. En horizontal no se normaliza, por lo
   * mismo que en `normalizeVertically`.
   *
   * Basta con comparar el lado del jugador: el reflejo es función de él.
   */
  static figuresMatch(
    placed: PiecePosition[],
    target: PiecePosition[],
    pieceSize: number = DEFAULT_PIECE_SIZE
  ): boolean {
    const colocadas = this.colourRegions(placed, pieceSize);
    const objetivo = this.colourRegions(target, pieceSize);
    if (colocadas.length === 0 || objetivo.length === 0) return false;

    const arribaA = Math.min(...colocadas.map(r => r.minY));
    const arribaB = Math.min(...objetivo.map(r => r.minY));

    const { step, jitter, area } = FIGURE_TOLERANCE;
    const x0 = Math.min(...colocadas.map(r => r.minX), ...objetivo.map(r => r.minX));
    const x1 = Math.max(...colocadas.map(r => r.maxX), ...objetivo.map(r => r.maxX));
    const alto = Math.max(
      Math.max(...colocadas.map(r => r.maxY)) - arribaA,
      Math.max(...objetivo.map(r => r.maxY)) - arribaB
    );

    let discrepan = 0;
    let pintadas = 0;
    for (let y = 0; y <= alto; y += step) {
      for (let x = x0; x <= x1; x += step) {
        const a = this.colourAt(colocadas, x + jitter, y + arribaA + jitter);
        const b = this.colourAt(objetivo, x + jitter, y + arribaB + jitter);
        if (b !== 0) pintadas++;
        if (a !== b) discrepan++;
      }
    }

    return pintadas > 0 && discrepan <= pintadas * area;
  }

  static checkRelativePositions(
    placed: PiecePosition[],
    target: PiecePosition[],
    pieceSize: number = DEFAULT_PIECE_SIZE
  ): ValidationResult {
    const normalizedPlaced = this.normalizeVertically(placed);
    const normalizedTarget = this.normalizeVertically(target);

    // Primero el emparejamiento pieza a pieza: es exacto, barato y permite
    // decirle al jugador QUÉ pieza mirar cuando falla. La comparación de
    // figuras sólo añade aciertos, nunca quita: si la descomposición coincide,
    // la figura también.
    if (this.findMatching(normalizedPlaced, normalizedTarget)) {
      return { isCorrect: true, message: '¡Perfecto! Configuración correcta.' };
    }

    if (this.figuresMatch(placed, target, pieceSize)) {
      return { isCorrect: true, message: '¡Perfecto! Configuración correcta.' };
    }

    const { message, reason, pieceIndex } = this.explainMismatch(normalizedPlaced, normalizedTarget);
    return { isCorrect: false, message, reason, pieceIndex };
  }

  /**
   * Cuando no hay correspondencia, busca la pieza objetivo peor servida para
   * decirle al jugador qué mirar, en vez de un "configuración inválida" a secas.
   *
   * `pieceIndex`, cuando se devuelve, es el índice dentro de `placed` (mismo
   * orden que recibió `checkRelativePositions`) de la pieza señalada.
   */
  private static explainMismatch(
    placed: PiecePosition[],
    target: PiecePosition[]
  ): { message: string; reason: ValidationFailureReason; pieceIndex?: number } {
    for (const targetPiece of target) {
      const candidatos = placed
        .map((p, index) => ({ p, index }))
        .filter(({ p }) => p.type === targetPiece.type && p.face === targetPiece.face);

      if (candidatos.length === 0) {
        return {
          reason: 'missing_piece',
          message: `Falta una pieza ${targetPiece.type} con la cara ${targetPiece.face === 'front' ? 'amarilla' : 'roja'}.`,
        };
      }

      const mejor = candidatos.reduce((a, b) =>
        Math.hypot(a.p.x - targetPiece.x, a.p.y - targetPiece.y) <= Math.hypot(b.p.x - targetPiece.x, b.p.y - targetPiece.y) ? a : b
      );

      const giro = this.rotationDelta(mejor.p.rotation, targetPiece.rotation);
      if (giro > SOLUTION_TOLERANCE.rotation) {
        return {
          reason: 'wrong_rotation',
          pieceIndex: mejor.index,
          message: `Hay una pieza ${targetPiece.type} girada ${Math.round(giro)}° de más.`,
        };
      }

      const distancia = Math.hypot(mejor.p.x - targetPiece.x, mejor.p.y - targetPiece.y);
      if (distancia > SOLUTION_TOLERANCE.position) {
        return {
          reason: 'wrong_position',
          pieceIndex: mejor.index,
          message: `Hay una pieza ${targetPiece.type} a ${Math.round(distancia)} px de su sitio.`,
        };
      }
    }

    return { reason: 'mismatch', message: 'Las piezas no están colocadas como en el reto.' };
  }

  static validateSolution(pieces: PlacedPiece[], challenge: ValidationChallenge, geometryValidator?: Pick<GameGeometry, 'validateChallengeCard' | 'getConfig'>): ValidationResult {
    // `placed` ya lo mantiene el manejador de ratón con la geometría real; no
    // hace falta volver a comparar la Y contra un número mágico.
    //
    // Se conserva el índice de cada pieza colocada dentro del array original
    // `pieces` (no sólo dentro del subconjunto filtrado): es lo que necesita
    // el llamador para resaltarla en el lienzo (F10, `pieceIndex`).
    const placedEntries = pieces
      .map((piece, index) => ({ piece, index }))
      .filter(({ piece }) => piece.placed);

    const placedPieces: PiecePosition[] = placedEntries.map(({ piece: { type, face, x, y, rotation } }) => ({ type, face, x, y, rotation }));

    if (placedPieces.length === 0) {
      return { isCorrect: false, reason: 'no_pieces', message: 'Debes colocar piezas en el área de juego.' };
    }

    if (placedPieces.length !== challenge.piecesNeeded) {
      return {
        isCorrect: false,
        reason: 'piece_count_mismatch',
        message: `Necesitas ${challenge.piecesNeeded} piezas. Tienes ${placedPieces.length}.`,
      };
    }

    if (geometryValidator) {
      const validation = geometryValidator.validateChallengeCard(placedPieces);
      if (!validation.isValid) {
        if (!validation.piecesConnected) return { isCorrect: false, reason: 'not_connected', message: 'Las piezas deben estar conectadas.' };
        if (!validation.touchesMirror) return { isCorrect: false, reason: 'not_touching_mirror', message: 'Una pieza debe tocar el espejo.' };
        if (validation.hasPieceOverlaps) return { isCorrect: false, reason: 'overlap', message: 'Las piezas no pueden solaparse.' };
        if (validation.entersMirror) return { isCorrect: false, reason: 'enters_mirror', message: 'Las piezas no pueden entrar al espejo.' };
        return { isCorrect: false, reason: 'invalid_configuration', message: 'Configuración inválida.' };
      }
    }

    const result = this.checkRelativePositions(
      placedPieces,
      challenge.objective.playerPieces,
      geometryValidator?.getConfig?.().pieceSize ?? DEFAULT_PIECE_SIZE
    );
    if (result.pieceIndex === undefined) return result;

    // El índice que devuelve checkRelativePositions es local a placedPieces;
    // se traduce aquí al índice real dentro del array que pasó el llamador.
    return { ...result, pieceIndex: placedEntries[result.pieceIndex].index };
  }
}
