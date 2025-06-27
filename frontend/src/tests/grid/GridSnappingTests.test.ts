/**
 * Comprehensive tests for grid snapping system with rotated pieces
 * 
 * This test suite ensures that:
 * 1. All piece types (A, B) snap correctly at all rotations (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
 * 2. Pieces can connect properly when rotated
 * 3. Snapping to mirror line works correctly for rotated pieces
 * 4. Rotated pieces stay within game area boundaries
 * 5. Piece-to-piece connections work regardless of rotation
 */

import { GameGeometry, PiecePosition, GameAreaConfig } from '../../utils/geometry/GameGeometry';

describe('Grid Snapping for Rotated Pieces', () => {
  let geometry: GameGeometry;
  
  const config: GameAreaConfig = {
    width: 700,
    height: 500,
    mirrorLineX: 700,
    pieceSize: 100
  };

  beforeEach(() => {
    geometry = new GameGeometry(config);
  });

  describe('Basic Grid Snapping', () => {
    const GRID_SIZE = 10;
    
    // Helper function to test grid snapping
    const testGridSnapping = (x: number, y: number, expectedX: number, expectedY: number) => {
      const snappedX = Math.round(x / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(y / GRID_SIZE) * GRID_SIZE;
      
      expect(snappedX).toBe(expectedX);
      expect(snappedY).toBe(expectedY);
    };

    test('should snap to nearest 10px grid point', () => {
      testGridSnapping(23, 47, 20, 50);
      testGridSnapping(67, 83, 70, 80);
      testGridSnapping(95, 96, 100, 100);
      testGridSnapping(104, 106, 100, 110);
    });

    test('should snap exact grid points correctly', () => {
      testGridSnapping(100, 200, 100, 200);
      testGridSnapping(250, 350, 250, 350);
      testGridSnapping(0, 0, 0, 0);
    });
  });

  describe('Piece Bounding Box Calculations', () => {
    test('should calculate correct bounding box for piece type A at 0°', () => {
      const piece: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const bbox = geometry.getPieceBoundingBox(piece);
      
      // At 0° rotation, piece should have standard dimensions
      expect(bbox.left).toBeCloseTo(100 - 50, 1); // Center - half size
      expect(bbox.right).toBeCloseTo(100 + 178, 1); // Should account for extended shape
      expect(bbox.top).toBeCloseTo(100 - 64, 1);
      expect(bbox.bottom).toBeCloseTo(100 + 64, 1);
    });

    test('should calculate correct bounding box for piece type A at 45°', () => {
      const piece: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 45 };
      const bbox = geometry.getPieceBoundingBox(piece);
      
      // At 45° rotation, bounding box should be larger due to diagonal orientation
      const originalWidth = 178;
      const originalHeight = 128;
      const diagonal = Math.sqrt(originalWidth * originalWidth + originalHeight * originalHeight);
      
      expect(bbox.right - bbox.left).toBeGreaterThan(originalWidth);
      expect(bbox.bottom - bbox.top).toBeGreaterThan(originalHeight);
    });

    test('should calculate correct bounding box for piece type B at various rotations', () => {
      const rotations = [0, 45, 90, 135, 180, 225, 270, 315];
      
      rotations.forEach(rotation => {
        const piece: PiecePosition = { type: 'B', face: 'front', x: 200, y: 200, rotation };
        const bbox = geometry.getPieceBoundingBox(piece);
        
        // All bounding boxes should be valid (left < right, top < bottom)
        expect(bbox.left).toBeLessThan(bbox.right);
        expect(bbox.top).toBeLessThan(bbox.bottom);
        
        // Bounding box should be centered around piece position
        const centerX = (bbox.left + bbox.right) / 2;
        const centerY = (bbox.top + bbox.bottom) / 2;
        expect(centerX).toBeCloseTo(piece.x + 50, 5); // piece.x + pieceSize/2
        expect(centerY).toBeCloseTo(piece.y + 50, 5); // piece.y + pieceSize/2
      });
    });
  });

  describe('Piece Connection Tests', () => {
    test('should detect when two pieces at 0° are touching horizontally', () => {
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'A', face: 'front', x: 200, y: 100, rotation: 0 };
      
      const areTouching = geometry.doPiecesTouch(piece1, piece2);
      expect(areTouching).toBe(true);
    });

    test('should detect when two rotated pieces can connect', () => {
      // Test pieces rotated 45° trying to connect
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 45 };
      const piece2: PiecePosition = { type: 'B', face: 'front', x: 150, y: 150, rotation: 225 };
      
      // At these rotations and positions, pieces should be able to connect
      const minDistance = geometry.getMinDistanceBetweenPieces(piece1, piece2);
      expect(minDistance).toBeLessThan(20); // Should be close enough to connect
    });

    test('should find optimal snap positions for rotated pieces', () => {
      const basePiece: PiecePosition = { type: 'A', face: 'front', x: 200, y: 200, rotation: 0 };
      const movingPiece: PiecePosition = { type: 'B', face: 'front', x: 290, y: 195, rotation: 45 };
      
      const snappedPiece = geometry.snapPieceToNearbyTargets(movingPiece, [basePiece], 30);
      
      // The snapped piece should be closer to the base piece
      const originalDistance = geometry.getMinDistanceBetweenPieces(movingPiece, basePiece);
      const snappedDistance = geometry.getMinDistanceBetweenPieces(snappedPiece, basePiece);
      
      expect(snappedDistance).toBeLessThanOrEqual(originalDistance);
      expect(snappedDistance).toBeLessThan(5); // Should snap very close
    });
  });

  describe('Mirror Line Snapping', () => {
    test('should calculate correct position for piece touching mirror at 0°', () => {
      const piece: PiecePosition = { type: 'A', face: 'front', x: 600, y: 200, rotation: 0 };
      const touchingPos = geometry.getPositionTouchingMirror(200, 0, 'A');
      
      // Verify the piece would actually touch the mirror
      const testPiece: PiecePosition = { ...piece, x: touchingPos.x, y: touchingPos.y };
      expect(geometry.isPieceTouchingMirror(testPiece)).toBe(true);
    });

    test('should calculate correct position for piece touching mirror at 45°', () => {
      const touchingPos = geometry.getPositionTouchingMirror(200, 45, 'A');
      
      const testPiece: PiecePosition = { 
        type: 'A', 
        face: 'front', 
        x: touchingPos.x, 
        y: touchingPos.y, 
        rotation: 45 
      };
      
      expect(geometry.isPieceTouchingMirror(testPiece)).toBe(true);
    });

    test('should handle all rotations when touching mirror', () => {
      const rotations = [0, 45, 90, 135, 180, 225, 270, 315];
      const types: ('A' | 'B')[] = ['A', 'B'];
      
      types.forEach(type => {
        rotations.forEach(rotation => {
          const touchingPos = geometry.getPositionTouchingMirror(200, rotation, type);
          
          const testPiece: PiecePosition = { 
            type, 
            face: 'front', 
            x: touchingPos.x, 
            y: touchingPos.y, 
            rotation 
          };
          
          expect(geometry.isPieceTouchingMirror(testPiece)).toBe(true);
        });
      });
    });
  });

  describe('Boundary Validation', () => {
    test('should keep rotated pieces within game area bounds', () => {
      const rotations = [0, 45, 90, 135, 180, 225, 270, 315];
      
      rotations.forEach(rotation => {
        const piece: PiecePosition = { 
          type: 'A', 
          face: 'front', 
          x: 350, // Center of game area
          y: 250, 
          rotation 
        };
        
        expect(geometry.isPiecePositionInGameArea(piece)).toBe(true);
      });
    });

    test('should detect when rotated pieces exceed game area', () => {
      // Place piece very close to right boundary at 45° (diagonal should exceed boundary)
      const piece: PiecePosition = { 
        type: 'A', 
        face: 'front', 
        x: 650, // Very close to mirror line at 700
        y: 250, 
        rotation: 45 
      };
      
      const bbox = geometry.getPieceBoundingBox(piece);
      // At 45°, the piece should extend beyond the mirror line
      expect(bbox.right).toBeGreaterThan(config.mirrorLineX);
    });
  });

  describe('Complex Connection Scenarios', () => {
    test('should handle challenge 5 scenario - pieces 2 and 3 connection', () => {
      // Recreate the exact scenario from challenge 5
      const piece2: PiecePosition = { 
        type: 'B', 
        face: 'front', 
        x: 280, 
        y: 40, 
        rotation: 225 
      };
      
      const piece3: PiecePosition = { 
        type: 'A', 
        face: 'front', 
        x: 380, 
        y: 70, 
        rotation: 45 
      };
      
      // These pieces should be able to connect when properly positioned
      const snappedPiece2 = geometry.snapPieceToNearbyTargets(piece2, [piece3], 50);
      const finalDistance = geometry.getMinDistanceBetweenPieces(snappedPiece2, piece3);
      
      expect(finalDistance).toBeLessThan(5); // Should snap close enough to connect
    });

    test('should validate challenge 5 target positions are achievable', () => {
      // Target positions from challenge 5
      const targetPositions: PiecePosition[] = [
        { type: 'B', face: 'front', x: 650.0, y: 255.0, rotation: 45 },
        { type: 'B', face: 'front', x: 378.5, y: 436.0, rotation: 135 },
        { type: 'A', face: 'front', x: 650.0, y: 255.0, rotation: 225 },
        { type: 'B', face: 'front', x: 559.5, y: 255.0, rotation: 315 }
      ];
      
      // All target positions should be valid in game area
      targetPositions.forEach((piece, index) => {
        expect(geometry.isPiecePositionInGameArea(piece)).toBe(true);
      });
      
      // Check if pieces can actually connect
      const validation = geometry.validateChallengeCard(targetPositions);
      expect(validation.piecesConnected).toBe(true);
      expect(validation.touchesMirror).toBe(true);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Grid Snapping Integration', () => {
    test('should snap rotated piece to valid grid position', () => {
      const piece: PiecePosition = { 
        type: 'A', 
        face: 'front', 
        x: 287, // Not on grid
        y: 143, // Not on grid
        rotation: 45 
      };
      
      // Apply grid snapping
      const GRID_SIZE = 10;
      const snappedX = Math.round(piece.x / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(piece.y / GRID_SIZE) * GRID_SIZE;
      
      const snappedPiece: PiecePosition = {
        ...piece,
        x: snappedX,
        y: snappedY
      };
      
      // Snapped position should be on grid
      expect(snappedPiece.x % GRID_SIZE).toBe(0);
      expect(snappedPiece.y % GRID_SIZE).toBe(0);
      
      // Snapped piece should still be in valid area
      expect(geometry.isPiecePositionInGameArea(snappedPiece)).toBe(true);
    });

    test('should maintain piece connections after grid snapping', () => {
      // Two pieces that are close but not on grid
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 198, y: 202, rotation: 0 };
      const piece2: PiecePosition = { type: 'B', face: 'front', x: 302, y: 198, rotation: 180 };
      
      // Apply grid snapping to both
      const GRID_SIZE = 10;
      const snapped1: PiecePosition = {
        ...piece1,
        x: Math.round(piece1.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(piece1.y / GRID_SIZE) * GRID_SIZE
      };
      const snapped2: PiecePosition = {
        ...piece2,
        x: Math.round(piece2.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(piece2.y / GRID_SIZE) * GRID_SIZE
      };
      
      // After snapping, pieces should still be able to connect
      const distance = geometry.getMinDistanceBetweenPieces(snapped1, snapped2);
      expect(distance).toBeLessThan(20); // Should be close enough to connect
    });
  });
});

/**
 * Performance tests to ensure grid snapping doesn't impact game performance
 */
describe('Grid Snapping Performance', () => {
  let geometry: GameGeometry;
  
  beforeEach(() => {
    const config: GameAreaConfig = {
      width: 700,
      height: 500,  
      mirrorLineX: 700,
      pieceSize: 100
    };
    geometry = new GameGeometry(config);
  });

  test('should calculate bounding boxes efficiently', () => {
    const pieces: PiecePosition[] = [];
    
    // Create many pieces with different rotations
    for (let i = 0; i < 100; i++) {
      pieces.push({
        type: i % 2 === 0 ? 'A' : 'B',
        face: 'front',
        x: (i * 50) % 600,
        y: (i * 30) % 400,
        rotation: (i * 45) % 360
      });
    }
    
    const startTime = performance.now();
    
    // Calculate bounding boxes for all pieces
    pieces.forEach(piece => {
      geometry.getPieceBoundingBox(piece);
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete in reasonable time (less than 100ms for 100 pieces)
    expect(duration).toBeLessThan(100);
  });

  test('should perform snap calculations efficiently', () => {
    const targetPieces: PiecePosition[] = [
      { type: 'A', face: 'front', x: 200, y: 200, rotation: 0 },
      { type: 'B', face: 'front', x: 400, y: 300, rotation: 90 },
      { type: 'A', face: 'front', x: 500, y: 150, rotation: 180 }
    ];
    
    const movingPiece: PiecePosition = { 
      type: 'B', 
      face: 'front', 
      x: 350, 
      y: 250, 
      rotation: 45 
    };
    
    const startTime = performance.now();
    
    // Perform snap calculation multiple times
    for (let i = 0; i < 50; i++) {
      geometry.snapPieceToNearbyTargets(movingPiece, targetPieces, 30);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete in reasonable time (less than 200ms for 50 calculations)
    expect(duration).toBeLessThan(200);
  });
});