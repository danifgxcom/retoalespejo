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
      const PIECE_SIZE = 80; // Tamaño lógico de la pieza

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

        const gameAreaWidth = 700;
        const gameAreaHeight = 600; // Reducido de 700 a 600
        const bottomAreaHeight = 400; // Aumentado de 300 a 400 
        const mirrorLine = 700;

        // DIBUJAR ÁREAS
        ctx.fillStyle = '#f8f9fa'; // Área de juego
        ctx.fillRect(0, 0, gameAreaWidth, gameAreaHeight);
        ctx.fillStyle = '#f0f8ff'; // Área de espejo
        ctx.fillRect(mirrorLine, 0, gameAreaWidth, gameAreaHeight);
        ctx.fillStyle = '#e9ecef'; // Área de piezas disponibles
        ctx.fillRect(0, gameAreaHeight, gameAreaWidth, bottomAreaHeight);
        ctx.fillStyle = '#f8f9fa'; // Área de objetivo
        ctx.fillRect(mirrorLine, gameAreaHeight, gameAreaWidth, bottomAreaHeight);

        // DIBUJAR LÍNEAS DIVISORIAS
        ctx.strokeStyle = '#C0C0C0'; // Línea de espejo
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(mirrorLine, 0);
        ctx.lineTo(mirrorLine, gameAreaHeight);
        ctx.stroke();
        ctx.strokeStyle = '#dee2e6'; // Divisoria horizontal
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, gameAreaHeight);
        ctx.lineTo(canvas.width, gameAreaHeight);
        ctx.stroke();
        ctx.beginPath(); // Divisoria vertical inferior
        ctx.moveTo(mirrorLine, gameAreaHeight);
        ctx.lineTo(mirrorLine, canvas.height);
        ctx.stroke();

        // ETIQUETAS DE ÁREAS
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('ÁREA DE JUEGO', 20, 25);
        ctx.fillText('ESPEJO', mirrorLine + 20, 25);
        ctx.fillText('PIEZAS DISPONIBLES', 20, gameAreaHeight + 25);
        ctx.fillText('OBJETIVO', mirrorLine + 20, gameAreaHeight + 25);

        // DIBUJAR PIEZAS INTERACTIVAS
        pieces.forEach(piece => {
          drawPiece(ctx, piece, piece.x, piece.y, PIECE_SIZE);
        });

        // DIBUJAR REFLEJOS
        ctx.save();
        // 1. Recortar el área del espejo para que los reflejos solo aparezcan ahí.
        ctx.beginPath();
        ctx.rect(mirrorLine, 0, gameAreaWidth, gameAreaHeight);
        ctx.clip();

        pieces.forEach(piece => {
          // Solo reflejar piezas que están total o parcialmente en el área de juego
          // Verificar si cualquier parte de la pieza intersecta con el área de juego
          
          // Para detectar entrada temprana desde abajo (lo que funcionaba bien antes)
          const entryMargin = 60; // Margen generoso para detectar entrada temprana desde abajo
          const pieceBottomWithMargin = piece.y + PIECE_SIZE + entryMargin;
          const isEnteringFromBelow = pieceBottomWithMargin > gameAreaHeight;
          
          // Para mantener el reflejo cuando la pieza está dentro del área
          const isInsideGameArea = piece.y < gameAreaHeight;
          
          if (isEnteringFromBelow || isInsideGameArea) {
            ctx.save();
            // 2. Recortar la pieza por si está a caballo entre el área de juego y la de disponibles
            const clipHeight = gameAreaHeight - piece.y;
            if (clipHeight < PIECE_SIZE) {
              ctx.beginPath();
              ctx.rect(piece.x, piece.y, PIECE_SIZE, clipHeight);
              // Esta parte es compleja por la rotación y el dibujo personalizado.
              // Una forma más simple es simplemente no dibujar el reflejo si está parcialmente fuera.
              // Por ahora, reflejamos todo lo que esté en el área de juego.
            }

            // Transformación para el reflejo
            const reflectedX = 2 * mirrorLine - piece.x - PIECE_SIZE;
            ctx.translate(reflectedX + PIECE_SIZE, piece.y);
            ctx.scale(-1, 1);

            drawPiece(ctx, piece, 0, 0, PIECE_SIZE);
            ctx.restore();
          }
        });
        ctx.restore(); // Limpiar el recorte del área del espejo

        // DIBUJAR ÁREA DE DESAFÍO
        const challenge = challenges[currentChallenge];
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Desafío: ${challenge.name}`, 1050, gameAreaHeight + 60);

        // Piezas del desafío (ejemplo estático)
        const challengePieces: Piece[] = [
          { id: 998, type: 'A', face: 'front', centerColor: '#d9a7c7', triangleColor: '#fffcdc', x: 920, y: 780, rotation: 0, placed: true },
          { id: 999, type: 'A', face: 'front', centerColor: '#d9a7c7', triangleColor: '#fffcdc', x: 1000, y: 780, rotation: 0, placed: true },
        ];

        challengePieces.forEach(p => {
          drawPiece(ctx, p, p.x, p.y, PIECE_SIZE);
        });
      };

      useEffect(() => {
        drawCanvas();
      }, [pieces, currentChallenge, challenges]); // Dependencias correctas

      return (
          <canvas
              ref={canvasRef}
              width={1400}
              height={1000}
              className="border-2 border-gray-300 rounded cursor-pointer bg-white max-w-full max-h-full object-contain"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp} // Importante para que no se quede una pieza "pegada" al cursor
              onContextMenu={onContextMenu}
          />
      );
    }
);

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;