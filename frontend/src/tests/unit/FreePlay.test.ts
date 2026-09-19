import { buildFreeDeck } from '../../utils/progress/freePlay';
import { loadGameProgress, saveGameProgress } from '../../utils/progress/gameProgress';
import campaignData from '../../../../shared/challenges.json';
import tastersData from '../../../../shared/free-challenges.json';
import type { Challenge } from '../../components/ChallengeCard';
import { GameGeometry, ValidationService } from '@reto/geometry';

const campaign = campaignData as Challenge[];
const tasters = tastersData as Challenge[];
beforeEach(() => localStorage.clear());
test('new players get the heart and six tasters, not locked campaign cards', () => {
  expect(buildFreeDeck(campaign, tasters, []).map(c => c.id)).toEqual([1, ...tasters.map(c => c.id)]);
});
test('campaign progress exposes unlocked cards; legacy completed cards remain replayable', () => {
  expect(buildFreeDeck(campaign, [], [1]).map(c => c.id)).toEqual([1, 101]);
  expect(buildFreeDeck(campaign, [], [1, 4]).map(c => c.id)).toEqual([1, 101, 4]);
});
test('free results cannot unlock or overwrite the campaign', () => {
  const original = { lastChallenge: 101, completed: [1], bestTimes: { 1: 25 } };
  saveGameProgress(original);
  saveGameProgress({ lastChallenge: 205, completed: [101, 205], bestTimes: { 205: 42 } }, 'free');
  expect(loadGameProgress()).toEqual(original);
  expect(loadGameProgress('free').completed).toEqual([101, 205]);
  expect(buildFreeDeck(campaign, [], loadGameProgress().completed)).toHaveLength(2);
});
test('six new figures have valid geometry, mixed A/B pieces and three difficulty levels', () => {
  const geometry = new GameGeometry({ width: 700, height: 600, mirrorLineX: 700, pieceSize: 100 });
  expect(tasters).toHaveLength(6);
  expect(tasters.map(c => c.piecesNeeded)).toEqual([2, 2, 3, 3, 4, 4]);
  expect(new Set([...campaign, ...tasters].map(c => c.id)).size).toBe(22);
  tasters.forEach(card => {
    expect(new Set(card.objective.playerPieces.map(p => p.type))).toEqual(new Set(['A', 'B']));
    expect(geometry.validateChallengeCard(card.objective.playerPieces).isValid).toBe(true);
    [...campaign, ...tasters].filter(other => other.id !== card.id).forEach(other => {
      expect(ValidationService.figuresMatch(card.objective.playerPieces, other.objective.playerPieces)).toBe(false);
    });
  });
});
