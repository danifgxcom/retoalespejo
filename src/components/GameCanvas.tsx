import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { Piece, drawPiece } from './GamePiece';
import { Challenge } from './ChallengeCard';
import { GameGeometry } from '../utils/GameGeometry.ts';

interface GameCanvasProps {
  pieces: Piece[];
  currentChallenge: number;
  challenges: Challenge[];
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  geometry: GameGeometry;
}

export interface GameCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
}

const GameCanvas = forwardRef<GameCanvasRef, GameCanvasProps>(
    ({ pieces, currentChallenge, challenges, onMouseDown, onMouseMove, onMouseUp, onContextMenu, geometry }, ref) => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const PIECE_SIZE = 100; // Tamaño lógico de la pieza (25% más grande: 80 * 1.25 = 100)

      // Almacenar los resultados de validación para cada desafío
      const [challengeValidations, setChallengeValidations] = useState<{[key: number]: any}>({});

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
        const cardLeft = MIRROR_LINE + 50;
        const cardTop = GAME_AREA_HEIGHT + 50;
        const cardWidth = GAME_AREA_WIDTH - 100;
        const cardHeight = BOTTOM_AREA_HEIGHT - 100;
        const contentTop = cardTop + 40;
        const contentHeight = cardHeight - 40;
        const objectiveAreaCenterX = cardLeft + cardWidth / 2;
        const objectivePieceSize = PIECE_SIZE * 0.65; // Tamaño ajustado para caber en la carta
        const objectiveScaleFactor = objectivePieceSize / PIECE_SIZE;
        const mirrorLineInObjective = objectiveAreaCenterX;

        // Dibujar marco de la tarjeta
        drawCardFrame(ctx);

        // Usar la validación almacenada en lugar de recalcular
        const validation = challengeValidations[challenge.id] || { isValid: false };

        if (!validation.isValid) {
          // Si no es válido, mostrar fondo rojo y texto "INVALID"
          ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
          ctx.fillRect(cardLeft, cardTop, cardWidth, cardHeight);

          ctx.fillStyle = '#FF0000';
          ctx.font = 'bold 36px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('INVALID', MIRROR_LINE + GAME_AREA_WIDTH/2, GAME_AREA_HEIGHT + BOTTOM_AREA_HEIGHT/2);

          // Mostrar detalles de la invalidez
          ctx.font = '14px Arial';
          let yPos = GAME_AREA_HEIGHT + BOTTOM_AREA_HEIGHT/2 + 30;

          if (!validation.touchesMirror) {
            ctx.fillText('No piece touches the mirror', MIRROR_LINE + GAME_AREA_WIDTH/2, yPos);
            yPos += 20;
          }

          if (validation.hasPieceOverlaps) {
            ctx.fillText('Pieces overlap', MIRROR_LINE + GAME_AREA_WIDTH/2, yPos);
            yPos += 20;
          }

          if (validation.entersMirror) {
            ctx.fillText('Piece enters mirror area', MIRROR_LINE + GAME_AREA_WIDTH/2, yPos);
            yPos += 20;
          }

          // Nuevas validaciones
          if (!validation.piecesConnected) {
            ctx.fillText('Pieces must form a continuous figure', MIRROR_LINE + GAME_AREA_WIDTH/2, yPos);
            yPos += 20;
          }

          if (!validation.piecesInArea) {
            ctx.fillText('Pieces must fit within challenge area', MIRROR_LINE + GAME_AREA_WIDTH/2, yPos);
          }
        } else {
          // Si es válido, dibujar las piezas objetivo
          drawObjectivePieces(ctx, challenge, contentTop, contentHeight, mirrorLineInObjective, objectiveScaleFactor, objectivePieceSize);
        }
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

        // Título de la tarjeta
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CHALLENGE CARD', MIRROR_LINE + GAME_AREA_WIDTH/2, GAME_AREA_HEIGHT + 75);

        // Número del desafío
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`#${challenge.id}`, MIRROR_LINE + GAME_AREA_WIDTH/2, GAME_AREA_HEIGHT + 95);
      };

      // Función para dibujar piezas sin bordes y con colores originales (sin filtros)
      const drawPieceClean = (ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number, size = 100) => {
        ctx.save();
        
        // Desactivar antialiasing para evitar bordes blancos
        ctx.imageSmoothingEnabled = false;
        
        ctx.translate(x + size/2, y + size/2);
        ctx.rotate((piece.rotation * Math.PI) / 180);

        if (piece.type === 'B') {
          ctx.scale(-1, 1);
        }

        const unit = size * 1.28;
        const coord = (x: number, y: number): [number, number] => [
          Math.round(x * unit), 
          Math.round(-y * unit)
        ];

        // Configurar para evitar bordes
        ctx.lineWidth = 0;
        ctx.strokeStyle = 'transparent';

        // Dibujar cuadrado central
        ctx.fillStyle = piece.centerColor;
        ctx.beginPath();
        ctx.moveTo(...coord(1, 0));
        ctx.lineTo(...coord(2, 0));
        ctx.lineTo(...coord(2, 1));
        ctx.lineTo(...coord(1, 1));
        ctx.closePath();
        ctx.fill();

        // Dibujar triángulos
        ctx.fillStyle = piece.triangleColor;
        
        // Triángulo izquierdo - extender ligeramente para evitar gaps
        ctx.beginPath();
        ctx.moveTo(...coord(0, 0));
        ctx.lineTo(...coord(1.01, 0)); // Ligera extensión
        ctx.lineTo(...coord(1.01, 1)); // Ligera extensión
        ctx.closePath();
        ctx.fill();

        // Triángulo superior - extender ligeramente
        ctx.beginPath();
        ctx.moveTo(...coord(0.99, 1)); // Ligera extensión
        ctx.lineTo(...coord(2.01, 1)); // Ligera extensión
        ctx.lineTo(...coord(1.5, 1.5));
        ctx.closePath();
        ctx.fill();

        // Triángulo derecho - extender ligeramente
        ctx.beginPath();
        ctx.moveTo(...coord(1.99, 0)); // Ligera extensión
        ctx.lineTo(...coord(1.99, 1)); // Ligera extensión
        ctx.lineTo(...coord(2.5, 0.5));
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      };

      // Función para dibujar el patrón completo como una sola forma unificada
      const drawUnifiedPattern = (ctx: CanvasRenderingContext2D, pieces: any[], offsetX: number, offsetY: number, scale: number) => {
        // Agrupar piezas por color
        const piecesByColor = new Map<string, any[]>();
        
        pieces.forEach(piece => {
          // Procesar tanto piezas originales como reflejadas
          const originalPiece = piece;
          const reflectedPiece = {
            ...geometry.reflectPieceForChallengeCard(piece),
            isReflected: true
          };
          
          [originalPiece, reflectedPiece].forEach(p => {
            const centerColor = p.type === 'A' ? 
              (p.face === 'front' ? '#FFD700' : '#FF4444') : 
              (p.face === 'front' ? '#FF4444' : '#FFD700');
            const triangleColor = p.type === 'A' ? 
              (p.face === 'front' ? '#FF4444' : '#FFD700') : 
              (p.face === 'front' ? '#FFD700' : '#FF4444');
            
            // Agregar segmentos de centro
            if (!piecesByColor.has(centerColor)) {
              piecesByColor.set(centerColor, []);
            }
            piecesByColor.get(centerColor)!.push({
              ...p,
              segment: 'center',
              color: centerColor
            });
            
            // Agregar segmentos de triángulos
            if (!piecesByColor.has(triangleColor)) {
              piecesByColor.set(triangleColor, []);
            }
            piecesByColor.get(triangleColor)!.push({
              ...p,
              segment: 'triangles',
              color: triangleColor
            });
          });
        });
        
        // Dibujar cada color como una sola forma continua
        piecesByColor.forEach((segments, color) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          
          segments.forEach(segment => {
            const x = offsetX + (segment.x * scale);
            const y = offsetY + (segment.y * scale);
            const size = 100 * scale;
            
            ctx.save();
            ctx.translate(x + size/2, y + size/2);
            ctx.rotate((segment.rotation * Math.PI) / 180);
            
            if (segment.type === 'B') {
              ctx.scale(-1, 1);
            }
            
            if (segment.isReflected) {
              ctx.scale(-1, 1);
            }
            
            const unit = size * 1.28;
            const coord = (coordX: number, coordY: number): [number, number] => [
              coordX * unit, -coordY * unit
            ];
            
            if (segment.segment === 'center') {
              // Cuadrado central
              ctx.moveTo(...coord(1, 0));
              ctx.lineTo(...coord(2, 0));
              ctx.lineTo(...coord(2, 1));
              ctx.lineTo(...coord(1, 1));
              ctx.closePath();
            } else {
              // Triángulos
              ctx.moveTo(...coord(0, 0));
              ctx.lineTo(...coord(1, 0));
              ctx.lineTo(...coord(1, 1));
              ctx.closePath();
              
              ctx.moveTo(...coord(1, 1));
              ctx.lineTo(...coord(2, 1));
              ctx.lineTo(...coord(1.5, 1.5));
              ctx.closePath();
              
              ctx.moveTo(...coord(2, 0));
              ctx.lineTo(...coord(2, 1));
              ctx.lineTo(...coord(2.5, 0.5));
              ctx.closePath();
            }
            
            ctx.restore();
          });
          
          ctx.fill();
        });
      };

      // Dibujar las piezas objetivo usando el patrón unificado
      const drawObjectivePieces = (ctx: CanvasRenderingContext2D, challenge: Challenge, contentTop: number, contentHeight: number, mirrorLineInObjective: number, objectiveScaleFactor: number, objectivePieceSize: number) => {
        const playerPieces = challenge.objective.playerPieces;

        // Área disponible para el mini-screenshot
        const cardAreaWidth = GAME_AREA_WIDTH - 100;
        const cardAreaHeight = contentHeight - 40;

        // Offset donde empieza la carta
        const cardOffsetX = MIRROR_LINE + 50;
        const cardOffsetY = contentTop + 20;

        // Calcular límites del patrón completo (incluyendo reflejos)
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        playerPieces.forEach(piecePos => {
          minX = Math.min(minX, piecePos.x);
          maxX = Math.max(maxX, piecePos.x + PIECE_SIZE);
          minY = Math.min(minY, piecePos.y);
          maxY = Math.max(maxY, piecePos.y + PIECE_SIZE);

          const reflectedPiece = geometry.reflectPieceForChallengeCard(piecePos);
          minX = Math.min(minX, reflectedPiece.x);
          maxX = Math.max(maxX, reflectedPiece.x + PIECE_SIZE);
          minY = Math.min(minY, reflectedPiece.y);
          maxY = Math.max(maxY, reflectedPiece.y + PIECE_SIZE);
        });

        const patternWidth = maxX - minX;
        const patternHeight = maxY - minY;

        // Calcular escala
        const totalGameWidth = GAME_AREA_WIDTH * 2;
        const scaleX = cardAreaWidth / totalGameWidth;
        const scaleY = cardAreaHeight / GAME_AREA_HEIGHT;
        const patternScaleX = cardAreaWidth / patternWidth;
        const patternScaleY = cardAreaHeight / patternHeight;
        const scale = Math.min(scaleX, scaleY, patternScaleX, patternScaleY);

        // Calcular centrado
        const cardCenterX = cardOffsetX + cardAreaWidth / 2;
        const cardCenterY = cardOffsetY + cardAreaHeight / 2;
        const patternCenterX = (minX + maxX) / 2;
        const patternCenterY = (minY + maxY) / 2;
        const offsetX = cardCenterX - (patternCenterX * scale);
        const offsetY = cardCenterY - (patternCenterY * scale);

        // Dibujar usando el patrón unificado
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        drawUnifiedPattern(ctx, playerPieces, offsetX, offsetY, scale);
        ctx.restore();
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

      // Validar todos los desafíos una sola vez al inicializar el componente
      useEffect(() => {
        const validations: {[key: number]: any} = {};
        challenges.forEach(challenge => {
          validations[challenge.id] = geometry.validateChallengeCard(challenge.objective.playerPieces);
        });
        setChallengeValidations(validations);
      }, [challenges, geometry]);

      useEffect(() => {
        drawCanvas();
      }, [pieces, currentChallenge, challenges, challengeValidations]); // Incluir challengeValidations

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