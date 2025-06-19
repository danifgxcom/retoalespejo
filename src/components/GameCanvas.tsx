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

    // Dibujar patrón del Reto 1 usando la función drawPiece
    const drawHeart1Pattern = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
      // Este patrón se forma con 2 piezas del tipo A (cuadrado amarillo, triángulo rojo)
      // una encima de la otra y rotadas para formar el corazón.
      const pieceTemplate: Piece = {
        id: 0,
        type: 'A',
        face: 'front',
        centerColor: '#FFD700',
        triangleColor: '#FF4444',
        x: 0,
        y: 0,
        rotation: 0,
        placed: true,
      };

      // Pieza superior
      const topPiece = {
        ...pieceTemplate,
        rotation: 90,
      };
      // La dibujamos un poco por encima del centro
      drawPiece(ctx, topPiece, centerX - 40, centerY - 45, 80);

      // Pieza inferior
      const bottomPiece = {
        ...pieceTemplate,
        rotation: -90,
      };
      // La dibujamos un poco por debajo del centro
      drawPiece(ctx, bottomPiece, centerX - 40, centerY + 5, 80);
    };

    // Dibujar patrón del Reto 2 usando la función drawPiece
    const drawHeart2Pattern = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
      // Este patrón se forma con dos piezas, una de cada tipo,
      // rotadas y colocadas para formar un patrón de rombos.

      // Pieza 1 (Tipo B: cuadrado rojo)
      const piece1: Piece = {
        id: 0,
        type: 'B',
        face: 'front',
        centerColor: '#FF4444',
        triangleColor: '#FFD700',
        x: 0,
        y: 0,
        rotation: 45, // Rotada 45 grados
        placed: true,
      };
      drawPiece(ctx, piece1, centerX - 55, centerY - 25, 80);

      // Pieza 2 (Tipo A: cuadrado amarillo, pero volteada a su cara B)
      const piece2: Piece = {
        id: 1,
        type: 'A',
        face: 'back', // La cara 'back' invierte los colores
        centerColor: '#FF4444', // Color del centro se vuelve rojo
        triangleColor: '#FFD700', // Color del triángulo se vuelve amarillo
        x: 0,
        y: 0,
        rotation: 135, // Rotada 135 grados
        placed: true,
      };
      drawPiece(ctx, piece2, centerX - 25, centerY - 25, 80);
    };

    // Dibujar patrones complejos
    const drawComplexPattern = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, pattern: string) => {
      ctx.fillStyle = '#ddd';
      ctx.fillRect(centerX - 50, centerY - 50, 100, 100);
      ctx.strokeRect(centerX - 50, centerY - 50, 100, 100);

      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Patrón', centerX, centerY - 10);
      ctx.fillText('Complejo', centerX, centerY + 5);
      ctx.fillText(pattern === 'complex1' ? '4 piezas' : 'Avanzado', centerX, centerY + 20);
    };


    // Dibujar canvas principal
    const drawCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Área de juego (lado izquierdo hasta el espejo)
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, 700, 350);

      // Área del espejo (reflejo)
      ctx.fillStyle = '#f0f8ff';
      ctx.fillRect(700, 0, 700, 350);

      // Línea del espejo (sin grosor, solo la división)
      ctx.strokeStyle = '#C0C0C0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(700, 0);
      ctx.lineTo(700, 350);
      ctx.stroke();

      // Área de piezas disponibles (parte inferior izquierda)
      ctx.fillStyle = '#e9ecef';
      ctx.fillRect(0, 350, 700, canvas.height - 350);

      // Área de tarjeta desafío (parte inferior derecha)
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(700, 350, 700, canvas.height - 350);

      // Línea divisoria horizontal principal
      ctx.strokeStyle = '#dee2e6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 350);
      ctx.lineTo(canvas.width, 500);
      ctx.stroke();

      // Línea divisoria vertical en el área inferior
      ctx.strokeStyle = '#dee2e6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(700, 350);
      ctx.lineTo(700, canvas.height);
      ctx.stroke();

      // Etiquetas de áreas
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('ÁREA DE JUEGO', 20, 25);
      ctx.fillText('ESPEJO', 720, 25);
      ctx.fillText('PIEZAS DISPONIBLES', 20, 375);
      ctx.fillText('OBJETIVO', 720, 375);

      // Dibujar patrón objetivo en el área inferior derecha
      const challenge = challenges[currentChallenge];
      const targetCenterX = 950; // Centro del área objetivo (700 + 250, más hacia la izquierda)
      const targetCenterY = 450;  // Centro del área objetivo, ajustado para nueva altura

      if (challenge.targetPattern === 'heart1') {
        drawHeart1Pattern(ctx, targetCenterX, targetCenterY);
      } else if (challenge.targetPattern === 'heart2') {
        drawHeart2Pattern(ctx, targetCenterX, targetCenterY);
      } else {
        drawComplexPattern(ctx, targetCenterX, targetCenterY, challenge.targetPattern);
      }

      // Añadir información del patrón, piezas y dificultad en el área objetivo
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Patrón: ${challenge.name}`, targetCenterX, targetCenterY + 80);
      ctx.fillText(`Dificultad: ${challenge.difficulty}`, targetCenterX, targetCenterY + 100);
      ctx.fillText(`Piezas: ${challenge.piecesNeeded}`, targetCenterX, targetCenterY + 120);

      // Dibujar todas las piezas
      pieces.forEach(piece => {
        drawPiece(ctx, piece, piece.x, piece.y);
      });

      // Dibujar reflejos de las piezas en el área de juego (espejo vertical)
      pieces.filter(piece => piece.placed && piece.y < 350).forEach(piece => {
        const mirrorLine = 700; // Línea del espejo vertical (actualizada)

        // Usar el mismo tamaño conservador para consistencia
        const conservativeSize = 200;

        // SIEMPRE reflejar la pieza si está en el área de juego (no importa qué tan cerca del espejo)
        // Para un espejo vertical: reflejar la posición X
        // Si la pieza está en X, el reflejo está en (2 * mirrorLine - X - conservativeSize)
        const reflectedX = 2 * mirrorLine - piece.x - conservativeSize;

        // Guardar el contexto y aplicar transformación de espejo
        ctx.save();
        ctx.translate(reflectedX + conservativeSize/2, piece.y + conservativeSize/2);
        ctx.scale(-1, 1); // Voltear horizontalmente
        ctx.translate(-(conservativeSize/2), -(conservativeSize/2));

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
        className="border-2 border-gray-300 rounded cursor-pointer bg-white w-full"
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
