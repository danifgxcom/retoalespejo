import { GameGeometry } from '@reto/geometry';
import { getWorldVertices } from '@reto/geometry';

/**
 * Dar la vuelta a una ficha física muestra su otra cara, que es la forma
 * ESPEJADA con los colores invertidos. El juego intercambiaba sólo los colores,
 * mostrando una pieza que no puede existir: la misma forma por las dos caras.
 *
 * Aquí se fija la mecánica correcta sobre la geometría, sin montar el hook.
 */
const voltear = <T extends { type: 'A' | 'B'; rotation: number }>(pieza: T): T => ({
  ...pieza,
  type: pieza.type === 'A' ? 'B' : 'A',
  rotation: (360 - (pieza.rotation % 360)) % 360,
});

const TAMANO = 100;
const geometry = new GameGeometry({ width: 700, height: 500, mirrorLineX: 700, pieceSize: TAMANO });

const clave = (v: Array<[number, number]>) =>
  v.map(([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`).sort().join(' | ');

describe('voltear una pieza la espeja', () => {
  const pieza = { type: 'A' as const, face: 'front' as const, x: 400, y: 250, rotation: 45 };

  test('la forma resultante es la reflejada sobre el eje vertical de la pieza', () => {
    const esperado = getWorldVertices(pieza, TAMANO).map(([x, y]): [number, number] => [2 * pieza.x - x, y]);
    expect(clave(getWorldVertices(voltear(pieza), TAMANO))).toBe(clave(esperado));
  });

  test('el centro de la pieza no se mueve', () => {
    const volteada = voltear(pieza);
    expect([volteada.x, volteada.y]).toEqual([pieza.x, pieza.y]);
  });

  test('voltear dos veces devuelve la pieza original', () => {
    expect(voltear(voltear(pieza))).toEqual(pieza);
  });

  test('la caja envolvente conserva su tamaño, sólo se refleja', () => {
    const a = geometry.getPieceBoundingBox(pieza);
    const b = geometry.getPieceBoundingBox(voltear(pieza));
    expect(b.right - b.left).toBeCloseTo(a.right - a.left, 6);
    expect(b.bottom - b.top).toBeCloseTo(a.bottom - a.top, 6);
    expect(b.top).toBeCloseTo(a.top, 6);
  });

  test.each([0, 45, 90, 135, 180, 225, 270, 315])('funciona con giro de %i°', rotacion => {
    const p = { ...pieza, rotation: rotacion };
    const esperado = getWorldVertices(p, TAMANO).map(([x, y]): [number, number] => [2 * p.x - x, y]);
    expect(clave(getWorldVertices(voltear(p), TAMANO))).toBe(clave(esperado));
  });
});
