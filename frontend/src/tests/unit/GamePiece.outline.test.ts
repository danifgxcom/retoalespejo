import { drawPiece, Piece } from '../../components/GamePiece';

/**
 * Revisión del coordinador tras aceptar la Fase 3: medido con WCAG 2.x (la
 * métrica del criterio de aceptación, WCAG 1.4.11 exige 3:1 para bordes), el
 * dorado del juego original sobre el lienzo claro da 1.6:1 - falla. El dorado
 * y el rojo no se tocan (son la identidad del juego); se arregla dándole al
 * contorno EXTERIOR de la pieza su propio color de alto contraste
 * (`--canvas-piece-outline`), en vez de pintarlo del mismo color que el
 * relleno como hacía `ctx.strokeStyle = fillColor`.
 *
 * Este test fija el criterio: el último trazo que dibuja `drawPiece` (el
 * contorno exterior, después de todas las partes) no puede coincidir con
 * ninguno de los colores de relleno de la pieza. Así nadie lo revierte sin
 * enterarse.
 */
const createMockContext = (): jest.Mocked<CanvasRenderingContext2D> => ({
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  lineJoin: 'miter' as CanvasLineJoin,
  lineCap: 'butt' as CanvasLineCap,
  shadowColor: '',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'low' as ImageSmoothingQuality,
  globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  clip: jest.fn(),
} as unknown as jest.Mocked<CanvasRenderingContext2D>);

const makePiece = (overrides: Partial<Piece> = {}): Piece => ({
  id: 1,
  type: 'A',
  face: 'front',
  centerColor: '#fbbf24', // oro del juego original: 1.6:1 contra el lienzo claro
  triangleColor: '#dc2626',
  x: 0,
  y: 0,
  rotation: 0,
  placed: true,
  ...overrides,
});

describe('contorno exterior de la pieza (revisión de contraste)', () => {
  test('el color del último trazo no coincide con ningún color de relleno de la pieza', () => {
    const ctx = createMockContext();
    const strokeColorsAtCallTime: string[] = [];
    (ctx.stroke as jest.Mock).mockImplementation(() => {
      strokeColorsAtCallTime.push(ctx.strokeStyle as string);
    });

    const piece = makePiece();
    drawPiece(ctx, piece, 100, 100, 80);

    expect(strokeColorsAtCallTime.length).toBeGreaterThan(0);
    const outlineColor = strokeColorsAtCallTime[strokeColorsAtCallTime.length - 1];

    expect(outlineColor).not.toBe(piece.centerColor);
    expect(outlineColor).not.toBe(piece.triangleColor);
  });

  test('se mantiene igual para la pieza tipo B y para la cara "back" (no depende del tipo ni de la cara)', () => {
    const ctx = createMockContext();
    const strokeColorsAtCallTime: string[] = [];
    (ctx.stroke as jest.Mock).mockImplementation(() => {
      strokeColorsAtCallTime.push(ctx.strokeStyle as string);
    });

    const piece = makePiece({ type: 'B', face: 'back' });
    drawPiece(ctx, piece, 100, 100, 80);

    const outlineColor = strokeColorsAtCallTime[strokeColorsAtCallTime.length - 1];
    expect(outlineColor).not.toBe(piece.centerColor);
    expect(outlineColor).not.toBe(piece.triangleColor);
  });
});
