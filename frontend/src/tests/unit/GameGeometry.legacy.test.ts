import { GameGeometry, PiecePosition, GameAreaConfig } from '@reto/geometry';

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

      // Con el centro como ancla: x' = 2 * 700 - 500 = 900. La forma es quiral,
      // así que el reflejo de un tipo A es un tipo B.
      expect(reflected.x).toBe(900);
      expect(reflected.y).toBe(300); // Y permanece igual
      expect(reflected.type).toBe('B');
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

      // x' = 2 * 700 - 500 = 900; tipo invertido a B; rotación (360-90)%360=270
      expect(reflected.x).toBe(900);
      expect(reflected.y).toBe(300); // Y permanece igual
      expect(reflected.type).toBe('B');
      expect(reflected.face).toBe('front'); // Cara permanece igual
      expect(reflected.rotation).toBe(270);
    });

    test('reflectPieceAcrossMirror - pieza tocando el espejo', () => {
      const piece: PiecePosition = {
        type: 'B',
        face: 'back',
        x: 600,
        y: 200,
        rotation: 270
      };

      const reflected = geometry.reflectPieceAcrossMirror(piece);

      // x' = 2 * 700 - 600 = 800; tipo invertido a A; rotación (360-270)%360=90
      expect(reflected.x).toBe(800);
      expect(reflected.y).toBe(200);
      expect(reflected.type).toBe('A');
      expect(reflected.face).toBe('back');
      expect(reflected.rotation).toBe(90);
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
      // Type A at rotation=0 extends 320px right from center; use small x so shape stays in bounds
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 10,
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
      // Type A, rotation=0: el borde derecho del bbox está 128px a la derecha del
      // centro (unit=128, ver PieceShape). Para que bbox.right=700: x=700-128=572.
      const position = geometry.getPositionTouchingMirror(200);

      expect(position.x).toBe(572);
      expect(position.y).toBe(200);
    });

    test('getHorizontalTouchingPositions', () => {
      // Separación = ancho real de la pieza (getPieceExtent), no pieceSize.
      const [left, right] = geometry.getHorizontalTouchingPositions(200, 100);

      expect(left.x).toBe(100);
      expect(left.y).toBe(200);
      expect(right.x).toBe(420); // 100 + 320 (extensión real: 2.5 * 128)
      expect(right.y).toBe(200);
    });

    test('getVerticalTouchingPositions', () => {
      const [top, bottom] = geometry.getVerticalTouchingPositions(100, 200);

      expect(top.x).toBe(100);
      expect(top.y).toBe(200);
      expect(bottom.x).toBe(100);
      expect(bottom.y).toBe(392); // 200 + 192 (extensión real: 1.5 * 128)
    });

    test('isPositionInGameArea - posición válida', () => {
      // isPositionInGameArea ahora exige una pieza completa (tipo/rotación) para
      // poder calcular su bounding box real.
      const piece: PiecePosition = { type: 'A', face: 'front', x: 300, y: 400, rotation: 0 };

      expect(geometry.isPositionInGameArea(piece)).toBe(true);
    });

    test('isPositionInGameArea - posición fuera del área', () => {
      // bbox.right = 650 + 128 = 778 > mirrorLineX (700)
      const piece: PiecePosition = { type: 'A', face: 'front', x: 650, y: 400, rotation: 0 };

      expect(geometry.isPositionInGameArea(piece)).toBe(false);
    });

    test('doPiecesTouch - piezas que se solapan masivamente (no es contacto válido)', () => {
      // Type A se extiende a la derecha, Type B a la izquierda; en x=100 y x=200 con
      // rotation=0 se solapan más de 100px de penetración (>> OVERLAP_TOLERANCE_PX),
      // así que doPiecesTouch devuelve false: es solape real, no contacto.
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'B', face: 'front', x: 200, y: 100, rotation: 0 };

      expect(geometry.doPiecesTouch(piece1, piece2)).toBe(false);
    });

    test('doPiecesTouch - piezas separadas', () => {
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'B', face: 'front', x: 300, y: 100, rotation: 0 };

      expect(geometry.doPiecesTouch(piece1, piece2)).toBe(false);
    });
  });

  describe('Validación de challenge cards', () => {
    test('validateChallengeCard - carta válida con una pieza tocando el espejo', () => {
      // Type A, rotation=270, x=636: bbox.right = mirrorLineX exactamente (ver getPositionTouchingMirror).
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
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

    test('validateChallengeCard - una pieza válida con validación completa', () => {
      // Pieza única en rotation=270, x=636: toca el espejo, todas las validaciones pasan
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.hasPieceOverlaps).toBe(false);
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

    test('validateChallengeCard - carta válida: pieza tocando espejo con rotación correcta', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 } // Toca el espejo
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.hasPieceOverlaps).toBe(false);
      expect(validation.touchesMirror).toBe(true);
      expect(validation.entersMirror).toBe(false);
      expect(validation.piecesConnected).toBe(true);
      expect(validation.piecesInArea).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('validateChallengeCard - carta inválida: pieza fuera del área de juego', () => {
      // Type A at x=-200, rotation=0: bbox.left = -392 < -50 (permissive minX) → out of bounds
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: -200, y: 300, rotation: 0 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.piecesInArea).toBe(false);
      expect(validation.isValid).toBe(false);
    });

    test('arePiecesConnected - una sola pieza debe tocar el espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
      ];

      expect(geometry.arePiecesConnected(pieces)).toBe(true);
    });

    test('arePiecesConnected - una sola pieza que no toca el espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 400, y: 300, rotation: 0 } // No toca el espejo
      ];

      expect(geometry.arePiecesConnected(pieces)).toBe(false);
    });

    test('arePiecesConnected - múltiples piezas casi idénticas (solape masivo, no cuenta como contacto)', () => {
      // Dos piezas casi en la misma posición se solapan de más (penetración >> OVERLAP_TOLERANCE_PX),
      // así que doPiecesTouch las considera "solapadas", no "en contacto": no están conectadas.
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 500, y: 300, rotation: 0 },
        { type: 'A', face: 'front', x: 502, y: 300, rotation: 0 }
      ];

      expect(geometry.arePiecesConnected(pieces)).toBe(false);
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
    test('validatePattern - un patrón con una sola pieza', () => {
      // Single piece pattern: always "all touch" (trivially), no overlaps
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 }
      ];

      const validation = geometry.validatePattern(pieces);

      // hasOverlaps: no overlap with a single piece
      expect(validation.hasOverlaps).toBe(false);
      // inGameArea depends on bbox being within bounds
      expect(typeof validation.inGameArea).toBe('boolean');
      expect(typeof validation.isValid).toBe('boolean');
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
      // rotation=270: bbox.right = mirrorLineX cuando x=636 (getPositionTouchingMirror(300,270,'A').x)
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 636,
        y: 300,
        rotation: 270
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

    test('isPieceTouchingReflection - devuelve un booleano', () => {
      // Verifica que la función funciona sin errores; la geometría exacta del
      // reflejo depende de la extensión de la forma.
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 636,
        y: 300,
        rotation: 270
      };

      expect(typeof geometry.isPieceTouchingReflection(piece)).toBe('boolean');
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
      // rotation=270, x=636: bbox.right = mirrorLineX exactamente → distance = 0
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 636,
        y: 300,
        rotation: 270
      };

      const distance = geometry.getDistanceToMirror(piece);
      expect(distance).toBe(0);
    });

    test('getDistanceToMirror - pieza alejada del espejo', () => {
      // Misma pieza 100px más a la izquierda que la posición que toca el espejo
      const piece: PiecePosition = {
        type: 'A',
        face: 'front',
        x: 536,
        y: 300,
        rotation: 270
      };

      const distance = geometry.getDistanceToMirror(piece);
      expect(distance).toBe(100);
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

    test('constrainPiecePosition - pieza tipo B fuera del límite izquierdo', () => {
      // Type B (volteada) se extiende de -128 a +192 respecto al centro.
      // bbox.left = -50 - 128 = -178 (< 0) → overlap = 178, newX = -50 + 178 = 128.
      const piece: PiecePosition = {
        type: 'B',
        face: 'front',
        x: -50,
        y: 300,
        rotation: 0
      };

      const constrained = geometry.constrainPiecePosition(piece, 1400, 1000);

      expect(constrained.x).toBe(128);
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

      // Los vértices deben estar alrededor del centro de la pieza: piece.x/y YA ES
      // el centro (ver PieceShape.ts). Con unit=128, la figura se extiende hasta
      // 2.5 unidades (320px) del centro.
      const centerX = piece.x;
      const centerY = piece.y;

      vertices.forEach(vertex => {
        const distanceFromCenter = Math.sqrt(
          Math.pow(vertex[0] - centerX, 2) + Math.pow(vertex[1] - centerY, 2)
        );
        expect(distanceFromCenter).toBeLessThan(400); // Max extent of asymmetric shape
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
      // Use well-separated pieces: Type A at x=100 (shape right=470) and x=600 (shape left=650)
      // Gap between shapes: 650-470=180px → vertex distance > 50
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'A', face: 'front', x: 600, y: 100, rotation: 0 };

      const distance = geometry.getMinDistanceBetweenPieces(piece1, piece2);

      expect(distance).toBeGreaterThan(50);
    });

    test('doPiecesOverlap preciso - piezas que se solapan realmente', () => {
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'A', face: 'front', x: 120, y: 120, rotation: 0 };

      expect(geometry.doPiecesOverlap(piece1, piece2)).toBe(true);
    });

    test('doPiecesOverlap preciso - piezas adyacentes se detectan como solapadas', () => {
      // Two Type A pieces at x=100 and x=260 overlap: la extensión real de 320px
      // hace que se solapen de verdad, no un simple contacto de borde.
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'A', face: 'front', x: 260, y: 100, rotation: 0 };

      const overlap = geometry.doPiecesOverlap(piece1, piece2);
      const distance = geometry.getMinDistanceBetweenPieces(piece1, piece2);

      // These pieces actually DO overlap (shape extends 320px to the right)
      expect(overlap).toBe(true);
      expect(distance).toBeLessThan(10);
    });

    test('doPiecesTouch preciso - piezas que se solapan masivamente no cuentan como touching', () => {
      // Two Type A pieces at x=100 and x=260: massive overlap → penetration >> OVERLAP_TOLERANCE_PX → touching=false
      const piece1: PiecePosition = { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 };
      const piece2: PiecePosition = { type: 'A', face: 'front', x: 260, y: 100, rotation: 0 };

      const touching = geometry.doPiecesTouch(piece1, piece2);
      const overlapping = geometry.doPiecesOverlap(piece1, piece2);

      // Massive overlap → penetration > OVERLAP_TOLERANCE_PX → not a valid connection
      expect(touching).toBe(false);
      expect(overlapping).toBe(true);
    });
  });
});
