// Game utility functions to reduce duplication

// Create challenge statistics entry
function createChallengeStats(challengeId, winnerId, winnerUsername, completionTime, scores, winType = 'solved') {
  return {
    challengeId,
    winnerId,
    winnerUsername,
    completionTime,
    timestamp: new Date().toISOString(),
    winType,
    allScores: { ...scores }
  };
}

// Find winner from scores
function findWinner(scores) {
  let highestScore = -1;
  let winner = null;

  Object.entries(scores).forEach(([id, playerScore]) => {
    if (playerScore > highestScore) {
      highestScore = playerScore;
      winner = id;
    }
  });

  return winner;
}

// Send timer command to all clients
function sendTimerCommand(io, roomId, command, data = {}) {
  io.to(roomId).emit('timerCommand', {
    command,
    ...data
  });
}

// Send game notification to all clients
function sendGameNotification(io, roomId, type, message, isCorrect = true) {
  io.to(roomId).emit('gameNotification', {
    type,
    message,
    isCorrect
  });
}

// Initialize game state
function createGameState() {
  return {
    timer: 0,
    isActive: false,
    isPaused: true,
    winner: null,
    scores: {},
    showSolution: false,
    phase: 'waiting',
    resetVotes: new Set(),
    challengeStats: []
  };
}

// Reset challenge with countdown
function resetChallengeWithCountdown(io, roomId, resetBy, startCountdownFn) {
  sendGameNotification(io, roomId, 'challengeReset', `Reto reiniciado por ${resetBy}`, true);
  
  setTimeout(() => {
    startCountdownFn(roomId);
  }, 1000);
}

module.exports = {
  createChallengeStats,
  findWinner,
  sendTimerCommand,
  sendGameNotification,
  createGameState,
  resetChallengeWithCountdown
};