
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Piece, drawPiece } from './GamePiece';
import { Challenge } from './ChallengeCard';

interface GameCanvasProps {
  pieces: Piece[];
  currentChallenge: number;
  challenges: Challenge[];
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

export interface GameCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
}

const GameCanvas = forwardRef<GameCanvasRef, GameCanvasProps>(
    ({ pieces, currentChallenge, challenges, onMouseDown, onMouseMove, onMouseUp, onContextMenu }, ref) => {
      const canvasRef = useRef<HTMLCanvasElement>(null);

      useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current,
      }));

      // Dibujar canvas principal
      const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calcular espacio necesario para piezas:
        // - Tamaño visual máximo de pieza: ~225px
        // - Espacio para 2 piezas apiladas: 225 * 2 = 450px
        // - Margen superior e inferior: 50px
        // - Total necesario: 450 + 50 = 500px
        const gameAreaHeight = 500;

        // ÁREA DE JUEGO (lado izquierdo) - altura aumentada
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, 700, gameAreaHeight);

        // ÁREA DEL ESPEJO (reflejo) - misma altura que juego
        ctx.fillStyle = '#f0f8ff';
        ctx.fillRect(700, 0, 700, gameAreaHeight);

        // Línea del espejo vertical
        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(700, 0);
        ctx.lineTo(700, gameAreaHeight);
        ctx.stroke();

        // ÁREA DE PIEZAS DISPONIBLES (parte inferior izquierda)
        ctx.fillStyle = '#e9ecef';
        ctx.fillRect(0, gameAreaHeight, 700, canvas.height - gameAreaHeight);

        // ÁREA DE OBJETIVO (parte inferior derecha)
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(700, gameAreaHeight, 700, canvas.height - gameAreaHeight);

        // Línea divisoria horizontal principal
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, gameAreaHeight);
        ctx.lineTo(canvas.width, gameAreaHeight);
        ctx.stroke();

        // Línea divisoria vertical en el área inferior
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(700, gameAreaHeight);
        ctx.lineTo(700, canvas.height);
        ctx.stroke();

        // Etiquetas de áreas
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('ÁREA DE JUEGO', 20, 25);
        ctx.fillText('ESPEJO', 720, 25);
        ctx.fillText('PIEZAS DISPONIBLES', 20, gameAreaHeight + 25);
        ctx.fillText('OBJETIVO', 720, gameAreaHeight + 25);

        // Información del desafío en el área objetivo (SIN PIEZA OBJETIVO)
        const challenge = challenges[currentChallenge];
        const targetCenterX = 1050;
        const targetCenterY = gameAreaHeight + 50; // Ajustado para nueva altura

        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Desafío: ${challenge.name}`, targetCenterX, targetCenterY - 20);
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Dificultad: ${challenge.difficulty}`, targetCenterX, targetCenterY + 10);
        ctx.fillText(`Piezas necesarias: ${challenge.piecesNeeded}`, targetCenterX, targetCenterY + 30);
        ctx.font = '12px Arial';
        ctx.fillText(`${challenge.description}`, targetCenterX, targetCenterY + 50);

        // Dibujar todas las piezas
        pieces.forEach(piece => {
          drawPiece(ctx, piece, piece.x, piece.y);
        });

        // Dibujar reflejos de las piezas en el área de juego (espejo vertical)
        pieces.filter(piece => piece.placed && piece.y < gameAreaHeight).forEach(piece => { // Solo reflejar si está en área de juego
          const mirrorLine = 700;
          const actualVisualSize = 80 * 1.28 * 2.2; // ≈ 225px

          const reflectedX = 2 * mirrorLine - piece.x - actualVisualSize;

          // Guardar el contexto y aplicar transformación de espejo
          ctx.save();
          ctx.translate(reflectedX + actualVisualSize/2, piece.y + actualVisualSize/2);
          ctx.scale(-1, 1); // Voltear horizontalmente
          ctx.translate(-(actualVisualSize/2), -(actualVisualSize/2));

          // Dibujar la pieza reflejada
          drawPiece(ctx, piece, 0, 0);

          ctx.restore();
        });
      };

      // Actualizar canvas cuando cambien las props
      useEffect(() => {
        drawCanvas();
      }, [pieces, currentChallenge]);

      return (
          <canvas
              ref={canvasRef}
              width={1400}
              height={600}
              className="border-2 border-gray-300 rounded cursor-pointer bg-white max-w-full max-h-full object-contain"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onContextMenu={onContextMenu}
          />
      );
    }
);

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;