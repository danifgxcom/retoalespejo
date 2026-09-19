import { thumbnailPalette } from '../../utils/theme/thumbnailPalette';
import { PieceColors } from '../../utils/piece/PieceColors';

const luminance = (hex: string) => {
  const rgb = hex.match(/[0-9a-f]{2}/gi)!.map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
const ratio = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);

describe.each([false, true])('accessible objective, dark=%s', dark => {
  test('navy regions and the external outline remain distinguishable from the field', () => {
    const palette = thumbnailPalette(true, dark, true);
    const pieces = PieceColors.getColorsForFace('front', true);
    expect(ratio(pieces.triangleColor, palette.background)).toBeGreaterThan(4.5);
    expect(ratio(palette.outline, palette.background)).toBeGreaterThan(7);
    expect(ratio(palette.outline, pieces.centerColor)).toBeGreaterThan(7);
    expect(palette.outlineWidth).toBeGreaterThanOrEqual(1.5);
  });
});
