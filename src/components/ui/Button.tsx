import React from 'react';
import { LucideIcon } from 'lucide-react';

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
}

const VARIANT_STYLES = {
  primary: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
  secondary: 'from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700',
  success: 'from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
  danger: 'from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700',
  warning: 'from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700',
  info: 'from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700',
  gray: 'from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700'
} as const;

const SIZE_STYLES = {
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4'
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
  className = ''
}) => {
  const baseClasses = `
    bg-gradient-to-r text-white rounded-xl transition-all transform 
    hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none
    ${SIZE_STYLES[size]} ${VARIANT_STYLES[variant]}
  `.trim();

  return (
    <button
      onClick={onClick}
      onMouseDown={onMouseDown}
      title={title}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
    >
      {Icon ? (
        <Icon size={iconSize} />
      ) : (
        children
      )}
    </button>
  );
};

export default Button;