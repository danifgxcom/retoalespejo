import { ChallengeService } from './ChallengeService';
import { GameGeometry } from '../utils/GameGeometry';

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
      
      // Verify conversion: relative x=0 should become absolute x=600
      const challenge = result.challenges[0];
      expect(challenge.objective.playerPieces[0].x).toBe(600);
      expect(challenge.objective.playerPieces[0].y).toBe(300);
    });

    it('should fallback to absolute coordinates when relative file not found', async () => {
      const mockAbsoluteData = [
        {
          id: 1,
          name: 'Absolute Challenge',
          description: 'Test',
          piecesNeeded: 1,
          difficulty: 'Easy',
          targetPattern: 'test',
          objective: {
            playerPieces: [
              {
                type: 'A' as const,
                face: 'front' as const,
                x: 600,
                y: 300,
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

      // Mock failed fetch for relative file, successful for absolute
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 }) // relative file fails
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAbsoluteData)
        }); // absolute file succeeds

      const result = await challengeService.loadChallenges();

      expect(result.success).toBe(true);
      expect(result.source).toBe('file');
      expect(result.challenges).toHaveLength(1);
      expect(result.challenges[0].objective.playerPieces[0].x).toBe(600);
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

      // Should still succeed but filter out invalid challenges
      expect(result.success).toBe(false); // No valid challenges remain
      expect(result.challenges).toHaveLength(0);
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
            description: 'Converting x=330 from absolute',
            piecesNeeded: 1,
            difficulty: 'Easy',
            targetPattern: 'test',
            pieces: [
              {
                type: 'A' as const,
                face: 'front' as const,
                x: -270, // Original x=330 converted to relative (-270)
                y: 0,    // Original y=300 converted to relative (0)
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
      
      // Should convert back to something close to original absolute coordinates
      // relative x=-270 should become absolute x=330 (600-270=330)
      expect(piece.x).toBe(330);
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
      expect(relativeChallenge.pieces[0].x).toBe(0); // Should be touching mirror (x=0)
      expect(relativeChallenge.pieces[0].y).toBe(0); // Should be centered (y=0)
    });
  });
});