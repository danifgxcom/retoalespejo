import React from 'react';
import { X } from './ui/AtelierIcons';
import { MirrorMark } from './Identity';

interface ValidationFeedbackProps {
  result: {
    isCorrect: boolean;
    message: string;
  } | null;
  onClose: () => void;
}

/**
 * F09: aviso de validación como región de estado, no como diálogo bloqueante.
 *
 * `role="status"` + `aria-live="polite"` para que los lectores de pantalla lo
 * anuncien sin robarle el foco a lo que el jugador estaba haciendo (por eso
 * tampoco es `alertdialog`: no exige foco ni devolución de foco). Sin
 * autocierre - antes se cerraba solo a los 4-6 segundos, así que un mensaje
 * largo podía desaparecer antes de leerse; ahora lo cierra el jugador.
 *
 * Los colores salen de las variables de tema (`--button-success-bg` /
 * `--button-danger-bg`, `--card-bg`, `--text-*`), no de clases Tailwind con
 * colores fijos: así funciona en las cuatro combinaciones de claridad×paleta.
 */
const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({ result, onClose }) => {
  if (!result) return null;

  const accentVar = result.isCorrect ? '--button-success-bg' : '--button-danger-bg';
  const textOnAccentVar = result.isCorrect ? '--text-on-success' : '--text-on-danger';

  return (
    <div
      role="status"
      aria-live="polite"
      className="result-note fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border-2 p-4 shadow-2xl"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: `var(${accentVar})`,
        color: 'var(--text-primary)',
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `var(${accentVar})`, color: `var(${textOnAccentVar})` }}
          aria-hidden="true"
        >
          <MirrorMark className="result-mark" />
        </span>

        <div className="min-w-0 flex-1 pt-1">
          <p className="font-semibold">{result.isCorrect ? 'Simetría encontrada' : 'Ajusta la composición'}</p>
          <p className="mt-1 text-sm leading-relaxed">{result.message}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full p-1 hover:opacity-70"
          style={{ color: 'var(--text-tertiary)' }}
          aria-label="Cerrar mensaje de validación"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default ValidationFeedback;
