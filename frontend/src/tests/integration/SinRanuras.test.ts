import * as fs from 'fs';
import { GameGeometry } from '@reto/geometry';
import { createRotationAwareGrid } from '../../utils/grid/RotationAwareGrid';

/**
 * Jugar un reto no debe dejar ranuras a la vista.
 *
 * `Winnable.test.ts` comprueba que la solución se acepta; esto comprueba que
 * además se VE bien, que es una cosa distinta y la que se rompió: la validación
 * daba por buenas figuras con ranuras de hasta 6px entre piezas, porque su
 * tolerancia de contacto son 7px. El jugador las veía igual.
 *
 * Se recorre el mismo camino que el juego: soltar cada pieza en la retícula de
 * 10px más cercana a su sitio (lo mejor que se puede hacer a mano), dejar que
 * actúe el encaje y asentar la figura.
 */
const CONFIG = { width: 700, height: 500, mirrorLineX: 700, pieceSize: 100 };
const REJILLA = 10;
const CERCA = 12;
/**
 * Lo que se considera ranura VISIBLE. No es 0: el encaje es voraz — cada pieza
 * se asienta contra las que ya estaban — y en el reto más denso (8 piezas) se
 * queda en un óptimo local con 1px de resto que ninguna pasada más deshace.
 * A escala de tablero eso es medio píxel de pantalla, y el relleno de cada
 * pieza se traza con su propio color justo para tapar esa costura.
 * Antes de que existiera el asentado las ranuras eran de 5 a 6px, bien visibles.
 */
const VISIBLE_PX = 1.5;

const geometry = new GameGeometry(CONFIG);
const challenges = JSON.parse(fs.readFileSync('./public/challenges.json', 'utf8'));
const rejilla = createRotationAwareGrid(geometry, {
  baseGridSize: REJILLA,
  snapDistance: 60,
  mirrorSnapDistance: 20,
  enableIntelligentSnap: true,
});

describe('la figura queda sin ranuras al jugarla', () => {
  test.each<[string, any]>(challenges.map((c: any) => [`reto ${c.id} — ${c.name}`, c]))(
    '%s',
    (_nombre, challenge) => {
      const colocadas: any[] = [];

      challenge.objective.playerPieces.forEach((objetivo: any) => {
        const aRejilla = {
          ...objetivo,
          x: Math.round(objetivo.x / REJILLA) * REJILLA,
          y: Math.round(objetivo.y / REJILLA) * REJILLA,
        };
        const encajada = rejilla.calculateSnapPosition(aRejilla, colocadas);
        colocadas.push({
          ...aRejilla,
          ...(encajada.snapped ? { x: encajada.x, y: encajada.y } : {}),
          placed: true,
        });

        // Asentar, igual que hace el juego al soltar
        rejilla.settlePlacedPieces(colocadas).forEach((asentada, i) => {
          colocadas[i].x = asentada.x;
          colocadas[i].y = asentada.y;
        });
      });

      const ranuras: string[] = [];

      colocadas.forEach((pieza, i) => {
        const alEspejo = Math.abs(
          CONFIG.mirrorLineX - geometry.getPieceBoundingBox(pieza).right
        );
        if (alEspejo > VISIBLE_PX && alEspejo < CERCA) {
          ranuras.push(`pieza ${i}: ${alEspejo.toFixed(2)}px de ranura contra el espejo`);
        }

        colocadas.slice(i + 1).forEach((otra, k) => {
          const hueco = geometry.getMinDistanceBetweenPieces(pieza, otra);
          if (hueco > VISIBLE_PX && hueco < CERCA) {
            ranuras.push(`piezas ${i}-${i + 1 + k}: ${hueco.toFixed(2)}px de ranura`);
          }
        });
      });

      expect(ranuras).toEqual([]);
    }
  );
});
