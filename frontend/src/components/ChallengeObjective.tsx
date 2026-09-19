import React, { useEffect, useState } from 'react';
import { Challenge } from './ChallengeCard';
import ChallengeThumbnail from './ui/ChallengeThumbnail';

interface ChallengeObjectiveProps {
  challenge: Challenge;
  index: number;
  total: number;
  width?: number;
  height?: number;
  className?: string;
  /**
   * Fila en vez de columna: la miniatura al lado del texto en vez de debajo.
   * Es lo que hace que quepa arriba del tablero en móvil sin empujarlo fuera
   * de la pantalla.
   */
  compact?: boolean;
}

/**
 * La figura que hay que conseguir: cabecera, tarjeta y descripción.
 *
 * Vive aquí y no dentro de `RightSidebar` porque aparece en tres sitios con la
 * misma pinta: el panel lateral en escritorio, una banda arriba del tablero en
 * móvil y la presentación a pantalla completa de `ChallengeIntro`.
 */
export const ChallengeObjective: React.FC<ChallengeObjectiveProps> = ({
  challenge,
  index,
  total,
  width,
  height,
  className = '',
  compact = false
}) => {
  const nivel = challenge.difficulty && (
    <span
      className="inline-block text-xs font-semibold rounded-full px-2 py-0.5"
      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
    >
      {challenge.piecesNeeded} {challenge.piecesNeeded === 1 ? 'pieza' : 'piezas'} · {challenge.difficulty}
    </span>
  );

  const miniatura = (
    <ChallengeThumbnail
      challenge={challenge}
      width={width ?? (compact ? 160 : 300)}
      height={height ?? (compact ? 120 : 225)}
      backgroundColor="dark-blue"
      alt={`Objetivo del reto ${index + 1}: ${challenge.name}`}
    />
  );

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="shrink-0 w-28 sm:w-36">{miniatura}</div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {challenge.name}
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Desafío {index + 1} de {total}
          </p>
          <div className="mt-1">{nivel}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`objective-card ${className}`}>
      <div className="text-center mb-3">
        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Desafío {index + 1} de {total}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {challenge.name}
        </p>
        {nivel && <div className="mt-1">{nivel}</div>}
      </div>

      <div className="flex justify-center">{miniatura}</div>

      <div className="text-center mt-2">
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {challenge.description || 'Objetivo del reto'}
        </p>
      </div>
    </div>
  );
};

/** Lo que dura la presentación del reto antes de dejar paso al tablero. */
export const CHALLENGE_INTRO_MS = 5000;

/**
 * Presentación del reto en móvil: la figura a conseguir sola en pantalla unos
 * segundos y luego el tablero.
 *
 * En una pantalla de móvil el tablero y el objetivo no caben a la vez con un
 * tamaño en el que se distingan, así que se enseñan por turnos en vez de
 * apretar los dos. `xl:hidden` porque en escritorio el objetivo está siempre a
 * la vista en el panel lateral y tapar el tablero ahí no aportaría nada.
 *
 * No atrapa el foco ni bloquea: se va sola al cumplirse el tiempo y cualquier
 * toque o tecla la salta antes.
 */
export const ChallengeIntro: React.FC<{ challenge: Challenge; index: number; total: number }> = ({
  challenge,
  index,
  total
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), CHALLENGE_INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [challenge.id]);

  useEffect(() => {
    if (!visible) return;
    const skip = () => setVisible(false);
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 xl:hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Reto ${index + 1}: ${challenge.name}. La figura que hay que conseguir.`}
      onPointerDown={() => setVisible(false)}
    >
      <ChallengeObjective
        challenge={challenge}
        index={index}
        total={total}
        width={360}
        height={270}
        className="w-full max-w-sm"
      />
      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        Toca para empezar
      </p>
    </div>
  );
};

export default ChallengeObjective;
