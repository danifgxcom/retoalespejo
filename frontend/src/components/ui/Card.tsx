import React, { KeyboardEvent } from 'react';
import React from 'react';

interface CardProps {
  /**
   * Contenido principal de la tarjeta
   */
  children: React.ReactNode;

  /**
   * Título de la tarjeta (opcional)
   */
  title?: string;

  /**
   * Función a ejecutar al hacer clic en la tarjeta (opcional)
   */
  onClick?: () => void;

  /**
   * Clase CSS adicional (opcional)
   */
  className?: string;

  /**
   * Descripción de la tarjeta para lectores de pantalla (opcional)
   */
  ariaLabel?: string;

  /**
   * ID del elemento que describe la tarjeta (opcional)
   */
  ariaDescribedby?: string;
}

/**
 * Componente Card accesible
 * Proporciona una tarjeta interactiva con soporte para teclado y lectores de pantalla
 */
const Card: React.FC<CardProps> = ({
  children,
  title,
  onClick,
  className = '',
  ariaLabel,
  ariaDescribedby,
}) => {
  // Determinar si la tarjeta debe ser interactiva
  const isInteractive = !!onClick;

  // Determinar el elemento contenedor apropiado
  const Component = isInteractive ? 'button' : 'div';

  // Generar un ID único para el título si no hay ariaLabel
  const titleId = React.useId();

  // Gestionar eventos de teclado para accesibilidad
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <Component
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-md transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 ${isInteractive ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={isInteractive ? 'button' : 'region'}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={ariaLabel}
      aria-labelledby={!ariaLabel && title ? titleId : undefined}
      aria-describedby={ariaDescribedby}
    >
      {title && (
        <h3 id={titleId} className="mb-2 text-lg font-semibold">
          {title}
        </h3>
      )}
      <div className="card-content">
        {children}
      </div>
    </Component>
  );
};

export default Card;
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  /**
   * Accessible label for the card when it's interactive
   */
  ariaLabel?: string;
  /**
   * ID of the element that labels the card
   */
  ariaLabelledby?: string;
  /**
   * ID of the element that describes the card
   */
  ariaDescribedby?: string;
  /**
   * Role of the card when it's interactive (button or link)
   */
  role?: 'button' | 'link' | string;
}

// Using CSS variables from theme.css for better contrast and accessibility
const VARIANT_STYLES = {
  default: 'bg-card rounded-lg shadow-md border border-card',
  elevated: 'bg-card-elevated rounded-xl shadow-lg border border-card',
  flat: 'bg-card-flat rounded-lg border border-card-light'
} as const;

const PADDING_STYLES = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
} as const;

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  hover = false,
  ariaLabel,
  ariaLabelledby,
  ariaDescribedby,
  role
}) => {
  const isInteractive = !!onClick;

  // Handle keyboard events for interactive cards
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  const baseClasses = `
    ${VARIANT_STYLES[variant]} ${PADDING_STYLES[padding]}
    ${hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''}
    ${isInteractive ? 'cursor-pointer' : ''}
    ${isInteractive ? 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus focus-visible:ring-4' : ''}
  `.trim();

  return (
    <div 
      className={`${baseClasses} ${className}`}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? role || 'button' : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
    >
      {children}
    </div>
  );
};

export default Card;
