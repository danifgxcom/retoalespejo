import { calcAPCA } from 'apca-w3';

interface ColorTestCase {
  foreground: string;
  background: string;
  minContrast: number;
  name: string;
}

// Convierte hex a RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] 
    : [0, 0, 0];
}

// Prueba el contraste utilizando APCA (la métrica moderna recomendada por WCAG 3.0)
describe('Pruebas de contraste de color según APCA (WCAG 3.0)', () => {
  const colorPairs: ColorTestCase[] = [
    // Colores de tema primario
    { foreground: '#ffffff', background: '#1a56db', minContrast: 60, name: 'Texto blanco sobre fondo primario' },
    { foreground: '#1a56db', background: '#ffffff', minContrast: 60, name: 'Texto primario sobre fondo blanco' },

    // Colores de tema secundario
    { foreground: '#ffffff', background: '#4f46e5', minContrast: 60, name: 'Texto blanco sobre fondo secundario' },

    // Colores de advertencia
    { foreground: '#000000', background: '#fbbf24', minContrast: 60, name: 'Texto negro sobre fondo de advertencia' },

    // Colores de peligro
    { foreground: '#ffffff', background: '#dc2626', minContrast: 60, name: 'Texto blanco sobre fondo de peligro' },

    // Colores de éxito
    { foreground: '#ffffff', background: '#16a34a', minContrast: 60, name: 'Texto blanco sobre fondo de éxito' },

    // Grises
    { foreground: '#000000', background: '#f3f4f6', minContrast: 40, name: 'Texto negro sobre fondo gris claro' },
    { foreground: '#ffffff', background: '#374151', minContrast: 60, name: 'Texto blanco sobre fondo gris oscuro' },
  ];

  colorPairs.forEach(({ foreground, background, minContrast, name }) => {
    test(`${name} debe tener suficiente contraste`, () => {
      const fgRGB = hexToRgb(foreground);
      const bgRGB = hexToRgb(background);

      // APCA calcula el contraste (valores absolutos más altos = mejor contraste)
      // Texto normal: 60+ para AA, 75+ para AAA
      // Texto grande: 45+ para AA, 60+ para AAA
      const contrast = Math.abs(calcAPCA(fgRGB, bgRGB));

      expect(contrast).toBeGreaterThanOrEqual(
        minContrast,
        `El contraste entre ${foreground} y ${background} es ${contrast.toFixed(2)}, debería ser al menos ${minContrast}`
      );
    });
  });
});
