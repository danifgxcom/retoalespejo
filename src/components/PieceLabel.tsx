import React from 'react';

interface PieceLabelProps {
  pieceId: number;
  x: number;
  y: number;
  isVisible: boolean;
  size?: number;
}

export const PieceLabel: React.FC<PieceLabelProps> = ({ 
  pieceId, 
  x, 
  y, 
  isVisible, 
  size = 100 
}) => {
  if (!isVisible) return null;

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    left: x + size / 2 - 15,
    top: y - 25,
    width: 30,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    zIndex: 1000,
    border: '2px solid #fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    pointerEvents: 'none',
    transform: 'scale(1)',
    transition: 'transform 0.2s ease'
  };

  return (
    <div style={labelStyle}>
      {pieceId}
    </div>
  );
};

/**
 * Función para renderizar etiquetas de piezas en canvas
 */
export const drawPieceLabel = (
  ctx: CanvasRenderingContext2D, 
  pieceId: number, 
  x: number, 
  y: number, 
  size: number = 100
): void => {
  const labelX = x + size / 2;
  const labelY = y - 10;
  const labelRadius = 12;

  // Fondo del label
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.beginPath();
  ctx.arc(labelX, labelY, labelRadius, 0, Math.PI * 2);
  ctx.fill();

  // Borde blanco
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Texto del número
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pieceId.toString(), labelX, labelY);
  
  ctx.restore();
};