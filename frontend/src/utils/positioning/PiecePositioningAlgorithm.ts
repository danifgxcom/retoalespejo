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
    
    // Todos los vértices deben estar dentro del área
    for (const [x, y] of vertices) {
      if (x < area.x || x > area.x + area.width || 
          y < area.y || y > area.y + area.height) {
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

    // Intentar diferentes estrategias de posicionamiento
    let result = this.tryGridPositioning(numPieces, area, pieceTypes, pieceSpacing);
    
    if (!result.success && numPieces <= 4) {
      // Para pocas piezas, intentar posicionamiento manual optimizado
      result = this.tryOptimizedPositioning(numPieces, area, pieceTypes, pieceSpacing);
    }

    if (!result.success) {
      // Último recurso: posicionamiento random con múltiples intentos
      result = this.tryRandomPositioning(numPieces, area, pieceTypes, pieceSpacing);
    }

    return result;
  }

  /**
   * Estrategia 1: Posicionamiento incremental con verificación precisa
   */
  private tryGridPositioning(
    numPieces: number, 
    area: PositioningArea, 
    pieceTypes: Array<'A' | 'B'>,
    spacing: number
  ): PositioningResult {
    const positions: Array<{x: number, y: number, rotation: number}> = [];
    const placedPieces: PiecePosition[] = [];

    // Intentar colocar cada pieza de forma incremental
    for (let i = 0; i < numPieces; i++) {
      let pieceSuccess = false;
      const maxAttempts = 200;

      // Probar diferentes posiciones dentro del área
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Generar posición candidata en el área
        const margin = 50; // Margen desde los bordes para evitar que se salgan
        const x = area.x + margin + Math.random() * (area.width - 2 * margin);
        const y = area.y + margin + Math.random() * (area.height - 2 * margin);
        const rotation = 0; // Sin rotación por ahora

        const candidatePiece: PiecePosition = {
          type: pieceTypes[i],
          face: 'front',
          x, y, rotation
        };

        // Verificar que está dentro del área
        if (!this.isPieceCompletelyInArea(candidatePiece, area)) {
          continue;
        }

        // Verificar que no solapa con piezas ya colocadas
        const overlaps = placedPieces.some(existingPiece => 
          this.geometry.doPiecesOverlap(candidatePiece, existingPiece)
        );

        if (!overlaps) {
          positions.push({ x, y, rotation });
          placedPieces.push(candidatePiece);
          pieceSuccess = true;
          break;
        }
      }

      if (!pieceSuccess) {
        return { 
          success: false, 
          positions: [], 
          error: `Could not place piece ${i + 1} of ${numPieces} after ${maxAttempts} attempts` 
        };
      }
    }

    return { success: true, positions };
  }

  /**
   * Estrategia 2: Posicionamiento optimizado para pocas piezas
   */
  private tryOptimizedPositioning(
    numPieces: number, 
    area: PositioningArea, 
    pieceTypes: Array<'A' | 'B'>,
    spacing: number
  ): PositioningResult {
    const positions: Array<{x: number, y: number, rotation: number}> = [];

    switch (numPieces) {
      case 1:
        // Centrar en el área
        positions.push({
          x: area.x + (area.width - this.pieceSize) / 2,
          y: area.y + (area.height - this.pieceSize) / 2,
          rotation: 0
        });
        break;

      case 2:
        // Distribuir horizontalmente si hay espacio, verticalmente si no
        const horizontalSpace = 2 * this.pieceSize + spacing;
        const verticalSpace = 2 * this.pieceSize + spacing;

        if (area.width >= horizontalSpace) {
          // Horizontalmente
          const startX = area.x + (area.width - horizontalSpace) / 2;
          const y = area.y + (area.height - this.pieceSize) / 2;
          
          positions.push({ x: startX, y, rotation: 0 });
          positions.push({ x: startX + this.pieceSize + spacing, y, rotation: 0 });
        } else if (area.height >= verticalSpace) {
          // Verticalmente
          const x = area.x + (area.width - this.pieceSize) / 2;
          const startY = area.y + (area.height - verticalSpace) / 2;
          
          positions.push({ x, y: startY, rotation: 0 });
          positions.push({ x, y: startY + this.pieceSize + spacing, rotation: 0 });
        } else {
          return { success: false, positions: [], error: 'Not enough space for 2 pieces' };
        }
        break;

      case 3:
        // Triángulo o línea horizontal
        const triangleBase = 2 * this.pieceSize + spacing;
        const triangleHeight = this.pieceSize + spacing + this.pieceSize;

        if (area.width >= triangleBase && area.height >= triangleHeight) {
          // Formar triángulo
          const baseY = area.y + area.height - this.pieceSize;
          const topY = area.y;
          const centerX = area.x + area.width / 2;

          positions.push({ x: centerX - this.pieceSize - spacing/2, y: baseY, rotation: 0 });
          positions.push({ x: centerX + spacing/2, y: baseY, rotation: 0 });
          positions.push({ x: centerX - this.pieceSize/2, y: topY, rotation: 0 });
        } else {
          // Línea horizontal
          const lineWidth = 3 * this.pieceSize + 2 * spacing;
          if (area.width >= lineWidth) {
            const startX = area.x + (area.width - lineWidth) / 2;
            const y = area.y + (area.height - this.pieceSize) / 2;
            
            for (let i = 0; i < 3; i++) {
              positions.push({ 
                x: startX + i * (this.pieceSize + spacing), 
                y, 
                rotation: 0 
              });
            }
          } else {
            return { success: false, positions: [], error: 'Not enough space for 3 pieces' };
          }
        }
        break;

      case 4:
        // Grid 2x2
        const gridWidth = 2 * this.pieceSize + spacing;
        const gridHeight = 2 * this.pieceSize + spacing;

        if (area.width >= gridWidth && area.height >= gridHeight) {
          const startX = area.x + (area.width - gridWidth) / 2;
          const startY = area.y + (area.height - gridHeight) / 2;

          positions.push({ x: startX, y: startY, rotation: 0 });
          positions.push({ x: startX + this.pieceSize + spacing, y: startY, rotation: 0 });
          positions.push({ x: startX, y: startY + this.pieceSize + spacing, rotation: 0 });
          positions.push({ x: startX + this.pieceSize + spacing, y: startY + this.pieceSize + spacing, rotation: 0 });
        } else {
          return { success: false, positions: [], error: 'Not enough space for 2x2 grid' };
        }
        break;

      default:
        return { success: false, positions: [], error: 'Optimized positioning only supports 1-4 pieces' };
    }

    // Verificar solapamientos
    const testPieces: PiecePosition[] = positions.map((pos, i) => ({
      type: pieceTypes[i],
      face: 'front',
      x: pos.x,
      y: pos.y,
      rotation: pos.rotation
    }));

    if (this.checkNoOverlaps(testPieces)) {
      return { success: true, positions };
    }

    return { success: false, positions: [], error: 'Optimized positioning resulted in overlaps' };
  }

  /**
   * Estrategia 3: Posicionamiento random con múltiples intentos
   */
  private tryRandomPositioning(
    numPieces: number, 
    area: PositioningArea, 
    pieceTypes: Array<'A' | 'B'>,
    spacing: number,
    maxAttempts: number = 1000
  ): PositioningResult {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const positions: Array<{x: number, y: number, rotation: number}> = [];
      const testPieces: PiecePosition[] = [];

      let success = true;

      for (let i = 0; i < numPieces; i++) {
        let pieceSuccess = false;
        const maxPieceAttempts = 100;

        for (let pieceAttempt = 0; pieceAttempt < maxPieceAttempts; pieceAttempt++) {
          const x = area.x + Math.random() * area.width;
          const y = area.y + Math.random() * area.height;
          const rotation = 0; // Para simplificar, sin rotación

          const testPiece: PiecePosition = {
            type: pieceTypes[i],
            face: 'front',
            x, y, rotation
          };

          // Verificar que no solapa con piezas ya colocadas
          const overlaps = testPieces.some(existingPiece => 
            this.geometry.doPiecesOverlap(testPiece, existingPiece)
          );

          // Verificar que está completamente dentro del área
          const inBounds = this.isPieceInBounds(testPiece, area);

          if (!overlaps && inBounds) {
            positions.push({ x, y, rotation });
            testPieces.push(testPiece);
            pieceSuccess = true;
            break;
          }
        }

        if (!pieceSuccess) {
          success = false;
          break;
        }
      }

      if (success) {
        return { success: true, positions };
      }
    }

    return { 
      success: false, 
      positions: [], 
      error: `Failed to find valid random positioning after ${maxAttempts} attempts` 
    };
  }

  /**
   * Verifica que una pieza está completamente dentro del área (DUPLICADO - usar isPieceCompletelyInArea)
   */
  private isPieceInBounds(piece: PiecePosition, area: PositioningArea): boolean {
    return this.isPieceCompletelyInArea(piece, area);
  }

  /**
   * Verifica que no hay solapamientos entre piezas
   */
  private checkNoOverlaps(pieces: PiecePosition[]): boolean {
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