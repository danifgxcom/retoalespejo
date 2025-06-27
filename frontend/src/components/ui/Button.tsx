import React from 'react';
import { LucideIcon } from 'lucide-react';
import VisuallyHidden from '../accessibility/VisuallyHidden';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  onMouseDown?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconSize?: number;
  title?: string;
  disabled?: boolean;
  className?: string;
  /**
   * Accessible label for the button when the visual text is not descriptive enough
   */
  ariaLabel?: string;
  /**
   * ID of the element that describes the button
   */
  ariaDescribedby?: string;
  /**
   * Type of the button (button, submit, reset)
   */
  type?: 'button' | 'submit' | 'reset';
}

// Using CSS variables from theme.css for better contrast and accessibility
const VARIANT_STYLES = {
  primary: 'bg-primary-gradient hover:bg-primary-gradient-hover text-white',
  secondary: 'bg-secondary-gradient hover:bg-secondary-gradient-hover text-white',
  success: 'bg-success-gradient hover:bg-success-gradient-hover text-white',
  danger: 'bg-danger-gradient hover:bg-danger-gradient-hover text-white',
  warning: 'bg-warning-gradient hover:bg-warning-gradient-hover text-black',
  info: 'bg-info-gradient hover:bg-info-gradient-hover text-white',
  gray: 'bg-gray-gradient hover:bg-gray-gradient-hover text-white'
} as const;

const SIZE_STYLES = {
  sm: 'p-2 min-h-[36px] min-w-[36px]',
  md: 'p-3 min-h-[44px] min-w-[44px]',
  lg: 'p-4 min-h-[52px] min-w-[52px]'
} as const;

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  onMouseDown,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconSize = 24,
  title,
  disabled = false,
  className = '',
  ariaLabel,
  ariaDescribedby,
  type = 'button'
}) => {
  // Manejo de eventos de teclado para accesibilidad
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const baseClasses = `
    rounded-xl transition-all transform 
    hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-70
    focus-visible:ring-4 focus-visible:ring-offset-2
    ${SIZE_STYLES[size]} ${VARIANT_STYLES[variant]}
  `.trim();

  // Corregir problema de accesibilidad: los botones de solo icono deben tener una etiqueta accesible
  const hasOnlyIcon = Icon && !children;

  if (hasOnlyIcon && !ariaLabel) {
    console.warn(
      'Advertencia de accesibilidad: Button con icono pero sin texto visible debe tener una prop ariaLabel',
      { icon: Icon?.name }
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseDown={onMouseDown}
      onKeyDown={handleKeyDown}
      title={title}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      type={type}
    >
      {Icon ? (
        <>
          <Icon size={iconSize} aria-hidden="true" />
          {/* Si hay texto junto con el ícono, mostrarlo normalmente */}
          {children && <span className="ml-2">{children}</span>}
          {/* Si solo hay ícono pero hay ariaLabel, agregar texto oculto visualmente */}
          {hasOnlyIcon && ariaLabel && <VisuallyHidden>{ariaLabel}</VisuallyHidden>}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
