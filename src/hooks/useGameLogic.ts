import { useState, useEffect } from 'react';
import { Piece } from '../components/GamePiece';
import { Challenge, PiecePosition, ObjectivePattern } from '../components/ChallengeCard';

export const useGameLogic = () => {
  // Estados del juego
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<Piece | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showInstructions, setShowInstructions] = useState(true);

  // Configuración de piezas
  const pieceTemplates = [
    {
      id: 1,
      type: 'A' as const,
      face: 'front' as const,
      centerColor: '#FFD700',
      triangleColor: '#FF4444'
    },
    {
      id: 2,
      type: 'B' as const,
      face: 'front' as const,
      centerColor: '#FF4444',
      triangleColor: '#FFD700'
    }
  ];

  // Función helper para calcular el reflejo de una pieza
  // Espejo horizontal simple: solo cambia posición X, mantiene rotación y colores
  const calculateMirrorPiece = (piece: PiecePosition, mirrorLine: number = 700): PiecePosition => {
    const reflectedX = 2 * mirrorLine - piece.x - 80; // 80 es PIECE_SIZE
    return {
      ...piece,
      x: reflectedX
      // Mantener rotation y face iguales para espejo horizontal simple
    };
  };

  // Función helper para crear objetivos con patrón simétrico completo
  const createSymmetricObjective = (playerPieces: PiecePosition[]): ObjectivePattern => {
    const mirrorPieces = playerPieces.map(piece => calculateMirrorPiece(piece));
    return {
      playerPieces,
      symmetricPattern: [...playerPieces, ...mirrorPieces]
    };
  };

  // Desafíos auténticos basados en el juego original de Educa
  const challenges: Challenge[] = [
    {
      id: 1,
      name: "Tarjeta 1: Corazón Simple",
      description: "Forma un corazón con una pieza A rotada 270° pegada al espejo",
      piecesNeeded: 1,
      difficulty: "Principiante",
      targetPattern: "heart_simple",
      objective: createSymmetricObjective([
        { type: 'A', face: 'front', x: 620, y: 280, rotation: 270 }
      ]),
      targetPieces: [
        { type: 'A', face: 'front', x: 620, y: 280, rotation: 270 }
      ]
    },
    {
      id: 2,
      name: "Tarjeta 2: Figura Simétrica",
      description: "Patrón simétrico usando una pieza A y una pieza B",
      piecesNeeded: 2,
      difficulty: "Fácil",
      targetPattern: "symmetric_pattern",
      objective: createSymmetricObjective([
        { type: 'A', face: 'front', x: 580, y: 260, rotation: 0 },
        { type: 'B', face: 'front', x: 580, y: 340, rotation: 180 }
      ]),
      targetPieces: [
        { type: 'A', face: 'front', x: 580, y: 260, rotation: 0 },
        { type: 'B', face: 'front', x: 580, y: 340, rotation: 180 }
      ]
    },
    {
      id: 3,
      name: "Tarjeta 3: Flor de Pétalos",
      description: "Flor simétrica de cuatro pétalos con rotaciones específicas",
      piecesNeeded: 2,
      difficulty: "Fácil",
      targetPattern: "flower_petals",
      objective: createSymmetricObjective([
        { type: 'A', face: 'back', x: 620, y: 150, rotation: 30 },
        { type: 'A', face: 'back', x: 620, y: 250, rotation: 330 }
      ]),
      targetPieces: [
        { type: 'A', face: 'back', x: 620, y: 150, rotation: 30 },
        { type: 'A', face: 'back', x: 620, y: 250, rotation: 330 }
      ]
    },
    {
      id: 4,
      name: "Tarjeta 4: Casa con Tejado",
      description: "Casa simétrica con tejado triangular usando tres piezas",
      piecesNeeded: 3,
      difficulty: "Intermedio",
      targetPattern: "house_roof",
      objective: createSymmetricObjective([
        { type: 'B', face: 'front', x: 620, y: 120, rotation: 0 },
        { type: 'A', face: 'front', x: 590, y: 200, rotation: 0 },
        { type: 'A', face: 'front', x: 590, y: 280, rotation: 0 }
      ]),
      targetPieces: [
        { type: 'B', face: 'front', x: 620, y: 120, rotation: 0 },
        { type: 'A', face: 'front', x: 590, y: 200, rotation: 0 },
        { type: 'A', face: 'front', x: 590, y: 280, rotation: 0 }
      ]
    },
    {
      id: 5,
      name: "Tarjeta 5: Corona Real",
      description: "Corona simétrica con picos decorativos usando múltiples rotaciones",
      piecesNeeded: 3,
      difficulty: "Intermedio",
      targetPattern: "crown_royal",
      objective: createSymmetricObjective([
        { type: 'A', face: 'back', x: 620, y: 140, rotation: 0 },
        { type: 'B', face: 'front', x: 560, y: 200, rotation: 60 },
        { type: 'B', face: 'front', x: 560, y: 260, rotation: 300 }
      ]),
      targetPieces: [
        { type: 'A', face: 'back', x: 620, y: 140, rotation: 0 },
        { type: 'B', face: 'front', x: 560, y: 200, rotation: 60 },
        { type: 'B', face: 'front', x: 560, y: 260, rotation: 300 }
      ]
    },
    {
      id: 6,
      name: "Tarjeta 6: Estrella Cuádruple",
      description: "Estrella de cuatro puntas perfecta usando las 4 piezas",
      piecesNeeded: 4,
      difficulty: "Difícil",
      targetPattern: "star_quad",
      objective: createSymmetricObjective([
        { type: 'A', face: 'front', x: 620, y: 100, rotation: 0 },
        { type: 'B', face: 'back', x: 680, y: 200, rotation: 90 },
        { type: 'A', face: 'back', x: 620, y: 300, rotation: 180 },
        { type: 'B', face: 'front', x: 560, y: 200, rotation: 270 }
      ]),
      targetPieces: [
        { type: 'A', face: 'front', x: 620, y: 100, rotation: 0 },
        { type: 'B', face: 'back', x: 680, y: 200, rotation: 90 },
        { type: 'A', face: 'back', x: 620, y: 300, rotation: 180 },
        { type: 'B', face: 'front', x: 560, y: 200, rotation: 270 }
      ]
    }
  ];

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

  // Función helper para crear piezas iniciales - evita duplicación de código
  const createInitialPieces = (piecesCount: number): Piece[] => {
    const availableAreaX = 0;
    const availableAreaY = 600;
    const availableAreaWidth = 700;
    const availableAreaHeight = 400;
    const pieceSize = 80;
    const marginX = 50;
    const absolutePieceY = 900;
    const spacing = 120;
    const usableWidth = availableAreaWidth - (2 * marginX);
    const piecesPerRow = Math.floor(usableWidth / (pieceSize + spacing));

    const initialPieces: Piece[] = [];
    for (let i = 0; i < piecesCount; i++) {
      const templateIndex = i % 2;
      const row = Math.floor(i / piecesPerRow);
      const col = i % piecesPerRow;

      const pieceX = availableAreaX + marginX + col * (pieceSize + spacing);
      const pieceY = absolutePieceY + row * (pieceSize + spacing);

      const maxX = availableAreaX + availableAreaWidth - pieceSize - marginX;
      const maxY = availableAreaY + availableAreaHeight - pieceSize;

      const finalX = Math.min(pieceX, maxX);
      const finalY = Math.min(pieceY, maxY);

      initialPieces.push({
        ...pieceTemplates[templateIndex],
        id: i + 1,
        x: finalX,
        y: finalY,
        rotation: 0,
        placed: false
      });
    }

    return initialPieces;
  };

  // Verificar si un punto está dentro de una pieza
  const isPieceHit = (piece: Piece, x: number, y: number): boolean => {
    const size = 80; // Tamaño base de la pieza
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
    setPieces(createInitialPieces(challenge.piecesNeeded));
  }, [currentChallenge]);

  // Funciones de control - ROTACIÓN EN INCREMENTOS DE 45 GRADOS
  const rotatePiece = (pieceId: number) => {
    setPieces(pieces.map(piece =>
        piece.id === pieceId
            ? { ...piece, rotation: (piece.rotation + 45) % 360 } // CAMBIO: 90° → 45°
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
    setPieces(createInitialPieces(challenge.piecesNeeded));
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
    const placedPieces = pieces.filter(piece => piece.placed && piece.y < 600); // Solo piezas en área de juego
    return placedPieces.map(piece => calculateMirrorPiece(pieceToPosition(piece)));
  };

  // Función helper para verificar si una pieza coincide con el objetivo
  const isPieceMatch = (piece1: PiecePosition, piece2: PiecePosition, positionTolerance: number = 40, rotationTolerance: number = 30): boolean => {
    // Verificar tipo y cara
    const typeMatch = piece1.type === piece2.type;
    const faceMatch = piece1.face === piece2.face;

    // Verificar posición con tolerancia (aumentada para ser más permisiva)
    // Usamos una tolerancia mucho mayor para la coordenada Y (vertical) ya que la posición vertical
    // no debería importar tanto mientras la silueta sea la misma
    const xPositionMatch = Math.abs(piece1.x - piece2.x) <= positionTolerance;
    const yPositionMatch = Math.abs(piece1.y - piece2.y) <= 200; // Tolerancia mucho mayor para la posición vertical
    const positionMatch = xPositionMatch && yPositionMatch;

    // Verificar rotación con tolerancia (considerando que 360° = 0°)
    const rotationDiff = Math.abs(piece1.rotation - piece2.rotation);
    const normalizedRotationDiff = Math.min(rotationDiff, 360 - rotationDiff);
    const rotationMatch = normalizedRotationDiff <= rotationTolerance;


    return typeMatch && faceMatch && positionMatch && rotationMatch;
  };

  // Función para obtener el patrón simétrico actual (piezas colocadas + sus reflejos)
  const getCurrentSymmetricPattern = (): PiecePosition[] => {
    const placedPieces = pieces.filter(piece => piece.placed && piece.y < 600); // Solo piezas en área de juego
    const placedPiecePositions = placedPieces.map(pieceToPosition);
    return [...placedPiecePositions, ...getCurrentMirrorPieces()];
  };

  // Función para comparar SOLO las piezas del jugador (el reflejo es automático)
  const checkSolutionWithMirrors = (): boolean => {
    const challenge = challenges[currentChallenge];
    const placedPieces = pieces.filter(piece => piece.placed && piece.y < 600); // Solo piezas en área de juego

    // Convertir piezas colocadas a formato PiecePosition
    const placedPiecePositions = placedPieces.map(pieceToPosition);

    // Verificar que el número de piezas colocadas coincida con las piezas objetivo del jugador
    if (placedPiecePositions.length !== challenge.objective.playerPieces.length) {
      return false;
    }

    // Verificar que cada pieza objetivo tenga una pieza colocada que coincida
    // y que cada pieza colocada tenga una pieza objetivo que coincida
    const targetMatched = challenge.objective.playerPieces.every(targetPiece => 
      placedPiecePositions.some(placedPiece => isPieceMatch(placedPiece, targetPiece))
    );

    const placedMatched = placedPiecePositions.every(placedPiece => 
      challenge.objective.playerPieces.some(targetPiece => isPieceMatch(placedPiece, targetPiece))
    );

    return targetMatched && placedMatched;
  };

  // Función legacy para compatibilidad con el sistema anterior
  const checkSolution = (): boolean => {
    const challenge = challenges[currentChallenge];
    const placedPieces = pieces.filter(piece => piece.placed && piece.y < 600); // Solo piezas en área de juego

    // Verificar que el número de piezas colocadas coincida
    if (placedPieces.length !== challenge.targetPieces.length) {
      return false;
    }

    // Convertir piezas colocadas a formato PiecePosition para usar isPieceMatch
    const placedPiecePositions = placedPieces.map(pieceToPosition);

    // Para cada pieza objetivo, buscar una pieza colocada que coincida
    return challenge.targetPieces.every(targetPiece => 
      placedPiecePositions.some(placedPiece => isPieceMatch(placedPiece, targetPiece))
    );
  };

  // Crear piezas objetivo para visualización
  const getTargetPiecesForDisplay = (): Piece[] => {
    const challenge = challenges[currentChallenge];
    return challenge.targetPieces.map((targetPiece, index) => {
      const template = pieceTemplates.find(t => t.type === targetPiece.type) || pieceTemplates[0];

      let centerColor = template.centerColor;
      let triangleColor = template.triangleColor;

      // Si la cara está volteada, intercambiar colores
      if (targetPiece.face === 'back') {
        centerColor = template.triangleColor;
        triangleColor = template.centerColor;
      }

      return {
        id: 1000 + index, // IDs únicos para evitar conflictos
        type: targetPiece.type,
        face: targetPiece.face,
        centerColor,
        triangleColor,
        x: targetPiece.x + 700, // Mover al área de objetivo (lado derecho)
        y: targetPiece.y + 700, // Mover al área de objetivo (parte inferior)
        rotation: targetPiece.rotation,
        placed: true
      };
    });
  };

  return {
    // Estados
    currentChallenge,
    pieces,
    draggedPiece,
    dragOffset,
    showInstructions,
    challenges,
    // Setters
    setPieces,
    setDraggedPiece,
    setDragOffset,
    setShowInstructions,
    // Funciones
    rotatePiece,
    flipPiece,
    resetLevel,
    nextChallenge,
    isPieceHit,
    checkSolution,
    checkSolutionWithMirrors,
    getTargetPiecesForDisplay,
    // Funciones helper para objetivos
    getCurrentMirrorPieces,
    getCurrentSymmetricPattern,
    calculateMirrorPiece,
  };
};
