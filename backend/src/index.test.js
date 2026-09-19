const {
  startCountdown,
  validateJoinPayload,
  validateMessagePayload,
  validateRoomPayload,
  validateSolvePayload,
  registerConnectionHandler,
  gameRooms,
  server,
  io
} = require('./index');
const challenges = require('@reto/geometry/challenges.json');
const { io: createClient } = require('socket.io-client');

const createSocket = (id = 'player-1') => {
  const handlers = {};
  const socket = {
    id,
    on: (event, handler) => { handlers[event] = handler; },
    emit: jest.fn(),
    join: jest.fn(),
    to: () => ({ emit: jest.fn() })
  };
  registerConnectionHandler(socket);
  return { socket, handlers };
};

const createPlayingRoom = (currentChallengeIndex = 0) => ({
  players: new Map([
    ['player-1', { id: 'player-1', username: 'Ada', isActive: true }],
    ['player-2', { id: 'player-2', username: 'Lin', isActive: true }]
  ]),
  gameState: {
    isActive: true,
    phase: 'playing',
    isPaused: false,
    startedAt: Date.now(),
    pausedDuration: 0,
    pauseStartedAt: null,
    scores: { 'player-1': 0, 'player-2': 0 },
    challengeStats: []
  },
  resetVotes: new Set(),
  readyPlayers: new Set(),
  solvedPlayers: new Set(),
  currentChallengeIndex
});

const solutionFor = (challenge) => challenge.objective.playerPieces.map((piece) => ({
  type: piece.type,
  face: piece.face,
  x: piece.x,
  y: piece.y,
  rotation: piece.rotation,
  placed: true
}));

describe('socket payload validation', () => {
  test('joining a nonexistent room does not create it when requireExisting is set', () => {
    const { socket, handlers } = createSocket('lobby-guest');
    handlers.joinRoom({ roomId: 'missing-lobby-test', username: 'Ada', requireExisting: true });
    expect(gameRooms.has('missing-lobby-test')).toBe(false);
    expect(socket.emit).toHaveBeenCalledWith('error', expect.objectContaining({ message: expect.stringContaining('No encontramos') }));
  });

  test('creating and joining an existing room preserves host and returns the current challenge', () => {
    const host = createSocket('lobby-host');
    const guest = createSocket('lobby-guest');
    host.handlers.joinRoom({ roomId: 'lobby-test', username: 'Ada', requireExisting: false });
    gameRooms.get('lobby-test').currentChallengeIndex = 3;
    guest.handlers.joinRoom({ roomId: 'lobby-test', username: 'Lin', requireExisting: true });
    expect(gameRooms.get('lobby-test').players.size).toBe(2);
    expect(guest.socket.emit).toHaveBeenCalledWith('roomHistory', expect.objectContaining({ hostId: 'lobby-host', currentChallengeIndex: 3 }));
    gameRooms.delete('lobby-test');
  });

  test('accepts valid payloads and rejects invalid ones', () => {
    expect(validateJoinPayload({ roomId: 'room_42-A', username: '  Ada  ' }))
      .toEqual({ roomId: 'room_42-A', username: 'Ada' });
    expect(validateJoinPayload()).toBeNull();
    expect(validateJoinPayload({ roomId: 'bad room', username: 'Ada' })).toBeNull();
    expect(validateJoinPayload({ roomId: 'room', username: ' '.repeat(33) })).toBeNull();

    expect(validateMessagePayload({ roomId: 'room', message: 'hello' })).toEqual({ roomId: 'room', message: 'hello' });
    expect(validateMessagePayload({ roomId: 'room', message: 'x'.repeat(501) })).toBeNull();
    expect(validateRoomPayload({ roomId: 'room' })).toEqual({ roomId: 'room' });
    expect(validateRoomPayload(null)).toBeNull();
    expect(validateSolvePayload({ roomId: 'room', pieces: solutionFor(challenges[0]) })).not.toBeNull();
    expect(validateSolvePayload({ roomId: 'room', pieces: [{ type: 'A', face: 'front', x: Infinity, y: 0, rotation: 0, placed: true }] })).toBeNull();
  });
});

describe('authoritative solution validation', () => {
  let connectionLog;

  beforeEach(() => {
    connectionLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    connectionLog.mockRestore();
    gameRooms.clear();
  });

  test('accepts the real solution for the current challenge', () => {
    const { socket, handlers } = createSocket();
    gameRooms.set('room', createPlayingRoom(0));

    handlers.solvePiece({ roomId: 'room', pieces: solutionFor(challenges[0]) });

    const room = gameRooms.get('room');
    expect(room.solvedPlayers.has('player-1')).toBe(true);
    expect(room.gameState.scores['player-1']).toBe(1);
    expect(socket.emit).not.toHaveBeenCalledWith('playerEliminated', expect.anything());
  });

  test('rejects an incorrect solution and eliminates the player', () => {
    const { socket, handlers } = createSocket();
    gameRooms.set('room', createPlayingRoom(0));
    const wrongPieces = solutionFor(challenges[0]);
    wrongPieces[0].x += 100;

    handlers.solvePiece({ roomId: 'room', pieces: wrongPieces });

    expect(gameRooms.get('room').players.get('player-1').isActive).toBe(false);
    expect(gameRooms.get('room').gameState.showSolution).toBe(true);
    expect(socket.emit).toHaveBeenCalledWith('playerEliminated', expect.objectContaining({ playerId: 'player-1' }));
  });

  test('uses its current challenge index instead of an index sent by the client', () => {
    const { handlers } = createSocket();
    gameRooms.set('room', createPlayingRoom(1));

    handlers.solvePiece({
      roomId: 'room',
      challengeIndex: 0,
      pieces: solutionFor(challenges[0])
    });

    expect(gameRooms.get('room').players.get('player-1').isActive).toBe(false);
  });

  test('ignores a malformed solution payload without crashing the handler', () => {
    const { handlers } = createSocket();
    gameRooms.set('room', createPlayingRoom(0));

    expect(() => handlers.solvePiece({ roomId: 'room', pieces: [{ type: 'A' }] })).not.toThrow();
    expect(gameRooms.get('room').players.get('player-1').isActive).toBe(true);
  });
});

describe('server-controlled scores', () => {
  afterEach(() => gameRooms.clear());

  test('does not register an external updateScore handler', () => {
    const connectionLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    const handlers = {};
    const socket = {
      id: 'player-1',
      on: (event, handler) => { handlers[event] = handler; },
      emit: jest.fn(),
      join: jest.fn(),
      to: () => ({ emit: jest.fn() })
    };
    gameRooms.set('room', { gameState: { scores: { 'player-1': 1 } } });

    registerConnectionHandler(socket);

    expect(handlers.updateScore).toBeUndefined();
    expect(gameRooms.get('room').gameState.scores).toEqual({ 'player-1': 1 });
    connectionLog.mockRestore();
  });
});

describe('countdown', () => {
  afterEach(() => jest.useRealTimers());

  test('emits startTimer only once', () => {
    jest.useFakeTimers();
    const events = [];
    const rooms = new Map([['room', {
      players: new Map([['player-1', { id: 'player-1', isActive: false }]]),
      solvedPlayers: new Set(['player-1']),
      gameState: { isActive: true, phase: 'countdown', isPaused: true, timer: 0 }
    }]]);
    const socketServer = {
      to: () => ({ emit: (event, data) => events.push({ event, data }) })
    };

    startCountdown('room', { gameRooms: rooms, io: socketServer, roomCountdowns: new Map() });
    jest.advanceTimersByTime(6000);

    expect(events.filter(({ event }) => event === 'startTimer')).toHaveLength(1);
    expect(events.filter(({ event, data }) => event === 'countdown' && data.value === '¡Desafía al reflejo!')).toHaveLength(1);
    expect(rooms.get('room').players.get('player-1').isActive).toBe(true);
  });
});

const waitForSocketEvent = (socket, event, predicate = () => true) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    socket.off(event, handler);
    reject(new Error(`Timed out waiting for ${event}`));
  }, 10_000);
  const handler = (data) => {
    if (!predicate(data)) return;
    clearTimeout(timeout);
    socket.off(event, handler);
    resolve(data);
  };
  socket.on(event, handler);
});

describe('flujo multijugador Socket.io', () => {
  let port;
  let skipReason;
  let host;
  let guest;

  beforeAll(async () => {
    try {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
          server.off('error', reject);
          resolve();
        });
      });
      port = server.address().port;
    } catch (error) {
      if (error && error.code === 'EPERM') {
        // Algunos sandboxes no permiten escuchar ni en loopback. Pero omitir
        // esto EN SILENCIO daría el multijugador por verificado sin haberlo
        // probado, que es peor que no tener la prueba. Sólo se permite omitir
        // si alguien lo pide expresamente con ALLOW_SKIP_SOCKET_IT=1.
        port = null;
        skipReason = error.code;
        return;
      }
      throw error;
    }
  });

  afterAll(async () => {
    if (!port) return;
    host?.disconnect();
    guest?.disconnect();
    await new Promise((resolve) => io.close(resolve));
  });

  afterEach(() => gameRooms.clear());

  test('dos clientes crean, se unen, juegan y reciben la victoria validada por el servidor', async () => {
    if (!port) {
      if (process.env.ALLOW_SKIP_SOCKET_IT === '1') {
        console.warn(`[OMITIDA] integracion de dos clientes: no se pudo escuchar en loopback (${skipReason}).`);
        return;
      }
      throw new Error(
        `No se pudo abrir un puerto en loopback (${skipReason}), asi que la integracion de dos ` +
        'clientes NO se ha ejecutado. Ejecutala en un entorno sin restriccion de puertos, o pasa ' +
        'ALLOW_SKIP_SOCKET_IT=1 para omitirla a sabiendas.'
      );
    }
    host = createClient(`http://127.0.0.1:${port}`, { transports: ['websocket'], forceNew: true });
    guest = createClient(`http://127.0.0.1:${port}`, { transports: ['websocket'], forceNew: true });

    await Promise.all([
      waitForSocketEvent(host, 'connect'),
      waitForSocketEvent(guest, 'connect')
    ]);

    const roomId = 'integration-room';
    const hostJoined = waitForSocketEvent(host, 'playerJoined');
    host.emit('joinRoom', { roomId, username: 'Ada' });
    await hostJoined;

    const guestJoined = waitForSocketEvent(guest, 'playerJoined');
    guest.emit('joinRoom', { roomId, username: 'Lin' });
    const joined = await guestJoined;
    expect(joined.players).toHaveLength(2);

    const gameStarted = waitForSocketEvent(host, 'gameStarted');
    const playing = waitForSocketEvent(host, 'phaseChanged', (data) => data.phase === 'playing');
    host.emit('startGame', { roomId });
    await gameStarted;
    await playing;

    const solvedByHost = waitForSocketEvent(host, 'challengeSolved');
    const solvedByGuest = waitForSocketEvent(guest, 'challengeSolved');
    host.emit('solvePiece', { roomId, pieces: solutionFor(challenges[0]) });

    const [hostResult, guestResult] = await Promise.all([solvedByHost, solvedByGuest]);
    expect(hostResult.playerId).toBe(host.id);
    expect(hostResult.scores[host.id]).toBe(1);
    expect(guestResult).toEqual(hostResult);
    expect(gameRooms.get(roomId).gameState.isPaused).toBe(true);
  }, 15_000);
});
