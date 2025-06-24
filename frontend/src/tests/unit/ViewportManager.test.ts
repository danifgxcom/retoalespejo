import { ViewportManager, ViewportConfig, WorldConfig } from './rendering/ViewportManager';
import { PiecePosition } from './geometry/GameGeometry';

describe('ViewportManager', () => {
  let viewportManager: ViewportManager;
  let worldConfig: WorldConfig;

  beforeEach(() => {
    worldConfig = {
      gameAreaWidth: 700,
      gameAreaHeight: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    viewportManager = new ViewportManager(worldConfig);
  });

  describe('calculateTransform', () => {
    it('should calculate correct scale to fit world area in viewport', () => {
      const worldArea = { x: 0, y: 0, width: 700, height: 600 };
      const viewport: ViewportConfig = {
        width: 350,
        height: 300,
        margin: 25,
        offsetX: 0,
        offsetY: 0
      };

      const transform = viewportManager.calculateTransform(worldArea, viewport);

      // Área disponible: 350-50=300, 300-50=250
      // Escalas: 300/700=0.428, 250/600=0.416666...
      // Debe usar la menor: 0.416666...
      expect(transform.scale).toBeCloseTo(0.4166666666666667, 10);
    });

    it('should respect maximum scale limit', () => {
      const worldArea = { x: 0, y: 0, width: 100, height: 100 };
      const viewport: ViewportConfig = {
        width: 1000,
        height: 1000,
        margin: 0,
        offsetX: 0,
        offsetY: 0
      };

      const transform = viewportManager.calculateTransform(worldArea, viewport, 0.5);

      expect(transform.scale).toBe(0.5);
    });

    it('should center content in viewport', () => {
      const worldArea = { x: 0, y: 0, width: 100, height: 100 };
      const viewport: ViewportConfig = {
        width: 400,
        height: 400,
        margin: 50,
        offsetX: 100,
        offsetY: 200
      };

      const transform = viewportManager.calculateTransform(worldArea, viewport);

      // Área disponible: 300x300, escala: 3.0
      // Mundo escalado: 300x300, ya llena el área disponible
      // Offset: 100+50+(300-300)/2 = 150, 200+50+(300-300)/2 = 250
      expect(transform.offsetX).toBe(150);
      expect(transform.offsetY).toBe(250);
    });
  });

  describe('coordinate transformations', () => {
    it('should correctly transform world coordinates to viewport', () => {
      const worldArea = { x: 0, y: 0, width: 700, height: 600 };
      const transform = {
        scale: 0.5,
        offsetX: 100,
        offsetY: 50,
        scaledWorldWidth: 350,
        scaledWorldHeight: 300
      };

      const result = viewportManager.worldToViewport(330, 300, worldArea, transform);

      // (330-0)*0.5+100 = 265, (300-0)*0.5+50 = 200
      expect(result.x).toBe(265);
      expect(result.y).toBe(200);
    });

    it('should correctly transform viewport coordinates back to world', () => {
      const worldArea = { x: 0, y: 0, width: 700, height: 600 };
      const transform = {
        scale: 0.5,
        offsetX: 100,
        offsetY: 50,
        scaledWorldWidth: 350,
        scaledWorldHeight: 300
      };

      const result = viewportManager.viewportToWorld(265, 200, worldArea, transform);

      expect(result.x).toBe(330);
      expect(result.y).toBe(300);
    });

    it('should be reversible (world->viewport->world)', () => {
      const worldArea = { x: 0, y: 0, width: 700, height: 600 };
      const viewport: ViewportConfig = {
        width: 400,
        height: 350,
        margin: 25,
        offsetX: 50,
        offsetY: 75
      };

      const transform = viewportManager.calculateTransform(worldArea, viewport);
      
      const originalX = 330;
      const originalY = 300;

      const viewportCoords = viewportManager.worldToViewport(originalX, originalY, worldArea, transform);
      const backToWorld = viewportManager.viewportToWorld(viewportCoords.x, viewportCoords.y, worldArea, transform);

      expect(backToWorld.x).toBeCloseTo(originalX, 10);
      expect(backToWorld.y).toBeCloseTo(originalY, 10);
    });
  });

  describe('render areas', () => {
    it('should create correct full game render area', () => {
      const viewport: ViewportConfig = {
        width: 1400,
        height: 600,
        margin: 0,
        offsetX: 0,
        offsetY: 0
      };

      const renderArea = viewportManager.createFullGameRenderArea(viewport);

      expect(renderArea.world.width).toBe(1400); // gameAreaWidth + mirrorAreaWidth
      expect(renderArea.world.height).toBe(600);
      expect(renderArea.transform.scale).toBe(1); // Perfect fit
    });

    it('should create correct game area only render area', () => {
      const viewport: ViewportConfig = {
        width: 700,
        height: 600,
        margin: 0,
        offsetX: 0,
        offsetY: 0
      };

      const renderArea = viewportManager.createGameAreaRenderArea(viewport);

      expect(renderArea.world.width).toBe(700); // Only game area
      expect(renderArea.world.height).toBe(600);
      expect(renderArea.transform.scale).toBe(1); // Perfect fit
    });

    it('should create correct challenge card render area', () => {
      const viewport: ViewportConfig = {
        width: 280,
        height: 120,
        margin: 10,
        offsetX: 720,
        offsetY: 650
      };

      const renderArea = viewportManager.createChallengeCardRenderArea(viewport, 0.8);

      expect(renderArea.world.width).toBe(1400); // Full area including mirror
      expect(renderArea.world.height).toBe(600);
      expect(renderArea.viewport.left).toBe(720);
      expect(renderArea.viewport.top).toBe(650);
      
      // Should respect max scale
      expect(renderArea.transform.scale).toBeLessThanOrEqual(0.8);
    });
  });

  describe('piece transformations', () => {
    it('should correctly transform piece coordinates', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 330,
        y: 300,
        rotation: 0
      };

      const viewport: ViewportConfig = {
        width: 700,
        height: 600,
        margin: 0,
        offsetX: 0,
        offsetY: 0
      };

      const renderArea = viewportManager.createGameAreaRenderArea(viewport);
      const transformedPiece = viewportManager.transformPiece(piece, renderArea);

      expect(transformedPiece.x).toBe(330); // Same coordinates at scale 1
      expect(transformedPiece.y).toBe(300);
      expect(transformedPiece.scaledSize).toBe(100); // Same size at scale 1
      expect(transformedPiece.type).toBe('A');
      expect(transformedPiece.rotation).toBe(0);
    });

    it('should correctly calculate reflected piece position', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 330, // Piece touching mirror at x=700
        y: 300,
        rotation: 0
      };

      const viewport: ViewportConfig = {
        width: 1400,
        height: 600,
        margin: 0,
        offsetX: 0,
        offsetY: 0
      };

      const renderArea = viewportManager.createFullGameRenderArea(viewport);
      const reflectedPiece = viewportManager.getReflectedPiecePosition(piece, renderArea);

      // Reflected position: 2*700 - 330 - 100 = 970
      expect(reflectedPiece.x).toBe(970);
      expect(reflectedPiece.y).toBe(300);
      expect(reflectedPiece.type).toBe('A');
    });
  });

  describe('mirror line position', () => {
    it('should correctly calculate mirror line position in viewport', () => {
      const viewport: ViewportConfig = {
        width: 1400,
        height: 600,
        margin: 0,
        offsetX: 0,
        offsetY: 0
      };

      const renderArea = viewportManager.createFullGameRenderArea(viewport);
      const mirrorLineX = viewportManager.getMirrorLinePosition(renderArea);

      expect(mirrorLineX).toBe(700); // At scale 1, mirror line stays at x=700
    });

    it('should correctly calculate scaled mirror line position', () => {
      const viewport: ViewportConfig = {
        width: 700, // Half size viewport
        height: 300,
        margin: 0,
        offsetX: 0,
        offsetY: 0
      };

      const renderArea = viewportManager.createFullGameRenderArea(viewport);
      const mirrorLineX = viewportManager.getMirrorLinePosition(renderArea);

      // At scale 0.5, mirror line should be at 350
      expect(mirrorLineX).toBeCloseTo(350, 1);
    });
  });

  describe('validation', () => {
    it('should validate correct viewport configuration', () => {
      const viewport: ViewportConfig = {
        width: 400,
        height: 300,
        margin: 20,
        offsetX: 0,
        offsetY: 0
      };

      const validation = viewportManager.validateViewportConfig(viewport);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid viewport configurations', () => {
      const viewport: ViewportConfig = {
        width: 100,
        height: 100,
        margin: 60, // Margin too large
        offsetX: 0,
        offsetY: 0
      };

      const validation = viewportManager.validateViewportConfig(viewport);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(e => e.includes('Margin too large'))).toBe(true);
    });
  });

  describe('debug information', () => {
    it('should provide useful debug information', () => {
      const viewport: ViewportConfig = {
        width: 400,
        height: 300,
        margin: 50,
        offsetX: 0,
        offsetY: 0
      };

      const renderArea = viewportManager.createGameAreaRenderArea(viewport);
      const debugInfo = viewportManager.getTransformDebugInfo(renderArea);

      expect(debugInfo.scale).toBeGreaterThan(0);
      expect(debugInfo.worldArea).toBe('700x600');
      expect(debugInfo.viewportArea).toBe('400x300');
      expect(debugInfo.efficiency).toBeGreaterThan(0);
      expect(debugInfo.efficiency).toBeLessThanOrEqual(100);
    });
  });

  describe('challenge card specific scenarios', () => {
    it('should handle challenge card rendering with proper proportions', () => {
      // Simular las dimensiones reales de una challenge card
      const viewport: ViewportConfig = {
        width: 620, // GAME_AREA_WIDTH - 80
        height: 260, // BOTTOM_AREA_HEIGHT - 140
        margin: 0,
        offsetX: 740, // MIRROR_LINE + 40
        offsetY: 670  // GAME_AREA_HEIGHT + 70
      };

      const renderArea = viewportManager.createChallengeCardRenderArea(viewport, 0.8);

      // Verificar que se mantienen las proporciones
      expect(renderArea.world.width).toBe(1400);
      expect(renderArea.world.height).toBe(600);
      expect(renderArea.transform.scale).toBeLessThanOrEqual(0.8);

      // Una pieza que toca el espejo en el mundo real
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 330, // Toca el espejo en x=700
        y: 300,
        rotation: 0
      };

      const transformedPiece = viewportManager.transformPiece(piece, renderArea);
      const mirrorLineX = viewportManager.getMirrorLinePosition(renderArea);
      const reflectedPiece = viewportManager.getReflectedPiecePosition(piece, renderArea);

      // Verificar que la pieza transformada está del lado correcto del espejo
      // El borde derecho de la pieza debería estar cerca del espejo (permitir hasta 50px de diferencia por escalado)
      expect(transformedPiece.x + transformedPiece.scaledSize).toBeLessThanOrEqual(mirrorLineX + 50);
      expect(transformedPiece.x + transformedPiece.scaledSize).toBeGreaterThan(mirrorLineX - 150); // No demasiado lejos
      
      // Verificar que el reflejo está del lado opuesto
      expect(reflectedPiece.x).toBeGreaterThan(mirrorLineX);
    });
  });
});