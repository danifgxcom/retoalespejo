import { useCallback } from 'react';
import { Piece } from '../components/GamePiece';

interface UseMouseHandlersProps {
  pieces: Piece[];
  draggedPiece: Piece | null;
  dragOffset: { x: number; y: number };
  setPieces: (pieces: Piece[]) => void;
  setDraggedPiece: (piece: Piece | null) => void;
  setDragOffset: (offset: { x: number; y: number }) => void;
  isPieceHit: (piece: Piece, x: number, y: number) => boolean;
  canvasRef: React.RefObject<{ getCanvas: () => HTMLCanvasElement | null }>;
  rotatePiece: (pieceId: number) => void;
}

/**
 * Calcula el cuadro delimitador de una pieza considerando su rotación
 */
const getPieceBoundingBox = (piece: Piece) => {
  const size = 80;
  const unit = size * 1.28;
  const rad = (piece.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Vértices del contorno de la pieza
  const shapeVertices = [
    [0, 0], [1, 0], [2, 0], [2.5, 0.5], [2, 1], [1.5, 1.5], [1, 1],
  ];

  let minRotX = Infinity, maxRotX = -Infinity;
  let minRotY = Infinity, maxRotY = -Infinity;

  for (const [x_u, y_u] of shapeVertices) {
    // Transforma las coordenadas de la unidad local al sistema de dibujo (relativo al centro de rotación)
    let localX = x_u * unit;
    const localY = -y_u * unit; // El eje Y del canvas está invertido

    // Si es pieza tipo B, aplicar el volteo horizontal
    if (piece.type === 'B') {
      localX = -localX;
    }

    // Aplica la rotación a cada vértice
    const rotatedX = localX * cos - localY * sin;
    const rotatedY = localX * sin + localY * cos;

    // Encuentra los puntos extremos (mínimos y máximos) después de la rotación
    minRotX = Math.min(minRotX, rotatedX);
    maxRotX = Math.max(maxRotX, rotatedX);
    minRotY = Math.min(minRotY, rotatedY);
    maxRotY = Math.max(maxRotY, rotatedY);
  }

  // El centro de rotación real en el canvas
  const centerX = piece.x + size / 2;
  const centerY = piece.y + size / 2;

  // Devuelve las coordenadas absolutas del cuadro delimitador en el canvas
  return {
    left: centerX + minRotX,
    right: centerX + maxRotX,
    top: centerY + minRotY,
    bottom: centerY + maxRotY,
  };
};

/**
 * Determina si una pieza está en el área de juego (donde debe aparecer el reflejo)
 */
const isPieceInGameArea = (piece: Piece) => {
  const gameAreaMaxY = 600; // Área de juego actualizada va desde Y=0 hasta Y=600
  return piece.y < gameAreaMaxY;
};

/**
 * Ajusta la posición de una pieza para que no salga de los límites permitidos
 * Permite que las piezas toquen la línea del espejo pero no se metan completamente
 */
const constrainPiecePosition = (piece: Piece, canvasWidth: number, canvasHeight: number, mirrorLine: number) => {
  const bbox = getPieceBoundingBox(piece);
  let newX = piece.x;
  let newY = piece.y;

  // Límite izquierdo del canvas
  if (bbox.left < 0) {
    const overlap = -bbox.left;
    newX = piece.x + overlap;
  }

  // Límite del espejo: ninguna parte de la pieza puede meterse en el espejo
  if (bbox.right > mirrorLine) {
    // Alguna parte de la pieza se está metiendo en el espejo
    const overlap = bbox.right - mirrorLine;
    newX = piece.x - overlap; // Mover la pieza hacia atrás exactamente lo necesario
  }

  // Límites verticales
  if (bbox.bottom > canvasHeight) {
    const overlap = bbox.bottom - canvasHeight;
    newY = piece.y - overlap;
  }
  
  if (bbox.top < 0) {
    const overlap = -bbox.top;
    newY = piece.y + overlap;
  }

  return { x: newX, y: newY };
};

export const useMouseHandlers = ({
                                   pieces,
                                   draggedPiece,
                                   dragOffset,
                                   setPieces,
                                   setDraggedPiece,
                                   setDragOffset,
                                   isPieceHit,
                                   canvasRef,
                                   rotatePiece
                                 }: UseMouseHandlersProps) => {
  const mirrorLine = 700; // Línea del espejo

  // Helper para obtener coordenadas del mouse en el canvas
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      canvas
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const clickedPiece = pieces.slice().reverse().find((piece) => isPieceHit(piece, coords.x, coords.y));
    if (clickedPiece) {
      setDraggedPiece(clickedPiece);
      setDragOffset({ x: coords.x - clickedPiece.x, y: coords.y - clickedPiece.y });
    }
  }, [canvasRef, pieces, isPieceHit, setDraggedPiece, setDragOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedPiece) return;

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const x = coords.x - dragOffset.x;
    const y = coords.y - dragOffset.y;

    // Crea una pieza temporal para calcular su BBox en la nueva posición
    const tempPiece = { ...draggedPiece, x, y };
    const constrainedPosition = constrainPiecePosition(tempPiece, coords.canvas.width, coords.canvas.height, mirrorLine);

    // Actualiza la posición de la pieza y determina si está en el área de juego
    setPieces((prevPieces) =>
        prevPieces.map((p) => {
          if (p.id === draggedPiece.id) {
            const updatedPiece = { ...p, x: constrainedPosition.x, y: constrainedPosition.y };
            updatedPiece.placed = isPieceInGameArea(updatedPiece);
            return updatedPiece;
          }
          return p;
        })
    );
  }, [draggedPiece, dragOffset, setPieces, canvasRef]);

  const handleMouseUp = useCallback(() => {
    if (draggedPiece) {
      // Al soltar la pieza, asegurarse de que el estado 'placed' esté actualizado
      setPieces((prevPieces) =>
          prevPieces.map((p) => {
            if (p.id === draggedPiece.id) {
              const updatedPiece = { ...p };
              // Marcar como 'placed' si está en el área de juego
              updatedPiece.placed = isPieceInGameArea(updatedPiece);
              return updatedPiece;
            }
            return p;
          })
      );
    }
    setDraggedPiece(null);
  }, [draggedPiece, setDraggedPiece, setPieces]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const clickedPiece = pieces.slice().reverse().find((p) => isPieceHit(p, coords.x, coords.y));
    if (clickedPiece) {
      rotatePiece(clickedPiece.id);
    }
  }, [canvasRef, pieces, isPieceHit, rotatePiece]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
  };
};