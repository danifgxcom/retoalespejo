/**
 * F04 + D2: campaña libre entre los retos ya desbloqueados.
 *
 * Lógica pura (sin React) para poder comprobarla con un test unitario
 * directo, sin tener que montar todo useGameLogic (fetch, geometría, etc).
 */

export interface CampaignNavigation {
  maxUnlockedChallenge: number;
  canGoToPreviousChallenge: boolean;
  canGoToNextChallenge: boolean;
  isLastChallenge: boolean;
  isCampaignComplete: boolean;
}

export const computeCampaignNavigation = (
  currentChallenge: number,
  completedChallenges: Set<number>,
  totalChallenges: number
): CampaignNavigation => {
  if (totalChallenges === 0) {
    return {
      maxUnlockedChallenge: 0,
      canGoToPreviousChallenge: false,
      canGoToNextChallenge: false,
      isLastChallenge: false,
      isCampaignComplete: false
    };
  }

  // Only a continuous run unlocks the next study. A retained legacy ID later
  // in the new campaign must not unlock all the new figures before it.
  let maxUnlockedChallenge = 0;
  while (maxUnlockedChallenge < totalChallenges - 1 && completedChallenges.has(maxUnlockedChallenge)) maxUnlockedChallenge++;

  const isLastChallenge = currentChallenge === totalChallenges - 1;

  return {
    maxUnlockedChallenge,
    // "Anterior" es libre hasta el primero.
    canGoToPreviousChallenge: currentChallenge > 0,
    // "Siguiente" no cicla: ni en el último reto, ni más allá de lo desbloqueado.
    canGoToNextChallenge: !isLastChallenge && currentChallenge < maxUnlockedChallenge,
    isLastChallenge,
    isCampaignComplete: completedChallenges.size >= totalChallenges
  };
};
