import { useState, useEffect } from 'react';
import { Piece } from '../components/GamePiece';
import { Challenge, PiecePosition, ObjectivePattern } from '../components/ChallengeCard';
import { GameGeometry, GameAreaConfig } from '../utils/GameGeometry.ts';
import { ChallengeGenerator } from '../utils/ChallengeGenerator.ts';

export const useGameLogic = () => {
  // Configuración de geometría del juego
  const gameAreaConfig: GameAreaConfig = {
    width: 700,
    height: 600,
    mirrorLineX: 700,
    pieceSize: 100
  };

  // Inicializar clases de geometría y generador de challenges
  const geometry = new GameGeometry(gameAreaConfig);
  const challengeGenerator = new ChallengeGenerator(geometry);

  // Estados del juego
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<Piece | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showInstructions, setShowInstructions] = useState(true);

  // Configuración de plantillas de piezas
  const createPieceTemplate = (type: 'A' | 'B', face: 'front' | 'back') => {
    if (type === 'A') {
      return {
        type,
        face,
        centerColor: face === 'front' ? '#FFD700' : '#FF4444',
        triangleColor: face === 'front' ? '#FF4444' : '#FFD700'
      };
    } else {
      return {
        type,
        face,
        centerColor: face === 'front' ? '#FF4444' : '#FFD700',
        triangleColor: face === 'front' ? '#FFD700' : '#FF4444'
      };
    }
  };

  // Función helper para calcular el reflejo de una pieza usando la clase de geometría
  const calculateMirrorPiece = (piece: PiecePosition): PiecePosition => {
    return geometry.reflectPieceAcrossMirror(piece);
  };

  // Generar challenges usando el generador
  const challenges: Challenge[] = challengeGenerator.generateAllChallenges();

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

  // Función para generar piezas basándose en lo que necesita el challenge específico
  const createChallengeSpecificPieces = (challenge: Challenge): Piece[] => {
    const availableAreaX = 0;
    const availableAreaY = 600;
    const availableAreaWidth = 700;
    const pieceSize = 100;
    const marginX = 50;
    const absolutePieceY = 900;
    const spacing = 120;

    const initialPieces: Piece[] = [];

    // Extraer los tipos de piezas requeridos del challenge
    const requiredPieceTypes = challenge.objective.playerPieces.map(piece => ({
      type: piece.type,
      face: piece.face
    }));

    // Posiciones iniciales para diferentes cantidades de piezas
    const getPositionsForPieceCount = (count: number) => {
      switch (count) {
        case 1:
          return [{ x: availableAreaX + availableAreaWidth / 2 - pieceSize / 2, y: absolutePieceY }];
        case 2:
          return [
            { x: availableAreaX + availableAreaWidth / 3 - pieceSize / 2, y: absolutePieceY },
            { x: availableAreaX + 2 * availableAreaWidth / 3 - pieceSize / 2, y: absolutePieceY }
          ];
        case 3:
          return [
            { x: availableAreaX + availableAreaWidth / 4 - pieceSize / 2, y: absolutePieceY },
            { x: availableAreaX + availableAreaWidth / 2 - pieceSize / 2, y: absolutePieceY },
            { x: availableAreaX + 3 * availableAreaWidth / 4 - pieceSize / 2, y: absolutePieceY }
          ];
        case 4:
          return [
            { x: availableAreaX + availableAreaWidth / 5 - pieceSize / 2, y: absolutePieceY },
            { x: availableAreaX + 2 * availableAreaWidth / 5 - pieceSize / 2, y: absolutePieceY },
            { x: availableAreaX + 3 * availableAreaWidth / 5 - pieceSize / 2, y: absolutePieceY },
            { x: availableAreaX + 4 * availableAreaWidth / 5 - pieceSize / 2, y: absolutePieceY }
          ];
        default:
          // Para más de 4 piezas, distribuir uniformemente
          const positions = [];
          for (let i = 0; i < count; i++) {
            const x = availableAreaX + marginX + (i * spacing);
            const y = absolutePieceY;
            positions.push({ x: Math.min(x, availableAreaWidth - pieceSize), y });
          }
          return positions;
      }
    };

    const positions = getPositionsForPieceCount(challenge.piecesNeeded);

    // Crear las piezas según los tipos requeridos por el challenge
    for (let i = 0; i < challenge.piecesNeeded; i++) {
      const requiredType = requiredPieceTypes[i] || requiredPieceTypes[0]; // Fallback al primer tipo
      const template = createPieceTemplate(requiredType.type, requiredType.face);
      const position = positions[i];

      initialPieces.push({
        ...template,
        id: i + 1,
        x: position.x,
        y: position.y,
        rotation: 0,
        placed: false
      });
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

  // Inicializar piezas según el desafío actual
  useEffect(() => {
    const challenge = challenges[currentChallenge];
    if (challenge) {
      setPieces(createChallengeSpecificPieces(challenge));
    }
  }, [currentChallenge]);

  // Funciones de control - ROTACIÓN EN INCREMENTOS DE 45 GRADOS
  const rotatePiece = (pieceId: number) => {
    setPieces(pieces.map(piece =>
        piece.id === pieceId
            ? { ...piece, rotation: (piece.rotation + 45) % 360 }
            : piece
    ));
  };

  const rotatePieceCounterClockwise = (pieceId: number) => {
    setPieces(pieces.map(piece =>
        piece.id === pieceId
            ? { ...piece, rotation: (piece.rotation - 45 + 360) % 360 }
            : piece
    ));
  };

  const flipPiece = (pieceId: number) => {
    setPieces(pieces.map(piece =>
        piece.id === pieceId
            ? togglePieceFace(piece)
            : piece
    ));
  };

  const resetLevel = () => {
    const challenge = challenges[currentChallenge];
    if (challenge) {
      setPieces(createChallengeSpecificPieces(challenge));
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

    // Verificar si las piezas colocadas coinciden con los tipos requeridos
    const targetPieces = challenge.objective.playerPieces;
    const requiredPieceTypes = targetPieces.map(p => ({ type: p.type, face: p.face }));
    const placedPieceTypes = placedPieces.map(p => ({ type: p.type, face: p.face }));

    // Verificar que tengamos todos los tipos requeridos
    for (const requiredType of requiredPieceTypes) {
      const hasMatchingPiece = placedPieceTypes.some(placedType => 
        placedType.type === requiredType.type && placedType.face === requiredType.face
      );
      
      if (!hasMatchingPiece) {
        return {
          isCorrect: false,
          message: `Falta una pieza de tipo ${requiredType.type} cara ${requiredType.face}.`
        };
      }
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
    setPieces,
    setDraggedPiece,
    setDragOffset,
    setShowInstructions,
    rotatePiece,
    rotatePieceCounterClockwise,
    flipPiece,
    resetLevel,
    nextChallenge,
    isPieceHit,
    checkSolutionWithMirrors,
    geometry,
  };
};