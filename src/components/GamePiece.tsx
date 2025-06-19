import React from 'react';

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

export const drawPiece = (ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number, size = 80) => {
  ctx.save();
  ctx.translate(x + size/2, y + size/2);
  ctx.rotate((piece.rotation * Math.PI) / 180);

  const unit = size * 1.28; // Escala 8 veces más grande (0.16 * 8 = 1.28)

  // Transformar coordenadas: (x,y) -> (-y*unit, x*unit) para centrar correctamente
  const coord = (x: number, y: number): [number, number] => [x * unit, -y * unit];

  // Configuración de líneas: grosor fino para bordes seamless
  ctx.lineWidth = 1;

  // Dibujar cuadrado central - vértices (1,0), (2,0), (2,1), (1,1)
  ctx.fillStyle = piece.centerColor;
  ctx.strokeStyle = piece.centerColor; // BORDE DEL MISMO COLOR QUE EL RELLENO
  const [cx1, cy1] = coord(1, 0);
  const [cx2, cy2] = coord(2, 0);
  const [cx3, cy3] = coord(2, 1);
  const [cx4, cy4] = coord(1, 1);
  ctx.beginPath();
  ctx.moveTo(cx1, cy1);
  ctx.lineTo(cx2, cy2);
  ctx.lineTo(cx3, cy3);
  ctx.lineTo(cx4, cy4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dibujar los tres triángulos con bordes del mismo color
  ctx.fillStyle = piece.triangleColor;
  ctx.strokeStyle = piece.triangleColor; // BORDE DEL MISMO COLOR QUE EL RELLENO

  // Triángulo rectángulo izquierdo - vértices (0,0), (1,0), (1,1)
  ctx.beginPath();
  const [t1x1, t1y1] = coord(0, 0);
  const [t1x2, t1y2] = coord(1, 0);
  const [t1x3, t1y3] = coord(1, 1);
  ctx.moveTo(t1x1, t1y1);
  ctx.lineTo(t1x2, t1y2);
  ctx.lineTo(t1x3, t1y3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Triángulo superior - vértices (1,1), (2,1), (1.5,1.5) - pico hacia arriba FUERA del cuadrado
  ctx.beginPath();
  const [t2x1, t2y1] = coord(1, 1);
  const [t2x2, t2y2] = coord(2, 1);
  const [t2x3, t2y3] = coord(1.5, 1.5); // pico hacia arriba (Y mayor = más arriba)
  ctx.moveTo(t2x1, t2y1);
  ctx.lineTo(t2x2, t2y2);
  ctx.lineTo(t2x3, t2y3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Triángulo derecho - vértices (2,0), (2,1), (2.5,0.5) - continuación del superior, rotado 90°
  ctx.beginPath();
  const [t3x1, t3y1] = coord(2, 0);
  const [t3x2, t3y2] = coord(2, 1);
  const [t3x3, t3y3] = coord(2.5, 0.5);
  ctx.moveTo(t3x1, t3y1);
  ctx.lineTo(t3x2, t3y2);
  ctx.lineTo(t3x3, t3y3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Indicador de ID de pieza (removido para limpieza visual)

  ctx.restore();
};

const GamePiece: React.FC<GamePieceProps> = ({ piece, ctx, x, y, size = 80 }) => {
  drawPiece(ctx, piece, x, y, size);
  return null;
};

export default GamePiece;