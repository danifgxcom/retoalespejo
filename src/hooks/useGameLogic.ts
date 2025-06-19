import { useState, useEffect } from 'react';
import { Piece } from '../components/GamePiece';
import { Challenge, PiecePosition } from '../components/ChallengeCard';

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
      targetPattern: "heart1",
      targetPieces: [
        { type: 'A', face: 'front', x: 150, y: 150, rotation: 0 },
        { type: 'A', face: 'front', x: 230, y: 150, rotation: 0 }
      ]
    },
    {
      id: 2,
      name: "Corazón Reto 2",
      description: "Patrón de rombos rojos sobre fondo amarillo",
      piecesNeeded: 2,
      difficulty: "Fácil",
      targetPattern: "heart2",
      targetPieces: [
        { type: 'B', face: 'back', x: 150, y: 200, rotation: 45 },
        { type: 'B', face: 'back', x: 230, y: 200, rotation: 45 }
      ]
    },
    {
      id: 3,
      name: "Patrón Complejo 1",
      description: "Combina ambos tipos de piezas",
      piecesNeeded: 4,
      difficulty: "Difícil",
      targetPattern: "complex1",
      targetPieces: [
        { type: 'A', face: 'front', x: 120, y: 120, rotation: 0 },
        { type: 'B', face: 'back', x: 200, y: 120, rotation: 90 },
        { type: 'A', face: 'back', x: 120, y: 200, rotation: 180 },
        { type: 'B', face: 'front', x: 200, y: 200, rotation: 270 }
      ]
    },
    {
      id: 4,
      name: "Patrón Complejo 2",
      description: "Desafío avanzado de simetría",
      piecesNeeded: 4,
      difficulty: "Difícil",
      targetPattern: "complex2",
      targetPieces: [
        { type: 'A', face: 'front', x: 100, y: 150, rotation: 45 },
        { type: 'B', face: 'front', x: 180, y: 150, rotation: 135 },
        { type: 'A', face: 'back', x: 260, y: 150, rotation: 225 },
        { type: 'B', face: 'back', x: 340, y: 150, rotation: 315 }
      ]
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

    // Coordenadas del área de piezas disponibles (inferior izquierda del canvas)
    // Área 3: Piezas disponibles = (0,600) a (700,1000) - Color gris #e9ecef
    const availableAreaX = 0; // Inicio X del área de piezas disponibles
    const availableAreaY = 600; // Inicio Y del área de piezas disponibles (SUBIDO de 700 a 600)
    const availableAreaWidth = 700; // Ancho del área de piezas disponibles
    const availableAreaHeight = 400; // Altura del área de piezas disponibles (600 a 1000)
    
    // Tamaño de la pieza (tamaño lógico base)
    const pieceSize = 80; // Tamaño base de la pieza
    
    // Márgenes para posicionar las piezas
    const marginX = 50; // Margen desde los bordes horizontales
    const absolutePieceY = 900; // Posición Y absoluta - cerca del final del área de piezas disponibles

    const initialPieces: Piece[] = [];
    for (let i = 0; i < piecesCount; i++) {
      const templateIndex = i % 2;
      
      // Calcular cuántas piezas caben por fila sin solaparse en el área de piezas disponibles
      const spacing = 120; // Espacio entre piezas para que no se superpongan visualmente
      const usableWidth = availableAreaWidth - (2 * marginX); // Espacio disponible horizontal
      const piecesPerRow = Math.floor(usableWidth / (pieceSize + spacing));
      
      // Calcular posición en la grilla dentro del área de piezas disponibles
      const row = Math.floor(i / piecesPerRow);
      const col = i % piecesPerRow;
      
      // Posición real en el área de piezas disponibles (inferior izquierda)
      const pieceX = availableAreaX + marginX + col * (pieceSize + spacing);
      const pieceY = absolutePieceY + row * (pieceSize + spacing); // Usar posición Y absoluta
      
      // Verificar que la pieza está completamente dentro del área de piezas disponibles
      const maxX = availableAreaX + availableAreaWidth - pieceSize - marginX;
      const maxY = availableAreaY + availableAreaHeight - pieceSize; // Sin margen para maxY ya que usamos posición absoluta
      
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
    const availableAreaX = 0;
    const availableAreaY = 600; // ACTUALIZADO: coincide con inicialización
    const availableAreaWidth = 700;
    const availableAreaHeight = 400; // ACTUALIZADO: coincide con inicialización
    const pieceSize = 80;
    const marginX = 50; // Igual que inicialización
    const absolutePieceY = 900; // Igual que inicialización - posición Y absoluta

    const resetPieces: Piece[] = [];
    for (let i = 0; i < piecesCount; i++) {
      const templateIndex = i % 2;
      
      // Usar la misma lógica de posicionamiento que en la inicialización
      const spacing = 120;
      const usableWidth = availableAreaWidth - (2 * marginX);
      const piecesPerRow = Math.floor(usableWidth / (pieceSize + spacing));
      
      const row = Math.floor(i / piecesPerRow);
      const col = i % piecesPerRow;
      
      const pieceX = availableAreaX + marginX + col * (pieceSize + spacing);
      const pieceY = absolutePieceY + row * (pieceSize + spacing); // Usar posición Y absoluta
      
      const maxX = availableAreaX + availableAreaWidth - pieceSize - marginX;
      const maxY = availableAreaY + availableAreaHeight - pieceSize; // Sin margen para maxY ya que usamos posición absoluta
      
      const finalX = Math.min(pieceX, maxX);
      const finalY = Math.min(pieceY, maxY);

      resetPieces.push({
        ...pieceTemplates[templateIndex],
        id: i + 1,
        x: finalX,
        y: finalY,
        rotation: 0,
        placed: false
      });
    }

    setPieces(resetPieces);
  };

  const nextChallenge = () => {
    setCurrentChallenge((currentChallenge + 1) % challenges.length);
  };

  // Función para comparar la configuración actual con el objetivo
  const checkSolution = (): boolean => {
    const challenge = challenges[currentChallenge];
    const placedPieces = pieces.filter(piece => piece.placed && piece.y < 600); // Solo piezas en área de juego
    
    // Verificar que el número de piezas colocadas coincida
    if (placedPieces.length !== challenge.targetPieces.length) {
      return false;
    }

    // Tolerancia para posición (en píxeles)
    const POSITION_TOLERANCE = 20;
    const ROTATION_TOLERANCE = 15; // en grados

    // Para cada pieza objetivo, buscar una pieza colocada que coincida
    return challenge.targetPieces.every(targetPiece => {
      return placedPieces.some(placedPiece => {
        // Verificar tipo y cara
        const typeMatch = placedPiece.type === targetPiece.type;
        const faceMatch = placedPiece.face === targetPiece.face;
        
        // Verificar posición con tolerancia
        const positionMatch = Math.abs(placedPiece.x - targetPiece.x) <= POSITION_TOLERANCE &&
                             Math.abs(placedPiece.y - targetPiece.y) <= POSITION_TOLERANCE;
        
        // Verificar rotación con tolerancia (considerando que 360° = 0°)
        const rotationDiff = Math.abs(placedPiece.rotation - targetPiece.rotation);
        const normalizedRotationDiff = Math.min(rotationDiff, 360 - rotationDiff);
        const rotationMatch = normalizedRotationDiff <= ROTATION_TOLERANCE;
        
        return typeMatch && faceMatch && positionMatch && rotationMatch;
      });
    });
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
    getTargetPiecesForDisplay,
  };
};