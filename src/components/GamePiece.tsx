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

interface GamePieceProps {
  piece: Piece;
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  size?: number;
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
  ctx.beginPath();
  const [startX, startY] = coordinates[0];
  ctx.moveTo(startX, startY);

  for (let i = 1; i < coordinates.length; i++) {
    const [x, y] = coordinates[i];
    ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();
  // Removed stroke() to eliminate white lines between connected pieces
};

export const drawPiece = (ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number, size = 80) => {
  console.log(`🎨 Drawing piece ${piece.id} (${piece.type}, ${piece.face}) at (${x}, ${y}) - CENTER: ${piece.centerColor}, TRIANGLE: ${piece.triangleColor}`);
  
  ctx.save();
  ctx.translate(x + size/2, y + size/2);
  ctx.rotate((piece.rotation * Math.PI) / 180);

  // Si es pieza tipo B, aplicar espejo horizontal
  if (piece.type === 'B') {
    console.log(`🔄 Applying horizontal flip for piece type B (${piece.id})`);
    ctx.scale(-1, 1);
  }

  const unit = size * 1.28;
  // Transformar coordenadas para centrar correctamente
  const coord = (x: number, y: number): [number, number] => [x * unit, -y * unit];

  ctx.lineWidth = 0; // No stroke for seamless connections

  // Dibujar cuadrado central con pequeño overlap para eliminar gaps
  drawShape(ctx, [
    coord(0.99, -0.01), coord(2.01, -0.01), coord(2.01, 1.01), coord(0.99, 1.01)
  ], piece.centerColor);

  // Dibujar los tres triángulos con overlap
  // Triángulo rectángulo izquierdo
  drawShape(ctx, [
    coord(-0.01, -0.01), coord(1.01, -0.01), coord(1.01, 1.01)
  ], piece.triangleColor);

  // Triángulo superior
  drawShape(ctx, [
    coord(0.99, 1.01), coord(2.01, 1.01), coord(1.5, 1.51)
  ], piece.triangleColor);

  // Triángulo derecho
  drawShape(ctx, [
    coord(1.99, -0.01), coord(1.99, 1.01), coord(2.51, 0.5)
  ], piece.triangleColor);

  ctx.restore();
};

const GamePiece: React.FC<GamePieceProps> = ({ piece, ctx, x, y, size = 80 }) => {
  drawPiece(ctx, piece, x, y, size);
  return null;
};

// Add prop types validation to satisfy linting
GamePiece.defaultProps = {
  size: 80
};

export default GamePiece;
