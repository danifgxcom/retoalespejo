/**
 * Rotation-Aware Grid System
 * 
 * This system provides intelligent grid snapping that takes piece rotations into account.
 * Instead of using a fixed grid for all pieces, it calculates optimal snap positions
 * based on piece geometry and rotation to ensure proper connections.
 */

import { GameGeometry, PiecePosition } from '../geometry/GameGeometry';

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
    const originalX = piece.x;
    const originalY = piece.y;
    
    // Try different snap strategies in order of priority
    
    // 1. High priority: Snap to nearby pieces for connections
    if (this.config.enableIntelligentSnap && otherPieces.length > 0) {
      const pieceSnap = this.snapToPieces(piece, otherPieces);
      if (pieceSnap.snapped) {
        return pieceSnap;
      }
    }
    
    // 2. Medium priority: Snap to mirror line
    const mirrorSnap = this.snapToMirror(piece);
    if (mirrorSnap.snapped) {
      return mirrorSnap;
    }
    
    // 3. Low priority: Snap to grid
    const gridSnap = this.snapToGrid(piece);
    
    return gridSnap;
  }

  /**
   * Snaps a piece to the nearest valid grid position, considering rotation
   */
  private snapToGrid(piece: PiecePosition): SnapResult {
    const { baseGridSize } = this.config;
    
    // For rotated pieces, we need to find grid positions that work well
    // with the piece's actual geometry, not just its center position
    
    const bbox = this.geometry.getPieceBoundingBox(piece);
    const centerX = piece.x + 50; // pieceSize / 2
    const centerY = piece.y + 50;
    
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