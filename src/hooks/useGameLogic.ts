import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Piece } from '../components/GamePiece';
import { Challenge, PiecePosition } from '../components/ChallengeCard';
import { GameGeometry, GameAreaConfig } from '../utils/geometry/GameGeometry';
import { ChallengeGenerator } from '../utils/challenges/ChallengeGenerator';
import { RelativePiecePositions } from '../utils/geometry/RelativePiecePositions';
import { ResponsiveCanvas } from '../utils/rendering/ResponsiveCanvas';

export const useGameLogic = () => {
  // Configuración de geometría del juego
  const gameAreaConfig: GameAreaConfig = {
    width: 700,
    height: 600,
    mirrorLineX: 700,
    pieceSize: 100
  };

  // Inicializar clases de geometría y generador de challenges
  const geometry = useMemo(() => new GameGeometry(gameAreaConfig), []);
  const challengeGenerator = useMemo(() => new ChallengeGenerator(geometry), [geometry]);
  
  // Sistema de coordenadas responsive
  const [responsiveCanvas, setResponsiveCanvas] = useState<ResponsiveCanvas | null>(null);
  const relativePiecePositions = useMemo(() => new RelativePiecePositions(), []);
  
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
  const [showInstructions, setShowInstructions] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interactingPieceId, setInteractingPieceId] = useState<number | null>(null);
  const [controlActionPieceId, setControlActionPieceId] = useState<number | null>(null);

  // Configuración de plantillas de piezas
  const createPieceTemplate = (type: 'A' | 'B', face: 'front' | 'back') => {
    // Tanto pieza A como B tienen los mismos colores
    // La diferencia está en la geometría (B es reflejo horizontal de A)
    return {
      type,
      face,
      centerColor: face === 'front' ? '#FFD700' : '#FF4444',
      triangleColor: face === 'front' ? '#FF4444' : '#FFD700'
    };
  };

  // Función helper para calcular el reflejo de una pieza usando la clase de geometría
  const calculateMirrorPiece = (piece: PiecePosition): PiecePosition => {
    return geometry.reflectPieceAcrossMirror(piece);
  };

  // Función para cargar desafíos desde un archivo personalizado
  const loadCustomChallenges = useCallback(async (file: File) => {
    // Evitar cargar múltiples veces simultáneamente
    if (isLoadingChallengesRef.current) {
      console.log('Ya se están cargando los desafíos, ignorando solicitud adicional');
      return;
    }

    isLoadingChallengesRef.current = true;
    setIsLoading(true);

    try {
      console.log('Cargando desafíos personalizados desde archivo subido por el usuario');

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
            console.log(`Cargados ${loadedChallenges.length} desafíos personalizados`);
            setChallenges(loadedChallenges);
            setCurrentChallenge(0); // Reiniciar al primer desafío
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
  const togglePieceFace = (piece: Piece): Piece => {
    const isBack = piece.face === 'back';
    return {
      ...piece,
      face: isBack ? 'front' : 'back',
      centerColor: isBack 
        ? (piece.type === 'A' ? '#FFD700' : '#FF4444')
        : piece.triangleColor,
      triangleColor: isBack 
        ? (piece.type === 'A' ? '#FF4444' : '#FFD700')
        : piece.centerColor
    };
  };

  // Nueva función responsive para crear piezas
  const createResponsivePieces = (challenge: Challenge): Piece[] => {
    if (!responsiveCanvas) {
      // Fallback al método legacy si no hay sistema responsive
      return createChallengeSpecificPieces(challenge);
    }

    const initialPieces: Piece[] = [];
    
    // Obtener posiciones relativas y convertirlas a absolutas
    const relativePositions = relativePiecePositions.getPositionsForPieceCount(challenge.piecesNeeded);

    console.log(`📏 Creating ${challenge.piecesNeeded} responsive pieces`);

    relativePositions.forEach((relPos, index) => {
      const pieceType = index % 2 === 0 ? 'A' : 'B'; // Alternar A, B, A, B...
      const template = createPieceTemplate(pieceType, 'front'); // SIEMPRE empezar con cara front
      
      // Convertir coordenadas relativas a absolutas actuales
      const absolutePos = responsiveCanvas.relativeToAbsolute({
        x: relPos.x,
        y: relPos.y
      });
      
      // Debug de conversión
      console.log(`🔍 Converting relative (${relPos.x.toFixed(3)}, ${relPos.y.toFixed(3)}) to absolute (${Math.round(absolutePos.x)}, ${Math.round(absolutePos.y)})`);
      
      const piece = {
        ...template,
        id: index + 1,
        x: absolutePos.x,
        y: absolutePos.y,
        rotation: relPos.rotation,
        placed: false
      };
      
      console.log(`🧩 Responsive piece ${piece.id} (${piece.type}, ${piece.face}) at (${Math.round(piece.x)}, ${Math.round(piece.y)}) R:${piece.rotation}°`);
      initialPieces.push(piece);
    });

    return initialPieces;
  };

  // Función para generar piezas con posiciones fijas que funcionan
  const createChallengeSpecificPieces = (challenge: Challenge): Piece[] => {
    const availableAreaX = 0;
    const availableAreaY = 600; // Inicio del área de piezas disponibles
    const availableAreaWidth = 700;
    const availableAreaHeight = 400; // Altura del área de piezas disponibles
    const pieceSize = 100;
    const margin = 80; // Margen más grande para piezas rotadas

    const initialPieces: Piece[] = [];

    // Las piezas iniciales son genéricas - el usuario las configurará según necesite

    // Posiciones fijas que funcionan sin solapamiento
    const getPositionsForPieceCount = (count: number) => {
      console.log(`📏 Using FIXED positions for ${count} pieces`);
      
      switch (count) {
        case 1:
          return [{ x: -22.790523521002072, y: 890.235148963054, rotation: 315 }];
        case 2:
          return [
            { x: -22.790523521002072, y: 890.235148963054, rotation: 315 },
            { x: 19.908094492477318, y: 901.7378328202477, rotation: 135 }
          ];
        case 3:
          return [
            { x: -22.790523521002072, y: 890.235148963054, rotation: 315 },
            { x: 19.908094492477318, y: 901.7378328202477, rotation: 135 },
            { x: 311.70059227993727, y: 929.4115573520081, rotation: 0 }
          ];
        case 4:
          return [
            { x: -22.790523521002072, y: 890.235148963054, rotation: 315 },
            { x: 19.908094492477318, y: 901.7378328202477, rotation: 135 },
            { x: 311.70059227993727, y: 929.4115573520081, rotation: 0 },
            { x: 619.1306419769896, y: 591.4974267384205, rotation: 315 }
          ];
        default:
          return [{ x: -22.790523521002072, y: 890.235148963054, rotation: 315 }];
      }
    };

    const positions = getPositionsForPieceCount(challenge.piecesNeeded);

    // Crear piezas genéricas con cara front - el usuario las configurará como necesite
    for (let i = 0; i < challenge.piecesNeeded; i++) {
      const pieceType = i % 2 === 0 ? 'A' : 'B'; // Alternar A, B, A, B...
      const template = createPieceTemplate(pieceType, 'front'); // SIEMPRE empezar con cara front
      const position = positions[i];

      const piece = {
        ...template,
        id: i + 1,
        x: position.x,
        y: position.y,
        rotation: position.rotation, // Usar la rotación exacta de la posición
        placed: false // Las piezas empiezan sin colocar, en el área de piezas disponibles
      };
      
      console.log(`🧩 Creating piece ${piece.id} (${piece.type}, ${piece.face}) at (${piece.x}, ${piece.y})`);
      initialPieces.push(piece);
    }

    return initialPieces;
  };

  // Función legacy para mantener compatibilidad
  const createInitialPieces = (piecesCount: number): Piece[] => {
    const currentChallengeData = challenges[currentChallenge];
    if (currentChallengeData) {
      return createChallengeSpecificPieces(currentChallengeData);
    }

    // Fallback al método original si no hay challenge
    const availableAreaX = 0;
    const availableAreaY = 600;
    const availableAreaWidth = 700;
    const pieceSize = 100;
    const marginX = 50;
    const absolutePieceY = 900;
    const spacing = 120;

    const pieceTemplates = [
      createPieceTemplate('A', 'front'),
      createPieceTemplate('B', 'front')
    ];

    const initialPieces: Piece[] = [];
    const positions = [];

    for (let i = 0; i < piecesCount; i++) {
      const x = availableAreaX + marginX + (i * spacing);
      const y = absolutePieceY;
      positions.push({ x: Math.min(x, availableAreaWidth - pieceSize), y });
    }

    for (let i = 0; i < piecesCount; i++) {
      const templateIndex = i % 2;
      const position = positions[i];

      initialPieces.push({
        ...pieceTemplates[templateIndex],
        id: i + 1,
        x: position.x,
        y: position.y,
        rotation: 0,
        placed: false
      });
    }

    return initialPieces;
  };

  // Verificar si un punto está dentro de una pieza
  const isPieceHit = (piece: Piece, x: number, y: number): boolean => {
    const size = 100; // Tamaño base de la pieza (25% más grande)
    const unit = size * 1.28; // Factor de escala

    // La pieza se dibuja con translate(x + size/2, y + size/2) y luego rotate
    // Necesitamos hacer la transformación inversa
    const pieceDrawCenterX = piece.x + size/2;
    const pieceDrawCenterY = piece.y + size/2;

    // Traducir el punto al origen de la pieza
    let translatedX = x - pieceDrawCenterX;
    const translatedY = y - pieceDrawCenterY;

    // Rotar en sentido contrario para "desrotar" el punto
    const rad = (-piece.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rotatedX = translatedX * cos - translatedY * sin;
    const rotatedY = translatedX * sin + translatedY * cos;

    // Si es pieza tipo B, compensar el volteo horizontal que se aplica en el dibujo
    let finalRotatedX = rotatedX;
    if (piece.type === 'B') {
      finalRotatedX = -rotatedX;
    }

    // Convertir a coordenadas unitarias de la pieza (el sistema coord(x,y))
    const unitX = finalRotatedX / unit;
    const unitY = -rotatedY / unit; // Invertir Y porque el canvas Y+ es hacia abajo

    // Función para verificar si un punto está dentro de un triángulo
    const isPointInTriangle = (px: number, py: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): boolean => {
      const denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
      const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denom;
      const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denom;
      const c = 1 - a - b;
      return a >= 0 && b >= 0 && c >= 0;
    };

    // Verificar si está en el cuadrado central (1,0), (2,0), (2,1), (1,1)
    const inSquare = unitX >= 1 && unitX <= 2 && unitY >= 0 && unitY <= 1;

    // Verificar si está en el triángulo izquierdo (0,0), (1,0), (1,1)
    const inLeftTriangle = isPointInTriangle(unitX, unitY, 0, 0, 1, 0, 1, 1);

    // Verificar si está en el triángulo superior (1,1), (2,1), (1.5,1.5)
    const inTopTriangle = isPointInTriangle(unitX, unitY, 1, 1, 2, 1, 1.5, 1.5);

    // Verificar si está en el triángulo derecho (2,0), (2,1), (2.5,0.5)
    const inRightTriangle = isPointInTriangle(unitX, unitY, 2, 0, 2, 1, 2.5, 0.5);

    return inSquare || inLeftTriangle || inTopTriangle || inRightTriangle;
  };

  // Ref para controlar si ya se han cargado los desafíos iniciales
  const initialChallengesLoadedRef = useRef(false);

  // Cargar desafíos al iniciar - solo una vez
  useEffect(() => {
    const loadInitialChallenges = async () => {
      // Si ya se cargaron los desafíos inicialmente, no volver a cargarlos
      if (initialChallengesLoadedRef.current) {
        console.log('Los desafíos ya fueron cargados inicialmente, no se volverán a cargar');
        return;
      }

      // Evitar cargar múltiples veces simultáneamente
      if (isLoadingChallengesRef.current) {
        console.log('Ya se están cargando los desafíos, ignorando solicitud adicional');
        return;
      }

      isLoadingChallengesRef.current = true;
      setIsLoading(true);

      try {
        // Intentar cargar los desafíos desde el archivo por defecto
        const loadedChallenges = await challengeGenerator.getAvailableChallenges();
        setChallenges(loadedChallenges);
        // Marcar que ya se cargaron los desafíos iniciales
        initialChallengesLoadedRef.current = true;
      } catch (error) {
        console.error('Error al cargar los desafíos iniciales:', error);
        // Si falla, usar los desafíos predefinidos
        setChallenges(challengeGenerator.generateAllChallenges());
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
      console.log('🔄 Setting pieces for challenge:', challenge.id, 'pieces count:', newPieces.length);
      setPieces(newPieces);
    }
  }, [currentChallenge, challenges, isLoading, responsiveCanvas]);

  // Funciones de control - ROTACIÓN EN INCREMENTOS DE 45 GRADOS
  const rotatePiece = (pieceId: number) => {
    setPieces(pieces.map(piece =>
        piece.id === pieceId
            ? { ...piece, rotation: (piece.rotation + 45) % 360 }
            : piece
    ));
    
    // Mostrar el número temporalmente
    setControlActionPieceId(pieceId);
    setTimeout(() => setControlActionPieceId(null), 1000); // Desaparecer después de 1 segundo
  };

  const rotatePieceCounterClockwise = (pieceId: number) => {
    setPieces(pieces.map(piece =>
        piece.id === pieceId
            ? { ...piece, rotation: (piece.rotation - 45 + 360) % 360 }
            : piece
    ));
    
    // Mostrar el número temporalmente
    setControlActionPieceId(pieceId);
    setTimeout(() => setControlActionPieceId(null), 1000);
  };

  const flipPiece = (pieceId: number) => {
    setPieces(pieces.map(piece =>
        piece.id === pieceId
            ? togglePieceFace(piece)
            : piece
    ));
    
    // Mostrar el número temporalmente
    setControlActionPieceId(pieceId);
    setTimeout(() => setControlActionPieceId(null), 1000);
  };

  const resetLevel = () => {
    const challenge = challenges[currentChallenge];
    if (challenge) {
      // Usar siempre el sistema con posiciones fijas corregidas para mejor consistencia
      const newPieces = createChallengeSpecificPieces(challenge);
      console.log('🔄 Setting pieces for challenge:', challenge.id, 'pieces count:', newPieces.length);
      setPieces(newPieces);
    }
  };

  const nextChallenge = () => {
    setCurrentChallenge((currentChallenge + 1) % challenges.length);
  };

  // Helper para convertir Piece a PiecePosition
  const pieceToPosition = (piece: Piece): PiecePosition => ({
    type: piece.type,
    face: piece.face,
    x: piece.x,
    y: piece.y,
    rotation: piece.rotation
  });

  // Función helper para crear las piezas reflejadas actuales
  const getCurrentMirrorPieces = (): PiecePosition[] => {
    const placedPieces = pieces.filter(piece => piece.placed && piece.y < 600);
    return placedPieces.map(piece => calculateMirrorPiece(pieceToPosition(piece)));
  };

  // Función helper simplificada - solo verifica tipo, cara y rotación (no posición específica)
  const isPieceMatch = (piece1: PiecePosition, piece2: PiecePosition, rotationTolerance: number = 45): boolean => {
    const typeMatch = piece1.type === piece2.type;
    const faceMatch = piece1.face === piece2.face;

    const rotationDiff = Math.abs(piece1.rotation - piece2.rotation);
    const normalizedRotationDiff = Math.min(rotationDiff, 360 - rotationDiff);
    const rotationMatch = normalizedRotationDiff <= rotationTolerance;

    return typeMatch && faceMatch && rotationMatch;
  };

  // Función para obtener el patrón simétrico actual
  const getCurrentSymmetricPattern = (): PiecePosition[] => {
    const placedPieces = pieces.filter(piece => piece.placed && piece.y < 600).map(pieceToPosition);
    const mirrorPieces = getCurrentMirrorPieces();
    return [...placedPieces, ...mirrorPieces];
  };

  // Función de verificación de solución con espejos
  const checkSolutionWithMirrors = (): { isCorrect: boolean; message: string } => {
    const challenge = challenges[currentChallenge];
    const placedPieces = pieces.filter(piece => piece.placed && piece.y < 600).map(pieceToPosition);

    // Verificar si se han colocado todas las piezas necesarias
    if (placedPieces.length !== challenge.piecesNeeded) {
      return {
        isCorrect: false,
        message: `Necesitas colocar ${challenge.piecesNeeded} piezas. Has colocado ${placedPieces.length}.`
      };
    }

    // Si no hay piezas colocadas, definitivamente no está resuelto
    if (placedPieces.length === 0) {
      return {
        isCorrect: false,
        message: "Debes colocar piezas en el área de juego para resolver el desafío."
      };
    }

    // Verificar que las piezas estén conectadas
    const validation = geometry.validateChallengeCard(placedPieces);
    if (!validation.piecesConnected) {
      return {
        isCorrect: false,
        message: "Las piezas deben estar conectadas entre sí."
      };
    }

    if (!validation.touchesMirror) {
      return {
        isCorrect: false,
        message: "Al menos una pieza debe tocar el espejo."
      };
    }

    // Verificar si las piezas colocadas coinciden con los tipos, caras Y posiciones requeridas
    const targetPieces = challenge.objective.playerPieces;
    
    // Para cada pieza objetivo, verificar que haya una pieza colocada que coincida
    const tolerance = 50; // Tolerancia de posición en píxeles
    const rotationTolerance = 45; // Tolerancia de rotación en grados
    
    for (const targetPiece of targetPieces) {
      const matchingPiece = placedPieces.find(placedPiece => {
        const typeMatch = placedPiece.type === targetPiece.type;
        const faceMatch = placedPiece.face === targetPiece.face;
        
        const xDiff = Math.abs(placedPiece.x - targetPiece.x);
        const yDiff = Math.abs(placedPiece.y - targetPiece.y);
        const positionMatch = xDiff <= tolerance && yDiff <= tolerance;
        
        const rotationDiff = Math.abs(placedPiece.rotation - targetPiece.rotation);
        const normalizedRotationDiff = Math.min(rotationDiff, 360 - rotationDiff);
        const rotationMatch = normalizedRotationDiff <= rotationTolerance;
        
        return typeMatch && faceMatch && positionMatch && rotationMatch;
      });
      
      if (!matchingPiece) {
        return {
          isCorrect: false,
          message: `Falta una pieza de tipo ${targetPiece.type} cara ${targetPiece.face} en la posición correcta.`
        };
      }
    }

    return {
      isCorrect: true,
      message: "¡Excelente! Has completado el desafío correctamente."
    };
  };

  return {
    currentChallenge,
    pieces,
    draggedPiece,
    dragOffset,
    showInstructions,
    challenges,
    isLoading,
    interactingPieceId,
    controlActionPieceId,
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
    isPieceHit,
    checkSolutionWithMirrors,
    loadCustomChallenges,
    geometry,
    // Nuevas funciones responsive
    initializeResponsiveSystem,
    responsiveCanvas
  };
};
