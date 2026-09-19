import { collections, collectionEntries } from '../../utils/progress/collections';
import campaign from '../../../../shared/challenges.json';
import tasters from '../../../../shared/free-challenges.json';
import { GameGeometry } from '@reto/geometry';

describe('colecciones del gabinete', () => {
  const cards = collections.flatMap(c => c.cards);
  test('24 estudios estables, sin sustituir tarjetas anteriores', () => {
    expect(collections).toHaveLength(4);
    expect(cards).toHaveLength(24);
    const all = [...campaign, ...tasters, ...cards];
    expect(new Set(all.map(c => c.id)).size).toBe(all.length);
    expect(new Set(all.map(c => c.name)).size).toBe(all.length);
    for (const collection of collections) {
      expect(collection.cards.map(c => c.piecesNeeded)).toEqual([2, 2, 3, 3, 4, 4]);
      expect(new Set(collection.cards.flatMap(c => c.targetPieces.map(p => p.type)))).toEqual(new Set(['A', 'B']));
      expect(new Set(collection.cards.flatMap(c => c.targetPieces.map(p => p.face)))).toEqual(new Set(['front', 'back']));
    }
  });
  test('dos aperitivos por colección; avances independientes y sin saltos', () => {
    expect(collectionEntries([]).filter(e => e.available)).toHaveLength(8);
    expect(collectionEntries([301]).find(e => e.card.id === 303)?.available).toBe(false);
    const entries = collectionEntries([301, 302]);
    expect(entries.find(e => e.card.id === 303)?.available).toBe(true);
    expect(entries.find(e => e.card.id === 304)?.available).toBe(false);
    expect(entries.find(e => e.card.id === 309)?.available).toBe(false);
    expect(collectionEntries([304]).find(e => e.card.id === 304)?.available).toBe(true);
    expect(collectionEntries(cards.map(c => c.id)).every(e => e.available)).toBe(true);
  });
  test.each(cards.map(c => [c.name, c] as const))('%s: geometría válida y objetivo coherente', (_name, card) => {
    const geometry = new GameGeometry({ width: 700, height: 600, mirrorLineX: 700, pieceSize: 100 });
    expect(card.targetPieces).toEqual(card.objective.playerPieces);
    expect(card.targetPieces).toHaveLength(card.piecesNeeded);
    expect(geometry.validateChallengeCard(card.objective.playerPieces).isValid).toBe(true);
  });
});
