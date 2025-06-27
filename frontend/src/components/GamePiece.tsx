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

// Helper para dibujar texturas accesibles
const drawAccessibleTexture = (ctx: CanvasRenderingContext2D, coordinates: [number, number][], shapeType: 'center' | 'triangle', pieceSize: number = 80) => {
  const isAccessibleTheme = localStorage.getItem('theme') === 'accessible';
  if (!isAccessibleTheme) return;

  ctx.save();
  
  // Create clipping path for the shape
  ctx.beginPath();
  const [startX, startY] = coordinates[0];
  ctx.moveTo(startX, startY);
  for (let i = 1; i < coordinates.length; i++) {
    const [x, y] = coordinates[i];
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.clip();

  // Apply different symbols based on shape type
  if (shapeType === 'center') {
    // White square symbol for center pieces (squares)
    drawSquareSymbol(ctx, coordinates, pieceSize);
  } else {
    // White circle symbol for triangles
    drawCircleSymbol(ctx, coordinates, pieceSize);
  }
  
  ctx.restore();
};

// Global grid-aligned dots pattern for center pieces (squares)
const drawSquareSymbol = (ctx: CanvasRenderingContext2D, coordinates: [number, number][], pieceSize: number) => {
  const dotRadius = Math.max(1.5, pieceSize * 0.03); // Same size dots for both
  const spacing = Math.max(8, pieceSize * 0.10); // Same spacing for both
  
  // Find bounding box of shape
  const xs = coordinates.map(([x, y]) => x);
  const ys = coordinates.map(([x, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Semi-transparent white dots
  
  // Use global grid instead of piece-relative grid
  // Calculate the global grid origin (always at 0,0 with fixed spacing)
  const gridOriginX = 0;
  const gridOriginY = 0;
  
  // Find the first grid point that's visible in this shape
  const startGridX = Math.ceil((minX - gridOriginX) / spacing) * spacing + gridOriginX;
  const startGridY = Math.ceil((minY - gridOriginY) / spacing) * spacing + gridOriginY;
  
  for (let x = startGridX; x < maxX; x += spacing) {
    for (let y = startGridY; y < maxY; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
};

// Global grid-aligned dots pattern for triangles - same as squares to avoid giving hints
const drawCircleSymbol = (ctx: CanvasRenderingContext2D, coordinates: [number, number][], pieceSize: number) => {
  const dotRadius = Math.max(1.5, pieceSize * 0.03); // Same size dots for both
  const spacing = Math.max(8, pieceSize * 0.10); // Same spacing for both
  
  // Find bounding box of shape
  const xs = coordinates.map(([x, y]) => x);
  const ys = coordinates.map(([x, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Semi-transparent white dots
  
  // Use global grid instead of piece-relative grid
  // Calculate the global grid origin (always at 0,0 with fixed spacing)
  const gridOriginX = 0;
  const gridOriginY = 0;
  
  // Find the first grid point that's visible in this shape
  const startGridX = Math.ceil((minX - gridOriginX) / spacing) * spacing + gridOriginX;
  const startGridY = Math.ceil((minY - gridOriginY) / spacing) * spacing + gridOriginY;
  
  for (let x = startGridX; x < maxX; x += spacing) {
    for (let y = startGridY; y < maxY; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
};

// Helper para dibujar un path sin gradientes para figuras continuas
const drawShape = (ctx: CanvasRenderingContext2D, coordinates: [number, number][], fillColor: string, shouldStroke: boolean = false, pieceSize: number = 80, shapeType: 'center' | 'triangle' = 'triangle') => {
  ctx.fillStyle = fillColor;

  // Para líneas diagonales, aplicar stroke del mismo color para eliminar gaps de anti-aliasing
  if (shouldStroke) {
    ctx.strokeStyle = fillColor;

    // Ajustar grosor del stroke según el tamaño de la pieza
    // Para piezas muy pequeñas (miniaturas): stroke más grueso para eliminar gaps
    // Para piezas normales: stroke estándar
    const strokeWidth = pieceSize < 40 ? 0.5 : (pieceSize < 60 ? 0.3 : 0.25);

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
  
  // Add accessible texture pattern
  drawAccessibleTexture(ctx, coordinates, shapeType, pieceSize);
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

  // Configuración específica para diferentes escalas basada en análisis
  ctx.imageSmoothingEnabled = false;
  ctx.imageSmoothingQuality = size < 50 ? 'low' : 'medium';
  ctx.globalCompositeOperation = 'source-over'; // Mantener composición normal

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Overlap conservador que mantenga geometría pero reduzca gaps
  // Basado en análisis: 19px pieces necesitan overlap sutil pero efectivo
  const baseOverlap = size < 25 ? 0.02 : (size < 40 ? 0.015 : (size < 60 ? 0.01 : 0.005));
  const microOverlap = baseOverlap;

  // Debug logging solo cuando se solicite snapshot (controlado externamente)
  const shouldDebug = (window as any).debugPieceRendering === true;

  if (shouldDebug) {
    console.log(`
🎯 PIECE DEBUG INFO:
  📏 Size: ${size}px (unit=${unit.toFixed(2)})
  🔄 Rotation: ${piece.rotation}°, Type: ${piece.type}, Face: ${piece.face}
  🎨 Colors: center=${piece.centerColor}, triangles=${piece.triangleColor}
  📐 Overlap: ${microOverlap} units = ${(microOverlap * unit).toFixed(3)}px
  🖼️ Context: ${ctx.imageSmoothingEnabled ? 'smoothed' : 'pixelated'}

  📍 Calculated Coordinates:
    Triangle Left: [${coord(0, 0)[0].toFixed(1)}, ${coord(0, 0)[1].toFixed(1)}] → [${coord(1 + microOverlap, 0)[0].toFixed(1)}, ${coord(1 + microOverlap, 1 + microOverlap)[1].toFixed(1)}]
    Triangle Top: [${coord(1 - microOverlap, 1 + microOverlap)[0].toFixed(1)}, ${coord(1 - microOverlap, 1 + microOverlap)[1].toFixed(1)}] → [${coord(1.5, 1.5)[0].toFixed(1)}, ${coord(1.5, 1.5)[1].toFixed(1)}]
    Triangle Right: [${coord(2 - microOverlap, 0)[0].toFixed(1)}, ${coord(2 - microOverlap, 0)[1].toFixed(1)}] → [${coord(2.5, 0.5)[0].toFixed(1)}, ${coord(2.5, 0.5)[1].toFixed(1)}]
    Square: [${coord(1 - microOverlap, 0)[0].toFixed(1)}, ${coord(1 - microOverlap, 0)[1].toFixed(1)}] → [${coord(2 + microOverlap, 1 + microOverlap)[0].toFixed(1)}, ${coord(2 + microOverlap, 1 + microOverlap)[1].toFixed(1)}]
    `);
  }

  // Triángulo izquierdo - forma trapecio perfecto con base alineada
  drawShape(ctx, [
    coord(0, 0),                    // Esquina inferior izquierda
    coord(1, 0),                    // Base del triángulo (alineada con cuadrado)
    coord(1, 1)                     // Esquina superior derecha del triángulo
  ], piece.triangleColor, true, size, 'triangle');

  // Triángulo superior - simétrico y alineado
  drawShape(ctx, [
    coord(1, 1),                    // Esquina inferior izquierda (conecta con triángulo izq)
    coord(2, 1),                    // Esquina inferior derecha (conecta con triángulo der)
    coord(1.5, 1.5)                 // Punta superior centrada
  ], piece.triangleColor, true, size, 'triangle');

  // Triángulo derecho - espejo del izquierdo
  drawShape(ctx, [
    coord(2, 0),                    // Esquina inferior derecha
    coord(2, 1),                    // Esquina superior izquierda del triángulo
    coord(2.5, 0.5)                 // Punta derecha centrada verticalmente
  ], piece.triangleColor, true, size, 'triangle');

  // Cuadrado central - base perfecta del trapecio
  drawShape(ctx, [
    coord(1, 0),                    // Esquina inferior izquierda
    coord(2, 0),                    // Esquina inferior derecha
    coord(2, 1),                    // Esquina superior derecha
    coord(1, 1)                     // Esquina superior izquierda
  ], piece.centerColor, true, size, 'center');

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
