import * as fs from 'fs';
import { GameGeometry } from '@reto/geometry';
import { ValidationService, SOLUTION_TOLERANCE } from '@reto/geometry';
import { createRotationAwareGrid } from '../../utils/grid/RotationAwareGrid';

/**
 * ¿Se puede ganar el juego?
 *
 * Nadie lo había comprobado de punta a punta. Con tolerancias grandes daba
 * igual; ahora que son estrictas hay que demostrar que la solución del reto es
 * ALCANZABLE por el jugador, no sólo que el objetivo es válido sobre el papel.
 *
 * El jugador no puede colocar una pieza donde quiera: al soltarla, el juego la
 * encaja en una retícula de 10 px o la pega a sus vecinas y al espejo. Estos
 * tests recorren ese mismo camino.
 */
const CONFIG = { width: 700, height: 500, mirrorLineX: 700, pieceSize: 100 };
const REJILLA = 10;

const geometry = new GameGeometry(CONFIG);
const challenges = JSON.parse(fs.readFileSync('./public/challenges.json', 'utf8'));
const comoPieza = (p: any, id: number) => ({ ...p, id, placed: true, centerColor: '#000', triangleColor: '#000' });

describe('cada reto se puede resolver', () => {
  test.each<[string, any]>(challenges.map((c: any) => [`reto ${c.id} — ${c.name}`, c]))('%s', (_nombre, challenge) => {
    const solucion = challenge.objective.playerPieces.map(comoPieza);
    const resultado = ValidationService.validateSolution(solucion, challenge, geometry);

    expect(resultado).toEqual({ isCorrect: true, message: '¡Perfecto! Configuración correcta.' });
  });
});

describe('la solución es alcanzable con el encaje real del juego', () => {
  const rejilla = createRotationAwareGrid(geometry, {
    baseGridSize: REJILLA,
    snapDistance: 60,
    mirrorSnapDistance: 20,
    enableIntelligentSnap: true,
  });

  test.each<[string, any]>(challenges.map((c: any) => [`reto ${c.id} — ${c.name}`, c]))('%s', (_nombre, challenge) => {
    // Se simula a un jugador que suelta cada pieza en la retícula de 10 px más
    // cercana a su sitio, que es lo mejor que puede hacer a mano, y luego deja
    // que actúe el encaje automático.
    const colocadas: any[] = [];

    challenge.objective.playerPieces.forEach((objetivo: any, i: number) => {
      const aRejilla = {
        ...objetivo,
        x: Math.round(objetivo.x / REJILLA) * REJILLA,
        y: Math.round(objetivo.y / REJILLA) * REJILLA,
      };
      const encajada = rejilla.calculateSnapPosition(aRejilla, colocadas);
      colocadas.push(comoPieza(
        { ...aRejilla, ...(encajada.snapped ? { x: encajada.x, y: encajada.y } : {}) },
        i
      ));
    });

    const resultado = ValidationService.validateSolution(colocadas, challenge, geometry);

    if (!resultado.isCorrect) {
      // Mensaje útil cuando falle: cuánto se desvía cada pieza de su objetivo.
      const desvios = colocadas.map((p, i) => {
        const o = challenge.objective.playerPieces[i];
        return `p${i}: ${Math.hypot(p.x - o.x, p.y - o.y).toFixed(1)}px`;
      });
      throw new Error(
        `${resultado.message}\nmargen=${SOLUTION_TOLERANCE.position}px, desvíos: ${desvios.join(', ')}`
      );
    }
  });
});
