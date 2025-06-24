# Reto al Espejo - Frontend

This is the frontend application for the Reto al Espejo game. It's a React application that allows users to play the mirror challenge game.

## Features

- Interactive game board with draggable pieces
- Mirror reflection visualization
- Challenge cards with different difficulty levels
- Multiplayer support with real-time updates
- Chat functionality with other players

## Technologies Used

- React
- TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Socket.io client for real-time communication with the backend

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

### Running the Application

Development mode:
```
npm run dev
```

Build for production:
```
npm run build
```

Preview production build:
```
npm run preview
```

## Game Rules

The game challenges players to place pieces on a board in such a way that their reflection in a mirror creates a specific pattern. Players need to:

1. Drag and place pieces on the game board
2. Observe how the pieces reflect in the mirror
3. Arrange the pieces to match the challenge pattern
4. Submit their solution when ready

In multiplayer mode:
- All players share the same timer
- The first player to correctly solve the challenge wins
- Players who make incorrect submissions are eliminated
- Chat with other players while solving the challenge