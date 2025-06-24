/**
 * Componente de prueba para el sistema responsive
 * SOLO PARA TESTING - no toca el código existente
 */

import React, { useRef, useEffect } from 'react';
import { useResponsiveCanvas } from '../hooks/useResponsiveCanvas';

export const ResponsiveTest: React.FC = () => {
  const canvasRef = useRef<{ getCanvas: () => HTMLCanvasElement | null }>({
    getCanvas: () => canvasElement.current
  });
  const canvasElement = useRef<HTMLCanvasElement>(null);

  const {
    getScaledPiecePositions,
    getScaledGameAreas,
    getScaledSize,
    isReady
  } = useResponsiveCanvas({ canvasRef });

  useEffect(() => {
    if (!isReady || !canvasElement.current) return;

    const canvas = canvasElement.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Obtener áreas escaladas
    const areas = getScaledGameAreas();
    if (!areas) return;

    // Dibujar áreas con colores
    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'; // Verde para área de juego
    ctx.fillRect(areas.gameArea.x, areas.gameArea.y, areas.gameArea.width, areas.gameArea.height);

    ctx.fillStyle = 'rgba(0, 0, 255, 0.1)'; // Azul para área de espejo
    ctx.fillRect(areas.mirrorArea.x, areas.mirrorArea.y, areas.mirrorArea.width, areas.mirrorArea.height);

    ctx.fillStyle = 'rgba(255, 255, 0, 0.1)'; // Amarillo para área de piezas
    ctx.fillRect(areas.piecesArea.x, areas.piecesArea.y, areas.piecesArea.width, areas.piecesArea.height);

    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'; // Rojo para área objetivo
    ctx.fillRect(areas.objectiveArea.x, areas.objectiveArea.y, areas.objectiveArea.width, areas.objectiveArea.height);

    // Dibujar línea del espejo
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(areas.mirrorLine.x, areas.mirrorLine.y);
    ctx.lineTo(areas.mirrorLine.x, areas.mirrorLine.y + areas.mirrorLine.height);
    ctx.stroke();

    // Dibujar posiciones de piezas escaladas para 4 piezas
    const piecePositions = getScaledPiecePositions(4);
    const pieceSize = getScaledSize(100);

    piecePositions.forEach((pos, index) => {
      // Dibujar círculo para representar la pieza
      ctx.fillStyle = `hsl(${index * 90}, 70%, 50%)`;
      ctx.beginPath();
      ctx.arc(pos.x + pieceSize/2, pos.y + pieceSize/2, pieceSize/3, 0, Math.PI * 2);
      ctx.fill();

      // Escribir información
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.fillText(`P${index + 1}`, pos.x, pos.y - 5);
      ctx.fillText(`(${Math.round(pos.x)}, ${Math.round(pos.y)})`, pos.x, pos.y + pieceSize + 15);
      ctx.fillText(`R:${pos.rotation}°`, pos.x, pos.y + pieceSize + 30);
    });

    // Información de escala
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Canvas: ${canvas.width}x${canvas.height}`, 10, 30);
    ctx.fillText(`Piece size: ${Math.round(pieceSize)}px`, 10, 50);

  }, [isReady, getScaledPiecePositions, getScaledGameAreas, getScaledSize]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Responsive Canvas Test</h2>
      <div className="border-2 border-gray-300 inline-block">
        <canvas
          ref={canvasElement}
          width={700}  // Mitad del tamaño original para testing
          height={500}
          className="bg-white"
        />
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Verde: Área de juego | Azul: Espejo | Amarillo: Piezas | Rojo: Objetivo</p>
        <p>Círculos de colores: Posiciones de 4 piezas escaladas</p>
        <p>Línea roja: Espejo</p>
      </div>
    </div>
  );
};