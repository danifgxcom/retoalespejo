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
- **Piece Manipulation**: Rotation (90° increments), face flipping (color inversion), and drag-and-drop positioning

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

## Development Notes

### Geometric Rendering
The game uses custom canvas drawing functions for complex geometric shapes:
- `drawPiece()`: Renders square + 3 triangles with rotation support
- `drawHeart1Pattern()` / `drawHeart2Pattern()`: Target pattern renderers
- Mirror reflection is calculated using coordinate transformation: `reflectedX = mirrorLine + (mirrorLine - pieceCenter)`

### State Dependencies
- Piece positions and rotations affect mirror reflections automatically
- Challenge progression resets piece positions and configurations
- Face toggling switches between front/back color schemes

### File Structure
Single-file architecture with all game logic, rendering, and UI in one component. No external dependencies beyond React and Lucide React icons.

## Testing Considerations
- Test canvas rendering functionality manually
- Verify drag-and-drop mechanics across different browser environments
- Check mirror reflection accuracy for various piece positions and rotations
- Validate challenge progression and piece reset functionality