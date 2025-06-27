import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import { createPortal } from 'react-dom';

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
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`).current;
  const descriptionId = useRef(`modal-description-${Math.random().toString(36).substr(2, 9)}`).current;

  // Store the element that had focus before the modal was opened
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the modal container when it opens
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 0);
    } else if (previousFocusRef.current) {
      // Return focus to the element that had focus before the modal was opened
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard events (Escape to close)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Focus trap inside the modal
  useEffect(() => {
    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modalRef.current || !isOpen) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // If shift+tab and on first element, move to last element
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } 
      // If tab and on last element, move to first element
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleFocusTrap);
    return () => {
      window.removeEventListener('keydown', handleFocusTrap);
    };
  }, [isOpen]);
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from './Button';
import { useAnnounce } from '../accessibility/LiveAnnouncer';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  aria?: {
    labelledby?: string;
    describedby?: string;
  };
  closeLabel?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  aria,
  closeLabel = 'Cerrar',
}) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const announce = useAnnounce();

  // Genera un ID único para el título y descripción si no se proporciona
  const titleId = aria?.labelledby || 'modal-title';

  useEffect(() => {
    const portalRoot = document.getElementById('modal-root') || document.body;
    setPortalElement(portalRoot);

    // Guarda el elemento que tenía el foco antes de abrir el modal
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Anuncia la apertura del modal a lectores de pantalla
      announce(`Diálogo abierto: ${title}`, 'assertive');
    }

    // Restaura el foco al cerrar el modal
    return () => {
      if (isOpen && previousFocusRef.current) {
        previousFocusRef.current.focus();
        announce(`Diálogo cerrado: ${title}`, 'polite');
      }
    };
  }, [isOpen, title, announce]);

  // Configura trampa de foco
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    // Encuentra todos los elementos focusables dentro del modal
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    const focusableElements = Array.from(
      modalRef.current.querySelectorAll(focusableSelectors.join(','))
    ) as HTMLElement[];

    focusableElementsRef.current = focusableElements;

    // Enfoca el primer elemento focusable
    if (focusableElements.length > 0) {
      setTimeout(() => focusableElements[0].focus(), 50);
    } else {
      // Si no hay elementos focusables, enfoca el modal mismo
      modalRef.current.focus();
    }

    // Manejador de tecla Escape
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Tab') {
        // Maneja la trampa de foco con Tab
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Previene que el scroll en el fondo
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen || !portalElement) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
      aria-hidden="true" // El fondo es decorativo
    >
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={aria?.describedby}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800"
        tabIndex={-1} // Para que el modal pueda recibir foco
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id={titleId} className="text-xl font-semibold">
            {title}
          </h2>
          <Button 
            icon={X} 
            variant="gray" 
            size="sm"
            ariaLabel={closeLabel}
            onClick={onClose}
          />
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>,
    portalElement
  );
};

export default Modal;
  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={subtitle ? descriptionId : undefined}
        tabIndex={-1}
        className={`
          bg-modal rounded-2xl shadow-2xl 
          max-h-[85vh] overflow-y-auto border border-modal
          ${MAX_WIDTH_STYLES[maxWidth]}
          outline-none focus:outline-none focus:ring-2 focus:ring-focus focus-visible:ring-4
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="bg-modal-header p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 id={titleId} className="font-bold text-2xl mb-2">{title}</h3>
                {subtitle && (
                  <p id={descriptionId} className="text-modal-subtitle text-sm">{subtitle}</p>
                )}
              </div>
              <Button
                onClick={onClose}
                variant="gray"
                size="sm"
                className="text-white hover:text-red-200 hover:bg-white hover:bg-opacity-20"
                ariaLabel="Close modal"
                title="Close"
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

  // Use createPortal to render the modal at the end of the document body
  // This improves accessibility by ensuring the modal is not nested in other elements
  return createPortal(modalContent, document.body);
};

export default Modal;
