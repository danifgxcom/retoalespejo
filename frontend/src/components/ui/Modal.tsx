import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from './AtelierIcons';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '4xl';
  aria?: {
    labelledby?: string;
    describedby?: string;
  };
  closeLabel?: string;
}

const MAX_WIDTH_STYLES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '4xl': 'max-w-4xl',
} as const;

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  maxWidth = 'lg',
  aria,
  closeLabel = 'Cerrar',
}) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`).current;
  const descriptionId = useRef(`modal-description-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    setPortalElement(document.getElementById('modal-root') || document.body);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    const timeoutId = window.setTimeout(() => modalRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusableElements = Array.from(modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && (document.activeElement === firstElement || document.activeElement === modalRef.current)) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const app = document.getElementById('root');
    const wasInert = app?.hasAttribute('inert');
    app?.setAttribute('inert', '');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
      if (!wasInert) app?.removeAttribute('inert');
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen || !portalElement) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-modal-overlay p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={aria?.labelledby || (title ? titleId : undefined)}
        aria-describedby={aria?.describedby || (subtitle ? descriptionId : undefined)}
        tabIndex={-1}
        className={`relative w-full ${MAX_WIDTH_STYLES[maxWidth]} max-h-[85vh] overflow-y-auto rounded-2xl border border-modal bg-modal shadow-2xl outline-none`}
      >
        {title && (
          <div className="rounded-t-2xl bg-modal-header p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 id={titleId} className="mb-2 text-2xl font-bold">{title}</h2>
                {subtitle && <p id={descriptionId} className="text-sm text-modal-subtitle">{subtitle}</p>}
              </div>
              <Button icon={X} variant="gray" size="sm" ariaLabel={closeLabel} onClick={onClose} />
            </div>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    portalElement,
  );
};

export default Modal;
