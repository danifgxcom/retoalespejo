import { act, renderHook, waitFor } from '@testing-library/react';
import { useGameLogic } from '../../hooks/useGameLogic';
import { ChallengeGenerator } from '../../utils/challenges/ChallengeGenerator';
import { loadGameProgress, saveGameProgress } from '../../utils/progress/gameProgress';
import type { Challenge } from '../../components/ChallengeCard';
import campaignData from '../../../../shared/challenges.json';
import tastersData from '../../../../shared/free-challenges.json';

const campaign = campaignData as Challenge[];
const tasters = tastersData as Challenge[];
beforeEach(() => {
  localStorage.clear();
  jest.spyOn(ChallengeGenerator.prototype, 'getAvailableChallenges').mockResolvedValue(campaign);
});
afterEach(() => jest.restoreAllMocks());

test('free session can navigate unsolved cards and win without modifying campaign progress', async () => {
  const progress = { lastChallenge: 101, completed: [1], bestTimes: { 1: 35 } };
  saveGameProgress(progress);
  const { result } = renderHook(() => useGameLogic());
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  act(() => result.current.startFreePlay(tasters, 0));
  expect(result.current.playMode).toBe('free');
  expect(result.current.canGoToNextChallenge).toBe(true);
  act(() => result.current.nextChallenge());
  expect(result.current.currentChallenge).toBe(1);
  act(() => result.current.setPieces(tasters[1].objective.playerPieces.map((p, i) => ({ ...p, id: i + 1, placed: true, centerColor: '#FFD700', triangleColor: '#FF4444' }))));
  act(() => expect(result.current.checkSolutionWithMirrors(27).isCorrect).toBe(true));
  expect(loadGameProgress()).toEqual(progress);
  expect(loadGameProgress('free').completed).toContain(tasters[1].id);
  act(() => result.current.startCampaign());
  expect(result.current.playMode).toBe('campaign');
  expect(result.current.challenges).toEqual(campaign);
  expect(result.current.currentChallenge).toBe(1);
  expect(result.current.canGoToNextChallenge).toBe(false);
});

test('selecting the same free card again resets pieces and undo history', async () => {
  const { result } = renderHook(() => useGameLogic());
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  act(() => result.current.startFreePlay([...tasters], 0));
  const revision = result.current.sessionRevision;
  act(() => {
    result.current.pushHistory(result.current.pieces);
    result.current.setPieces([]);
  });
  act(() => result.current.startFreePlay([...tasters], 0));
  expect(result.current.pieces).toHaveLength(2);
  expect(result.current.canUndo).toBe(false);
  expect(result.current.sessionRevision).toBe(revision + 1);
});
