import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: React.ElementType;
}

/**
 * VisuallyHidden - Componente que oculta visualmente el contenido pero lo mantiene
 * accesible para lectores de pantalla.
 * 
 * Usa la técnica de CSS recomendada por WebAIM para textos que solo deben ser
 * leídos por tecnologías asistivas.
 */
const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children, as: Component = 'span' }) => {
  const hiddenStyles = {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: 0,
    position: 'absolute' as const,
    width: '1px',
    whiteSpace: 'nowrap' as const,
    wordWrap: 'normal' as const
  };

  return <Component style={hiddenStyles}>{children}</Component>;
};

export default VisuallyHidden;
