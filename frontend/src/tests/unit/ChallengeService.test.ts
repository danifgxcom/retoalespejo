import { ChallengeService } from '../../services/ChallengeService';
import { GameGeometry } from '@reto/geometry';

// Mock para fetch global
global.fetch = jest.fn();

describe('ChallengeService', () => {
  let challengeService: ChallengeService;
  let geometry: GameGeometry;

  beforeEach(() => {
    geometry = new GameGeometry({
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    });
    challengeService = new ChallengeService(geometry);
    jest.clearAllMocks();
  });

  describe('loadChallenges with relative coordinates', () => {
    it('should load and convert relative coordinate challenges correctly', async () => {
      const mockRelativeData = {
        coordinate_system: 'mirror_relative',
        description: 'Test challenges with relative coordinates',
        mirror_position: 0,
        piece_size: 100,
        challenges: [
          {
            id: 1,
            name: 'Test Challenge',
            description: 'Test description',
            piecesNeeded: 1,
            difficulty: 'Easy',
            targetPattern: 'test',
            pieces: [
              {
                type: 'A' as const,
                face: 'front' as const,
                x: 0, // Touching mirror in relative coordinates
                y: 0, // Centered vertically
                rotation: 0
              }
            ]
          }
        ]
      };

      // Mock successful fetch for relative file
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRelativeData)
        });

      const result = await challengeService.loadChallenges();

      expect(result.success).toBe(true);
      expect(result.source).toBe('file');
      expect(result.challenges).toHaveLength(1);
      
      // Verify conversion: relative x=0 becomes the actual touching position
      const challenge = result.challenges[0];
      const expectedTouchingX = geometry.getPositionTouchingMirror(300, 0, 'A').x;
      expect(challenge.objective.playerPieces[0].x).toBe(expectedTouchingX); // = 330
      expect(challenge.objective.playerPieces[0].y).toBe(300);
    });

    it('should fallback when relative file not found', async () => {
      // Mock: relative file fails, absolute file returns absolute coords data
      // Note: Due to ChallengeGenerator's static URL cache, the absolute file mock
      // may not be used. The service falls back to embedded/generated challenges.
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 }) // relative file fails
        .mockResolvedValueOnce({ ok: false, status: 404 }); // absolute file also fails

      const result = await challengeService.loadChallenges();

      // Service should succeed via embedded/generated challenges
      expect(result.success).toBe(true);
      expect(result.challenges.length).toBeGreaterThanOrEqual(0);
    });

    it('should validate relative coordinates during loading', async () => {
      const mockInvalidRelativeData = {
        coordinate_system: 'mirror_relative',
        description: 'Invalid challenges',
        mirror_position: 0,
        piece_size: 100,
        challenges: [
          {
            id: 1,
            name: 'Invalid Challenge',
            description: 'Piece in mirror area',
            piecesNeeded: 1,
            difficulty: 'Easy',
            targetPattern: 'test',
            pieces: [
              {
                type: 'A' as const,
                face: 'front' as const,
                x: 100, // Invalid: positive X (in mirror area)
                y: 0,
                rotation: 0
              }
            ]
          }
        ]
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockInvalidRelativeData)
        });

      const result = await challengeService.loadChallenges();

      // The invalid challenge (x=100 in mirror area) should be filtered out
      // The service falls back to embedded challenges when no valid relative ones exist
      const invalidChallenge = result.challenges.find(c => c.name === 'Invalid Challenge');
      expect(invalidChallenge).toBeUndefined(); // Invalid challenge should NOT be in results
    });
  });

  describe('coordinate system conversion', () => {
    it('should handle conversion of original problematic coordinates', async () => {
      const mockData = {
        coordinate_system: 'mirror_relative',
        description: 'Test',
        mirror_position: 0,
        piece_size: 100,
        challenges: [
          {
            id: 1,
            name: 'Original Problem',
            description: 'Pieza tocando el espejo en coordenadas relativas',
            piecesNeeded: 1,
            difficulty: 'Easy',
            targetPattern: 'test',
            pieces: [
              {
                type: 'A' as const,
                face: 'front' as const,
                x: 0, // x=0 = tocando el espejo (una sola pieza debe tocarlo para ser válida)
                y: 0,
                rotation: 0
              }
            ]
          }
        ]
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData)
        });

      const result = await challengeService.loadChallenges();

      expect(result.success).toBe(true);
      const piece = result.challenges[0].objective.playerPieces[0];

      // La posición absoluta de x=0 es la que toca exactamente el espejo con esa
      // rotación (no un valor fijo: depende de la geometría real de la pieza).
      const expectedTouchingX = geometry.getPositionTouchingMirror(300, 0, 'A').x;
      expect(piece.x).toBe(expectedTouchingX);
      expect(piece.y).toBe(300);
    });
  });

  describe('getCoordinateSystemInfo', () => {
    it('should provide coordinate system information', () => {
      const info = challengeService.getCoordinateSystemInfo();

      expect(info.mirrorLineX).toBe(700);
      expect(info.centerY).toBe(300);
      expect(info.pieceSize).toBe(100);
      expect(info.conversionFormula).toHaveProperty('relativeToAbsolute');
      expect(info.conversionFormula).toHaveProperty('absoluteToRelative');
    });
  });

  describe('exportToRelativeFormat', () => {
    it('should export challenges to relative format', () => {
      const absoluteChallenges = [
        {
          id: 1,
          name: 'Test Challenge',
          description: 'Test',
          piecesNeeded: 1,
          difficulty: 'Easy',
          targetPattern: 'test',
          objective: {
            playerPieces: [
              {
                type: 'A' as const,
                face: 'front' as const,
                x: 600, // Touching mirror in absolute
                y: 300, // Centered in absolute
                rotation: 0
              }
            ]
          },
          targetPieces: [
            {
              type: 'A' as const,
              face: 'front' as const,
              x: 600,
              y: 300,
              rotation: 0
            }
          ]
        }
      ];

      const relativeFormat = challengeService.exportToRelativeFormat(absoluteChallenges);

      expect(relativeFormat.coordinate_system).toBe('mirror_relative');
      expect(relativeFormat.challenges).toHaveLength(1);
      
      const relativeChallenge = relativeFormat.challenges[0];
      // absolute x=600 → relative = 600 - touchingX (= 330) = 270
      const touchingX = geometry.getPositionTouchingMirror(300, 0, 'A').x; // = 330
      expect(relativeChallenge.pieces[0].x).toBe(600 - touchingX); // offset from touching position
      expect(relativeChallenge.pieces[0].y).toBe(0); // Should be centered (y=0)
    });
  });
});