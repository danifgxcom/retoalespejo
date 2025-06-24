import { useCallback } from 'react';
import { Piece } from '../components/GamePiece';
import { GameGeometry } from '../utils/geometry/GameGeometry';

interface UseMouseHandlersProps {
  pieces: Piece[];
  draggedPiece: Piece | null;
  dragOffset: { x: number; y: number };
  setPieces: (pieces: Piece[]) => void;
  setDraggedPiece: (piece: Piece | null) => void;
  setDragOffset: (offset: { x: number; y: number }) => void;
  isPieceHit: (piece: Piece, x: number, y: number) => boolean;
  canvasRef: React.RefObject<{ getCanvas: () => HTMLCanvasElement | null }>;
  rotatePiece: (pieceId: number, fromControl?: boolean) => void;
  geometry: GameGeometry;
  setInteractingPieceId: (pieceId: number | null) => void;
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
                                   geometry,
                                   setInteractingPieceId
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
      // No cambiar interactingPieceId aquí - el hover ya lo maneja
    }
  }, [canvasRef, pieces, isPieceHit, setDraggedPiece, setDragOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    if (draggedPiece) {
      // Modo arrastre: mover la pieza
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
    } else {
      // Modo hover: mostrar número de pieza cuando se pasa el mouse por encima
      const hoveredPiece = pieces.slice().reverse().find((piece) => isPieceHit(piece, coords.x, coords.y));
      setInteractingPieceId(hoveredPiece?.id || null);
    }
  }, [draggedPiece, dragOffset, setPieces, canvasRef, pieces, isPieceHit, setInteractingPieceId]);

  const handleMouseUp = useCallback(() => {
    if (draggedPiece) {
      // Al soltar la pieza, aplicar snap automático y actualizar estado
      setPieces((prevPieces) => {
        const updatedPieces = prevPieces.map((p) => {
          if (p.id === draggedPiece.id) {
            const updatedPiece = { ...p };
            
            // Solo aplicar snap si la pieza está en el área de juego
            if (geometry.isPieceInGameArea(updatedPiece)) {
              // AUTOSNAP ACTIVADO: Aplicar snap inteligente automático
              const piecePosition = pieceToPosition(updatedPiece);
              const otherPiecesInGame = prevPieces
                .filter(p => p.id !== draggedPiece.id && geometry.isPieceInGameArea(p))
                .map(p => pieceToPosition(p));
              
              // Aplicar autosnap con distancia de 30 pixels
              const snappedPosition = geometry.snapPieceToNearbyTargets(piecePosition, otherPiecesInGame, 30);
              updatedPiece.x = snappedPosition.x;
              updatedPiece.y = snappedPosition.y;
              
              updatedPiece.placed = true;
            } else {
              // Si no está en área de juego, solo marcar placed como false
              updatedPiece.placed = false;
            }
            
            return updatedPiece;
          }
          return p;
        });
        
        return updatedPieces;
      });
    }
    setDraggedPiece(null);
  }, [draggedPiece, setDraggedPiece, setPieces, geometry]);

  const handleMouseLeave = useCallback(() => {
    // Limpiar interacción cuando el mouse sale del canvas
    setInteractingPieceId(null);
    // También soltar cualquier pieza que se esté arrastrando
    if (draggedPiece) {
      handleMouseUp();
    }
  }, [setInteractingPieceId, draggedPiece, handleMouseUp]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const clickedPiece = pieces.slice().reverse().find((p) => isPieceHit(p, coords.x, coords.y));
    if (clickedPiece) {
      // Rotación desde ratón: NO usar animación azul, pero sí permitir la rotación
      rotatePiece(clickedPiece.id, true); // fromControl = true para evitar animación azul
    }
  }, [canvasRef, pieces, isPieceHit, rotatePiece]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleContextMenu,
  };
};
