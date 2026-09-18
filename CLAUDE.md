# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a digital implementation of the "Reto al Espejo" (Mirror Challenge) puzzle game, originally by Educa. It's a React-based interactive web application that simulates a physical geometric puzzle game involving symmetry and mirror reflection.

## Architecture

### Component Structure
- **Main Component**: `MirrorChallengeGame.tsx` - Root component that orchestrates all game functionality
- **GameCanvas**: `components/GameCanvas.tsx` - Canvas rendering and drawing logic
- **GamePiece**: `components/GamePiece.tsx` - Piece rendering logic and types
- **ChallengeCard**: `components/ChallengeCard.tsx` - Challenge display component
- **GameControls**: `components/GameControls.tsx` - Game controls and instructions

### Hooks Architecture
- **useGameLogic**: `hooks/useGameLogic.ts` - Game state management and piece manipulation
- **usePointerHandlers**: `hooks/usePointerHandlers.ts` - Interacción de puntero para arrastrar y soltar

### State Management
- React hooks (`useState`, `useEffect`) centralized in custom hooks
- Canvas interaction through refs and imperative API
- TypeScript interfaces for type safety

### Key Game Mechanics
- **Piece System**: Two types of geometric pieces (A & B) with color combinations (yellow center + red triangles, or inverted)
- **Mirror Logic**: Real-time reflection of pieces placed in the game area, with automatic coordinate transformation
- **Challenge System**: 16 retos en `public/challenges.json`. Los objetivos NO están en la retícula de 10 px: están en contacto exacto (hueco 0 contra el espejo y entre piezas), porque la geometría de la pieza (lado 128 px, giros de 45°) es inconmensurable con esa retícula y el redondeo dejaba costuras visibles en las tarjetas. Siguen siendo alcanzables porque el juego pega la pieza al soltarla — lo comprueban `tests/unit/ChallengeData.test.ts` (contacto) y `tests/integration/Winnable.test.ts` (alcanzables)
- **Piece Manipulation**: Rotation (45° increments), face flipping (color inversion), and drag-and-drop positioning
- **Interactive Piece Numbering**: Dynamic piece identification system with context-aware visibility

### Canvas Layout
- **Game Area** (0-700px width, 500px high): Where players place pieces
- **Mirror Area** (700-1400px width): Automatic reflection display
- **Piece Storage Area** (bottom section): Available pieces inventory
- **Challenge Card**: Visual target pattern display

## Development Commands

### Despliegue
- `./scripts/deploy.sh` — construye y despliega a producción. La infraestructura (contenedor, rutas, servicio, vuelta atrás) está en `DEPLOY.md`; no hace falta redescubrirla.

### Local Development
- `npm install` - Install project dependencies
- `npm run dev` - Start development server (http://localhost:5173/)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure
- `src/MirrorChallengeGame.tsx` - Main game component
- `src/components/` - Reusable game components
  - `GameCanvas.tsx` - Canvas rendering component
  - `GamePiece.tsx` - Piece types and drawing logic  
  - `ChallengeCard.tsx` - Challenge display
  - `GameControls.tsx` - Game controls UI
- `src/hooks/` - Custom React hooks
  - `useGameLogic.ts` - Game state management
  - `useMouseHandlers.ts` - Mouse interaction logic
- `src/main.tsx` - React entry point
- `src/index.css` - Global styles with Tailwind CSS
- `index.html` - HTML template

## Clean Architecture & Multiplayer

### Frontend Services
- **GameGeometry** y `utils/geometry/PieceShape.ts`: fuente única de la forma, reflexión y validación geométrica.
- **SocketService**: comunicación Socket.io de bajo nivel; `RightSidebar` conecta los eventos de la sala.
- **ValidationService**: comprueba la solución del jugador contra el objetivo del reto (emparejamiento de piezas y tolerancias). Es la ruta real: `useGameLogic.checkSolutionWithMirrors` delega aquí, y ya no existe la copia duplicada que tenía el hook. Las reglas geométricas (contacto, solape, espejo, área) siguen en `GameGeometry`.
  - Normaliza SÓLO en vertical: deslizar la figura arriba o abajo compone la misma figura, pero moverla en horizontal cambia su encaje con el reflejo, así que la X se compara tal cual.
  - Tolerancias en `SOLUTION_TOLERANCE`: 20 px de posición y 22° de giro (medio paso), para que una pieza girada un paso entero falle.

### Backend Structure
- **gameHelpers.js**: validación y utilidades del servidor.
- **index.js**: servidor Socket.io y eventos autoritativos.

### Multiplayer Features
- **Real-time Synchronization**: Timers, overlays, player elimination
- **Game Statistics**: Completion times, winners, challenge progression
- **Anti-trampas**: el servidor es autoritativo (marcador, tiempo con pausas descontadas, anfitrión). Los overlays son sólo interfaz, no una defensa.
- **Validación**: normaliza SÓLO en vertical. La X se compara tal cual porque mide la distancia al espejo: mover la figura en horizontal cambia la figura compuesta con su reflejo.

### Geometric Rendering
- Custom canvas drawing with rotation support
- `piece.x` y `piece.y` son el **centro** de la pieza; la forma única vive en `utils/geometry/PieceShape.ts`.
- Las **tarjetas de reto** (`ChallengeThumbnail`) no dibujan pieza a pieza: agrupan por color y contornean la figura entera con `drawColorRegions`, así la pieza y su reflejo se funden y la tarjeta no chiva dónde acaba cada pieza (como las tarjetas originales). El tablero sí dibuja pieza a pieza con `drawPiece`.
- Reflexión: `x' = 2 · mirrorLineX − x`, cambiando A↔B y negando el giro. El espejo invierte la quiralidad, no sólo traslada.
- **Encaje a contacto exacto**: al soltar, `GameGeometry.refineToExactContact` lleva la pieza a hueco CERO contra el espejo y sus vecinas, y `RotationAwareGrid.settlePlacedPieces` asienta además el resto de la figura (la primera pieza colocada no tiene contra qué alinearse y se queda con el error de la retícula de 10 px; si la segunda toca el espejo ya no puede ir a buscarla). Sin esto quedaban ranuras de hasta ~6 px que el jugador VE aunque la validación las dé por buenas — lo comprueba `tests/integration/SinRanuras.test.ts`.

### Multiplayer Rules
- Timer sync via server commands (pause/resume/reset)
- Personalized elimination messages ("Has perdido" vs "X eliminado")
- Winner overlay with "Next Challenge" button
- Statistics tracking for game summary

## Interactive Piece Numbering System

### Overview
The game features a dynamic piece numbering system that helps users identify pieces during different interactions. Each piece displays a numbered balloon overlay based on the current interaction context.

### Behavior Modes

#### 1. Debug Mode
- **When**: Debug mode is enabled via game controls
- **Behavior**: All piece numbers are permanently visible
- **Purpose**: Development and testing support

#### 2. Drag Interaction
- **When**: User clicks and drags a piece
- **Behavior**: Number appears while dragging, disappears when released
- **Purpose**: Visual confirmation of which piece is being moved

#### 3. Control Actions
- **When**: User uses UI controls (rotate, flip) on a piece
- **Behavior**: Number appears for 1 second, then automatically disappears
- **Purpose**: Visual feedback showing which piece was modified

#### 4. Hover Interaction (Disabled)
- **Status**: Currently not implemented
- **Reason**: Simplified to avoid UI conflicts with drag interactions

### Technical Implementation

#### State Management
Located in `hooks/useGameLogic.ts`:
```typescript
const [interactingPieceId, setInteractingPieceId] = useState<number | null>(null);
const [controlActionPieceId, setControlActionPieceId] = useState<number | null>(null);
```

#### Control Functions
All control functions (`rotatePiece`, `rotatePieceCounterClockwise`, `flipPiece`) include temporary number display:
```typescript
const rotatePiece = (pieceId: number) => {
  // Piece rotation logic...
  
  // Show number temporarily
  setControlActionPieceId(pieceId);
  setTimeout(() => setControlActionPieceId(null), 1000);
};
```

#### Rendering Logic
Located in `rendering/GameAreaRenderer.ts`:
```typescript
const shouldShowLabel = showLabels || 
                       (draggedPiece && piece.id === draggedPiece.id) ||
                       (controlActionPieceId !== null && piece.id === controlActionPieceId);
```

#### Visual Component
Piece labels are rendered using `components/PieceLabel.tsx`:
- Circular black background with white border
- White text showing piece number
- Positioned above the piece with subtle shadow
- Scales appropriately with piece size

### Component Integration
- **GameCanvas**: Passes interaction states to renderer
- **GameAreaRenderer**: Determines label visibility logic
- **PieceLabel**: Renders the visual number balloon
- **useMouseHandlers**: Manages drag-related numbering (currently simplified)

## Testing Considerations
- Test canvas rendering functionality manually
- Verify drag-and-drop mechanics across different browser environments
- Check mirror reflection accuracy for various piece positions and rotations
- Validate challenge progression and piece reset functionality
- **Test piece numbering**: Verify numbers appear/disappear correctly in all interaction modes
- **Test control feedback**: Ensure control actions show piece numbers temporarily
- **Test debug mode**: Confirm all numbers are visible when debug mode is enabled
