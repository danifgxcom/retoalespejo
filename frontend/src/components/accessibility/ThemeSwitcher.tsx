import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeSwitcherProps {
  className?: string;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={() => {
        const newTheme = theme === 'colorful' ? 'accessible' : 'colorful';
        console.log(`🎭 Theme switched: ${theme} → ${newTheme}`);
        toggleTheme();
      }}
      className={`flex items-center gap-2 rounded-lg sm:rounded-xl transition-all shadow-lg transform hover:scale-105 ${className}`}
      style={{
        backgroundColor: 'var(--button-primary-bg)',
        color: 'var(--text-on-primary)'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--button-primary-bg)';
      }}
      aria-label={`Cambiar a tema ${theme === 'colorful' ? 'accesible' : 'colorido'}`}
      type="button"
    >
      {theme === 'colorful' ? (
        <>
          <span aria-hidden="true" className="text-lg">🌙</span>
          <span className="hidden sm:inline">Tema Accesible</span>
        </>
      ) : (
        <>
          <span aria-hidden="true" className="text-lg">🎨</span>
          <span className="hidden sm:inline">Tema Colorido</span>
        </>
      )}
    </button>
  );
};

export default ThemeSwitcher;
