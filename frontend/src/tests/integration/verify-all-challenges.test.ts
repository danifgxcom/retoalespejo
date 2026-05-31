import { GameGeometry } from '../../utils/geometry/GameGeometry';
import * as fs from 'fs';

describe('Verificación de todos los challenges', () => {
  const geometry = new GameGeometry({
    width: 700,
    height: 600,
    mirrorLineX: 700,
    pieceSize: 100
  });

  test('Cargar y analizar todos los challenges del archivo JSON', () => {
    const challengesData = JSON.parse(fs.readFileSync('./public/challenges.json', 'utf8'));

    expect(challengesData).toBeDefined();
    expect(Array.isArray(challengesData)).toBe(true);

    challengesData.forEach((challenge: any) => {
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
