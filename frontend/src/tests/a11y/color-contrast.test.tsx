import { calcAPCA } from 'apca-w3';

interface ColorTestCase {
  foreground: string;
  background: string;
  minContrast: number;
  name: string;
}

// Prueba el contraste utilizando APCA (la métrica moderna recomendada por WCAG 3.0)
// calcAPCA acepta strings hex directamente
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
      // Pass hex strings directly to calcAPCA (it uses colorParsley internally)
      const contrast = Math.abs(calcAPCA(foreground, background) as number);

      expect(contrast).toBeGreaterThanOrEqual(
        minContrast,
        `El contraste entre ${foreground} y ${background} es ${contrast.toFixed(2)}, debería ser al menos ${minContrast}`
      );
    });
  });
});
