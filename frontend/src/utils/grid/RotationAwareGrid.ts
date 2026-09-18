/**
 * Rotation-Aware Grid System
 * 
 * This system provides intelligent grid snapping that takes piece rotations into account.
 * Instead of using a fixed grid for all pieces, it calculates optimal snap positions
 * based on piece geometry and rotation to ensure proper connections.
 */

import { GameGeometry, PiecePosition } from '@reto/geometry';

export interface SnapResult {
  x: number;
  y: number;
  snapped: boolean;
  snapType: 'grid' | 'piece' | 'mirror' | 'none';
  adjustment: { x: number; y: number };
}

export interface GridConfig {
  baseGridSize: number;
  snapDistance: number;
  mirrorSnapDistance: number;
  enableIntelligentSnap: boolean;
}

/**
 * Hasta dónde se busca un contacto exacto alrededor de donde el jugador soltó
 * la pieza. Es el margen de puntería a mano; más allá entran las heurísticas de
 * largo alcance, que sí pueden mover la pieza lejos.
 */
const CONTACT_REACH_PX = 25;

export class RotationAwareGrid {
  private geometry: GameGeometry;
  private config: GridConfig;

  constructor(geometry: GameGeometry, config: Partial<GridConfig> = {}) {
    this.geometry = geometry;
    this.config = {
      baseGridSize: 10,
      snapDistance: 60, // Increased from 30 to handle rotated pieces better
      mirrorSnapDistance: 20, // Increased from 15
      enableIntelligentSnap: true,
      ...config
    };
  }

  /**
   * Calculates the optimal snap position for a piece considering its rotation
   * and nearby pieces or boundaries.
   */
  calculateSnapPosition(
    piece: PiecePosition, 
    otherPieces: PiecePosition[] = []
  ): SnapResult {
    // 0. El espejo primero: es un contacto que manda sobre los demás y el resto
    //    del encaje ya lo respeta (no mueve la pieza en horizontal si lo toca).
    const mirrorSnap = this.snapToMirror(piece);
    const start: PiecePosition = mirrorSnap.snapped
      ? { ...piece, x: mirrorSnap.x, y: mirrorSnap.y }
      : piece;

    /*
      1. El contacto exacto MÁS CERCA DE DONDE SE SOLTÓ.

      Esto va antes que las heurísticas a propósito. En un puzle de teselas, dos
      piezas que comparten un borde de 45° pueden encajar deslizadas a lo largo
      de ese borde: todas esas posiciones tienen hueco cero y ninguna es "más
      exacta" que otra. Lo que las distingue es cuál quiso el jugador, y eso lo
      dice dónde soltó la pieza. Las heurísticas de abajo alinean por centro de
      borde o por caja envolvente, así que podían deslizarla varios píxeles
      antes de que nadie mirase el contacto — y la figura resultante ya no era
      la de la carta aunque encajara perfecta.
    */
    const seated = this.geometry.refineToExactContact(start, otherPieces, CONTACT_REACH_PX);
    if (seated.x !== start.x || seated.y !== start.y) {
      return this.asResult(piece, seated, mirrorSnap.snapped ? 'mirror' : 'piece');
    }

    // 2. Nada que tocar cerca: las heurísticas de siempre, con más alcance.
    if (this.config.enableIntelligentSnap && otherPieces.length > 0) {
      const pieceSnap = this.snapToPieces(start, otherPieces);
      if (pieceSnap.snapped) {
        return this.refine(piece, pieceSnap, otherPieces);
      }
    }

    if (mirrorSnap.snapped) {
      return this.refine(piece, mirrorSnap, otherPieces);
    }

    // 3. Última opción: la retícula.
    return this.refine(piece, this.snapToGrid(piece), otherPieces);
  }

  /** Empaqueta una posición ya decidida como resultado de encaje. */
  private asResult(
    original: PiecePosition,
    placed: PiecePosition,
    snapType: SnapResult['snapType']
  ): SnapResult {
    return {
      x: placed.x,
      y: placed.y,
      snapped: true,
      snapType,
      adjustment: { x: placed.x - original.x, y: placed.y - original.y }
    };
  }

  /**
   * Afinado final de una posición elegida por las heurísticas de largo alcance:
   * cierra el hueco que dejan (alinean por centro de borde o por caja
   * envolvente, y la retícula de 10px no es conmensurable con la geometría de
   * la pieza). Sólo se llega aquí cuando no había nada que tocar cerca de donde
   * se soltó, así que el riesgo de deslizar por el borde ya no existe.
   */
  private refine(original: PiecePosition, result: SnapResult, otherPieces: PiecePosition[]): SnapResult {
    const placed: PiecePosition = { ...original, x: result.x, y: result.y };
    const exact = this.geometry.refineToExactContact(placed, otherPieces);

    if (exact.x === placed.x && exact.y === placed.y) return result;

    return this.asResult(original, exact, result.snapType);
  }

  /**
   * Asienta la figura entera después de soltar: cada pieza ya colocada se pega
   * a contacto exacto con sus vecinas.
   *
   * Hace falta además de afinar la pieza soltada porque la PRIMERA que se
   * coloca no tiene contra qué alinearse: aterriza en la retícula de 10px y se
   * queda con ese error. Si luego la siguiente toca el espejo, ya no puede
   * moverse para alcanzarla (mover en horizontal cambiaría la figura compuesta
   * con el reflejo), así que la ranura no la cierra nadie. Asentando el
   * conjunto, es la pieza libre la que cede.
   *
   * El margen es el de contacto, no el de afinado: esto PERFECCIONA contactos
   * que ya existen, no atrae piezas que el jugador dejó separadas a propósito.
   * Dos pasadas porque cada pieza se asienta contra las que ya estaban, así que
   * la primera deja un resto que reparte la segunda. Más pasadas no mejoran: se
   * llega a un óptimo local y ahí se queda.
   */
  settlePlacedPieces(pieces: PiecePosition[]): PiecePosition[] {
    const margen = 10 * Math.SQRT1_2;
    const settled = pieces.map(piece => ({ ...piece }));

    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < settled.length; i++) {
        const others = settled.filter((_, index) => index !== i);
        settled[i] = this.geometry.refineToExactContact(settled[i], others, margen);
      }
    }

    return settled;
  }

  /**
   * Snaps a piece to the nearest valid grid position, considering rotation
   */
  private snapToGrid(piece: PiecePosition): SnapResult {
    const { baseGridSize } = this.config;
    
    // For rotated pieces, we need to find grid positions that work well
    // with the piece's actual geometry, not just its center position

    // Calculate grid-aligned positions
    const gridX = Math.round(piece.x / baseGridSize) * baseGridSize;
    const gridY = Math.round(piece.y / baseGridSize) * baseGridSize;
    
    // For rotated pieces, check if this grid position creates any problems
    const testPiece: PiecePosition = { ...piece, x: gridX, y: gridY };
    
    // Validate the grid position
    if (this.isValidGridPosition(testPiece)) {
      return {
        x: gridX,
        y: gridY,
        snapped: true,
        snapType: 'grid',
        adjustment: { x: gridX - piece.x, y: gridY - piece.y }
      };
    }
    
    // If standard grid doesn't work, try nearby grid positions
    const alternativePositions = this.findAlternativeGridPositions(piece);
    
    for (const pos of alternativePositions) {
      const altTestPiece: PiecePosition = { ...piece, x: pos.x, y: pos.y };
      if (this.isValidGridPosition(altTestPiece)) {
        return {
          x: pos.x,
          y: pos.y,
          snapped: true,
          snapType: 'grid',
          adjustment: { x: pos.x - piece.x, y: pos.y - piece.y }
        };
      }
    }
    
    // No valid grid position found
    return {
      x: piece.x,
      y: piece.y,
      snapped: false,
      snapType: 'none',
      adjustment: { x: 0, y: 0 }
    };
  }

  /**
   * Snaps a piece to nearby pieces for optimal connections
   */
  private snapToPieces(piece: PiecePosition, otherPieces: PiecePosition[]): SnapResult {
    const { snapDistance } = this.config;
    
    for (const otherPiece of otherPieces) {
      const connectionPoint = this.findOptimalConnectionPoint(piece, otherPiece);
      
      if (connectionPoint) {
        const distance = Math.sqrt(
          Math.pow(connectionPoint.x - piece.x, 2) + 
          Math.pow(connectionPoint.y - piece.y, 2)
        );
        
        if (distance <= snapDistance) {
          // Validate the connection position
          const testPiece: PiecePosition = { 
            ...piece, 
            x: connectionPoint.x, 
            y: connectionPoint.y 
          };
          
          if (this.isValidPosition(testPiece, otherPieces)) {
            return {
              x: connectionPoint.x,
              y: connectionPoint.y,
              snapped: true,
              snapType: 'piece',
              adjustment: { 
                x: connectionPoint.x - piece.x, 
                y: connectionPoint.y - piece.y 
              }
            };
          }
        }
      }
    }
    
    return {
      x: piece.x,
      y: piece.y,
      snapped: false,
      snapType: 'none',
      adjustment: { x: 0, y: 0 }
    };
  }

  /**
   * Snaps a piece to the mirror line
   */
  private snapToMirror(piece: PiecePosition): SnapResult {
    const { mirrorSnapDistance } = this.config;
    
    const bbox = this.geometry.getPieceBoundingBox(piece);
    const distanceToMirror = Math.abs(bbox.right - this.geometry.getConfig().mirrorLineX);
    
    if (distanceToMirror <= mirrorSnapDistance) {
      // Calculate position that would make piece touch mirror exactly
      const touchingPosition = this.geometry.getPositionTouchingMirror(
        piece.y, 
        piece.rotation, 
        piece.type
      );
      
      return {
        x: touchingPosition.x,
        y: touchingPosition.y,
        snapped: true,
        snapType: 'mirror',
        adjustment: { 
          x: touchingPosition.x - piece.x, 
          y: touchingPosition.y - piece.y 
        }
      };
    }
    
    return {
      x: piece.x,
      y: piece.y,
      snapped: false,
      snapType: 'none',
      adjustment: { x: 0, y: 0 }
    };
  }

  /**
   * Finds the optimal connection point between two pieces
   */
  private findOptimalConnectionPoint(
    movingPiece: PiecePosition, 
    targetPiece: PiecePosition
  ): { x: number; y: number } | null {
    // First try using geometry system for precise edge alignment
    const compatibleEdges = this.geometry.findCompatibleEdges(movingPiece, targetPiece);
    
    if (compatibleEdges.length > 0) {
      const bestEdge = compatibleEdges[0];
      
      // Calculate the position that would align these edges perfectly
      const movingEdgeCenter = [
        (bestEdge.edge1.start[0] + bestEdge.edge1.end[0]) / 2,
        (bestEdge.edge1.start[1] + bestEdge.edge1.end[1]) / 2
      ];
      
      const targetEdgeCenter = [
        (bestEdge.edge2.start[0] + bestEdge.edge2.end[0]) / 2,
        (bestEdge.edge2.start[1] + bestEdge.edge2.end[1]) / 2
      ];
      
      // Calculate the movement needed to align the edges
      const deltaX = targetEdgeCenter[0] - movingEdgeCenter[0];
      const deltaY = targetEdgeCenter[1] - movingEdgeCenter[1];
      
      // Apply a small offset to ensure connection without overlap
      const connectionOffset = 1; // Reduced to 1px for tighter connection
      const edgeNormal = [-bestEdge.edge1.direction[1], bestEdge.edge1.direction[0]];
      
      return {
        x: movingPiece.x + deltaX + edgeNormal[0] * connectionOffset,
        y: movingPiece.y + deltaY + edgeNormal[1] * connectionOffset
      };
    }
    
    // Fallback: Try simple proximity-based connection
    return this.findProximityBasedConnection(movingPiece, targetPiece);
  }

  /**
   * Fallback method for finding connection points based on proximity
   */
  private findProximityBasedConnection(
    movingPiece: PiecePosition,
    targetPiece: PiecePosition
  ): { x: number; y: number } | null {
    const movingBbox = this.geometry.getPieceBoundingBox(movingPiece);
    const targetBbox = this.geometry.getPieceBoundingBox(targetPiece);
    
    // Calculate the centers
    const movingCenter = {
      x: (movingBbox.left + movingBbox.right) / 2,
      y: (movingBbox.top + movingBbox.bottom) / 2
    };
    
    const targetCenter = {
      x: (targetBbox.left + targetBbox.right) / 2,
      y: (targetBbox.top + targetBbox.bottom) / 2
    };
    
    // Calculate direction from moving piece to target piece
    const dx = targetCenter.x - movingCenter.x;
    const dy = targetCenter.y - movingCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return null;
    
    // Normalize direction
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    // Calculate connection distance (sum of half-sizes with small gap)
    const avgSize = 50; // Approximate half-size of a piece
    const connectionDistance = avgSize * 2 - 10; // Small overlap for connection
    
    // Calculate new position that brings pieces closer
    const newX = movingPiece.x + dirX * Math.max(0, distance - connectionDistance);
    const newY = movingPiece.y + dirY * Math.max(0, distance - connectionDistance);
    
    return { x: newX, y: newY };
  }

  /**
   * Finds alternative grid positions near the ideal position
   */
  private findAlternativeGridPositions(piece: PiecePosition): { x: number; y: number }[] {
    const { baseGridSize } = this.config;
    const baseX = Math.round(piece.x / baseGridSize) * baseGridSize;
    const baseY = Math.round(piece.y / baseGridSize) * baseGridSize;
    
    const alternatives: { x: number; y: number }[] = [];
    
    // Try positions in a 3x3 grid around the ideal position
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue; // Skip the center (already tried)
        
        alternatives.push({
          x: baseX + dx * baseGridSize,
          y: baseY + dy * baseGridSize
        });
      }
    }
    
    // Sort by distance from original position
    alternatives.sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.x - piece.x, 2) + Math.pow(a.y - piece.y, 2));
      const distB = Math.sqrt(Math.pow(b.x - piece.x, 2) + Math.pow(b.y - piece.y, 2));
      return distA - distB;
    });
    
    return alternatives;
  }

  /**
   * Validates if a piece position is valid for grid snapping
   */
  private isValidGridPosition(piece: PiecePosition): boolean {
    // Check if piece stays within game area
    if (!this.geometry.isPiecePositionInGameArea(piece)) {
      return false;
    }
    
    // Check if piece doesn't collide with mirror
    if (this.geometry.detectMirrorCollision(piece)) {
      return false;
    }
    
    return true;
  }

  /**
   * Validates if a piece position is valid considering other pieces
   */
  private isValidPosition(piece: PiecePosition, otherPieces: PiecePosition[]): boolean {
    if (!this.isValidGridPosition(piece)) {
      return false;
    }
    
    // Check for significant overlaps with other pieces
    for (const otherPiece of otherPieces) {
      if (this.geometry.doPiecesOverlapSignificantly(piece, otherPiece)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Updates grid configuration
   */
  updateConfig(newConfig: Partial<GridConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current grid configuration
   */
  getConfig(): GridConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create a RotationAwareGrid instance
 */
export function createRotationAwareGrid(
  geometry: GameGeometry, 
  config?: Partial<GridConfig>
): RotationAwareGrid {
  return new RotationAwareGrid(geometry, config);
}