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
}: UseMouseHandlersProps) => {

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Mouse down event triggered');
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) {
      console.log('No canvas found');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    console.log('Click coordinates (scaled):', { x, y, scaleX, scaleY });
    console.log('Available pieces:', pieces.length);

    const clickedPiece = pieces.slice().reverse().find(piece => 
      isPieceHit(piece, x, y)
    );

    console.log('Clicked piece:', clickedPiece);
    if (clickedPiece) {
      setDraggedPiece(clickedPiece);
      setDragOffset({
        x: x - clickedPiece.x,
        y: y - clickedPiece.y
      });
      console.log('Drag started');
    }
  }, [pieces, isPieceHit, setDraggedPiece, setDragOffset, canvasRef]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedPiece) return;

    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (e.clientX - rect.left) * scaleX - dragOffset.x;
    let y = (e.clientY - rect.top) * scaleY - dragOffset.y;

    const mirrorLine = 700; // Línea del espejo

    // Usar un tamaño fijo conservador para evitar problemas complejos de bounding box
    // La pieza real máxima es aproximadamente 200px en cualquier orientación
    const conservativeSize = 200;

    // Aplicar restricciones durante el movimiento
    x = Math.max(0, Math.min(1400 - conservativeSize, x));
    y = Math.max(0, Math.min(600 - conservativeSize, y));

    // RESTRICCIÓN DEL ESPEJO: La pieza NO puede entrar en el área del espejo (muro sólido)
    // Agregamos un margen de seguridad de 5px para evitar superposición
    if (x + conservativeSize > mirrorLine - 5) {
      x = mirrorLine - conservativeSize - 5;
    }

    setPieces(pieces.map(piece => 
      piece.id === draggedPiece.id 
        ? { ...piece, x, y }
        : piece
    ));
  }, [draggedPiece, dragOffset, pieces, setPieces, canvasRef]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedPiece) return;

    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX - dragOffset.x;
    const y = (e.clientY - rect.top) * scaleY - dragOffset.y;

    const mirrorLine = 700; // Línea del espejo
    const gameAreaHeight = 350; // Altura del área de juego
    const piecesAreaStart = 350; // Inicio del área de piezas disponibles

    // Usar el mismo tamaño conservador que en handleMouseMove
    const conservativeSize = 200;

    let finalX = x;
    let finalY = y;

    // Restricciones SUAVES (sin saltos):

    // Restricciones generales del canvas
    finalX = Math.max(0, Math.min(1400 - conservativeSize, finalX));
    finalY = Math.max(0, Math.min(600 - conservativeSize, finalY));

    // RESTRICCIÓN DEL ESPEJO: La pieza NO puede entrar en el área del espejo
    console.log('Checking mirror restriction:', { 
      finalX, 
      conservativeSize,
      mirrorLine, 
      rightEdge: finalX + conservativeSize,
      wouldCross: finalX + conservativeSize > mirrorLine,
      rotation: draggedPiece.rotation
    });

    if (finalX + conservativeSize > mirrorLine - 5) {
      console.log('RESTRICCIÓN APLICADA: Pieza intentó cruzar espejo');
      finalX = mirrorLine - conservativeSize - 5;
      console.log('Nueva posición X:', finalX);
    }

    // Determinar si está colocada (placed) en el área de juego
    const placed = finalY < gameAreaHeight;

    setPieces(pieces.map(piece => 
      piece.id === draggedPiece.id 
        ? { ...piece, x: finalX, y: finalY, placed }
        : piece
    ));

    setDraggedPiece(null);
    setDragOffset({ x: 0, y: 0 });
  }, [draggedPiece, dragOffset, pieces, setPieces, setDraggedPiece, setDragOffset, canvasRef]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (draggedPiece) rotatePiece(draggedPiece.id);
  }, [draggedPiece, rotatePiece]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
  };
};
