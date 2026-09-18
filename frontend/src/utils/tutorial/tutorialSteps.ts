/**
 * F06: tutorial de tres pasos sobre el Reto 1 (una sola pieza, por eso se
 * eligió: no hay que explicar cómo combinar varias).
 *
 * Máquina de estados pura (sin React), siguiendo el mismo patrón que
 * campaignNavigation/undoHistory: se puede comprobar con un test directo sin
 * montar el hook ni el canvas. El componente sólo observa el estado real de
 * la pieza (la misma que ya actualizan el arrastre por puntero y el teclado
 * de GameCanvas) y llama a estas funciones - así cualquier gesto que cumpla
 * el paso, sea ratón, táctil o teclado, avanza el tutorial igual.
 */

export type TutorialStepId = 'drag' | 'rotate' | 'mirror';

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  instruction: string;
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: 'drag',
    title: 'Mueve la pieza',
    instruction: 'Arrástrala hasta el área de juego. Con el teclado: Tab para seleccionarla y las flechas para moverla.'
  },
  {
    id: 'rotate',
    title: 'Gírala',
    instruction: 'Gírala con el botón de rotación o arrastrándola con el botón derecho. Con el teclado: R.'
  },
  {
    id: 'mirror',
    title: 'Tócala con el espejo',
    instruction: 'Acércala al espejo hasta que lo toque: se reflejará automáticamente al otro lado. Con el teclado: flechas.'
  }
];

export interface TutorialPieceState {
  placed: boolean;
  rotation: number;
  touchingMirror: boolean;
}

/** ¿El paso indicado ya se cumple con el estado actual de la pieza? */
export const isTutorialStepComplete = (
  step: TutorialStepId,
  piece: TutorialPieceState,
  initialRotation: number
): boolean => {
  switch (step) {
    case 'drag': return piece.placed;
    // Todas las rotaciones del juego avanzan en pasos de 45° exactos, así
    // que comparar con el valor inicial (sin margen) es seguro.
    case 'rotate': return piece.rotation !== initialRotation;
    case 'mirror': return piece.touchingMirror;
  }
};

/**
 * Avanza el índice de paso todo lo que el estado actual de la pieza permita.
 * Un solo gesto puede cumplir varios pasos a la vez (p.ej. arrastrar la
 * pieza directamente hasta tocar el espejo), así que se encadena en vez de
 * avanzar de uno en uno.
 */
export const advanceTutorialStep = (
  stepIndex: number,
  piece: TutorialPieceState,
  initialRotation: number
): number => {
  let next = stepIndex;
  while (next < TUTORIAL_STEPS.length && isTutorialStepComplete(TUTORIAL_STEPS[next].id, piece, initialRotation)) {
    next++;
  }
  return next;
};

export const isTutorialComplete = (stepIndex: number): boolean => stepIndex >= TUTORIAL_STEPS.length;
