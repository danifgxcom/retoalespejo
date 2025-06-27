
/**
 * Utility functions for handling piece colors consistently across the application
 */

export interface PieceColorInfo {
  centerColor: string;
  triangleColor: string;
}

export class PieceColors {
  // Rainbow color palette for piece identification (purple to red)
  private static rainbowColors = [
    '#8B5CF6', // Purple (piece 1)
    '#3B82F6', // Blue (piece 2)
    '#06B6D4', // Cyan (piece 3)
    '#10B981', // Green (piece 4)
    '#84CC16', // Lime (piece 5)
    '#EAB308', // Yellow (piece 6)
    '#F97316', // Orange (piece 7)
    '#EF4444', // Red (piece 8)
  ];

  // WCAG AA compliant color palette with minimum 4.5:1 contrast ratio
  private static accessibleRainbowColors = [
    '#6B21A8', // WCAG compliant purple (piece 1)
    '#1565c0', // WCAG compliant blue (piece 2) 
    '#0891B2', // WCAG compliant cyan (piece 3)
    '#059669', // WCAG compliant green (piece 4)
    '#65A30D', // WCAG compliant lime (piece 5)
    '#f57f17', // WCAG compliant yellow (piece 6)
    '#EA580C', // WCAG compliant orange (piece 7)
    '#c62828', // WCAG compliant red (piece 8)
  ];

  // Predefined color pairs for different pieces (using rainbow colors)
  private static colorPairs = [
    { centerColor: '#8B5CF6', triangleColor: '#DC2626' }, // Purple center, Red triangles
    { centerColor: '#3B82F6', triangleColor: '#F97316' }, // Blue center, Orange triangles
    { centerColor: '#06B6D4', triangleColor: '#EAB308' }, // Cyan center, Yellow triangles
    { centerColor: '#10B981', triangleColor: '#84CC16' }, // Green center, Lime triangles
    { centerColor: '#84CC16', triangleColor: '#10B981' }, // Lime center, Green triangles
    { centerColor: '#EAB308', triangleColor: '#06B6D4' }, // Yellow center, Cyan triangles
    { centerColor: '#F97316', triangleColor: '#3B82F6' }, // Orange center, Blue triangles
    { centerColor: '#EF4444', triangleColor: '#8B5CF6' }, // Red center, Purple triangles
  ];

  // WCAG AA compliant color pairs with minimum 4.5:1 contrast ratio
  private static accessibleColorPairs = [
    { centerColor: '#6B21A8', triangleColor: '#c62828' }, // WCAG purple center, WCAG red triangles
    { centerColor: '#1565c0', triangleColor: '#EA580C' }, // WCAG blue center, WCAG orange triangles
    { centerColor: '#0891B2', triangleColor: '#f57f17' }, // WCAG cyan center, WCAG yellow triangles
    { centerColor: '#059669', triangleColor: '#65A30D' }, // WCAG green center, WCAG lime triangles
    { centerColor: '#65A30D', triangleColor: '#059669' }, // WCAG lime center, WCAG green triangles
    { centerColor: '#f57f17', triangleColor: '#0891B2' }, // WCAG yellow center, WCAG cyan triangles
    { centerColor: '#EA580C', triangleColor: '#1565c0' }, // WCAG orange center, WCAG blue triangles
    { centerColor: '#c62828', triangleColor: '#6B21A8' }, // WCAG red center, WCAG purple triangles
  ];

  /**
   * Gets the identification color for a specific piece (for borders and labels)
   */
  static getIdentificationColor(pieceId: number): string {
    const savedTheme = localStorage.getItem('theme') as 'accessible' | 'colorful' || 'colorful';
    const isAccessibleTheme = savedTheme === 'accessible';

    // Use modulo to cycle through the colors if there are more pieces than colors
    const colorIndex = (pieceId - 1) % (isAccessibleTheme ? 
      this.accessibleRainbowColors.length : this.rainbowColors.length);

    return isAccessibleTheme ? 
      this.accessibleRainbowColors[colorIndex] : 
      this.rainbowColors[colorIndex];
  }

  /**
   * Gets colors for a specific piece based on its ID
   */
  static getColorsForPieceId(pieceId: number): PieceColorInfo {
    const savedTheme = localStorage.getItem('theme') as 'accessible' | 'colorful' || 'colorful';
    const isAccessibleTheme = savedTheme === 'accessible';

    // Use modulo to cycle through the color pairs if there are more pieces than colors
    const colorIndex = (pieceId - 1) % (isAccessibleTheme ? 
      this.accessibleColorPairs.length : this.colorPairs.length);

    return isAccessibleTheme ? 
      this.accessibleColorPairs[colorIndex] : 
      this.colorPairs[colorIndex];
  }

  /**
   * Gets the colors for a piece based on its face - Cross-browser compatible
   * @deprecated Use getColorsForPieceId instead for unique colors per piece
   */
  static getColorsForFace(face: 'front' | 'back'): PieceColorInfo {
    // Try to get theme from localStorage for consistent detection
    const savedTheme = localStorage.getItem('theme') as 'accessible' | 'colorful' || 'colorful';
    const isAccessibleTheme = savedTheme === 'accessible';

    if (isAccessibleTheme) {
      // WCAG AA compliant colors with high contrast and distinctive symbols
      return {
        centerColor: face === 'front' ? '#1565C0' : '#B71C1C', // Blue squares vs red squares  
        triangleColor: face === 'front' ? '#B71C1C' : '#1565C0' // Red triangles vs blue triangles
      };
    } else {
      // Standard colors for colorful theme (ORIGINAL COLORS PRESERVED)
      return {
        centerColor: face === 'front' ? '#FFD700' : '#FF4444', // Original gold vs red
        triangleColor: face === 'front' ? '#FF4444' : '#FFD700' // Original red vs gold
      };
    }
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
