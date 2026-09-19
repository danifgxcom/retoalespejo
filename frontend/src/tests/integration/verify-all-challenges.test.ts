import { GameGeometry } from '@reto/geometry';
import { Challenge } from '../../components/ChallengeCard';
import * as fs from 'fs';
import { CANVAS_CONSTANTS } from '../../utils/canvas/CanvasConstants';

describe('Verificación de todos los challenges', () => {
  const geometry = new GameGeometry({
    width: 700,
    height: CANVAS_CONSTANTS.GAME_AREA_HEIGHT,
    mirrorLineX: 700,
    pieceSize: 100
  });

  test('Cargar y analizar todos los challenges del archivo JSON', () => {
    const challengesData: Challenge[] = JSON.parse(fs.readFileSync('./public/challenges.json', 'utf8'));

    expect(challengesData).toBeDefined();
    expect(Array.isArray(challengesData)).toBe(true);

    challengesData.forEach((challenge) => {
      const pieces = challenge.objective.playerPieces;
      const validation = geometry.validateChallengeCard(pieces);

      expect(validation).toMatchObject({
        isValid: true,
        hasReflectionOverlaps: false,
        hasPieceOverlaps: false,
        touchesMirror: true,
        entersMirror: false,
        piecesConnected: true,
        piecesInArea: true
      });
    });
  });
});
