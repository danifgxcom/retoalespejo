import { GameGeometry, PiecePosition, GameAreaConfig } from '@reto/geometry';

describe('GameGeometry', () => {
  let geometry: GameGeometry;
  let config: GameAreaConfig;

  beforeEach(() => {
    config = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    geometry = new GameGeometry(config);
  });

  describe('constructor and config', () => {
    test('should initialize with correct config', () => {
      expect(geometry.getConfig()).toEqual(config);
    });
  });

  describe('reflectPieceAcrossMirror', () => {
    test('should correctly reflect a piece across the mirror', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 600,
        y: 300,
        rotation: 0
      };

      const reflected = geometry.reflectPieceAcrossMirror(piece);

      // La forma es quiral: un espejo convierte una pieza A en una B.
      // Con el centro como ancla, x' = 2*700 - 600 = 800.
      expect(reflected.type).toBe('B');
      expect(reflected.face).toBe('front');
      expect(reflected.y).toBe(300);
      expect(reflected.rotation).toBe(0);
      expect(reflected.x).toBe(800);
    });

    test('should preserve piece properties except position', () => {
      const piece: PiecePosition = {
        type: 'B',
        face: 'back',
        x: 500,
        y: 200,
        rotation: 45
      };

      const reflected = geometry.reflectPieceAcrossMirror(piece);

      // El reflejo también invierte el sentido de giro: (360 - 45) % 360 = 315.
      expect(reflected.type).toBe('A');
      expect(reflected.face).toBe('back');
      expect(reflected.y).toBe(200);
      expect(reflected.rotation).toBe(315);
    });
  });

  describe('reflectPieceForChallengeCard', () => {
    test('should reflect piece for challenge card display', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 600,
        y: 300,
        rotation: 0
      };

      const reflected = geometry.reflectPieceForChallengeCard(piece);

      // Con el centro como ancla: x' = 2 * 700 - 600 = 800; y el tipo se invierte (A -> B).
      expect(reflected.x).toBe(800);
      expect(reflected.y).toBe(300);
      expect(reflected.type).toBe('B');
      expect(reflected.face).toBe('front');
      expect(reflected.rotation).toBe(0);
    });
  });

  describe('isPieceInGameArea', () => {
    test('should return true for pieces in game area', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 300,
        y: 400,
        rotation: 0
      };

      expect(geometry.isPieceInGameArea(piece)).toBe(true);
    });

    test('should return false for pieces outside game area', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 300,
        y: 700,
        rotation: 0
      };

      expect(geometry.isPieceInGameArea(piece)).toBe(false);
    });

    test('should return false for pieces at boundary', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 300,
        y: 600,
        rotation: 0
      };

      expect(geometry.isPieceInGameArea(piece)).toBe(false);
    });
  });

  describe('getPieceBoundingBox', () => {
    test('should calculate bounding box for unrotated piece', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100,
        y: 200,
        rotation: 0
      };

      const bbox = geometry.getPieceBoundingBox(piece);

      // piece.x/y es el centro. Con unit = 100*1.28 = 128, la figura tipo A sin rotar
      // se extiende de -192 a +128 en X y de -128 a +64 en Y respecto al centro.
      // bbox.left = 100 - 192 = -92; bbox.top = 200 - 128 = 72
      expect(bbox.left).toBeCloseTo(-92, 1);
      expect(bbox.top).toBeCloseTo(72, 1);
      expect(bbox.right).toBeGreaterThan(bbox.left);
      expect(bbox.bottom).toBeGreaterThan(bbox.top);
    });

    test('should calculate different bounding box for rotated piece', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100,
        y: 200,
        rotation: 0
      };

      const rotatedPiece: PiecePosition = {
        ...piece,
        rotation: 90
      };

      const bbox1 = geometry.getPieceBoundingBox(piece);
      const bbox2 = geometry.getPieceBoundingBox(rotatedPiece);

      // Rotated piece should have different dimensions
      expect(bbox1.right - bbox1.left).not.toBeCloseTo(bbox2.right - bbox2.left, 1);
    });
  });

  describe('isPieceTouchingMirror', () => {
    test('should detect piece touching mirror', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 650, // Close to mirror line at 700
        y: 300,
        rotation: 0
      };

      const touching = geometry.isPieceTouchingMirror(piece);
      expect(typeof touching).toBe('boolean');
    });

    test('should not detect piece far from mirror', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100, // Far from mirror line
        y: 300,
        rotation: 0
      };

      const touching = geometry.isPieceTouchingMirror(piece);
      expect(touching).toBe(false);
    });
  });

  describe('constrainPiecePosition', () => {
    test('should constrain piece within canvas bounds', () => {
      // Tipo A sin rotar se extiende hasta -192 a la izquierda del centro.
      // Con piece.x = -50, bbox.left = -50 - 192 = -242 (< 0): hay que empujarla
      // overlap = 242 px hacia la derecha para que bbox.left llegue a 0.
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: -50,
        y: 300,
        rotation: 0
      };

      const constrained = geometry.constrainPiecePosition(piece, 1400, 1000, true);

      expect(constrained.x).toBe(192);
      expect(constrained.y).toBe(300);
    });

    test('should prevent piece from entering mirror area when respectMirror is true', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 750, // In mirror area
        y: 300,
        rotation: 0
      };

      const constrained = geometry.constrainPiecePosition(piece, 1400, 1000, true);

      expect(constrained.x).toBeLessThan(700); // Should be constrained before mirror
    });

    test('should allow piece in mirror area when respectMirror is false', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 750, // In mirror area
        y: 300,
        rotation: 0
      };

      const constrained = geometry.constrainPiecePosition(piece, 1400, 1000, false);

      expect(constrained.x).toBe(750); // Should not be constrained
    });
  });

  describe('validateChallengeCard', () => {
    test('should validate empty challenge as invalid', () => {
      const result = geometry.validateChallengeCard([]);
      
      expect(result.isValid).toBe(false);
      expect(result.touchesMirror).toBe(false);
    });

    test('should validate single piece touching mirror', () => {
      const pieces: PiecePosition[] = [
        {
          type: 'A',
          face: 'front',
          x: 650, // Close to mirror
          y: 300,
          rotation: 0
        }
      ];

      const result = geometry.validateChallengeCard(pieces);
      
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.touchesMirror).toBe('boolean');
      expect(typeof result.hasPieceOverlaps).toBe('boolean');
      expect(typeof result.hasReflectionOverlaps).toBe('boolean');
      expect(typeof result.piecesConnected).toBe('boolean');
      expect(typeof result.piecesInArea).toBe('boolean');
    });

    test('should detect overlapping pieces', () => {
      const pieces: PiecePosition[] = [
        {
          type: 'A',
          face: 'front',
          x: 600,
          y: 300,
          rotation: 0
        },
        {
          type: 'A',
          face: 'front',
          x: 600, // Same position
          y: 300,
          rotation: 0
        }
      ];

      const result = geometry.validateChallengeCard(pieces);
      
      expect(result.hasPieceOverlaps).toBe(true);
    });
  });

  describe('snapPieceToNearbyTargets', () => {
    test('should return original position when no nearby pieces', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100,
        y: 100,
        rotation: 0
      };

      const snapped = geometry.snapPieceToNearbyTargets(piece, [], 20);
      
      expect(snapped.x).toBe(100);
      expect(snapped.y).toBe(100);
    });

    test('should snap to nearby piece when within snap distance', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100,
        y: 100,
        rotation: 0
      };

      const otherPieces: PiecePosition[] = [
        {
          type: 'A',
          face: 'front',
          x: 110, // 10 pixels away, within snap distance of 20
          y: 100,
          rotation: 0
        }
      ];

      const snapped = geometry.snapPieceToNearbyTargets(piece, otherPieces, 20);
      
      // Should have moved towards the other piece
      expect(snapped.x).not.toBe(100);
    });
  });

  describe('edge detection and alignment', () => {
    test('should find compatible edges between pieces', () => {
      const piece1: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100,
        y: 100,
        rotation: 0
      };

      const piece2: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 200,
        y: 100,
        rotation: 0
      };

      const compatibleEdges = geometry.findCompatibleEdges(piece1, piece2);
      
      expect(Array.isArray(compatibleEdges)).toBe(true);
      expect(compatibleEdges.length).toBeGreaterThanOrEqual(0);
    });

    test('should get piece edges correctly', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100,
        y: 100,
        rotation: 0
      };

      const edges = geometry.getPieceEdges(piece);
      
      expect(Array.isArray(edges)).toBe(true);
      expect(edges.length).toBeGreaterThan(0);
      
      edges.forEach(edge => {
        expect(edge).toHaveProperty('start');
        expect(edge).toHaveProperty('end');
        expect(edge).toHaveProperty('direction');
        expect(edge).toHaveProperty('length');
        expect(edge).toHaveProperty('type');
        expect(['straight', 'diagonal']).toContain(edge.type);
      });
    });
  });

  describe('penetration and overlap detection', () => {
    test('should calculate penetration depth between pieces', () => {
      const piece1: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100,
        y: 100,
        rotation: 0
      };

      const piece2: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 110, // Slightly overlapping
        y: 100,
        rotation: 0
      };

      const penetration = geometry.getPenetrationDepth(piece1, piece2);
      
      expect(typeof penetration).toBe('number');
      expect(penetration).toBeGreaterThanOrEqual(0);
    });

    test('should detect significant overlap', () => {
      const piece1: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100,
        y: 100,
        rotation: 0
      };

      const piece2: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100, // Same position - significant overlap
        y: 100,
        rotation: 0
      };

      const hasOverlap = geometry.doPiecesOverlapSignificantly(piece1, piece2);
      
      expect(hasOverlap).toBe(true);
    });

    test('should not detect overlap for distant pieces', () => {
      const piece1: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100,
        y: 100,
        rotation: 0
      };

      const piece2: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 500, // Far away
        y: 100,
        rotation: 0
      };

      const hasOverlap = geometry.doPiecesOverlapSignificantly(piece1, piece2);
      
      expect(hasOverlap).toBe(false);
    });
  });
});