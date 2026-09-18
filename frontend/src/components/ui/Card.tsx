import React, { KeyboardEvent } from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  variant?: 'default' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  role?: 'button' | 'link' | string;
}

const VARIANT_STYLES = {
  default: 'bg-card rounded-lg shadow-md border border-card',
  elevated: 'bg-card-elevated rounded-xl shadow-lg border border-card',
  flat: 'bg-card-flat rounded-lg border border-card-light',
} as const;

const PADDING_STYLES = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

const Card: React.FC<CardProps> = ({
  children,
  title,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  hover = false,
  ariaLabel,
  ariaLabelledby,
  ariaDescribedby,
  role,
}) => {
  const isInteractive = Boolean(onClick);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={`${VARIANT_STYLES[variant]} ${PADDING_STYLES[padding]} ${hover ? 'cursor-pointer transition-shadow hover:shadow-lg' : ''} ${isInteractive ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus focus-visible:ring-4' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? role || 'button' : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
    >
      {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
