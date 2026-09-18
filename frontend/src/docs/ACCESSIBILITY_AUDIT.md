# Estado de accesibilidad

Última revisión documental: 2026-09-14.

## Cobertura automatizada actual

`npm run test:a11y` ejecuta las pruebas de `src/tests/a11y/` con Jest. Incluye
comprobaciones axe de los componentes `Button`, `Card` y `Modal`, además de
pruebas unitarias de navegación por teclado y de pares de colores concretos.
El workflow `accessibility.yml` ejecuta esa misma orden y configura Lighthouse
para auditar exactamente `http://127.0.0.1:5173/`.

Estas pruebas son una red de seguridad de componentes: no constituyen una
auditoría completa de la partida, del lienzo ni de cada combinación de tema.

## Implementado y verificable en el código

- El documento HTML declara `lang="es"`.
- La vista de juego dispone de un enlace para saltar al contenido principal y
  un landmark `<main>`.
- El lienzo expone instrucciones mediante una etiqueta accesible y los
  controles principales tienen nombres accesibles.
- El proyecto contiene componentes de regiones en vivo, selector de tema y
  modal; su comportamiento debe verificarse en las pruebas correspondientes
  antes de afirmar cobertura total.

## Pendiente de verificar o implementar

- Una revisión manual con teclado, lector de pantalla y zoom al 200 %.
- Contraste AA de toda la interfaz y de los bordes de las piezas en las cuatro
  combinaciones de claridad y paleta.
- Distinción de las caras de las piezas sin depender del color.
- Una auditoría end-to-end del flujo completo de juego y del canvas.

No se publican aquí puntuaciones de Lighthouse, número de violaciones ni
afirmaciones de conformidad WCAG sin una ejecución reproducible que las
respalde.
