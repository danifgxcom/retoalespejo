/**
 * Simple test to verify grid system basics
 */

describe('Simple Grid Test', () => {
  test('basic math operations work', () => {
    expect(2 + 2).toBe(4);
    expect(Math.round(23 / 10) * 10).toBe(20);
  });

  test('grid snapping calculation', () => {
    const GRID_SIZE = 10;
    
    const snapToGrid = (x: number, y: number) => ({
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE
    });
    
    // Test basic snapping
    expect(snapToGrid(23, 47)).toEqual({ x: 20, y: 50 });
    expect(snapToGrid(67, 83)).toEqual({ x: 70, y: 80 });
    expect(snapToGrid(95, 96)).toEqual({ x: 100, y: 100 });
  });
});