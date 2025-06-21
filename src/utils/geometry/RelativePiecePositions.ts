/**
 * Posiciones de piezas en coordenadas relativas
 * Basadas en las coordenadas del snapshot que funcionan correctamente
 */

import { RelativeCoordinate } from './rendering/ResponsiveCanvas';

export interface RelativePiecePosition {
  x: number;      // Coordenada X relativa (0-1)
  y: number;      // Coordenada Y relativa (0-1)
  rotation: number; // Rotación en grados
  size: number;   // Tamaño relativo (0-1)
}

export class RelativePiecePositions {
  // Tamaño base de pieza en coordenadas relativas
  private readonly basePieceSize = 0.071; // 100/1400 ≈ 0.071

  /**
   * Convierte las coordenadas absolutas del snapshot a relativas
   * Snapshot original: x=-24, y=616, etc. con canvas 1400x1000
   */
  private convertSnapshotToRelative() {
    const baseWidth = 1400;
    const baseHeight = 1000;
    
    // Coordenadas del snapshot que funcionan - las del usuario
    const snapshotPositions = [
      { x: -24, y: 616, rotation: 45 },   // Pieza 1
      { x: 243, y: 921, rotation: 225 },  // Pieza 2  
      { x: 556, y: 926, rotation: 225 },  // Pieza 3
      { x: 285, y: 614, rotation: 45 }    // Pieza 4
    ];

    // Convertir a coordenadas relativas basadas en las dimensiones originales
    return snapshotPositions.map(pos => ({
      x: pos.x / baseWidth,          // Relativo al ancho total
      y: pos.y / baseHeight,         // Relativo al alto total  
      rotation: pos.rotation,
      size: this.basePieceSize
    }));
  }

  /**
   * Obtiene posiciones relativas para diferentes cantidades de piezas
   */
  getPositionsForPieceCount(count: number): RelativePiecePosition[] {
    const allPositions = this.convertSnapshotToRelative();
    
    // Devolver las primeras N posiciones según el número de piezas
    return allPositions.slice(0, count);
  }

  /**
   * Obtiene el tamaño base de pieza en coordenadas relativas
   */
  getBasePieceSize(): number {
    return this.basePieceSize;
  }

  /**
   * Verifica si una posición está dentro del área de piezas
   */
  isInPiecesArea(position: RelativeCoordinate): boolean {
    // Área de piezas: x: 0-0.5, y: 0.6-1.0
    return position.x >= 0 && 
           position.x <= 0.5 && 
           position.y >= 0.6 && 
           position.y <= 1.0;
  }

  /**
   * Verifica si una posición está dentro del área de juego
   */
  isInGameArea(position: RelativeCoordinate): boolean {
    // Área de juego: x: 0-0.5, y: 0-0.6
    return position.x >= 0 && 
           position.x <= 0.5 && 
           position.y >= 0 && 
           position.y <= 0.6;
  }

  /**
   * Obtiene coordenadas relativas para áreas específicas
   */
  getAreaBounds() {
    return {
      piecesArea: {
        minX: 0,
        maxX: 0.5,
        minY: 0.6,
        maxY: 1.0
      },
      gameArea: {
        minX: 0,
        maxX: 0.5,
        minY: 0,
        maxY: 0.6
      },
      mirrorArea: {
        minX: 0.5,
        maxX: 1.0,
        minY: 0,
        maxY: 0.6
      },
      objectiveArea: {
        minX: 0.5,
        maxX: 1.0,
        minY: 0.6,
        maxY: 1.0
      }
    };
  }
}