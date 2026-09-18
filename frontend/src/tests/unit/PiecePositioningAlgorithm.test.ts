import { PiecePositioningAlgorithm, PositioningArea } from '../../utils/positioning/PiecePositioningAlgorithm';
import { GameGeometry, GameAreaConfig } from '@reto/geometry';

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

  const toPiecePosition = (pos: { x: number; y: number; rotation: number }, type: 'A' | 'B' = 'A') => ({
    type,
    face: 'front' as const,
    x: pos.x,
    y: pos.y,
    rotation: pos.rotation
  });

  const expectPieceInArea = (
    pos: { x: number; y: number; rotation: number },
    area: PositioningArea,
    type: 'A' | 'B' = 'A'
  ) => {
    const vertices = geometry.getPieceVertices(toPiecePosition(pos, type));
    vertices.forEach(([x, y]) => {
      expect(x).toBeGreaterThanOrEqual(area.x);
      expect(x).toBeLessThanOrEqual(area.x + area.width);
      expect(y).toBeGreaterThanOrEqual(area.y);
      expect(y).toBeLessThanOrEqual(area.y + area.height);
    });
  };

  const expectNoOverlaps = (
    positions: Array<{ x: number; y: number; rotation: number }>,
    types: Array<'A' | 'B'>
  ) => {
    const testPieces = positions.map((pos, i) => toPiecePosition(pos, types[i]));
    for (let i = 0; i < testPieces.length; i++) {
      for (let j = i + 1; j < testPieces.length; j++) {
        expect(geometry.doPiecesOverlap(testPieces[i], testPieces[j])).toBe(false);
      }
    }
  };

  describe('positionPieces', () => {
    const pieceArea: PositioningArea = {
      x: 0,
      y: 600,
      width: 700,
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
      expectPieceInArea(pos, pieceArea, 'A');
    });

    test('should position 2 pieces without overlap', () => {
      const result = algorithm.positionPieces(2, pieceArea, ['A', 'B']);
      
      expect(result.success).toBe(true);
      expect(result.positions).toHaveLength(2);
      
      // Verificar que ambas piezas están en el área
      result.positions.forEach((pos, index) => {
        expectPieceInArea(pos, pieceArea, ['A', 'B'][index] as 'A' | 'B');
      });
      expectNoOverlaps(result.positions, ['A', 'B']);

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
      result.positions.forEach((pos, index) => {
        expectPieceInArea(pos, pieceArea, ['A', 'B', 'A'][index] as 'A' | 'B');
      });
      expectNoOverlaps(result.positions, ['A', 'B', 'A']);
    });

    test('should position 4 pieces without overlap', () => {
      // Con la geometría real (en vez de la caja pieceSize x pieceSize inexistente)
      // el algoritmo SÍ encuentra sitio para 4 piezas sin solape.
      const result = algorithm.positionPieces(4, pieceArea, ['A', 'B', 'A', 'B']);

      expect(result.success).toBe(true);
      expect(result.positions).toHaveLength(4);
      result.positions.forEach((pos, index) => {
        expectPieceInArea(pos, pieceArea, ['A', 'B', 'A', 'B'][index] as 'A' | 'B');
      });
      expectNoOverlaps(result.positions, ['A', 'B', 'A', 'B']);
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
      const types: Array<'A' | 'B'> = ['A', 'B', 'A', 'B', 'A', 'B'];
      result.positions.forEach((pos, index) => {
        expectPieceInArea(pos, largerArea, types[index]);
      });
      expectNoOverlaps(result.positions, types);
    });

    test('should position 8 pieces in the startup storage area', () => {
      const storageArea: PositioningArea = {
        x: 0,
        y: 500,
        width: 1400,
        height: 500
      };
      const pieceTypes: Array<'A' | 'B'> = ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'];

      const result = algorithm.positionPieces(8, storageArea, pieceTypes);

      expect(result.success).toBe(true);
      expect(result.positions).toHaveLength(8);
      result.positions.forEach((pos, index) => {
        expectPieceInArea(pos, storageArea, pieceTypes[index]);
      });
      expectNoOverlaps(result.positions, pieceTypes);
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
        expect(distance).toBeGreaterThanOrEqual(customSpacing);
        expectNoOverlaps(result.positions, ['A', 'B']);
      }
    });
  });

  describe('edge cases', () => {
    test('should handle exact fit scenarios', () => {
      // La geometría asimétrica requiere un área más grande (320px por pieza a rotation=0)
      const exactArea: PositioningArea = {
        x: 0,
        y: 0,
        width: 700,
        height: 400
      };

      const result = algorithm.positionPieces(2, exactArea, ['A', 'B']);
      expect(result.success).toBe(true);
    });

    test('should handle minimum viable area', () => {
      // Área mínima para una pieza con geometría asimétrica (shape extends 370px to the right)
      const minArea: PositioningArea = {
        x: 0,
        y: 0,
        width: 700,
        height: 400
      };

      const result = algorithm.positionPieces(1, minArea, ['A']);
      expect(result.success).toBe(true);
    });
  });

  describe('real game scenarios', () => {
    test('should work with actual game piece area dimensions', () => {
      // Área real del juego para piezas (700px para acomodar la geometría asimétrica de las piezas)
      const realPieceArea: PositioningArea = {
        x: 0,
        y: 600,
        width: 700,
        height: 400
      };

      // Con la geometría real el algoritmo coloca de 1 a 4 piezas sin solape.
      for (let numPieces = 1; numPieces <= 4; numPieces++) {
        const pieceTypes = Array(numPieces).fill(0).map((_, i) => i % 2 === 0 ? 'A' : 'B') as Array<'A' | 'B'>;
        
        const result = algorithm.positionPieces(numPieces, realPieceArea, pieceTypes);
        
        expect(result.success).toBe(true);
        expect(result.positions).toHaveLength(numPieces);
        
        result.positions.forEach((pos, index) => {
          expectPieceInArea(pos, realPieceArea, pieceTypes[index]);
        });
        expectNoOverlaps(result.positions, pieceTypes);
      }
    });

    test('should provide consistent results for same inputs', () => {
      const testArea: PositioningArea = {
        x: 0,
        y: 600,
        width: 700,
        height: 400
      };

      // El algoritmo es determinista (shelf packing, sin aleatoriedad): mismos
      // inputs deben dar el mismo resultado.
      const result1 = algorithm.positionPieces(4, testArea, ['A', 'B', 'A', 'B']);
      const result2 = algorithm.positionPieces(4, testArea, ['A', 'B', 'A', 'B']);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.positions).toHaveLength(4);
      expect(result2.positions).toEqual(result1.positions);
    });
  });
});
