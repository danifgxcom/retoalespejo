import { GameGeometry } from '@reto/geometry';
import { Challenge } from '../../components/ChallengeCard';
import * as fs from 'fs';

describe('Verificación de todos los challenges', () => {
  const geometry = new GameGeometry({
    width: 700,
    height: 500, // configuración real del juego (antes 600, dejaba pasar retos rotos)
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
