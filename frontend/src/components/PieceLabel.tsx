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
    left: x + size / 2 - 25,
    top: y - 35,
    width: 50,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: 'white',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 1000,
    border: '3px solid #fff',
    boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
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
  const labelY = y - 25; // Más separado de la pieza
  const labelRadius = 25; // Aún más grande para mejor visibilidad

  // Fondo del label con sombra
  ctx.save();
  
  // Sombra
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(labelX + 2, labelY + 2, labelRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Fondo principal
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.beginPath();
  ctx.arc(labelX, labelY, labelRadius, 0, Math.PI * 2);
  ctx.fill();

  // Borde blanco grueso
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Texto del número - MUCHO MÁS GRANDE
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial'; // Tamaño aumentado a 28px para máxima visibilidad
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pieceId.toString(), labelX, labelY);
  
  ctx.restore();
};