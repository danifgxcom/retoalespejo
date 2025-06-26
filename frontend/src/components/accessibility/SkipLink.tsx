import React from 'react';

interface SkipLinkProps {
  /**
   * The ID of the main content element to skip to
   */
  targetId: string;
  /**
   * The text to display in the skip link
   */
  text?: string;
  /**
   * Additional CSS class names
   */
  className?: string;
}
import React from 'react';

interface SkipLinkProps {
  /**
   * ID del elemento al que se saltará al activar el enlace
   */
  targetId: string;

  /**
   * Texto del enlace (por defecto "Saltar al contenido principal")
   */
  label?: string;

  /**
   * Estilos CSS adicionales
   */
  className?: string;
}

/**
 * SkipLink - Enlace de salto para usuarios de teclado
 * Permite a los usuarios de teclado saltar directamente al contenido principal
 * sin tener que navegar por todos los elementos del encabezado
 */
const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  label = "Saltar al contenido principal",
  className = "",
}) => {
  return (
    <a
      href={`#${targetId}`}
      className={`skip-link ${className}`}
      onClick={(e) => {
        // Prevenir comportamiento por defecto
        e.preventDefault();

        // Encontrar el elemento objetivo y darle foco
        const target = document.getElementById(targetId);
        if (target) {
          // Asegurar que el elemento pueda recibir foco
          if (!target.hasAttribute('tabindex')) {
            target.setAttribute('tabindex', '-1');
          }

          // Dar foco al elemento objetivo
          target.focus();

          // Actualizar la URL para reflejar el ancla
          window.history.pushState(null, '', `#${targetId}`);
        }
      }}
    >
      {label}
    </a>
  );
};

export default SkipLink;
/**
 * SkipLink component allows keyboard users to bypass navigation
 * and jump directly to the main content.
 * 
 * Usage:
 * 1. Add this component at the top of your layout
 * 2. Ensure your main content has the ID specified in targetId
 * 
 * Example:
 * ```tsx
 * <SkipLink targetId="main-content" />
 * <header>...</header>
 * <main id="main-content">...</main>
 * ```
 */
const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  text = 'Skip to main content',
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.tabIndex = -1;
      targetElement.focus();
      // Remove tabIndex after focus to prevent unexpected behavior
      setTimeout(() => {
        if (targetElement) targetElement.removeAttribute('tabIndex');
      }, 100);
    }
  };

  return (
    <a 
      href={`#${targetId}`}
      className={`skip-link ${className}`}
      onClick={handleClick}
    >
      {text}
    </a>
  );
};

export default SkipLink;