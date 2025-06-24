import { CANVAS_CONSTANTS } from '../canvas/CanvasConstants';

/**
 * Utility functions for handling piece colors consistently across the application
 */

export interface PieceColorInfo {
  centerColor: string;
  triangleColor: string;
}

export class PieceColors {
  /**
   * Gets the colors for a piece based on its face
   */
  static getColorsForFace(face: 'front' | 'back'): PieceColorInfo {
    const { COLORS } = CANVAS_CONSTANTS;
    
    return {
      centerColor: face === 'front' ? COLORS.FRONT_CENTER : COLORS.BACK_CENTER,
      triangleColor: face === 'front' ? COLORS.FRONT_TRIANGLE : COLORS.BACK_TRIANGLE
    };
  }

  /**
   * Gets the opposite face
   */
  static getOppositeFace(face: 'front' | 'back'): 'front' | 'back' {
    return face === 'front' ? 'back' : 'front';
  }

  /**
   * Creates a piece color object from face information
   */
  static createPieceColors(face: 'front' | 'back'): PieceColorInfo {
    return this.getColorsForFace(face);
  }

  /**
   * Validates if colors match the expected face
   */
  static validatePieceColors(centerColor: string, triangleColor: string, expectedFace: 'front' | 'back'): boolean {
    const expectedColors = this.getColorsForFace(expectedFace);
    return expectedColors.centerColor === centerColor && expectedColors.triangleColor === triangleColor;
  }
}