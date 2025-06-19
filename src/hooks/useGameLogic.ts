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
    const size = 80; // Tamaño base de la pieza
    const unit = size * 1.28; // Factor de escala

    // La pieza se dibuja con translate(x + size/2, y + size/2) y luego rotate
    // Necesitamos hacer la transformación inversa
    const pieceDrawCenterX = piece.x + size/2;
    const pieceDrawCenterY = piece.y + size/2;

    // Traducir el punto al origen de la pieza
    const translatedX = x - pieceDrawCenterX;
    const translatedY = y - pieceDrawCenterY;

    // Rotar en sentido contrario para "desrotar" el punto
    const rad = (-piece.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rotatedX = translatedX * cos - translatedY * sin;
    const rotatedY = translatedX * sin + translatedY * cos;

    // Convertir a coordenadas unitarias de la pieza (el sistema coord(x,y))
    const unitX = rotatedX / unit;
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

    const hit = inSquare || inLeftTriangle || inTopTriangle || inRightTriangle;

    return hit;
  };

  // Inicializar piezas según el desafío actual
  useEffect(() => {
    const challenge = challenges[currentChallenge];
    const piecesCount = challenge.piecesNeeded;

    // Constantes del layout actualizado
    const gameAreaHeight = 500; // Nueva altura del área de juego
    const availableAreaStart = gameAreaHeight; // El área disponible empieza donde termina el área de juego

    const initialPieces: Piece[] = [];
    for (let i = 0; i < piecesCount; i++) {
      const templateIndex = i % 2;
      // Posicionar las piezas en el área de "PIEZAS DISPONIBLES"
      // Área disponible: X de 0 a 700, Y de 500 a 600 (nueva distribución)
      const pieceSpacing = 150; // Espaciado entre piezas
      const startX = 100; // Margen izquierdo
      const startY = availableAreaStart + 50; // Dentro del área de disponibles (500-600)

      const pieceX = startX + (i % 4) * pieceSpacing; // Máximo 4 piezas por fila
      const pieceY = startY + Math.floor(i / 4) * 80; // Nueva fila cada 4 piezas

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
    const piecesCount = challenge.piecesNeeded;

    // Usar las mismas constantes que en la inicialización
    const gameAreaHeight = 500;
    const availableAreaStart = gameAreaHeight;

    const resetPieces: Piece[] = [];
    for (let i = 0; i < piecesCount; i++) {
      const templateIndex = i % 2;
      // Usar la misma lógica de posicionamiento que en la inicialización
      const pieceSpacing = 150;
      const startX = 100;
      const startY = availableAreaStart + 50;

      const pieceX = startX + (i % 4) * pieceSpacing;
      const pieceY = startY + Math.floor(i / 4) * 80;

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