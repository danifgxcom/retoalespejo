import type { Challenge } from '../../components/ChallengeCard';
import { computeCampaignNavigation } from './campaignNavigation';

/** Free play exposes unlocked campaign cards, never the locked remainder. */
export function buildFreeDeck(campaign: Challenge[], tasters: Challenge[], completed: number[]): Challenge[] {
  const solved = new Set(campaign.flatMap((c, i) => completed.includes(c.id) ? [i] : []));
  const { maxUnlockedChallenge } = computeCampaignNavigation(0, solved, campaign.length);
  return [...campaign.filter((c, i) => i <= maxUnlockedChallenge || completed.includes(c.id)), ...tasters];
}
