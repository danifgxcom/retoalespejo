import { render, screen, act, fireEvent } from '@testing-library/react';
import RightSidebar from '../../components/RightSidebar';

// Mock del singleton de SocketService: RightSidebar no debe conectar un socket
// real en pruebas. Capturamos los callbacks registrados con las funciones
// on* para poder disparar eventos del servidor (playerJoined, hostChanged...)
// manualmente desde el test.
jest.mock('../../services/SocketService', () => {
  const listeners: Record<string, (data: unknown) => void> = {};
  const on = (event: string) => (cb: (data: unknown) => void) => {
    listeners[event] = cb;
  };

  const mockSocketService = {
    socketInstance: { off: jest.fn() },
    getSocketId: jest.fn(() => 'me'),
    getRoomId: jest.fn(() => 'room-1'),
    getUsername: jest.fn(() => 'Tester'),
    isConnected: jest.fn(() => true),
    connect: jest.fn(),
    disconnect: jest.fn(),
    joinRoom: jest.fn(),
    createRoom: jest.fn(),
    startGame: jest.fn(),
    toggleTimer: jest.fn(),
    resetTimer: jest.fn(),
    requestResetChallenge: jest.fn(),
    voteResetChallenge: jest.fn(),
    reportSolvedPiece: jest.fn(),
    reportWrongPiece: jest.fn(),
    playerReady: jest.fn(),
    onPlayerJoined: on('playerJoined'),
    onHostChanged: on('hostChanged'),
    onRoomHistory: on('roomHistory'),
    onError: on('error'),
    onGameStarted: on('gameStarted'),
    onTimerStateChanged: on('timerStateChanged'),
    onTimerReset: on('timerReset'),
    onTimerUpdate: on('timerUpdate'),
    onChallengeSolved: on('challengeSolved'),
    onPlayerEliminated: on('playerEliminated'),
    onLastPlayerStanding: on('lastPlayerStanding'),
    onResetVoteUpdate: on('resetVoteUpdate'),
    onChallengeReset: on('challengeReset'),
    onStartTimer: on('startTimer'),
    onTimerCommand: on('timerCommand'),
    onGameNotification: on('gameNotification'),
    onPlayerLeft: on('playerLeft'),
    onPhaseChanged: on('phaseChanged'),
    onCountdown: on('countdown'),
    onPlayersReadyUpdate: on('playersReadyUpdate'),
    // Helper de test, no forma parte de la API real
    __trigger: (event: string, data: unknown) => listeners[event]?.(data),
  };

  return { __esModule: true, default: mockSocketService };
});

import socketServiceUnderTest from '../../services/SocketService';

const mockSocketService = socketServiceUnderTest as unknown as {
  __trigger: (event: string, data: unknown) => void;
  reportSolvedPiece: jest.Mock;
  createRoom: jest.Mock;
  joinRoom: jest.Mock;
};

const baseProps = {
  currentChallenge: 0,
  totalChallenges: 1,
  challenges: [],
  onResetLevel: jest.fn(),
  onCheckSolution: jest.fn(() => ({ isCorrect: true, message: 'ok' })),
  isMultiplayerEnabled: true,
  gameMode: 'multiplayer' as const,
  connectedPlayers: [],
  roomId: 'room-1',
  isGameActive: true,
};

describe('RightSidebar - control de anfitrión', () => {
  beforeEach(() => {
    mockSocketService.reportSolvedPiece.mockClear();
    mockSocketService.createRoom.mockClear();
    mockSocketService.joinRoom.mockClear();
  });

  test('muestra los controles para crear o unirse a una sala en modo multijugador', () => {
    render(<RightSidebar {...baseProps} roomId={null} isGameActive={false} />);

    expect(screen.getByRole('button', { name: 'Crear sala de multijugador' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unirse a sala existente' })).toBeInTheDocument();
  });

  test('pide un nombre antes de crear la sala', () => {
    render(<RightSidebar {...baseProps} roomId={null} isGameActive={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Crear sala de multijugador' }));
    fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar nombre de usuario' }));

    expect(mockSocketService.createRoom).toHaveBeenCalledWith('Ada');
  });

  test('pide identificador y nombre antes de unirse a una sala', () => {
    render(<RightSidebar {...baseProps} roomId={null} isGameActive={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Unirse a sala existente' }));
    fireEvent.change(screen.getByLabelText('ID de la Sala'), { target: { value: 'room-42' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar unirse a sala' }));
    fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'Lin' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar nombre de usuario' }));

    expect(mockSocketService.joinRoom).toHaveBeenCalledWith('room-42', 'Lin');
  });

  test('envía las piezas al servidor sin validar ni eliminar localmente', () => {
    const onCheckSolution = jest.fn(() => ({ isCorrect: false, message: 'incorrecta' }));
    const pieces = [{ type: 'A', face: 'front', x: 10, y: 20, rotation: 0, placed: true }];
    render(<RightSidebar {...baseProps} onCheckSolution={onCheckSolution} pieces={pieces as never} />);

    fireEvent.click(screen.getByRole('button', { name: 'Verificar solución actual' }));

    expect(mockSocketService.reportSolvedPiece).toHaveBeenCalledWith(pieces);
    expect(onCheckSolution).not.toHaveBeenCalled();
  });

  test('el botón de reiniciar cronómetro está deshabilitado si no eres el anfitrión', () => {
    render(<RightSidebar {...baseProps} />);

    act(() => {
      mockSocketService.__trigger('playerJoined', {
        playerId: 'other',
        username: 'Otro',
        players: [],
        hostId: 'other', // getSocketId() del mock devuelve 'me' -> no es anfitrión
      });
    });

    expect(screen.getByRole('button', { name: 'Reiniciar cronómetro' })).toBeDisabled();
  });

  test('el botón de reiniciar cronómetro está habilitado si eres el anfitrión', () => {
    render(<RightSidebar {...baseProps} />);

    act(() => {
      mockSocketService.__trigger('playerJoined', {
        playerId: 'me',
        username: 'Yo',
        players: [],
        hostId: 'me', // coincide con getSocketId()
      });
    });

    expect(screen.getByRole('button', { name: 'Reiniciar cronómetro' })).not.toBeDisabled();
  });

  test('hostChanged actualiza el estado de anfitrión (p.ej. el anfitrión se marcha)', () => {
    render(<RightSidebar {...baseProps} />);

    act(() => {
      mockSocketService.__trigger('playerJoined', { hostId: 'me' });
    });
    expect(screen.getByRole('button', { name: 'Reiniciar cronómetro' })).not.toBeDisabled();

    act(() => {
      mockSocketService.__trigger('hostChanged', { hostId: 'other' });
    });
    expect(screen.getByRole('button', { name: 'Reiniciar cronómetro' })).toBeDisabled();
  });
});
