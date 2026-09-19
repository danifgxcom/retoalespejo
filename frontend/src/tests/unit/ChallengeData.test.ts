import * as fs from 'fs';
import { GameGeometry } from '@reto/geometry';
import { CANVAS_CONSTANTS } from '../../utils/canvas/CanvasConstants';

/**
 * Los retos publicados deben (a) haber quedado tras la migración exactamente
 * donde estaban en pantalla y (b) ser jugables con la configuración REAL del
 * juego, no con una inventada para el test.
 */
describe('public/challenges.json', () => {
  const config = { width: CANVAS_CONSTANTS.GAME_AREA_WIDTH, height: CANVAS_CONSTANTS.GAME_AREA_HEIGHT, mirrorLineX: CANVAS_CONSTANTS.MIRROR_LINE, pieceSize: CANVAS_CONSTANTS.PIECE_SIZE };
  const geometry = new GameGeometry(config);
  const challenges = JSON.parse(fs.readFileSync('./public/challenges.json', 'utf8'));

  test('todas las piezas están migradas al ancla nueva', () => {
    const sinMigrar = challenges.flatMap((c: any) =>
      c.objective.playerPieces.filter((p: any) => p.anchor !== 'center').map(() => c.id)
    );
    expect(sinMigrar).toEqual([]);
  });

  test('la figura cabe en el área de juego', () => {
    // El jugador compone la figura donde quiera EN VERTICAL (la validación
    // normaliza en Y), pero tiene que caber entera dentro del tablero. Con el
    // área de juego a 500 px de alto no cabía: el reto 16 mide 552. De ahí el
    // reparto 600/400 de CANVAS_CONSTANTS. En horizontal no hay libertad —
    // la X mide la distancia al espejo — así que se comprueba tal cual.
    const { GAME_AREA_WIDTH, GAME_AREA_HEIGHT } = CANVAS_CONSTANTS;
    const fallos: string[] = [];

    challenges.forEach((c: any) => {
      const cajas = c.objective.playerPieces.map((p: any) => geometry.getPieceBoundingBox(p));
      const alto = Math.max(...cajas.map((b: any) => b.bottom)) - Math.min(...cajas.map((b: any) => b.top));
      const izquierda = Math.min(...cajas.map((b: any) => b.left));

      if (alto > GAME_AREA_HEIGHT) {
        fallos.push(`reto ${c.id}: ${alto.toFixed(0)}px de alto, no cabe en ${GAME_AREA_HEIGHT}`);
      }
      if (izquierda < config.mirrorLineX - GAME_AREA_WIDTH) {
        fallos.push(`reto ${c.id}: se sale por la izquierda (x=${izquierda.toFixed(0)})`);
      }
    });

    expect(fallos).toEqual([]);
  });

  test('el objetivo encaja sin huecos: contra el espejo y entre piezas', () => {
    // Es la propiedad que hace legible la tarjeta: la figura y su reflejo tienen
    // que fundirse en una sola silueta. Los objetivos se escribieron redondeados
    // a la retícula de 10 px, que es inconmensurable con la geometría de la
    // pieza (lado 128 px, giros de 45°), así que ninguna unión caía exacta: se
    // veía la costura en el espejo y ranuras entre piezas. Alcanzables lo siguen
    // siendo porque el juego pega la pieza al soltarla (ver Winnable.test.ts).
    const MIRROR = config.mirrorLineX;
    const fallos: string[] = [];

    challenges.forEach((c: any) => {
      const piezas = c.objective.playerPieces;
      const alEspejo = piezas.map((p: any) => MIRROR - geometry.getPieceBoundingBox(p).right);

      if (!alEspejo.some((d: number) => Math.abs(d) < 0.01)) {
        fallos.push(`reto ${c.id}: ninguna pieza toca el espejo`);
      }
      alEspejo.forEach((d: number, i: number) => {
        if (Math.abs(d) < 8 && Math.abs(d) >= 0.01) {
          fallos.push(`reto ${c.id} pieza ${i}: ${d.toFixed(2)}px de separación con el espejo`);
        }
      });

      piezas.forEach((p: any, i: number) => {
        const tocaEspejo = Math.abs(alEspejo[i]) < 0.01;
        const vecinas = piezas
          .map((q: any, k: number) => (k === i ? Infinity : geometry.getMinDistanceBetweenPieces(p, q)))
          .filter((d: number) => d < 12);
        if (vecinas.length && Math.min(...vecinas) >= 0.01) {
          fallos.push(`reto ${c.id} pieza ${i}: ${Math.min(...vecinas).toFixed(2)}px de hueco con su vecina`);
        }
        if (!vecinas.length && !tocaEspejo) {
          fallos.push(`reto ${c.id} pieza ${i}: suelta, ni toca el espejo ni otra pieza`);
        }
      });
    });

    expect(fallos).toEqual([]);
  });

  test('piecesNeeded coincide con el número de piezas del objetivo', () => {
    challenges.forEach((c: any) => {
      expect([c.id, c.objective.playerPieces.length]).toEqual([c.id, c.piecesNeeded]);
    });
  });

  test('todos los retos son válidos con la configuración real del juego', () => {
    const invalidos = challenges
      .filter((c: any) => !geometry.validateChallengeCard(c.objective.playerPieces).isValid)
      .map((c: any) => ({
        id: c.id,
        nombre: c.name,
        motivos: geometry.validateChallengeCard(c.objective.playerPieces),
      }));

    expect(invalidos).toEqual([]);
  });

  test('no hay dos retos con el mismo patrón de piezas', () => {
    const patron = (c: any) =>
      JSON.stringify(c.objective.playerPieces.map((p: any) => [p.type, p.face, p.x, p.y, p.rotation]));
    const vistos = new Map<string, number>();
    const duplicados: string[] = [];

    challenges.forEach((c: any) => {
      const clave = patron(c);
      if (vistos.has(clave)) duplicados.push(`reto ${c.id} duplica al ${vistos.get(clave)}`);
      else vistos.set(clave, c.id);
    });

    expect(duplicados).toEqual([]);
  });
});
