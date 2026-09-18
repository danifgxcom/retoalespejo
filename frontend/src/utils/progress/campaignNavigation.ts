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

  // Un reto se desbloquea al completar el anterior: el último desbloqueado
  // es (índice completado más alto) + 1, sin pasar del final del array.
  let maxCompletedIndex = -1;
  completedChallenges.forEach(index => {
    if (index > maxCompletedIndex) maxCompletedIndex = index;
  });
  const maxUnlockedChallenge = Math.min(maxCompletedIndex + 1, totalChallenges - 1);

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
