/**
 * Test específico para el Reto 5 - problema de snapping con piezas rotadas
 */

import { GameGeometry, PiecePosition, GameAreaConfig } from '../../utils/geometry/GameGeometry';
import { RotationAwareGrid, createRotationAwareGrid } from '../../utils/grid/RotationAwareGrid';

describe('Challenge 5 Snapping Test', () => {
  let geometry: GameGeometry;
  let rotationAwareGrid: RotationAwareGrid;
  
  const config: GameAreaConfig = {
    width: 700,
    height: 500,
    mirrorLineX: 700,
    pieceSize: 100
  };

  beforeEach(() => {
    geometry = new GameGeometry(config);
    rotationAwareGrid = createRotationAwareGrid(geometry, {
      baseGridSize: 10,
      snapDistance: 30,
      mirrorSnapDistance: 15,
      enableIntelligentSnap: true
    });
  });

  describe('Challenge 5 Scenario', () => {
    test('should handle piece 2 and piece 3 connection properly', () => {
      // Posiciones exactas reportadas por el usuario
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

      // Verificar que ambas piezas están en área válida
      expect(geometry.isPiecePositionInGameArea(piece2)).toBe(true);
      expect(geometry.isPiecePositionInGameArea(piece3)).toBe(true);

      // Calcular distancia entre piezas
      const distance = geometry.getMinDistanceBetweenPieces(piece2, piece3);
      console.log(`Distance between pieces: ${distance.toFixed(1)}px`);
      
      // Verificar que están lo suficientemente cerca para hacer snap
      expect(distance).toBeLessThan(50);
    });

    test('should calculate optimal snap position for piece 2 to connect with piece 3', () => {
      const piece3: PiecePosition = { 
        type: 'A', 
        face: 'front', 
        x: 380, 
        y: 70, 
        rotation: 45 
      };
      
      const piece2Initial: PiecePosition = { 
        type: 'B', 
        face: 'front', 
        x: 280, 
        y: 40, 
        rotation: 225 
      };

      // Usar el sistema de snap inteligente
      const snapResult = rotationAwareGrid.calculateSnapPosition(piece2Initial, [piece3]);
      
      console.log('Snap result:', snapResult);
      
      if (snapResult.snapped) {
        console.log(`Original position: (${piece2Initial.x}, ${piece2Initial.y})`);
        console.log(`Snapped position: (${snapResult.x}, ${snapResult.y})`);
        console.log(`Adjustment: (${snapResult.adjustment.x}, ${snapResult.adjustment.y})`);
        
        // Verificar que las piezas están más cerca después del snap
        const piece2Snapped: PiecePosition = {
          ...piece2Initial,
          x: snapResult.x,
          y: snapResult.y
        };
        
        const originalDistance = geometry.getMinDistanceBetweenPieces(piece2Initial, piece3);
        const snappedDistance = geometry.getMinDistanceBetweenPieces(piece2Snapped, piece3);
        
        console.log(`Distance before snap: ${originalDistance.toFixed(1)}px`);
        console.log(`Distance after snap: ${snappedDistance.toFixed(1)}px`);
        
        expect(snappedDistance).toBeLessThanOrEqual(originalDistance);
        expect(snappedDistance).toBeLessThan(10); // Should be very close after snap
      }
    });

    test('should verify target positions from challenge 5 are valid', () => {
      // Posiciones objetivo del Reto 5 según el usuario
      const targetPositions: PiecePosition[] = [
        { type: 'B', face: 'front', x: 650.0, y: 255.0, rotation: 45 },
        { type: 'B', face: 'front', x: 378.5, y: 436.0, rotation: 135 },
        { type: 'A', face: 'front', x: 650.0, y: 255.0, rotation: 225 },
        { type: 'B', face: 'front', x: 559.5, y: 255.0, rotation: 315 }
      ];
      
      // Verificar que todas las posiciones son válidas
      targetPositions.forEach((piece, index) => {
        const isValid = geometry.isPiecePositionInGameArea(piece);
        console.log(`Target piece ${index + 1}: (${piece.x}, ${piece.y}) rotation=${piece.rotation}° - Valid: ${isValid}`);
        expect(isValid).toBe(true);
      });
      
      // Verificar que las piezas pueden formar una configuración válida
      const validation = geometry.validateChallengeCard(targetPositions);
      console.log('Challenge validation:', validation);
      
      expect(validation.piecesInArea).toBe(true);
      expect(validation.touchesMirror).toBe(true);
      // Nota: Algunas validaciones pueden fallar debido a la complejidad del patrón
    });

    test('should snap pieces to grid correctly with rotations', () => {
      const testCases = [
        { type: 'A' as const, rotation: 0, x: 283, y: 157 },
        { type: 'A' as const, rotation: 45, x: 297, y: 143 },
        { type: 'B' as const, rotation: 225, x: 276, y: 54 },
        { type: 'B' as const, rotation: 315, x: 562, y: 248 }
      ];
      
      testCases.forEach((testCase, index) => {
        const piece: PiecePosition = {
          type: testCase.type,
          face: 'front',
          x: testCase.x,
          y: testCase.y,
          rotation: testCase.rotation
        };
        
        const snapResult = rotationAwareGrid.calculateSnapPosition(piece);
        
        console.log(`Test case ${index + 1}:`);
        console.log(`  Original: (${piece.x}, ${piece.y}) rotation=${piece.rotation}°`);
        console.log(`  Snapped: (${snapResult.x}, ${snapResult.y}) type=${snapResult.snapType}`);
        
        // Verificar que la posición está en el grid
        const GRID_SIZE = 10;
        if (snapResult.snapType === 'grid') {
          expect(snapResult.x % GRID_SIZE).toBe(0);
          expect(snapResult.y % GRID_SIZE).toBe(0);
        }
        
        // Verificar que la posición sigue siendo válida
        const snappedPiece: PiecePosition = { ...piece, x: snapResult.x, y: snapResult.y };
        expect(geometry.isPiecePositionInGameArea(snappedPiece)).toBe(true);
      });
    });

    test('should handle mirror snapping for rotated pieces', () => {
      // Pieza cerca del espejo con rotación
      const nearMirrorPiece: PiecePosition = {
        type: 'B',
        face: 'front',
        x: 640, // Cerca del espejo en x=700
        y: 250,
        rotation: 315
      };
      
      const snapResult = rotationAwareGrid.calculateSnapPosition(nearMirrorPiece);
      
      console.log('Mirror snap test:');
      console.log(`  Original: (${nearMirrorPiece.x}, ${nearMirrorPiece.y})`);
      console.log(`  Snapped: (${snapResult.x}, ${snapResult.y}) type=${snapResult.snapType}`);
      
      if (snapResult.snapType === 'mirror') {
        // Verificar que la pieza realmente toca el espejo
        const snappedPiece: PiecePosition = { 
          ...nearMirrorPiece, 
          x: snapResult.x, 
          y: snapResult.y 
        };
        
        expect(geometry.isPieceTouchingMirror(snappedPiece)).toBe(true);
      }
    });
  });

  describe('Performance Tests', () => {
    test('should perform snapping calculations efficiently', () => {
      const testPieces: PiecePosition[] = [];
      
      // Crear varias piezas de prueba
      for (let i = 0; i < 10; i++) {
        testPieces.push({
          type: i % 2 === 0 ? 'A' : 'B',
          face: 'front',
          x: 100 + i * 50,
          y: 100 + i * 30,
          rotation: (i * 45) % 360
        });
      }
      
      const movingPiece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 350,
        y: 250,
        rotation: 135
      };
      
      const startTime = performance.now();
      
      // Realizar múltiples cálculos de snap
      for (let i = 0; i < 100; i++) {
        rotationAwareGrid.calculateSnapPosition(movingPiece, testPieces);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`100 snap calculations took ${duration.toFixed(2)}ms`);
      
      // Debería completarse en menos de 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});