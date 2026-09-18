import { PIECE_PARTS, PIECE_OUTLINE_UNITS, toLocalPoint, getPieceExtent, getPieceRadius, getPartsInWorld } from '@reto/geometry';
import type { Piece as GeometryPiece } from '@reto/geometry';

export interface Piece extends GeometryPiece {
  id: number;
  centerColor: string;
  triangleColor: string;
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
};

/**
 * Partes de la pieza en coordenadas de pantalla: giro, tipo y posición ya
 * aplicados, sin pasar por `ctx`.
 *
 * `drawPiece` deja esa transformación en manos del contexto, lo que basta para
 * pintar una pieza suelta. Las tarjetas de reto necesitan lo contrario: los
 * polígonos de TODAS las piezas en un mismo sistema, para poder agruparlos por
 * color y contornear la figura entera (ver `drawColorRegions`).
 *
 * Vive en `@reto/geometry` porque la validación compara la figura compuesta con
 * la del objetivo y necesita exactamente los mismos polígonos: dos copias de
 * esta transformación acabarían discrepando.
 */
export const getPiecePartsInWorld = getPartsInWorld;

/** Orienta un polígono en sentido horario para que el relleno `nonzero` de
 *  varios polígonos sea su unión y no abra huecos donde se solapan. */
const clockwise = (points: Array<[number, number]>): Array<[number, number]> => {
  const area = points.reduce((sum, [x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    return sum + (x * ny - nx * y);
  }, 0);
  return area < 0 ? [...points].reverse() : points;
};

/**
 * Dibuja una figura completa contorneando REGIONES DE COLOR, no piezas.
 *
 * Es como están hechas las tarjetas originales del juego: la figura y su
 * reflejo forman una sola silueta y no se ve por dónde va la unión con el
 * espejo ni dónde acaba cada pieza — que es justo lo que la tarjeta no debe
 * chivar. `drawPiece` hace lo contrario (contorno por pieza), que es lo que
 * hace falta en el tablero, donde cada pieza se arrastra por separado.
 *
 * El truco es pintar cada grupo de color en dos pasadas sobre el MISMO camino:
 * primero el trazo y encima el relleno. El trazo interior queda tapado por el
 * relleno del propio grupo, así que sólo sobrevive el borde exterior del grupo;
 * y como los grupos se pintan en orden, en la frontera entre dos colores queda
 * la línea del segundo, igual que en la tarjeta impresa.
 */
export const drawColorRegions = (
  ctx: CanvasRenderingContext2D,
  regions: Array<{ color: string; polygons: Array<Array<[number, number]>> }>,
  outlineColor: string,
  lineWidth: number
): void => {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = lineWidth * 2; // la mitad interior la tapa el relleno

  regions.forEach(({ color, polygons }) => {
    const path = new Path2D();
    polygons.forEach(polygon => {
      const points = clockwise(polygon);
      path.moveTo(points[0][0], points[0][1]);
      points.slice(1).forEach(([x, y]) => path.lineTo(x, y));
      path.closePath();
    });

    ctx.stroke(path);
    ctx.fillStyle = color;
    ctx.fill(path);
  });

  ctx.restore();
};

/**
 * Contorno EXTERIOR de la pieza, contra el fondo del lienzo.
 *
 * Es un trazo aparte del `ctx.strokeStyle = fillColor` de `drawShape`: aquel
 * tapa las costuras de anti-aliasing ENTRE las partes de una misma pieza
 * (triángulos y cuadrado), no separa la pieza del fondo - por eso pintarlo
 * del mismo color que el relleno no aporta contraste contra el lienzo.
 *
 * El dorado y el rojo del juego original no se tocan (son su identidad), y
 * contra el lienzo claro dan sólo 1.6:1 (WCAG 1.4.11 exige 3:1 para bordes).
 * `--canvas-piece-outline` resuelve esto con un color propio, oscuro sobre
 * fondo claro y claro sobre fondo oscuro en las cuatro combinaciones de tema
 * (ver la matriz en styles/theme.css).
 */
const drawOuterContour = (ctx: CanvasRenderingContext2D, coord: (unitX: number, unitY: number) => [number, number], size: number) => {
  const outlineColor = typeof document !== 'undefined'
    ? getComputedStyle(document.body).getPropertyValue('--canvas-piece-outline').trim() || '#0f172a'
    : '#0f172a';

  ctx.save();
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.lineJoin = 'round';

  ctx.beginPath();
  const [startX, startY] = coord(...PIECE_OUTLINE_UNITS[0]);
  ctx.moveTo(startX, startY);
  for (let i = 1; i < PIECE_OUTLINE_UNITS.length; i++) {
    ctx.lineTo(...coord(...PIECE_OUTLINE_UNITS[i]));
  }
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
};

export const drawPiece = (ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number, size = 80) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((piece.rotation * Math.PI) / 180);

  // Si es pieza tipo B, aplicar espejo horizontal
  if (piece.type === 'B') {
    ctx.scale(-1, 1);
  }

  // Coordenadas de unidad -> píxeles relativos al centro de la pieza
  const coord = (unitX: number, unitY: number): [number, number] => toLocalPoint(unitX, unitY, size);

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

  // Triángulos primero y cuadrado al final: el orden de PIECE_PARTS evita
  // costuras claras entre bordes
  PIECE_PARTS.forEach(part => {
    const coordinates = part.units.map(([ux, uy]) => coord(ux, uy));
    const fillColor = part.kind === 'center' ? piece.centerColor : piece.triangleColor;
    drawShape(ctx, coordinates, fillColor, true, size);
  });

  // Contorno exterior de alto contraste contra el fondo (ver drawOuterContour)
  drawOuterContour(ctx, coord, size);

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

  const centerX = x;
  const centerY = y;

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
  const drawLabelText = (text: string, labelX: number, labelY: number) => {
    ctx.strokeText(text, labelX, labelY);
    ctx.fillText(text, labelX, labelY);
  };

  // Contorno REAL de la pieza (no un bounding box inventado)
  const { width: realWidth, height: realHeight } = getPieceExtent(size);
  const radius = getPieceRadius(size);
  const realX = centerX - realWidth / 2;
  const realY = centerY - realHeight / 2;

  // Lado IZQUIERDO - en el borde real de la geometría
  drawLabelText('L', realX - 20, centerY);

  // Lado DERECHO - en el borde real de la geometría
  drawLabelText('R', realX + realWidth + 20, centerY);

  // Lado SUPERIOR - en el borde real de la geometría
  drawLabelText('T', centerX, realY - 20);

  // Lado INFERIOR - en el borde real de la geometría
  drawLabelText('B', centerX, realY + realHeight + 30);

  // Información adicional de la pieza - MAS GRANDE
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = 'blue';

  // Rotación
  drawLabelText(`${piece.rotation}°`, x + radius + 60, y - radius + 30);

  // Tipo y cara
  drawLabelText(`${piece.type}-${piece.face}`, x + radius + 60, y - radius + 60);

  // Coordenadas
  drawLabelText(`(${x.toFixed(0)},${y.toFixed(0)})`, x + radius + 60, y - radius + 90);

  ctx.restore();
};


const GamePiece: React.FC<GamePieceProps> = ({ piece, ctx, x, y, size = 80 }) => {
  drawPiece(ctx, piece, x, y, size);
  return null;
};

export default GamePiece;
