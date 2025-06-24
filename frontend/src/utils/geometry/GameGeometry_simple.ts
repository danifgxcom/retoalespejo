// Versión simplificada del snap para testing
export class SimpleSnap {
  static snapToGrid(piece: any, gridSize: number = 25): any {
    const snappedX = Math.round(piece.x / gridSize) * gridSize;
    const snappedY = Math.round(piece.y / gridSize) * gridSize;
    
    return {
      ...piece,
      x: snappedX,
      y: snappedY
    };
  }
}