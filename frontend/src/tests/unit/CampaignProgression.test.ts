import campaign from '../../../public/challenges.json';
import shared from '../../../../shared/challenges.json';
import { ValidationService, GameGeometry } from '@reto/geometry';
import { ChallengeGenerator } from '../../utils/challenges/ChallengeGenerator';
import type { PiecePosition } from '@reto/geometry';

test('client and server publish exactly the same campaign', () => {
  expect(campaign).toEqual(shared);
});
test('creating generators never migrates or mutates the centre-anchored catalogue', () => {
  const before = JSON.stringify(shared);
  const geometry = new GameGeometry({ width: 1400, height: 600, mirrorLineX: 700, pieceSize: 100 });
  new ChallengeGenerator(geometry);
  new ChallengeGenerator(geometry);
  expect(JSON.stringify(shared)).toBe(before);
});
test('four studies per chapter, one extra piece per chapter, beginning with the heart', () => {
  expect(campaign).toHaveLength(16);
  expect(campaign[0].id).toBe(1);
  expect(campaign[0].name).toContain('Corazón');
  expect(new Set(campaign.map(c => c.id)).size).toBe(campaign.length);
  campaign.forEach((c, i) => {
    expect(c.chapterNumber).toBe(Math.floor(i / 4) + 1);
    expect(c.piecesNeeded).toBe(c.chapterNumber);
    expect(c.objective.playerPieces).toHaveLength(c.piecesNeeded);
  });
});
test('every named study has a different figure, not just a displaced copy', () => {
  for (let i = 0; i < campaign.length; i++) for (let j = i + 1; j < campaign.length; j++) {
    if (campaign[i].piecesNeeded !== campaign[j].piecesNeeded) continue;
    expect(ValidationService.figuresMatch(campaign[i].objective.playerPieces as PiecePosition[], campaign[j].objective.playerPieces as PiecePosition[])).toBe(false);
  }
});
