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