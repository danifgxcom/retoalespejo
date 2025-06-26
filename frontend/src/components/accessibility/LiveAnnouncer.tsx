import React, { useEffect, useState } from 'react';

type PriorityType = 'polite' | 'assertive';

interface AnnouncerProps {
  children?: React.ReactNode;
}

const LiveAnnouncer = ({ children }: AnnouncerProps) => {
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {children}
    </div>
  );
};

const AlertAnnouncer = ({ children }: AnnouncerProps) => {
  return (
    <div className="sr-only" aria-live="assertive" aria-atomic="true">
      {children}
    </div>
  );
};

// Estado global para el anunciador
let announceCallback: ((message: string, priority?: PriorityType) => void) | null = null;

/**
 * Hook para anunciar mensajes a lectores de pantalla
 * @returns Función para anunciar mensajes
 */
export const useAnnounce = () => {
  return (message: string, priority: PriorityType = 'polite') => {
    if (announceCallback) {
      announceCallback(message, priority);
    }
  };
};

/**
 * Componente para anuncios dinámicos a lectores de pantalla
 * Debe colocarse una sola vez en la raíz de la aplicación
 */
export const LiveRegion = () => {
  const [politeAnnouncement, setPoliteAnnouncement] = useState('');
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState('');

  useEffect(() => {
    announceCallback = (message, priority = 'polite') => {
      if (priority === 'assertive') {
        setAssertiveAnnouncement(message);
        // Limpiar después de un tiempo para permitir anuncios repetidos del mismo mensaje
        setTimeout(() => setAssertiveAnnouncement(''), 1000);
      } else {
        setPoliteAnnouncement(message);
        setTimeout(() => setPoliteAnnouncement(''), 1000);
      }
    };

    return () => {
      announceCallback = null;
    };
  }, []);

  return (
    <>
      <LiveAnnouncer>{politeAnnouncement}</LiveAnnouncer>
      <AlertAnnouncer>{assertiveAnnouncement}</AlertAnnouncer>
    </>
  );
};

export default LiveRegion;
