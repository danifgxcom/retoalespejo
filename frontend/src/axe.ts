/**
 * Este archivo configura axe-core para ejecutar verificaciones de accesibilidad en desarrollo
 * Solo se carga en entorno de desarrollo, no en producción
 */

import { createElement, Fragment } from 'react';
import ReactDOM from 'react-dom';
import axe from '@axe-core/react';

// Solo ejecuta axe en desarrollo
if (process.env.NODE_ENV !== 'production') {
  // Inicializa axe con la configuración adecuada
  axe(React, ReactDOM, 1000, {
    rules: [
      // Configura reglas específicas según sea necesario
      { id: 'region', enabled: true },
      { id: 'landmark-one-main', enabled: true },
      { id: 'page-has-heading-one', enabled: true },
    ],
  });

  console.log('axe-core habilitado para pruebas de accesibilidad en desarrollo');
}
