import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { sound } from '../services/SoundService';
import { Piece } from '../components/GamePiece';
import { Challenge, PiecePosition } from '../components/ChallengeCard';
import { GameGeometry, GameAreaConfig } from '@reto/geometry';
import { ChallengeGenerator } from '../utils/challenges/ChallengeGenerator';
import { ResponsiveCanvas } from '../utils/rendering/ResponsiveCanvas';
import { PieceColors } from '../utils/piece/PieceColors';
import { PiecePositioningAlgorithm, PositioningArea } from '../utils/positioning/PiecePositioningAlgorithm';
import { getLocalVertices } from '@reto/geometry';
import { useTheme } from '../contexts/ThemeContext';
import { ValidationService, ValidationResult } from '@reto/geometry';
import { loadGameProgress, saveGameProgress } from '../utils/progress/gameProgress';
import { computeCampaignNavigation } from '../utils/progress/campaignNavigation';
import { createHistory, pushSnapshot, undoStep, redoStep, HistoryState } from '../utils/progress/undoHistory';
import { CANVAS_CONSTANTS } from '../utils/canvas/CanvasConstants';
import campaignData from '../../../shared/challenges.json';

export const useGameLogic = () => {
  // F21: la paleta (única propiedad de la que dependen los colores de pieza)
  // llega por contexto, no se lee de localStorage aquí.
  const { palette } = useTheme();
  const highContrast = palette === 'high';
  
  // Configuración de geometría del juego
  // Las medidas salen de CANVAS_CONSTANTS y no se repiten aquí: había un 500
  // propio que se quedaba atrás en cuanto se repartía la altura de otra forma,
  // y entonces la lógica y el dibujo discrepaban sobre dónde acaba el tablero.
  const gameAreaConfig: GameAreaConfig = {
    width: CANVAS_CONSTANTS.GAME_AREA_WIDTH,
    height: CANVAS_CONSTANTS.GAME_AREA_HEIGHT,
    mirrorLineX: CANVAS_CONSTANTS.MIRROR_LINE,
    pieceSize: CANVAS_CONSTANTS.PIECE_SIZE
  };

  // Inicializar clases de geometría y generador de challenges
  const geometry = useMemo(() => new GameGeometry(gameAreaConfig), []);
  const challengeGenerator = useMemo(() => new ChallengeGenerator(geometry), [geometry]);
  const piecePositioningAlgorithm = useMemo(() => new PiecePositioningAlgorithm(geometry, gameAreaConfig.pieceSize, 12), [geometry]);

  // Sistema de coordenadas responsive
  const [responsiveCanvas, setResponsiveCanvas] = useState<ResponsiveCanvas | null>(null);

  // Función para inicializar el sistema responsive
  const initializeResponsiveSystem = useCallback((canvasWidth: number, canvasHeight: number) => {
    const newResponsiveCanvas = new ResponsiveCanvas(canvasWidth, canvasHeight);
    setResponsiveCanvas(newResponsiveCanvas);
  }, []);

  // Ref para controlar si ya se están cargando los desafíos
  const isLoadingChallengesRef = useRef(false);

  // Estados del juego
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<Piece | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showInstructions, setShowInstructions] = useState(false); // la ayuda se abre con el botón: no debe robar altura al lienzo
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interactingPieceId, setInteractingPieceId] = useState<number | null>(null);
  const [temporaryDraggedPieceId, setTemporaryDraggedPieceId] = useState<number | null>(null);
  const [animatingPieceId, setAnimatingPieceId] = useState<number | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<Set<number>>(new Set());
  const [bestTimes, setBestTimes] = useState<Record<number, number>>({});
  const [playMode, setPlayMode] = useState<'campaign' | 'free'>('campaign');
  const [sessionRevision, setSessionRevision] = useState(0);
  const sessionSelected = useRef(false);

  const startCollection = (deck: Challenge[], mode: 'campaign' | 'free', index?: number) => {
    sessionSelected.current = true;
    setSessionRevision(revision => revision + 1);
    const progress = loadGameProgress(mode);
    const completed = new Set(deck.flatMap((c, i) => progress.completed.includes(c.id) ? [i] : []));
    const navigation = computeCampaignNavigation(0, completed, deck.length);
    const remembered = deck.findIndex(c => c.id === progress.lastChallenge);
    const requested = index ?? Math.max(0, remembered);
    setPlayMode(mode);
    setChallenges([...deck]);
    setCompletedChallenges(completed);
    setBestTimes(progress.bestTimes);
    setCurrentChallenge(Math.max(0, Math.min(requested, mode === 'free' ? deck.length - 1 : navigation.maxUnlockedChallenge)));
    setHistory(createHistory<Piece[]>());
    setDraggedPiece(null);
    setIsLoading(false);
  };
  const startCampaign = (index?: number) => startCollection([...(campaignData as Challenge[])], 'campaign', index);
  const startFreePlay = (deck: Challenge[], index: number) => startCollection(deck, 'free', index);
  const [showGrid, setShowGrid] = useState(false);

  // F13: pila de deshacer/rehacer sobre `pieces`. La mecánica en sí
  // (empujar, deshacer, rehacer, tope de 10) vive en undoHistory.ts, un
  // módulo puro con su propio test - aquí sólo se conecta al estado React.
  const [history, setHistory] = useState<HistoryState<Piece[]>>(() => createHistory<Piece[]>());

  // Guarda el estado ANTERIOR a una acción discreta. Cualquier acción nueva
  // invalida el rehacer pendiente (semántica estándar de undo/redo).
  const pushHistory = useCallback((snapshot: Piece[]) => {
    setHistory(prev => pushSnapshot(prev, snapshot));
  }, []);

  const undo = () => {
    const result = undoStep(history, pieces);
    if (!result) return;
    setHistory(result.history);
    setPieces(result.value);
  };

  const redo = () => {
    const result = redoStep(history, pieces);
    if (!result) return;
    setHistory(result.history);
    setPieces(result.value);
  };

  // Cambiar de reto vacía la pila: las posiciones de un reto no tienen
  // sentido como deshacer/rehacer en otro.
  useEffect(() => {
    setHistory(createHistory<Piece[]>());
  }, [currentChallenge]);

  // Función para activar efecto de control (llamada desde el componente de controles)
  const setControlEffect = (pieceId: number | null) => {
    setTemporaryDraggedPieceId(pieceId);
  };

  // Función para toggle del grid
  const toggleGrid = () => {
    setShowGrid(prev => !prev);
  };

  // Función helper para animaciones suaves de rotación
  const animateRotation = (pieceId: number, targetRotation: number, skipAnimation: boolean = false) => {
    // Solo activar animación visual si no se está controlando manualmente
    if (!skipAnimation) {
      setAnimatingPieceId(pieceId);
    }

    // Aplicar rotación inmediatamente pero marcar como animando
    setPieces(pieces.map(piece => {
      if (piece.id === pieceId) {
        const rotatedPiece = { ...piece, rotation: targetRotation };

        // Aplicar restricciones inmediatamente
        const constrainedPosition = geometry.constrainPiecePosition(
          pieceToPosition(rotatedPiece),
          1400, 1000, true
        );

        return {
          ...rotatedPiece,
          x: constrainedPosition.x,
          y: constrainedPosition.y
        };
      }
      return piece;
    }));

    // Limpiar animación después de completarse (solo si se activó)
    if (!skipAnimation) {
      setTimeout(() => {
        setAnimatingPieceId(null);
      }, 300); // 300ms de animación
    }
  };

  // Configuración de plantillas de piezas
  const createPieceTemplate = (type: 'A' | 'B', face: 'front' | 'back') => {
    // Use theme-aware colors instead of fixed colors
    const colors = PieceColors.getColorsForFace(face, highContrast);
    return {
      type,
      face,
      centerColor: colors.centerColor,
      triangleColor: colors.triangleColor
    };
  };


  // Función para cargar desafíos desde un archivo personalizado
  const loadCustomChallenges = useCallback(async (file: File) => {
    // Evitar cargar múltiples veces simultáneamente
    if (isLoadingChallengesRef.current) {
      return;
    }

    isLoadingChallengesRef.current = true;
    setIsLoading(true);

    try {

      // Cargar directamente desde el contenido del archivo en lugar de crear un blob URL
      const fileContent = await file.text();

      try {
        // Intentar parsear el JSON
        const customChallenges = JSON.parse(fileContent);

        // Verificar que el contenido tiene el formato esperado
        if (Array.isArray(customChallenges) && customChallenges.length > 0) {
          // Pasar directamente los desafíos al generador
          const loadedChallenges = await challengeGenerator.loadChallengesFromFile(
            // Usar un identificador único para este archivo
            `custom-${file.name}-${Date.now()}`,
            true,
            // Pasar los desafíos ya parseados para evitar otra solicitud fetch
            customChallenges
          );

          if (loadedChallenges.length > 0) {
            startCollection(loadedChallenges, 'free', 0);
          } else {
            console.error('No se pudieron cargar desafíos personalizados válidos');
          }
        } else {
          console.error('El archivo no contiene un array de desafíos válido');
        }
      } catch (parseError) {
        console.error('Error al parsear el archivo JSON:', parseError);
      }
    } catch (error) {
      console.error('Error al cargar desafíos personalizados:', error);
    } finally {
      setIsLoading(false);
      isLoadingChallengesRef.current = false;
    }
  }, [challengeGenerator]);

  // Función para alternar cara de la pieza
  /**
   * Da la vuelta a la pieza, como se le daría a una ficha física.
   *
   * No basta con intercambiar los colores: al voltearla se ve su otra cara, que
   * es la forma ESPEJADA. Por eso cambia también el tipo (A↔B) y se invierte el
   * sentido del giro, que es la misma transformación que aplica el espejo. El
   * centro no se mueve, porque es el ancla de la pieza.
   *
   * Antes sólo cambiaban los colores, así que el juego mostraba una pieza que
   * físicamente no puede existir: la misma forma con las caras invertidas.
   */
  const togglePieceFace = (piece: Piece): Piece => {
    const isBack = piece.face === 'back';
    const newFace = isBack ? 'front' : 'back';

    // Use theme-aware colors for consistency
    const colors = PieceColors.getColorsForFace(newFace, highContrast);
    return {
      ...piece,
      type: piece.type === 'A' ? 'B' : 'A',
      rotation: (360 - (piece.rotation % 360)) % 360,
      face: newFace,
      centerColor: colors.centerColor,
      triangleColor: colors.triangleColor
    };
  };


  const getStorageArea = (): PositioningArea => ({
    x: 0,
    y: CANVAS_CONSTANTS.GAME_AREA_HEIGHT,
    width: CANVAS_CONSTANTS.CANVAS_WIDTH,
    height: CANVAS_CONSTANTS.BOTTOM_AREA_HEIGHT
  });

  const buildPiecesFromPositions = (
    challenge: Challenge,
    positions: Array<{ x: number; y: number; rotation: number }>
  ): Piece[] => {
    return challenge.objective.playerPieces.slice(0, challenge.piecesNeeded).map((targetPiece, index) => {
      const template = createPieceTemplate(targetPiece.type, targetPiece.face);
      const position = positions[index];

      return {
        ...template,
        id: index + 1,
        type: targetPiece.type,
        face: targetPiece.face,
        x: position.x,
        y: position.y,
        rotation: position.rotation,
        placed: false
      };
    });
  };

  // Función para generar piezas automáticamente dentro del área de almacenamiento
  const createChallengeSpecificPieces = (challenge: Challenge): Piece[] => {
    const targetPieces = challenge.objective.playerPieces.slice(0, challenge.piecesNeeded);
    const pieceTypes = targetPieces.map(piece => piece.type);
    const result = piecePositioningAlgorithm.positionPieces(
      challenge.piecesNeeded,
      getStorageArea(),
      pieceTypes,
      12
    );

    if (result.success) {
      return buildPiecesFromPositions(challenge, result.positions);
    }

    console.warn(`Could not auto-position pieces for challenge ${challenge.id}: ${result.error}`);
    const fallbackPositions = targetPieces.map((_, index) => ({
      x: 80 + (index % 4) * 300,
      y: CANVAS_CONSTANTS.GAME_AREA_HEIGHT + 120 + Math.floor(index / 4) * 220,
      rotation: index % 2 === 0 ? 45 : 225
    }));

    return buildPiecesFromPositions(challenge, fallbackPositions);
  };


  // Verificar si un punto está dentro de una pieza.
  // Usa el mismo contorno que dibuja PieceShape (una sola fuente de verdad) y un
  // test de punto-en-polígono por ray casting, en vez de reimplementar la forma
  // a mano con cuatro tests de triángulo que podían desincronizarse del dibujo.
  const isPieceHit = (piece: Piece, x: number, y: number): boolean => {
    // piece.x/y es el centro (y también el pivote de rotación): deshacemos la
    // traslación y la rotación para llevar el punto al sistema local de la pieza.
    const dx = x - piece.x;
    const dy = y - piece.y;
    const rad = (piece.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const localX = dx * cos + dy * sin;
    const localY = -dx * sin + dy * cos;

    // getLocalVertices ya aplica el volteo horizontal de las piezas tipo B.
    const vertices = getLocalVertices(piece.type, gameAreaConfig.pieceSize);

    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const [xi, yi] = vertices[i];
      const [xj, yj] = vertices[j];
      const intersects = (yi > localY) !== (yj > localY) &&
        localX < ((xj - xi) * (localY - yi)) / (yj - yi) + xi;
      if (intersects) inside = !inside;
    }

    return inside;
  };

  // Ref para controlar si ya se han cargado los desafíos iniciales
  const initialChallengesLoadedRef = useRef(false);

  // F03: restaura el progreso guardado (reto en curso, completados, mejores
  // tiempos) una vez que se conoce el array real de retos - hace falta para
  // traducir los IDs persistidos a índices del array cargado.
  const restoreProgress = (loadedChallenges: Challenge[]) => {
    const progress = loadGameProgress();

    const lastIndex = loadedChallenges.findIndex(c => c.id === progress.lastChallenge);

    const completedIndices = new Set(
      progress.completed
        .map(id => loadedChallenges.findIndex(c => c.id === id))
        .filter(index => index >= 0)
    );
    setCompletedChallenges(completedIndices);
    const navigation = computeCampaignNavigation(0, completedIndices, loadedChallenges.length);
    setCurrentChallenge(Math.max(0, Math.min(lastIndex, navigation.maxUnlockedChallenge)));
    setBestTimes(progress.bestTimes);
  };

  // Cargar desafíos al iniciar - solo una vez
  useEffect(() => {
    const loadInitialChallenges = async () => {
      // Si ya se cargaron los desafíos inicialmente, no volver a cargarlos
      if (initialChallengesLoadedRef.current) {
        return;
      }

      // Evitar cargar múltiples veces simultáneamente
      if (isLoadingChallengesRef.current) {
        return;
      }

      isLoadingChallengesRef.current = true;
      setIsLoading(true);

      try {
        // Intentar cargar los desafíos desde el archivo por defecto
        const loadedChallenges = await challengeGenerator.getAvailableChallenges();
        if (sessionSelected.current) return;
        setChallenges(loadedChallenges);
        restoreProgress(loadedChallenges);
        // Marcar que ya se cargaron los desafíos iniciales
        initialChallengesLoadedRef.current = true;
      } catch (error) {
        console.error('Error al cargar los desafíos iniciales:', error);
        // Si falla, usar los desafíos predefinidos
        const fallbackChallenges = challengeGenerator.generateAllChallenges();
        if (sessionSelected.current) return;
        setChallenges(fallbackChallenges);
        restoreProgress(fallbackChallenges);
        // Marcar que ya se cargaron los desafíos iniciales (aunque sean los predefinidos)
        initialChallengesLoadedRef.current = true;
      } finally {
        setIsLoading(false);
        isLoadingChallengesRef.current = false;
      }
    };

    loadInitialChallenges();
  }, []); // Sin dependencias para que solo se ejecute una vez al montar el componente

  // Inicializar piezas según el desafío actual (responsive)
  useEffect(() => {
    if (isLoading) return;

    const challenge = challenges[currentChallenge];
    if (challenge) {
      // Usar siempre el sistema con posiciones fijas corregidas para mejor consistencia
      const newPieces = createChallengeSpecificPieces(challenge);
      setPieces(newPieces);
    }
  }, [currentChallenge, challenges, isLoading]);

  // Update piece colors when the palette changes (without resetting positions).
  // La claridad (light/dark) no afecta a estos colores, así que no hace falta
  // recrearlos cuando sólo cambia ese eje.
  useEffect(() => {
    if (pieces.length > 0) {
      setPieces(prevPieces =>
        prevPieces.map(piece => {
          const colors = PieceColors.getColorsForFace(piece.face, highContrast);
          return {
            ...piece,
            centerColor: colors.centerColor,
            triangleColor: colors.triangleColor
          };
        })
      );
    }
  }, [palette]);

  // Funciones de control - ROTACIÓN EN INCREMENTOS DE 45 GRADOS CON ANIMACIÓN
  const rotatePiece = (pieceId: number, fromControl: boolean = false) => {
    sound.play('turn');
    const piece = pieces.find(p => p.id === pieceId);
    if (!piece) return;

    pushHistory(pieces);

    const targetRotation = (piece.rotation + 45) % 360;
    // Saltar animación visual si viene de control
    const skipAnimation = fromControl || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    animateRotation(pieceId, targetRotation, skipAnimation);

    // Si viene de control, programar limpieza automática
    if (fromControl) {
      setTimeout(() => {
        setTemporaryDraggedPieceId(null);
        // Forzar re-render del canvas modificando el array de piezas
        setPieces(prevPieces => [...prevPieces]);
      }, 150);
    }
  };

  const rotatePieceCounterClockwise = (pieceId: number, fromControl: boolean = false) => {
    sound.play('turn');
    const piece = pieces.find(p => p.id === pieceId);
    if (!piece) return;

    pushHistory(pieces);

    const targetRotation = (piece.rotation - 45 + 360) % 360;
    // Saltar animación visual si viene de control
    const skipAnimation = fromControl || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    animateRotation(pieceId, targetRotation, skipAnimation);

    // Si viene de control, programar limpieza automática
    if (fromControl) {
      setTimeout(() => {
        setTemporaryDraggedPieceId(null);
        // Forzar re-render del canvas modificando el array de piezas
        setPieces(prevPieces => [...prevPieces]);
      }, 150);
    }
  };

  const flipPiece = (pieceId: number, fromControl: boolean = false) => {
    sound.play('reflect');
    pushHistory(pieces);

    setPieces(pieces.map(piece => {
      if (piece.id === pieceId) {
        // Aplicar volteo primero
        const flippedPiece = togglePieceFace(piece);

        // Aplicar restricciones inmediatamente para consistencia
        const constrainedPosition = geometry.constrainPiecePosition(
          pieceToPosition(flippedPiece),
          1400, // Canvas width
          1000, // Canvas height  
          true  // Respetar el espejo
        );

        // Devolver pieza con volteo Y posición restringida
        return {
          ...flippedPiece,
          x: constrainedPosition.x,
          y: constrainedPosition.y
        };
      }
      return piece;
    }));

    // Si viene de control, programar limpieza automática
    if (fromControl) {
      setTimeout(() => {
        setTemporaryDraggedPieceId(null);
        // Forzar re-render del canvas modificando el array de piezas
        setPieces(prevPieces => [...prevPieces]);
      }, 150);
    }
  };

  const resetLevel = () => {
    const challenge = challenges[currentChallenge];
    if (challenge) {
      pushHistory(pieces);
      // Usar siempre el sistema con posiciones fijas corregidas para mejor consistencia
      const newPieces = createChallengeSpecificPieces(challenge);
      setPieces(newPieces);
    }
  };

  // F04 + D2: campaña libre entre los retos ya desbloqueados. Lógica pura en
  // campaignNavigation.ts (con su propio test) para no volver a improvisarla.
  const {
    canGoToPreviousChallenge,
    canGoToNextChallenge,
    isLastChallenge,
    isCampaignComplete
  } = useMemo(
    () => computeCampaignNavigation(currentChallenge, playMode === 'free' ? new Set(challenges.map((_, i) => i)) : completedChallenges, challenges.length),
    [currentChallenge, completedChallenges, challenges, playMode]
  );

  const nextChallenge = () => {
    if (!canGoToNextChallenge) return;
    sound.play('transition');
    setCurrentChallenge(currentChallenge + 1);
  };

  const previousChallenge = () => {
    if (!canGoToPreviousChallenge) return;
    sound.play('transition');
    setCurrentChallenge(currentChallenge - 1);
  };

  // Helper para convertir Piece a PiecePosition
  const pieceToPosition = (piece: Piece): PiecePosition => ({
    type: piece.type,
    face: piece.face,
    x: piece.x,
    y: piece.y,
    rotation: piece.rotation
  });

  // F03: persiste el progreso (reto en curso, retos completados, mejores
  // tiempos) por ID de reto, no por índice - sobrevive a un reordenamiento.
  const persistProgress = (completedIndices: Set<number>, bestTimesById: Record<number, number>, lastChallengeIndex: number) => {
    const completedIds = Array.from(completedIndices)
      .map(index => challenges[index]?.id)
      .filter((id): id is number => id !== undefined);

    const existing = loadGameProgress(playMode);
    saveGameProgress({
      lastChallenge: challenges[lastChallengeIndex]?.id ?? 0,
      completed: [...new Set([...existing.completed, ...completedIds])],
      bestTimes: { ...existing.bestTimes, ...bestTimesById }
    }, playMode);
  };

  /**
   * Comprueba la solución del jugador.
   *
   * Toda la lógica vive en ValidationService: aquí había una segunda copia
   * literal (centroide, emparejamiento, tolerancias) que era la que de verdad
   * usaba el juego, mientras el servicio quedaba sin usar. Una sola copia.
   *
   * `elapsedSeconds` (cronómetro del reto actual) es opcional: si se aporta y
   * mejora el mejor tiempo guardado para este reto, se actualiza (F03).
   */
  const checkSolutionWithMirrors = (elapsedSeconds?: number): ValidationResult => {
    const challenge = challenges[currentChallenge];
    if (!challenge) {
      return { isCorrect: false, message: 'Todavía no hay ningún reto cargado.' };
    }

    const resultado = ValidationService.validateSolution(pieces, challenge, geometry);

    if (resultado.isCorrect) {
      const nextCompleted = new Set(completedChallenges).add(currentChallenge);
      setCompletedChallenges(nextCompleted);

      let nextBestTimes = bestTimes;
      if (elapsedSeconds !== undefined) {
        const currentBest = bestTimes[challenge.id];
        if (currentBest === undefined || elapsedSeconds < currentBest) {
          nextBestTimes = { ...bestTimes, [challenge.id]: elapsedSeconds };
          setBestTimes(nextBestTimes);
        }
      }

      persistProgress(nextCompleted, nextBestTimes, currentChallenge);
    }

    return resultado;
  };


  return {
    playMode,
    sessionRevision,
    startCampaign,
    startFreePlay,
    currentChallenge,
    pieces,
    draggedPiece,
    dragOffset,
    showInstructions,
    challenges,
    isLoading,
    interactingPieceId,
    temporaryDraggedPieceId,
    animatingPieceId,
    showGrid,
    bestTimes,
    setControlEffect,
    setCurrentChallenge,
    setPieces,
    setDraggedPiece,
    setDragOffset,
    setShowInstructions,
    setInteractingPieceId,
    rotatePiece,
    rotatePieceCounterClockwise,
    flipPiece,
    resetLevel,
    nextChallenge,
    previousChallenge,
    canGoToPreviousChallenge,
    canGoToNextChallenge,
    isLastChallenge,
    isCampaignComplete,
    isPieceHit,
    checkSolutionWithMirrors,
    loadCustomChallenges,
    toggleGrid,
    geometry,
    // F13: deshacer/rehacer
    pushHistory,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    // Nuevas funciones responsive
    initializeResponsiveSystem,
    responsiveCanvas
  };
};
