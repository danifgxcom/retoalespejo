import React, { useEffect, useRef } from 'react';

interface ScreenReaderAnnouncementListenerProps {
  onAnnouncement: (text: string) => void;
}

/**
 * Componente para probar anuncios a lectores de pantalla
 * Se usa en pruebas para capturar lo que se anuncia a los lectores de pantalla
 */
export const ScreenReaderAnnouncementListener: React.FC<ScreenReaderAnnouncementListenerProps> = ({ 
  onAnnouncement 
}) => {
  const liveRegionRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    // Encuentra todos los elementos con aria-live en el DOM
    const liveRegions = document.querySelectorAll('[aria-live]');

    // Configure un observador para cada región
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
              const text = node.textContent?.trim();
              if (text) {
                onAnnouncement(text);
              }
            }
          }
        }
      });
    });

    // Observar cada región live
    liveRegions.forEach(region => {
      observer.observe(region, { childList: true, subtree: true });
      liveRegionRefs.current.push(region as HTMLElement);
    });

    return () => {
      observer.disconnect();
    };
  }, [onAnnouncement]);

  return null;
};

/**
 * Hook para pruebas de anuncios a lectores de pantalla
 * @returns Una función para verificar si un texto específico fue anunciado
 */
export const useScreenReaderAnnouncementTest = () => {
  const announcements = useRef<string[]>([]);

  const handleAnnouncement = (text: string) => {
    announcements.current.push(text);
  };

  const wasAnnounced = (text: string) => {
    return announcements.current.some(announcement => 
      announcement.includes(text));
  };

  const getAnnouncements = () => [...announcements.current];

  const clearAnnouncements = () => {
    announcements.current = [];
  };

  return {
    AnnouncementListener: () => (
      <ScreenReaderAnnouncementListener onAnnouncement={handleAnnouncement} />
    ),
    wasAnnounced,
    getAnnouncements,
    clearAnnouncements
  };
};
