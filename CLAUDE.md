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
- **useMouseHandlers**: `hooks/useMouseHandlers.ts` - Mouse interaction handling for drag & drop

### State Management
- React hooks (`useState`, `useEffect`) centralized in custom hooks
- Canvas interaction through refs and imperative API
- TypeScript interfaces for type safety

### Key Game Mechanics
- **Piece System**: Two types of geometric pieces (A & B) with color combinations (yellow center + red triangles, or inverted)
- **Mirror Logic**: Real-time reflection of pieces placed in the game area, with automatic coordinate transformation
- **Challenge System**: 4 predefined challenge patterns with varying difficulty levels
- **Piece Manipulation**: Rotation (45° increments), face flipping (color inversion), and drag-and-drop positioning
- **Interactive Piece Numbering**: Dynamic piece identification system with context-aware visibility

### Canvas Layout
- **Game Area** (0-350px width): Where players place pieces
- **Mirror Area** (350-700px width): Automatic reflection display
- **Piece Storage Area** (bottom section): Available pieces inventory
- **Challenge Card**: Visual target pattern display

## Development Commands

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
- **MultiplayerManager**: Centralized multiplayer logic, state management
- **ValidationService**: Pure functions for solution validation with relative positioning  
- **SocketService**: Low-level socket communication wrapper

### Backend Structure
- **gameUtils.js**: Shared utilities (game state, statistics, notifications)
- **index.js**: Main server with clean event handlers

### Multiplayer Features
- **Real-time Synchronization**: Timers, overlays, player elimination
- **Game Statistics**: Completion times, winners, challenge progression
- **Anti-cheat**: Full-screen overlays prevent interaction during pause
- **Relative Validation**: Ignores absolute canvas position, checks piece relationships

### Geometric Rendering
- Custom canvas drawing with rotation support
- Mirror reflection: `reflectedX = mirrorLine + (mirrorLine - pieceCenter)`
- Validation uses piece relationships, not absolute positions

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