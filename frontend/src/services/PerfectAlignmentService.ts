import { PiecePosition } from '../components/ChallengeCard';

/**
 * Servicio para calcular posiciones perfectas de piezas eliminando micro-gaps
 * Analiza piezas conectadas y ajusta sus coordenadas para alineación perfecta
 */
export class PerfectAlignmentService {
  private static readonly PIECE_SIZE = 100;
  private static readonly TOLERANCE = 5; // Tolerancia para detectar conexiones
  private static readonly GRID_SIZE = 10; // Tamaño de la grilla para snap perfecto

  /**
   * Calcula posiciones perfectas para un conjunto de piezas
   * Detecta conexiones y ajusta coordenadas para eliminar gaps
   */
  static calculatePerfectPositions(pieces: PiecePosition[]): PiecePosition[] {
    if (pieces.length <= 1) return pieces;

    // Crear copia de las piezas para trabajar
    const perfectPieces = pieces.map(piece => ({ ...piece }));

    // 1. Identificar grupos de piezas conectadas
    const connectionGroups = this.findConnectionGroups(perfectPieces);

    // 2. Para cada grupo, calcular posiciones perfectas
    connectionGroups.forEach(group => {
      this.alignGroupPerfectly(group, perfectPieces);
    });

    return perfectPieces;
  }

  /**
   * Encuentra grupos de piezas que están conectadas entre sí
   */
  private static findConnectionGroups(pieces: PiecePosition[]): number[][] {
    const groups: number[][] = [];
    const visited = new Set<number>();

    pieces.forEach((piece, index) => {
      if (visited.has(index)) return;

      const group: number[] = [];
      this.findConnectedPieces(pieces, index, visited, group);
      
      if (group.length > 1) {
        groups.push(group);
      }
    });

    return groups;
  }

  /**
   * Encuentra recursivamente todas las piezas conectadas a una pieza dada
   */
  private static findConnectedPieces(
    pieces: PiecePosition[], 
    pieceIndex: number, 
    visited: Set<number>, 
    group: number[]
  ): void {
    if (visited.has(pieceIndex)) return;

    visited.add(pieceIndex);
    group.push(pieceIndex);

    const currentPiece = pieces[pieceIndex];

    // Buscar piezas vecinas
    pieces.forEach((otherPiece, otherIndex) => {
      if (otherIndex === pieceIndex || visited.has(otherIndex)) return;

      if (this.arePiecesConnected(currentPiece, otherPiece)) {
        this.findConnectedPieces(pieces, otherIndex, visited, group);
      }
    });
  }

  /**
   * Determina si dos piezas están conectadas (con tolerancia)
   */
  private static arePiecesConnected(piece1: PiecePosition, piece2: PiecePosition): boolean {
    const dx = Math.abs(piece1.x - piece2.x);
    const dy = Math.abs(piece1.y - piece2.y);

    // Verificar conexiones horizontales y verticales principales
    const horizontallyConnected = dy < this.TOLERANCE && 
      (Math.abs(dx - this.PIECE_SIZE) < this.TOLERANCE);
    
    const verticallyConnected = dx < this.TOLERANCE && 
      (Math.abs(dy - this.PIECE_SIZE) < this.TOLERANCE);

    // Verificar conexiones diagonales (para piezas rotadas)
    const diagonalDistance = Math.sqrt(dx * dx + dy * dy);
    const expectedDiagonalConnections = [
      this.PIECE_SIZE * Math.sqrt(2), // Diagonal completa
      this.PIECE_SIZE * Math.sqrt(2) / 2, // Media diagonal
      this.PIECE_SIZE // Conexión directa rotada
    ];

    const diagonallyConnected = expectedDiagonalConnections.some(expected => 
      Math.abs(diagonalDistance - expected) < this.TOLERANCE * 2
    );

    return horizontallyConnected || verticallyConnected || diagonallyConnected;
  }

  /**
   * Alinea perfectamente un grupo de piezas conectadas
   */
  private static alignGroupPerfectly(groupIndices: number[], pieces: PiecePosition[]): void {
    if (groupIndices.length < 2) return;

    // Encontrar pieza de referencia (la más cercana al origen o con coordenadas "más limpias")
    const referenceIndex = this.findReferencePiece(groupIndices, pieces);
    const referencePiece = pieces[referenceIndex];

    // Alinear la pieza de referencia a la grilla
    const alignedReference = this.snapToGrid(referencePiece);
    pieces[referenceIndex] = alignedReference;

    // Para cada otra pieza en el grupo, calcular su posición perfecta relativa a la referencia
    groupIndices.forEach(index => {
      if (index === referenceIndex) return;

      const piece = pieces[index];
      const perfectPosition = this.calculatePerfectRelativePosition(
        alignedReference, 
        piece, 
        pieces[index]
      );
      
      pieces[index] = perfectPosition;
    });
  }

  /**
   * Encuentra la mejor pieza de referencia para un grupo
   */
  private static findReferencePiece(groupIndices: number[], pieces: PiecePosition[]): number {
    // Priorizar piezas que tocan el espejo (x = 650) o están cerca del centro
    let bestIndex = groupIndices[0];
    let bestScore = this.calculateReferenceScore(pieces[bestIndex]);

    groupIndices.forEach(index => {
      const score = this.calculateReferenceScore(pieces[index]);
      if (score > bestScore) {
        bestIndex = index;
        bestScore = score;
      }
    });

    return bestIndex;
  }

  /**
   * Calcula una puntuación para determinar qué tan buena es una pieza como referencia
   */
  private static calculateReferenceScore(piece: PiecePosition): number {
    let score = 0;

    // Bonus por tocar el espejo (línea principal del juego)
    if (Math.abs(piece.x - 650) < this.TOLERANCE) score += 100;

    // Bonus por coordenadas "limpias" (múltiplos de 10)
    if (piece.x % 10 === 0) score += 10;
    if (piece.y % 10 === 0) score += 10;

    // Bonus por rotaciones estándar (0, 45, 90, etc.)
    if (piece.rotation % 45 === 0) score += 20;

    // Penalizar coordenadas decimales muy específicas
    if (piece.x % 1 !== 0) score -= 5;
    if (piece.y % 1 !== 0) score -= 5;

    return score;
  }

  /**
   * Ajusta una pieza a la grilla perfecta
   */
  private static snapToGrid(piece: PiecePosition): PiecePosition {
    return {
      ...piece,
      x: Math.round(piece.x / this.GRID_SIZE) * this.GRID_SIZE,
      y: Math.round(piece.y / this.GRID_SIZE) * this.GRID_SIZE,
      rotation: Math.round(piece.rotation / 45) * 45 // Snap rotaciones a incrementos de 45°
    };
  }

  /**
   * Calcula la posición perfecta de una pieza relativa a una pieza de referencia
   */
  private static calculatePerfectRelativePosition(
    reference: PiecePosition,
    original: PiecePosition,
    current: PiecePosition
  ): PiecePosition {
    // Calcular la diferencia original entre las piezas
    const dx = original.x - reference.x;
    const dy = original.y - reference.y;

    // Determinar la conexión más probable basada en las diferencias
    let perfectDx = dx;
    let perfectDy = dy;

    // Ajustar a conexiones estándar
    if (Math.abs(dx) > Math.abs(dy)) {
      // Conexión principalmente horizontal
      perfectDx = dx > 0 ? this.PIECE_SIZE : -this.PIECE_SIZE;
      perfectDy = Math.round(dy / this.GRID_SIZE) * this.GRID_SIZE;
    } else if (Math.abs(dy) > Math.abs(dx)) {
      // Conexión principalmente vertical
      perfectDy = dy > 0 ? this.PIECE_SIZE : -this.PIECE_SIZE;
      perfectDx = Math.round(dx / this.GRID_SIZE) * this.GRID_SIZE;
    } else {
      // Conexión diagonal
      const diagonalSize = this.PIECE_SIZE;
      perfectDx = dx > 0 ? diagonalSize : -diagonalSize;
      perfectDy = dy > 0 ? diagonalSize : -diagonalSize;
    }

    return {
      ...current,
      x: reference.x + perfectDx,
      y: reference.y + perfectDy,
      rotation: Math.round(current.rotation / 45) * 45
    };
  }

  /**
   * Valida que las posiciones perfectas mantengan las conexiones originales
   */
  static validatePerfectPositions(
    originalPieces: PiecePosition[], 
    perfectPieces: PiecePosition[]
  ): boolean {
    if (originalPieces.length !== perfectPieces.length) return false;

    // Verificar que cada conexión original se mantenga
    for (let i = 0; i < originalPieces.length; i++) {
      for (let j = i + 1; j < originalPieces.length; j++) {
        const originalConnected = this.arePiecesConnected(originalPieces[i], originalPieces[j]);
        const perfectConnected = this.arePiecesConnected(perfectPieces[i], perfectPieces[j]);
        
        if (originalConnected !== perfectConnected) {
          console.warn(`Conexión perdida entre piezas ${i} y ${j}`);
          return false;
        }
      }
    }

    return true;
  }
}