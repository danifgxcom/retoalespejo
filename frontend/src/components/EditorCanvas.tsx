import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Piece, drawPiece, drawPieceDebugInfo } from './GamePiece';
import { GameGeometry } from '@reto/geometry';
import { getPieceRadius } from '@reto/geometry';

interface EditorCanvasProps {
  pieces: Piece[];
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  geometry: GameGeometry;
  debugMode?: boolean;
  draggedPiece?: Piece | null;
}

export interface EditorCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
}

const EditorCanvas = forwardRef<EditorCanvasRef, EditorCanvasProps>(
  ({ pieces, onPointerDown, onPointerMove, onPointerUp, onContextMenu, debugMode = false, draggedPiece }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const PIECE_SIZE = 100;

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

    // Constantes del canvas
    const GAME_AREA_WIDTH = 700;
    const GAME_AREA_HEIGHT = 600;
    const BOTTOM_AREA_HEIGHT = 400;
    const MIRROR_LINE = 700;
    const CANVAS_WIDTH = 1400; // Game area + mirror area
    const CANVAS_HEIGHT = 1000; // Game area + piece storage

    // Dibujar áreas de fondo
    const drawBackgroundAreas = (ctx: CanvasRenderingContext2D) => {
      // Área de juego con gradiente radial elegante
      const gameGradient = ctx.createRadialGradient(
        GAME_AREA_WIDTH / 2, GAME_AREA_HEIGHT / 2, 0, 
        GAME_AREA_WIDTH / 2, GAME_AREA_HEIGHT / 2, GAME_AREA_WIDTH
      );
      gameGradient.addColorStop(0, '#ffffff');
      gameGradient.addColorStop(0.6, '#f8fafc');
      gameGradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gameGradient;
      ctx.fillRect(0, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);

      // Área de espejo con efecto metálico
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
      ctx.fillRect(0, GAME_AREA_HEIGHT, CANVAS_WIDTH, BOTTOM_AREA_HEIGHT);

      // Línea del espejo con efecto brillante
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([15, 10]);
      ctx.lineDashOffset = 0;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(MIRROR_LINE, 0);
      ctx.lineTo(MIRROR_LINE, GAME_AREA_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Bordes decorativos
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);
      ctx.strokeRect(MIRROR_LINE, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);
      ctx.strokeRect(0, GAME_AREA_HEIGHT, CANVAS_WIDTH, BOTTOM_AREA_HEIGHT);
    };

    // Dibujar etiquetas de áreas (solo en modo debug)
    const drawAreaLabels = (ctx: CanvasRenderingContext2D) => {
      if (!debugMode) return;
      
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';

      // Etiqueta del área de juego
      ctx.fillText('🎯 ÁREA DE JUEGO', 20, 35);

      // Etiqueta del área del espejo
      ctx.fillText('🪞 ÁREA DEL ESPEJO', MIRROR_LINE + 20, 35);

      // Etiqueta del área de piezas disponibles
      ctx.fillText('🧩 PIEZAS DISPONIBLES', 20, GAME_AREA_HEIGHT + 35);
    };

    // Dibujar grid de referencia (solo en modo debug)
    const drawReferenceGrid = (ctx: CanvasRenderingContext2D) => {
      if (!debugMode) return;
      
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 8]);

      // Grid vertical en área de juego
      for (let x = 50; x < GAME_AREA_WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_AREA_HEIGHT);
        ctx.stroke();
      }

      // Grid horizontal en área de juego
      for (let y = 50; y < GAME_AREA_HEIGHT; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_AREA_WIDTH, y);
        ctx.stroke();
      }

      // Grid en área del espejo
      for (let x = MIRROR_LINE + 50; x < CANVAS_WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_AREA_HEIGHT);
        ctx.stroke();
      }

      for (let y = 50; y < GAME_AREA_HEIGHT; y += 50) {
        ctx.beginPath();
        ctx.moveTo(MIRROR_LINE, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    };

    // Dibujar piezas y sus reflejos
    const drawPiecesAndReflections = (ctx: CanvasRenderingContext2D) => {
      pieces.forEach((piece) => {
        // BORDE VISUAL para pieza que se está arrastrando
        if (draggedPiece && piece.id === draggedPiece.id) {
          ctx.save();
          ctx.strokeStyle = '#00ff00'; // Verde brillante
          ctx.lineWidth = 4;
          ctx.shadowColor = '#00ff00';
          ctx.shadowBlur = 8;

          // Dibujar borde alrededor de la pieza, centrado en su ancla real
          const borderRadius = getPieceRadius(PIECE_SIZE) * 1.15;
          ctx.strokeRect(piece.x - borderRadius, piece.y - borderRadius, borderRadius * 2, borderRadius * 2);

          ctx.restore();
        }

        // Dibujar pieza original
        drawPiece(ctx, piece, piece.x, piece.y, PIECE_SIZE);

        // Dibujar info de debug encima de cada pieza
        drawPieceDebugInfo(ctx, piece, piece.x, piece.y, PIECE_SIZE, debugMode);

        // Si la pieza está en el área de juego, dibujar su reflejo
        if (piece.placed && piece.y < GAME_AREA_HEIGHT) {
          const reflectedX = 2 * MIRROR_LINE - piece.x;

          // Reflejo real: se dibuja la pieza en su posición original y es el
          // contexto el que la espeja respecto a la línea del espejo
          ctx.save();
          ctx.translate(2 * MIRROR_LINE, 0);
          ctx.scale(-1, 1);
          drawPiece(ctx, piece, piece.x, piece.y, PIECE_SIZE);
          ctx.restore();

          // Dibujar info de debug también en el reflejo
          const reflectedPiece = { ...piece, id: piece.id + 100 }; // ID diferente para reflejo
          drawPieceDebugInfo(ctx, reflectedPiece, reflectedX, piece.y, PIECE_SIZE, debugMode);
        }
      });

    };

    // Función principal de dibujo
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Limpiar canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Dibujar componentes
      drawBackgroundAreas(ctx);
      drawReferenceGrid(ctx);
      drawAreaLabels(ctx);
      drawPiecesAndReflections(ctx);
    };

    // Efecto para redibujar cuando cambien las piezas o el modo debug
    useEffect(() => {
      draw();
    }, [pieces, debugMode, draggedPiece]);

    return (
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="cursor-move shadow-xl"
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          border: '15px solid #8b5a3c',
          borderRadius: '8px',
          boxShadow: `
            inset 0 0 0 6px #d4af37,
            inset 0 0 0 10px #8b5a3c,
            0 8px 25px rgba(0, 0, 0, 0.3),
            0 0 15px rgba(212, 175, 55, 0.2)
          `,
          touchAction: 'none'
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={onContextMenu}
      />
    );
  }
);

EditorCanvas.displayName = 'EditorCanvas';

export default EditorCanvas;
