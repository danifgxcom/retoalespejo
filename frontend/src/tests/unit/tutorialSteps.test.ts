import {
  TUTORIAL_STEPS,
  advanceTutorialStep,
  isTutorialStepComplete,
  isTutorialComplete
} from '../../utils/tutorial/tutorialSteps';

describe('tutorialSteps (F06)', () => {
  test('define exactamente tres pasos: mover, girar, espejo', () => {
    expect(TUTORIAL_STEPS.map(step => step.id)).toEqual(['drag', 'rotate', 'mirror']);
  });

  describe('isTutorialStepComplete', () => {
    test('drag se cumple cuando la pieza está colocada en el área de juego', () => {
      expect(isTutorialStepComplete('drag', { placed: false, rotation: 45, touchingMirror: false }, 45)).toBe(false);
      expect(isTutorialStepComplete('drag', { placed: true, rotation: 45, touchingMirror: false }, 45)).toBe(true);
    });

    test('rotate se cumple cuando la rotación cambia respecto al valor inicial', () => {
      expect(isTutorialStepComplete('rotate', { placed: true, rotation: 45, touchingMirror: false }, 45)).toBe(false);
      expect(isTutorialStepComplete('rotate', { placed: true, rotation: 90, touchingMirror: false }, 45)).toBe(true);
    });

    test('mirror se cumple cuando la pieza toca el espejo', () => {
      expect(isTutorialStepComplete('mirror', { placed: true, rotation: 90, touchingMirror: false }, 45)).toBe(false);
      expect(isTutorialStepComplete('mirror', { placed: true, rotation: 90, touchingMirror: true }, 45)).toBe(true);
    });
  });

  describe('advanceTutorialStep', () => {
    test('no avanza si el estado de la pieza no cumple el paso actual', () => {
      const next = advanceTutorialStep(0, { placed: false, rotation: 45, touchingMirror: false }, 45);
      expect(next).toBe(0);
    });

    test('avanza un solo paso cuando sólo se cumple el actual', () => {
      const next = advanceTutorialStep(0, { placed: true, rotation: 45, touchingMirror: false }, 45);
      expect(next).toBe(1);
    });

    test('encadena varios pasos si el estado ya los cumple todos a la vez', () => {
      const next = advanceTutorialStep(0, { placed: true, rotation: 90, touchingMirror: true }, 45);
      expect(next).toBe(3);
      expect(isTutorialComplete(next)).toBe(true);
    });

    test('desde un paso intermedio, sólo avanza lo que el estado permita', () => {
      const next = advanceTutorialStep(1, { placed: true, rotation: 90, touchingMirror: false }, 45);
      expect(next).toBe(2);
      expect(isTutorialComplete(next)).toBe(false);
    });

    test('un índice ya completo se queda completo', () => {
      const next = advanceTutorialStep(3, { placed: true, rotation: 90, touchingMirror: true }, 45);
      expect(next).toBe(3);
    });
  });

  describe('isTutorialComplete', () => {
    test('sólo es completo cuando el índice alcanza el número de pasos', () => {
      expect(isTutorialComplete(0)).toBe(false);
      expect(isTutorialComplete(2)).toBe(false);
      expect(isTutorialComplete(3)).toBe(true);
      expect(isTutorialComplete(4)).toBe(true);
    });
  });
});
