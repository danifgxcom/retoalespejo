// Clean validation service extracted from useGameLogic
export interface PiecePosition {
  type: 'A' | 'B';
  face: 'front' | 'back';
  x: number;
  y: number;
  rotation: number;
}

export interface ValidationResult {
  isCorrect: boolean;
  message: string;
}

export class ValidationService {
  static calculateCentroid(pieces: PiecePosition[]): { x: number; y: number } {
    if (pieces.length === 0) return { x: 0, y: 0 };
    const sumX = pieces.reduce((sum, piece) => sum + piece.x, 0);
    const sumY = pieces.reduce((sum, piece) => sum + piece.y, 0);
    return { x: sumX / pieces.length, y: sumY / pieces.length };
  }

  static normalizePiecesToCentroid(pieces: PiecePosition[]): PiecePosition[] {
    const centroid = this.calculateCentroid(pieces);
    return pieces.map(piece => ({
      ...piece,
      x: piece.x - centroid.x,
      y: piece.y - centroid.y
    }));
  }

  static findOptimalPieceAssignment(placed: PiecePosition[], target: PiecePosition[]): PiecePosition[] {
    const assignments: PiecePosition[] = new Array(target.length);
    const used: boolean[] = new Array(placed.length).fill(false);

    for (let i = 0; i < target.length; i++) {
      let bestMatch: PiecePosition | null = null;
      let bestDistance = Infinity;
      let bestIndex = -1;

      for (let j = 0; j < placed.length; j++) {
        if (used[j] || placed[j].type !== target[i].type || placed[j].face !== target[i].face) continue;

        const rotDiff = Math.abs(placed[j].rotation - target[i].rotation);
        const normalizedDiff = Math.min(rotDiff, 360 - rotDiff);

        if (normalizedDiff < bestDistance) {
          bestDistance = normalizedDiff;
          bestMatch = placed[j];
          bestIndex = j;
        }
      }

      if (bestMatch && bestIndex !== -1) {
        assignments[i] = bestMatch;
        used[bestIndex] = true;
      }
    }
    return assignments;
  }

  static checkRelativePositions(placed: PiecePosition[], target: PiecePosition[]): ValidationResult {
    const TOLERANCE = 30;
    const ROT_TOLERANCE = 15;

    const normalizedPlaced = this.normalizePiecesToCentroid(placed);
    const normalizedTarget = this.normalizePiecesToCentroid(target);
    const assignments = this.findOptimalPieceAssignment(normalizedPlaced, normalizedTarget);

    for (let i = 0; i < normalizedTarget.length; i++) {
      const targetPiece = normalizedTarget[i];
      const matchingPiece = assignments[i];

      if (!matchingPiece) {
        return {
          isCorrect: false,
          message: `Falta pieza ${target[i].type} con cara ${target[i].face}`
        };
      }

      const posDiff = Math.sqrt(
        Math.pow(matchingPiece.x - targetPiece.x, 2) + 
        Math.pow(matchingPiece.y - targetPiece.y, 2)
      );

      if (posDiff > TOLERANCE) {
        return {
          isCorrect: false,
          message: `Pieza ${target[i].type} necesita estar en la posición correcta relativa`
        };
      }

      const rotDiff = Math.abs(matchingPiece.rotation - targetPiece.rotation);
      const normalizedRotDiff = Math.min(rotDiff, 360 - rotDiff);

      if (normalizedRotDiff > ROT_TOLERANCE) {
        return {
          isCorrect: false,
          message: `Pieza ${target[i].type} necesita rotación diferente`
        };
      }
    }

    return { isCorrect: true, message: '¡Perfecto! Configuración correcta.' };
  }

  static validateSolution(pieces: any[], challenge: any, geometryValidator?: any): ValidationResult {
    const placedPieces = pieces
      .filter(piece => piece.placed && piece.y < 600)
      .map(piece => ({
        type: piece.type,
        face: piece.face,
        x: piece.x,
        y: piece.y,
        rotation: piece.rotation
      }));

    if (placedPieces.length !== challenge.piecesNeeded) {
      return {
        isCorrect: false,
        message: `Necesitas ${challenge.piecesNeeded} piezas. Tienes ${placedPieces.length}.`
      };
    }

    if (placedPieces.length === 0) {
      return { isCorrect: false, message: "Debes colocar piezas en el área de juego." };
    }

    if (geometryValidator) {
      const validation = geometryValidator.validateChallengeCard(placedPieces);
      if (!validation.isValid) {
        if (!validation.piecesConnected) return { isCorrect: false, message: "Las piezas deben estar conectadas." };
        if (!validation.touchesMirror) return { isCorrect: false, message: "Una pieza debe tocar el espejo." };
        if (validation.hasPieceOverlaps) return { isCorrect: false, message: "Las piezas no pueden solaparse." };
        if (validation.entersMirror) return { isCorrect: false, message: "Las piezas no pueden entrar al espejo." };
        return { isCorrect: false, message: "Configuración inválida." };
      }
    }

    return this.checkRelativePositions(placedPieces, challenge.objective.playerPieces);
  }
}