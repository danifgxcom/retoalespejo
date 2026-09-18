import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useMemo, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Piece, drawPiece } from './GamePiece';
import { Challenge } from './ChallengeCard';
import { GameGeometry, PLACEMENT_GRID_PX } from '@reto/geometry';
import { GameAreaRenderer } from '../rendering/GameAreaRenderer';
import { CANVAS_CONSTANTS } from '../utils/canvas/CanvasConstants';
import { CanvasDrawing } from '../utils/canvas/CanvasDrawing';
import { getPieceRadius } from '@reto/geometry';
import VisuallyHidden from './accessibility/VisuallyHidden';
import { GAME_NAME } from '../branding';

/** Grosor del marco del canvas: se descuenta del espacio disponible para que
 *  el mapa de bits y la caja de contenido midan exactamente lo mismo. */
const CANVAS_FRAME_PX = 3;

interface GameCanvasProps {
  pieces: Piece[];
  currentChallenge: number;
  challenges: Challenge[];
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerLeave: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  geometry: GameGeometry;
  debugMode?: boolean;
  showGrid?: boolean;
  draggedPiece?: Piece | null;
  interactingPieceId?: number | null;
  temporaryDraggedPieceId?: number | null;
  animatingPieceId?: number | null;
  /** F10: índice (en el array `pieces` recibido) de la pieza que señala la
   *  última validación fallida, para resaltarla en el lienzo. */
  highlightedPieceId?: number | null;
  // Control por teclado: reutiliza las mismas funciones que usePointerHandlers/GameControls
  setPieces: React.Dispatch<React.SetStateAction<Piece[]>>;
  onRotatePiece: (pieceId: number, fromControl?: boolean) => void;
  onRotatePieceCounterClockwise: (pieceId: number, fromControl?: boolean) => void;
  onFlipPiece: (pieceId: number, fromControl?: boolean) => void;
  /** Comunica la selección de teclado a los controles situados fuera del canvas. */
  onSelectedPieceChange?: (pieceId: number | null) => void;
  // F13: registra el estado anterior al mover una pieza con el teclado.
  // Opcional para no obligar a los tests que no ejercitan deshacer/rehacer.
  pushHistory?: (snapshot: Piece[]) => void;
}

export interface GameCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
}

const GameCanvas = forwardRef<GameCanvasRef, GameCanvasProps>(
    ({ pieces, currentChallenge, challenges, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onPointerLeave, onContextMenu, geometry, debugMode = false, showGrid = false, draggedPiece, interactingPieceId, temporaryDraggedPieceId, animatingPieceId, highlightedPieceId = null, setPieces, onRotatePiece, onRotatePieceCounterClockwise, onFlipPiece, onSelectedPieceChange, pushHistory = () => {} }, ref) => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const containerRef = useRef<HTMLDivElement>(null);
      // F21: única fuente de verdad del tema - se lee del contexto, nunca de
      // localStorage, y se re-renderiza cuando cambia cualquiera de sus ejes.
      const { resolvedClarity, highContrast } = useTheme();
      const isDarkClarity = resolvedClarity === 'dark';
      // Almacenar los resultados de validación para cada desafío
      const [challengeValidations, setChallengeValidations] = useState<Record<number, ReturnType<GameGeometry['validateChallengeCard']>>>({});

      // Accesibilidad por teclado: pieza seleccionada al recorrer con Tab, y
      // anuncio para lectores de pantalla (región aria-live).
      const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
      const [announcement, setAnnouncement] = useState('');

      // Si cambia el desafío, la selección anterior ya no tiene sentido.
      useEffect(() => {
        setSelectedPieceId(null);
        onSelectedPieceChange?.(null);
      }, [currentChallenge, onSelectedPieceChange]);
      
      // Responsive canvas dimensions
      // 0 hasta la primera medición: evita un canvas gigante en el primer
      // frame que desbordaría el contenedor (muy visible con zoom).
      const [canvasDimensions, setCanvasDimensions] = useState({
        width: 0,
        height: 0,
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

          // Espacio disponible real del contenedor. Con zoom del navegador el
          // contenedor puede medir 0 en el primer frame: en ese caso no se
          // recalcula para no dejar el canvas con un tamaño absurdo.
          const frame = 2 * CANVAS_FRAME_PX;
          const availableWidth = container.clientWidth - frame;
          const availableHeight = container.clientHeight - frame;
          if (availableWidth < 1 || availableHeight < 1) return;
          
          // Base aspect ratio from constants
          const baseAspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT; // 1.4

          // Calculate dimensions that fit in container while maintaining aspect ratio.
          // SIEMPRE se conserva la proporción, en todos los tamaños: el jugador
          // juzga encajes, giros de 45° y simetría contra la figura objetivo, así
          // que un cuadrado que deja de ser cuadrado rompe el juego, no sólo la
          // estética. En vertical esto limita el lienzo a ~30% de la pantalla
          // (390px de ancho / 1.4 ≈ 279px de alto): es el máximo honesto, no un
          // defecto a corregir deformando la figura.
          let newWidth = availableWidth;
          let newHeight = availableWidth / baseAspectRatio;

          // If height exceeds container, adjust based on height
          if (newHeight > availableHeight) {
            newHeight = availableHeight;
            newWidth = availableHeight * baseAspectRatio;
          }

          // Calculate scale factor for coordinate transformation
          const scale = newWidth / CANVAS_WIDTH;
          
          setCanvasDimensions(prev => {
            const width = Math.max(1, Math.floor(newWidth));
            const height = Math.max(1, Math.floor(newHeight));
            if (prev.width === width && prev.height === height) return prev;
            return { width, height, scale };
          });
          
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

      // Grid drawing function - simple uniform grid for all pieces
      const drawGrid = (ctx: CanvasRenderingContext2D) => {
        const gridSize = 10; // Same as GRID_SIZE in useMouseHandlers - uniform for all pieces
        
        ctx.save();
        
        // Draw main grid lines (every 10px) - clear and visible
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.15)';
        ctx.lineWidth = 0.8;
        
        // Draw vertical lines
        for (let x = 0; x <= GAME_AREA_WIDTH; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, GAME_AREA_HEIGHT);
          ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= GAME_AREA_HEIGHT; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(GAME_AREA_WIDTH, y);
          ctx.stroke();
        }
        
        // Draw thicker reference lines every 50px for visual reference
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.3)';
        ctx.lineWidth = 1.5;
        
        const majorGridSize = 50;
        
        // Draw major vertical lines
        for (let x = 0; x <= GAME_AREA_WIDTH; x += majorGridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, GAME_AREA_HEIGHT);
          ctx.stroke();
        }
        
        // Draw major horizontal lines
        for (let y = 0; y <= GAME_AREA_HEIGHT; y += majorGridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(GAME_AREA_WIDTH, y);
          ctx.stroke();
        }
        
        // Add simple grid info
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(0, 100, 255, 0.8)';
        ctx.fillText('Grid Fijo: 10px uniforme', 10, GAME_AREA_HEIGHT - 15);
        
        ctx.restore();
      };

      // Use shared drawing utility with theme colors - Cross-browser compatible version
      const drawBackgroundAreas = (ctx: CanvasRenderingContext2D) => {
        // F21: la claridad (light/dark) del contexto, no localStorage ni una
        // rama de body class.
        const canvasBg = isDarkClarity
          ? '#1e293b' // Dark navy en claridad oscura
          : 'rgba(248, 250, 252, 0.95)'; // Light blue-tinted en claridad clara

        // Fill entire canvas with theme background
        ctx.fillStyle = canvasBg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Create theme-aware gradients for areas
        drawThemeAwareBackgroundAreas(ctx, isDarkClarity);
      };

      // Theme-aware background areas that work cross-browser
      const drawThemeAwareBackgroundAreas = (ctx: CanvasRenderingContext2D, isDark: boolean) => {
        const { GAME_AREA_WIDTH, GAME_AREA_HEIGHT, BOTTOM_AREA_HEIGHT, MIRROR_LINE } = CANVAS_CONSTANTS;

        // Define colors based on theme
        const colors = isDark ? {
          // Accessible theme colors - high contrast
          gameArea1: '#334155',    // Dark slate
          gameArea2: '#1e293b',    // Darker slate  
          gameArea3: '#0f172a',    // Very dark navy
          mirrorArea1: '#374151',  // Medium slate
          mirrorArea2: '#1f2937',  // Dark gray
          pieceArea1: '#374151',   // Medium slate
          pieceArea2: '#1e293b',   // Dark slate
        } : {
          // Colorful theme colors - light and vibrant
          gameArea1: '#ffffff',    // White
          gameArea2: '#f8fafc',    // Very light blue
          gameArea3: '#e2e8f0',    // Light blue-gray
          mirrorArea1: '#e8f4f8',  // Light cyan
          mirrorArea2: '#d6eaf8',  // Slightly darker cyan
          pieceArea1: '#fef7ed',   // Light orange
          pieceArea2: '#f3e8ff',   // Light purple
        };

        // Game area gradient
        const gameGradient = ctx.createRadialGradient(
          GAME_AREA_WIDTH / 2, GAME_AREA_HEIGHT / 2, 0,
          GAME_AREA_WIDTH / 2, GAME_AREA_HEIGHT / 2, GAME_AREA_WIDTH
        );
        gameGradient.addColorStop(0, colors.gameArea1);
        gameGradient.addColorStop(0.6, colors.gameArea2);
        gameGradient.addColorStop(1, colors.gameArea3);
        ctx.fillStyle = gameGradient;
        ctx.fillRect(0, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);

        // Mirror area gradient
        const mirrorGradient = ctx.createLinearGradient(MIRROR_LINE, 0, MIRROR_LINE + GAME_AREA_WIDTH, 0);
        mirrorGradient.addColorStop(0, colors.mirrorArea2);
        mirrorGradient.addColorStop(0.2, colors.gameArea2);
        mirrorGradient.addColorStop(0.5, colors.gameArea1);
        mirrorGradient.addColorStop(0.8, colors.gameArea2);
        mirrorGradient.addColorStop(1, colors.mirrorArea1);
        ctx.fillStyle = mirrorGradient;
        ctx.fillRect(MIRROR_LINE, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);

        // Piece storage area - Extended to full width
        const pieceGradient = ctx.createLinearGradient(0, GAME_AREA_HEIGHT, 0, GAME_AREA_HEIGHT + BOTTOM_AREA_HEIGHT);
        pieceGradient.addColorStop(0, colors.pieceArea1);
        pieceGradient.addColorStop(1, colors.pieceArea2);
        ctx.fillStyle = pieceGradient;
        ctx.fillRect(0, GAME_AREA_HEIGHT, GAME_AREA_WIDTH * 2, BOTTOM_AREA_HEIGHT);

        // Draw grid overlay if enabled
        if (showGrid) {
          drawGrid(ctx);
        }
      };

      // Dibujar marco de espejo clásico en bordes exteriores y líneas divisorias elegantes
      const drawMirrorFrameAndDivisions = (ctx: CanvasRenderingContext2D) => {
        // Líneas divisorias PRIMERO (sin marco interferiendo)

        // Use shared mirror line drawing
        CanvasDrawing.drawMirrorLine(ctx);

        // Divisoria horizontal elegante
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, GAME_AREA_HEIGHT);
        ctx.lineTo(CANVAS_WIDTH, GAME_AREA_HEIGHT);
        ctx.stroke();

        // Sombra sutil bajo la divisoria horizontal
        const shadowGradient = ctx.createLinearGradient(0, GAME_AREA_HEIGHT, 0, GAME_AREA_HEIGHT + 15);
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.fillRect(0, GAME_AREA_HEIGHT, CANVAS_WIDTH, 15);

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

        // Theme-aware text colors
        const primaryTextColor = isDarkClarity ? '#f1f5f9' : '#1e293b';
        const secondaryTextColor = isDarkClarity ? '#cbd5e1' : '#64748b';

        // Área de juego
        drawTextWithShadow('🎮 ÁREA DE JUEGO', 15, 30, primaryTextColor);

        // Espejo con icono
        drawTextWithShadow('🪞 ESPEJO', MIRROR_LINE + 15, 30, primaryTextColor);

        // Piezas disponibles
        drawTextWithShadow('🧩 PIEZAS DISPONIBLES', 15, GAME_AREA_HEIGHT + 30, primaryTextColor);

        // Agregar subtítulos descriptivos
        ctx.font = '13px "Segoe UI", sans-serif';
        drawTextWithShadow('Arrastra aquí tus piezas', 15, 50, secondaryTextColor);
        drawTextWithShadow('Reflejo automático', MIRROR_LINE + 15, 50, secondaryTextColor);
        drawTextWithShadow('Haz clic para rotar/voltear', 15, GAME_AREA_HEIGHT + 50, secondaryTextColor);
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
            const pieceBottomWithMargin = piece.y + getPieceRadius(PIECE_SIZE) + entryMargin;
            const isEnteringFromBelow = pieceBottomWithMargin > GAME_AREA_HEIGHT;
            const isInsideGameArea = piece.y < GAME_AREA_HEIGHT;

            if (isEnteringFromBelow || isInsideGameArea) {
              ctx.save();

              // Reflexión real: la pieza se dibuja en su posición normal y es
              // el contexto el que la espeja respecto a la línea del espejo
              ctx.translate(2 * MIRROR_LINE, 0);
              ctx.scale(-1, 1);

              // Crear pieza con ligera transparencia para efecto espejo
              const mirrorPiece = {
                ...piece,
                centerColor: piece.centerColor + 'E6', // 90% opacidad
                triangleColor: piece.triangleColor + 'E6'
              };

              drawPiece(ctx, mirrorPiece, piece.x, piece.y, PIECE_SIZE);
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

      // Dibujar canvas principal
      const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx || canvasDimensions.width < 1) return;

        // El mapa de bits sigue al tamaño CSS y al zoom del navegador
        // (devicePixelRatio); el dibujo se hace siempre en el espacio lógico
        // 1400x1000, así que la nitidez se mantiene a cualquier zoom.
        const dpr = window.devicePixelRatio || 1;
        const bitmapWidth = Math.max(1, Math.round(canvasDimensions.width * dpr));
        const bitmapHeight = Math.max(1, Math.round(canvasDimensions.height * dpr));
        if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
          canvas.width = bitmapWidth;
          canvas.height = bitmapHeight;
        }
        ctx.setTransform(bitmapWidth / CANVAS_WIDTH, 0, 0, bitmapHeight / CANVAS_HEIGHT, 0, 0);

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        drawBackgroundAreas(ctx);
        drawMirrorFrameAndDivisions(ctx);

        // DEBUG MODE: Etiquetas de áreas solo en modo debug
        if (debugMode) {
          drawAreaLabels(ctx);
        }

        // DEBUG MODE: Dibujar límites y información de debug
        if (debugMode) {
          // Dibujar límites del área de piezas disponibles (extended)
          ctx.strokeStyle = 'blue';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 5]);
          ctx.strokeRect(0, GAME_AREA_HEIGHT, GAME_AREA_WIDTH * 2, BOTTOM_AREA_HEIGHT);
          ctx.setLineDash([]);

          // Etiquetas de coordenadas y áreas
          ctx.fillStyle = 'blue';
          ctx.font = 'bold 14px Arial';
          ctx.fillText(`ÁREA PIEZAS EXTENDIDA: (0,${GAME_AREA_HEIGHT}) a (${GAME_AREA_WIDTH * 2},${CANVAS_HEIGHT})`, 10, GAME_AREA_HEIGHT + 70);
        }

        // USAR GAMEAREARENDERER para dibujar piezas con etiquetas interactivas
        if (gameAreaRenderer) {
          // Sort pieces by y-coordinate (bottom to top) to ensure proper z-order
          // This ensures pieces at the bottom are drawn first, and pieces at the top are drawn last
          const sortedPieces = [...pieces].sort((a, b) => b.y - a.y);
          gameAreaRenderer.drawGamePieces(ctx, sortedPieces, draggedPiece ?? null, debugMode, debugMode, interactingPieceId, temporaryDraggedPieceId, animatingPieceId, highContrast, highlightedPieceId);
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
      };

      // Validar todos los desafíos una sola vez al inicializar el componente
      useEffect(() => {
        const validations: Record<number, ReturnType<GameGeometry['validateChallengeCard']>> = {};
        if (challenges && challenges.length > 0) {
          challenges.forEach(challenge => {
            if (challenge && challenge.id !== undefined && challenge.objective && challenge.objective.playerPieces) {
              // Usar validación real según las reglas del juego
              const validation = geometry.validateChallengeCard(challenge.objective.playerPieces);
              validations[challenge.id] = validation;
            }
          });
        }
        setChallengeValidations(validations);
      }, [challenges, geometry]);

      useEffect(() => {
        // Use requestAnimationFrame for smooth rendering during piece movement
        const animationId = requestAnimationFrame(() => {
          drawCanvas();
        });
        
        return () => cancelAnimationFrame(animationId);
      }, [pieces, currentChallenge, challenges, challengeValidations, debugMode, showGrid, resolvedClarity, highContrast, highlightedPieceId, canvasDimensions]);

      // Control por teclado: Tab/Shift+Tab recorren las piezas, flechas las
      // mueven, R/Shift+R rotan, F voltea, Espacio/Enter selecciona o suelta,
      // Escape sale del canvas. Reutiliza las mismas funciones que el arrastre
      // con puntero (setPieces, onRotatePiece, onRotatePieceCounterClockwise,
      // onFlipPiece) para no duplicar lógica.
      const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLCanvasElement>) => {
        // Tab dentro del canvas recorre las piezas en vez de mover el foco fuera.
        if (e.key === 'Tab') {
          e.preventDefault();
          if (pieces.length === 0) return;
          const currentIndex = pieces.findIndex(p => p.id === selectedPieceId);
          const direction = e.shiftKey ? -1 : 1;
          const nextIndex = currentIndex === -1
              ? (direction === 1 ? 0 : pieces.length - 1)
              : (currentIndex + direction + pieces.length) % pieces.length;
          const nextPiece = pieces[nextIndex];
          setSelectedPieceId(nextPiece.id);
          onSelectedPieceChange?.(nextPiece.id);
          setAnnouncement(`Pieza ${nextPiece.id} seleccionada`);
          return;
        }

        if (e.key === 'Escape') {
          setSelectedPieceId(null);
          onSelectedPieceChange?.(null);
          canvasRef.current?.blur();
          return;
        }

        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (selectedPieceId === null) {
            if (pieces.length === 0) return;
            setSelectedPieceId(pieces[0].id);
            onSelectedPieceChange?.(pieces[0].id);
            setAnnouncement(`Pieza ${pieces[0].id} seleccionada`);
          } else {
            setAnnouncement(`Pieza ${selectedPieceId} soltada`);
            setSelectedPieceId(null);
            onSelectedPieceChange?.(null);
          }
          return;
        }

        if (selectedPieceId === null) return;
        const piece = pieces.find(p => p.id === selectedPieceId);
        if (!piece) return;

        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          if (e.shiftKey) {
            onRotatePieceCounterClockwise(piece.id, true);
            setAnnouncement(`Pieza ${piece.id} girada a ${(piece.rotation - 45 + 360) % 360} grados`);
          } else {
            onRotatePiece(piece.id, true);
            setAnnouncement(`Pieza ${piece.id} girada a ${(piece.rotation + 45) % 360} grados`);
          }
          return;
        }

        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          onFlipPiece(piece.id, true);
          setAnnouncement(`Pieza ${piece.id} volteada`);
          return;
        }

        const step = e.shiftKey ? 1 : PLACEMENT_GRID_PX;
        let dx = 0;
        let dy = 0;
        switch (e.key) {
          case 'ArrowUp': dy = -step; break;
          case 'ArrowDown': dy = step; break;
          case 'ArrowLeft': dx = -step; break;
          case 'ArrowRight': dx = step; break;
          default: return;
        }
        e.preventDefault();

        const constrained = geometry.constrainPiecePosition(
            { type: piece.type, face: piece.face, rotation: piece.rotation, x: piece.x + dx, y: piece.y + dy },
            CANVAS_WIDTH,
            CANVAS_HEIGHT,
            true
        );

        // F13: un movimiento de teclado es una acción discreta y completa
        // (no hay "posiciones intermedias" como en el arrastre), así que se
        // registra siempre que realmente cambie la posición.
        if (constrained.x !== piece.x || constrained.y !== piece.y) {
          pushHistory(pieces);
        }

        setPieces(prevPieces => prevPieces.map(p => {
          if (p.id !== piece.id) return p;
          const moved = { ...p, x: constrained.x, y: constrained.y };
          return { ...moved, placed: geometry.isPieceInGameArea(moved) };
        }));

        if (geometry.isPieceTouchingMirror({ ...piece, x: constrained.x, y: constrained.y })) {
          setAnnouncement(`Pieza ${piece.id} toca el espejo`);
        }
      }, [pieces, selectedPieceId, geometry, setPieces, onRotatePiece, onRotatePieceCounterClockwise, onFlipPiece, onSelectedPieceChange, pushHistory, CANVAS_WIDTH, CANVAS_HEIGHT]);

      return (
          <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="cursor-pointer shadow-2xl"
                tabIndex={0}
                // eslint-disable-next-line jsx-a11y/no-interactive-element-to-noninteractive-role -- patrón ARIA recomendado (APG) para un canvas con su propio modelo de teclado
                role="application"
                aria-label={`Área de juego de ${GAME_NAME}. Arrastra las piezas o usa el teclado: Tab para elegir una pieza, flechas para moverla (mantén Mayús para un paso fino de 1 píxel), R para girarla en sentido horario, Mayús+R en sentido antihorario, F para voltearla, Espacio o Enter para seleccionarla o soltarla, y Escape para salir del área de juego.`}
                style={{
                  boxSizing: 'content-box',
                  width: `${canvasDimensions.width}px`,
                  height: `${canvasDimensions.height}px`,
                  backgroundColor: 'var(--canvas-bg-light)',
                  border: `${CANVAS_FRAME_PX}px solid var(--border-medium)`,
                  borderRadius: '18px',
                  touchAction: 'none',
                  display: 'block',
                  boxShadow: '0 18px 40px -18px var(--game-shadow), 0 2px 6px var(--game-shadow)'
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onPointerLeave={onPointerLeave}
                onContextMenu={onContextMenu}
                onKeyDown={handleKeyDown}
            />
            {/* Anuncios para lectores de pantalla: selección, giro, volteo, contacto con el espejo... */}
            <div aria-live="polite" aria-atomic="true">
              <VisuallyHidden>{announcement}</VisuallyHidden>
            </div>
          </div>
      );
    }
);

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;
