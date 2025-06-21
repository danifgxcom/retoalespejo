import { GameAreaRenderer, GameAreaRenderConfig } from '../../rendering/GameAreaRenderer';
import { Piece } from '../../components/GamePiece';

// Mock the GamePiece drawPiece function
jest.mock('../../components/GamePiece', () => ({
  drawPiece: jest.fn()
}));

import { drawPiece } from '../../components/GamePiece';
const mockDrawPiece = drawPiece as jest.MockedFunction<typeof drawPiece>;

// Mock canvas context
const createMockContext = () => ({
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: 'left' as CanvasTextAlign,
  lineDashOffset: 0,
  shadowColor: '',
  shadowBlur: 0,
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
  clearRect: jest.fn(),
  clip: jest.fn(),
  rect: jest.fn(),
  setLineDash: jest.fn(),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  }))
});

describe('GameAreaRenderer', () => {
  let renderer: GameAreaRenderer;
  let mockCtx: ReturnType<typeof createMockContext>;
  let config: GameAreaRenderConfig;

  beforeEach(() => {
    mockCtx = createMockContext();
    
    config = {
      gameAreaWidth: 700,
      gameAreaHeight: 600,
      bottomAreaHeight: 400,
      mirrorLine: 700,
      canvasWidth: 1400,
      canvasHeight: 1000,
      pieceSize: 100
    };

    renderer = new GameAreaRenderer(config);
    mockDrawPiece.mockClear();
  });

  describe('drawBackgroundAreas', () => {
    test('should draw all background areas', () => {
      renderer.drawBackgroundAreas(mockCtx as any);

      // Should create gradients for different areas
      expect(mockCtx.createRadialGradient).toHaveBeenCalled();
      expect(mockCtx.createLinearGradient).toHaveBeenCalled();
      
      // Should fill multiple rectangles for different areas
      expect(mockCtx.fillRect).toHaveBeenCalledTimes(4); // Game, mirror, piece storage, objective areas
    });

    test('should set correct gradient colors', () => {
      const mockGradient = {
        addColorStop: jest.fn()
      };
      mockCtx.createRadialGradient.mockReturnValue(mockGradient);
      mockCtx.createLinearGradient.mockReturnValue(mockGradient);

      renderer.drawBackgroundAreas(mockCtx as any);

      // Should set various gradient color stops
      expect(mockGradient.addColorStop).toHaveBeenCalledWith(0, '#ffffff');
      expect(mockGradient.addColorStop).toHaveBeenCalledWith(0.6, '#f8fafc');
      expect(mockGradient.addColorStop).toHaveBeenCalledWith(1, '#e2e8f0');
    });
  });

  describe('drawMirrorFrameAndDivisions', () => {
    test('should draw mirror line with dashed effect', () => {
      renderer.drawMirrorFrameAndDivisions(mockCtx as any);

      // Should set dashed line style
      expect(mockCtx.setLineDash).toHaveBeenCalledWith([15, 10]);
      expect(mockCtx.strokeStyle).toBe('#ef4444');
      expect(mockCtx.lineWidth).toBe(3);
      expect(mockCtx.shadowColor).toBe('#ef4444');
      expect(mockCtx.shadowBlur).toBe(8);

      // Should draw the mirror line
      expect(mockCtx.moveTo).toHaveBeenCalledWith(config.mirrorLine, 0);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(config.mirrorLine, config.gameAreaHeight);
      expect(mockCtx.stroke).toHaveBeenCalled();

      // Should reset line dash
      expect(mockCtx.setLineDash).toHaveBeenCalledWith([]);
      expect(mockCtx.shadowBlur).toBe(0);
    });

    test('should draw horizontal and vertical divisions', () => {
      renderer.drawMirrorFrameAndDivisions(mockCtx as any);

      // Should draw horizontal division
      expect(mockCtx.moveTo).toHaveBeenCalledWith(0, config.gameAreaHeight);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(config.canvasWidth, config.gameAreaHeight);

      // Should draw vertical division
      expect(mockCtx.moveTo).toHaveBeenCalledWith(config.mirrorLine, config.gameAreaHeight);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(config.mirrorLine, config.canvasHeight);
    });
  });

  describe('drawAreaLabels', () => {
    test('should draw area labels with text and emojis', () => {
      renderer.drawAreaLabels(mockCtx as any);

      // Should set font styles
      expect(mockCtx.font).toBe('bold 18px "Segoe UI", sans-serif');
      expect(mockCtx.textAlign).toBe('left');

      // Should draw main area labels
      expect(mockCtx.fillText).toHaveBeenCalledWith('🎮 ÁREA DE JUEGO', 15, 30);
      expect(mockCtx.fillText).toHaveBeenCalledWith('🪞 ESPEJO', config.mirrorLine + 15, 30);
      expect(mockCtx.fillText).toHaveBeenCalledWith('🧩 PIEZAS DISPONIBLES', 15, config.gameAreaHeight + 30);
      expect(mockCtx.fillText).toHaveBeenCalledWith('🎯 OBJETIVO', config.mirrorLine + 15, config.gameAreaHeight + 30);

      // Should draw descriptive subtitles
      expect(mockCtx.fillText).toHaveBeenCalledWith('Arrastra aquí tus piezas', 15, 50);
      expect(mockCtx.fillText).toHaveBeenCalledWith('Reflejo automático', config.mirrorLine + 15, 50);
    });
  });

  describe('drawDebugInfo', () => {
    test('should draw debug boundaries and labels', () => {
      renderer.drawDebugInfo(mockCtx as any);

      // Should draw debug rectangles
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(0, config.gameAreaHeight, config.gameAreaWidth, config.bottomAreaHeight);
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(0, config.gameAreaHeight, config.gameAreaWidth/2, config.bottomAreaHeight);
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(config.gameAreaWidth/2, config.gameAreaHeight, config.gameAreaWidth/2, config.bottomAreaHeight);

      // Should set different colors for different areas
      expect(mockCtx.strokeStyle).toBe('orange'); // Last color set

      // Should draw debug labels
      expect(mockCtx.fillText).toHaveBeenCalledWith('ÁREA PIEZAS: (0,600) a (700,1000)', 10, config.gameAreaHeight + 70);
      expect(mockCtx.fillText).toHaveBeenCalledWith('CUADRANTE PIEZAS: (0,600) a (350,1000)', 10, config.gameAreaHeight + 90);
      expect(mockCtx.fillText).toHaveBeenCalledWith('CUADRANTE OBJETIVO: (350,600) a (700,1000)', 10, config.gameAreaHeight + 110);
    });
  });

  describe('drawGamePieces', () => {
    const mockPieces: Piece[] = [
      {
        id: 1,
        type: 'A',
        face: 'front',
        centerColor: '#FFD700',
        triangleColor: '#FF4444',
        x: 100,
        y: 200,
        rotation: 0,
        placed: false
      },
      {
        id: 2,
        type: 'B',
        face: 'back',
        centerColor: '#FF4444',
        triangleColor: '#FFD700',
        x: 200,
        y: 300,
        rotation: 45,
        placed: true
      }
    ];

    test('should draw all pieces using drawPiece function', () => {
      renderer.drawGamePieces(mockCtx as any, mockPieces, null, false);

      expect(mockDrawPiece).toHaveBeenCalledTimes(2);
      expect(mockDrawPiece).toHaveBeenCalledWith(mockCtx, mockPieces[0], 100, 200, config.pieceSize);
      expect(mockDrawPiece).toHaveBeenCalledWith(mockCtx, mockPieces[1], 200, 300, config.pieceSize);
    });

    test('should draw debug info for unplaced pieces when debug mode is on', () => {
      renderer.drawGamePieces(mockCtx as any, mockPieces, null, true);

      // Should draw debug rectangle for unplaced piece (first piece is placed: false)
      expect(mockCtx.strokeRect).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalledWith('(100, 200)', 100, 195);
      expect(mockCtx.fillText).toHaveBeenCalledWith('R:0°', expect.any(Number), expect.any(Number));
    });

    test('should draw border for dragged piece', () => {
      const draggedPiece = mockPieces[0];
      
      renderer.drawGamePieces(mockCtx as any, mockPieces, draggedPiece, false);

      // Should save and restore context for border drawing
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();

      // Should set green border style
      expect(mockCtx.strokeStyle).toBe('#00ff00');
      expect(mockCtx.lineWidth).toBe(4);
      expect(mockCtx.shadowColor).toBe('#00ff00');
      expect(mockCtx.shadowBlur).toBe(8);
    });

    test('should handle empty pieces array gracefully', () => {
      renderer.drawGamePieces(mockCtx as any, [], null, false);

      expect(mockDrawPiece).not.toHaveBeenCalled();
    });

    test('should handle null pieces in array', () => {
      const piecesWithNull = [mockPieces[0], null, mockPieces[1]] as any[];
      
      renderer.drawGamePieces(mockCtx as any, piecesWithNull, null, false);

      // Should only draw valid pieces
      expect(mockDrawPiece).toHaveBeenCalledTimes(2);
    });
  });

  describe('drawMirrorReflections', () => {
    const mockPieces: Piece[] = [
      {
        id: 1,
        type: 'A',
        face: 'front',
        centerColor: '#FFD700',
        triangleColor: '#FF4444',
        x: 100,
        y: 200, // In game area
        rotation: 0,
        placed: true
      },
      {
        id: 2,
        type: 'B',
        face: 'back',
        centerColor: '#FF4444',
        triangleColor: '#FFD700',
        x: 200,
        y: 800, // Outside game area
        rotation: 45,
        placed: false
      }
    ];

    test('should clip to mirror area', () => {
      renderer.drawMirrorReflections(mockCtx as any, mockPieces);

      expect(mockCtx.rect).toHaveBeenCalledWith(config.mirrorLine, 0, config.gameAreaWidth, config.gameAreaHeight);
      expect(mockCtx.clip).toHaveBeenCalled();
    });

    test('should draw reflections for pieces in game area', () => {
      renderer.drawMirrorReflections(mockCtx as any, mockPieces);

      // Should save/restore context for transformations
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();

      // Should apply reflection transformation
      expect(mockCtx.translate).toHaveBeenCalled();
      expect(mockCtx.scale).toHaveBeenCalledWith(-1, 1);
    });

    test('should add distortion gradient effect', () => {
      renderer.drawMirrorReflections(mockCtx as any, mockPieces);

      expect(mockCtx.createLinearGradient).toHaveBeenCalledWith(
        config.mirrorLine, 
        0, 
        config.mirrorLine + config.gameAreaWidth, 
        0
      );
      expect(mockCtx.fillRect).toHaveBeenCalledWith(config.mirrorLine, 0, config.gameAreaWidth, config.gameAreaHeight);
    });

    test('should handle empty pieces array', () => {
      renderer.drawMirrorReflections(mockCtx as any, []);

      // Should still set up clipping and effects
      expect(mockCtx.clip).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });
  });
});