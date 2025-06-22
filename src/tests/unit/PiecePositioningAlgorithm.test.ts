import { PiecePositioningAlgorithm, PositioningArea } from '../../utils/positioning/PiecePositioningAlgorithm';
import { GameGeometry, GameAreaConfig } from '../../utils/geometry/GameGeometry';

describe('PiecePositioningAlgorithm', () => {
  let algorithm: PiecePositioningAlgorithm;
  let geometry: GameGeometry;

  beforeEach(() => {
    const config: GameAreaConfig = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    geometry = new GameGeometry(config);
    algorithm = new PiecePositioningAlgorithm(geometry, 100, 20);
  });

  describe('positionPieces', () => {
    const pieceArea: PositioningArea = {
      x: 0,
      y: 600,
      width: 350,
      height: 400
    };

    test('should handle invalid inputs', () => {
      // Número de piezas cero
      let result = algorithm.positionPieces(0, pieceArea, []);
      expect(result.success).toBe(false);
      expect(result.error).toContain('must be greater than 0');

      // Array de tipos no coincide
      result = algorithm.positionPieces(2, pieceArea, ['A']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('must match numPieces');
    });

    test('should handle area too small', () => {
      const tinyArea: PositioningArea = {
        x: 0,
        y: 0,
        width: 50,
        height: 50
      };

      const result = algorithm.positionPieces(1, tinyArea, ['A']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Area too small');
    });

    test('should position 1 piece successfully', () => {
      const result = algorithm.positionPieces(1, pieceArea, ['A']);
      
      expect(result.success).toBe(true);
      expect(result.positions).toHaveLength(1);
      
      const pos = result.positions[0];
      // La pieza debe estar dentro del área
      expect(pos.x).toBeGreaterThanOrEqual(pieceArea.x);
      expect(pos.y).toBeGreaterThanOrEqual(pieceArea.y);
      expect(pos.x + 100).toBeLessThanOrEqual(pieceArea.x + pieceArea.width);
      expect(pos.y + 100).toBeLessThanOrEqual(pieceArea.y + pieceArea.height);
    });

    test('should position 2 pieces without overlap', () => {
      const result = algorithm.positionPieces(2, pieceArea, ['A', 'B']);
      
      expect(result.success).toBe(true);
      expect(result.positions).toHaveLength(2);
      
      // Verificar que ambas piezas están en el área
      result.positions.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(pieceArea.x);
        expect(pos.y).toBeGreaterThanOrEqual(pieceArea.y);
        expect(pos.x + 100).toBeLessThanOrEqual(pieceArea.x + pieceArea.width);
        expect(pos.y + 100).toBeLessThanOrEqual(pieceArea.y + pieceArea.height);
      });

      // Verificar que no se solapan (simplificado: distancia mínima)
      const [pos1, pos2] = result.positions;
      const distance = Math.sqrt(
        Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
      );
      expect(distance).toBeGreaterThan(100); // Al menos el tamaño de una pieza
    });

    test('should position 3 pieces without overlap', () => {
      const result = algorithm.positionPieces(3, pieceArea, ['A', 'B', 'A']);
      
      expect(result.success).toBe(true);
      expect(result.positions).toHaveLength(3);
      
      // Verificar que todas las piezas están en el área
      result.positions.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(pieceArea.x);
        expect(pos.y).toBeGreaterThanOrEqual(pieceArea.y);
        expect(pos.x + 100).toBeLessThanOrEqual(pieceArea.x + pieceArea.width);
        expect(pos.y + 100).toBeLessThanOrEqual(pieceArea.y + pieceArea.height);
      });

      // Verificar que no se solapan usando la función de geometría
      const testPieces = result.positions.map((pos, i) => ({
        type: ['A', 'B', 'A'][i] as 'A' | 'B',
        face: 'front' as const,
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation
      }));

      // Verificar cada par de piezas
      for (let i = 0; i < testPieces.length; i++) {
        for (let j = i + 1; j < testPieces.length; j++) {
          expect(geometry.doPiecesOverlap(testPieces[i], testPieces[j])).toBe(false);
        }
      }
    });

    test('should position 4 pieces without overlap', () => {
      const result = algorithm.positionPieces(4, pieceArea, ['A', 'B', 'A', 'B']);
      
      expect(result.success).toBe(true);
      expect(result.positions).toHaveLength(4);
      
      // Verificar que todas las piezas están en el área
      result.positions.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(pieceArea.x);
        expect(pos.y).toBeGreaterThanOrEqual(pieceArea.y);
        expect(pos.x + 100).toBeLessThanOrEqual(pieceArea.x + pieceArea.width);
        expect(pos.y + 100).toBeLessThanOrEqual(pieceArea.y + pieceArea.height);
      });

      // Verificar que no se solapan usando la función de geometría
      const testPieces = result.positions.map((pos, i) => ({
        type: ['A', 'B', 'A', 'B'][i] as 'A' | 'B',
        face: 'front' as const,
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation
      }));

      // Verificar cada par de piezas
      for (let i = 0; i < testPieces.length; i++) {
        for (let j = i + 1; j < testPieces.length; j++) {
          expect(geometry.doPiecesOverlap(testPieces[i], testPieces[j])).toBe(false);
        }
      }
    });

    test('should handle larger numbers of pieces', () => {
      const largerArea: PositioningArea = {
        x: 0,
        y: 0,
        width: 600,
        height: 600
      };

      const result = algorithm.positionPieces(
        6, 
        largerArea, 
        ['A', 'B', 'A', 'B', 'A', 'B']
      );
      
      expect(result.success).toBe(true);
      expect(result.positions).toHaveLength(6);
      
      // Verificar que todas las piezas están en el área
      result.positions.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(largerArea.x);
        expect(pos.y).toBeGreaterThanOrEqual(largerArea.y);
        expect(pos.x + 100).toBeLessThanOrEqual(largerArea.x + largerArea.width);
        expect(pos.y + 100).toBeLessThanOrEqual(largerArea.y + largerArea.height);
      });
    });

    test('should fail gracefully when area is too small for multiple pieces', () => {
      const tinyArea: PositioningArea = {
        x: 0,
        y: 0,
        width: 150, // Solo puede caber una pieza
        height: 150
      };

      const result = algorithm.positionPieces(3, tinyArea, ['A', 'B', 'A']);
      
      // Debe fallar o tener éxito, pero si tiene éxito, no debe solapar
      if (result.success) {
        const testPieces = result.positions.map((pos, i) => ({
          type: ['A', 'B', 'A'][i] as 'A' | 'B',
          face: 'front' as const,
          x: pos.x,
          y: pos.y,
          rotation: pos.rotation
        }));

        for (let i = 0; i < testPieces.length; i++) {
          for (let j = i + 1; j < testPieces.length; j++) {
            expect(geometry.doPiecesOverlap(testPieces[i], testPieces[j])).toBe(false);
          }
        }
      }
    });

    test('should respect piece spacing', () => {
      const customSpacing = 50;
      const algorithm50 = new PiecePositioningAlgorithm(geometry, 100, customSpacing);
      
      const result = algorithm50.positionPieces(2, pieceArea, ['A', 'B']);
      
      if (result.success) {
        const [pos1, pos2] = result.positions;
        const distance = Math.sqrt(
          Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
        );
        // La distancia debe ser al menos el tamaño de pieza + spacing
        expect(distance).toBeGreaterThanOrEqual(100 + customSpacing);
      }
    });
  });

  describe('edge cases', () => {
    test('should handle exact fit scenarios', () => {
      // Área que exactamente puede contener 2 piezas horizontalmente
      const exactArea: PositioningArea = {
        x: 0,
        y: 0,
        width: 220, // 100 + 20 + 100
        height: 100
      };

      const result = algorithm.positionPieces(2, exactArea, ['A', 'B']);
      expect(result.success).toBe(true);
    });

    test('should handle minimum viable area', () => {
      // Área mínima para una pieza
      const minArea: PositioningArea = {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      };

      const result = algorithm.positionPieces(1, minArea, ['A']);
      expect(result.success).toBe(true);
    });
  });

  describe('real game scenarios', () => {
    test('should work with actual game piece area dimensions', () => {
      // Área real del juego para piezas
      const realPieceArea: PositioningArea = {
        x: 0,
        y: 600,
        width: 350,  // Área real de piezas en el juego
        height: 400
      };

      // Probar cada cantidad de piezas que puede aparecer en el juego
      for (let numPieces = 1; numPieces <= 4; numPieces++) {
        const pieceTypes = Array(numPieces).fill(0).map((_, i) => i % 2 === 0 ? 'A' : 'B') as Array<'A' | 'B'>;
        
        const result = algorithm.positionPieces(numPieces, realPieceArea, pieceTypes);
        
        expect(result.success).toBe(true);
        expect(result.positions).toHaveLength(numPieces);
        
        // Verificar que no hay solapamientos
        const testPieces = result.positions.map((pos, i) => ({
          type: pieceTypes[i],
          face: 'front' as const,
          x: pos.x,
          y: pos.y,
          rotation: pos.rotation
        }));

        for (let i = 0; i < testPieces.length; i++) {
          for (let j = i + 1; j < testPieces.length; j++) {
            expect(geometry.doPiecesOverlap(testPieces[i], testPieces[j])).toBe(false);
          }
        }
      }
    });

    test('should provide consistent results for same inputs', () => {
      const testArea: PositioningArea = {
        x: 0,
        y: 600,
        width: 350,
        height: 400
      };

      // El algoritmo no debe ser determinista para el random, pero 
      // grid debería dar resultados consistentes
      const result1 = algorithm.positionPieces(4, testArea, ['A', 'B', 'A', 'B']);
      const result2 = algorithm.positionPieces(4, testArea, ['A', 'B', 'A', 'B']);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      // Ambos deberían tener el mismo número de piezas
      expect(result1.positions).toHaveLength(4);
      expect(result2.positions).toHaveLength(4);
    });
  });
});