import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const VARIANT_STYLES = {
  default: 'bg-white border border-gray-200 rounded-lg shadow-md',
  elevated: 'bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200',
  flat: 'bg-white border border-gray-100 rounded-lg'
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
  hover = false
}) => {
  const baseClasses = `
    ${VARIANT_STYLES[variant]} ${PADDING_STYLES[padding]}
    ${hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''}
    ${onClick ? 'cursor-pointer' : ''}
  `.trim();

  return (
    <div 
      className={`${baseClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;