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

/**
 * Grid fijo uniforme - TODAS las piezas usan las mismas posiciones del grid
 */
const GRID_SIZE = 10; // Grid uniforme para todas las piezas, sin importar rotación

const snapToFixedGrid = (x: number, y: number, rotation: number = 0) => {
  // Grid uniforme: TODAS las piezas se posicionan en múltiplos exactos de 10px
  // Esto garantiza que las piezas puedan conectarse perfectamente
  return {
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE
  };
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

      // Durante el drag, aplicar constraint geométrico pero sin snap para fluidez
      const tempPiecePosition = pieceToPosition({ ...draggedPiece, x, y });
      const constrainedPosition = geometry.constrainPiecePosition(
        tempPiecePosition, 
        coords.canvas.width, 
        coords.canvas.height, 
        true // Respetar el espejo
      );

      // Actualización optimizada - solo cambiar la pieza que se mueve
      setPieces((prevPieces) => {
        const newPieces = [...prevPieces];
        const pieceIndex = newPieces.findIndex(p => p.id === draggedPiece.id);
        if (pieceIndex !== -1) {
          newPieces[pieceIndex] = {
            ...newPieces[pieceIndex],
            x: constrainedPosition.x,
            y: constrainedPosition.y,
            placed: constrainedPosition.y < 600 // Check simple para área de juego
          };
        }
        return newPieces;
      });
    }
    // Removed hover interaction completely to improve performance during drag operations
  }, [draggedPiece, dragOffset, setPieces, canvasRef, geometry]);

  const handleMouseUp = useCallback(() => {
    if (draggedPiece) {
      // Al soltar la pieza, aplicar snap a grid fijo
      setPieces((prevPieces) => {
        const updatedPieces = prevPieces.map((p) => {
          if (p.id === draggedPiece.id) {
            const updatedPiece = { ...p };
            
            // SISTEMA GRID FIJO: Aplicar snap a grid inteligente según rotación
            if (geometry.isPieceInGameArea(updatedPiece)) {
              // VALIDACIÓN PERMISIVA: Permitir tocar el espejo
              const gameAreaWidth = 700; // Línea del espejo
              const gameAreaHeight = 500;
              
              // Límites muy permisivos - las piezas pueden tocar el espejo perfectamente
              const minX = -50; // Permitir salir un poco por la izquierda
              const maxX = gameAreaWidth + 10; // Permitir cruzar ligeramente el espejo (710)
              const minY = -50; // Permitir salir un poco por arriba  
              const maxY = gameAreaHeight + 10; // Permitir salir ligeramente por abajo (510)
              
              // APLICAR SNAP A GRID según la rotación de la pieza
              const snappedPosition = snapToFixedGrid(updatedPiece.x, updatedPiece.y, updatedPiece.rotation);
              let finalX = Math.max(minX, Math.min(maxX, snappedPosition.x));
              let finalY = Math.max(minY, Math.min(maxY, snappedPosition.y));
              
              // VALIDACIÓN DE OVERLAP BÁSICA - evitar solapamiento con otras piezas
              const otherPieces = prevPieces.filter(p => p.id !== draggedPiece.id && p.placed);
              const pieceSize = 100;
              
              for (const otherPiece of otherPieces) {
                const dx = Math.abs(finalX - otherPiece.x);
                const dy = Math.abs(finalY - otherPiece.y);
                
                // Si hay overlap significativo, ajustar posición
                if (dx < pieceSize - 20 && dy < pieceSize - 20) {
                  // Mover la pieza lo suficiente para evitar overlap
                  if (dx < dy) {
                    // Mover horizontalmente
                    finalX = finalX > otherPiece.x ? otherPiece.x + pieceSize : otherPiece.x - pieceSize;
                  } else {
                    // Mover verticalmente  
                    finalY = finalY > otherPiece.y ? otherPiece.y + pieceSize : otherPiece.y - pieceSize;
                  }
                  
                  // Re-aplicar límites después del ajuste
                  finalX = Math.max(minX, Math.min(maxX, finalX));
                  finalY = Math.max(minY, Math.min(maxY, finalY));
                }
              }
              
              updatedPiece.x = finalX;
              updatedPiece.y = finalY;
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
