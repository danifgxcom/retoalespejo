import React from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '4xl';
  headerColor?: string;
}

const MAX_WIDTH_STYLES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '4xl': 'max-w-4xl'
} as const;

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  headerColor = 'from-blue-600 to-purple-600'
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className={`
          bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl 
          max-h-[85vh] overflow-y-auto border border-gray-200
          ${MAX_WIDTH_STYLES[maxWidth]}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={`bg-gradient-to-r ${headerColor} text-white p-6 rounded-t-2xl`}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-2xl mb-2">{title}</h3>
                {subtitle && (
                  <p className="text-blue-100 text-sm">{subtitle}</p>
                )}
              </div>
              <Button
                onClick={onClose}
                variant="gray"
                size="sm"
                className="text-white hover:text-red-200 hover:bg-white hover:bg-opacity-20"
              >
                <X size={24} />
              </Button>
            </div>
          </div>
        )}
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;