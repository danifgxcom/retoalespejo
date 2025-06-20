import { useCallback } from 'react';
import { Piece } from '../components/GamePiece';
import { GameGeometry } from '../utils/GameGeometry.ts';

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
  geometry: GameGeometry;
}

/**
 * Convierte Piece a PiecePosition para usar con GameGeometry
 */
const pieceToPosition = (piece: Piece) => ({
  type: piece.type,
  face: piece.face,
  x: piece.x,
  y: piece.y,
  rotation: piece.rotation
});

export const useMouseHandlers = ({
                                   pieces,
                                   draggedPiece,
                                   dragOffset,
                                   setPieces,
                                   setDraggedPiece,
                                   setDragOffset,
                                   isPieceHit,
                                   canvasRef,
                                   rotatePiece,
                                   geometry
                                 }: UseMouseHandlersProps) => {

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

    // Crea una pieza temporal para calcular posición usando geometría
    const tempPiecePosition = pieceToPosition({ ...draggedPiece, x, y });
    const constrainedPosition = geometry.constrainPiecePosition(
      tempPiecePosition, 
      coords.canvas.width, 
      coords.canvas.height, 
      true // Respetar el espejo
    );

    // Actualiza la posición de la pieza y determina si está en el área de juego
    setPieces((prevPieces) =>
        prevPieces.map((p) => {
          if (p.id === draggedPiece.id) {
            const updatedPiece = { ...p, x: constrainedPosition.x, y: constrainedPosition.y };
            updatedPiece.placed = geometry.isPieceInGameArea(updatedPiece);
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
              updatedPiece.placed = geometry.isPieceInGameArea(updatedPiece);
              return updatedPiece;
            }
            return p;
          })
      );
    }
    setDraggedPiece(null);
  }, [draggedPiece, setDraggedPiece, setPieces, geometry]);

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
