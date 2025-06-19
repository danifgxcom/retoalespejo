import { useState, useEffect } from 'react';
import { Piece } from '../components/GamePiece';
import { Challenge } from '../components/ChallengeCard';

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

  // Desafíos basados en las tarjetas-reto reales
  const challenges: Challenge[] = [
    {
      id: 1,
      name: "Corazón Reto 1",
      description: "Rectángulo amarillo central con triángulos rojos",
      piecesNeeded: 2,
      difficulty: "Fácil",
      targetPattern: "heart1"
    },
    {
      id: 2,
      name: "Corazón Reto 2", 
      description: "Patrón de rombos rojos sobre fondo amarillo",
      piecesNeeded: 2,
      difficulty: "Fácil",
      targetPattern: "heart2"
    },
    {
      id: 3,
      name: "Patrón Complejo 1",
      description: "Combina ambos tipos de piezas",
      piecesNeeded: 4,
      difficulty: "Difícil",
      targetPattern: "complex1"
    },
    {
      id: 4,
      name: "Patrón Complejo 2",
      description: "Desafío avanzado de simetría",
      piecesNeeded: 4,
      difficulty: "Difícil", 
      targetPattern: "complex2"
    }
  ];

  // Función para alternar cara de la pieza
  const togglePieceFace = (piece: Piece): Piece => {
    if (piece.face === 'front') {
      return {
        ...piece,
        face: 'back',
        centerColor: piece.triangleColor,
        triangleColor: piece.centerColor
      };
    } else {
      return {
        ...piece,
        face: 'front',
        centerColor: piece.type === 'A' ? '#FFD700' : '#FF4444',
        triangleColor: piece.type === 'A' ? '#FF4444' : '#FFD700'
      };
    }
  };

  // Verificar si un punto está dentro de una pieza
  const isPieceHit = (piece: Piece, x: number, y: number): boolean => {
    // Usar el mismo tamaño conservador para consistencia
    const conservativeSize = 200;

    console.log('Checking hit:', { 
      pieceX: piece.x, 
      pieceY: piece.y, 
      clickX: x, 
      clickY: y, 
      conservativeSize,
      rotation: piece.rotation
    });

    const hit = x >= piece.x && x <= piece.x + conservativeSize && 
                y >= piece.y && y <= piece.y + conservativeSize;

    console.log('Hit result:', hit);
    return hit;
  };

  // Inicializar piezas según el desafío actual
  useEffect(() => {
    const challenge = challenges[currentChallenge];
    const piecesCount = challenge.piecesNeeded;
    const baseSize = 80 * 1.28; // 102.4px
    const maxPieceWidth = 2.5 * baseSize; // Ancho máximo de la pieza ≈ 256px
    const maxPieceHeight = 1.5 * baseSize; // Alto máximo de la pieza ≈ 153px

    const initialPieces: Piece[] = [];
    for (let i = 0; i < piecesCount; i++) {
      const templateIndex = i % 2;
      // Calcular posición para que las piezas estén dentro del área de "Piezas disponibles"
      // El área de piezas disponibles es de 0 a 700 en X, y de 350 a 600 en Y
      const pieceX = 50 + (i % 3) * 200; // Distribuir horizontalmente, máximo 3 piezas por fila
      const pieceY = 420 + Math.floor(i / 3) * 120; // Nueva fila cada 3 piezas, empezar en y=420
      initialPieces.push({
        ...pieceTemplates[templateIndex],
        id: i + 1,
        x: pieceX,
        y: pieceY,
        rotation: 0,
        placed: false
      });
    }

    setPieces(initialPieces);
  }, [currentChallenge]);

  // Funciones de control
  const rotatePiece = (pieceId: number) => {
    setPieces(pieces.map(piece => 
      piece.id === pieceId 
        ? { ...piece, rotation: (piece.rotation + 90) % 360 }
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
    const piecesCount = challenge.piecesNeeded;
    const baseSize = 80 * 1.28; // 102.4px
    const maxPieceWidth = 2.5 * baseSize; // Ancho máximo de la pieza ≈ 256px
    const maxPieceHeight = 1.5 * baseSize; // Alto máximo de la pieza ≈ 153px

    const resetPieces: Piece[] = [];
    for (let i = 0; i < piecesCount; i++) {
      const templateIndex = i % 2;
      // Usar la misma lógica de posicionamiento que en la inicialización
      const pieceX = 50 + (i % 3) * 200; // Distribuir horizontalmente, máximo 3 piezas por fila
      const pieceY = 420 + Math.floor(i / 3) * 120; // Nueva fila cada 3 piezas, empezar en y=420
      resetPieces.push({
        ...pieceTemplates[templateIndex],
        id: i + 1,
        x: pieceX,
        y: pieceY,
        rotation: 0,
        placed: false
      });
    }

    setPieces(resetPieces);
  };

  const nextChallenge = () => {
    setCurrentChallenge((currentChallenge + 1) % challenges.length);
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
  };
};
