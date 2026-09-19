import React from 'react';
import { FlipHorizontal, RotateCcw, RotateCw } from './ui/AtelierIcons';

interface MobileGameActionsProps {
  selectedPieceId: number | null;
  onRotateClockwise: (pieceId: number, fromControl?: boolean) => void;
  onRotateCounterClockwise: (pieceId: number, fromControl?: boolean) => void;
  onFlip: (pieceId: number, fromControl?: boolean) => void;
}

/**
 * Acciones de la pieza seleccionada en móvil: banda FIJA en el flujo normal,
 * justo debajo del lienzo (nunca superpuesta a él - en un tablero de ~250px de
 * alto una barra flotante tapa la única pieza del reto). Sigue siempre
 * alcanzable sin scroll porque el lienzo por debajo de xl se dimensiona por
 * ancho, no por el espacio que quede libre.
 *
 * Comprobar la solución NO está aquí: es la acción de la partida, no de una
 * pieza, y vive en el botón flotante de `MobileHud`, siempre alcanzable
 * aunque la página esté desplazada.
 */
const MobileGameActions: React.FC<MobileGameActionsProps> = ({
  selectedPieceId,
  onRotateClockwise,
  onRotateCounterClockwise,
  onFlip,
}) => {
  const hasSelection = selectedPieceId !== null;
  const pieceLabel = hasSelection ? `pieza ${selectedPieceId}` : 'pieza seleccionada';

  return (
    <div
      className="mt-2 flex items-center justify-center xl:hidden"
      role="toolbar"
      aria-label="Acciones de la pieza seleccionada"
    >
      <div
        className="flex items-center gap-1 rounded-2xl border px-1.5 py-1 shadow-lg"
        style={{ backgroundColor: 'var(--card-elevated-bg)', borderColor: 'var(--border-medium)' }}
      >
        <span className="sr-only" aria-live="polite">
          {hasSelection ? `Pieza ${selectedPieceId} seleccionada` : 'Selecciona una pieza en el lienzo para usar sus acciones'}
        </span>
        <button
          type="button"
          className="grid min-h-11 min-w-11 place-items-center rounded-xl transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: 'var(--button-secondary-bg)', color: 'var(--text-on-secondary)' }}
          onClick={() => selectedPieceId !== null && onRotateCounterClockwise(selectedPieceId, true)}
          disabled={!hasSelection}
          aria-label={`Girar ${pieceLabel} en sentido antihorario`}
          title="Girar en sentido antihorario"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="grid min-h-11 min-w-11 place-items-center rounded-xl transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: 'var(--button-primary-bg)', color: 'var(--text-on-primary)' }}
          onClick={() => selectedPieceId !== null && onRotateClockwise(selectedPieceId, true)}
          disabled={!hasSelection}
          aria-label={`Girar ${pieceLabel} en sentido horario`}
          title="Girar en sentido horario"
        >
          <RotateCw className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="grid min-h-11 min-w-11 place-items-center rounded-xl transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: 'var(--button-success-bg)', color: 'var(--text-on-success)' }}
          onClick={() => selectedPieceId !== null && onFlip(selectedPieceId, true)}
          disabled={!hasSelection}
          aria-label={`Voltear ${pieceLabel}`}
          title="Voltear pieza"
        >
          <FlipHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default MobileGameActions;
