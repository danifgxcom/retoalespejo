import { GameGeometry } from '@reto/geometry';
import { migrateLegacyAnchor } from '@reto/geometry';
import golden from '../fixtures/piece-geometry.golden.json';

/**
 * Red de seguridad de la reforma de geometría: las piezas deben quedar EN EL
 * MISMO SITIO de la pantalla que antes del cambio de ancla, una vez migradas
 * sus coordenadas. Si este test se pone rojo, el refactor movió la figura.
 */
describe('la reforma del ancla no mueve ninguna pieza', () => {
  const geometry = new GameGeometry(golden.config as any);
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

  test.each(golden.cases.map(c => [c.source, c] as const))('%s', (_source, testCase: any) => {
    const migrated = migrateLegacyAnchor(testCase.piece, golden.config.pieceSize);
    const vertices = geometry.getPieceVertices(migrated);

    // El contorno va cerrado: el primer vértice se repite al final.
    expect(vertices).toHaveLength(testCase.vertices.length);
    testCase.vertices.forEach(([x, y]: [number, number], i: number) => {
      expect(near(vertices[i][0], x)).toBe(true);
      expect(near(vertices[i][1], y)).toBe(true);
    });

    const bbox = geometry.getPieceBoundingBox(migrated);
    (['left', 'right', 'top', 'bottom'] as const).forEach(edge => {
      expect(near(bbox[edge], testCase.bbox[edge])).toBe(true);
    });
  });
});

describe('reflectPieceAcrossMirror produce una reflexión real', () => {
  const geometry = new GameGeometry(golden.config as any);
  const mirror = golden.config.mirrorLineX;
  const key = (v: number[][]) =>
    v.map(([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`).sort().join(' | ');

  test.each(golden.cases.map(c => [c.source, c] as const))('%s', (_source, testCase: any) => {
    const piece = migrateLegacyAnchor(testCase.piece, golden.config.pieceSize);
    const reflected = geometry.reflectPieceAcrossMirror(piece);

    // La reflexión debe coincidir, punto a punto, con espejar los vértices
    // originales sobre la línea del espejo. El recorrido del contorno se
    // invierte al espejarlo, así que se comparan como conjuntos.
    const expected = geometry.getPieceVertices(piece).map(([x, y]) => [2 * mirror - x, y]);
    expect(key(geometry.getPieceVertices(reflected))).toBe(key(expected));
  });

  test('reflejar dos veces devuelve la pieza original', () => {
    const piece = { type: 'A' as const, face: 'front' as const, x: 321, y: 234, rotation: 135 };
    const twice = geometry.reflectPieceAcrossMirror(geometry.reflectPieceAcrossMirror(piece));
    expect(twice).toEqual(piece);
  });
});
