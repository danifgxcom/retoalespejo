import data from '../../../../shared/collections.json';
import type { Challenge } from '../../components/ChallengeCard';

export interface ChallengeCollection { id: string; name: string; cards: Challenge[] }
export const collections = data as ChallengeCollection[];

/** Two tasters per collection; solving the prefix opens the next study. */
export function collectionEntries(completed: number[], catalog = collections) {
  const solved = new Set(completed);
  return catalog.flatMap(collection => {
    let prefix = 0;
    while (prefix < collection.cards.length && solved.has(collection.cards[prefix].id)) prefix++;
    return collection.cards.map((card, index) => ({
      card, collectionId: collection.id,
      available: index <= Math.max(1, prefix) || solved.has(card.id),
      requirement: collection.cards.slice(0, index).filter(c => !solved.has(c.id)).map(c => c.name),
    }));
  });
}
