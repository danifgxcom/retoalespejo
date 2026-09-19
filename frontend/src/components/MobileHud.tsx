import React, { useState } from 'react';
import { CheckCircle, Clock, X } from './ui/AtelierIcons';
import { Challenge } from './ChallengeCard';
import ChallengeObjective from './ChallengeObjective';
import ChallengeThumbnail from './ui/ChallengeThumbnail';
import Modal from './ui/Modal';

interface MobileHudProps {
  challenge: Challenge;
  index: number;
  total: number;
  timerText: string;
  timerPaused: boolean;
  onCheckSolution?: () => unknown;
}

/**
 * Lo que hay que tener siempre a la vista en móvil, flotando sobre la página:
 * la carta del reto, el tiempo y el botón de comprobar.
 *
 * Van flotando y no en el flujo porque en vertical la pantalla no da para
 * apilar objetivo + tablero + acciones: puestos en fila, el tablero se iba
 * fuera de la pantalla. `fixed` además los mantiene alcanzables con el pulgar
 * aunque la página esté desplazada, que es el otro problema de tenerlos en el
 * flujo. `xl:hidden` porque en escritorio todo esto ya vive en los paneles
 * laterales, donde no tapa nada.
 *
 * La miniatura es pequeña a propósito (sitúa la figura de un vistazo) y se
 * amplía al tocarla, para poder estudiarla sin dejar el tablero.
 */
const MobileHud: React.FC<MobileHudProps> = ({
  challenge,
  index,
  total,
  timerText,
  timerPaused,
  onCheckSolution
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        className="mobile-hud-summary z-20 flex flex-col items-end gap-1.5 xl:hidden"
        style={{ top: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
      >
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="block w-20 overflow-hidden rounded-xl border shadow-lg transition hover:brightness-110 sm:w-24"
          style={{ borderColor: 'var(--border-medium)' }}
          aria-label={`Ver la figura del reto ${index + 1}: ${challenge.name}`}
        >
          <ChallengeThumbnail
            challenge={challenge}
            width={160}
            height={120}
            backgroundColor="dark-blue"
            alt={`Objetivo del reto ${index + 1}: ${challenge.name}`}
          />
          <span className="mobile-target-label">Ver figura</span>
        </button>

        <span
          className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums shadow-lg"
          style={{
            backgroundColor: 'var(--card-elevated-bg)',
            borderColor: 'var(--border-medium)',
            color: timerPaused ? 'var(--text-tertiary)' : 'var(--text-primary)'
          }}
          aria-label={`Tiempo: ${timerText}${timerPaused ? ', en pausa' : ''}`}
        >
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {timerText}
        </span>
      {onCheckSolution && (
        <button
          type="button"
          onClick={onCheckSolution}
          className="mobile-verify flex min-h-11 items-center gap-2 rounded px-3 font-bold transition hover:brightness-110 xl:hidden"
          style={{
            bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            backgroundColor: 'var(--button-success-bg)',
            color: 'var(--text-on-success)'
          }}
          aria-label="Comprobar solución"
        >
          <CheckCircle className="h-5 w-5" aria-hidden="true" />
          Verificar
        </button>
      )}
      </div>

      {expanded && (
        <Modal isOpen={expanded} onClose={() => setExpanded(false)} title={`Estudio ${index + 1}: ${challenge.name}`} maxWidth="sm">
          <ChallengeObjective
            challenge={challenge}
            index={index}
            total={total}
            width={360}
            height={270}
            className="w-full max-w-sm"
          />
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold"
            style={{ backgroundColor: 'var(--button-secondary-bg)', color: 'var(--text-on-secondary)' }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Volver al tablero
          </button>
        </Modal>
      )}
    </>
  );
};

export default MobileHud;
