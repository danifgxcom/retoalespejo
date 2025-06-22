import React from 'react';

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'front' | 'back';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STATUS_STYLES = {
  success: 'bg-gradient-to-r from-emerald-400 to-green-500',
  error: 'bg-gradient-to-r from-red-400 to-pink-500',
  warning: 'bg-gradient-to-r from-amber-400 to-yellow-500',
  info: 'bg-gradient-to-r from-blue-400 to-cyan-500',
  front: 'bg-gradient-to-r from-emerald-400 to-green-500',
  back: 'bg-gradient-to-r from-purple-400 to-pink-500'
} as const;

const SIZE_STYLES = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base'
} as const;

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  size = 'md',
  className = ''
}) => {
  const baseClasses = `
    text-white font-semibold rounded-full shadow-md inline-flex items-center justify-center
    ${STATUS_STYLES[status]} ${SIZE_STYLES[size]}
  `.trim();

  return (
    <span className={`${baseClasses} ${className}`}>
      {children}
    </span>
  );
};

export default StatusBadge;