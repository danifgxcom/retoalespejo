import { GameGeometry } from './GameGeometry';
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

  static checkRelativePositions(placed: PiecePosition[], target: PiecePosition[]): ValidationResult {
    const normalizedPlaced = this.normalizeVertically(placed);
    const normalizedTarget = this.normalizeVertically(target);

    if (this.findMatching(normalizedPlaced, normalizedTarget)) {
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

  static validateSolution(pieces: PlacedPiece[], challenge: ValidationChallenge, geometryValidator?: Pick<GameGeometry, 'validateChallengeCard'>): ValidationResult {
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

    const result = this.checkRelativePositions(placedPieces, challenge.objective.playerPieces);
    if (result.pieceIndex === undefined) return result;

    // El índice que devuelve checkRelativePositions es local a placedPieces;
    // se traduce aquí al índice real dentro del array que pasó el llamador.
    return { ...result, pieceIndex: placedEntries[result.pieceIndex].index };
  }
}
