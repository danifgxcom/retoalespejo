# Plan de Pruebas de Accesibilidad

## Objetivo
Este documento define el plan de pruebas para verificar la conformidad de la aplicación con los estándares de accesibilidad WCAG 2.1 AA y preparar la aplicación para una auditoría formal.

## Herramientas de Prueba

### Pruebas Automatizadas
1. **axe-core/jest**: Pruebas unitarias para detectar problemas de accesibilidad en componentes
2. **Lighthouse**: Auditoría automatizada de páginas completas
3. **APCA (Advanced Perceptual Contrast Algorithm)**: Verificación de contraste de color según métricas modernas

### Pruebas Manuales
1. **Navegación por Teclado**: Verificar que todas las funciones sean accesibles solo con teclado
2. **Lectores de Pantalla**: 
   - NVDA en Windows
   - VoiceOver en macOS
   - TalkBack en Android
3. **Zoom al 200%**: Verificar usabilidad con zoom
4. **Modo de Alto Contraste**: Probar con modos de alto contraste del sistema

## Matriz de Pruebas

| Categoría | Criterio | Método de Prueba | Herramienta |
|-----------|----------|-----------------|-------------|
| **Perceptible** | Alternativas de texto | Automatizado + Manual | axe-core, revisión manual |
| | Alternativas para multimedia | Manual | Revisión manual |
| | Adaptable | Automatizado + Manual | axe-core, revisión manual |
| | Distinguible | Automatizado + Manual | APCA, zoom, alto contraste |
| **Operable** | Accesible por teclado | Automatizado + Manual | Test de navegación por teclado |
| | Tiempo suficiente | Manual | Revisión manual |
| | Convulsiones y reacciones físicas | Manual | Revisión manual |
| | Navegable | Automatizado + Manual | axe-core, revisión manual |
| | Modalidades de entrada | Manual | Revisión manual |
| **Comprensible** | Legible | Automatizado + Manual | axe-core, revisión manual |
| | Predecible | Manual | Revisión manual |
| | Asistencia a la entrada | Automatizado + Manual | axe-core, revisión manual |
| **Robusto** | Compatible | Automatizado | axe-core, validadores HTML |

## Procedimientos de Prueba

### 1. Pruebas Unitarias de Componentes

```bash
npm run test:a11y
```

Verifica que cada componente individual cumpla con las pautas básicas de accesibilidad, incluyendo:
- Roles ARIA apropiados
- Atributos ARIA requeridos
- Contraste de color suficiente
- Textos alternativos adecuados

### 2. Pruebas de Integración

```bash
npm run test:a11y:integration
```

Verifica la accesibilidad de los componentes interactuando entre sí, incluyendo:
- Manejo de foco
- Trampas de foco en modales
- Navegación por teclado
- Anuncios a lectores de pantalla

### 3. Pruebas de Página Completa

```bash
npm run lighthouse:a11y
```

Utiliza Lighthouse para realizar auditorías completas de accesibilidad en las páginas principales:
- Página de inicio
- Página de juego
- Modal de instrucciones
- Modales de resultados

### 4. Pruebas Manuales

Para cada componente principal:

1. **Navegación por Teclado**:
   - Verificar que todos los elementos interactivos sean enfocables
   - Verificar que el orden de tabulación sea lógico
   - Verificar que los elementos enfocados tengan indicadores visibles
   - Verificar que todas las funciones sean accesibles solo con teclado

2. **Pruebas con Lectores de Pantalla**:
   - Verificar que todos los contenidos sean anunciados correctamente
   - Verificar que los cambios dinámicos sean anunciados
   - Verificar que las regiones ARIA funcionen correctamente

3. **Pruebas de Zoom**:
   - Verificar que la aplicación sea usable al 200% de zoom
   - Verificar que no haya pérdida de contenido o funcionalidad

## Plan de Remediación

Para cada problema identificado:

1. Documentar el problema en el sistema de seguimiento
2. Asignar una prioridad basada en:
   - Gravedad del problema
   - Impacto en usuarios con discapacidades
   - Esfuerzo requerido para solucionar
3. Implementar correcciones
4. Verificar correcciones con las mismas herramientas y procedimientos

## Preparación para Auditoría Externa

1. Ejecutar todas las pruebas automatizadas y resolver todos los problemas
2. Completar todas las pruebas manuales y resolver todos los problemas
3. Documentar cualquier excepción o caso borde
4. Preparar documentación de conformidad
5. Realizar un recorrido de la aplicación utilizando solo el teclado
6. Realizar un recorrido de la aplicación utilizando lectores de pantalla

## Recursos Adicionales

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Deque University Resources](https://dequeuniversity.com/)
- [APCA Contrast Calculator](https://www.myndex.com/APCA/)

## Historial de Pruebas

| Fecha | Componentes Probados | Problemas Encontrados | Problemas Resueltos | Notas |
|-------|----------------------|----------------------|---------------------|-------|
| 2025-06-23 | Todos los componentes UI | 12 | 8 | 4 problemas pendientes de resolver |
| 2025-06-24 | Componentes de juego | 8 | 8 | Todos los problemas resueltos |
