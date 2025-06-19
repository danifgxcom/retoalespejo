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

      // Constantes del canvas
      const GAME_AREA_WIDTH = 700;
      const GAME_AREA_HEIGHT = 600;
      const BOTTOM_AREA_HEIGHT = 400;
      const MIRROR_LINE = 700;

      // Dibujar áreas de fondo con diseño elegante
      const drawBackgroundAreas = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        // Área de juego con gradiente sutil
        const gameGradient = ctx.createLinearGradient(0, 0, GAME_AREA_WIDTH, 0);
        gameGradient.addColorStop(0, '#f8fafc');
        gameGradient.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = gameGradient;
        ctx.fillRect(0, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);
        
        // Área de espejo con efecto espejo
        const mirrorGradient = ctx.createLinearGradient(MIRROR_LINE, 0, MIRROR_LINE + GAME_AREA_WIDTH, 0);
        mirrorGradient.addColorStop(0, '#e2e8f0');
        mirrorGradient.addColorStop(0.1, '#f1f5f9');
        mirrorGradient.addColorStop(0.9, '#f1f5f9');
        mirrorGradient.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = mirrorGradient;
        ctx.fillRect(MIRROR_LINE, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);
        
        // Área de piezas disponibles
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, GAME_AREA_HEIGHT, GAME_AREA_WIDTH, BOTTOM_AREA_HEIGHT);
        
        // Área de objetivo
        ctx.fillStyle = '#fefefe';
        ctx.fillRect(MIRROR_LINE, GAME_AREA_HEIGHT, GAME_AREA_WIDTH, BOTTOM_AREA_HEIGHT);
      };

      // Dibujar marco de espejo clásico en bordes exteriores y líneas divisorias elegantes
      const drawMirrorFrameAndDivisions = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        // Marco de espejo clásico en los bordes exteriores del canvas
        const frameWidth = 15;
        const frameColor = '#8b5a3c'; // Color madera
        const frameInnerColor = '#d4af37'; // Dorado
        
        // Marco exterior completo alrededor de todo el canvas
        ctx.fillStyle = frameColor;
        // Top
        ctx.fillRect(0, 0, canvas.width, frameWidth);
        // Bottom
        ctx.fillRect(0, canvas.height - frameWidth, canvas.width, frameWidth);
        // Left
        ctx.fillRect(0, 0, frameWidth, canvas.height);
        // Right
        ctx.fillRect(canvas.width - frameWidth, 0, frameWidth, canvas.height);
        
        // Marco interior dorado
        ctx.fillStyle = frameInnerColor;
        const innerFrame = 5;
        // Top
        ctx.fillRect(innerFrame, innerFrame, canvas.width - innerFrame * 2, frameWidth - innerFrame);
        // Bottom
        ctx.fillRect(innerFrame, canvas.height - frameWidth, canvas.width - innerFrame * 2, frameWidth - innerFrame);
        // Left
        ctx.fillRect(innerFrame, innerFrame, frameWidth - innerFrame, canvas.height - innerFrame * 2);
        // Right
        ctx.fillRect(canvas.width - frameWidth, innerFrame, frameWidth - innerFrame, canvas.height - innerFrame * 2);
        
        // Línea divisoria central simple (área de juego / espejo)
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(MIRROR_LINE, frameWidth);
        ctx.lineTo(MIRROR_LINE, GAME_AREA_HEIGHT);
        ctx.stroke();
        
        // Divisoria horizontal elegante
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(frameWidth, GAME_AREA_HEIGHT);
        ctx.lineTo(canvas.width - frameWidth, GAME_AREA_HEIGHT);
        ctx.stroke();
        
        // Sombra sutil bajo la divisoria
        const shadowGradient = ctx.createLinearGradient(0, GAME_AREA_HEIGHT, 0, GAME_AREA_HEIGHT + 10);
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.fillRect(frameWidth, GAME_AREA_HEIGHT, canvas.width - frameWidth * 2, 10);
        
        // Divisoria vertical inferior
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(MIRROR_LINE, GAME_AREA_HEIGHT);
        ctx.lineTo(MIRROR_LINE, canvas.height - frameWidth);
        ctx.stroke();
      };

      // Dibujar etiquetas de áreas con estilo elegante
      const drawAreaLabels = (ctx: CanvasRenderingContext2D) => {
        const frameWidth = 15;
        
        // Estilo de texto mejorado
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        
        // Área de juego
        ctx.fillStyle = '#1e293b';
        ctx.fillText('🎮 ÁREA DE JUEGO', frameWidth + 15, frameWidth + 25);
        
        // Espejo con icono
        ctx.fillText('🪞 ESPEJO', MIRROR_LINE + 15, frameWidth + 25);
        
        // Piezas disponibles
        ctx.fillText('🧩 PIEZAS DISPONIBLES', frameWidth + 15, GAME_AREA_HEIGHT + 25);
        
        // Objetivo
        ctx.fillText('🎯 OBJETIVO', MIRROR_LINE + 15, GAME_AREA_HEIGHT + 25);
        
        // Agregar subtítulos descriptivos
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Arrastra aquí tus piezas', frameWidth + 15, frameWidth + 45);
        ctx.fillText('Reflejo automático', MIRROR_LINE + 15, frameWidth + 45);
        ctx.fillText('Haz clic para rotar/voltear', frameWidth + 15, GAME_AREA_HEIGHT + 45);
        ctx.fillText('Patrón a conseguir', MIRROR_LINE + 15, GAME_AREA_HEIGHT + 45);
      };

      // Dibujar reflejos de las piezas con efecto realista
      const drawMirrorReflections = (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        // Recortar el área del espejo
        ctx.beginPath();
        ctx.rect(MIRROR_LINE, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);
        ctx.clip();

        pieces.forEach(piece => {
          // Solo reflejar piezas que están en el área de juego o entrando desde abajo
          const entryMargin = 60;
          const pieceBottomWithMargin = piece.y + PIECE_SIZE + entryMargin;
          const isEnteringFromBelow = pieceBottomWithMargin > GAME_AREA_HEIGHT;
          const isInsideGameArea = piece.y < GAME_AREA_HEIGHT;

          if (isEnteringFromBelow || isInsideGameArea) {
            ctx.save();
            
            // Transformación para el reflejo
            const reflectedX = 2 * MIRROR_LINE - piece.x - PIECE_SIZE;
            ctx.translate(reflectedX + PIECE_SIZE, piece.y);
            ctx.scale(-1, 1);

            // Crear pieza con ligera transparencia para efecto espejo
            const mirrorPiece = { 
              ...piece, 
              centerColor: piece.centerColor + 'E6', // 90% opacidad
              triangleColor: piece.triangleColor + 'E6'
            };
            
            drawPiece(ctx, mirrorPiece, 0, 0, PIECE_SIZE);
            ctx.restore();
          }
        });
        
        // Agregar efecto de distorsión del espejo
        const distortionGradient = ctx.createLinearGradient(MIRROR_LINE, 0, MIRROR_LINE + GAME_AREA_WIDTH, 0);
        distortionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        distortionGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
        distortionGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
        distortionGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        ctx.fillStyle = distortionGradient;
        ctx.fillRect(MIRROR_LINE, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);
        
        ctx.restore();
      };

      // Helper para convertir PiecePosition a Piece para visualización
      const createDisplayPiece = (piecePos: any, idOffset: number, xOffset: number = 0, yOffset: number = 0): Piece => {
        let centerColor = piecePos.type === 'A' ? '#FFD700' : '#FF4444';
        let triangleColor = piecePos.type === 'A' ? '#FF4444' : '#FFD700';

        if (piecePos.face === 'back') {
          [centerColor, triangleColor] = [triangleColor, centerColor];
        }

        return {
          id: 1000 + idOffset,
          type: piecePos.type,
          face: piecePos.face,
          centerColor,
          triangleColor,
          x: piecePos.x + xOffset,
          y: piecePos.y + yOffset,
          rotation: piecePos.rotation,
          placed: true
        };
      };

      // Dibujar la tarjeta de desafío completa
      const drawChallengeCard = (ctx: CanvasRenderingContext2D) => {
        const challenge = challenges[currentChallenge];
        
        // Cálculos de posicionamiento
        const cardInnerLeft = MIRROR_LINE + 60;
        const cardInnerTop = GAME_AREA_HEIGHT + 60;
        const cardInnerWidth = GAME_AREA_WIDTH - 120;
        const cardInnerHeight = BOTTOM_AREA_HEIGHT - 120;
        const contentTop = cardInnerTop + 40;
        const contentHeight = cardInnerHeight - 40;
        const objectiveAreaCenterX = cardInnerLeft + cardInnerWidth / 2;
        const objectivePieceSize = PIECE_SIZE * 0.65; // Tamaño ajustado para caber en la carta
        const objectiveScaleFactor = objectivePieceSize / PIECE_SIZE;
        const mirrorLineInObjective = objectiveAreaCenterX;

        // Dibujar marco de la tarjeta
        drawCardFrame(ctx);
        
        // Sin contenido adicional en la tarjeta (sin línea de espejo ni etiquetas)
        
        // Dibujar las piezas objetivo
        drawObjectivePieces(ctx, challenge, contentTop, contentHeight, mirrorLineInObjective, objectiveScaleFactor, objectivePieceSize);
      };

      // Dibujar el marco de la tarjeta de desafío
      const drawCardFrame = (ctx: CanvasRenderingContext2D) => {
        const challenge = challenges[currentChallenge];
        
        // Fondo de la tarjeta
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(MIRROR_LINE + 50, GAME_AREA_HEIGHT + 50, GAME_AREA_WIDTH - 100, BOTTOM_AREA_HEIGHT - 100);

        // Borde exterior de la tarjeta
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 4;
        ctx.strokeRect(MIRROR_LINE + 50, GAME_AREA_HEIGHT + 50, GAME_AREA_WIDTH - 100, BOTTOM_AREA_HEIGHT - 100);

        // Borde interior de la tarjeta
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;
        ctx.strokeRect(MIRROR_LINE + 60, GAME_AREA_HEIGHT + 60, GAME_AREA_WIDTH - 120, BOTTOM_AREA_HEIGHT - 120);

        // Título de la tarjeta
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CHALLENGE CARD', MIRROR_LINE + GAME_AREA_WIDTH/2, GAME_AREA_HEIGHT + 75);

        // Número del desafío
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`#${challenge.id}`, MIRROR_LINE + GAME_AREA_WIDTH/2, GAME_AREA_HEIGHT + 95);
      };



      // Función para dibujar piezas sin bordes cuando los colores son iguales
      const drawPieceNoStrokes = (ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number, size = 80) => {
        ctx.save();
        ctx.translate(x + size/2, y + size/2);
        ctx.rotate((piece.rotation * Math.PI) / 180);

        if (piece.type === 'B') {
          ctx.scale(-1, 1);
        }

        const unit = size * 1.28;
        const coord = (x: number, y: number): [number, number] => [x * unit, -y * unit];

        // Determinar si los colores son iguales (sin contar transparencia)
        const centerBase = piece.centerColor.replace(/80$/, '');
        const triangleBase = piece.triangleColor.replace(/80$/, '');
        const sameColors = centerBase === triangleBase;

        ctx.fillStyle = piece.centerColor;
        ctx.beginPath();
        ctx.moveTo(...coord(1, 0));
        ctx.lineTo(...coord(2, 0));
        ctx.lineTo(...coord(2, 1));
        ctx.lineTo(...coord(1, 1));
        ctx.closePath();
        ctx.fill();
        if (!sameColors) {
          ctx.strokeStyle = piece.centerColor;
          ctx.stroke();
        }

        ctx.fillStyle = piece.triangleColor;
        // Triángulo izquierdo
        ctx.beginPath();
        ctx.moveTo(...coord(0, 0));
        ctx.lineTo(...coord(1, 0));
        ctx.lineTo(...coord(1, 1));
        ctx.closePath();
        ctx.fill();
        if (!sameColors) {
          ctx.strokeStyle = piece.triangleColor;
          ctx.stroke();
        }

        // Triángulo superior
        ctx.beginPath();
        ctx.moveTo(...coord(1, 1));
        ctx.lineTo(...coord(2, 1));
        ctx.lineTo(...coord(1.5, 1.5));
        ctx.closePath();
        ctx.fill();
        if (!sameColors) {
          ctx.strokeStyle = piece.triangleColor;
          ctx.stroke();
        }

        // Triángulo derecho
        ctx.beginPath();
        ctx.moveTo(...coord(2, 0));
        ctx.lineTo(...coord(2, 1));
        ctx.lineTo(...coord(2.5, 0.5));
        ctx.closePath();
        ctx.fill();
        if (!sameColors) {
          ctx.strokeStyle = piece.triangleColor;
          ctx.stroke();
        }

        ctx.restore();
      };

      // Dibujar las piezas objetivo (jugador y reflejos)
      const drawObjectivePieces = (ctx: CanvasRenderingContext2D, challenge: Challenge, contentTop: number, contentHeight: number, mirrorLineInObjective: number, objectiveScaleFactor: number, objectivePieceSize: number) => {
        const playerPieces = challenge.objective.playerPieces;
        
        // Dibujar piezas del jugador (lado izquierdo)
        playerPieces.forEach((piecePos, index) => {
          const scaledX = mirrorLineInObjective - objectivePieceSize/2 + (piecePos.x - 560) * objectiveScaleFactor;
          const scaledY = contentTop + 40 + contentHeight/2 - objectivePieceSize/2 + (piecePos.y - 260) * objectiveScaleFactor;
          
          const piece = createDisplayPiece(piecePos, index, scaledX - piecePos.x, scaledY - piecePos.y);
          const objectivePiece = { ...piece };
          objectivePiece.centerColor = piece.centerColor + '80';
          objectivePiece.triangleColor = piece.triangleColor + '80';
          drawPieceNoStrokes(ctx, objectivePiece, scaledX, scaledY, objectivePieceSize);
        });

        // Dibujar reflejos (lado derecho)
        playerPieces.forEach((piecePos, index) => {
          const scaledY = contentTop + 40 + contentHeight/2 - objectivePieceSize/2 + (piecePos.y - 260) * objectiveScaleFactor;
          
          const piece = createDisplayPiece(piecePos, index + 100, 0, 0);
          const objectivePiece = { ...piece };
          objectivePiece.centerColor = piece.centerColor + '80';
          objectivePiece.triangleColor = piece.triangleColor + '80';

          ctx.save();
          ctx.translate(mirrorLineInObjective + objectivePieceSize/2, scaledY);
          ctx.scale(-1, 1);
          drawPieceNoStrokes(ctx, objectivePiece, 0, 0, objectivePieceSize);
          ctx.restore();
        });
      };

      // Dibujar canvas principal
      const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawBackgroundAreas(ctx, canvas);
        drawMirrorFrameAndDivisions(ctx, canvas);
        drawAreaLabels(ctx);

        // DIBUJAR PIEZAS INTERACTIVAS
        pieces.forEach(piece => {
          drawPiece(ctx, piece, piece.x, piece.y, PIECE_SIZE);
        });

        drawMirrorReflections(ctx);
        drawChallengeCard(ctx);
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
