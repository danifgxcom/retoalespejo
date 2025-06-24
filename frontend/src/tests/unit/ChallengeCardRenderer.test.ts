import { ChallengeCardRenderer, ChallengeCardRenderConfig } from '../../rendering/ChallengeCardRenderer';
import { GameGeometry } from '../../utils/geometry/GameGeometry';
import { Challenge } from '../../components/ChallengeCard';

// Mock canvas context
const createMockContext = () => ({
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: 'left' as CanvasTextAlign,
  imageSmoothingEnabled: true,
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  clearRect: jest.fn()
});

describe('ChallengeCardRenderer', () => {
  let renderer: ChallengeCardRenderer;
  let mockCtx: ReturnType<typeof createMockContext>;
  let geometry: GameGeometry;
  let config: ChallengeCardRenderConfig;

  beforeEach(() => {
    mockCtx = createMockContext();
    
    geometry = new GameGeometry({
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    });

    config = {
      cardLeft: 50,
      cardTop: 50,
      cardWidth: 600,
      cardHeight: 300,
      contentTop: 90,
      contentHeight: 260,
      mirrorLineX: 350,
      gameAreaWidth: 700,
      gameAreaHeight: 600,
      pieceSize: 100,
      scale: 0.5
    };

    renderer = new ChallengeCardRenderer(config, geometry);
  });

  describe('render', () => {
    test('should render loading message when no challenge provided', () => {
      renderer.render(mockCtx as any, null, { isValid: false }, false);

      expect(mockCtx.fillText).toHaveBeenCalledWith(
        'Loading challenges...', 
        config.cardLeft + config.cardWidth/2, 
        config.cardTop + config.cardHeight/2
      );
    });

    test('should render invalid state when validation fails', () => {
      const mockChallenge: Challenge = {
        id: 1,
        name: 'Test Challenge',
        description: 'Test',
        piecesNeeded: 1,
        difficulty: 'Easy',
        targetPattern: 'custom',
        objective: { playerPieces: [], symmetricPattern: [] },
        targetPieces: []
      };

      const validation = {
        isValid: false,
        touchesMirror: false,
        hasPieceOverlaps: true,
        entersMirror: false,
        piecesConnected: true,
        piecesInArea: true
      };

      renderer.render(mockCtx as any, mockChallenge, validation, false);

      expect(mockCtx.fillText).toHaveBeenCalledWith(
        'INVALID',
        config.cardLeft + config.cardWidth/2,
        config.cardTop + config.cardHeight/2
      );

      expect(mockCtx.fillText).toHaveBeenCalledWith(
        'No piece touches the mirror',
        config.cardLeft + config.cardWidth/2,
        expect.any(Number)
      );

      expect(mockCtx.fillText).toHaveBeenCalledWith(
        'Pieces overlap',
        config.cardLeft + config.cardWidth/2,
        expect.any(Number)
      );
    });

    test('should render valid challenge with pieces', () => {
      const mockChallenge: Challenge = {
        id: 1,
        name: 'Test Challenge',
        description: 'Test',
        piecesNeeded: 1,
        difficulty: 'Easy',
        targetPattern: 'custom',
        objective: {
          playerPieces: [
            {
              type: 'A' as const,
              face: 'front' as const,
              x: 100,
              y: 200,
              rotation: 0
            }
          ],
          symmetricPattern: []
        },
        targetPieces: []
      };

      const validation = { isValid: true };

      renderer.render(mockCtx as any, mockChallenge, validation, false);

      // Should draw challenge number
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        '#1',
        config.cardLeft + config.cardWidth/2,
        config.cardTop + 45
      );

      // Should draw pieces (verify some piece drawing calls)
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });
  });

  describe('card frame rendering', () => {
    test('should draw card background and border', () => {
      renderer.render(mockCtx as any, null, { isValid: false }, false);

      // Check background
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        config.cardLeft,
        config.cardTop,
        config.cardWidth,
        config.cardHeight
      );

      // Check border
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(
        config.cardLeft,
        config.cardTop,
        config.cardWidth,
        config.cardHeight
      );

      // Check title
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        'CHALLENGE CARD',
        config.cardLeft + config.cardWidth/2,
        config.cardTop + 25
      );
    });
  });

  describe('debug mode', () => {
    test('should log debug information when debug mode is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockChallenge: Challenge = {
        id: 1,
        name: 'Test Challenge',
        description: 'Test',
        piecesNeeded: 1,
        difficulty: 'Easy',
        targetPattern: 'custom',
        objective: {
          playerPieces: [
            {
              type: 'A' as const,
              face: 'front' as const,
              x: 100,
              y: 200,
              rotation: 0
            }
          ],
          symmetricPattern: []
        },
        targetPieces: []
      };

      renderer.render(mockCtx as any, mockChallenge, { isValid: true }, true);

      expect(consoleSpy).toHaveBeenCalledWith('🎯 TARJETA DE RETO DEBUG:');
      expect(consoleSpy).toHaveBeenCalledWith(`Card area: ${config.cardWidth}x${config.cardHeight}`);

      consoleSpy.mockRestore();
    });

    test('should draw debug overlays when debug mode is enabled', () => {
      const mockChallenge: Challenge = {
        id: 1,
        name: 'Test Challenge',
        description: 'Test',
        piecesNeeded: 1,
        difficulty: 'Easy',
        targetPattern: 'custom',
        objective: {
          playerPieces: [
            {
              type: 'A' as const,
              face: 'front' as const,
              x: 100,
              y: 200,
              rotation: 0
            }
          ],
          symmetricPattern: []
        },
        targetPieces: []
      };

      renderer.render(mockCtx as any, mockChallenge, { isValid: true }, true);

      // Should draw debug text
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        'TARJETA DEBUG:',
        config.cardLeft,
        config.cardTop - 10
      );

      // Should draw debug rectangles
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(
        config.cardLeft,
        config.cardTop,
        config.cardWidth,
        config.cardHeight
      );
    });
  });

  describe('piece rendering', () => {
    test('should calculate correct piece colors for type A front face', () => {
      const mockChallenge: Challenge = {
        id: 1,
        name: 'Test Challenge',
        description: 'Test',
        piecesNeeded: 1,
        difficulty: 'Easy',
        targetPattern: 'custom',
        objective: {
          playerPieces: [
            {
              type: 'A' as const,
              face: 'front' as const,
              x: 100,
              y: 200,
              rotation: 0
            }
          ],
          symmetricPattern: []
        },
        targetPieces: []
      };

      renderer.render(mockCtx as any, mockChallenge, { isValid: true }, false);

      // Verify that colors are set correctly for type A front face
      // Center should be gold (#FFD700), triangles should be red (#FF4444)
      expect(mockCtx.fillStyle).toHaveBeenCalledWith('#FFD700');
      expect(mockCtx.fillStyle).toHaveBeenCalledWith('#FF4444');
    });

    test('should calculate correct piece colors for type B back face', () => {
      const mockChallenge: Challenge = {
        id: 1,
        name: 'Test Challenge',
        description: 'Test',
        piecesNeeded: 1,
        difficulty: 'Easy',
        targetPattern: 'custom',
        objective: {
          playerPieces: [
            {
              type: 'B' as const,
              face: 'back' as const,
              x: 100,
              y: 200,
              rotation: 0
            }
          ],
          symmetricPattern: []
        },
        targetPieces: []
      };

      renderer.render(mockCtx as any, mockChallenge, { isValid: true }, false);

      // For type B back face: center should be red, triangles should be gold
      expect(mockCtx.fillStyle).toHaveBeenCalledWith('#FF4444');
      expect(mockCtx.fillStyle).toHaveBeenCalledWith('#FFD700');
    });
  });
});