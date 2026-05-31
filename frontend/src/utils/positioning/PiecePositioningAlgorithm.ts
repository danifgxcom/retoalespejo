import { GameGeometry, PiecePosition } from '../geometry/GameGeometry';

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
  private readonly preferredRotations = [45, 225, 135, 315, 90, 270, 0, 180];

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
  private tryDeterministicPacking(
    numPieces: number, 
    area: PositioningArea, 
    pieceTypes: Array<'A' | 'B'>,
    spacing: number
  ): PositioningResult {
    const candidatesByIndex = pieceTypes.map(type =>
      this.generateCandidatesForType(type, area, spacing)
    );

    if (candidatesByIndex.some(candidates => candidates.length === 0)) {
      return {
        success: false,
        positions: [],
        error: 'No valid candidate positions fit inside the area'
      };
    }

    const order = pieceTypes
      .map((_, index) => index)
      .sort((a, b) => candidatesByIndex[a].length - candidatesByIndex[b].length || a - b);

    const placedByIndex = new Array<PiecePosition | null>(numPieces).fill(null);
    const placedPieces: PiecePosition[] = [];
    let visitedNodes = 0;
    const maxVisitedNodes = 3000;

    const search = (orderIndex: number): boolean => {
      visitedNodes++;
      if (visitedNodes > maxVisitedNodes) {
        return false;
      }

      if (orderIndex === order.length) {
        return true;
      }

      const pieceIndex = order[orderIndex];
      const candidates = candidatesByIndex[pieceIndex];

      for (const candidate of candidates) {
        if (placedPieces.some(piece => this.doPiecesConflict(candidate, piece, spacing))) {
          continue;
        }

        placedByIndex[pieceIndex] = candidate;
        placedPieces.push(candidate);

        if (search(orderIndex + 1)) {
          return true;
        }

        placedPieces.pop();
        placedByIndex[pieceIndex] = null;
      }

      return false;
    };

    if (!search(0)) {
      return {
        success: false,
        positions: [],
        error: `Could not position ${numPieces} pieces without overlap inside ${area.width}x${area.height}`
      };
    }

    return {
      success: true,
      positions: placedByIndex.map(piece => ({
        x: piece!.x,
        y: piece!.y,
        rotation: piece!.rotation
      }))
    };
  }

  /**
   * Crea candidatos alineando la bounding box real de una pieza dentro del área.
   */
  private generateCandidatesForType(
    type: 'A' | 'B',
    area: PositioningArea,
    spacing: number
  ): PiecePosition[] {
    const candidates: PiecePosition[] = [];
    const paddedArea = {
      x: area.x + spacing,
      y: area.y + spacing,
      width: area.width - spacing * 2,
      height: area.height - spacing * 2
    };

    for (const rotation of this.preferredRotations) {
      const originPiece: PiecePosition = { type, face: 'front', x: 0, y: 0, rotation };
      const originBox = this.geometry.getPieceBoundingBox(originPiece);
      const bboxWidth = originBox.right - originBox.left;
      const bboxHeight = originBox.bottom - originBox.top;

      if (bboxWidth > paddedArea.width || bboxHeight > paddedArea.height) {
        continue;
      }

      const maxLeft = paddedArea.x + paddedArea.width - bboxWidth;
      const maxTop = paddedArea.y + paddedArea.height - bboxHeight;
      const stepX = Math.max(40, Math.floor(bboxWidth + spacing));
      const stepY = Math.max(40, Math.floor(bboxHeight + spacing));
      const leftValues = this.buildAxisPositions(paddedArea.x, maxLeft, stepX);
      const topValues = this.buildAxisPositions(paddedArea.y, maxTop, stepY);

      for (const top of topValues) {
        for (const left of leftValues) {
          const candidate: PiecePosition = {
            type,
            face: 'front',
            x: left - originBox.left,
            y: top - originBox.top,
            rotation
          };

          if (this.isPieceCompletelyInArea(candidate, area)) {
            candidates.push(candidate);
          }
        }
      }
    }

    const centerX = area.x + area.width / 2;
    const centerY = area.y + area.height / 2;

    candidates.sort((a, b) => {
      const boxA = this.geometry.getPieceBoundingBox(a);
      const boxB = this.geometry.getPieceBoundingBox(b);
      const centerAX = (boxA.left + boxA.right) / 2;
      const centerAY = (boxA.top + boxA.bottom) / 2;
      const centerBX = (boxB.left + boxB.right) / 2;
      const centerBY = (boxB.top + boxB.bottom) / 2;
      const distanceA = Math.abs(centerAX - centerX) + Math.abs(centerAY - centerY);
      const distanceB = Math.abs(centerBX - centerX) + Math.abs(centerBY - centerY);

      return distanceA - distanceB || boxA.top - boxB.top || boxA.left - boxB.left;
    });

    return candidates.slice(0, 80);
  }

  private buildAxisPositions(min: number, max: number, step: number): number[] {
    if (max < min) {
      return [];
    }

    const values: number[] = [];
    for (let value = min; value <= max; value += step) {
      values.push(value);
    }

    if (values[values.length - 1] !== max) {
      values.push(max);
    }

    return values;
  }

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
