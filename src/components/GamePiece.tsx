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

// Helper para dibujar un path sin gradientes para figuras continuas
const drawShape = (ctx: CanvasRenderingContext2D, coordinates: [number, number][], fillColor: string, shouldStroke: boolean = false, pieceSize: number = 80) => {
  ctx.fillStyle = fillColor;
  
  // Para líneas diagonales, aplicar stroke del mismo color para eliminar gaps de anti-aliasing
  if (shouldStroke) {
    ctx.strokeStyle = fillColor;
    
    // Ajustar grosor del stroke según el tamaño de la pieza
    // Para piezas muy pequeñas (miniaturas): stroke más fino
    // Para piezas normales: stroke estándar
    const strokeWidth = pieceSize < 40 ? 0.1 : (pieceSize < 60 ? 0.15 : 0.25);
    
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'miter'; // Conexiones precisas
    ctx.lineCap = 'butt'; // Extremos exactos
  }
  
  ctx.beginPath();
  const [startX, startY] = coordinates[0];
  ctx.moveTo(startX, startY);

  for (let i = 1; i < coordinates.length; i++) {
    const [x, y] = coordinates[i];
    ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();
  
  if (shouldStroke) {
    ctx.stroke();
  }
};

export const drawPiece = (ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number, size = 80) => {
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

  // Configuración optimizada según tamaño de pieza
  ctx.lineWidth = 0;
  
  // Para piezas muy pequeñas (miniaturas): anti-aliasing completamente OFF
  // Para piezas normales: configuración balanceada
  if (size < 50) {
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';
  } else {
    ctx.imageSmoothingEnabled = false; // Mantener OFF para consistencia
    ctx.imageSmoothingQuality = 'medium';
  }
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Dibujar con coordenadas EXACTAS originales + stroke adaptativo según tamaño
  
  // Triángulo rectángulo izquierdo (diagonal - stroke adaptativo)
  drawShape(ctx, [coord(0, 0), coord(1, 0), coord(1, 1)], piece.triangleColor, true, size);

  // Triángulo superior (diagonales - stroke adaptativo)
  drawShape(ctx, [coord(1, 1), coord(2, 1), coord(1.5, 1.5)], piece.triangleColor, true, size);

  // Triángulo derecho (diagonales - stroke adaptativo)
  drawShape(ctx, [coord(2, 0), coord(2, 1), coord(2.5, 0.5)], piece.triangleColor, true, size);

  // Cuadrado central (sin diagonales - sin stroke)
  drawShape(ctx, [coord(1, 0), coord(2, 0), coord(2, 1), coord(1, 1)], piece.centerColor, false, size);

  ctx.restore();
};

// Función para dibujar debug info sobre una pieza
export const drawPieceDebugInfo = (
  ctx: CanvasRenderingContext2D, 
  piece: Piece, 
  x: number, 
  y: number, 
  size = 80,
  debugMode: boolean = false
) => {
  if (!debugMode) return;
  
  ctx.save();
  
  // Número de pieza en el centro - MUY GRANDE
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 4;
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const centerX = x + size/2;
  const centerY = y + size/2;
  
  // Círculo de fondo para el número - MAS GRANDE
  ctx.beginPath();
  ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  
  // Número de pieza - MUY VISIBLE
  ctx.fillStyle = 'black';
  ctx.fillText(piece.id.toString(), centerX, centerY);
  
  // Etiquetas en los lados del contorno exterior - MUY GRANDES
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = 'red';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  
  // Función helper para dibujar texto con contorno GRUESO
  const drawLabelText = (text: string, x: number, y: number) => {
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  };
  
  // Calcular el contorno REAL de la pieza (no el bounding box)
  // La pieza real ocupa aprox. el 64% del centro del bounding box
  const realSize = size * 0.64; // Tamaño real de la pieza geométrica
  const realX = x + (size - realSize) / 2;
  const realY = y + (size - realSize) / 2;
  
  // Lado IZQUIERDO - en el borde real de la geometría
  drawLabelText('L', realX - 20, centerY);
  
  // Lado DERECHO - en el borde real de la geometría  
  drawLabelText('R', realX + realSize + 20, centerY);
  
  // Lado SUPERIOR - en el borde real de la geometría
  drawLabelText('T', centerX, realY - 20);
  
  // Lado INFERIOR - en el borde real de la geometría
  drawLabelText('B', centerX, realY + realSize + 30);
  
  // Información adicional de la pieza - MAS GRANDE
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = 'blue';
  
  // Rotación
  drawLabelText(`${piece.rotation}°`, x + size + 60, y + 30);
  
  // Tipo y cara
  drawLabelText(`${piece.type}-${piece.face}`, x + size + 60, y + 60);
  
  // Coordenadas
  drawLabelText(`(${x.toFixed(0)},${y.toFixed(0)})`, x + size + 60, y + 90);
  
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
