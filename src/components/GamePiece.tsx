export interface Piece {
  id: number;
  type: 'A' | 'B';
  face: 'front' | 'back';
  centerColor: string;
  triangleColor: string;
  x: number;
  y: number;
  rotation: number;
  placed: boolean;
}

// Función auxiliar para determinar si una pieza está en área de disponibles
export const isPieceInAvailableArea = (piece: Piece, gameAreaHeight: number): boolean => {
  return piece.y >= gameAreaHeight;
};

// Función auxiliar simplificada para determinar si una pieza puede mostrar reflejo
export const canPieceShowReflection = (piece: Piece, gameAreaHeight: number): boolean => {
  return piece.placed && piece.y < gameAreaHeight;
};

// Helper para dibujar un path y rellenarlo
const drawShape = (ctx: CanvasRenderingContext2D, coordinates: [number, number][], fillColor: string) => {
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = fillColor;
  ctx.beginPath();
  const [startX, startY] = coordinates[0];
  ctx.moveTo(startX, startY);
  
  for (let i = 1; i < coordinates.length; i++) {
    const [x, y] = coordinates[i];
    ctx.lineTo(x, y);
  }
  
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

export const drawPiece = (ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number, size = 100) => {
  ctx.save();
  ctx.translate(x + size/2, y + size/2);
  ctx.rotate((piece.rotation * Math.PI) / 180);

  // Si es pieza tipo B, aplicar espejo horizontal
  if (piece.type === 'B') {
    ctx.scale(-1, 1);
  }

  const unit = size * 1.28;
  // Transformar coordenadas para centrar correctamente
  const coord = (x: number, y: number): [number, number] => [x * unit, -y * unit];

  ctx.lineWidth = 1;

  // Dibujar cuadrado central - vértices (1,0), (2,0), (2,1), (1,1)
  drawShape(ctx, [
    coord(1, 0), coord(2, 0), coord(2, 1), coord(1, 1)
  ], piece.centerColor);

  // Dibujar los tres triángulos
  // Triángulo rectángulo izquierdo - vértices (0,0), (1,0), (1,1)
  drawShape(ctx, [
    coord(0, 0), coord(1, 0), coord(1, 1)
  ], piece.triangleColor);

  // Triángulo superior - vértices (1,1), (2,1), (1.5,1.5)
  drawShape(ctx, [
    coord(1, 1), coord(2, 1), coord(1.5, 1.5)
  ], piece.triangleColor);

  // Triángulo derecho - vértices (2,0), (2,1), (2.5,0.5)
  drawShape(ctx, [
    coord(2, 0), coord(2, 1), coord(2.5, 0.5)
  ], piece.triangleColor);

  ctx.restore();
};