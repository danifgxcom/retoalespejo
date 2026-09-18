# Plan de ejecución — Desafía al reflejo (antes «Reto al Espejo»)

Documento de trabajo para los agentes que implementan. El diagnóstico completo está en `INFORME_MEJORA.md`; aquí sólo está **qué hacer, en qué orden y cuándo se da por hecho**.

## Decisiones tomadas por el propietario (2026-09-14)

| # | Decisión | Consecuencia |
|---|---|---|
| D1 | **Multijugador: reactivar y terminarlo.** | Fase 4 completa: `false` → `gameMode === 'multiplayer'` en `RightSidebar.tsx:748` y verificación real del flujo crear/unirse/jugar. |
| D2 | **Campaña: libre entre los desbloqueados.** | Se puede volver a cualquier reto ya alcanzado. El último no cicla: muestra fin de campaña. |
| D3 | **Publicar con nombre propio: «Desafía al reflejo».** | Se renombra el juego. La atribución pasa a «inspirado en un clásico de puzles de simetría». Sin mención a Educa en interfaz ni metadatos. |

**El nombre vive en una sola constante** (`frontend/src/branding.ts`, exportando `GAME_NAME` y `GAME_TAGLINE`). Ningún componente escribe el nombre literal. Cambiarlo debe ser editar una línea.

## Reglas para todos los agentes

1. **NO hacer commits, ni `git add`, ni `git push`, ni `git checkout`.** El árbol de trabajo ya tenía 118 ficheros modificados antes de empezar este plan: cualquier commit mezclaría trabajo previo ajeno a estas tareas. Se edita el árbol y nada más; el propietario decide después qué se commitea.
2. Al terminar cada tarea: `npm run lint` (está en `--max-warnings 0`), `npm run typecheck` y `npm test` en verde. Si algo se rompe, se arregla antes de seguir.
3. **No tocar** `shared/src/GameGeometry.ts` ni `PieceShape.ts` ni sus tests dorados. No tocar la normalización vertical de `ValidationService`.
4. `frontend/public/challenges.json` **es un symlink** a `../../shared/challenges.json`. Editar siempre el destino, nunca sustituir el enlace por un fichero.
5. Si una instrucción resulta ambigua al abrir el código, **parar y preguntar al coordinador**, no improvisar.

---

## Fase 1 — Que no parezca una herramienta interna · Agente: **Codex**

1. **F02** Gatear «Cargar», «Editor», «Debug» y «Snapshot» (`GameControls.tsx:256,265,287`) tras `import.meta.env.DEV`. No usar `?dev=1`: debe desaparecer del bundle de producción.
2. **F15** `vite.config.ts:22` → `sourcemap: false`. Borrar `challenges_backup.json`, `challenges.json.backup`, `challenges-old-absolute.json`, `challenges-relative.json` de `frontend/public/` **preservando el symlink**. `backend/src/index.js:15`: acotar CORS al mismo origen que usa Socket.io (`FRONTEND_URL`).
3. **F07** Montar `SkipLink`, envolver el juego en `<main id="main">`, `<h1>` visualmente oculto con `GAME_NAME`, nombre del reto a `<h2>`.
4. **D3** Crear `frontend/src/branding.ts` con `GAME_NAME = 'Desafía al reflejo'` y tagline. Sustituir todas las apariciones literales en `StartupMenu`, `GameControls`, `index.html`, `README.md`. Quitar la atribución a Educa de la interfaz; en README, «inspirado en un clásico de puzles de simetría». Añadir `LICENSE`.
5. **F14** Pasada editorial a los 16 nombres de reto en `shared/challenges.json`: español, sin prefijo «Tarjeta N», sin «Scary Pumpkin».
6. **F17** Workflow `accessibility.yml`: ramas a `master`/`dev`; añadir script `test:a11y` a `frontend/package.json` que ejecute los tests axe ya existentes (`src/tests/a11y/`); fijar ruta auditada. Corregir `docs/ACCESSIBILITY_AUDIT.md` para que no dé por hecho lo que no está implementado.

**Aceptación:** `dist/` sin `.map`; `public/` con sólo el symlink; `npm run test:a11y` existe y pasa; el bundle de producción no contiene «Snapshot» ni «Editor de retos»; `grep -ri educa frontend/src frontend/index.html` sin resultados.

---

## Fase 2 — Retención · Agente: **Sonnet**

1. **F03** Persistencia en `localStorage` (`{ lastChallenge, completed: number[], bestTimes }`), leída al arrancar y escrita al completar, con `try/catch` en ambas (modo privado lanza excepción).
2. **F04 + D2** Campaña libre entre desbloqueados: «Anterior» permitido hasta el primero; «Siguiente» hasta el máximo desbloqueado, **sin ciclar** — en el último, estado de fin de campaña. Corregir `useGameLogic.ts:429-433`.
3. **F11** Reordenar los 16 retos por `difficulty` en `shared/challenges.json` y mostrar el nivel en la ficha del reto.
4. **F13** Deshacer/rehacer: pila de 10 estados de `pieces`, `Ctrl+Z`/`Ctrl+Y` y botón. Registra: soltar un arrastre, giro, volteo, reset. No registra: píxeles intermedios del arrastre. Cambiar de reto vacía la pila.

**Aceptación:** recargar conserva reto y completados; ninguna combinación de botones lleva a un reto bloqueado; `Ctrl+Z` revierte exactamente una acción; `Winnable.test.ts` sigue verde tras reordenar.

---

## Fase 3 — Accesibilidad real · Agente: **Sonnet**, revisión de **Codex** en 1 y 4

Toca el renderizado del lienzo: un commit por punto, con captura antes/después.

1. **F05** Marca no cromática **por cara** (`front` lisa / `back` trama diagonal) en **los dos temas**, no sólo en el accesible. Hoy `GamePiece.tsx:28-60` distingue centro de triángulo, que no es lo que hace falta.
2. **F09** `ValidationFeedback`: `role="status"` + `aria-live="polite"`, sin autocierre, colores desde variables de tema. **No** `alertdialog`: no es un aviso bloqueante.
3. **F08** Modal de ayuda de `GameControls.tsx:614` reutilizando `components/ui/Modal.tsx`, que ya gestiona Escape y foco.
4. **F12** Temas en dos ejes ortogonales: claridad `data-theme="auto|light|dark"` en `<html>` × paleta normal/alta distinguibilidad. **Escribir la matriz de combinaciones antes de tocar `theme.css`.** Persistencia y reacción a cambios del sistema cuando está en `auto`. Hoy `body.theme-colorful` (`theme.css:567`) anula el `prefers-color-scheme` de `:root` (`theme.css:411`).
5. **F18** `StartupMenu` a variables de tema y `min-h-[100dvh]`.
6. **F21** Fuente de verdad única del tema: pasar por contexto desde `GameCanvas`, no `localStorage` en el dibujado (`GamePiece.tsx:30`, `PieceColors.ts:64,80,98`).
7. **F10** `ValidationResult` con `reason` y `pieceIndex`; resaltar la pieza implicada en el lienzo. Revisar el consumo en `backend/src/gameHelpers.js`. Los mensajes de `explainMismatch` ya son buenos: no reescribirlos.

**Aceptación:** el juego se completa con la pantalla en escala de grises (filtro de saturación 0); contraste AA en las cuatro combinaciones de tema, midiendo texto de interfaz y bordes de pieza sobre el fondo del lienzo.

---

## Fase 4 — Multijugador jugable (D1) · Agente: **Codex**

Hoy `handleStartMultiplayer` (`MirrorChallengeGame.tsx:145`) sólo hace `socketService.connect()`: nunca llama a `joinRoom` ni `createRoom` (`SocketService.ts:71,83`), y el panel de sala está entero tras `{false && (` en `RightSidebar.tsx:748-1090`.

1. Reactivar el panel: `false` → `gameMode === 'multiplayer'`.
2. Conectar el flujo de entrada: elegir nombre → crear o unirse a sala → sala de espera → cuenta atrás → partida. El servidor ya es autoritativo; **no** mover lógica de puntuación al cliente.
3. Verificar en ejecución con dos navegadores: crear sala, unirse, jugar un reto, resolverlo, ver ganador y pasar al siguiente.
4. Revisar que los overlays de pausa/espera/solución coinciden con el estado real del servidor.

**Aceptación:** dos clientes completan un reto en la misma sala de principio a fin. Si algo del backend está incompleto, **documentarlo y parar**, no inventar protocolo nuevo.

---

## Fase 5 — Alcance · Agentes: **Codex** (1, 3), **Sonnet** (2)

1. **F16** `description`, Open Graph y Twitter Card con `GAME_NAME`; favicon propio (la pieza sirve de logotipo) — hoy `index.html:5` apunta a `/vite.svg`, que no existe. PWA sólo si se asume service worker y estrategia de actualización; si no, no se hace.
2. **F06** Tutorial de tres pasos sobre el Reto 1 (una sola pieza), descartable y no repetido. Cada paso debe poder completarse con **ratón, táctil y teclado**; si sólo avanza con arrastre de ratón, empeora la accesibilidad.
3. **F19** Barra de acciones flotante sobre el lienzo por debajo de `xl`, con las acciones de la pieza seleccionada.

**Diferido, no se implementa ahora:** F20 analítica (exige proveedor y base legal) y F23 i18n (exige decisión de mercado).

---

## Estado final (2026-09-15)

Las cinco fases están implementadas y verificadas por el coordinador, no sólo por el agente que las hizo.

| Fase | Estado | Verificación |
|---|---|---|
| 1 · Higiene, marca, semántica | Hecha | build sin `.map`, `public/` sólo con el symlink, bundle sin herramientas de dev, sin rastro de Educa |
| 2 · Retención | Hecha | progreso persistido por id de reto, campaña sin ciclado, orden monótono, undo con módulo puro |
| 3 · Accesibilidad | Hecha | cara distinguible sin color, dos ejes de tema, contorno WCAG 1.4.11, aviso anunciable |
| 4 · Multijugador | Hecha | integración real de dos clientes Socket.io ejecutada (6,1 s), servidor autoritativo |
| 5 · Alcance | Hecha | metadatos + OG PNG, favicon propio, barra móvil, tutorial de 3 pasos |

**Pruebas:** 525 frontend + 8 backend. `lint` y `typecheck` limpios. Build limpio verificado en navegador.

### Lagunas declaradas (ninguna bloquea, todas conscientes)

- Sin test de la reactividad en vivo de `matchMedia` (sólo la función pura `resolveClarity`).
- Sin migración de la clave antigua de tema en `localStorage`: quien tuviera un tema guardado vuelve una vez a `auto`/`normal`.
- La rama NO compacta de `GameControls` es código muerto (`compact` es siempre `true`) y conserva su popup antiguo.
- `MirrorChallengeGame` no se puede montar entero en Jest: usa `import.meta.env.DEV` en ámbito de módulo y ts-jest con `module: CommonJS` no lo parsea. Es previo a este plan y limita los tests de integración de UI.
- PWA no implementada a propósito: sin service worker ni estrategia de actualización, un manifest suelto no aporta.
- F20 (analítica) y F23 (i18n) quedan diferidos por decisión de producto.

### Lecciones del proceso, para quien siga

1. **Verificar contra un build fresco.** Un falso positivo de este plan (un "tutorial que no se montaba") fue en realidad una preview sirviendo un artefacto anterior al cambio. Antes de dar por roto algo visual: `rm -rf frontend/dist && npm run build`.
2. **Los tests no ven la interfaz.** El único fallo real que llegó al final —la cabecera comprimida a "Cora..."— no lo detectó ninguno de los 525 tests y se veía al instante en el navegador.
3. **Cuidado con los tests que se auto-eximen.** Había dos: uno de rendimiento que fallaba por carga de la máquina y otro de Socket.io que pasaba en verde sin ejecutarse si no podía abrir un puerto. Ambos corregidos para que fallen de forma ruidosa o se omitan a conciencia.
