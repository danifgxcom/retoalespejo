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
  rotatePiece: (pieceId: number) => void; // Nueva función añadida
}

/**
 * Calcula el cuadro delimitador (bounding box) exacto de una pieza,
 * teniendo en cuenta su rotación. Esto es crucial para la detección
 * precisa de colisiones con los bordes y el espejo.
 */
const getPieceBoundingBox = (piece: Piece) => {
  const size = 80;
  const unit = size * 1.28;
  const rad = (piece.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Vértices que definen el contorno exterior de la forma de la pieza.
  // Usar todos los vértices garantiza que capturemos los puntos extremos.
  const shapeVertices = [
    [0, 0], [1, 0], [2, 0], [2.5, 0.5], [2, 1], [1.5, 1.5], [1, 1],
  ];

  let minRotX = Infinity, maxRotX = -Infinity;
  let minRotY = Infinity, maxRotY = -Infinity;

  for (const [x_u, y_u] of shapeVertices) {
    // Transforma las coordenadas de la unidad local al sistema de dibujo (relativo al centro de rotación)
    const localX = x_u * unit;
    const localY = -y_u * unit; // El eje Y del canvas está invertido

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
  const gameAreaMaxY = 500; // Área de juego actualizada va desde Y=0 hasta Y=500
  return piece.y < gameAreaMaxY;
};

/**
 * Ajusta la posición de una pieza para que no salga de los límites permitidos
 */
const constrainPiecePosition = (piece: Piece, canvasWidth: number, canvasHeight: number, mirrorLine: number) => {
  const bbox = getPieceBoundingBox(piece);
  let newX = piece.x;
  let newY = piece.y;

  // Ajustar para que no cruce los límites horizontales
  if (bbox.right > mirrorLine) {
    newX -= (bbox.right - mirrorLine);
  }
  if (bbox.left < 0) {
    newX += -bbox.left;
  }

  // Ajustar para que no cruce los límites verticales
  if (bbox.bottom > canvasHeight) {
    newY -= (bbox.bottom - canvasHeight);
  }
  if (bbox.top < 0) {
    newY += -bbox.top;
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
                                   rotatePiece, // Nueva función recibida
                                 }: UseMouseHandlersProps) => {
  const mirrorLine = 700; // Línea del espejo

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clickedPiece = pieces.slice().reverse().find((piece) => isPieceHit(piece, x, y));
    if (clickedPiece) {
      setDraggedPiece(clickedPiece);
      setDragOffset({ x: x - clickedPiece.x, y: y - clickedPiece.y });
    }
  }, [canvasRef, pieces, isPieceHit, setDraggedPiece, setDragOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedPiece) return;

    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (e.clientX - rect.left) * scaleX - dragOffset.x;
    let y = (e.clientY - rect.top) * scaleY - dragOffset.y;

    // Crea una pieza temporal para calcular su BBox en la nueva posición
    const tempPiece = { ...draggedPiece, x, y };
    const constrainedPosition = constrainPiecePosition(tempPiece, canvas.width, canvas.height, mirrorLine);

    // Actualiza la posición de la pieza y determina si está en el área de juego
    setPieces((prevPieces) =>
        prevPieces.map((p) => {
          if (p.id === draggedPiece.id) {
            const updatedPiece = { ...p, x: constrainedPosition.x, y: constrainedPosition.y };
            // Marcar como 'placed' si está en el área de juego
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
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clickedPiece = pieces.slice().reverse().find((p) => isPieceHit(p, x, y));
    if (clickedPiece) {
      rotatePiece(clickedPiece.id); // Usar la función de rotación de 45 grados
    }
  }, [canvasRef, pieces, isPieceHit, rotatePiece]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
  };
};