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
    
    // Extraer los tipos de piezas requeridos del challenge
    const requiredPieceTypes = challenge.objective.playerPieces.map(piece => ({
      type: piece.type,
      face: piece.face
    }));

    console.log(`📏 Creating ${challenge.piecesNeeded} responsive pieces`);

    relativePositions.forEach((relPos, index) => {
      const requiredType = requiredPieceTypes[index] || requiredPieceTypes[0];
      const template = createPieceTemplate(requiredType.type, requiredType.face);
      
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
      
      console.log(`🧩 Responsive piece ${piece.id} (${piece.type}) at (${Math.round(piece.x)}, ${Math.round(piece.y)}) R:${piece.rotation}°`);
      initialPieces.push(piece);
    });

    return initialPieces;
  };

  // Función legacy para generar piezas (mantener para compatibilidad)
  const createChallengeSpecificPieces = (challenge: Challenge): Piece[] => {
    const availableAreaX = 0;
    const availableAreaY = 600; // Inicio del área de piezas disponibles
    const availableAreaWidth = 700;
    const availableAreaHeight = 400; // Altura del área de piezas disponibles
    const pieceSize = 100;
    const margin = 80; // Margen más grande para piezas rotadas

    const initialPieces: Piece[] = [];

    // Extraer los tipos de piezas requeridos del challenge
    const requiredPieceTypes = challenge.objective.playerPieces.map(piece => ({
      type: piece.type,
      face: piece.face
    }));

    // Posiciones iniciales para diferentes cantidades de piezas
    const getPositionsForPieceCount = (count: number) => {
      // Espacio disponible para las esquinas superiores izquierdas de las piezas
      const usableWidth = availableAreaWidth - 2 * margin - pieceSize; // Ancho donde puede empezar una pieza
      const usableHeight = availableAreaHeight - 2 * margin - pieceSize; // Alto donde puede empezar una pieza
      
      console.log(`📏 Positioning ${count} pieces in area [${availableAreaX}, ${availableAreaY}, ${availableAreaWidth}x${availableAreaHeight}]`);
      
      switch (count) {
        case 1:
          const pos1 = { 
            x: -24, // Coordenadas que funcionan
            y: 616,
            rotation: 45
          };
          console.log(`✓ 1 piece at (${pos1.x}, ${pos1.y})`);
          return [pos1];
        case 2:
          // 2 piezas: usar las primeras 2 posiciones que funcionan para 4 piezas
          const pos2 = [
            { 
              x: -24, // Coordenadas que funcionan
              y: 616,
              rotation: 45
            },
            { 
              x: 243,
              y: 921,
              rotation: 225
            }
          ];
          console.log(`✓ 2 pieces at (${pos2[0].x}, ${pos2[0].y}) and (${pos2[1].x}, ${pos2[1].y})`);
          return pos2;
        case 3:
          // 3 piezas: usar las primeras 3 posiciones que funcionan para 4 piezas
          const pos3 = [
            { 
              x: -24, // Coordenadas que funcionan
              y: 616,
              rotation: 45
            },
            { 
              x: 243,
              y: 921,
              rotation: 225
            },
            { 
              x: 285,
              y: 614,
              rotation: 45
            }
          ];
          console.log(`✓ 3 pieces at positions: ${pos3.map(p => `(${p.x},${p.y})`).join(', ')}`);
          return pos3;
        case 4:
          // 4 piezas usando las coordenadas exactas del snapshot
          const pos4 = [
            { 
              x: -24, // Coordenadas exactas del snapshot
              y: 616,
              rotation: 45
            },
            { 
              x: 243,
              y: 921,
              rotation: 225
            },
            { 
              x: 556, // Coordenadas exactas del snapshot
              y: 926,
              rotation: 225
            },
            { 
              x: 285,
              y: 614,
              rotation: 45
            }
          ];
          console.log(`✓ 4 pieces in 2x2 grid, Y positions: ${pos4[0].y}, ${pos4[2].y}`);
          return pos4;
        default:
          // Para más de 4 piezas, usar un grid automático
          const positions = [];
          const cols = Math.min(Math.ceil(Math.sqrt(count)), 4); // Máximo 4 columnas
          const rows = Math.ceil(count / cols);
          
          for (let i = 0; i < count; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = availableAreaX + margin + (usableWidth / (cols - 1 || 1)) * col;
            const y = availableAreaY + margin + (usableHeight / (rows - 1 || 1)) * row;
            positions.push({ x, y });
          }
          console.log(`✓ ${count} pieces in ${cols}x${rows} grid`);
          return positions;
      }
    };

    const positions = getPositionsForPieceCount(challenge.piecesNeeded);

    // Crear las piezas según los tipos requeridos por el challenge
    for (let i = 0; i < challenge.piecesNeeded; i++) {
      const requiredType = requiredPieceTypes[i] || requiredPieceTypes[0]; // Fallback al primer tipo
      const template = createPieceTemplate(requiredType.type, requiredType.face);
      const position = positions[i];

      const piece = {
        ...template,
        id: i + 1,
        x: position.x,
        y: position.y,
        rotation: position.rotation || 0, // Usar rotación especificada o 0 por defecto
        placed: false // Las piezas empiezan sin colocar, en el área de piezas disponibles
      };
      
      console.log(`🧩 Creating piece ${piece.id} (${piece.type}) at (${piece.x}, ${piece.y})`);
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
      // Usar sistema responsive si está disponible, sino fallback al legacy
      // SIEMPRE usar el sistema responsive para posicionamiento consistente
      const newPieces = responsiveCanvas ? createResponsivePieces(challenge) : createChallengeSpecificPieces(challenge);
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
      // SIEMPRE usar el sistema responsive para posicionamiento consistente
      const newPieces = responsiveCanvas ? createResponsivePieces(challenge) : createChallengeSpecificPieces(challenge);
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
    isLoading,
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
    loadCustomChallenges,
    geometry,
    // Nuevas funciones responsive
    initializeResponsiveSystem,
    responsiveCanvas
  };
};
