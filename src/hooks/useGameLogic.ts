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
  const [temporaryDraggedPieceId, setTemporaryDraggedPieceId] = useState<number | null>(null);
  const [animatingPieceId, setAnimatingPieceId] = useState<number | null>(null);

  // Función para activar efecto de control (llamada desde el componente de controles)
  const setControlEffect = (pieceId: number | null) => {
    console.log(`🎮 SET CONTROL EFFECT:`, { pieceId, current: temporaryDraggedPieceId });
    setTemporaryDraggedPieceId(pieceId);
  };

  // Función helper para animaciones suaves de rotación
  const animateRotation = (pieceId: number, targetRotation: number, skipAnimation: boolean = false) => {
    console.log(`⚡ ANIMATE ROTATION ${pieceId}:`, { skipAnimation });

    // Solo activar animación visual si no se está controlando manualmente
    if (!skipAnimation) {
      console.log(`⚡ Setting animatingPieceId to ${pieceId}`);
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
        console.log(`⚡ Clearing animatingPieceId (was ${pieceId})`);
        setAnimatingPieceId(null);
      }, 300); // 300ms de animación
    }
  };

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
    const newFace = isBack ? 'front' : 'back';
    
    // Usar la misma lógica que createPieceTemplate para consistencia
    return {
      ...piece,
      face: newFace,
      centerColor: newFace === 'front' ? '#FFD700' : '#FF4444',
      triangleColor: newFace === 'front' ? '#FF4444' : '#FFD700'
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

    // Crear piezas exactamente como las especifica el reto
    console.log(`🎯 Creating pieces for challenge ${challenge.id}: "${challenge.name}"`);
    console.log(`📋 Required pieces from objective:`, challenge.objective.playerPieces);
    
    for (let i = 0; i < challenge.piecesNeeded; i++) {
      const targetPiece = challenge.objective.playerPieces[i];
      const template = createPieceTemplate(targetPiece.type, targetPiece.face);
      const position = positions[i];

      const piece = {
        ...template,
        id: i + 1,
        type: targetPiece.type, // Forzar el tipo exacto del reto
        face: targetPiece.face, // Forzar la cara exacta del reto
        x: position.x,
        y: position.y,
        rotation: position.rotation, // Usar la rotación exacta de la posición
        placed: false // Las piezas empiezan sin colocar, en el área de piezas disponibles
      };

      console.log(`🧩 GAME: Created piece ${piece.id} (${piece.type}, ${piece.face}) - center: ${piece.centerColor}, triangle: ${piece.triangleColor} - Target: (${targetPiece.type}, ${targetPiece.face})`);

      // Validar y ajustar la posición para que esté completamente en el área de almacenamiento
      const piecePosition = {
        type: piece.type,
        face: piece.face,
        x: piece.x,
        y: piece.y,
        rotation: piece.rotation
      };
      const isCompletelyInStorage = geometry.isPieceCompletelyInStorageArea(piecePosition, 1400, 1000);
      
      if (!isCompletelyInStorage) {
        console.log(`⚠️ Piece ${piece.id} is NOT completely in storage area, constraining...`);
        const constrainedPosition = geometry.constrainPieceToStorageArea(piecePosition, 1400, 1000);
        piece.x = constrainedPosition.x;
        piece.y = constrainedPosition.y;
        console.log(`🔧 Piece ${piece.id} constrained from (${position.x.toFixed(1)}, ${position.y.toFixed(1)}) to (${piece.x.toFixed(1)}, ${piece.y.toFixed(1)})`);
      }

      // Verificar colisiones con otras piezas ya creadas
      const otherPieces = initialPieces.map(p => ({
        type: p.type,
        face: p.face,
        x: p.x,
        y: p.y,
        rotation: p.rotation
      }));
      
      const updatedPiecePosition = {
        type: piece.type,
        face: piece.face,
        x: piece.x,
        y: piece.y,
        rotation: piece.rotation
      };
      
      const collisions = geometry.detectPieceCollisions(updatedPiecePosition, otherPieces);
      if (collisions.hasCollisions) {
        console.log(`⚠️ Piece ${piece.id} has collisions with other pieces, finding alternative position...`);
        
        // Intentar posiciones alternativas
        const storageAreaWidth = 350; // Área de almacenamiento: x 0-350
        const storageAreaHeight = 400; // Área de almacenamiento: y 600-1000
        let foundValidPosition = false;
        
        for (let attempts = 0; attempts < 20 && !foundValidPosition; attempts++) {
          const testX = 50 + (attempts % 6) * 50; // Posiciones en grilla
          const testY = 650 + Math.floor(attempts / 6) * 80;
          
          const testPosition = { ...updatedPiecePosition, x: testX, y: testY };
          const testConstrainedPosition = geometry.constrainPieceToStorageArea(testPosition, 1400, 1000);
          
          const testCollisions = geometry.detectPieceCollisions(testConstrainedPosition, otherPieces);
          const testInStorage = geometry.isPieceCompletelyInStorageArea(testConstrainedPosition, 1400, 1000);
          
          if (!testCollisions.hasCollisions && testInStorage) {
            piece.x = testConstrainedPosition.x;
            piece.y = testConstrainedPosition.y;
            foundValidPosition = true;
            console.log(`✅ Found collision-free position for piece ${piece.id}: (${piece.x.toFixed(1)}, ${piece.y.toFixed(1)})`);
          }
        }
        
        if (!foundValidPosition) {
          console.warn(`❌ Could not find collision-free position for piece ${piece.id}, keeping current position`);
        }
      }

      console.log(`🧩 Creating piece ${piece.id} (${piece.type}, ${piece.face}) at storage (${piece.x.toFixed(1)}, ${piece.y.toFixed(1)}) - Target: (${targetPiece.type}, ${targetPiece.face})`);
      initialPieces.push(piece);
    }

    console.log(`✅ Created ${initialPieces.length} pieces matching challenge requirements`);
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
    const translatedX = x - pieceDrawCenterX;
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

  // Funciones de control - ROTACIÓN EN INCREMENTOS DE 45 GRADOS CON ANIMACIÓN
  const rotatePiece = (pieceId: number, fromControl: boolean = false) => {
    console.log(`🔄 ROTATE PIECE ${pieceId} - Start:`, {
      temporaryDraggedPieceId: temporaryDraggedPieceId,
      animatingPieceId: animatingPieceId,
      fromControl: fromControl
    });

    const piece = pieces.find(p => p.id === pieceId);
    if (!piece) return;

    const targetRotation = (piece.rotation + 45) % 360;
    // Saltar animación visual si viene de control
    const skipAnimation = fromControl;
    console.log(`🔄 ROTATE PIECE ${pieceId} - skipAnimation:`, skipAnimation);

    animateRotation(pieceId, targetRotation, skipAnimation);

    // Si viene de control, programar limpieza automática
    if (fromControl) {
      setTimeout(() => {
        console.log(`🔄 ROTATE PIECE ${pieceId} - Auto-clearing control effect`);
        setTemporaryDraggedPieceId(null);
        // Forzar re-render del canvas modificando el array de piezas
        setPieces(prevPieces => [...prevPieces]);
      }, 150); // Reducido a 150ms para que se vea mejor
    }
  };

  const rotatePieceCounterClockwise = (pieceId: number, fromControl: boolean = false) => {
    console.log(`🔄 ROTATE PIECE CCW ${pieceId} - Start:`, {
      temporaryDraggedPieceId: temporaryDraggedPieceId,
      animatingPieceId: animatingPieceId,
      fromControl: fromControl
    });

    const piece = pieces.find(p => p.id === pieceId);
    if (!piece) return;

    const targetRotation = (piece.rotation - 45 + 360) % 360;
    // Saltar animación visual si viene de control
    const skipAnimation = fromControl;
    console.log(`🔄 ROTATE PIECE CCW ${pieceId} - skipAnimation:`, skipAnimation);

    animateRotation(pieceId, targetRotation, skipAnimation);

    // Si viene de control, programar limpieza automática
    if (fromControl) {
      setTimeout(() => {
        console.log(`🔄 ROTATE PIECE CCW ${pieceId} - Auto-clearing control effect`);
        setTemporaryDraggedPieceId(null);
        // Forzar re-render del canvas modificando el array de piezas
        setPieces(prevPieces => [...prevPieces]);
      }, 150);
    }
  };

  const flipPiece = (pieceId: number, fromControl: boolean = false) => {
    console.log(`🔄 FLIP PIECE ${pieceId} - Start:`, {
      temporaryDraggedPieceId: temporaryDraggedPieceId,
      fromControl: fromControl
    });

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
        console.log(`🔄 FLIP PIECE ${pieceId} - Auto-clearing control effect`);
        setTemporaryDraggedPieceId(null);
        // Forzar re-render del canvas modificando el array de piezas
        setPieces(prevPieces => [...prevPieces]);
      }, 150);
    }
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

  // Función para encontrar la asignación óptima de piezas por proximidad
  const findOptimalPieceAssignment = (
    placedPieces: PiecePosition[], 
    targetPieces: PiecePosition[]
  ): PiecePosition[] => {
    const assignments: PiecePosition[] = new Array(targetPieces.length);
    const usedIndices: boolean[] = new Array(placedPieces.length).fill(false);

    // Para cada posición objetivo, encontrar la pieza colocada más cercana compatible
    for (let i = 0; i < targetPieces.length; i++) {
      const target = targetPieces[i];
      let bestMatch: PiecePosition | null = null;
      let bestDistance = Infinity;
      let bestIndex = -1;

      for (let j = 0; j < placedPieces.length; j++) {
        if (usedIndices[j]) continue; // Ya asignada

        const placed = placedPieces[j];
        
        // Verificar compatibilidad de tipo y cara
        if (placed.type === target.type && placed.face === target.face) {
          // Calcular distancia euclidiana
          const distance = Math.sqrt(
            Math.pow(placed.x - target.x, 2) + 
            Math.pow(placed.y - target.y, 2)
          );

          if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = placed;
            bestIndex = j;
          }
        }
      }

      if (bestMatch && bestIndex !== -1) {
        assignments[i] = bestMatch;
        usedIndices[bestIndex] = true;
        console.log(`🎯 Asignación: Target ${i} (${target.x}, ${target.y}) -> Placed (${bestMatch.x}, ${bestMatch.y}) dist=${bestDistance.toFixed(1)}px`);
      }
    }

    return assignments;
  };

  // Función para verificar posiciones relativas entre piezas
  const checkRelativePositions = (
    placedPieces: PiecePosition[], 
    targetPieces: PiecePosition[]
  ): { success: boolean; message: string } => {
    const POSITION_TOLERANCE = 100; // Margen de error en píxeles (aumentado para mayor flexibilidad)
    const ROTATION_TOLERANCE = 45; // Margen de error en grados

    console.log('🔍 Comparando posiciones relativas:');

    // Para cada pieza objetivo, encontrar la correspondiente colocada
    for (let i = 0; i < targetPieces.length; i++) {
      const targetPiece = targetPieces[i];

      // Buscar pieza que coincida en tipo y cara
      const matchingPiece = placedPieces.find(placed => 
        placed.type === targetPiece.type && placed.face === targetPiece.face
      );

      if (!matchingPiece) {
        console.log(`❌ No se encontró pieza ${targetPiece.type} con cara ${targetPiece.face}`);
        return {
          success: false,
          message: `Falta pieza ${targetPiece.type} con cara ${targetPiece.face}`
        };
      }

      // Verificar rotación
      const rotationDiff = Math.abs(matchingPiece.rotation - targetPiece.rotation);
      const normalizedRotationDiff = Math.min(rotationDiff, 360 - rotationDiff);

      if (normalizedRotationDiff > ROTATION_TOLERANCE) {
        console.log(`❌ Pieza ${targetPiece.type} tiene rotación incorrecta: ${matchingPiece.rotation}° vs ${targetPiece.rotation}°`);
        return {
          success: false,
          message: `Pieza ${targetPiece.type} necesita rotación diferente`
        };
      }

      console.log(`✅ Pieza ${targetPiece.type}: tipo y cara correctos, rotación OK`);
    }

    // Si tenemos múltiples piezas, verificar posiciones relativas
    if (targetPieces.length > 1) {
      console.log('🔍 Verificando posiciones relativas entre piezas...');

      // Crear matching óptimo por proximidad en lugar de por tipo/cara
      const assignments = findOptimalPieceAssignment(placedPieces, targetPieces);
      
      for (let i = 0; i < targetPieces.length; i++) {
        for (let j = i + 1; j < targetPieces.length; j++) {
          const target1 = targetPieces[i];
          const target2 = targetPieces[j];

          const placed1 = assignments[i];
          const placed2 = assignments[j];

          if (placed1 && placed2) {
            // Calcular distancia relativa en el objetivo
            const targetDistanceX = target2.x - target1.x;
            const targetDistanceY = target2.y - target1.y;

            // Calcular distancia relativa en las piezas colocadas
            const placedDistanceX = placed2.x - placed1.x;
            const placedDistanceY = placed2.y - placed1.y;

            // Verificar si las distancias relativas son similares
            const deltaX = Math.abs(placedDistanceX - targetDistanceX);
            const deltaY = Math.abs(placedDistanceY - targetDistanceY);

            console.log(`📏 Distancia entre ${target1.type} y ${target2.type}:`);
            console.log(`  Objetivo: (${targetDistanceX.toFixed(1)}, ${targetDistanceY.toFixed(1)})`);
            console.log(`  Colocado: (${placedDistanceX.toFixed(1)}, ${placedDistanceY.toFixed(1)})`);
            console.log(`  Diferencia: (${deltaX.toFixed(1)}, ${deltaY.toFixed(1)})`);

            if (deltaX > POSITION_TOLERANCE || deltaY > POSITION_TOLERANCE) {
              console.log(`❌ Posición relativa incorrecta entre ${target1.type} y ${target2.type}`);
              return {
                success: false,
                message: `La posición relativa entre las piezas ${target1.type} y ${target2.type} no es correcta`
              };
            }

            console.log(`✅ Posición relativa correcta entre ${target1.type} y ${target2.type}`);
          }
        }
      }
    }

    console.log('✅ Todas las posiciones relativas son correctas');
    return { success: true, message: "Posiciones correctas" };
  };

  // Función de verificación de solución con espejos - NUEVA VERSIÓN CON POSICIONES RELATIVAS
  const checkSolutionWithMirrors = (): { isCorrect: boolean; message: string } => {
    const challenge = challenges[currentChallenge];
    const placedPieces = pieces.filter(piece => piece.placed && piece.y < 600).map(pieceToPosition);

    console.log('🔍 VALIDACIÓN DE SOLUCIÓN:');
    console.log('Challenge objetivo:', challenge.objective.playerPieces);
    console.log('Piezas colocadas:', placedPieces);

    // Verificar si se han colocado todas las piezas necesarias
    if (placedPieces.length !== challenge.piecesNeeded) {
      console.log(`❌ Número incorrecto de piezas: ${placedPieces.length}/${challenge.piecesNeeded}`);
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

    // Verificar que las piezas estén conectadas usando la validación geométrica avanzada
    const validation = geometry.validateChallengeCard(placedPieces);
    console.log('🔧 Validación geométrica:', validation);

    if (!validation.isValid) {
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
      if (validation.hasPieceOverlaps) {
        return {
          isCorrect: false,
          message: "Las piezas no pueden solaparse."
        };
      }
      if (validation.entersMirror) {
        return {
          isCorrect: false,
          message: "Las piezas no pueden entrar en el área del espejo."
        };
      }
      return {
        isCorrect: false,
        message: "La configuración de piezas no es válida."
      };
    }

    // VALIDACIÓN SIMPLIFICADA: Solo verificar que las piezas estén bien geométricamente
    // Para reto 2, si pasa la validación geométrica (conexión + espejo), es válido
    console.log('✅ Validación geométrica pasada - configuración válida');
    
    // Validación adicional opcional: verificar que tenemos los tipos y caras correctos
    const targetPieces = challenge.objective.playerPieces;
    const hasCorrectPieces = targetPieces.every(target => 
      placedPieces.some(placed => 
        placed.type === target.type && 
        placed.face === target.face
      )
    );
    
    if (!hasCorrectPieces) {
      return {
        isCorrect: false,
        message: "Las piezas colocadas no tienen los tipos y caras correctos."
      };
    }

    // Si pasa todas las validaciones, es válido
    console.log('✅ ¡Solución correcta!');
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
    temporaryDraggedPieceId,
    animatingPieceId,
    setControlEffect,
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
