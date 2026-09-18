import { useState, useEffect, useMemo } from 'react';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { usePointerHandlers } from '../../hooks/usePointerHandlers';
import GameCanvas from '../../components/GameCanvas';
import { GameGeometry, PLACEMENT_GRID_PX } from '@reto/geometry';
import { Piece } from '../../components/GamePiece';
import { CANVAS_CONSTANTS } from '../../utils/canvas/CanvasConstants';

/**
 * Comprobación ejecutable de la Tarea 1 (Pointer Events) y Tarea 2
 * (control por teclado) pedidas para el soporte táctil/accesible del canvas.
 */

const gameAreaConfig = { width: 700, height: 500, mirrorLineX: 700, pieceSize: 100 };

const makePiece = (overrides: Partial<Piece> = {}): Piece => ({
  id: 1,
  type: 'A',
  face: 'front',
  centerColor: '#ffcc00',
  triangleColor: '#ff0000',
  x: 200,
  y: 200,
  rotation: 0,
  placed: true,
  ...overrides
});

// Objeto mínimo que imita un HTMLCanvasElement lo justo para el hook: el
// espacio lógico real del juego (1400x1000) con un bounding box 1:1 para que
// el puntero mapee sin escala, más setPointerCapture/releasePointerCapture
// (que jsdom no implementa) para que la captura de puntero no falle.
const makeFakeCanvas = () => ({
  width: CANVAS_CONSTANTS.CANVAS_WIDTH,
  height: CANVAS_CONSTANTS.CANVAS_HEIGHT,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: CANVAS_CONSTANTS.CANVAS_WIDTH, height: CANVAS_CONSTANTS.CANVAS_HEIGHT, right: CANVAS_CONSTANTS.CANVAS_WIDTH, bottom: CANVAS_CONSTANTS.CANVAS_HEIGHT, x: 0, y: 0, toJSON() {} }),
  setPointerCapture: jest.fn(),
  releasePointerCapture: jest.fn(),
} as unknown as HTMLCanvasElement);

const makePointerEvent = (overrides: Partial<{ clientX: number; clientY: number; pointerId: number; pointerType: string }> = {}) => ({
  clientX: 0,
  clientY: 0,
  pointerId: 1,
  pointerType: 'mouse',
  ...overrides
}) as unknown as React.PointerEvent<HTMLCanvasElement>;

/**
 * Hook de prueba: envuelve usePointerHandlers con el estado real (pieces,
 * draggedPiece, dragOffset) que en la app vive en useGameLogic, para poder
 * ejercitar la secuencia completa pointerdown -> pointermove -> pointerup.
 */
const useHarness = (initialPieces: Piece[]) => {
  const [pieces, setPieces] = useState<Piece[]>(initialPieces);
  const [draggedPiece, setDraggedPiece] = useState<Piece | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const geometry = useMemo(() => new GameGeometry(gameAreaConfig), []);
  const canvas = useMemo(() => makeFakeCanvas(), []);
  const canvasRef = { current: { getCanvas: () => canvas } };
  const isPieceHit = (piece: Piece, x: number, y: number) => Math.hypot(piece.x - x, piece.y - y) < 40;
  const rotatePiece = jest.fn();

  const handlers = usePointerHandlers({
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
    setInteractingPieceId: () => {}
  });

  return { pieces, draggedPiece, ...handlers };
};

describe('usePointerHandlers (soporte táctil vía Pointer Events)', () => {
  test('pointerdown + pointermove + pointerup sobre una pieza la mueve', () => {
    const piece = makePiece({ x: 200, y: 200 });
    const { result } = renderHook(() => useHarness([piece]));

    act(() => {
      // Agarrar la pieza justo en su centro: dragOffset queda en (0,0).
      result.current.handlePointerDown(makePointerEvent({ clientX: 200, clientY: 200, pointerId: 1 }));
    });
    expect(result.current.draggedPiece?.id).toBe(1);

    act(() => {
      result.current.handlePointerMove(makePointerEvent({ clientX: 230, clientY: 220, pointerId: 1 }));
    });
    // Durante el arrastre no hay snap: la posición sigue exactamente al puntero.
    expect(result.current.pieces[0].x).toBe(230);
    expect(result.current.pieces[0].y).toBe(220);

    act(() => {
      result.current.handlePointerUp(makePointerEvent({ clientX: 230, clientY: 220, pointerId: 1 }));
    });
    expect(result.current.draggedPiece).toBeNull();
    // Tras soltar, la pieza sigue habiéndose movido respecto a su posición inicial.
    expect(result.current.pieces[0].x).toBeGreaterThan(piece.x);
    expect(result.current.pieces[0].y).toBeGreaterThan(piece.y);
  });

  test('un segundo puntero no interfiere con un arrastre en curso', () => {
    const piece = makePiece({ x: 200, y: 200 });
    const { result } = renderHook(() => useHarness([piece]));

    act(() => {
      result.current.handlePointerDown(makePointerEvent({ clientX: 200, clientY: 200, pointerId: 1 }));
    });

    // Un segundo dedo (pointerId distinto) se mueve muy lejos: no debe tocar la pieza.
    act(() => {
      result.current.handlePointerMove(makePointerEvent({ clientX: 600, clientY: 400, pointerId: 2 }));
    });
    expect(result.current.pieces[0].x).toBe(200);
    expect(result.current.pieces[0].y).toBe(200);

    // El puntero original sigue controlando el arrastre con normalidad.
    act(() => {
      result.current.handlePointerMove(makePointerEvent({ clientX: 240, clientY: 200, pointerId: 1 }));
    });
    expect(result.current.pieces[0].x).toBe(240);

    act(() => {
      result.current.handlePointerUp(makePointerEvent({ clientX: 240, clientY: 200, pointerId: 1 }));
    });
    expect(result.current.draggedPiece).toBeNull();
  });
});

describe('Control por teclado del canvas (accesibilidad)', () => {
  // Componente puente: mantiene las piezas en estado real (como haría
  // MirrorChallengeGame) y expone su valor actual a través de una ref mutable
  // para poder comprobarlo desde el test sin cambiar la API de GameCanvas.
  const Harness = ({ initialPieces, piecesRef }: { initialPieces: Piece[]; piecesRef: { current: Piece[] } }) => {
    const [pieces, setPieces] = useState<Piece[]>(initialPieces);
    const geometry = useMemo(() => new GameGeometry(gameAreaConfig), []);

    useEffect(() => {
      piecesRef.current = pieces;
    }, [pieces, piecesRef]);

    return (
      <GameCanvas
        pieces={pieces}
        currentChallenge={0}
        challenges={[]}
        onPointerDown={() => {}}
        onPointerMove={() => {}}
        onPointerUp={() => {}}
        onPointerCancel={() => {}}
        onPointerLeave={() => {}}
        onContextMenu={() => {}}
        geometry={geometry}
        setPieces={setPieces}
        onRotatePiece={() => {}}
        onRotatePieceCounterClockwise={() => {}}
        onFlipPiece={() => {}}
      />
    );
  };

  test('las flechas mueven la pieza seleccionada en pasos de retícula', () => {
    const initialPieces = [makePiece({ x: 200, y: 200 })];
    const piecesRef = { current: initialPieces };

    render(<Harness initialPieces={initialPieces} piecesRef={piecesRef} />);

    const canvas = screen.getByRole('application');
    canvas.focus();

    // Tab selecciona la primera pieza (no hay ninguna seleccionada todavía).
    fireEvent.keyDown(canvas, { key: 'Tab' });
    // La flecha derecha la mueve un paso de retícula (PLACEMENT_GRID_PX).
    fireEvent.keyDown(canvas, { key: 'ArrowRight' });

    expect(piecesRef.current[0].x).toBe(200 + PLACEMENT_GRID_PX);
    expect(piecesRef.current[0].y).toBe(200);

    // Con Mayús, el paso es fino (1px) en vez del de retícula.
    fireEvent.keyDown(canvas, { key: 'ArrowDown', shiftKey: true });
    expect(piecesRef.current[0].y).toBe(201);
  });
});
