 import { GameGeometry, PiecePosition, GameAreaConfig } from './GameGeometry';

describe('GameGeometry', () => {
  let geometry: GameGeometry;
  let config: GameAreaConfig;

  beforeEach(() => {
    config = {
      width: 600,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    geometry = new GameGeometry(config);
  });

  describe('Reflejo de piezas', () => {
    test('reflectPieceAcrossMirror - pieza simple', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 500,
        y: 300,
        rotation: 0
      };

      const reflected = geometry.reflectPieceAcrossMirror(piece);

      // La posición X reflejada debería ser: 2 * 700 - 500 - 100 = 800
      expect(reflected.x).toBe(800);
      expect(reflected.y).toBe(300); // Y permanece igual
      expect(reflected.type).toBe('A'); // Tipo permanece igual
      expect(reflected.face).toBe('front'); // Cara permanece igual
      expect(reflected.rotation).toBe(0); // Rotación permanece igual
    });

    test('reflectPieceForChallengeCard - pieza simple', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 500,
        y: 300,
        rotation: 90
      };

      const reflected = geometry.reflectPieceForChallengeCard(piece);

      // La posición X reflejada debería ser: 2 * 700 - 500 - 100 = 800
      expect(reflected.x).toBe(800);
      expect(reflected.y).toBe(300); // Y permanece igual
      expect(reflected.type).toBe('A'); // Tipo permanece igual
      expect(reflected.face).toBe('front'); // Cara permanece igual
      expect(reflected.rotation).toBe(90); // Rotación permanece igual
    });

    test('reflectPieceAcrossMirror - pieza tocando el espejo', () => {
      const piece: PiecePosition = {
        type: 'B',
        face: 'back',
        x: 600, // Tocando el espejo (mirrorLineX - pieceSize = 700 - 100 = 600)
        y: 200,
        rotation: 270
      };

      const reflected = geometry.reflectPieceAcrossMirror(piece);

      // La posición X reflejada debería ser: 2 * 700 - 600 - 100 = 700
      expect(reflected.x).toBe(700);
      expect(reflected.y).toBe(200);
      expect(reflected.type).toBe('B');
      expect(reflected.face).toBe('back');
      expect(reflected.rotation).toBe(270);
    });
  });

  describe('Detección de colisiones', () => {
    test('doPiecesOverlap - piezas que se solapan', () => {
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'B', face: 'front', x: 150, y: 150, rotation: 0 };

      expect(geometry.doPiecesOverlap(piece1, piece2)).toBe(true);
    });

    test('doPiecesOverlap - piezas que no se solapan', () => {
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'B', face: 'front', x: 300, y: 300, rotation: 0 };

      expect(geometry.doPiecesOverlap(piece1, piece2)).toBe(false);
    });

    test('detectMirrorCollision - pieza que cruza el espejo', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 650, // Se extiende más allá del espejo
        y: 300,
        rotation: 0
      };

      expect(geometry.detectMirrorCollision(piece)).toBe(true);
    });

    test('detectMirrorCollision - pieza que no cruza el espejo', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 500,
        y: 300,
        rotation: 0
      };

      expect(geometry.detectMirrorCollision(piece)).toBe(false);
    });

    test('detectPieceReflectionOverlap - pieza que se solapa con su reflejo', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 650, // Muy cerca del espejo, debería solaparse con su reflejo
        y: 300,
        rotation: 0
      };

      expect(geometry.detectPieceReflectionOverlap(piece)).toBe(true);
    });

    test('detectPieceReflectionOverlap - pieza que no se solapa con su reflejo', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 400, // Lejos del espejo
        y: 300,
        rotation: 0
      };

      expect(geometry.detectPieceReflectionOverlap(piece)).toBe(false);
    });
  });

  describe('Posicionamiento y geometría', () => {
    test('getPositionTouchingMirror', () => {
      const position = geometry.getPositionTouchingMirror(200);

      expect(position.x).toBe(600); // mirrorLineX - pieceSize = 700 - 100
      expect(position.y).toBe(200);
    });

    test('getHorizontalTouchingPositions', () => {
      const [left, right] = geometry.getHorizontalTouchingPositions(200, 100);

      expect(left.x).toBe(100);
      expect(left.y).toBe(200);
      expect(right.x).toBe(200); // 100 + 100 (sin gap)
      expect(right.y).toBe(200);
    });

    test('getVerticalTouchingPositions', () => {
      const [top, bottom] = geometry.getVerticalTouchingPositions(100, 200);

      expect(top.x).toBe(100);
      expect(top.y).toBe(200);
      expect(bottom.x).toBe(100);
      expect(bottom.y).toBe(300); // 200 + 100 (sin gap)
    });

    test('isPositionInGameArea - posición válida', () => {
      const position = { x: 300, y: 400 };

      expect(geometry.isPositionInGameArea(position)).toBe(true);
    });

    test('isPositionInGameArea - posición fuera del área', () => {
      const position = { x: 650, y: 400 }; // Más allá del límite del espejo

      expect(geometry.isPositionInGameArea(position)).toBe(false);
    });

    test('doPiecesTouch - piezas tocándose exactamente', () => {
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'B', face: 'front', x: 200, y: 100, rotation: 0 };
      
      expect(geometry.doPiecesTouch(piece1, piece2)).toBe(true);
    });

    test('doPiecesTouch - piezas separadas', () => {
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'B', face: 'front', x: 300, y: 100, rotation: 0 };
      
      expect(geometry.doPiecesTouch(piece1, piece2)).toBe(false);
    });
  });

  describe('Validación de challenge cards', () => {
    test('validateChallengeCard - carta válida con una pieza tocando el espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 600, y: 300, rotation: 0 } // Tocando el espejo
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.hasPieceOverlaps).toBe(false);
      expect(validation.hasReflectionOverlaps).toBe(false);
      expect(validation.touchesMirror).toBe(true);
      expect(validation.entersMirror).toBe(false);
      expect(validation.piecesConnected).toBe(true);
      expect(validation.piecesInArea).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('validateChallengeCard - carta inválida: ninguna pieza toca el espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 400, y: 300, rotation: 0 } // No toca el espejo
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.touchesMirror).toBe(false);
      expect(validation.isValid).toBe(false);
    });

    test('validateChallengeCard - carta inválida: pieza se solapa con su reflejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 650, y: 300, rotation: 0 } // Se solapa con su reflejo
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.hasReflectionOverlaps).toBe(true);
      expect(validation.isValid).toBe(false);
    });

    test('validateChallengeCard - carta inválida: pieza entra en el área del espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 680, y: 300, rotation: 0 } // Cruza la línea del espejo
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.entersMirror).toBe(true);
      expect(validation.isValid).toBe(false);
    });

    test('validateChallengeCard - carta válida: dos piezas conectadas, una toca espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 500, y: 300, rotation: 0 }, // Primera pieza
        { type: 'B', face: 'front', x: 600, y: 300, rotation: 0 } // Segunda pieza tocando espejo
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.hasPieceOverlaps).toBe(false);
      expect(validation.hasReflectionOverlaps).toBe(false);
      expect(validation.touchesMirror).toBe(true);
      expect(validation.entersMirror).toBe(false);
      expect(validation.piecesConnected).toBe(true);
      expect(validation.piecesInArea).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('validateChallengeCard - carta inválida: piezas se solapan entre sí', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 500, y: 300, rotation: 0 },
        { type: 'B', face: 'front', x: 550, y: 320, rotation: 0 } // Se solapa con la primera
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.hasPieceOverlaps).toBe(true);
      expect(validation.isValid).toBe(false);
    });

    test('validateChallengeCard - carta inválida: piezas no están conectadas', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 200, y: 200, rotation: 0 }, // Pieza separada
        { type: 'B', face: 'front', x: 600, y: 400, rotation: 0 } // Pieza tocando espejo pero separada
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.piecesConnected).toBe(false);
      expect(validation.isValid).toBe(false);
    });

    test('validateChallengeCard - carta válida: tres piezas en forma de L', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 400, y: 200, rotation: 0 }, // Pieza superior
        { type: 'B', face: 'front', x: 400, y: 300, rotation: 0 }, // Pieza central
        { type: 'A', face: 'front', x: 500, y: 300, rotation: 0 } // Pieza derecha
      ];

      // Ajustar para que una pieza toque el espejo
      pieces[2].x = 600; // La pieza derecha toca el espejo

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.hasPieceOverlaps).toBe(false);
      expect(validation.hasReflectionOverlaps).toBe(false);
      expect(validation.touchesMirror).toBe(true);
      expect(validation.entersMirror).toBe(false);
      expect(validation.piecesConnected).toBe(true);
      expect(validation.piecesInArea).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('validateChallengeCard - carta inválida: pieza fuera del área de juego', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: -50, y: 300, rotation: 0 } // Fuera del área de juego
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.piecesInArea).toBe(false);
      expect(validation.isValid).toBe(false);
    });

    test('arePiecesConnected - una sola pieza debe tocar el espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 600, y: 300, rotation: 0 } // Tocando el espejo
      ];

      expect(geometry.arePiecesConnected(pieces)).toBe(true);
    });

    test('arePiecesConnected - una sola pieza que no toca el espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 400, y: 300, rotation: 0 } // No toca el espejo
      ];

      expect(geometry.arePiecesConnected(pieces)).toBe(false);
    });

    test('arePiecesConnected - múltiples piezas conectadas', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 500, y: 300, rotation: 0 },
        { type: 'B', face: 'front', x: 600, y: 300, rotation: 0 } // Conectadas horizontalmente
      ];

      expect(geometry.arePiecesConnected(pieces)).toBe(true);
    });

    test('arePiecesConnected - múltiples piezas no conectadas', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 200, y: 200, rotation: 0 },
        { type: 'B', face: 'front', x: 400, y: 400, rotation: 0 } // Separadas
      ];

      expect(geometry.arePiecesConnected(pieces)).toBe(false);
    });

    test('doPiecesFitInChallengeArea - piezas que caben', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 300, y: 300, rotation: 0 }
      ];

      expect(geometry.doPiecesFitInChallengeArea(pieces)).toBe(true);
    });

    test('doPiecesFitInChallengeArea - pieza fuera del área', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 750, y: 300, rotation: 0 } // Fuera del área de juego
      ];

      expect(geometry.doPiecesFitInChallengeArea(pieces)).toBe(false);
    });
  });

  describe('Validación de patrones (legacy)', () => {
    test('validatePattern - patrón válido', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 },
        { type: 'A', face: 'front', x: 200, y: 100, rotation: 0 } // Tocándose
      ];

      const validation = geometry.validatePattern(pieces);

      expect(validation.hasOverlaps).toBe(false);
      expect(validation.allPiecesTouch).toBe(true);
      expect(validation.inGameArea).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('validatePattern - piezas que se solapan', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 },
        { type: 'A', face: 'front', x: 150, y: 150, rotation: 0 } // Solapándose
      ];

      const validation = geometry.validatePattern(pieces);

      expect(validation.hasOverlaps).toBe(true);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Detección de interacción con espejo', () => {
    test('isPieceTouchingMirror - pieza tocando exactamente el espejo', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 600, // mirrorLineX - pieceSize = 700 - 100 = 600
        y: 300,
        rotation: 0
      };

      expect(geometry.isPieceTouchingMirror(piece)).toBe(true);
    });

    test('isPieceTouchingMirror - pieza no tocando el espejo', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 500,
        y: 300,
        rotation: 0
      };

      expect(geometry.isPieceTouchingMirror(piece)).toBe(false);
    });

    test('isPieceTouchingReflection - pieza tocando su reflejo perfectamente', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 600, // Tocando el espejo
        y: 300,
        rotation: 0
      };

      expect(geometry.isPieceTouchingReflection(piece)).toBe(true);
    });

    test('isPieceTouchingReflection - pieza no tocando su reflejo', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 400, // Lejos del espejo
        y: 300,
        rotation: 0
      };

      expect(geometry.isPieceTouchingReflection(piece)).toBe(false);
    });

    test('getDistanceToMirror - pieza tocando el espejo', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 600,
        y: 300,
        rotation: 0
      };

      const distance = geometry.getDistanceToMirror(piece);
      expect(distance).toBe(0);
    });

    test('getDistanceToMirror - pieza alejada del espejo', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 500,
        y: 300,
        rotation: 0
      };

      const distance = geometry.getDistanceToMirror(piece);
      expect(distance).toBe(100); // 700 - 600 = 100
    });
  });

  describe('Restricciones de posición', () => {
    test('constrainPiecePosition - pieza dentro de límites', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 300,
        y: 300,
        rotation: 0
      };

      const constrained = geometry.constrainPiecePosition(piece, 1400, 1000);

      expect(constrained.x).toBe(300);
      expect(constrained.y).toBe(300);
    });

    test('constrainPiecePosition - pieza fuera del límite izquierdo', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: -50,
        y: 300,
        rotation: 0
      };

      const constrained = geometry.constrainPiecePosition(piece, 1400, 1000);

      expect(constrained.x).toBeGreaterThanOrEqual(0);
    });

    test('constrainPiecePosition - pieza que cruza el espejo', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 650,
        y: 300,
        rotation: 0
      };

      const constrained = geometry.constrainPiecePosition(piece, 1400, 1000, true);

      expect(constrained.x).toBeLessThanOrEqual(600); // No debe cruzar el espejo
    });
  });

  describe('Cálculos de bounding box', () => {
    test('getPieceBoundingBox - pieza sin rotación', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100,
        y: 200,
        rotation: 0
      };

      const bbox = geometry.getPieceBoundingBox(piece);

      expect(bbox.left).toBeLessThanOrEqual(bbox.right);
      expect(bbox.top).toBeLessThanOrEqual(bbox.bottom);
      expect(bbox.right - bbox.left).toBeGreaterThan(0);
      expect(bbox.bottom - bbox.top).toBeGreaterThan(0);
    });

    test('getPieceBoundingBox - pieza rotada', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100,
        y: 200,
        rotation: 90
      };

      const bbox = geometry.getPieceBoundingBox(piece);

      expect(bbox.left).toBeLessThanOrEqual(bbox.right);
      expect(bbox.top).toBeLessThanOrEqual(bbox.bottom);
    });

    test('getPieceBoundingBox - pieza tipo B (volteada)', () => {
      const piece: PiecePosition = {
        type: 'B',
        face: 'front',
        x: 100,
        y: 200,
        rotation: 0
      };

      const bbox = geometry.getPieceBoundingBox(piece);

      expect(bbox.left).toBeLessThanOrEqual(bbox.right);
      expect(bbox.top).toBeLessThanOrEqual(bbox.bottom);
    });
  });

  describe('Geometría precisa de piezas', () => {
    test('getPieceVertices - obtiene vértices transformados correctamente', () => {
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 100,
        y: 200,
        rotation: 0
      };

      const vertices = geometry.getPieceVertices(piece);

      // Debe tener el número correcto de vértices (8, incluyendo el punto de cierre)
      expect(vertices.length).toBe(8);
      
      // Todos los vértices deben ser arrays de 2 números
      vertices.forEach(vertex => {
        expect(vertex.length).toBe(2);
        expect(typeof vertex[0]).toBe('number');
        expect(typeof vertex[1]).toBe('number');
      });

      // Los vértices deben estar alrededor del centro de la pieza
      const centerX = piece.x + 50; // pieceSize / 2
      const centerY = piece.y + 50;
      
      vertices.forEach(vertex => {
        const distanceFromCenter = Math.sqrt(
          Math.pow(vertex[0] - centerX, 2) + Math.pow(vertex[1] - centerY, 2)
        );
        expect(distanceFromCenter).toBeLessThan(200); // Máximo razonable
      });
    });

    test('getPieceVertices - pieza tipo B tiene vertices volteados', () => {
      const pieceA: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const pieceB: PiecePosition = { type: 'B', face: 'front', x: 100, y: 100, rotation: 0 };

      const verticesA = geometry.getPieceVertices(pieceA);
      const verticesB = geometry.getPieceVertices(pieceB);

      // Los vértices deben ser diferentes debido al volteo horizontal
      expect(verticesA).not.toEqual(verticesB);
    });

    test('getMinDistanceBetweenPieces - piezas que se tocan exactamente', () => {
      // Crear dos piezas que deberían tocarse según el triángulo derecho de una y el isósceles de la otra
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'A', face: 'front', x: 260, y: 100, rotation: 0 };

      const distance = geometry.getMinDistanceBetweenPieces(piece1, piece2);

      // La distancia debe ser muy pequeña si se están tocando
      expect(distance).toBeLessThan(10);
    });

    test('getMinDistanceBetweenPieces - piezas separadas', () => {
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'A', face: 'front', x: 400, y: 100, rotation: 0 };

      const distance = geometry.getMinDistanceBetweenPieces(piece1, piece2);

      // Las piezas separadas deben tener una distancia significativa
      expect(distance).toBeGreaterThan(50);
    });

    test('doPiecesOverlap preciso - piezas que se solapan realmente', () => {
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'A', face: 'front', x: 120, y: 120, rotation: 0 };

      expect(geometry.doPiecesOverlap(piece1, piece2)).toBe(true);
    });

    test('doPiecesOverlap preciso - piezas que solo se tocan (no se solapan)', () => {
      // Usar la función de búsqueda binaria para encontrar la posición exacta
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'A', face: 'front', x: 260, y: 100, rotation: 0 };

      const overlap = geometry.doPiecesOverlap(piece1, piece2);
      const distance = geometry.getMinDistanceBetweenPieces(piece1, piece2);

      // No deben solaparse pero deben estar cerca
      expect(overlap).toBe(false);
      expect(distance).toBeLessThan(10);
    });

    test('doPiecesTouch preciso - detecta cuando las piezas se tocan realmente', () => {
      // Posicionar piezas para que sus geometrías complejas se toquen
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'A', face: 'front', x: 260, y: 100, rotation: 0 };

      const touching = geometry.doPiecesTouch(piece1, piece2);
      const overlapping = geometry.doPiecesOverlap(piece1, piece2);
      const distance = geometry.getMinDistanceBetweenPieces(piece1, piece2);

      console.log(`Piezas en posición touch test: distance=${distance}, touching=${touching}, overlapping=${overlapping}`);

      // Deben tocarse pero no solaparse
      expect(touching).toBe(true);
      expect(overlapping).toBe(false);
    });
  });
});
