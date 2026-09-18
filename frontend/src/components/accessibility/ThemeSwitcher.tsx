import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeClarity } from '../../utils/theme/themePreferences';

interface ThemeSwitcherProps {
  className?: string;
}

const CLARITY_SEQUENCE: ThemeClarity[] = ['auto', 'light', 'dark'];
const CLARITY_ICON: Record<ThemeClarity, string> = { auto: '🖥️', light: '☀️', dark: '🌙' };
const CLARITY_LABEL: Record<ThemeClarity, string> = { auto: 'Automático', light: 'Claro', dark: 'Oscuro' };

/**
 * F12: dos controles independientes para los dos ejes del tema. Claridad
 * cicla auto → claro → oscuro; paleta alterna normal / alto contraste.
 * Antes había un único interruptor que los mezclaba en dos combinaciones fijas.
 */
const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = '' }) => {
  const { clarity, palette, setClarity, setPalette } = useTheme();

  const cycleClarity = () => {
    const next = CLARITY_SEQUENCE[(CLARITY_SEQUENCE.indexOf(clarity) + 1) % CLARITY_SEQUENCE.length];
    setClarity(next);
  };

  const togglePalette = () => setPalette(palette === 'normal' ? 'high' : 'normal');

  const buttonClass = `inline-flex items-center gap-1.5 rounded-xl font-semibold shadow-sm transition hover:brightness-110 active:scale-95 ${className}`;
  const buttonStyle: React.CSSProperties = { backgroundColor: 'var(--button-primary-bg)', color: 'var(--text-on-primary)' };

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={cycleClarity}
        className={buttonClass}
        style={buttonStyle}
        aria-label={`Claridad: ${CLARITY_LABEL[clarity]}. Cambiar.`}
        title={`Claridad: ${CLARITY_LABEL[clarity]}`}
      >
        <span aria-hidden="true" className="text-lg leading-none">{CLARITY_ICON[clarity]}</span>
        <span className="hidden 2xl:inline">{CLARITY_LABEL[clarity]}</span>
      </button>
      <button
        type="button"
        onClick={togglePalette}
        className={buttonClass}
        style={buttonStyle}
        aria-pressed={palette === 'high'}
        aria-label={`Paleta ${palette === 'high' ? 'de alto contraste' : 'normal'}. Cambiar.`}
        title={`Paleta: ${palette === 'high' ? 'alto contraste' : 'normal'}`}
      >
        <span aria-hidden="true" className="text-lg leading-none">{palette === 'high' ? '🔆' : '🎨'}</span>
        {/*
          Rótulo FIJO: nombra lo que hace el botón, no el estado en que está.
          Con "Normal" / "Alta distinguibilidad" el botón cambiaba de ancho al
          pulsarlo y la botonera entera se partía de línea. El estado lo dicen
          el icono, el `title` y `aria-pressed`, que no ocupan sitio.
        */}
        <span className="hidden 2xl:inline">Contraste</span>
      </button>
    </div>
  );
};

export default ThemeSwitcher;
