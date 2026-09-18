// Versión simplificada del snap para testing
export class SimpleSnap {
  static snapToGrid<T extends { x: number; y: number }>(piece: T, gridSize: number = 25): T {
    const snappedX = Math.round(piece.x / gridSize) * gridSize;
    const snappedY = Math.round(piece.y / gridSize) * gridSize;
    
    return {
      ...piece,
      x: snappedX,
      y: snappedY
    };
  }
}
