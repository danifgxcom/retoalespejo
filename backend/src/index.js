const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// Countdown function
const startCountdown = (roomId) => {
  const room = gameRooms.get(roomId);
  if (!room || !room.gameState.isActive) return;

  let countdown = 3;
  const countdownInterval = setInterval(() => {
    if (countdown > 0) {
      // Send countdown number
      io.to(roomId).emit('countdown', { value: countdown });
      countdown--;
    } else {
      // Send final message and start the game
      io.to(roomId).emit('countdown', { value: '¡Reto al espejo!' });
      
      setTimeout(() => {
        // Update game state to playing
        room.gameState.phase = 'playing';
        room.gameState.isPaused = false;
        room.gameState.timer = 0; // Reset timer to 0
        
        // Tell all clients to start their timers
        io.to(roomId).emit('startTimer', {
          startTime: 0
        });
        
        // Broadcast phase change
        io.to(roomId).emit('phaseChanged', { 
          phase: 'playing',
          gameState: room.gameState 
        });
        
        clearInterval(countdownInterval);
      }, 2000); // Show "¡Reto al espejo!" for 2 seconds
    }
  }, 1000);
};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a game room
  socket.on('joinRoom', ({ roomId, username }) => {
    // Create room if it doesn't exist
    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, {
        players: new Map(),
        messages: [],
        gameState: {
          timer: 0,
          isActive: false,
          isPaused: true,
          winner: null,
          scores: {},
          showSolution: false,
          phase: 'waiting',
          resetVotes: new Set()
        }
      });
    }

    const room = gameRooms.get(roomId);

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
      players: Array.from(room.players.values())
    });

    // Send room history to the new player
    socket.emit('roomHistory', {
      messages: room.messages,
      gameState: room.gameState
    });
  });

  // Handle chat messages
  socket.on('sendMessage', ({ roomId, message }) => {
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

    // Broadcast message to all players in the room
    io.to(roomId).emit('newMessage', newMessage);
  });

  // Handle game events
  socket.on('startGame', ({ roomId }) => {
    console.log('startGame called for room:', roomId, 'by socket:', socket.id);
    const room = gameRooms.get(roomId);
    if (!room) {
      console.log('Room not found:', roomId);
      return;
    }
    console.log('Current room gameState before reset:', room.gameState);

    // Stop existing timer if any
    if (roomTimers.has(roomId)) {
      clearInterval(roomTimers.get(roomId));
      roomTimers.delete(roomId);
    }

    // Reset game state
    room.gameState = {
      timer: 0, // Start at 0
      isActive: true,
      isPaused: true, // Start paused
      winner: null,
      scores: {},
      showSolution: false,
      phase: 'countdown',
      resetVotes: new Set()
    };

    // Initialize scores for all players
    room.players.forEach(player => {
      room.gameState.scores[player.id] = 0;
    });

    // Broadcast game start to all players
    console.log('Emitting gameStarted with:', { gameState: room.gameState });
    io.to(roomId).emit('gameStarted', { gameState: room.gameState });

    // Start countdown sequence (timer will start after countdown)
    startCountdown(roomId);
  });

  // Handle timer toggle (pause/resume)
  socket.on('toggleTimer', ({ roomId, isPaused }) => {
    console.log('📥 Backend received toggleTimer:', { roomId, isPaused, socketId: socket.id });
    
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive) {
      console.log('❌ toggleTimer failed - room:', !!room, 'isActive:', room?.gameState?.isActive);
      return;
    }

    const player = room.players.get(socket.id);
    if (!player) {
      console.log('❌ toggleTimer failed - player not found for socket:', socket.id);
      return;
    }

    console.log('✅ toggleTimer processing - player:', player.username, 'isPaused:', isPaused);

    // Update timer state
    room.gameState.isPaused = isPaused;

    // Tell all clients to pause/resume their timers
    console.log('📤 Emitting timerCommand to room:', roomId);
    io.to(roomId).emit('timerCommand', {
      command: isPaused ? 'pause' : 'resume',
      pausedBy: isPaused ? player.username : null
    });

    // Send notification to all players
    console.log('📤 Emitting gameNotification to room:', roomId);
    io.to(roomId).emit('gameNotification', {
      type: isPaused ? 'pause' : 'resume',
      message: isPaused 
        ? `${player.username} ha pausado el juego`
        : `${player.username} ha reanudado el juego`,
      isCorrect: !isPaused // resume is "good", pause is "neutral"
    });
  });

  // Handle timer reset
  socket.on('resetTimer', ({ roomId }) => {
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // Reset timer value
    room.gameState.timer = 0;
    room.gameState.isPaused = true;

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
  socket.on('solvePiece', ({ roomId, pieceId, currentTime }) => {
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // Pause the timer when someone solves the challenge
    room.gameState.isPaused = true;
    // Use the timer value sent from the client (more accurate) or fallback to server timer
    const completionTime = currentTime || room.gameState.timer || 0;

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
      challengeId: pieceId,
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

  // Handle next challenge request
  socket.on('nextChallenge', ({ roomId }) => {
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // Reset timer and continue the game
    room.gameState.timer = 0;
    room.gameState.isPaused = false;

    // Send timer reset and resume commands
    io.to(roomId).emit('timerCommand', {
      command: 'reset',
      resetBy: 'SYSTEM'
    });

    setTimeout(() => {
      io.to(roomId).emit('timerCommand', {
        command: 'resume',
        pausedBy: null
      });
    }, 100);

    // Notify all players to go to next challenge
    io.to(roomId).emit('nextChallengeReady', {
      requestedBy: player.username,
      newTimer: 0
    });

    // Send notification
    io.to(roomId).emit('gameNotification', {
      type: 'nextChallenge',
      message: `${player.username} ha iniciado el siguiente reto`,
      isCorrect: true
    });
  });

  // Handle score updates
  socket.on('updateScore', ({ roomId, playerId, score }) => {
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive) return;

    // Update player's score
    room.gameState.scores[playerId] = score;

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

    // Notify all players about the score update
    io.to(roomId).emit('scoreUpdated', {
      scores: room.gameState.scores,
      winner: winner
    });
  });

  // Handle player making a mistake
  socket.on('wrongPiece', ({ roomId, currentTime }) => {
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // Mark player as eliminated
    player.isActive = false;
    const completionTime = currentTime || room.gameState.timer || 0;

    // Send "Has perdido" message to the eliminated player only
    socket.emit('playerEliminated', {
      playerId: socket.id,
      username: player.username,
      isCurrentPlayer: true,
      message: 'Has perdido'
    });

    // Notify other players about the elimination
    socket.to(roomId).emit('playerEliminated', {
      playerId: socket.id,
      username: player.username,
      isCurrentPlayer: false,
      message: `${player.username} ha sido eliminado`
    });

    // Check if only one player remains active
    const activePlayers = Array.from(room.players.values()).filter(p => p.isActive);
    if (activePlayers.length === 1) {
      // Pause the timer when only one player remains
      room.gameState.isPaused = true;

      // Increment the score of the last active player
      const lastPlayerId = activePlayers[0].id;
      room.gameState.scores[lastPlayerId] = (room.gameState.scores[lastPlayerId] || 0) + 1;

      // Record this as a win by elimination
      if (!room.gameState.challengeStats) {
        room.gameState.challengeStats = [];
      }

      room.gameState.challengeStats.push({
        challengeId: 'current', // We'll need to pass this properly
        winnerId: lastPlayerId,
        winnerUsername: activePlayers[0].username,
        completionTime: completionTime,
        timestamp: new Date().toISOString(),
        winType: 'elimination',
        allScores: { ...room.gameState.scores }
      });

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

      // Pause timer for all clients
      io.to(roomId).emit('timerCommand', {
        command: 'pause',
        pausedBy: 'SYSTEM'
      });

      // Notify the winner about victory
      io.to(lastPlayerId).emit('lastPlayerStanding', {
        playerId: lastPlayerId,
        username: activePlayers[0].username,
        scores: room.gameState.scores,
        winner: winner,
        showSolution: true,
        isCurrentPlayer: true,
        completionTime: completionTime
      });

      // Notify other players (eliminated players) about the winner
      socket.to(roomId).emit('lastPlayerStanding', {
        playerId: lastPlayerId,
        username: activePlayers[0].username,
        scores: room.gameState.scores,
        winner: winner,
        showSolution: true,
        isCurrentPlayer: false,
        completionTime: completionTime
      });
    }
  });

  // Handle reset challenge request
  socket.on('requestResetChallenge', ({ roomId }) => {
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // Add vote to reset
    room.gameState.resetVotes.add(socket.id);

    const totalPlayers = room.players.size;
    const votes = room.gameState.resetVotes.size;

    // Broadcast vote status to all players
    io.to(roomId).emit('resetVoteUpdate', {
      requesterUsername: player.username,
      votes,
      totalPlayers,
      needsVotes: totalPlayers - votes
    });

    // Check if all players voted
    if (votes >= totalPlayers) {
      // Reset the challenge
      room.gameState.timer = 0;
      room.gameState.isPaused = true;
      room.gameState.resetVotes.clear();

      // Broadcast reset
      io.to(roomId).emit('challengeReset', {
        resetBy: 'todos los jugadores'
      });

      // Send notification to all players
      io.to(roomId).emit('gameNotification', {
        type: 'challengeReset',
        message: `Reto reiniciado por votación unánime`,
        isCorrect: true
      });

      // Start countdown again
      setTimeout(() => {
        startCountdown(roomId);
      }, 1000);
    }
  });

  // Handle vote for reset
  socket.on('voteResetChallenge', ({ roomId, vote }) => {
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState.isActive) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    if (vote) {
      room.gameState.resetVotes.add(socket.id);
    } else {
      room.gameState.resetVotes.delete(socket.id);
    }

    const totalPlayers = room.players.size;
    const votes = room.gameState.resetVotes.size;

    // Broadcast vote status to all players
    io.to(roomId).emit('resetVoteUpdate', {
      votes,
      totalPlayers,
      needsVotes: totalPlayers - votes
    });

    // Check if all players voted
    if (votes >= totalPlayers) {
      // Reset the challenge
      room.gameState.timer = 0;
      room.gameState.isPaused = true;
      room.gameState.resetVotes.clear();

      // Broadcast reset
      io.to(roomId).emit('challengeReset', {
        resetBy: 'todos los jugadores'
      });

      // Send notification to all players
      io.to(roomId).emit('gameNotification', {
        type: 'challengeReset',
        message: `Reto reiniciado por votación unánime`,
        isCorrect: true
      });

      // Start countdown again
      setTimeout(() => {
        startCountdown(roomId);
      }, 1000);
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

        // Notify room about player leaving
        io.to(roomId).emit('playerLeft', {
          playerId: socket.id,
          username
        });

        // Remove room if empty
        if (room.players.size === 0) {
          // Clean up timer
          if (roomTimers.has(roomId)) {
            clearInterval(roomTimers.get(roomId));
            roomTimers.delete(roomId);
          }
          gameRooms.delete(roomId);
        }
      }
    }
  });
});

// API routes
app.get('/api/rooms', (req, res) => {
  const roomsInfo = Array.from(gameRooms.entries()).map(([roomId, room]) => ({
    id: roomId,
    playerCount: room.players.size,
    isActive: room.gameState.isActive
  }));

  res.json(roomsInfo);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
