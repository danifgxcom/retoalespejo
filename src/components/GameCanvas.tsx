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
  debugMode?: boolean;
}

export interface GameCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
}

const GameCanvas = forwardRef<GameCanvasRef, GameCanvasProps>(
    ({ pieces, currentChallenge, challenges, onMouseDown, onMouseMove, onMouseUp, onContextMenu, geometry, debugMode = false }, ref) => {
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
        // Área de juego con gradiente elegante
        const gameGradient = ctx.createRadialGradient(
          GAME_AREA_WIDTH / 2, GAME_AREA_HEIGHT / 2, 0, 
          GAME_AREA_WIDTH / 2, GAME_AREA_HEIGHT / 2, GAME_AREA_WIDTH
        );
        gameGradient.addColorStop(0, '#ffffff');
        gameGradient.addColorStop(0.6, '#f8fafc');
        gameGradient.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = gameGradient;
        ctx.fillRect(0, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);

        // Área de espejo con efecto metálico y reflectante
        const mirrorGradient = ctx.createLinearGradient(MIRROR_LINE, 0, MIRROR_LINE + GAME_AREA_WIDTH, 0);
        mirrorGradient.addColorStop(0, '#e8f4f8');
        mirrorGradient.addColorStop(0.2, '#f1f8fc');
        mirrorGradient.addColorStop(0.5, '#ffffff');
        mirrorGradient.addColorStop(0.8, '#f1f8fc');
        mirrorGradient.addColorStop(1, '#d6eaf8');
        ctx.fillStyle = mirrorGradient;
        ctx.fillRect(MIRROR_LINE, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);

        // Efecto de brillo en el espejo
        const gloss = ctx.createLinearGradient(MIRROR_LINE, 0, MIRROR_LINE + GAME_AREA_WIDTH, 0);
        gloss.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gloss.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        gloss.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        ctx.fillStyle = gloss;
        ctx.fillRect(MIRROR_LINE, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);

        // Área de piezas disponibles con gradiente cálido
        const pieceAreaGradient = ctx.createLinearGradient(0, GAME_AREA_HEIGHT, 0, GAME_AREA_HEIGHT + BOTTOM_AREA_HEIGHT);
        pieceAreaGradient.addColorStop(0, '#fef7ed');
        pieceAreaGradient.addColorStop(1, '#f3e8ff');
        ctx.fillStyle = pieceAreaGradient;
        ctx.fillRect(0, GAME_AREA_HEIGHT, GAME_AREA_WIDTH, BOTTOM_AREA_HEIGHT);

        // Área de objetivo con fondo limpio
        const objectiveGradient = ctx.createLinearGradient(MIRROR_LINE, GAME_AREA_HEIGHT, MIRROR_LINE, GAME_AREA_HEIGHT + BOTTOM_AREA_HEIGHT);
        objectiveGradient.addColorStop(0, '#ffffff');
        objectiveGradient.addColorStop(1, '#f8fafc');
        ctx.fillStyle = objectiveGradient;
        ctx.fillRect(MIRROR_LINE, GAME_AREA_HEIGHT, GAME_AREA_WIDTH, BOTTOM_AREA_HEIGHT);
      };

      // Dibujar marco de espejo clásico en bordes exteriores y líneas divisorias elegantes
      const drawMirrorFrameAndDivisions = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        // Líneas divisorias PRIMERO (sin marco interferiendo)
        
        // Línea divisoria central elegante (área de juego / espejo)
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(MIRROR_LINE, 0);
        ctx.lineTo(MIRROR_LINE, GAME_AREA_HEIGHT);
        ctx.stroke();

        // Línea dorada en el centro del espejo
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(MIRROR_LINE - 1, 0);
        ctx.lineTo(MIRROR_LINE - 1, GAME_AREA_HEIGHT);
        ctx.stroke();

        // Divisoria horizontal elegante
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, GAME_AREA_HEIGHT);
        ctx.lineTo(canvas.width, GAME_AREA_HEIGHT);
        ctx.stroke();

        // Sombra sutil bajo la divisoria horizontal
        const shadowGradient = ctx.createLinearGradient(0, GAME_AREA_HEIGHT, 0, GAME_AREA_HEIGHT + 15);
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.fillRect(0, GAME_AREA_HEIGHT, canvas.width, 15);

        // Divisoria vertical inferior
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(MIRROR_LINE, GAME_AREA_HEIGHT);
        ctx.lineTo(MIRROR_LINE, canvas.height);
        ctx.stroke();
      };

      // Dibujar etiquetas de áreas con estilo elegante
      const drawAreaLabels = (ctx: CanvasRenderingContext2D) => {
        // Estilo de texto mejorado con sombra
        ctx.font = 'bold 18px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';

        // Función helper para texto con sombra
        const drawTextWithShadow = (text: string, x: number, y: number, color: string) => {
          // Sombra
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillText(text, x + 1, y + 1);
          // Texto principal
          ctx.fillStyle = color;
          ctx.fillText(text, x, y);
        };

        // Área de juego
        drawTextWithShadow('🎮 ÁREA DE JUEGO', 15, 30, '#1e293b');

        // Espejo con icono
        drawTextWithShadow('🪞 ESPEJO', MIRROR_LINE + 15, 30, '#1e293b');

        // Piezas disponibles
        drawTextWithShadow('🧩 PIEZAS DISPONIBLES', 15, GAME_AREA_HEIGHT + 30, '#1e293b');

        // Objetivo
        drawTextWithShadow('🎯 OBJETIVO', MIRROR_LINE + 15, GAME_AREA_HEIGHT + 30, '#1e293b');

        // Agregar subtítulos descriptivos
        ctx.font = '13px "Segoe UI", sans-serif';
        drawTextWithShadow('Arrastra aquí tus piezas', 15, 50, '#64748b');
        drawTextWithShadow('Reflejo automático', MIRROR_LINE + 15, 50, '#64748b');
        drawTextWithShadow('Haz clic para rotar/voltear', 15, GAME_AREA_HEIGHT + 50, '#64748b');
        drawTextWithShadow('Patrón a conseguir', MIRROR_LINE + 15, GAME_AREA_HEIGHT + 50, '#64748b');
      };

      // Dibujar reflejos de las piezas con efecto realista
      const drawMirrorReflections = (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        // Recortar el área del espejo
        ctx.beginPath();
        ctx.rect(MIRROR_LINE, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);
        ctx.clip();

        if (pieces && pieces.length > 0) {
          pieces.forEach(piece => {
            if (!piece) return;

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
        }

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

        // Si no hay challenge, mostrar mensaje de carga y salir
        if (!challenge) {
          ctx.fillStyle = '#64748b';
          ctx.font = 'italic 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Loading challenges...', MIRROR_LINE + GAME_AREA_WIDTH/2, GAME_AREA_HEIGHT + BOTTOM_AREA_HEIGHT/2);
          return;
        }

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
        if (challenge && challenge.id !== undefined) {
          ctx.fillText(`#${challenge.id}`, MIRROR_LINE + GAME_AREA_WIDTH/2, GAME_AREA_HEIGHT + 95);
        } else {
          ctx.fillText('Loading...', MIRROR_LINE + GAME_AREA_WIDTH/2, GAME_AREA_HEIGHT + 95);
        }
      };

      // Función para dibujar piezas sin bordes y con colores originales (sin filtros)
      const drawPieceClean = (ctx: CanvasRenderingContext2D, piece: Piece & { isReflected?: boolean }, x: number, y: number, size = 100) => {
        ctx.save();

        // Desactivar antialiasing para evitar bordes blancos
        ctx.imageSmoothingEnabled = false;

        ctx.translate(x + size/2, y + size/2);
        ctx.rotate((piece.rotation * Math.PI) / 180);

        // Aplicar escala horizontal invertida para piezas tipo B
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

      // Dibujar las piezas objetivo usando piezas individuales
      const drawObjectivePieces = (ctx: CanvasRenderingContext2D, challenge: Challenge, contentTop: number, contentHeight: number, _mirrorLineInObjective: number, _objectiveScaleFactor: number, _objectivePieceSize: number) => {
        // Verificar que el challenge y sus propiedades existan
        if (!challenge || !challenge.objective || !challenge.objective.playerPieces) {
          // Si no hay datos válidos, mostrar un mensaje
          ctx.fillStyle = '#64748b';
          ctx.font = 'italic 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Challenge data not available', MIRROR_LINE + GAME_AREA_WIDTH/2, contentTop + 50);
          return;
        }

        const playerPieces = challenge.objective.playerPieces;

        // Área disponible para el mini-screenshot - márgenes ajustados para piezas más grandes
        const cardAreaWidth = GAME_AREA_WIDTH - 80; // Menos margen para más espacio
        const cardAreaHeight = contentHeight - 40; // Menos margen para más espacio
        const maxScale = 0.8; // Escala aumentada para piezas más visibles

        // Offset donde empieza la carta - ajustado para los márgenes reducidos
        const cardOffsetX = MIRROR_LINE + 40;
        const cardOffsetY = contentTop + 20;

        // Representar proporcionalmente el área de juego completa (0-700) en la challenge card
        const gameAreaWidth = 700; // Ancho completo del área de juego original
        const gameAreaHeight = 600; // Alto completo del área de juego original
        
        // Calcular escala para representar el área de juego completa
        const scaleX = (cardAreaWidth / 2) / gameAreaWidth; // Dividir por 2 para área de juego + espejo
        const scaleY = cardAreaHeight / gameAreaHeight;
        const scale = Math.min(scaleX, scaleY, maxScale);

        // Calcular posiciones escaladas manteniendo proporciones del área de juego
        const scaledPlayerPieces = playerPieces.map(piecePos => ({
          ...piecePos,
          x: piecePos.x * scale, // Mantener coordenadas originales escaladas
          y: piecePos.y * scale
        }));

        // El área de juego escalada ocupa la mitad izquierda de la carta
        const gameAreaOffsetX = cardOffsetX;
        const gameAreaOffsetY = cardOffsetY + (cardAreaHeight - gameAreaHeight * scale) / 2; // Centrar verticalmente

        // Dibujar línea divisoria para simular el espejo
        ctx.save();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        const mirrorLineX = gameAreaOffsetX + gameAreaWidth * scale; // Espejo en x=700 escalado
        ctx.beginPath();
        ctx.moveTo(mirrorLineX, gameAreaOffsetY);
        ctx.lineTo(mirrorLineX, gameAreaOffsetY + gameAreaHeight * scale);
        ctx.stroke();
        ctx.restore();

        // Dibujar cada pieza del jugador
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        scaledPlayerPieces.forEach((piecePos, index) => {
          // Crear una pieza visual a partir de la posición
          const displayPiece = {
            id: 1000 + index,
            type: piecePos.type,
            face: piecePos.face,
            centerColor: piecePos.type === 'A' ? 
              (piecePos.face === 'front' ? '#FFD700' : '#FF4444') : 
              (piecePos.face === 'front' ? '#FF4444' : '#FFD700'),
            triangleColor: piecePos.type === 'A' ? 
              (piecePos.face === 'front' ? '#FF4444' : '#FFD700') : 
              (piecePos.face === 'front' ? '#FFD700' : '#FF4444'),
            x: gameAreaOffsetX + piecePos.x, // Usar offset del área de juego escalada
            y: gameAreaOffsetY + piecePos.y,
            rotation: piecePos.rotation,
            placed: true
          };

          // Dibujar la pieza del jugador
          drawPieceClean(ctx, displayPiece, displayPiece.x, displayPiece.y, PIECE_SIZE * scale);

          // Calcular la posición reflejada (lado derecho de la carta)
          const reflectedX = mirrorLineX + (mirrorLineX - displayPiece.x - PIECE_SIZE * scale);

          // Crear la pieza reflejada
          const reflectedPiece = {
            ...displayPiece,
            x: reflectedX,
            y: displayPiece.y
          };

          // Dibujar la pieza reflejada con transformación horizontal
          ctx.save();
          ctx.translate(reflectedPiece.x + (PIECE_SIZE * scale)/2, reflectedPiece.y + (PIECE_SIZE * scale)/2);
          ctx.scale(-1, 1);
          ctx.translate(-(PIECE_SIZE * scale)/2, -(PIECE_SIZE * scale)/2);
          drawPieceClean(ctx, reflectedPiece, 0, 0, PIECE_SIZE * scale);
          ctx.restore();
        });

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
        
        // DEBUG MODE: Dibujar límites y información de debug
        if (debugMode) {
          // Dibujar límites del área de piezas disponibles
          ctx.strokeStyle = 'blue';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 5]);
          ctx.strokeRect(0, GAME_AREA_HEIGHT, GAME_AREA_WIDTH, BOTTOM_AREA_HEIGHT);
          ctx.setLineDash([]);
          
          // Dibujar límites del cuadrante izquierdo (área de piezas)
          ctx.strokeStyle = 'green';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(0, GAME_AREA_HEIGHT, GAME_AREA_WIDTH/2, BOTTOM_AREA_HEIGHT);
          ctx.setLineDash([]);
          
          // Dibujar límites del cuadrante derecho (área de objetivo)
          ctx.strokeStyle = 'orange';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(GAME_AREA_WIDTH/2, GAME_AREA_HEIGHT, GAME_AREA_WIDTH/2, BOTTOM_AREA_HEIGHT);
          ctx.setLineDash([]);
          
          // Etiquetas de coordenadas y áreas
          ctx.fillStyle = 'blue';
          ctx.font = 'bold 14px Arial';
          ctx.fillText('ÁREA PIEZAS: (0,600) a (700,1000)', 10, GAME_AREA_HEIGHT + 70);
          
          ctx.fillStyle = 'green';
          ctx.fillText('CUADRANTE PIEZAS: (0,600) a (350,1000)', 10, GAME_AREA_HEIGHT + 90);
          
          ctx.fillStyle = 'orange';
          ctx.fillText('CUADRANTE OBJETIVO: (350,600) a (700,1000)', 10, GAME_AREA_HEIGHT + 110);
        }

        // DIBUJAR PIEZAS INTERACTIVAS
        if (pieces && pieces.length > 0) {
          pieces.forEach(piece => {
            if (piece) {
              // DEBUG MODE: Dibujar marcadores de debug para piezas
              if (debugMode && !piece.placed) { // Solo para piezas en área de piezas disponibles
                // Dibujar el área real que ocupa la pieza (incluyendo extensiones)
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                const realSize = PIECE_SIZE * 1.6; // Tamaño real aproximado con extensiones
                const realX = piece.x - (realSize - PIECE_SIZE) / 2;
                const realY = piece.y - (realSize - PIECE_SIZE) / 2;
                ctx.strokeRect(realX, realY, realSize, realSize);
                
                // Escribir coordenadas y rotación
                ctx.fillStyle = 'red';
                ctx.font = '12px Arial';
                ctx.fillText(`(${Math.round(piece.x)}, ${Math.round(piece.y)})`, piece.x, piece.y - 5);
                ctx.fillText(`R:${piece.rotation}°`, piece.x, piece.y + realSize + 15);
              }
              
              drawPiece(ctx, piece, piece.x, piece.y, PIECE_SIZE);
            }
          });
        }

        drawMirrorReflections(ctx);
        drawChallengeCard(ctx);
      };

      // Validar todos los desafíos una sola vez al inicializar el componente
      useEffect(() => {
        const validations: {[key: number]: any} = {};
        if (challenges && challenges.length > 0) {
          console.log('🔍 DEBUGGING CHALLENGES - Total challenges loaded:', challenges.length);
          
          challenges.forEach(challenge => {
            if (challenge && challenge.id !== undefined && challenge.objective && challenge.objective.playerPieces) {
              console.log(`🎯 Challenge ${challenge.id} (${challenge.name}):`);
              console.log('  Player pieces:', challenge.objective.playerPieces);
              
              // Verificar coordenadas específicamente
              challenge.objective.playerPieces.forEach((piece, index) => {
                console.log(`  Piece ${index + 1}: type=${piece.type}, x=${piece.x}, y=${piece.y}, rotation=${piece.rotation}`);
                
                // Verificar si toca el espejo manualmente
                const touchesCheck = geometry.isPieceTouchingMirror(piece);
                const bbox = geometry.getPieceBoundingBox(piece);
                console.log(`    Bounding box: left=${bbox.left}, right=${bbox.right}, top=${bbox.top}, bottom=${bbox.bottom}`);
                console.log(`    Touches mirror: ${touchesCheck}, Distance to mirror: ${Math.abs(bbox.right - 700)}`);
              });
              
              // Usar validación real según las reglas del juego
              const validation = geometry.validateChallengeCard(challenge.objective.playerPieces);
              validations[challenge.id] = validation;
              
              // Log de validación para debugging
              console.log(`  ✅ Validation result:`, validation);
              if (!validation.isValid) {
                console.warn(`  ❌ Challenge ${challenge.id} (${challenge.name}) NO ES VÁLIDO:`, {
                  touchesMirror: validation.touchesMirror,
                  hasPieceOverlaps: validation.hasPieceOverlaps,
                  hasReflectionOverlaps: validation.hasReflectionOverlaps,
                  entersMirror: validation.entersMirror,
                  piecesConnected: validation.piecesConnected,
                  piecesInArea: validation.piecesInArea
                });
              }
            }
          });
        }
        setChallengeValidations(validations);
      }, [challenges, geometry]);

      useEffect(() => {
        drawCanvas();
      }, [pieces, currentChallenge, challenges, challengeValidations]); // Incluir challengeValidations

      return (
          <div className="relative">
            <canvas
                ref={canvasRef}
                width={1400}
                height={1000}
                className="cursor-pointer bg-white max-w-full max-h-full object-contain shadow-2xl"
                style={{
                  border: '20px solid #8b5a3c',
                  borderRadius: '12px',
                  boxShadow: `
                    inset 0 0 0 8px #d4af37,
                    inset 0 0 0 12px #8b5a3c,
                    0 10px 30px rgba(0, 0, 0, 0.3),
                    0 0 20px rgba(212, 175, 55, 0.2)
                  `
                }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp} // Importante para que no se quede una pieza "pegada" al cursor
                onContextMenu={onContextMenu}
            />
          </div>
      );
    }
);

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;
