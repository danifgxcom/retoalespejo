const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const {
  validateRoomPayload,
  validateJoinPayload,
  validateMessagePayload,
  validateSolvePayload
} = require('./gameHelpers');
const { GameGeometry, ValidationService } = require('@reto/geometry');
const challenges = require('@reto/geometry/challenges.json');
require('dotenv').config();

const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

const app = express();
app.use(cors({
  origin: frontendOrigin,
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: frontendOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store active game rooms
const gameRooms = new Map();
// Store room timers
const roomTimers = new Map();
// Store room countdowns
const roomCountdowns = new Map();

const MAX_ROOMS = 500;
const MAX_PLAYERS_PER_ROOM = 16;
const geometry = new GameGeometry({ width: 700, height: 500, mirrorLineX: 700, pieceSize: 100 });

const createGameState = () => ({
  timer: 0,
  isActive: false,
  isPaused: true,
  winner: null,
  scores: {},
  showSolution: false,
  phase: 'waiting',
  challengeStats: [],
  startedAt: null,
  pausedDuration: 0,
  pauseStartedAt: null
});

const emitError = (socket, message) => socket.emit('error', { message });

const clearRoomCountdown = (roomId) => {
  const countdown = roomCountdowns.get(roomId);
  if (!countdown) return;

  clearInterval(countdown.interval);
  clearTimeout(countdown.startTimeout);
  roomCountdowns.delete(roomId);
};

const setGamePaused = (gameState, isPaused, now = Date.now()) => {
  if (isPaused && !gameState.isPaused) {
    gameState.pauseStartedAt = now;
  } else if (!isPaused && gameState.isPaused && gameState.pauseStartedAt) {
    gameState.pausedDuration += now - gameState.pauseStartedAt;
    gameState.pauseStartedAt = null;
  }
  gameState.isPaused = isPaused;
};

const getCompletionTime = (gameState, now = Date.now()) => {
  if (!gameState.startedAt) return 0;
  const currentPause = gameState.isPaused && gameState.pauseStartedAt
    ? now - gameState.pauseStartedAt
    : 0;
  return Math.max(0, Math.floor((now - gameState.startedAt - gameState.pausedDuration - currentPause) / 1000));
};

const resetChallengeByVote = (roomId, room) => {
  room.gameState.timer = 0;
  setGamePaused(room.gameState, true);
  room.resetVotes.clear();
  room.readyPlayers.clear();

  io.to(roomId).emit('challengeReset', {
    resetBy: 'todos los jugadores'
  });
  io.to(roomId).emit('gameNotification', {
    type: 'challengeReset',
    message: 'Reto reiniciado por votación unánime',
    isCorrect: true
  });

  startCountdown(roomId);
};

const maybeStartNextChallenge = (roomId, room) => {
  if (room.players.size === 0 || room.readyPlayers.size < room.players.size) return false;

  room.readyPlayers.clear();
  room.currentChallengeIndex = (room.currentChallengeIndex + 1) % challenges.length;
  startCountdown(roomId);
  io.to(roomId).emit('gameNotification', {
    type: 'nextChallenge',
    message: '¡Todos listos! Comenzando siguiente reto...',
    isCorrect: true
  });
  return true;
};

// Countdown function
const startCountdown = (roomId, dependencies = {}) => {
  const rooms = dependencies.gameRooms || gameRooms;
  const socketServer = dependencies.io || io;
  const countdowns = dependencies.roomCountdowns || roomCountdowns;
  const room = rooms.get(roomId);
  if (!room || !room.gameState.isActive) return;

  const previousCountdown = countdowns.get(roomId);
  if (previousCountdown) {
    clearInterval(previousCountdown.interval);
    clearTimeout(previousCountdown.startTimeout);
  }

  room.players.forEach((player) => {
    player.isActive = true;
  });
  room.solvedPlayers.clear();
  room.gameState.showSolution = false;
  room.gameState.phase = 'countdown';

  // La fase cambia antes del primer número de la cuenta atrás. Emitirla evita
  // que los clientes conserven el overlay de pausa de la ronda anterior.
  socketServer.to(roomId).emit('phaseChanged', {
    phase: 'countdown',
    gameState: room.gameState,
    currentChallengeIndex: room.currentChallengeIndex
  });

  let countdown = 3;
  const countdownInterval = setInterval(() => {
    if (countdown > 0) {
      // Send countdown number
      socketServer.to(roomId).emit('countdown', { value: countdown });
      countdown--;
    } else {
      // Send final message and start the game
      clearInterval(countdownInterval);
      socketServer.to(roomId).emit('countdown', { value: '¡Reto al espejo!' });

      countdownState.startTimeout = setTimeout(() => {
        // Update game state to playing
        room.gameState.phase = 'playing';
        room.gameState.isPaused = false;
        room.gameState.timer = 0; // Reset timer to 0
        room.gameState.startedAt = Date.now();
        room.gameState.pausedDuration = 0;
        room.gameState.pauseStartedAt = null;

        // Tell all clients to start their timers
        socketServer.to(roomId).emit('startTimer', {
          startTime: 0
        });

        // Broadcast phase change
        socketServer.to(roomId).emit('phaseChanged', {
          phase: 'playing',
          gameState: room.gameState,
          currentChallengeIndex: room.currentChallengeIndex
        });

        if (countdowns.get(roomId) === countdownState) {
          countdowns.delete(roomId);
        }
      }, 2000); // Show "¡Reto al espejo!" for 2 seconds
    }
  }, 1000);
  const countdownState = { interval: countdownInterval, startTimeout: null };
  countdowns.set(roomId, countdownState);
};

const eliminatePlayer = (roomId, room, socket) => {
  const player = room.players.get(socket.id);
  if (!player || !player.isActive) return;

  player.isActive = false;
  const completionTime = getCompletionTime(room.gameState);

  socket.emit('playerEliminated', {
    playerId: socket.id,
    username: player.username,
    isCurrentPlayer: true,
    message: 'Has perdido'
  });

  socket.to(roomId).emit('playerEliminated', {
    playerId: socket.id,
    username: player.username,
    isCurrentPlayer: false,
    message: `${player.username} ha sido eliminado`
  });

  const activePlayers = Array.from(room.players.values()).filter(p => p.isActive);
  if (activePlayers.length !== 1) return;

  setGamePaused(room.gameState, true);
  room.gameState.showSolution = true;
  const lastPlayerId = activePlayers[0].id;
  room.gameState.scores[lastPlayerId] = (room.gameState.scores[lastPlayerId] || 0) + 1;

  if (!room.gameState.challengeStats) {
    room.gameState.challengeStats = [];
  }

  room.gameState.challengeStats.push({
    challengeId: challenges[room.currentChallengeIndex].id,
    winnerId: lastPlayerId,
    winnerUsername: activePlayers[0].username,
    completionTime,
    timestamp: new Date().toISOString(),
    winType: 'elimination',
    allScores: { ...room.gameState.scores }
  });

  let highestScore = -1;
  let winner = null;
  Object.entries(room.gameState.scores).forEach(([id, playerScore]) => {
    if (playerScore > highestScore) {
      highestScore = playerScore;
      winner = id;
    }
  });
  room.gameState.winner = winner;

  io.to(roomId).emit('timerCommand', {
    command: 'pause',
    pausedBy: 'SYSTEM'
  });

  io.to(lastPlayerId).emit('lastPlayerStanding', {
    playerId: lastPlayerId,
    username: activePlayers[0].username,
    scores: room.gameState.scores,
    winner,
    showSolution: true,
    isCurrentPlayer: true,
    completionTime
  });

  socket.to(roomId).emit('lastPlayerStanding', {
    playerId: lastPlayerId,
    username: activePlayers[0].username,
    scores: room.gameState.scores,
    winner,
    showSolution: true,
    isCurrentPlayer: false,
    completionTime
  });
};

// Socket.io connection handler
const registerConnectionHandler = (socket) => {
  console.log('New client connected:', socket.id);

  // Join a game room
  socket.on('joinRoom', (payload) => {
    const join = validateJoinPayload(payload);
    if (!join) return emitError(socket, 'Invalid room or username');
    const { roomId, username } = join;

    // Create room if it doesn't exist
    if (!gameRooms.has(roomId)) {
      if (gameRooms.size >= MAX_ROOMS) {
        return emitError(socket, 'Room limit reached');
      }
      gameRooms.set(roomId, {
        players: new Map(),
        messages: [],
        gameState: createGameState(),
        resetVotes: new Set(),
        readyPlayers: new Set(),
        solvedPlayers: new Set(),
        currentChallengeIndex: 0,
        hostId: socket.id
      });
    }

    const room = gameRooms.get(roomId);

    if (!room.players.has(socket.id) && room.players.size >= MAX_PLAYERS_PER_ROOM) {
      return emitError(socket, 'Room is full');
    }

    // Add player to room
    room.players.set(socket.id, {
      id: socket.id,
      username,
      isActive: true
    });

    // Join the socket room
    socket.join(roomId);

    // Notify everyone in the room
    io.to(roomId).emit('playerJoined', {
      playerId: socket.id,
      username,
      players: Array.from(room.players.values()),
      hostId: room.hostId
    });

    // Send room history to the new player
    socket.emit('roomHistory', {
      messages: room.messages,
      gameState: room.gameState,
      hostId: room.hostId
    });
  });

  // Handle chat messages
  socket.on('sendMessage', (payload) => {
    const messagePayload = validateMessagePayload(payload);
    if (!messagePayload) return emitError(socket, 'Invalid message');
    const { roomId, message } = messagePayload;
    const room = gameRooms.get(roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const newMessage = {
      id: Date.now(),
      sender: player.username,
      senderId: socket.id,
      text: message,
      timestamp: new Date().toISOString()
    };

    // Store message in room history
    room.messages.push(newMessage);
    if (room.messages.length > 200) room.messages.shift();

    // Broadcast message to all players in the room
    io.to(roomId).emit('newMessage', newMessage);
  });

  // Handle game events
  socket.on('startGame', (payload) => {
    const roomPayload = validateRoomPayload(payload);
    if (!roomPayload) return emitError(socket, 'Invalid room');
    const { roomId } = roomPayload;
    const room = gameRooms.get(roomId);
    if (!room || !room.players.has(socket.id)) return;
    if (room.hostId !== socket.id) return emitError(socket, 'Only the host can start the game');

    // Stop existing timer if any
    if (roomTimers.has(roomId)) {
      clearInterval(roomTimers.get(roomId));
      roomTimers.delete(roomId);
    }

    // Reset game state
    room.gameState = {
      ...createGameState(),
      isActive: true,
      phase: 'countdown'
    };
    room.currentChallengeIndex = 0;
    room.resetVotes.clear();
    room.readyPlayers.clear();
    room.solvedPlayers.clear();

    // Initialize scores for all players
    room.players.forEach(player => {
      room.gameState.scores[player.id] = 0;
    });

    // Broadcast game start to all players
    io.to(roomId).emit('gameStarted', { gameState: room.gameState });

    // Start countdown sequence (timer will start after countdown)
    startCountdown(roomId);
  });

  // Handle timer toggle (pause/resume)
  socket.on('toggleTimer', (payload) => {
    const roomPayload = validateRoomPayload(payload);
    if (!roomPayload || typeof payload.isPaused !== 'boolean') return emitError(socket, 'Invalid timer command');
    const { roomId, isPaused } = payload;
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive || room.gameState.phase !== 'playing') return;

    const player = room.players.get(socket.id);
    if (!player) return;
    if (!isPaused && room.solvedPlayers.size > 0) return;

    // Update timer state
    setGamePaused(room.gameState, isPaused);

    // Tell all clients to pause/resume their timers
    io.to(roomId).emit('timerCommand', {
      command: isPaused ? 'pause' : 'resume',
      pausedBy: isPaused ? player.username : null
    });

    // Send notification to all players
    io.to(roomId).emit('gameNotification', {
      type: isPaused ? 'pause' : 'resume',
      message: isPaused 
        ? `${player.username} ha pausado el juego`
        : `${player.username} ha reanudado el juego`,
      isCorrect: !isPaused // resume is "good", pause is "neutral"
    });
  });

  // Handle timer reset
  socket.on('resetTimer', (payload) => {
    const roomPayload = validateRoomPayload(payload);
    if (!roomPayload) return emitError(socket, 'Invalid room');
    const { roomId } = roomPayload;
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive) return;

    const player = room.players.get(socket.id);
    if (!player) return;
    if (room.hostId !== socket.id) return emitError(socket, 'Only the host can reset the timer');

    // Reset timer value
    room.gameState.timer = 0;
    setGamePaused(room.gameState, true);
    room.gameState.startedAt = Date.now();
    room.gameState.pausedDuration = 0;
    room.gameState.pauseStartedAt = room.gameState.startedAt;

    // Tell all clients to reset their timers
    io.to(roomId).emit('timerCommand', {
      command: 'reset',
      resetBy: player.username
    });

    // Send notification to all players
    io.to(roomId).emit('gameNotification', {
      type: 'reset',
      message: `${player.username} ha reiniciado el cronómetro`,
      isCorrect: true
    });
  });

  // Handle player solving the challenge
  socket.on('solvePiece', (payload) => {
    const solve = validateSolvePayload(payload);
    if (!solve) return;
    const { roomId, pieces } = solve;
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive || room.gameState.phase !== 'playing' || room.gameState.isPaused) return;

    const player = room.players.get(socket.id);
    if (!player || !player.isActive || room.solvedPlayers.has(socket.id)) return;

    const challenge = challenges[room.currentChallengeIndex];
    const validation = ValidationService.validateSolution(pieces, challenge, geometry);
    if (!validation.isCorrect) {
      eliminatePlayer(roomId, room, socket);
      return;
    }

    const completionTime = getCompletionTime(room.gameState);
    room.solvedPlayers.add(socket.id);
    // Pause the timer when someone solves the challenge
    setGamePaused(room.gameState, true);

    // Increment player's score
    room.gameState.scores[socket.id] = (room.gameState.scores[socket.id] || 0) + 1;

    // Find the player with the highest score
    let highestScore = -1;
    let winner = null;

    Object.entries(room.gameState.scores).forEach(([id, playerScore]) => {
      if (playerScore > highestScore) {
        highestScore = playerScore;
        winner = id;
      }
    });

    // Update winner
    room.gameState.winner = winner;

    // Initialize challenge statistics if not exists
    if (!room.gameState.challengeStats) {
      room.gameState.challengeStats = [];
    }

    // Record this challenge completion
    room.gameState.challengeStats.push({
      challengeId: challenge.id,
      winnerId: socket.id,
      winnerUsername: player.username,
      completionTime: completionTime,
      timestamp: new Date().toISOString(),
      allScores: { ...room.gameState.scores }
    });

    // Pause timer for all clients
    io.to(roomId).emit('timerCommand', {
      command: 'pause',
      pausedBy: 'SYSTEM'
    });

    // Notify all players about the score update and challenge solved
    io.to(roomId).emit('challengeSolved', {
      playerId: socket.id,
      username: player.username,
      scores: room.gameState.scores,
      winner: winner,
      completionTime: completionTime,
      challengeStats: room.gameState.challengeStats
    });
  });

  // Handle player ready for next challenge
  socket.on('playerReady', (payload) => {
    const roomPayload = validateRoomPayload(payload);
    if (!roomPayload) return emitError(socket, 'Invalid room');
    const { roomId } = roomPayload;
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // Add player to ready list
    room.readyPlayers.add(socket.id);
    
    const totalPlayers = room.players.size;
    const readyCount = room.readyPlayers.size;

    // Notify all players about ready status
    io.to(roomId).emit('playersReadyUpdate', {
      readyCount,
      totalPlayers,
      readyPlayers: Array.from(room.readyPlayers),
      playerUsername: player.username
    });

    // If all players are ready, start next challenge
    if (readyCount >= totalPlayers) {
      maybeStartNextChallenge(roomId, room);
    }
  });

  // Handle player making a mistake
  socket.on('wrongPiece', (payload) => {
    const roomPayload = validateRoomPayload(payload);
    if (!roomPayload) return emitError(socket, 'Invalid room');
    const { roomId } = roomPayload;
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive || room.gameState.phase !== 'playing' || room.gameState.isPaused) return;
    eliminatePlayer(roomId, room, socket);
  });

  // Handle reset challenge request
  socket.on('requestResetChallenge', (payload) => {
    const roomPayload = validateRoomPayload(payload);
    if (!roomPayload) return emitError(socket, 'Invalid room');
    const { roomId } = roomPayload;
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // Add vote to reset
    room.resetVotes.add(socket.id);

    const totalPlayers = room.players.size;
    const votes = room.resetVotes.size;

    // Broadcast vote status to all players
    io.to(roomId).emit('resetVoteUpdate', {
      requesterUsername: player.username,
      votes,
      totalPlayers,
      needsVotes: totalPlayers - votes
    });

    // Check if all players voted
    if (votes >= totalPlayers) {
      resetChallengeByVote(roomId, room);
    }
  });

  // Handle vote for reset
  socket.on('voteResetChallenge', (payload) => {
    const roomPayload = validateRoomPayload(payload);
    if (!roomPayload || typeof payload.vote !== 'boolean') return emitError(socket, 'Invalid reset vote');
    const { roomId, vote } = payload;
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    if (vote) {
      room.resetVotes.add(socket.id);
    } else {
      room.resetVotes.delete(socket.id);
    }

    const totalPlayers = room.players.size;
    const votes = room.resetVotes.size;

    // Broadcast vote status to all players
    io.to(roomId).emit('resetVoteUpdate', {
      votes,
      totalPlayers,
      needsVotes: totalPlayers - votes
    });

    // Check if all players voted
    if (votes >= totalPlayers) {
      resetChallengeByVote(roomId, room);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Find and remove player from all rooms they were in
    for (const [roomId, room] of gameRooms.entries()) {
      if (room.players.has(socket.id)) {
        const username = room.players.get(socket.id).username;
        room.players.delete(socket.id);
        room.resetVotes.delete(socket.id);
        room.readyPlayers.delete(socket.id);
        room.solvedPlayers.delete(socket.id);

        if (room.hostId === socket.id) {
          room.hostId = room.players.keys().next().value || null;
          io.to(roomId).emit('hostChanged', { hostId: room.hostId });
        }

        // Notify room about player leaving
        io.to(roomId).emit('playerLeft', {
          playerId: socket.id,
          username,
          hostId: room.hostId
        });

        // Remove room if empty
        if (room.players.size === 0) {
          // Clean up timer
          if (roomTimers.has(roomId)) {
            clearInterval(roomTimers.get(roomId));
            roomTimers.delete(roomId);
          }
          clearRoomCountdown(roomId);
          gameRooms.delete(roomId);
          continue;
        }

        if (room.gameState.isActive && room.resetVotes.size >= room.players.size) {
          resetChallengeByVote(roomId, room);
        } else if (room.gameState.isActive) {
          maybeStartNextChallenge(roomId, room);
        }
      }
    }
  });
};

io.on('connection', registerConnectionHandler);

// API routes
app.get('/api/rooms', (req, res) => {
  const totalPlayers = Array.from(gameRooms.values())
    .reduce((total, room) => total + room.players.size, 0);
  res.json({ roomCount: gameRooms.size, totalPlayers });
});

// Start server
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = {
  startCountdown,
  validateJoinPayload,
  validateMessagePayload,
  validateRoomPayload,
  validateSolvePayload,
  registerConnectionHandler,
  gameRooms,
  roomCountdowns,
  server,
  io
};
