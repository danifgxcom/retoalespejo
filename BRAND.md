# Gabinete de simetría

La identidad parte de la mecánica: una pieza y su reflejo. Papel cálido, tinta
azul petróleo, líneas de registro y tipografía editorial convierten los retos
en estudios de una colección. Se conservan los colores funcionales de las piezas,
sus caras, sus números y sus controles. La claridad y el alto contraste son
preferencias independientes. En alto contraste las figuras se imprimen sobre
blanco, con contorno oscuro, para separar tanto el azul como el amarillo.

## Campaña

16 estudios en cuatro cuadernos de cuatro desafíos. Empieza por Corazón sencillo;
cada cuaderno añade una pieza: 1, 2, 3 y 4. Las figuras son composiciones de la
geometría real del juego, no ilustraciones imposibles de resolver. La colección
permite explorar todos los cuadernos; jugar requiere completar el estudio previo.
Se conservan los identificadores del corazón y la seta. Las figuras nuevas usan
identificadores nuevos para no heredar soluciones de la campaña anterior.

La fuente única es `shared/challenges.json`; el archivo público es un enlace a
ella. El fallback embebido y el servidor comparten esa misma fuente. Las pruebas
comprueban límites, encaje, soluciones, figuras distintas y progresión.

## Juego libre

La entrada «Juego libre» abre una biblioteca paginada con filtros de procedencia
y dificultad. Incluye los retos de campaña ya desbloqueados (y los completados
de una campaña anterior que aún existan) y seis aperitivos siempre disponibles.
Los aperitivos de `shared/free-challenges.json` combinan A y B: Búho de sobremesa,
Raya del arrecife, Nave exploradora, Bailarina de papel, Cangrejo de mosaico y
Árbol de rombos; dos figuras por dificultad, de 2 a 4 piezas.

No hay bloqueo entre tarjetas ni cuenta atrás. El cronómetro es informativo.
Los aciertos y mejores tiempos se guardan en `reto-al-espejo:progress:v1:free`,
separados de la campaña. Ganar en libre no desbloquea la campaña. El modo contra
el reloj queda fuera de esta primera ampliación.

## Multijugador: primero la mesa

Entrada dedicada (nombre + crear sala / entrar con código), seguida de sala de
espera (código copiable, jugadores, anfitrión, salir). El tablero no se monta
hasta iniciar la partida. Solo el anfitrión puede comenzar, con al menos dos
jugadores. Se conserva el límite real del servidor: 16. Un código inexistente
se rechaza explícitamente; no crea una sala accidental. Los clientes anteriores
siguen siendo compatibles. Al perder conexión se vuelve al acceso a salas.

`MultiplayerLobby` presenta la entrada y espera; `RightSidebar` conserva su
suscripción durante espera/cuenta atrás/partida, y elimina únicamente sus propios
listeners al desmontarse. El índice del reto se sincroniza también al entrar en
una sala existente. Estos cambios requieren desplegar frontend y backend juntos.

## Assets

- Marca y arte geométrico: `frontend/src/components/Identity.tsx`.
- Iconos SVG propios: `frontend/src/components/ui/AtelierIcons.tsx`.
- Favicon SVG y tarjeta social SVG/PNG: `frontend/public/`.
- Miniaturas generadas con las piezas reales, sin imágenes descargadas.
- Audio sintetizado: `frontend/src/services/SoundService.ts`. Ataques breves y
  tonos emparejados para movimiento, giro, reflejo, transición, acierto y error.
  Silencio inicial, preferencia persistente y ambiente opcional independiente.

## Verlo localmente

Desde `frontend`:

```sh
npm run dev -- --host 0.0.0.0 --port 5188 --strictPort
```

Abrir `http://localhost:5188`. El modo individual no requiere servidor.
Para multijugador, ejecutar además `npm run backend:dev`.

```sh
npm run build
npm run frontend:test
npm run backend:test
npm run frontend:lint
```

Revisión manual: inicio, La colección y sus cuatro cuadernos, modo individual,
ayuda, editor, error y acierto; alternar claridad y contraste. Comprobar teclado,
Escape y retorno de foco en diálogos, reducción de movimiento y sonido/silencio.
Revisar 1440×900, 1366×768 y 390×844: escritorio sin desplazamiento global;
móvil con HUD en flujo para no tapar las piezas.
