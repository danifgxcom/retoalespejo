import { PiecePosition } from './geometry/GameGeometry';

/**
 * Configuración de un viewport (área de visualización)
 */
export interface ViewportConfig {
  /** Ancho del viewport en píxeles */
  width: number;
  /** Alto del viewport en píxeles */
  height: number;
  /** Margen interno */
  margin: number;
  /** Posición X del viewport en el canvas */
  offsetX: number;
  /** Posición Y del viewport en el canvas */
  offsetY: number;
}

/**
 * Configuración del mundo de juego
 */
export interface WorldConfig {
  /** Ancho del área de juego en unidades lógicas */
  gameAreaWidth: number;
  /** Alto del área de juego en unidades lógicas */
  gameAreaHeight: number;
  /** Posición X de la línea del espejo */
  mirrorLineX: number;
  /** Tamaño de pieza en unidades lógicas */
  pieceSize: number;
}

/**
 * Transformación de coordenadas entre mundo y viewport
 */
export interface CoordinateTransform {
  /** Factor de escala aplicado */
  scale: number;
  /** Offset X en el viewport */
  offsetX: number;
  /** Offset Y en el viewport */
  offsetY: number;
  /** Ancho del mundo escalado */
  scaledWorldWidth: number;
  /** Alto del mundo escalado */
  scaledWorldHeight: number;
}

/**
 * Área renderizable con sus límites
 */
export interface RenderArea {
  /** Coordenadas del área en el viewport */
  viewport: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  /** Coordenadas del mundo que se mapean a esta área */
  world: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  /** Transformación aplicada */
  transform: CoordinateTransform;
}

/**
 * Gestor de coordenadas y transformaciones entre mundo lógico y viewports
 */
export class ViewportManager {
  private worldConfig: WorldConfig;

  constructor(worldConfig: WorldConfig) {
    this.worldConfig = worldConfig;
  }

  /**
   * Calcula la transformación óptima para mostrar un área del mundo en un viewport
   */
  calculateTransform(
    worldArea: { x: number; y: number; width: number; height: number },
    viewport: ViewportConfig,
    maxScale?: number
  ): CoordinateTransform {
    // Área disponible para rendering (descontando márgenes)
    const availableWidth = viewport.width - (viewport.margin * 2);
    const availableHeight = viewport.height - (viewport.margin * 2);

    // Calcular escalas para ajustar el área del mundo al viewport
    const scaleX = availableWidth / worldArea.width;
    const scaleY = availableHeight / worldArea.height;
    
    // Usar la escala menor para mantener proporciones
    let scale = Math.min(scaleX, scaleY);
    
    // Aplicar límite máximo de escala si se especifica
    if (maxScale !== undefined) {
      scale = Math.min(scale, maxScale);
    }

    // Calcular dimensiones del mundo escalado
    const scaledWorldWidth = worldArea.width * scale;
    const scaledWorldHeight = worldArea.height * scale;

    // Centrar el mundo escalado en el viewport
    const offsetX = viewport.offsetX + viewport.margin + (availableWidth - scaledWorldWidth) / 2;
    const offsetY = viewport.offsetY + viewport.margin + (availableHeight - scaledWorldHeight) / 2;

    return {
      scale,
      offsetX,
      offsetY,
      scaledWorldWidth,
      scaledWorldHeight
    };
  }

  /**
   * Transforma coordenadas del mundo a coordenadas del viewport
   */
  worldToViewport(
    worldX: number,
    worldY: number,
    worldArea: { x: number; y: number; width: number; height: number },
    transform: CoordinateTransform
  ): { x: number; y: number } {
    // Normalizar coordenadas relativas al área del mundo
    const relativeX = worldX - worldArea.x;
    const relativeY = worldY - worldArea.y;

    // Aplicar escala y offset
    return {
      x: transform.offsetX + (relativeX * transform.scale),
      y: transform.offsetY + (relativeY * transform.scale)
    };
  }

  /**
   * Transforma coordenadas del viewport a coordenadas del mundo
   */
  viewportToWorld(
    viewportX: number,
    viewportY: number,
    worldArea: { x: number; y: number; width: number; height: number },
    transform: CoordinateTransform
  ): { x: number; y: number } {
    // Revertir escala y offset
    const relativeX = (viewportX - transform.offsetX) / transform.scale;
    const relativeY = (viewportY - transform.offsetY) / transform.scale;

    // Agregar offset del área del mundo
    return {
      x: worldArea.x + relativeX,
      y: worldArea.y + relativeY
    };
  }

  /**
   * Crea un área de renderizado para mostrar todo el juego (área de juego + espejo)
   */
  createFullGameRenderArea(viewport: ViewportConfig, maxScale?: number): RenderArea {
    const worldArea = {
      x: 0,
      y: 0,
      width: this.worldConfig.mirrorLineX * 2, // Área de juego + espejo
      height: this.worldConfig.gameAreaHeight
    };

    const transform = this.calculateTransform(worldArea, viewport, maxScale);

    return {
      viewport: {
        left: viewport.offsetX,
        top: viewport.offsetY,
        width: viewport.width,
        height: viewport.height
      },
      world: worldArea,
      transform
    };
  }

  /**
   * Crea un área de renderizado solo para el área de juego (sin espejo)
   */
  createGameAreaRenderArea(viewport: ViewportConfig, maxScale?: number): RenderArea {
    const worldArea = {
      x: 0,
      y: 0,
      width: this.worldConfig.gameAreaWidth,
      height: this.worldConfig.gameAreaHeight
    };

    const transform = this.calculateTransform(worldArea, viewport, maxScale);

    return {
      viewport: {
        left: viewport.offsetX,
        top: viewport.offsetY,
        width: viewport.width,
        height: viewport.height
      },
      world: worldArea,
      transform
    };
  }

  /**
   * Crea un área de renderizado para una challenge card con área de juego + espejo
   */
  createChallengeCardRenderArea(viewport: ViewportConfig, maxScale?: number): RenderArea {
    // Para challenge cards, mostramos área de juego (0-700) + espejo (700-1400)
    const worldArea = {
      x: 0,
      y: 0,
      width: this.worldConfig.mirrorLineX * 2, // 0-1400
      height: this.worldConfig.gameAreaHeight  // 0-600
    };

    const transform = this.calculateTransform(worldArea, viewport, maxScale);

    return {
      viewport: {
        left: viewport.offsetX,
        top: viewport.offsetY,
        width: viewport.width,
        height: viewport.height
      },
      world: worldArea,
      transform
    };
  }

  /**
   * Transforma una pieza del mundo al viewport
   */
  transformPiece(
    piece: PiecePosition,
    renderArea: RenderArea
  ): PiecePosition & { scaledSize: number } {
    const viewportPos = this.worldToViewport(
      piece.x,
      piece.y,
      renderArea.world,
      renderArea.transform
    );

    return {
      ...piece,
      x: viewportPos.x,
      y: viewportPos.y,
      scaledSize: this.worldConfig.pieceSize * renderArea.transform.scale
    };
  }

  /**
   * Calcula la posición de la línea del espejo en el viewport
   */
  getMirrorLinePosition(renderArea: RenderArea): number {
    const mirrorPos = this.worldToViewport(
      this.worldConfig.mirrorLineX,
      0,
      renderArea.world,
      renderArea.transform
    );
    return mirrorPos.x;
  }

  /**
   * Calcula la posición reflejada de una pieza
   */
  getReflectedPiecePosition(
    piece: PiecePosition,
    renderArea: RenderArea
  ): PiecePosition & { scaledSize: number } {
    // Calcular reflejo en coordenadas del mundo
    const reflectedWorldX = 2 * this.worldConfig.mirrorLineX - piece.x - this.worldConfig.pieceSize;
    
    const reflectedPiece = {
      ...piece,
      x: reflectedWorldX
    };

    return this.transformPiece(reflectedPiece, renderArea);
  }

  /**
   * Valida que una configuración de viewport sea válida
   */
  validateViewportConfig(viewport: ViewportConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (viewport.width <= 0) errors.push('Width must be positive');
    if (viewport.height <= 0) errors.push('Height must be positive');
    if (viewport.margin < 0) errors.push('Margin cannot be negative');
    if (viewport.margin * 2 >= viewport.width) errors.push('Margin too large for width');
    if (viewport.margin * 2 >= viewport.height) errors.push('Margin too large for height');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtiene información de debug sobre una transformación
   */
  getTransformDebugInfo(renderArea: RenderArea): {
    scale: number;
    worldArea: string;
    viewportArea: string;
    efficiency: number; // % del viewport utilizado
  } {
    const efficiency = (renderArea.transform.scaledWorldWidth * renderArea.transform.scaledWorldHeight) / 
                      (renderArea.viewport.width * renderArea.viewport.height) * 100;

    return {
      scale: renderArea.transform.scale,
      worldArea: `${renderArea.world.width}x${renderArea.world.height}`,
      viewportArea: `${renderArea.viewport.width}x${renderArea.viewport.height}`,
      efficiency: Math.round(efficiency * 100) / 100
    };
  }
}