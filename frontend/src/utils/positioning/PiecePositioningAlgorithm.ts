import { GameGeometry, PiecePosition } from '@reto/geometry';

export interface PositioningArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositioningResult {
  success: boolean;
  positions: Array<{x: number, y: number, rotation: number}>;
  error?: string;
}

export class PiecePositioningAlgorithm {
  private geometry: GameGeometry;
  private pieceSize: number;
  private minSpacing: number; // Espacio mínimo entre piezas

  constructor(geometry: GameGeometry, pieceSize: number = 100, minSpacing: number = 20) {
    this.geometry = geometry;
    this.pieceSize = pieceSize;
    this.minSpacing = minSpacing;
  }

  /**
   * Verifica si una pieza está completamente dentro del área usando geometría precisa
   */
  private isPieceCompletelyInArea(piece: PiecePosition, area: PositioningArea): boolean {
    const vertices = this.geometry.getPieceVertices(piece);
    const epsilon = 0.001;

    // Todos los vértices deben estar dentro del área
    for (const [x, y] of vertices) {
      if (x < area.x - epsilon || x > area.x + area.width + epsilon ||
          y < area.y - epsilon || y > area.y + area.height + epsilon) {
        return false;
      }
    }
    return true;
  }

  /**
   * Posiciona N piezas dentro de un área dada sin solapamiento
   */
  positionPieces(
    numPieces: number, 
    area: PositioningArea,
    pieceTypes: Array<'A' | 'B'>,
    pieceSpacing: number = this.minSpacing
  ): PositioningResult {
    if (numPieces <= 0) {
      return { success: false, positions: [], error: 'Number of pieces must be greater than 0' };
    }

    if (pieceTypes.length !== numPieces) {
      return { success: false, positions: [], error: 'pieceTypes array must match numPieces' };
    }

    // Para geometrías complejas, no podemos calcular fácilmente el área efectiva
    // Usaremos el área completa y verificaremos con geometría precisa
    if (area.width <= 0 || area.height <= 0) {
      return {
        success: false,
        positions: [],
        error: `Invalid area: ${area.width}x${area.height}`
      };
    }

    if (area.width < this.pieceSize || area.height < this.pieceSize) {
      return {
        success: false,
        positions: [],
        error: `Area too small: ${area.width}x${area.height} for piece size ${this.pieceSize}`
      };
    }

    return this.tryShelfPacking(numPieces, area, pieceTypes, pieceSpacing);
  }

  private tryShelfPacking(
    numPieces: number,
    area: PositioningArea,
    pieceTypes: Array<'A' | 'B'>,
    spacing: number
  ): PositioningResult {
    const compactPieces = pieceTypes.map((type, index) => {
      const rotation = this.getCompactStorageRotation(type, index);
      const originPiece: PiecePosition = { type, face: 'front', x: 0, y: 0, rotation };
      const originBox = this.geometry.getPieceBoundingBox(originPiece);

      return {
        type,
        rotation,
        originBox,
        width: originBox.right - originBox.left,
        height: originBox.bottom - originBox.top
      };
    });

    const cellWidth = Math.max(...compactPieces.map(piece => piece.width));
    const cellHeight = Math.max(...compactPieces.map(piece => piece.height));
    const maxColumns = Math.max(1, Math.floor((area.width + spacing) / (cellWidth + spacing)));

    for (let columns = Math.min(numPieces, maxColumns); columns >= 1; columns--) {
      const rows = Math.ceil(numPieces / columns);
      const layoutWidth = columns * cellWidth + (columns - 1) * spacing;
      const layoutHeight = rows * cellHeight + (rows - 1) * spacing;

      if (layoutWidth > area.width || layoutHeight > area.height) {
        continue;
      }

      const startX = area.x + (area.width - layoutWidth) / 2;
      const startY = area.y + (area.height - layoutHeight) / 2;
      const pieces: PiecePosition[] = [];
      const positions: Array<{ x: number; y: number; rotation: number }> = [];

      for (let index = 0; index < numPieces; index++) {
        const row = Math.floor(index / columns);
        const column = index % columns;
        const compactPiece = compactPieces[index];
        const left = startX + column * (cellWidth + spacing) + (cellWidth - compactPiece.width) / 2;
        const top = startY + row * (cellHeight + spacing) + (cellHeight - compactPiece.height) / 2;
        const piece: PiecePosition = {
          type: compactPiece.type,
          face: 'front',
          x: left - compactPiece.originBox.left,
          y: top - compactPiece.originBox.top,
          rotation: compactPiece.rotation
        };

        pieces.push(piece);
        positions.push({ x: piece.x, y: piece.y, rotation: piece.rotation });
      }

      const allInArea = pieces.every(piece => this.isPieceCompletelyInArea(piece, area));
      const hasConflicts = pieces.some((piece, index) =>
        pieces.slice(index + 1).some(otherPiece => this.doPiecesConflict(piece, otherPiece, spacing))
      );

      if (allInArea && !hasConflicts) {
        return { success: true, positions };
      }
    }

    return {
      success: false,
      positions: [],
      error: `Could not position ${numPieces} pieces without overlap inside ${area.width}x${area.height}`
    };
  }

  private getCompactStorageRotation(type: 'A' | 'B', index: number): number {
    if (type === 'A') {
      return index % 2 === 0 ? 45 : 225;
    }

    return index % 2 === 0 ? 135 : 315;
  }

  /**
   * Estrategia determinista: genera posiciones de bbox dentro del área y usa backtracking
   * con la geometría real de las piezas. Funciona para cualquier número razonable de fichas.
   */

  /**
   * Crea candidatos alineando la bounding box real de una pieza dentro del área.
   */


  private doPiecesConflict(pieceA: PiecePosition, pieceB: PiecePosition, spacing: number): boolean {
    if (this.geometry.doPiecesOverlap(pieceA, pieceB)) {
      return true;
    }

    if (spacing <= 0) {
      return false;
    }

    const boxA = this.geometry.getPieceBoundingBox(pieceA);
    const boxB = this.geometry.getPieceBoundingBox(pieceB);

    return !(
      boxA.right + spacing <= boxB.left + 0.001 ||
      boxB.right + spacing <= boxA.left + 0.001 ||
      boxA.bottom + spacing <= boxB.top + 0.001 ||
      boxB.bottom + spacing <= boxA.top + 0.001
    );
  }

  /**
   * Verifica que no hay solapamientos entre piezas
   */
  checkNoOverlaps(pieces: PiecePosition[]): boolean {
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        if (this.geometry.doPiecesOverlap(pieces[i], pieces[j])) {
          return false;
        }
      }
    }
    return true;
  }
}
