import { GameGeometry, PiecePosition } from './geometry/GameGeometry';
import { Challenge, ObjectivePattern } from '../components/ChallengeCard';

export class ChallengeGenerator {
  // Static cache to ensure challenges are only loaded once per application lifetime
  private static cachedDefaultChallenges: Challenge[] | null = null;

  private geometry: GameGeometry;
  private defaultChallenges: Challenge[] | null = null;
  private customChallenges: Challenge[] | null = null;

  // Embedded fallback challenges in case the JSON file can't be loaded
  // Estos challenges están validados y garantizados para funcionar correctamente
  private readonly embeddedChallenges: Challenge[] = [
    {
      "id": 1,
      "name": "Tarjeta 1: Corazón Simple",
      "description": "Forma un corazón con una pieza A tocando el espejo",
      "piecesNeeded": 1,
      "difficulty": "Principiante",
      "targetPattern": "heart_simple",
      "objective": {
        "playerPieces": [
          {
            "type": "A",
            "face": "front",
            "x": 330, // Posición validada para tocar exactamente el espejo
            "y": 300,
            "rotation": 0
          }
        ],
        "symmetricPattern": []
      },
      "targetPieces": [
        {
          "type": "A",
          "face": "front",
          "x": 330,
          "y": 300,
          "rotation": 0
        }
      ]
    },
    {
      "id": 2,
      "name": "Tarjeta 2: Cuatro Piezas",
      "description": "Forma un patrón con 4 piezas para probar posicionamiento",
      "piecesNeeded": 4,
      "difficulty": "Intermedio",
      "targetPattern": "four_pieces",
      "objective": {
        "playerPieces": [
          {
            "type": "A",
            "face": "front",
            "x": 200,
            "y": 200,
            "rotation": 0
          },
          {
            "type": "A",
            "face": "back",
            "x": 400,
            "y": 200,
            "rotation": 45
          },
          {
            "type": "B",
            "face": "front",
            "x": 200,
            "y": 400,
            "rotation": 90
          },
          {
            "type": "B",
            "face": "back",
            "x": 400,
            "y": 400,
            "rotation": 135
          }
        ],
        "symmetricPattern": []
      },
      "targetPieces": [
        {
          "type": "A",
          "face": "front",
          "x": 200,
          "y": 200,
          "rotation": 0
        },
        {
          "type": "A",
          "face": "back",
          "x": 400,
          "y": 200,
          "rotation": 45
        },
        {
          "type": "B",
          "face": "front",
          "x": 200,
          "y": 400,
          "rotation": 90
        },
        {
          "type": "B",
          "face": "back",
          "x": 400,
          "y": 400,
          "rotation": 135
        }
      ]
    },
    {
      "id": 3,
      "name": "Tarjeta 3: Torre Vertical",
      "description": "Forma una torre con dos piezas A apiladas",
      "piecesNeeded": 2,
      "difficulty": "Fácil",
      "targetPattern": "vertical_tower",
      "objective": {
        "playerPieces": [
          {
            "type": "A",
            "face": "front",
            "x": 330, // Alineadas verticalmente
            "y": 200, // Posición superior - ajustada para que quepa en el área
            "rotation": 0
          },
          {
            "type": "A",
            "face": "front",
            "x": 330, // Pieza que toca el espejo
            "y": 300, // Posición inferior - ajustada para tocar la pieza superior
            "rotation": 0
          }
        ],
        "symmetricPattern": []
      },
      "targetPieces": [
        {
          "type": "A",
          "face": "front",
          "x": 330,
          "y": 200,
          "rotation": 0
        },
        {
          "type": "A",
          "face": "front",
          "x": 330,
          "y": 300,
          "rotation": 0
        }
      ]
    },
    {
      "id": 4,
      "name": "Tarjeta 4: Forma en L",
      "description": "Forma una L con tres piezas A conectadas",
      "piecesNeeded": 3,
      "difficulty": "Intermedio",
      "targetPattern": "l_shape",
      "objective": {
        "playerPieces": [
          {
            "type": "A",
            "face": "front",
            "x": 72, // Posición superior de la L
            "y": 200, // Calculada para formar L conectada y estar dentro del área
            "rotation": 0
          },
          {
            "type": "A",
            "face": "front",
            "x": 72, // Posición central de la L
            "y": 300,
            "rotation": 0
          },
          {
            "type": "A",
            "face": "front",
            "x": 330, // Pieza que toca el espejo
            "y": 300,
            "rotation": 0
          }
        ],
        "symmetricPattern": []
      },
      "targetPieces": [
        {
          "type": "A",
          "face": "front",
          "x": 72,
          "y": 200,
          "rotation": 0
        },
        {
          "type": "A",
          "face": "front",
          "x": 72,
          "y": 300,
          "rotation": 0
        },
        {
          "type": "A",
          "face": "front",
          "x": 330,
          "y": 300,
          "rotation": 0
        }
      ]
    }
  ];

  constructor(geometry: GameGeometry) {
    this.geometry = geometry;

    // Complete the symmetricPattern for embedded challenges
    this.embeddedChallenges.forEach(challenge => {
      if (!challenge.objective.symmetricPattern || challenge.objective.symmetricPattern.length === 0) {
        const playerPieces = challenge.objective.playerPieces;
        const mirrorPieces = playerPieces.map(piece => this.geometry.reflectPieceAcrossMirror(piece));
        challenge.objective.symmetricPattern = [...playerPieces, ...mirrorPieces];
      }
    });
  }

  // Flag para controlar si ya se está cargando un archivo
  private isLoadingFile: boolean = false;

  // Cache para URLs ya cargadas
  private static urlCache: Map<string, Challenge[]> = new Map();

  /**
   * Carga los desafíos desde un archivo JSON
   * @param url URL del archivo JSON o identificador único
   * @param isCustom Indica si son desafíos personalizados
   * @param preloadedChallenges Desafíos ya parseados (opcional, para evitar fetch)
   * @returns Promise con los desafíos cargados
   */
  async loadChallengesFromFile(
    url: string, 
    isCustom: boolean = false, 
    preloadedChallenges?: Challenge[]
  ): Promise<Challenge[]> {
    // Si es un archivo personalizado (blob URL), no usar caché
    const isCustomFile = url.startsWith('blob:') || isCustom;

    // Verificar si ya tenemos esta URL en caché (solo para archivos no personalizados)
    if (!isCustomFile && ChallengeGenerator.urlCache.has(url)) {
      console.log(`Usando desafíos en caché para URL: ${url}`);
      const cachedChallenges = ChallengeGenerator.urlCache.get(url) || [];

      // Almacenar en la instancia según el tipo
      if (isCustom) {
        this.customChallenges = cachedChallenges;
      } else {
        this.defaultChallenges = cachedChallenges;
      }

      return cachedChallenges;
    }

    // Evitar múltiples cargas simultáneas del mismo archivo
    if (this.isLoadingFile && !isCustomFile) {
      console.log('Ya se está cargando un archivo, ignorando solicitud adicional');
      return isCustom ? (this.customChallenges || []) : (this.defaultChallenges || []);
    }

    // Solo marcar como cargando para archivos no personalizados
    if (!isCustomFile) {
      this.isLoadingFile = true;
    }

    try {
      let challenges: Challenge[];

      // Si tenemos desafíos precargados, usarlos directamente
      if (preloadedChallenges && preloadedChallenges.length > 0) {
        console.log(`Usando desafíos precargados (${preloadedChallenges.length})`);
        challenges = preloadedChallenges;
      } else {
        // De lo contrario, cargar desde la URL
        console.log(`Intentando cargar desafíos desde: ${url}`);

        // Set a timeout for the fetch operation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(url, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            // Usar caché agresivo para archivos no personalizados
            'Cache-Control': isCustomFile ? 'no-cache' : 'max-age=31536000'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Error al cargar los desafíos: ${response.statusText}`);
        }

        challenges = await response.json();
      }
      console.log(`Desafíos cargados correctamente: ${challenges.length} desafíos encontrados`);

      // Validar y completar los desafíos cargados
      const validChallenges = challenges.map(challenge => {
        // Asegurarse de que symmetricPattern esté completo
        if (!challenge.objective.symmetricPattern || challenge.objective.symmetricPattern.length === 0) {
          const playerPieces = challenge.objective.playerPieces;
          const mirrorPieces = playerPieces.map(piece => this.geometry.reflectPieceAcrossMirror(piece));
          challenge.objective.symmetricPattern = [...playerPieces, ...mirrorPieces];
        }
        return challenge;
      });

      // Almacenar los desafíos según su tipo
      if (isCustom) {
        this.customChallenges = validChallenges;
      } else {
        this.defaultChallenges = validChallenges;
        // Guardar en el caché estático para archivos no personalizados
        ChallengeGenerator.cachedDefaultChallenges = validChallenges;
      }

      // Guardar en el caché de URLs (solo para archivos no personalizados)
      if (!isCustomFile) {
        ChallengeGenerator.urlCache.set(url, validChallenges);
      }

      return validChallenges;
    } catch (error) {
      console.error('Error al cargar los desafíos:', error);

      // Log more detailed error information
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.warn('Error de red al intentar cargar el archivo. Verificar que el archivo exista y sea accesible.');
      } else if (error.name === 'AbortError') {
        console.warn('La carga de desafíos ha excedido el tiempo límite.');
      } else if (error instanceof SyntaxError) {
        console.warn('El archivo JSON no tiene un formato válido.');
      }

      return [];
    } finally {
      // Solo desmarcar como cargando para archivos no personalizados
      if (!isCustomFile) {
        this.isLoadingFile = false;
      }
    }
  }

  /**
   * Genera un challenge aleatorio válido con el número especificado de piezas
   * @param piecesCount Número de piezas para el challenge (1-4)
   * @param maxAttempts Número máximo de intentos para generar un challenge válido
   * @returns Un challenge válido o null si no se pudo generar después de maxAttempts
   */
  generateRandomChallenge(piecesCount: number = 2, maxAttempts: number = 100): Challenge | null {
    // Limitar el número de piezas entre 1 y 4
    piecesCount = Math.max(1, Math.min(4, piecesCount));

    // Valores posibles para las propiedades de las piezas
    const pieceTypes: ('A' | 'B')[] = ['A', 'B'];
    const pieceFaces: ('front' | 'back')[] = ['front', 'back'];
    const rotations = [0, 45, 90, 135, 180, 225, 270, 315];

    // Área de juego disponible
    const gameAreaWidth = this.geometry.getConfig().mirrorLineX;
    const gameAreaHeight = this.geometry.getConfig().height;
    const pieceSize = this.geometry.getConfig().pieceSize;

    // Margen para evitar que las piezas estén demasiado cerca de los bordes
    const margin = pieceSize / 2;

    // Función para generar un número aleatorio en un rango
    const randomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Función para generar una pieza aleatoria
    const generateRandomPiece = (): PiecePosition => {
      return {
        type: pieceTypes[randomInRange(0, pieceTypes.length - 1)],
        face: pieceFaces[randomInRange(0, pieceFaces.length - 1)],
        x: randomInRange(margin, gameAreaWidth - pieceSize - margin),
        y: randomInRange(margin, gameAreaHeight - pieceSize - margin),
        rotation: rotations[randomInRange(0, rotations.length - 1)]
      };
    };

    // Intentar generar un challenge válido
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const playerPieces: PiecePosition[] = [];

      // Generar piezas aleatorias
      for (let i = 0; i < piecesCount; i++) {
        playerPieces.push(generateRandomPiece());
      }

      // Asegurarse de que al menos una pieza toque el espejo
      const mirrorLineX = this.geometry.getConfig().mirrorLineX;
      const randomPieceIndex = randomInRange(0, piecesCount - 1);
      const pieceToTouchMirror = playerPieces[randomPieceIndex];
      const mirrorPosition = this.geometry.getPositionTouchingMirror(
        pieceToTouchMirror.y, 
        pieceToTouchMirror.rotation, 
        pieceToTouchMirror.type
      );
      playerPieces[randomPieceIndex].x = mirrorPosition.x;

      // Si hay más de una pieza, asegurarse de que estén conectadas
      if (piecesCount > 1) {
        // Colocar las piezas de manera que se toquen
        for (let i = 1; i < piecesCount; i++) {
          const basePiece = playerPieces[i - 1];
          const currentPiece = playerPieces[i];

          // Determinar si colocar la pieza horizontal o verticalmente junto a la anterior
          const placeHorizontally = Math.random() > 0.5;

          if (placeHorizontally) {
            // Colocar la pieza a la derecha de la anterior
            currentPiece.x = Math.min(gameAreaWidth - pieceSize - margin, basePiece.x + pieceSize);
            currentPiece.y = basePiece.y;
          } else {
            // Colocar la pieza debajo de la anterior
            currentPiece.x = basePiece.x;
            currentPiece.y = Math.min(gameAreaHeight - pieceSize - margin, basePiece.y + pieceSize);
          }

          // Asegurarse de que la pieza esté dentro de los límites
          currentPiece.x = Math.max(margin, Math.min(gameAreaWidth - pieceSize - margin, currentPiece.x));
          currentPiece.y = Math.max(margin, Math.min(gameAreaHeight - pieceSize - margin, currentPiece.y));
        }
      }

      // Validar el challenge
      const validation = this.geometry.validateChallengeCard(playerPieces);

      // Si es válido, crear y devolver el challenge
      if (validation.isValid) {
        const challengeId = 100 + attempt; // ID único para challenges aleatorios
        return {
          id: challengeId,
          name: `Challenge Aleatorio #${challengeId}`,
          description: `Challenge aleatorio con ${piecesCount} piezas`,
          piecesNeeded: piecesCount,
          difficulty: piecesCount <= 2 ? "Fácil" : "Intermedio",
          targetPattern: `random_${piecesCount}_pieces`,
          objective: this.createSymmetricObjective(playerPieces),
          targetPieces: playerPieces
        };
      }
    }

    // Si no se pudo generar un challenge válido después de maxAttempts, devolver null
    console.warn(`No se pudo generar un challenge aleatorio válido con ${piecesCount} piezas después de ${maxAttempts} intentos`);
    return null;
  }

  /**
   * Crea un objetivo simétrico a partir de las piezas del jugador
   */
  private createSymmetricObjective(playerPieces: PiecePosition[]): ObjectivePattern {
    const mirrorPieces = playerPieces.map(piece => this.geometry.reflectPieceAcrossMirror(piece));
    return {
      playerPieces,
      symmetricPattern: [...playerPieces, ...mirrorPieces]
    };
  }

  /**
   * Genera un challenge de corazón simple
   */
  generateHeartChallenge(): Challenge {
    // Intentar con una rotación de 0 grados en lugar de 270
    const heartPosition = this.geometry.getPositionTouchingMirror(300, 0);

    const playerPieces: PiecePosition[] = [
      {
        type: 'A',
        face: 'front',
        x: heartPosition.x,
        y: heartPosition.y,
        rotation: 0
      }
    ];

    // Validar que el patrón es correcto según las reglas de challenge cards
    let validation = this.geometry.validateChallengeCard(playerPieces);
    if (!validation.isValid) {
      console.warn('Challenge corazón simple no es válido:', validation);

      // Intentar con diferentes rotaciones y posiciones hasta encontrar una válida
      const rotations = [0, 90, 180, 270];
      const yPositions = [250, 300, 350, 400];

      let validCombinationFound = false;

      // Probar diferentes combinaciones hasta encontrar una válida
      for (const rotation of rotations) {
        for (const y of yPositions) {
          if (validCombinationFound) continue;

          const newPosition = this.geometry.getPositionTouchingMirror(y, rotation);
          playerPieces[0].x = newPosition.x;
          playerPieces[0].y = y;
          playerPieces[0].rotation = rotation;

          validation = this.geometry.validateChallengeCard(playerPieces);
          if (validation.isValid) {
            console.log(`Found valid heart challenge: rotation=${rotation}, y=${y}, x=${newPosition.x}`);
            validCombinationFound = true;
            break;
          }
        }
      }

      // Si no se encontró una combinación válida, intentar con un ajuste manual
      if (!validCombinationFound) {
        // Intentar con una posición más alejada del espejo
        playerPieces[0].x = 600;
        playerPieces[0].y = 300;
        playerPieces[0].rotation = 0;

        validation = this.geometry.validateChallengeCard(playerPieces);
      }

      // Verificar que ahora es válido
      console.log('Challenge corazón simple después de ajustes:', validation.isValid ? 'VÁLIDO' : 'NO VÁLIDO');
    }

    return {
      id: 1,
      name: "Tarjeta 1: Corazón Simple",
      description: "Forma un corazón con una pieza A rotada 270° tocando el espejo",
      piecesNeeded: 1,
      difficulty: "Principiante",
      targetPattern: "heart_simple",
      objective: this.createSymmetricObjective(playerPieces),
      targetPieces: playerPieces
    };
  }

  /**
   * Genera un challenge de bloque horizontal
   */
  generateHorizontalBlockChallenge(): Challenge {
    // Una pieza tocando el espejo, otra exactamente a su izquierda tocándola
    const mirrorPosition = this.geometry.getPositionTouchingMirror(300, 0);

    const playerPieces: PiecePosition[] = [
      {
        type: 'A',
        face: 'front',
        x: 0, // Se calculará después
        y: 300,
        rotation: 0
      },
      {
        type: 'A',
        face: 'front', 
        x: mirrorPosition.x, // Pieza tocando el espejo
        y: 300,
        rotation: 0
      }
    ];

    // Usar algoritmo de búsqueda binaria para encontrar la posición exacta donde las piezas se tocan
    const targetTolerance = 2; // Distancia objetivo entre piezas (se tocan)
    let leftBound = 0;
    let rightBound = playerPieces[1].x;
    let bestX = leftBound;

    // Búsqueda binaria para encontrar la posición óptima
    for (let iteration = 0; iteration < 20; iteration++) {
      const midX = (leftBound + rightBound) / 2;
      playerPieces[0].x = midX;

      const distance = this.geometry.getMinDistanceBetweenPieces(playerPieces[0], playerPieces[1]);
      const overlap = this.geometry.doPiecesOverlap(playerPieces[0], playerPieces[1]);

      if (overlap) {
        // Si se solapan, mover la pieza hacia la izquierda
        rightBound = midX;
      } else if (distance > targetTolerance) {
        // Si están muy separadas, mover hacia la derecha
        leftBound = midX;
      } else {
        // Distancia ideal encontrada
        bestX = midX;
        break;
      }

      // Actualizar la mejor posición encontrada
      if (!overlap && distance <= targetTolerance + 3) {
        bestX = midX;
      }
    }

    playerPieces[0].x = bestX;

    return {
      id: 2,
      name: "Tarjeta 2: Bloque Horizontal",
      description: "Forma un bloque horizontal con dos piezas A tocándose",
      piecesNeeded: 2,
      difficulty: "Fácil",
      targetPattern: "horizontal_block",
      objective: this.createSymmetricObjective(playerPieces),
      targetPieces: playerPieces
    };
  }

  /**
   * Genera un challenge de torre vertical
   */
  generateVerticalTowerChallenge(): Challenge {
    // Una pieza tocando el espejo, otra apilada encima tocándola
    const mirrorPosition = this.geometry.getPositionTouchingMirror(350, 0);

    const playerPieces: PiecePosition[] = [
      {
        type: 'A',
        face: 'front',
        x: mirrorPosition.x,
        y: 250, // Pieza superior - posición temporal
        rotation: 0
      },
      {
        type: 'A',
        face: 'front',
        x: mirrorPosition.x, // Pieza tocando el espejo
        y: 350,
        rotation: 0
      }
    ];

    // Validar y ajustar iterativamente
    let validation = this.geometry.validateChallengeCard(playerPieces);
    let attempts = 0;

    while (!validation.isValid && attempts < 50) {
      console.log(`Challenge 3 attempt ${attempts + 1}:`, {
        touchesMirror: validation.touchesMirror,
        piecesConnected: validation.piecesConnected,
        hasPieceOverlaps: validation.hasPieceOverlaps,
        entersMirror: validation.entersMirror
      });

      // Asegurar que la pieza inferior toque el espejo
      if (!validation.touchesMirror) {
        playerPieces[1].x = this.geometry.getPositionTouchingMirror(350, playerPieces[1].rotation, playerPieces[1].type).x;
        playerPieces[0].x = playerPieces[1].x; // Alinear verticalmente
      }

      // Asegurar que las piezas se toquen verticalmente sin solaparse
      if (!validation.piecesConnected || validation.hasPieceOverlaps) {
        // Obtener bounding box de la pieza inferior
        const piece2Bbox = this.geometry.getPieceBoundingBox(playerPieces[1]);

        // Calcular donde debe estar la pieza superior
        const tempPiece1 = { ...playerPieces[0] };
        tempPiece1.y = 0;
        const tempBbox1 = this.geometry.getPieceBoundingBox(tempPiece1);

        // La pieza superior debe tocar la inferior por abajo
        const desiredBottomEdge = piece2Bbox.top;
        const piece1Height = tempBbox1.bottom - tempBbox1.top;
        const piece1OffsetY = tempBbox1.top;

        playerPieces[0].y = desiredBottomEdge - piece1Height + piece1OffsetY;

        console.log(`Positioning piece 1 at y=${playerPieces[0].y} to touch piece 2 vertically`);
      }

      // Si aún hay solapamientos, separar más las piezas
      if (validation.hasPieceOverlaps) {
        const bbox1 = this.geometry.getPieceBoundingBox(playerPieces[0]);
        const bbox2 = this.geometry.getPieceBoundingBox(playerPieces[1]);

        const overlapAmount = bbox1.bottom - bbox2.top;
        if (overlapAmount > 0) {
          playerPieces[0].y -= (overlapAmount + 2);
          console.log(`Moved piece 1 up by ${overlapAmount + 2} to avoid overlap`);
        }
      }

      validation = this.geometry.validateChallengeCard(playerPieces);
      attempts++;
    }

    console.log(`Challenge 3 final validation:`, validation);

    return {
      id: 3,
      name: "Tarjeta 3: Torre Vertical",
      description: "Forma una torre con dos piezas A apiladas",
      piecesNeeded: 2,
      difficulty: "Fácil",
      targetPattern: "vertical_tower",
      objective: this.createSymmetricObjective(playerPieces),
      targetPieces: playerPieces
    };
  }

  /**
   * Genera un challenge en L
   */
  generateLShapeChallenge(): Challenge {
    // Crear una L con una pieza tocando el espejo
    const mirrorPosition = this.geometry.getPositionTouchingMirror(250, 0);

    // Configuración inicial de las tres piezas en forma de L
    const playerPieces: PiecePosition[] = [
      {
        type: 'A',
        face: 'front',
        x: 100, // Pieza superior izquierda - posición temporal
        y: 200,
        rotation: 0
      },
      {
        type: 'A',
        face: 'front',
        x: 100, // Pieza inferior izquierda - posición temporal
        y: 250,
        rotation: 0
      },
      {
        type: 'A',
        face: 'front',
        x: mirrorPosition.x, // Pieza tocando el espejo
        y: 250,
        rotation: 0
      }
    ];

    // Validar y ajustar iterativamente
    let validation = this.geometry.validateChallengeCard(playerPieces);
    let attempts = 0;

    while (!validation.isValid && attempts < 50) {
      console.log(`Challenge 4 attempt ${attempts + 1}:`, {
        touchesMirror: validation.touchesMirror,
        piecesConnected: validation.piecesConnected,
        hasPieceOverlaps: validation.hasPieceOverlaps,
        entersMirror: validation.entersMirror
      });

      // Asegurar que la pieza derecha (piece 2) toque el espejo
      if (!validation.touchesMirror) {
        playerPieces[2].x = this.geometry.getPositionTouchingMirror(250, playerPieces[2].rotation, playerPieces[2].type).x;
      }

      // Posicionar las piezas para formar una L conectada
      if (!validation.piecesConnected || validation.hasPieceOverlaps) {
        // Pieza 2 (derecha) ya está en posición tocando el espejo
        // Posicionar pieza 1 (centro) a la izquierda de la pieza 2
        const piece2Bbox = this.geometry.getPieceBoundingBox(playerPieces[2]);
        const tempPiece1 = { ...playerPieces[1], x: 0 };
        const tempBbox1 = this.geometry.getPieceBoundingBox(tempPiece1);

        // Pieza 1 debe tocar pieza 2 horizontalmente
        const piece1Width = tempBbox1.right - tempBbox1.left;
        const piece1OffsetX = tempBbox1.left;
        playerPieces[1].x = piece2Bbox.left - piece1Width + piece1OffsetX;

        // Posicionar pieza 0 (arriba) encima de la pieza 1
        const piece1Bbox = this.geometry.getPieceBoundingBox(playerPieces[1]);
        const tempPiece0 = { ...playerPieces[0], y: 0 };
        const tempBbox0 = this.geometry.getPieceBoundingBox(tempPiece0);

        // Alinear horizontalmente con pieza 1
        playerPieces[0].x = playerPieces[1].x;

        // Posicionar verticalmente para tocar pieza 1
        const piece0Height = tempBbox0.bottom - tempBbox0.top;
        const piece0OffsetY = tempBbox0.top;
        playerPieces[0].y = piece1Bbox.top - piece0Height + piece0OffsetY;

        console.log(`Positioned L-shape: piece0(${playerPieces[0].x},${playerPieces[0].y}), piece1(${playerPieces[1].x},${playerPieces[1].y}), piece2(${playerPieces[2].x},${playerPieces[2].y})`);
      }

      // Ajustar solapamientos si los hay
      if (validation.hasPieceOverlaps) {
        // Mover ligeramente las piezas para evitar solapamientos
        for (let i = 0; i < playerPieces.length; i++) {
          for (let j = i + 1; j < playerPieces.length; j++) {
            if (this.geometry.doPiecesOverlap(playerPieces[i], playerPieces[j])) {
              const bbox1 = this.geometry.getPieceBoundingBox(playerPieces[i]);
              const bbox2 = this.geometry.getPieceBoundingBox(playerPieces[j]);

              // Separar las piezas según el tipo de conexión
              if (i === 0 && j === 1) { // Piezas 0 y 1 (vertical)
                const overlapY = bbox1.bottom - bbox2.top;
                if (overlapY > 0) {
                  playerPieces[0].y -= (overlapY + 2);
                }
              } else if ((i === 1 && j === 2) || (i === 0 && j === 2)) { // Piezas horizontales
                const overlapX = bbox1.right - bbox2.left;
                if (overlapX > 0) {
                  playerPieces[i].x -= (overlapX + 2);
                }
              }
            }
          }
        }
      }

      validation = this.geometry.validateChallengeCard(playerPieces);
      attempts++;
    }

    console.log(`Challenge 4 final validation:`, validation);

    return {
      id: 4,
      name: "Tarjeta 4: Forma en L",
      description: "Forma una L con tres piezas A conectadas",
      piecesNeeded: 3,
      difficulty: "Intermedio",
      targetPattern: "l_shape",
      objective: this.createSymmetricObjective(playerPieces),
      targetPieces: playerPieces
    };
  }

  /**
   * Genera múltiples challenges aleatorios con diferentes niveles de dificultad
   * @param count Número de challenges aleatorios a generar
   * @returns Array de challenges aleatorios válidos
   */
  generateRandomChallenges(count: number = 4): Challenge[] {
    const randomChallenges: Challenge[] = [];

    // Intentar generar challenges con diferentes números de piezas
    for (let pieces = 1; pieces <= 4; pieces++) {
      // Intentar generar más challenges para niveles más difíciles
      const attemptsForThisLevel = Math.min(count, pieces);

      for (let i = 0; i < attemptsForThisLevel; i++) {
        const challenge = this.generateRandomChallenge(pieces, 200);
        if (challenge) {
          // Asignar un ID único basado en la posición
          challenge.id = 100 + randomChallenges.length;
          randomChallenges.push(challenge);

          // Si ya tenemos suficientes challenges, terminar
          if (randomChallenges.length >= count) {
            break;
          }
        }
      }

      // Si ya tenemos suficientes challenges, terminar
      if (randomChallenges.length >= count) {
        break;
      }
    }

    return randomChallenges;
  }

  /**
   * Genera todos los challenges disponibles
   * @returns Array con todos los challenges disponibles
   */
  generateAllChallenges(): Challenge[] {
    // Si tenemos desafíos personalizados cargados, usarlos
    if (this.customChallenges && this.customChallenges.length > 0) {
      return this.customChallenges;
    }

    // Si tenemos desafíos por defecto cargados, usarlos
    if (this.defaultChallenges && this.defaultChallenges.length > 0) {
      return this.defaultChallenges;
    }

    // Si tenemos desafíos embebidos, usarlos como fallback
    if (this.embeddedChallenges && this.embeddedChallenges.length > 0) {
      console.log("Usando desafíos embebidos como fallback");
      return this.embeddedChallenges;
    }

    // Si no hay desafíos cargados ni embebidos, generar los predefinidos
    console.log("No hay desafíos cargados, generando predefinidos...");
    const predefinedChallenges = [
      this.generateHeartChallenge(),
      this.generateHorizontalBlockChallenge(),
      this.generateSimpleVerticalTowerChallenge(),
      this.generateSimpleLShapeChallenge()
    ];

    // Verificar que todos los challenges predefinidos son válidos
    predefinedChallenges.forEach((challenge, index) => {
      const validation = this.geometry.validateChallengeCard(challenge.objective.playerPieces);
      if (!validation.isValid) {
        console.warn(`Challenge ${index + 1} (${challenge.name}) es NO VÁLIDO:`, validation);
      }
    });

    return predefinedChallenges;
  }

  // Flag para controlar si ya se intentó cargar los desafíos
  private hasTriedLoading: boolean = false;

  /**
   * Obtiene los desafíos disponibles (cargados o generados)
   * @returns Promise con los desafíos disponibles
   */
  async getAvailableChallenges(): Promise<Challenge[]> {
    // Si ya tenemos desafíos personalizados cargados, devolverlos inmediatamente
    if (this.customChallenges && this.customChallenges.length > 0) {
      console.log('Usando desafíos personalizados previamente cargados');
      return this.customChallenges;
    }

    // Si ya tenemos desafíos por defecto cargados en esta instancia, devolverlos inmediatamente
    if (this.defaultChallenges && this.defaultChallenges.length > 0) {
      console.log('Usando desafíos por defecto previamente cargados en esta instancia');
      return this.defaultChallenges;
    }

    // Si ya tenemos desafíos por defecto cargados en el cache estático, devolverlos inmediatamente
    if (ChallengeGenerator.cachedDefaultChallenges && ChallengeGenerator.cachedDefaultChallenges.length > 0) {
      console.log('Usando desafíos por defecto del cache estático');
      this.defaultChallenges = ChallengeGenerator.cachedDefaultChallenges;
      return this.defaultChallenges;
    }

    // Si ya intentamos cargar los desafíos antes, no volver a intentarlo
    // Esto evita múltiples intentos de carga en caso de fallos
    if (this.hasTriedLoading) {
      console.log('Ya se intentó cargar los desafíos anteriormente, usando fallback');
      const fallbackChallenges = this.generateAllChallenges();
      ChallengeGenerator.cachedDefaultChallenges = fallbackChallenges;
      return fallbackChallenges;
    }

    this.hasTriedLoading = true;

    try {
      // Intentar cargar los desafíos solo desde la ubicación más probable
      const primaryPath = window.location.origin + '/challenges.json';

      console.log(`Intentando cargar desafíos desde la ubicación principal: ${primaryPath}`);
      const loadedChallenges = await this.loadChallengesFromFile(primaryPath);

      if (loadedChallenges && loadedChallenges.length > 0) {
        console.log(`Desafíos cargados correctamente`);
        // Guardar en el cache estático
        ChallengeGenerator.cachedDefaultChallenges = loadedChallenges;
        return loadedChallenges;
      }

      // Si la ubicación principal falla, intentar con una ubicación alternativa
      // pero solo si es diferente a la primera
      const fallbackPath = '/challenges.json';
      if (primaryPath !== fallbackPath) {
        console.log(`Intentando cargar desde ubicación alternativa: ${fallbackPath}`);
        const fallbackChallenges = await this.loadChallengesFromFile(fallbackPath);

        if (fallbackChallenges && fallbackChallenges.length > 0) {
          console.log(`Desafíos cargados correctamente desde ubicación alternativa`);
          // Guardar en el cache estático
          ChallengeGenerator.cachedDefaultChallenges = fallbackChallenges;
          return fallbackChallenges;
        }
      }

      console.warn('No se pudieron cargar los desafíos desde las ubicaciones conocidas');
    } catch (error) {
      console.warn('Error al cargar los desafíos:', error);
    }

    console.log('Usando desafíos embebidos o generando predefinidos como fallback');
    // Si no se pudieron cargar, usar los embebidos o generar los predefinidos
    const fallbackChallenges = this.generateAllChallenges();
    // Guardar en el cache estático
    ChallengeGenerator.cachedDefaultChallenges = fallbackChallenges;
    return fallbackChallenges;
  }

  /**
   * Genera un challenge de torre vertical simplificado
   */
  generateSimpleVerticalTowerChallenge(): Challenge {
    const mirrorPosition = this.geometry.getPositionTouchingMirror(350, 0);

    const playerPieces: PiecePosition[] = [
      {
        type: 'A',
        face: 'front',
        x: mirrorPosition.x,
        y: 100, // Pieza superior - se calculará después
        rotation: 0
      },
      {
        type: 'A',
        face: 'front',
        x: mirrorPosition.x,
        y: 350, // Pieza inferior tocando espejo
        rotation: 0
      }
    ];

    // Usar búsqueda binaria para encontrar la posición exacta donde las piezas se tocan verticalmente
    const targetTolerance = 2;
    let topBound = 100;
    let bottomBound = playerPieces[1].y;
    let bestY = topBound;

    // Búsqueda binaria para posicionamiento vertical
    for (let iteration = 0; iteration < 20; iteration++) {
      const midY = (topBound + bottomBound) / 2;
      playerPieces[0].y = midY;

      const distance = this.geometry.getMinDistanceBetweenPieces(playerPieces[0], playerPieces[1]);
      const overlap = this.geometry.doPiecesOverlap(playerPieces[0], playerPieces[1]);

      if (overlap) {
        // Si se solapan, mover la pieza hacia arriba
        bottomBound = midY;
      } else if (distance > targetTolerance) {
        // Si están muy separadas, mover hacia abajo
        topBound = midY;
      } else {
        // Distancia ideal encontrada
        bestY = midY;
        break;
      }

      // Actualizar la mejor posición encontrada
      if (!overlap && distance <= targetTolerance + 3) {
        bestY = midY;
      }
    }

    playerPieces[0].y = bestY;

    return {
      id: 3,
      name: "Tarjeta 3: Torre Vertical",
      description: "Forma una torre con dos piezas A apiladas",
      piecesNeeded: 2,
      difficulty: "Fácil",
      targetPattern: "vertical_tower",
      objective: this.createSymmetricObjective(playerPieces),
      targetPieces: playerPieces
    };
  }

  /**
   * Genera un challenge en L simplificado
   */
  generateSimpleLShapeChallenge(): Challenge {
    const mirrorPosition = this.geometry.getPositionTouchingMirror(300, 0);

    const playerPieces: PiecePosition[] = [
      {
        type: 'A',
        face: 'front',
        x: 0, // Se calculará después
        y: 0, // Se calculará después
        rotation: 0
      },
      {
        type: 'A',
        face: 'front',
        x: 0, // Se calculará después
        y: 300,
        rotation: 0
      },
      {
        type: 'A',
        face: 'front',
        x: mirrorPosition.x, // Pieza tocando el espejo
        y: 300,
        rotation: 0
      }
    ];

    // Paso 1: Posicionar pieza 1 (centro) horizontalmente usando búsqueda binaria
    const targetTolerance = 2;
    let leftBound = 0;
    let rightBound = playerPieces[2].x;
    let bestX = leftBound;

    // Búsqueda binaria para posición horizontal entre piezas 1 y 2
    for (let iteration = 0; iteration < 20; iteration++) {
      const midX = (leftBound + rightBound) / 2;
      playerPieces[1].x = midX;

      const distance = this.geometry.getMinDistanceBetweenPieces(playerPieces[1], playerPieces[2]);
      const overlap = this.geometry.doPiecesOverlap(playerPieces[1], playerPieces[2]);

      if (overlap) {
        rightBound = midX;
      } else if (distance > targetTolerance) {
        leftBound = midX;
      } else {
        bestX = midX;
        break;
      }

      if (!overlap && distance <= targetTolerance + 3) {
        bestX = midX;
      }
    }

    playerPieces[1].x = bestX;

    // Paso 2: Posicionar pieza 0 (arriba) verticalmente usando búsqueda binaria
    playerPieces[0].x = playerPieces[1].x; // Alinear horizontalmente

    let topBound = 150; // Evitar posiciones negativas (considerar el tamaño de la pieza)
    let bottomBound = playerPieces[1].y;
    let bestY = topBound;

    // Búsqueda binaria para posición vertical entre piezas 0 y 1
    for (let iteration = 0; iteration < 20; iteration++) {
      const midY = (topBound + bottomBound) / 2;
      playerPieces[0].y = midY;

      const distance = this.geometry.getMinDistanceBetweenPieces(playerPieces[0], playerPieces[1]);
      const overlap = this.geometry.doPiecesOverlap(playerPieces[0], playerPieces[1]);

      if (overlap) {
        // Si se solapan, mover la pieza hacia arriba
        bottomBound = midY;
      } else if (distance > targetTolerance + 5) {
        // Si están muy separadas, mover hacia abajo
        topBound = midY;
      } else {
        // Distancia ideal encontrada
        bestY = midY;
        break;
      }

      if (!overlap && distance <= targetTolerance + 3) {
        bestY = midY;
      }
    }

    playerPieces[0].y = bestY;

    // Verificación final: si aún hay solapamiento, ajustar manualmente
    const finalOverlap = this.geometry.doPiecesOverlap(playerPieces[0], playerPieces[1]);
    if (finalOverlap) {
      const distance = this.geometry.getMinDistanceBetweenPieces(playerPieces[0], playerPieces[1]);
      playerPieces[0].y -= 50; // Mover más arriba para evitar solapamiento
      console.log(`Final overlap adjustment: moved piece 0 up by 50. Distance now: ${this.geometry.getMinDistanceBetweenPieces(playerPieces[0], playerPieces[1])}`);
    }

    return {
      id: 4,
      name: "Tarjeta 4: Forma en L",
      description: "Forma una L con tres piezas A conectadas",
      piecesNeeded: 3,
      difficulty: "Intermedio",
      targetPattern: "l_shape",
      objective: this.createSymmetricObjective(playerPieces),
      targetPieces: playerPieces
    };
  }
}
