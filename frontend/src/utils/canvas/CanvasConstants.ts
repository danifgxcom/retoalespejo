/**
 * Shared constants for canvas operations across the application
 */

export const CANVAS_CONSTANTS = {
  // El lienzo mide 1400x1000 y NO se toca: toda la maquetación responsive se
  // apoya en esa relación 1.4:1. Lo que se reparte es la altura entre las dos
  // zonas.
  //
  // El área de juego necesita 552 px de alto: es lo que mide la figura del
  // reto 16, la más alta de las 16, y con 500 no cabía. El almacén necesita
  // 374 px: ocho piezas en cuatro columnas y dos filas (celda de 181 px de
  // alto más 12 de separación), que es el peor caso; los demás retos se
  // resuelven en una sola fila de 181. De ahí 600/400, que deja holgura a
  // ambos lados sin cambiar el tamaño del lienzo.
  GAME_AREA_WIDTH: 700,
  GAME_AREA_HEIGHT: 600,
  BOTTOM_AREA_HEIGHT: 400,
  MIRROR_LINE: 700,
  CANVAS_WIDTH: 1400,
  CANVAS_HEIGHT: 1000,
  
  // Piece dimensions
  PIECE_SIZE: 100,
  PIECE_DRAWING_SIZE: 80,
  
  // Colors - will be overridden by CSS theme variables
  COLORS: {
    // Piece colors - using CSS variables for theme support
    FRONT_CENTER: 'var(--canvas-piece-front-center, #FFD700)',
    FRONT_TRIANGLE: 'var(--canvas-piece-front-triangle, #FF4444)',
    BACK_CENTER: 'var(--canvas-piece-back-center, #FF4444)',
    BACK_TRIANGLE: 'var(--canvas-piece-back-triangle, #FFD700)',
    
    // Mirror line
    MIRROR_LINE_COLOR: 'var(--color-danger-500, #ef4444)',
    MIRROR_LINE_WIDTH: 3,
    MIRROR_LINE_DASH: [15, 10],
    
    // Borders
    BORDER_COLOR: 'var(--border-light, #cbd5e1)',
    BORDER_WIDTH: 2,
    
    // Canvas background
    CANVAS_BG: 'var(--canvas-bg-light, #f9fafb)',
    
    // Text colors
    TEXT_PRIMARY: 'var(--text-primary, #1e293b)',
    TEXT_SECONDARY: 'var(--text-secondary, #64748b)',
    
    // Frame
    FRAME_BORDER: 'var(--color-warning-700, #8b5a3c)',
    FRAME_ACCENT: 'var(--color-warning-500, #d4af37)'
  }
} as const;