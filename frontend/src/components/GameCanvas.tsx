import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useMemo } from 'react';
import { Piece, drawPiece } from './GamePiece';
import { Challenge } from './ChallengeCard';
import { GameGeometry } from '../utils/geometry/GameGeometry';
import { GameAreaRenderer } from '../rendering/GameAreaRenderer';
import { CANVAS_CONSTANTS } from '../utils/canvas/CanvasConstants';
import { CanvasDrawing } from '../utils/canvas/CanvasDrawing';
import { PieceColors } from '../utils/piece/PieceColors';

interface GameCanvasProps {
  pieces: Piece[];
  currentChallenge: number;
  challenges: Challenge[];
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseLeave: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  geometry: GameGeometry;
  debugMode?: boolean;
  draggedPiece?: Piece | null;
  interactingPieceId?: number | null;
  temporaryDraggedPieceId?: number | null;
  animatingPieceId?: number | null;
}

export interface GameCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
}

const GameCanvas = forwardRef<GameCanvasRef, GameCanvasProps>(
    ({ pieces, currentChallenge, challenges, onMouseDown, onMouseMove, onMouseUp, onMouseLeave, onContextMenu, geometry, debugMode = false, draggedPiece, interactingPieceId, temporaryDraggedPieceId, animatingPieceId }, ref) => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const containerRef = useRef<HTMLDivElement>(null);
      // Almacenar los resultados de validación para cada desafío
      const [challengeValidations, setChallengeValidations] = useState<{[key: number]: any}>({});
      
      // Responsive canvas dimensions
      const [canvasDimensions, setCanvasDimensions] = useState({
        width: 1400,
        height: 1000,
        scale: 1
      });

      useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current,
      }));

      // Use shared constants as base dimensions
      const {
        GAME_AREA_WIDTH,
        GAME_AREA_HEIGHT, 
        BOTTOM_AREA_HEIGHT,
        MIRROR_LINE,
        PIECE_SIZE,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      } = CANVAS_CONSTANTS;

      // Update canvas dimensions based on container size
      useEffect(() => {
        const updateCanvasDimensions = () => {
          if (!containerRef.current) return;
          
          const container = containerRef.current;
          const containerRect = container.getBoundingClientRect();
          
          // Calculate available space (accounting for padding and borders)
          const availableWidth = containerRect.width - 20; // Account for padding
          const availableHeight = containerRect.height - 20; // Account for padding
          
          // Base aspect ratio from constants
          const baseAspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT; // 1.4
          
          // Calculate dimensions that fit in container while maintaining aspect ratio
          let newWidth = availableWidth;
          let newHeight = availableWidth / baseAspectRatio;
          
          // If height exceeds container, adjust based on height
          if (newHeight > availableHeight) {
            newHeight = availableHeight;
            newWidth = availableHeight * baseAspectRatio;
          }
          
          // Calculate scale factor for coordinate transformation
          const scale = newWidth / CANVAS_WIDTH;
          
          setCanvasDimensions({
            width: Math.floor(newWidth),
            height: Math.floor(newHeight),
            scale
          });
          
          console.log(`🎯 Canvas responsive update: ${Math.floor(newWidth)}x${Math.floor(newHeight)}, scale: ${scale.toFixed(3)}`);
        };

        // Initial calculation
        updateCanvasDimensions();

        // Listen for window resize
        const handleResize = () => {
          updateCanvasDimensions();
        };

        window.addEventListener('resize', handleResize);

        // Use ResizeObserver for container changes if available
        let resizeObserver: ResizeObserver | null = null;
        if (window.ResizeObserver && containerRef.current) {
          resizeObserver = new ResizeObserver(handleResize);
          resizeObserver.observe(containerRef.current);
        }

        return () => {
          window.removeEventListener('resize', handleResize);
          if (resizeObserver) {
            resizeObserver.disconnect();
          }
        };
      }, [CANVAS_WIDTH, CANVAS_HEIGHT]);

      // Crear instancia de GameAreaRenderer
      const gameAreaRenderer = useMemo(() => new GameAreaRenderer({
        gameAreaWidth: GAME_AREA_WIDTH,
        gameAreaHeight: GAME_AREA_HEIGHT,
        bottomAreaHeight: BOTTOM_AREA_HEIGHT,
        mirrorLine: MIRROR_LINE,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        pieceSize: PIECE_SIZE
      }), []);

      // Use shared drawing utility
      const drawBackgroundAreas = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        CanvasDrawing.drawBackgroundAreas(ctx);
      };

      // Dibujar marco de espejo clásico en bordes exteriores y líneas divisorias elegantes
      const drawMirrorFrameAndDivisions = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        // Líneas divisorias PRIMERO (sin marco interferiendo)

        // Use shared mirror line drawing
        CanvasDrawing.drawMirrorLine(ctx);

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

        // Use shared area borders
        CanvasDrawing.drawAreaBorders(ctx);
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
          // Sort pieces by y-coordinate (bottom to top) to ensure proper z-order
          // This ensures pieces at the bottom are drawn first, and pieces at the top are drawn last
          const sortedPieces = [...pieces].sort((a, b) => b.y - a.y);

          sortedPieces.forEach(piece => {
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
        // Usar la misma lógica que createPieceTemplate para consistencia
        const centerColor = piecePos.face === 'front' ? '#FFD700' : '#FF4444';
        const triangleColor = piecePos.face === 'front' ? '#FF4444' : '#FFD700';

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

        // Aplicar overlap consistente para evitar gaps
        const microOverlap = size < 25 ? 0.02 : (size < 40 ? 0.015 : (size < 60 ? 0.01 : 0.005));

        // Función helper para dibujar una forma con relleno y borde del mismo color
        const drawShapeWithStroke = (coordinates: [number, number][], fillColor: string) => {
          ctx.fillStyle = fillColor;
          ctx.strokeStyle = fillColor;

          // Ajustar grosor del stroke según el tamaño de la pieza
          // Para piezas muy pequeñas (miniaturas): stroke más grueso para eliminar gaps
          // Para piezas normales: stroke estándar
          const strokeWidth = size < 40 ? 0.5 : (size < 60 ? 0.3 : 0.25);
          ctx.lineWidth = strokeWidth;
          ctx.lineJoin = 'miter'; // Conexiones precisas
          ctx.lineCap = 'butt'; // Extremos exactos

          ctx.beginPath();
          const [startX, startY] = coordinates[0];
          ctx.moveTo(startX, startY);

          for (let i = 1; i < coordinates.length; i++) {
            const [x, y] = coordinates[i];
            ctx.lineTo(x, y);
          }

          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        };

        // Dibujar cuadrado central con stroke para eliminar gaps
        drawShapeWithStroke([
          coord(1, 0),
          coord(2, 0),
          coord(2, 1),
          coord(1, 1)
        ], piece.centerColor);

        // Dibujar triángulos con stroke para eliminar gaps
        // Triángulo izquierdo - forma trapecio perfecto con base alineada
        drawShapeWithStroke([
          coord(0, 0),
          coord(1, 0),
          coord(1, 1)
        ], piece.triangleColor);

        // Triángulo superior - simétrico y alineado
        drawShapeWithStroke([
          coord(1, 1),
          coord(2, 1),
          coord(1.5, 1.5)
        ], piece.triangleColor);

        // Triángulo derecho - espejo del izquierdo
        drawShapeWithStroke([
          coord(2, 0),
          coord(2, 1),
          coord(2.5, 0.5)
        ], piece.triangleColor);

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

        // Función helper para dibujar una forma con relleno y borde del mismo color
        const drawShapeWithStroke = (coordinates: [number, number][], fillColor: string, pieceSize: number) => {
          ctx.fillStyle = fillColor;
          ctx.strokeStyle = fillColor;

          // Ajustar grosor del stroke según el tamaño de la pieza
          // Para piezas muy pequeñas (miniaturas): stroke más grueso para eliminar gaps
          // Para piezas normales: stroke estándar
          const strokeWidth = pieceSize < 40 ? 0.5 : (pieceSize < 60 ? 0.3 : 0.25);
          ctx.lineWidth = strokeWidth;
          ctx.lineJoin = 'miter'; // Conexiones precisas
          ctx.lineCap = 'butt'; // Extremos exactos

          ctx.beginPath();
          const [startX, startY] = coordinates[0];
          ctx.moveTo(startX, startY);

          for (let i = 1; i < coordinates.length; i++) {
            const [x, y] = coordinates[i];
            ctx.lineTo(x, y);
          }

          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        };

        // Dibujar cada color como formas separadas con stroke para eliminar gaps
        piecesByColor.forEach((segments, color) => {
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
              // Cuadrado central con stroke para eliminar gaps
              drawShapeWithStroke([
                coord(1, 0),
                coord(2, 0),
                coord(2, 1),
                coord(1, 1)
              ], color, size);
            } else {
              // Triángulos con stroke para eliminar gaps
              // Triángulo izquierdo
              drawShapeWithStroke([
                coord(0, 0),
                coord(1, 0),
                coord(1, 1)
              ], color, size);

              // Triángulo superior
              drawShapeWithStroke([
                coord(1, 1),
                coord(2, 1),
                coord(1.5, 1.5)
              ], color, size);

              // Triángulo derecho
              drawShapeWithStroke([
                coord(2, 0),
                coord(2, 1),
                coord(2.5, 0.5)
              ], color, size);
            }

            ctx.restore();
          });
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

        // Representar proporcionalmente el área de juego completa (0-GAME_AREA_WIDTH) en la challenge card
        const gameAreaWidth = GAME_AREA_WIDTH; // Ancho completo del área de juego original
        const gameAreaHeight = GAME_AREA_HEIGHT; // Alto completo del área de juego original

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

        // Centrar el contenido completo (juego + espejo) dentro de la tarjeta
        const totalContentWidth = (gameAreaWidth * 2) * scale; // Área de juego + área de espejo
        const contentStartX = cardOffsetX + (cardAreaWidth - totalContentWidth) / 2; // Centrar horizontalmente

        const gameAreaOffsetX = contentStartX;
        const gameAreaOffsetY = cardOffsetY + (cardAreaHeight - gameAreaHeight * scale) / 2; // Centrar verticalmente

        // Calcular línea del espejo (siempre, para usar después)
        const mirrorLineX = gameAreaOffsetX + gameAreaWidth * scale; // Espejo en x=700 escalado

        // DEBUG INFO para tarjeta de reto (solo en modo debug)
        if (debugMode) {
          console.log('🎯 TARJETA DE RETO DEBUG:');
          console.log(`Card area: ${cardAreaWidth}x${cardAreaHeight}`);
          console.log(`Game scale: ${scale.toFixed(3)}`);
          console.log(`Mirror line X: ${mirrorLineX.toFixed(1)}`);
          console.log(`Game offset: (${gameAreaOffsetX}, ${gameAreaOffsetY})`);
          console.log(`Pieces count: ${scaledPlayerPieces.length}`);
          console.log(`Card offset: (${cardOffsetX}, ${cardOffsetY})`);
          console.log(`Scaled pieces:`, scaledPlayerPieces);

          ctx.fillStyle = '#ff0000';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(`TARJETA DEBUG:`, cardOffsetX, cardOffsetY - 10);
          ctx.fillText(`Card area: ${cardAreaWidth}x${cardAreaHeight}`, cardOffsetX, cardOffsetY + 10);
          ctx.fillText(`Game scale: ${scale.toFixed(3)}`, cardOffsetX, cardOffsetY + 25);
          ctx.fillText(`Mirror line X: ${mirrorLineX.toFixed(1)}`, cardOffsetX, cardOffsetY + 40);
          ctx.fillText(`Game offset: (${gameAreaOffsetX}, ${gameAreaOffsetY})`, cardOffsetX, cardOffsetY + 55);
          ctx.fillText(`Pieces count: ${scaledPlayerPieces.length}`, cardOffsetX, cardOffsetY + 70);

          // Marcar límites de la tarjeta
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          ctx.strokeRect(cardOffsetX, cardOffsetY, cardAreaWidth, cardAreaHeight);

          // Marcar área de juego escalada
          ctx.strokeStyle = '#0000ff';
          ctx.lineWidth = 1;
          ctx.strokeRect(gameAreaOffsetX, gameAreaOffsetY, gameAreaWidth * scale, gameAreaHeight * scale);
        }

        // Sort pieces by y-coordinate (bottom to top) to ensure proper z-order
        // This ensures pieces at the bottom are drawn first, and pieces at the top are drawn last
        const sortedPieces = [...scaledPlayerPieces].sort((a, b) => b.y - a.y);

        // Dibujar cada pieza del jugador
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        sortedPieces.forEach((piecePos, index) => {
          // Crear una pieza visual a partir de la posición - usar lógica consistente
          const displayPiece = {
            id: 1000 + index,
            type: piecePos.type,
            face: piecePos.face,
            centerColor: piecePos.face === 'front' ? '#FFD700' : '#FF4444',
            triangleColor: piecePos.face === 'front' ? '#FF4444' : '#FFD700',
            x: gameAreaOffsetX + piecePos.x, // Usar offset del área de juego escalada
            y: gameAreaOffsetY + piecePos.y,
            rotation: piecePos.rotation,
            placed: true
          };

          // Calcular la posición reflejada usando la misma lógica que el juego principal
          const reflectedX = 2 * mirrorLineX - displayPiece.x - PIECE_SIZE * scale;

          // Crear la pieza reflejada
          const reflectedPiece = {
            ...displayPiece,
            x: reflectedX,
            y: displayPiece.y
          };

          if (debugMode) {
            console.log(`🧩 Piece ${index + 1}:`);
            console.log(`  Original: x=${displayPiece.x.toFixed(1)}, y=${displayPiece.y.toFixed(1)}`);
            console.log(`  Reflected: x=${reflectedPiece.x.toFixed(1)}, y=${reflectedPiece.y.toFixed(1)}`);
            console.log(`  Gap between pieces: ${Math.abs(reflectedX - (displayPiece.x + PIECE_SIZE * scale)).toFixed(1)}px`);
          }

          // Dibujar la pieza del jugador
          drawPieceClean(ctx, displayPiece, displayPiece.x, displayPiece.y, PIECE_SIZE * scale);

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

        // DEBUG MODE: Etiquetas de áreas solo en modo debug
        if (debugMode) {
          drawAreaLabels(ctx);
        }

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
          ctx.fillText(`ÁREA PIEZAS: (0,${GAME_AREA_HEIGHT}) a (${GAME_AREA_WIDTH},${CANVAS_HEIGHT})`, 10, GAME_AREA_HEIGHT + 70);

          ctx.fillStyle = 'green';
          ctx.fillText(`CUADRANTE PIEZAS: (0,${GAME_AREA_HEIGHT}) a (${GAME_AREA_WIDTH/2},${CANVAS_HEIGHT})`, 10, GAME_AREA_HEIGHT + 90);

          ctx.fillStyle = 'orange';
          ctx.fillText(`CUADRANTE OBJETIVO: (${GAME_AREA_WIDTH/2},${GAME_AREA_HEIGHT}) a (${GAME_AREA_WIDTH},${CANVAS_HEIGHT})`, 10, GAME_AREA_HEIGHT + 110);
        }

        // USAR GAMEAREARENDERER para dibujar piezas con etiquetas interactivas
        if (gameAreaRenderer) {
          // Sort pieces by y-coordinate (bottom to top) to ensure proper z-order
          // This ensures pieces at the bottom are drawn first, and pieces at the top are drawn last
          const sortedPieces = [...pieces].sort((a, b) => b.y - a.y);
          gameAreaRenderer.drawGamePieces(ctx, sortedPieces, draggedPiece, debugMode, debugMode, interactingPieceId, temporaryDraggedPieceId, animatingPieceId);
        } else {
          // Fallback legacy
          if (pieces && pieces.length > 0) {
            // Sort pieces by y-coordinate (bottom to top) to ensure proper z-order
            const sortedPieces = [...pieces].sort((a, b) => b.y - a.y);

            sortedPieces.forEach(piece => {
              if (piece) {
                drawPiece(ctx, piece, piece.x, piece.y, PIECE_SIZE);

                // BORDE VISUAL para pieza que se está arrastrando
                if (draggedPiece && piece.id === draggedPiece.id) {
                  ctx.save();
                  ctx.strokeStyle = '#00ff00';
                  ctx.lineWidth = 4;
                  ctx.shadowColor = '#00ff00';
                  ctx.shadowBlur = 8;

                  const borderSize = PIECE_SIZE * 1.7;
                  const borderX = piece.x - (borderSize - PIECE_SIZE) / 2;
                  const borderY = piece.y - (borderSize - PIECE_SIZE) / 2;
                  ctx.strokeRect(borderX, borderY, borderSize, borderSize);

                  ctx.restore();
                }
              }
            });
          }
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
      }, [pieces, currentChallenge, challenges, challengeValidations, debugMode]); // Incluir debugMode para redibujar

      return (
          <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="cursor-pointer bg-white shadow-2xl"
                style={{
                  width: `${canvasDimensions.width}px`,
                  height: `${canvasDimensions.height}px`,
                  border: '3px solid #e5e7eb',
                  borderRadius: '16px',
                  boxShadow: `
                    0 0 0 1px rgba(0, 0, 0, 0.05),
                    0 1px 3px rgba(0, 0, 0, 0.1),
                    0 4px 12px rgba(0, 0, 0, 0.15),
                    0 0 0 3px rgba(59, 130, 246, 0.1)
                  `
                }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onContextMenu={onContextMenu}
            />
          </div>
      );
    }
);

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;
