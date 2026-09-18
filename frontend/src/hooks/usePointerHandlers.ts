import { useCallback, useMemo, useRef } from 'react';
import { Piece } from '../components/GamePiece';
import { GameGeometry, PLACEMENT_GRID_PX } from '@reto/geometry';
import { createRotationAwareGrid } from '../utils/grid/RotationAwareGrid';
import { CANVAS_CONSTANTS } from '../utils/canvas/CanvasConstants';

interface UsePointerHandlersProps {
  pieces: Piece[];
  draggedPiece: Piece | null;
  dragOffset: { x: number; y: number };
  setPieces: React.Dispatch<React.SetStateAction<Piece[]>>;
  setDraggedPiece: (piece: Piece | null) => void;
  setDragOffset: (offset: { x: number; y: number }) => void;
  isPieceHit: (piece: Piece, x: number, y: number) => boolean;
  canvasRef: React.RefObject<{ getCanvas: () => HTMLCanvasElement | null }>;
  rotatePiece: (pieceId: number, fromControl?: boolean) => void;
  geometry: GameGeometry;
  setInteractingPieceId: (pieceId: number | null) => void;
  // F13: registra el estado ANTERIOR al arrastre en la pila de deshacer, una
  // sola vez por arrastre completo, no en cada posición intermedia. Opcional
  // para no obligar a los tests que no ejercitan deshacer/rehacer.
  pushHistory?: (snapshot: Piece[]) => void;
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
 * Retícula fija: todas las piezas se sueltan en las mismas posiciones, sin
 * importar su rotación. El paso vive en GameGeometry porque las tolerancias
 * geométricas se derivan de él.
 */
const GRID_SIZE = PLACEMENT_GRID_PX;

const snapToFixedGrid = (x: number, y: number) => {
  // Grid uniforme: TODAS las piezas se posicionan en múltiplos exactos de 10px
  // Esto garantiza que las piezas puedan conectarse perfectamente
  return {
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE
  };
};

// Pulsación larga: equivalente táctil al clic derecho (no existe en touch/pen).
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

/**
 * Maneja la interacción con las piezas mediante Pointer Events, que cubren
 * ratón, táctil y lápiz con un único juego de manejadores.
 */
export const usePointerHandlers = ({
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
                                   setInteractingPieceId,
                                   pushHistory = () => {}
                                 }: UsePointerHandlersProps) => {

  // Create rotation-aware grid instance
  const rotationAwareGrid = useMemo(() => {
    return createRotationAwareGrid(geometry, {
      baseGridSize: PLACEMENT_GRID_PX,
      snapDistance: 60, // Increased for better handling of rotated pieces
      mirrorSnapDistance: 20, // Increased for mirror snapping
      enableIntelligentSnap: true
    });
  }, [geometry]);

  // Puntero que controla el arrastre en curso: cualquier otro puntero (un
  // segundo dedo, por ejemplo) se ignora mientras este siga activo.
  const activePointerIdRef = useRef<number | null>(null);

  // Estado de la pulsación larga en curso (si la hay).
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartRef.current = null;
  };

  // Helper para obtener coordenadas del puntero en el canvas
  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    // El canvas dibuja en un espacio lógico fijo (1400x1000) y su mapa de bits
    // se adapta al zoom/DPR, así que la conversión parte de las constantes, no
    // del tamaño del mapa de bits.
    return {
      x: (e.clientX - rect.left) * (CANVAS_CONSTANTS.CANVAS_WIDTH / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_CONSTANTS.CANVAS_HEIGHT / rect.height),
      canvas
    };
  };

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Ya hay un arrastre en curso: ignorar cualquier otro puntero (segundo dedo).
    if (activePointerIdRef.current !== null) return;

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const clickedPiece = pieces.slice().reverse().find((piece) => isPieceHit(piece, coords.x, coords.y));
    if (clickedPiece) {
      activePointerIdRef.current = e.pointerId;
      // Con la captura, el arrastre no se pierde si el dedo sale del canvas.
      try {
        coords.canvas.setPointerCapture(e.pointerId);
      } catch {
        // Entornos sin soporte (p.ej. jsdom en tests): no es crítico.
      }

      setDraggedPiece(clickedPiece);
      setDragOffset({ x: coords.x - clickedPiece.x, y: coords.y - clickedPiece.y });

      // En táctil/lápiz no hay clic derecho: una pulsación larga sin apenas
      // movimiento gira la pieza, igual que handleContextMenu en escritorio.
      if (e.pointerType !== 'mouse') {
        longPressStartRef.current = { x: coords.x, y: coords.y };
        longPressTimerRef.current = setTimeout(() => {
          rotatePiece(clickedPiece.id, true);
          setDraggedPiece(null);
          clearLongPress();
          activePointerIdRef.current = null;
        }, LONG_PRESS_MS);
      }
      // No cambiar interactingPieceId aquí - el hover ya lo maneja
    }
  }, [pieces, isPieceHit, setDraggedPiece, setDragOffset, rotatePiece]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Ignorar punteros que no son el que controla el arrastre en curso.
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    if (draggedPiece) {
      // Si el dedo se mueve demasiado, ya no cuenta como pulsación larga.
      if (longPressStartRef.current) {
        const dx = coords.x - longPressStartRef.current.x;
        const dy = coords.y - longPressStartRef.current.y;
        if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE_PX) {
          clearLongPress();
        }
      }

      // Modo arrastre: mover la pieza
      const x = coords.x - dragOffset.x;
      const y = coords.y - dragOffset.y;

      // Durante el drag, aplicar constraint geométrico pero sin snap para fluidez
      const tempPiecePosition = pieceToPosition({ ...draggedPiece, x, y });
      const constrainedPosition = geometry.constrainPiecePosition(
        tempPiecePosition,
        CANVAS_CONSTANTS.CANVAS_WIDTH,
        CANVAS_CONSTANTS.CANVAS_HEIGHT,
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
            // Mismo criterio que finishDrag: geometry.isPieceInGameArea (antes un 600 a pelo)
            placed: geometry.isPieceInGameArea({ ...newPieces[pieceIndex], x: constrainedPosition.x, y: constrainedPosition.y })
          };
        }
        return newPieces;
      });
    }
    // Removed hover interaction completely to improve performance during drag operations
  }, [draggedPiece, dragOffset, setPieces, geometry]);

  // Soltar la pieza (fin de arrastre): snap inteligente y validación final.
  const finishDrag = useCallback(() => {
    if (draggedPiece) {
      // F13: un solo registro en la pila de deshacer por arrastre completo,
      // no por cada posición intermedia. `draggedPiece` conserva la posición
      // de ANTES de arrastrar (se fija una vez en pointerdown), así que sólo
      // se registra si la pieza realmente se movió.
      const currentPiece = pieces.find(p => p.id === draggedPiece.id);
      const actuallyMoved = currentPiece !== undefined &&
        (currentPiece.x !== draggedPiece.x || currentPiece.y !== draggedPiece.y);
      if (actuallyMoved) {
        pushHistory(pieces.map(p => (p.id === draggedPiece.id ? draggedPiece : p)));
      }

      setPieces((prevPieces) => {
        const updatedPieces = prevPieces.map((p) => {
          if (p.id === draggedPiece.id) {
            const updatedPiece = { ...p };

            // NUEVO SISTEMA: Usar rotation-aware grid
            if (geometry.isPieceInGameArea(updatedPiece)) {
              // Obtener otras piezas colocadas para snapping inteligente
              const otherPlacedPieces = prevPieces
                .filter(piece => piece.id !== draggedPiece.id && piece.placed)
                .map(pieceToPosition);

              // Aplicar snap inteligente considerando rotación
              const snapResult = rotationAwareGrid.calculateSnapPosition(
                pieceToPosition(updatedPiece),
                otherPlacedPieces
              );

              if (snapResult.snapped) {
                updatedPiece.x = snapResult.x;
                updatedPiece.y = snapResult.y;
              }

              // Validar que la posición final sea válida
              const finalPiecePosition = pieceToPosition(updatedPiece);
              if (!geometry.isPiecePositionInGameArea(finalPiecePosition)) {
                // Si la posición no es válida, usar fallback a grid simple
                const fallbackSnap = snapToFixedGrid(updatedPiece.x, updatedPiece.y);
                updatedPiece.x = fallbackSnap.x;
                updatedPiece.y = fallbackSnap.y;
              }

              updatedPiece.placed = true;
            } else {
              // Si no está en área de juego, solo marcar placed como false
              updatedPiece.placed = false;
            }

            return updatedPiece;
          }
          return p;
        });

        /*
          Asentar la figura: cerrar las ranuras que quedan entre las piezas ya
          colocadas. No basta con afinar la que se acaba de soltar — la primera
          pieza de la figura aterrizó en la retícula sin nada contra qué
          alinearse, y si la segunda toca el espejo ya no puede ir a buscarla.
        */
        const settled = rotationAwareGrid.settlePlacedPieces(
          updatedPieces.filter(p => p.placed).map(pieceToPosition)
        );
        const porId = new Map(
          updatedPieces.filter(p => p.placed).map((p, i) => [p.id, settled[i]])
        );
        return updatedPieces.map(p => {
          const asentada = porId.get(p.id);
          return asentada ? { ...p, x: asentada.x, y: asentada.y } : p;
        });
      });
    }
    setDraggedPiece(null);
  }, [draggedPiece, pieces, setDraggedPiece, setPieces, geometry, rotationAwareGrid, pushHistory]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

    clearLongPress();
    const canvas = canvasRef.current?.getCanvas();
    try {
      canvas?.releasePointerCapture(e.pointerId);
    } catch {
      // Entornos sin soporte (p.ej. jsdom en tests): no es crítico.
    }
    activePointerIdRef.current = null;
    finishDrag();
  }, [finishDrag, canvasRef]);

  // El navegador puede cancelar el gesto (scroll, otra ventana...): se trata
  // exactamente igual que soltar el puntero.
  const handlePointerCancel = handlePointerUp;

  const handlePointerLeave = useCallback(() => {
    // Limpiar interacción cuando el puntero sale del canvas visualmente.
    // No hace falta forzar el soltado aquí: con setPointerCapture el arrastre
    // sigue activo y pointerup/pointercancel lo finalizarán igualmente.
    setInteractingPieceId(null);
  }, [setInteractingPieceId]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (CANVAS_CONSTANTS.CANVAS_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (CANVAS_CONSTANTS.CANVAS_HEIGHT / rect.height);

    const clickedPiece = pieces.slice().reverse().find((p) => isPieceHit(p, x, y));
    if (clickedPiece) {
      // Rotación desde ratón: NO usar animación azul, pero sí permitir la rotación
      rotatePiece(clickedPiece.id, true); // fromControl = true para evitar animación azul
    }
  }, [canvasRef, pieces, isPieceHit, rotatePiece]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
    handleContextMenu,
  };
};
