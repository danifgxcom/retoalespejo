import { MirrorCoordinateSystem, MirrorCoordinateConfig, MirrorRelativePiecePosition } from './MirrorCoordinateSystem';
import { PiecePosition, GameGeometry } from './GameGeometry';

describe('MirrorCoordinateSystem', () => {
  let mirrorSystem: MirrorCoordinateSystem;
  let config: MirrorCoordinateConfig;
  let geometry: GameGeometry;

  beforeEach(() => {
    config = {
      mirrorLineX: 700,
      centerY: 300,
      pieceSize: 100
    };
    geometry = new GameGeometry({
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    });
    mirrorSystem = new MirrorCoordinateSystem(config, geometry);
  });

  describe('relativeToAbsolute', () => {
    it('should convert piece touching mirror (x=0) to correct absolute position', () => {
      const relativePiece: MirrorRelativePiecePosition = {
        type: 'A',
        face: 'front',
        x: 0, // Touching mirror
        y: 0, // Centered vertically
        rotation: 0
      };

      const absolute = mirrorSystem.relativeToAbsolute(relativePiece);

      // x=0 should place piece so it touches mirror using GameGeometry calculation
      const expectedPosition = geometry.getPositionTouchingMirror(300, 0, 'A');
      expect(absolute.x).toBe(expectedPosition.x);
      expect(absolute.y).toBe(300); // centerY + 0 = 300
      expect(absolute.type).toBe('A');
      expect(absolute.face).toBe('front');
      expect(absolute.rotation).toBe(0);
    });

    it('should convert piece left of mirror (x<0) to correct absolute position', () => {
      const relativePiece: MirrorRelativePiecePosition = {
        type: 'A',
        face: 'front',
        x: -100, // 100px left of touching position
        y: -50,  // 50px above center
        rotation: 90
      };

      const absolute = mirrorSystem.relativeToAbsolute(relativePiece);

      // x=-100 should be 100px left of touching position
      const touchingPosition = geometry.getPositionTouchingMirror(250, 90, 'A'); // y=300-50=250
      expect(absolute.x).toBe(touchingPosition.x - 100);
      expect(absolute.y).toBe(250); // 300 - 50 = 250
      expect(absolute.rotation).toBe(90);
    });

    it('should handle positive Y (below center)', () => {
      const relativePiece: MirrorRelativePiecePosition = {
        type: 'B',
        face: 'back',
        x: 0,
        y: 100, // 100px below center
        rotation: 180
      };

      const absolute = mirrorSystem.relativeToAbsolute(relativePiece);

      expect(absolute.x).toBe(600);
      expect(absolute.y).toBe(400); // 300 + 100 = 400
      expect(absolute.type).toBe('B');
      expect(absolute.face).toBe('back');
    });
  });

  describe('absoluteToRelative', () => {
    it('should convert absolute position to relative correctly', () => {
      const absolutePiece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 600, // Touching mirror position
        y: 300, // Center
        rotation: 0
      };

      const relative = mirrorSystem.absoluteToRelative(absolutePiece);

      expect(relative.x).toBe(0); // Should be touching mirror
      expect(relative.y).toBe(0); // Should be centered
      expect(relative.type).toBe('A');
      expect(relative.face).toBe('front');
      expect(relative.rotation).toBe(0);
    });

    it('should convert piece left of touching position correctly', () => {
      const absolutePiece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 400, // 200px left of touching position (600)
        y: 200, // 100px above center (300)
        rotation: 45
      };

      const relative = mirrorSystem.absoluteToRelative(absolutePiece);

      expect(relative.x).toBe(-200); // 400 - 600 = -200
      expect(relative.y).toBe(-100); // 200 - 300 = -100
      expect(relative.rotation).toBe(45);
    });
  });

  describe('round-trip conversions', () => {
    it('should be reversible (relative->absolute->relative)', () => {
      const originalRelative: MirrorRelativePiecePosition = {
        type: 'B',
        face: 'back',
        x: -150,
        y: 75,
        rotation: 270
      };

      const absolute = mirrorSystem.relativeToAbsolute(originalRelative);
      const backToRelative = mirrorSystem.absoluteToRelative(absolute);

      expect(backToRelative).toEqual(originalRelative);
    });

    it('should be reversible (absolute->relative->absolute)', () => {
      const originalAbsolute: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 330,
        y: 450,
        rotation: 180
      };

      const relative = mirrorSystem.absoluteToRelative(originalAbsolute);
      const backToAbsolute = mirrorSystem.relativeToAbsolute(relative);

      expect(backToAbsolute).toEqual(originalAbsolute);
    });
  });

  describe('challenge conversion', () => {
    it('should convert relative challenge to absolute format', () => {
      const relativeChallenge = {
        id: 1,
        name: "Test Challenge",
        description: "Test description",
        difficulty: "Easy",
        pieces: [
          {
            type: 'A' as const,
            face: 'front' as const,
            x: 0, // Touching mirror
            y: 0, // Centered
            rotation: 0
          },
          {
            type: 'A' as const,
            face: 'front' as const,
            x: -100, // Left of touching position
            y: 0,
            rotation: 0
          }
        ]
      };

      const absolute = mirrorSystem.convertChallengeToAbsolute(relativeChallenge);

      expect(absolute.id).toBe(1);
      expect(absolute.name).toBe("Test Challenge");
      expect(absolute.objective.playerPieces).toHaveLength(2);
      expect(absolute.objective.playerPieces[0].x).toBe(600); // Touching mirror
      expect(absolute.objective.playerPieces[1].x).toBe(500); // 100px left
    });

    it('should convert absolute challenge to relative format', () => {
      const absoluteChallenge = {
        id: 2,
        name: "Absolute Challenge",
        description: "Test",
        difficulty: "Medium",
        objective: {
          playerPieces: [
            {
              type: 'A' as const,
              face: 'front' as const,
              x: 600, // Touching mirror
              y: 300, // Center
              rotation: 0
            }
          ]
        }
      };

      const relative = mirrorSystem.convertChallengeToRelative(absoluteChallenge);

      expect(relative.id).toBe(2);
      expect(relative.name).toBe("Absolute Challenge");
      expect(relative.pieces).toHaveLength(1);
      expect(relative.pieces[0].x).toBe(0); // Should be touching mirror
      expect(relative.pieces[0].y).toBe(0); // Should be centered
    });
  });

  describe('helper methods', () => {
    it('should create piece touching mirror correctly', () => {
      const piece = mirrorSystem.createPieceTouchingMirror('B', 'back', 50, 90);

      expect(piece.type).toBe('B');
      expect(piece.face).toBe('back');
      expect(piece.x).toBe(0); // Touching mirror
      expect(piece.y).toBe(50);
      expect(piece.rotation).toBe(90);
    });

    it('should create horizontal touching pieces correctly', () => {
      const pieces = mirrorSystem.createHorizontalTouchingPieces('A', 'front', -25);

      expect(pieces).toHaveLength(2);
      expect(pieces[0].x).toBe(-100); // One piece size left
      expect(pieces[0].y).toBe(-25);
      expect(pieces[1].x).toBe(0); // Touching mirror
      expect(pieces[1].y).toBe(-25);
    });

    it('should create vertical touching pieces correctly', () => {
      const pieces = mirrorSystem.createVerticalTouchingPieces('B', 'back', -50);

      expect(pieces).toHaveLength(2);
      expect(pieces[0].x).toBe(-50);
      expect(pieces[0].y).toBe(-50); // Above center
      expect(pieces[1].x).toBe(-50);
      expect(pieces[1].y).toBe(50); // Below center
    });
  });

  describe('validation', () => {
    it('should validate correct relative positions', () => {
      const validPiece: MirrorRelativePiecePosition = {
        type: 'A',
        face: 'front',
        x: -100, // Valid left position
        y: 200,  // Valid Y within bounds
        rotation: 0
      };

      const validation = mirrorSystem.validateRelativePosition(validPiece);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect piece in mirror area', () => {
      const invalidPiece: MirrorRelativePiecePosition = {
        type: 'A',
        face: 'front',
        x: 50, // Invalid: in mirror area
        y: 0,
        rotation: 0
      };

      const validation = mirrorSystem.validateRelativePosition(invalidPiece);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('mirror area'))).toBe(true);
    });

    it('should detect piece too far left', () => {
      const invalidPiece: MirrorRelativePiecePosition = {
        type: 'A',
        face: 'front',
        x: -700, // Too far left
        y: 0,
        rotation: 0
      };

      const validation = mirrorSystem.validateRelativePosition(invalidPiece);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('too far left'))).toBe(true);
    });

    it('should detect Y position out of bounds', () => {
      const invalidPiece: MirrorRelativePiecePosition = {
        type: 'A',
        face: 'front',
        x: 0,
        y: 400, // Out of bounds (> centerY)
        rotation: 0
      };

      const validation = mirrorSystem.validateRelativePosition(invalidPiece);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('out of bounds'))).toBe(true);
    });
  });

  describe('debug information', () => {
    it('should provide correct debug info', () => {
      const debugInfo = mirrorSystem.getDebugInfo();

      expect(debugInfo.mirrorLineX).toBe(700);
      expect(debugInfo.centerY).toBe(300);
      expect(debugInfo.pieceSize).toBe(100);
      expect(debugInfo.gameAreaWidth).toBe(700);
      expect(debugInfo.gameAreaHeight).toBe(600);
    });
  });

  describe('specific coordinate examples', () => {
    it('should handle the original problematic coordinates correctly', () => {
      // The original x=330, y=300 that was confusing
      const originalAbsolute: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 330,
        y: 300,
        rotation: 0
      };

      const relative = mirrorSystem.absoluteToRelative(originalAbsolute);
      
      // x=330 should be 270px left of touching position (600-330=270)
      expect(relative.x).toBe(-270);
      expect(relative.y).toBe(0); // y=300 is center, so relative y=0
      
      // Verify round-trip
      const backToAbsolute = mirrorSystem.relativeToAbsolute(relative);
      expect(backToAbsolute).toEqual(originalAbsolute);
    });

    it('should convert the other confusing coordinate x=72', () => {
      const originalAbsolute: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 72,
        y: 300,
        rotation: 0
      };

      const relative = mirrorSystem.absoluteToRelative(originalAbsolute);
      
      // x=72 should be 528px left of touching position (600-72=528)
      expect(relative.x).toBe(-528);
      expect(relative.y).toBe(0);
    });
  });
});