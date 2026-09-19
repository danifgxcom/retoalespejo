import { computeCampaignNavigation } from '../../utils/progress/campaignNavigation';

/**
 * F04 + D2: campaña libre entre desbloqueados, sin ciclar.
 */
describe('computeCampaignNavigation', () => {
  test('retener un reto antiguo avanzado no salta los nuevos estudios previos', () => {
    expect(computeCampaignNavigation(0, new Set([0, 8]), 16).maxUnlockedChallenge).toBe(1);
  });
  test('sin retos, no se puede navegar', () => {
    expect(computeCampaignNavigation(0, new Set(), 0)).toEqual({
      maxUnlockedChallenge: 0,
      canGoToPreviousChallenge: false,
      canGoToNextChallenge: false,
      isLastChallenge: false,
      isCampaignComplete: false
    });
  });

  test('al empezar (nada completado), sólo el primer reto está desbloqueado', () => {
    const nav = computeCampaignNavigation(0, new Set(), 5);
    expect(nav.maxUnlockedChallenge).toBe(0);
    expect(nav.canGoToPreviousChallenge).toBe(false);
    expect(nav.canGoToNextChallenge).toBe(false);
    expect(nav.isLastChallenge).toBe(false);
  });

  test('completar un reto desbloquea el siguiente, no más allá', () => {
    const nav = computeCampaignNavigation(0, new Set([0]), 5);
    expect(nav.maxUnlockedChallenge).toBe(1);
    expect(nav.canGoToNextChallenge).toBe(true);
  });

  test('"Anterior" es libre hasta el primero, sin depender de lo completado', () => {
    const nav = computeCampaignNavigation(2, new Set(), 5);
    expect(nav.canGoToPreviousChallenge).toBe(true);

    const enElPrimero = computeCampaignNavigation(0, new Set([1, 2]), 5);
    expect(enElPrimero.canGoToPreviousChallenge).toBe(false);
  });

  test('en el último reto no hay "Siguiente": no cicla al primero', () => {
    const nav = computeCampaignNavigation(4, new Set([0, 1, 2, 3, 4]), 5);
    expect(nav.isLastChallenge).toBe(true);
    expect(nav.canGoToNextChallenge).toBe(false);
  });

  test('no se puede avanzar por delante de lo desbloqueado aunque no sea el último', () => {
    // Desbloqueado hasta el índice 1 (se completó el 0), pero estamos viendo el 1.
    const nav = computeCampaignNavigation(1, new Set([0]), 5);
    expect(nav.maxUnlockedChallenge).toBe(1);
    expect(nav.canGoToNextChallenge).toBe(false);
  });

  test('campaña completa cuando se han resuelto todos los retos', () => {
    const nav = computeCampaignNavigation(4, new Set([0, 1, 2, 3, 4]), 5);
    expect(nav.isCampaignComplete).toBe(true);

    const incompleta = computeCampaignNavigation(4, new Set([0, 1, 2, 3]), 5);
    expect(incompleta.isCampaignComplete).toBe(false);
  });
});
