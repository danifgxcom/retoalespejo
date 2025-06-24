/**
 * Shared constants for canvas operations across the application
 */

export const CANVAS_CONSTANTS = {
  // Canvas dimensions - adjusted for better layout (game area up, larger storage down)
  GAME_AREA_WIDTH: 700,
  GAME_AREA_HEIGHT: 500,
  BOTTOM_AREA_HEIGHT: 500,
  MIRROR_LINE: 700,
  CANVAS_WIDTH: 1400,
  CANVAS_HEIGHT: 1000,
  
  // Piece dimensions
  PIECE_SIZE: 100,
  PIECE_DRAWING_SIZE: 80,
  
  // Colors
  COLORS: {
    FRONT_CENTER: '#FFD700',
    FRONT_TRIANGLE: '#FF4444',
    BACK_CENTER: '#FF4444',
    BACK_TRIANGLE: '#FFD700',
    
    // Mirror line
    MIRROR_LINE_COLOR: '#ef4444',
    MIRROR_LINE_WIDTH: 3,
    MIRROR_LINE_DASH: [15, 10],
    
    // Borders
    BORDER_COLOR: '#cbd5e1',
    BORDER_WIDTH: 2,
    
    // Frame
    FRAME_BORDER: '#8b5a3c',
    FRAME_ACCENT: '#d4af37'
  }
} as const;