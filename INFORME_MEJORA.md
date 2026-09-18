# Informe de mejora — Reto al Espejo

**Fecha:** 2026-09-14 · **Rama:** `dev` · **Alcance:** marketing, UI/diseño, jugabilidad, accesibilidad.
**Método:** revisión estática del código (`frontend/`, `backend/`, `shared/`), documentación y datos de retos, más una segunda pasada de verificación cruzada (Codex) sobre cada afirmación. No hay datos de uso real: lo que es hipótesis está marcado como tal.

Leyenda: **MKT** marketing · **UI** interfaz/diseño · **JUG** jugabilidad · **A11Y** accesibilidad.
Cada hallazgo lleva **[V]** si está verificado en el código por las dos pasadas, o **[H]** si el hecho está verificado pero su impacto es una hipótesis sin datos.

---

## Resumen ejecutivo

El motor geométrico y la validación están sanos (SAT, espejo, mensajes de error concretos, tests de retos ganables). El problema está alrededor del núcleo, y son tres cosas:

1. **El menú principal ofrece un modo que no lleva a ninguna partida.** «Multijugador» conecta el socket y nunca entra en una sala: el panel que crea o une salas está desactivado con `{false && …}`.
2. **El juego no recuerda nada.** Ni el reto alcanzado ni los completados. Cada recarga empieza de cero, y encima la navegación entre retos se contradice: no deja retroceder pero sí ciclar del último al primero.
3. **La accesibilidad está documentada, no implementada.** `SkipLink` existe y no se monta, no hay `<main>` ni `<h1>` en la vista real, y `docs/ACCESSIBILITY_AUDIT.md` da por «✅ Corregido» cosas que no están en el código.

Los seis primeros hallazgos concentran casi todo el retorno y ninguno es caro.

---

## Hallazgos, de mayor a menor impacto

### F01 · El modo multijugador se ofrece pero no lleva a ninguna partida — **MKT / JUG** [V]
`StartupMenu.tsx:43` presenta «Multijugador» habilitado. `MirrorChallengeGame.tsx:145` (`handleStartMultiplayer`) sólo hace `socketService.connect()` y registra escuchas: **nunca llama a `joinRoom` ni a `createRoom`** (`SocketService.ts:71,83`). El panel que contiene crear sala, unirse y lista de jugadores está entero tras `{false && (` en `RightSidebar.tsx:748-1090`, con un comentario que afirma que el menú de inicio ya lo cubre — y no lo cubre.
**Impacto:** el 50 % de la pantalla de entrada del juego es una promesa que no se cumple. Es el peor fallo del producto: no es que algo esté feo, es que no funciona lo que se anuncia.
**Arreglo (elegir uno, es decisión de producto):** (a) desactivar el botón con el «Próximamente» que ya está implementado (`isMultiplayerEnabled = false` en `MirrorChallengeGame.tsx:35`), o (b) reactivar el panel (`false` → `gameMode === 'multiplayer'`) y probarlo en pantalla. La opción (a) es una línea; la (b) exige verificación real de un flujo que nadie ha revisado.
**Esfuerzo:** XS (a) / M (b). **Requiere decisión tuya.**

### F02 · Herramientas de desarrollo expuestas al jugador — **MKT / UI / JUG** [V]
`GameControls.tsx:256,265,287` — «Cargar», «Editor» y «Debug» se renderizan siempre en la barra compacta, que es la que usa el juego real. Sólo «Snapshot» y «Grid» están tras `debugMode`.
**Impacto:** aspecto de herramienta interna, y el jugador puede romperse la partida cargando un JSON arbitrario.
**Arreglo:** envolver en `import.meta.env.DEV` **a secas**. Nada de `?dev=1`: un parámetro de URL sigue exponiendo las herramientas en producción a quien lo adivine, y además impide que Vite las elimine del bundle. Con `import.meta.env.DEV` el código desaparece de la compilación pública.
**Esfuerzo:** XS.

### F03 · El juego no recuerda nada — **JUG / MKT** [V]
`localStorage` sólo guarda el tema (`ThemeContext.tsx:26`). `completedChallenges` vive únicamente en estado de React (`useGameLogic.ts:53`): se pierde al recargar.
**Impacto:** retención estructuralmente nula. Sin progreso guardado no hay razón para volver, ni sensación de avance, ni nada que compartir.
**Arreglo:** un objeto en `localStorage` (`{ lastChallenge, completed: number[], bestTimes }`), leído al arrancar y escrito al completar, con `try/catch` en lectura y escritura (modo privado lanza excepción).
**Esfuerzo:** S.

### F04 · La navegación entre retos se contradice a sí misma — **JUG** [V]
`useGameLogic.ts:433` bloquea «Anterior» en cuanto `completedChallenges` tiene algún elemento —**global, no por reto**—, mientras `useGameLogic.ts:429` hace que «Siguiente» cicle del último reto al primero.
**Impacto:** no se puede volver a un reto ya resuelto, pero sí dar la vuelta completa para llegar a él. No hay modelo de campaña: ni lineal, ni libre.
**Arreglo:** decidir el modelo y aplicarlo entero. Lo natural con F03 encima: libre entre los retos ya desbloqueados, sin ciclado al final (el último muestra «has terminado»).
**Esfuerzo:** S. **Requiere decidir el modelo.**

### F05 · La cara de la pieza sólo se distingue por color — **A11Y / JUG** [V]
`PieceColors.ts:96-115` — `front`/`back` son oro vs rojo y nada más. **Corrección respecto a la primera versión de este informe:** sí existe textura no cromática (`GamePiece.tsx:28-60`, cuadrado en los centros y círculo en los triángulos), pero distingue *centro de triángulo*, no *cara de cara*, y además sólo se dibuja en el tema accesible. Las etiquetas numéricas de pieza tampoco ayudan: sólo salen al arrastrar o en modo debug (`GameAreaRenderer.ts:273`).
**Impacto:** voltear la pieza es la mecánica central, y su resultado es invisible sin percepción de color. Incumple WCAG 2.1 SC 1.4.1 en el elemento más importante del juego.
**Arreglo:** una marca no cromática por **cara** (p. ej. trama diagonal en `back`, lisa en `front`) en los dos temas, no sólo en el accesible. Opcional y barato: número de pieza siempre visible.
**Esfuerzo:** M (toca el renderizado del lienzo).

### F06 · Sin onboarding — **JUG / MKT** [H]
Tras `StartupMenu` se entra directamente al tablero de tres paneles. La ayuda existe y en la vista real (compacta) es un desplegable con los atajos (`GameControls.tsx:333`), no un modal — *corrección respecto a la primera versión*: el modal denso de `GameControls.tsx:630` pertenece a la rama no compacta, que el juego no usa.
**Impacto (hipótesis):** la mecánica del espejo, que es lo que hace especial al juego, no se explica en ninguna parte antes de jugar.
**Arreglo:** el Reto 1 es de una sola pieza; convertirlo en tutorial de tres pasos («arrastra», «gira con R», «toca el espejo»), descartable y no repetido (bandera en `localStorage`, se apoya en F03). Cada paso debe poder completarse con ratón, con táctil **y con teclado**: si sólo avanza con arrastre de ratón, el tutorial empeora la accesibilidad en vez de mejorarla.
**Esfuerzo:** M.

### F07 · No hay estructura semántica, pese a lo que dice la documentación — **A11Y** [V]
`MirrorChallengeGame.tsx:310+` son todo `div`: sin `<main>`, `<header>` ni `<nav>`. `SkipLink.tsx` existe y **no se importa en ningún sitio**. El único `<h1>` está en la rama no compacta (`GameControls.tsx:356`), así que la vista real no tiene encabezado de nivel 1.
Hay `role="region"` sueltos, así que la navegación no está *inservible*, pero sí incompleta.
**Impacto:** navegación por landmarks y por encabezados degradada. Y `ACCESSIBILITY_AUDIT.md` da los cuatro puntos por «✅ Corregido», lo cual es peor que no documentarlo.
**Arreglo:** montar `SkipLink`, envolver el juego en `<main id="main">`, `<h1>` visualmente oculto con el nombre del juego, y el nombre del reto a `<h2>`.
**Esfuerzo:** S.

### F08 · El modal de ayuda no tiene semántica de diálogo — **A11Y** [V]
`GameControls.tsx:614` usa `role="presentation"` tanto en la capa de fondo como en el contenido, sin foco inicial, sin Escape y sin trampa de foco. (Afecta a la rama no compacta y al editor de retos; la ayuda compacta es un desplegable y está bien resuelta.)
**Impacto:** con teclado se entra al modal y se sigue tabulando por detrás de él. `Modal.tsx` ya resuelve esto correctamente en el resto de la aplicación: es incoherencia, no falta de herramienta.
**Arreglo:** reutilizar `components/ui/Modal.tsx`, que ya gestiona Escape y `tabIndex`.
**Esfuerzo:** S.

### F09 · El aviso de validación no se anuncia y desaparece solo — **A11Y / UI** [V]
`ValidationFeedback.tsx` — sin rol ARIA y sin `aria-live`, así que un lector de pantalla puede no anunciar nunca el resultado; se autocierra a los 4 s (acierto) o 6 s (fallo) (`:35`); usa clases Tailwind fijas (`from-green-500`, `bg-white`) que ignoran el sistema de temas y producen una tarjeta blanca en tema accesible.
**Arreglo — corregido respecto a la primera versión:** `role="status"` (no `alertdialog`: eso exigiría modalidad, foco inicial, trampa y devolución de foco, y aquí el aviso no es bloqueante), `aria-live="polite"`, quitar el autocierre o hacerlo configurable, y pasar a variables de tema. El criterio WCAG 2.2.1 aplica porque hay un límite de tiempo sobre contenido no esencial; el mínimo defendible es que el mensaje no se oculte solo.
**Esfuerzo:** S.

### F10 · El fallo no señala qué pieza está mal — **JUG** [V]
**Corrección importante respecto a la primera versión de este informe, que afirmaba lo contrario y era falsa:** los mensajes **ya son concretos**. `ValidationService.explainMismatch` (`shared/src/ValidationService.ts:119`) devuelve «Falta una pieza A con la cara amarilla», «Hay una pieza B girada 45° de más», «a 37 px de su sitio», y `validateSolution` cubre conexión, contacto con el espejo, solape e intrusión. El hook lo propaga (`useGameLogic.ts:462`) y el componente lo pinta (`ValidationFeedback.tsx:123`).
**Lo que sí falta:** `ValidationResult` es `{ isCorrect, message }` (`ValidationService.ts:7`), sin identificador de pieza, así que la interfaz no puede resaltar en el lienzo la pieza implicada.
**Arreglo:** añadir `reason: 'missing'|'rotation'|'position'|…` y `pieceIndex` al resultado, con tests, y resaltar esa pieza. Cambio de contrato en `shared/`: lo consume también el backend, hay que mirar `gameHelpers.js`.
**Esfuerzo:** S-M.

### F11 · La curva de dificultad no es monótona — **JUG** [H]
`frontend/public/challenges.json`: 1 Principiante → 2-3 Fácil → 4-5 Intermedio → **6 Difícil, 8 piezas** → **7-9 Principiante, 1-2 piezas** → 10-13 Fácil → 14-16 Intermedio.
**Impacto (hipótesis):** el salto al reto 6 y la caída al 7 son un candidato claro a punto de abandono, pero **no está medido**. El campo `difficulty` ya existe en cada reto.
**Arreglo:** reordenar por dificultad y mostrar el nivel en la ficha. Cambio de datos con riesgo bajo: `tests/integration/Winnable.test.ts` cubre que siguen siendo resolubles. Si se implementa F20 primero, esto se valida con datos en una semana en vez de por intuición.
**Esfuerzo:** XS (datos) + S (mostrar nivel).

### F12 · La preferencia de tema oscuro del sistema se ignora — **A11Y / UI** [V]
`theme.css:411-430` define variables oscuras bajo `@media (prefers-color-scheme: dark)` en `:root`, pero `body.theme-colorful` (`theme.css:567`) redefine las mismas variables en claro con más especificidad. Con el tema por defecto, **quien tenga el sistema en oscuro ve el juego en claro**.
*Matiz respecto a la primera versión:* el usuario no está sin salida — el tema «accesible» sí es oscuro (`theme.css:657-709`). Pero está escondido detrás de un conmutador etiquetado como accesibilidad, con icono 🌙 y texto «Cambiar a tema accesible» (`ThemeSwitcher.tsx:22`), que mezcla dos conceptos distintos.
**Arreglo:** dos ejes ortogonales y explícitos — claridad (`data-theme="auto|light|dark"` en `<html>`) y paleta (normal / alta distinguibilidad) — con la matriz de combinaciones definida antes de tocar el CSS, persistencia en `localStorage` y reacción al cambio del sistema cuando está en `auto`.
**Esfuerzo:** M.

### F13 · Sin deshacer — **JUG / A11Y** [V]
No hay historial ni `undo`/`redo`: `resetLevel` (`useGameLogic.ts:420`) es todo o nada.
**Impacto:** un arrastre accidental cerca de la solución obliga a rehacer el reto entero. Penaliza sobre todo a quien juega con teclado o con motricidad reducida.
**Arreglo:** pila de 10 estados de `pieces` + `Ctrl+Z`/`Ctrl+Y` y botón. Definir antes qué transiciones entran (soltar un arrastre sí, cada píxel del arrastre no; giro, volteo y reset sí; cambio de reto vacía la pila).
**Esfuerzo:** S.

### F14 · Nomenclatura de retos incoherente — **MKT / UI** [V]
«Tarjeta 1: Corazón Simple», «Scary Pumpkin» (en inglés), «Suelo del salón», «Giro de 45°». Mezcla prefijos, idiomas y registros, y el nombre del reto ocupa la cabecera de la pantalla.
**Arreglo:** pasada editorial; nombres en español, sin el prefijo «Tarjeta N» (el número ya aparece al lado).
**Esfuerzo:** XS.

### F15 · Higiene de publicación — **MKT** [V]
- `vite.config.ts:22` genera sourcemaps en producción: `frontend/dist/assets/index-DEEu897T.js.map` ocupa **1,2 MB medidos** y publica el código fuente completo.
- `frontend/public/` sirve cuatro JSON de retos de respaldo (`challenges_backup.json`, `challenges.json.backup`, `challenges-old-absolute.json`, `challenges-relative.json`). No es una filtración —las soluciones ya se entregan al cliente por diseño— pero es basura servida en producción.
- `backend/src/index.js:15` usa `app.use(cors())` sin restricción de origen, mientras el canal de Socket.io sí está acotado por `FRONTEND_URL`. Incoherencia, no agujero grave.
- **Cuidado al limpiar:** `frontend/public/challenges.json` es un **enlace simbólico** a `../../shared/challenges.json`. Hay que preservarlo.
**Esfuerzo:** XS.

### F16 · Cero presencia: sin metadatos, sin icono — **MKT** [V]
`frontend/index.html:5` sólo tiene `<title>` y un favicon que apunta a `/vite.svg`, **archivo que no existe** → 404 en cada carga. Sin `description`, sin Open Graph ni Twitter Card, sin manifest.
**Impacto:** compartir el enlace produce una tarjeta vacía.
**Arreglo:** metadatos, OG con captura del tablero y favicon propio (la pieza es un logotipo natural). La PWA es aparte: un manifest sin estrategia de service worker y de actualización no instala nada útil, así que o se hace completa o no se hace.
**Esfuerzo:** S (metadatos) / M (PWA real).

### F17 · El CI de accesibilidad no se dispara y la documentación se atribuye trabajo no hecho — **A11Y** [V]
`frontend/.github/workflows/accessibility.yml:3` dispara en `main`/`develop`; las ramas del repo son `master`/`dev`, así que **no se ejecuta nunca**. Además llama a `npm run test:a11y`, que no existe en `frontend/package.json` — aunque los tests sí existen (`frontend/src/tests/a11y/axe-tests.test.tsx`): falta el script, no las pruebas. (`npx lhci` sí funcionaría, se descarga solo; ese matiz de la primera versión era incorrecto.)
**Impacto:** el «Lighthouse 98 / 0 violaciones axe» de `ACCESSIBILITY_AUDIT.md` no lo respalda nada reproducible, y toda regresión pasa en silencio.
**Arreglo:** corregir las ramas, añadir el script `test:a11y` que ejecute los tests que ya existen, y fijar en el workflow qué ruta se audita y con qué umbrales. O borrarlo: un CI que no corre es peor que ninguno. Y corregir el documento.
**Esfuerzo:** S.

### F18 · La pantalla de inicio vive fuera del sistema de diseño — **UI** [V]
`StartupMenu.tsx:16` — gradiente azul/púrpura/rosa y colores Tailwind fijos, sin ninguna variable de tema, y `h-screen` en vez de `100dvh` (se corta en móvil con la barra del navegador).
*Corrección respecto a la primera versión:* el `hover:scale-105` **sí** está cubierto, porque `accessibility.css:58` desactiva transiciones globalmente con `prefers-reduced-motion`.
**Impacto:** la primera pantalla del juego no se parece al resto ni respeta el tema elegido.
**Arreglo:** variables de tema y `min-h-[100dvh]`, como ya hace `MirrorChallengeGame`.
**Esfuerzo:** S.

### F19 · Móvil está apilado, no resuelto — **UI / JUG** [H]
Bajo `xl` el tablero y los laterales se apilan (`MirrorChallengeGame.tsx:324`) y los controles de giro quedan en el lateral, por debajo del tablero (`LeftSidebar.tsx:93`): hay que hacer scroll entre girar y mirar. No hay gesto táctil de rotación.
**Arreglo:** barra de acciones flotante sobre el lienzo, por debajo de `xl`, con las acciones de la pieza seleccionada.
**Esfuerzo:** M.

### F20 · Sin ninguna métrica — **MKT** [V]
No hay analítica ni telemetría en frontend, backend ni dependencias.
**Impacto:** F06, F11 y F19 son hipótesis y seguirán siéndolo.
**Arreglo:** cuatro eventos anónimos (`challenge_start`, `challenge_complete{id,ms,intentos}`, `challenge_abandon`, `tutorial_complete`). Antes de implementarlo hay que fijar proveedor, retención y base legal: «sin cookies» no resuelve el RGPD por sí solo.
**Esfuerzo:** S (técnico) + decisión de privacidad.

### F21 · El tema tiene dos fuentes de verdad — **UI / mantenimiento** [V]
`GamePiece.tsx:30` y `PieceColors.ts:64,80,98` leen `localStorage.getItem('theme')` directamente durante el dibujado, en vez de usar el contexto de tema que ya existe y al que `GameCanvas` ya está suscrito.
*Corrección respecto a la primera versión:* no todas las llamadas de dibujo consultan `localStorage` (los colores ya viajan con cada pieza), así que el argumento no es el coste por fotograma sino la **duplicación de la fuente de verdad**, que puede desincronizarse.
**Arreglo:** pasar el tema por parámetro desde `GameCanvas`.
**Esfuerzo:** S.

### F22 · Marca y licencia — **MKT** [V]
`README.md:3` y la interfaz acreditan «Reto al Espejo, de Educa». No hay `LICENSE`.
**Impacto:** publicar con el nombre comercial de un producto ajeno es un riesgo si el juego crece; sin licencia nadie puede contribuir ni reutilizar. La valoración jurídica excede lo que se deduce del código.
**Arreglo:** decisión del titular antes de cualquier difusión pública, y añadir `LICENSE`. Condiciona F14 y F16 (si cambia el nombre, cambian textos y metadatos).
**Esfuerzo:** XS de código, la decisión es tuya.

### F23 · Sólo español, sin estructura de traducción — **MKT** [V]
Textos incrustados en los componentes (p. ej. `StartupMenu.tsx:20`). Es techo de alcance, no un fallo de accesibilidad.
**Arreglo:** extraer a un diccionario único antes de que crezcan. i18n completo sólo si se decide difundir fuera.
**Esfuerzo:** M-L. **Diferir hasta validar tracción (F20).**

---

## Plan de acción

Cuatro fases, cada una desplegable por separado. En todas: `npm test` y `tests/integration/Winnable.test.ts` en verde, y `npm run lint` está en `--max-warnings 0`, así que no admite deuda nueva. Un commit por hallazgo.

### Fase 0 — Decisiones tuyas (bloquean el resto)
Ninguna es código, pero tres fases dependen de ellas:
1. **F01:** ¿se desactiva el multijugador o se termina? Es lo único que puede cambiar la forma del producto.
2. **F04:** ¿campaña lineal con desbloqueo, o acceso libre a todos los retos?
3. **F22:** ¿se mantiene el nombre «Reto al Espejo» y la atribución a Educa al publicar?

### Fase 1 — Que no parezca una herramienta interna (F02, F01a, F15, F07, F14, F17)
Sin riesgo funcional.
1. `import.meta.env.DEV` sobre Cargar/Editor/Debug/Snapshot — no `?dev=1` (F02).
2. Aplicar la decisión de F01: si es desactivar, `MULTIPLAYER_ENABLED = false` y listo.
3. `sourcemap: false`, borrar los cuatro JSON de respaldo **preservando el symlink** `public/challenges.json → shared/challenges.json`, acotar CORS al mismo origen que el socket (F15).
4. `<main id="main">`, `<h1>` oculto, montar `SkipLink` (F07).
5. Pasada editorial a los 16 nombres de reto (F14).
6. CI: corregir ramas a `master`/`dev`, añadir el script `test:a11y` apuntando a los tests axe que ya existen, fijar ruta auditada y umbrales — o borrar el workflow. Y corregir `ACCESSIBILITY_AUDIT.md` para que no se atribuya lo que no está hecho (F17).

**Agente:** Codex. **Aceptación:** `dist/` sin `.map`; `public/` con sólo el symlink; `npm run test:a11y` existe y pasa; el bundle de producción no contiene las cadenas «Editor» ni «Snapshot».

### Fase 2 — Retención (F03, F04, F11, F13)
El bloque con más retorno de producto y el de menor riesgo técnico.
1. Persistencia en `localStorage` con `try/catch` (F03).
2. Modelo de campaña según la decisión de Fase 0, coherente en «Anterior» y «Siguiente» (F04).
3. Reordenar retos por dificultad y mostrar el nivel (F11).
4. Deshacer/rehacer, con la lista de transiciones registradas fijada por escrito antes de codificar (F13).

**Agente:** Sonnet. **Aceptación:** recargar conserva reto y completados; no existe ninguna combinación de botones que lleve a un reto bloqueado; `Ctrl+Z` revierte exactamente una acción del usuario.

### Fase 3 — Accesibilidad real (F05, F09, F08, F12, F18, F21, F10)
El de más peso técnico: toca el renderizado del lienzo y `theme.css`. Un commit por punto, con captura antes/después.
1. Marca no cromática **por cara** en los dos temas (F05).
2. `ValidationFeedback` con `role="status"` + `aria-live="polite"`, sin autocierre, con variables de tema (F09).
3. Modal de ayuda reutilizando `ui/Modal.tsx` (F08).
4. Temas en dos ejes, **con la matriz de combinaciones escrita antes de tocar CSS**: claridad `auto|light|dark` × paleta normal/alta, persistencia y reacción al cambio del sistema (F12).
5. `StartupMenu` al sistema de temas + `100dvh` (F18).
6. Tema por contexto, fuente de verdad única (F21).
7. `ValidationResult` con `reason` + `pieceIndex` y resaltado de la pieza; revisar el consumo en `backend/src/gameHelpers.js` (F10).

**Agente:** Sonnet, con revisión de Codex en 1 y 4. **Aceptación:** el juego se completa con la pantalla en escala de grises (filtro de saturación 0); contraste AA verificado en las cuatro combinaciones de tema, midiendo texto de interfaz y bordes de pieza sobre el fondo del lienzo.

### Fase 4 — Alcance (F16, F06, F19, F20, F22, F23)
Sólo cuando 1-3 estén desplegadas: no merece la pena traer tráfico a un juego que aún no retiene.
1. Metadatos, OG y favicon propio; PWA sólo si se asume service worker y estrategia de actualización (F16).
2. Tutorial de tres pasos, con avance equivalente en ratón, táctil y teclado (F06).
3. Barra de acciones flotante en móvil (F19).
4. Analítica, previa decisión de proveedor y base legal (F20).
5. `LICENSE` y postura de marca (F22); extracción de textos a diccionario (F23).

**Agente:** Codex (1, 3), Sonnet (2), propietario (4, 5).

---

## Lo que no hay que tocar

- El motor geométrico (`shared/src/GameGeometry.ts`, `PieceShape.ts`) y sus tests dorados.
- La normalización sólo vertical de `ValidationService`: está razonada en `CLAUDE.md` y es correcta (la X mide distancia al espejo).
- Los mensajes de error de `explainMismatch`: ya son buenos, sólo les falta el identificador de pieza.
- La autoridad del servidor en multijugador: el modelo es el correcto, lo que falta es el flujo de sala.

## Trazabilidad de la revisión

Este informe pasó por una verificación cruzada que corrigió la primera versión en siete puntos, todos incorporados arriba:
- **F10 era falsa**: se afirmaba que la validación no explicaba el fallo; sí lo explica (`explainMismatch`). Reformulada a «falta el identificador de pieza» y bajada de prioridad.
- **F01 (multijugador sin sala) y F04 (navegación contradictoria) no estaban** y son de los más graves.
- **F05**: sí existe textura no cromática, pero distingue forma, no cara.
- **F09**: `alertdialog` era el rol equivocado para un aviso no bloqueante.
- **F12**: el usuario sí tiene una salida oscura (el tema accesible); el fallo es que se ignora la preferencia del sistema.
- **F15**: `public/challenges.json` es un symlink que hay que preservar; y las soluciones ya son públicas por diseño, no es una filtración.
- **F18**: `prefers-reduced-motion` sí está cubierto globalmente.

## Riesgos y supuestos

- **Sin datos de uso.** F06, F11 y F19 están marcados **[H]**: el hecho está verificado, el impacto es hipótesis. F20 existe para convertirlos en medidas.
- **Fase 3 toca el lienzo**, la parte más frágil de la interfaz: un commit por hallazgo y comparación visual.
- **Tres decisiones de Fase 0 bloquean trabajo real.** Sin ellas, los agentes se inventarán la respuesta.
