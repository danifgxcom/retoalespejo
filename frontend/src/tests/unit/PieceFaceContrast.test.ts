import { PieceColors } from '../../utils/piece/PieceColors';

/**
 * F05: las dos caras de una pieza se distinguen SIN depender del matiz.
 *
 * Antes esto lo garantizaba una trama diagonal sobre la cara "back". La trama
 * se quitó porque delataba la figura: al reflejarse, las diagonales cambian de
 * sentido y la unión con el espejo (y la frontera entre piezas contiguas) se
 * hacía visible en las cartas de reto, que deben leerse como una sola silueta.
 *
 * La marca no cromática que queda es la LUMINANCIA: una cara lleva el centro
 * claro y los triángulos oscuros, y la otra al revés. Este test lo comprueba en
 * las dos paletas, que es lo que la trama estaba tapando en la de alta
 * distinguibilidad.
 */
const relativeLuminance = (hex: string): number => {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255)
    + 0.7152 * channel((n >> 8) & 255)
    + 0.0722 * channel(n & 255);
};

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe.each([['paleta normal', false], ['alto contraste', true]])(
  'marca no cromática por cara (F05) — %s',
  (_nombre, highContrast) => {
    const front = PieceColors.getColorsForFace('front', highContrast);
    const back = PieceColors.getColorsForFace('back', highContrast);

    test('centro y triángulos se separan por luminancia, no sólo por matiz', () => {
      // El suelo lo pone el dorado/rojo original (2.43:1), que no se toca por
      // ser la identidad del juego: ninguna paleta puede separar menos que él.
      expect(contrast(front.centerColor, front.triangleColor)).toBeGreaterThanOrEqual(2.4);
    });

    test('voltear la pieza invierte esa luminancia', () => {
      const claroDelante = relativeLuminance(front.centerColor) > relativeLuminance(front.triangleColor);
      const claroDetras = relativeLuminance(back.centerColor) > relativeLuminance(back.triangleColor);
      expect(claroDelante).not.toBe(claroDetras);
    });
  }
);
