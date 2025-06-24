/**
 * Sistema de coordenadas responsivas para el canvas del juego
 * Convierte entre coordenadas relativas (0-1) y píxeles absolutos
 */

export interface RelativeCoordinate {
  x: number; // 0-1 (porcentaje del ancho del canvas)
  y: number; // 0-1 (porcentaje del alto del canvas)
}

export interface AbsoluteCoordinate {
  x: number; // Píxeles absolutos
  y: number; // Píxeles absolutos
}

export interface CanvasDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export class ResponsiveCanvas {
  private baseWidth = 1400;  // Ancho de referencia del diseño original
  private baseHeight = 1000; // Alto de referencia del diseño original
  
  constructor(
    private currentWidth: number,
    private currentHeight: number
  ) {}

  /**
   * Actualiza las dimensiones actuales del canvas
   */
  updateDimensions(width: number, height: number) {
    this.currentWidth = width;
    this.currentHeight = height;
  }

  /**
   * Convierte coordenadas absolutas (píxeles) a relativas (0-1)
   */
  absoluteToRelative(absolute: AbsoluteCoordinate): RelativeCoordinate {
    return {
      x: absolute.x / this.baseWidth,
      y: absolute.y / this.baseHeight
    };
  }

  /**
   * Convierte coordenadas relativas (0-1) a absolutas de las dimensiones base
   * Las coordenadas relativas están basadas en el canvas original 1400x1000
   */
  relativeToAbsolute(relative: RelativeCoordinate): AbsoluteCoordinate {
    return {
      x: relative.x * this.baseWidth,
      y: relative.y * this.baseHeight
    };
  }

  /**
   * Convierte un tamaño base a tamaño escalado actual
   */
  scaleSize(baseSize: number): number {
    const scaleX = this.currentWidth / this.baseWidth;
    const scaleY = this.currentHeight / this.baseHeight;
    // Usar la escala menor para mantener proporciones
    const scale = Math.min(scaleX, scaleY);
    return baseSize * scale;
  }

  /**
   * Obtiene el factor de escala actual
   */
  getScaleFactor(): number {
    const scaleX = this.currentWidth / this.baseWidth;
    const scaleY = this.currentHeight / this.baseHeight;
    return Math.min(scaleX, scaleY);
  }

  /**
   * Obtiene las dimensiones del canvas con información de escala
   */
  getDimensions(): CanvasDimensions {
    return {
      width: this.currentWidth,
      height: this.currentHeight,
      aspectRatio: this.currentWidth / this.currentHeight
    };
  }

  /**
   * Define las áreas del juego en coordenadas relativas
   */
  getGameAreas() {
    return {
      // Área de juego (superior izquierda)
      gameArea: {
        x: 0,
        y: 0,
        width: 0.5,  // 50% del ancho
        height: 0.6  // 60% del alto
      },
      // Área del espejo (superior derecha)
      mirrorArea: {
        x: 0.5,
        y: 0,
        width: 0.5,
        height: 0.6
      },
      // Área de piezas disponibles (inferior izquierda)
      piecesArea: {
        x: 0,
        y: 0.6,
        width: 0.5,
        height: 0.4
      },
      // Área de objetivo (inferior derecha)
      objectiveArea: {
        x: 0.5,
        y: 0.6,
        width: 0.5,
        height: 0.4
      },
      // Línea del espejo
      mirrorLine: {
        x: 0.5, // 50% del ancho
        y: 0,
        height: 0.6 // Solo en el área de juego
      }
    };
  }
}