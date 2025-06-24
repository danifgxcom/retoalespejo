# Reto al Espejo - Backend

This is the backend server for the Reto al Espejo multiplayer game. It provides real-time communication between players using WebSockets and manages game rooms and state.

## Features

- Real-time multiplayer gameplay with Socket.io
- Chat functionality between players in the same room
- Synchronized game timer for all players
- Player elimination on wrong answers
- Winner notification when a player solves the challenge

## Technologies Used

- Node.js
- Express.js
- Socket.io for real-time communication
- CORS for cross-origin resource sharing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   ```

### Running the Server

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

## API Endpoints

- `GET /api/rooms` - Get a list of active game rooms

## WebSocket Events

### Client to Server

- `joinRoom` - Join a game room
- `sendMessage` - Send a chat message
- `startGame` - Start the game timer
- `solvePiece` - Notify when a player solves the challenge
- `wrongPiece` - Notify when a player makes a mistake

### Server to Client

- `playerJoined` - New player joined the room
- `roomHistory` - Room history (messages and game state)
- `newMessage` - New chat message
- `gameStarted` - Game has started
- `timerUpdate` - Game timer update
- `gameEnded` - Game has ended
- `challengeSolved` - Challenge has been solved
- `playerEliminated` - Player has been eliminated
- `playerLeft` - Player has left the room