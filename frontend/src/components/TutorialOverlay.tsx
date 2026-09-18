import React, { useEffect, useRef, useState } from 'react';
import { Piece } from './GamePiece';
import { Challenge } from './ChallengeCard';
import { GameGeometry } from '@reto/geometry';
import { TUTORIAL_STEPS, advanceTutorialStep, isTutorialComplete } from '../utils/tutorial/tutorialSteps';
import { loadTutorialSeen, saveTutorialSeen } from '../utils/progress/gameProgress';

/** F06: el tutorial vive sólo en el Reto 1 (una sola pieza, id fijo). */
const TUTORIAL_CHALLENGE_ID = 1;

interface TutorialOverlayProps {
  pieces: Piece[];
  currentChallenge: number;
  challenges: Challenge[];
  geometry: GameGeometry;
}

/**
 * F06: tutorial de tres pasos (mover, girar, tocar el espejo) sobre el
 * Reto 1, descartable y que no se repite una vez visto.
 *
 * No es un modal: nunca bloquea el foco. En escritorio (xl+, lienzo grande)
 * se dibuja como tarjeta flotante en una esquina del lienzo, un solape
 * pequeño que no molesta. Por debajo de xl el lienzo es demasiado bajo
 * (~250px) para tapar nada sin ocultar la única pieza del reto, así que ahí
 * es una banda propia EN EL FLUJO NORMAL, encima del lienzo - solape cero.
 * El avance no depende de ningún gesto propio del tutorial: observa el mismo
 * estado de la pieza (placed/rotation/tocar el espejo) que ya actualizan
 * tanto el arrastre por puntero como el teclado de GameCanvas, así que
 * cualquiera de los dos completa los pasos igual.
 */
const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ pieces, currentChallenge, challenges, geometry }) => {
  // Se lee una sola vez al montar: si se marca como visto durante esta
  // sesión (ver más abajo), la tarjeta sigue visible hasta que el jugador la
  // cierre - sólo una recarga de página respeta ya la bandera persistida.
  const [seenBefore] = useState(loadTutorialSeen);
  const [dismissed, setDismissed] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const initialRotationRef = useRef<number | null>(null);

  const piece = challenges[currentChallenge]?.id === TUTORIAL_CHALLENGE_ID && pieces.length === 1
    ? pieces[0]
    : null;

  useEffect(() => {
    if (!piece) {
      initialRotationRef.current = null;
      return;
    }
    if (initialRotationRef.current === null) {
      initialRotationRef.current = piece.rotation;
    }
    const next = advanceTutorialStep(
      stepIndex,
      { placed: piece.placed, rotation: piece.rotation, touchingMirror: geometry.isPieceTouchingMirror(piece) },
      initialRotationRef.current
    );
    if (next !== stepIndex) setStepIndex(next);
  }, [pieces, challenges, currentChallenge, stepIndex, geometry, piece]);

  const finished = isTutorialComplete(stepIndex);

  // Se persiste en cuanto se completa, no sólo al pulsar "Entendido": si el
  // jugador resuelve el reto y pasa al siguiente sin cerrar la tarjeta a
  // mano, el tutorial tampoco debe reaparecer más tarde.
  useEffect(() => {
    if (finished) saveTutorialSeen();
  }, [finished]);

  if (seenBefore || dismissed || !piece) return null;

  const currentStep = TUTORIAL_STEPS[Math.min(stepIndex, TUTORIAL_STEPS.length - 1)];

  return (
    <div
      // Por debajo de xl: banda normal (position: static), a todo lo ancho,
      // en el flujo - empuja lo que va detrás, no lo tapa. Desde xl: vuelve
      // a ser la tarjeta de esquina absoluta de siempre, posicionada contra
      // el propio contenedor con position:relative de la tarjeta del lienzo
      // (mismo padding p-2, así que el offset left-2/top-2 cae exactamente
      // donde caía cuando colgaba del wrapper interior).
      className="relative z-20 mb-2 w-full rounded-2xl border p-3 shadow-lg xl:absolute xl:left-2 xl:top-2 xl:mb-0 xl:max-w-sm xl:p-4"
      style={{ backgroundColor: 'var(--card-elevated-bg)', borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Tutorial · Paso {Math.min(stepIndex + 1, TUTORIAL_STEPS.length)} de {TUTORIAL_STEPS.length}
          </p>
          <h2 className="text-base font-bold">{finished ? '¡Perfecto!' : currentStep.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => { saveTutorialSeen(); setDismissed(true); }}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium transition hover:brightness-110"
          style={{ backgroundColor: 'var(--button-secondary-bg)', color: 'var(--text-on-secondary)' }}
          aria-label={finished ? 'Entendido, cerrar tutorial' : 'Saltar tutorial'}
        >
          {finished ? 'Entendido' : 'Saltar'}
        </button>
      </div>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {finished
          ? 'Ya sabes mover, girar y reflejar una pieza. A por el resto de los retos.'
          : currentStep.instruction}
      </p>
    </div>
  );
};

export default TutorialOverlay;
