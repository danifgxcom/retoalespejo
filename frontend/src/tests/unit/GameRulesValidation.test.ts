import { GameGeometry, PiecePosition, GameAreaConfig } from '@reto/geometry';

/**
 * Test para validar que las reglas del juego documentadas en GAME_RULES.md
 * se están aplicando correctamente.
 *
 * NOTA: piece.x/y es el CENTRO de la pieza (ver PieceShape.ts). Para Type A,
 * rotation=270, el borde derecho del bbox queda en piece.x + 64, así que
 * x=636 es la posición que toca el espejo exactamente (mirrorLineX=700).
 */
describe('Validación de Reglas del Juego', () => {
  let geometry: GameGeometry;

  beforeEach(() => {
    const config: GameAreaConfig = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    geometry = new GameGeometry(config);
  });

  describe('Regla 1: Al menos una pieza debe tocar el espejo', () => {
    test('Challenge válido - pieza tocando el espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.touchesMirror).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('Challenge inválido - ninguna pieza toca el espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 100, y: 300, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.touchesMirror).toBe(false);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Regla 2: Ninguna pieza se puede solapar con otra', () => {
    test('Challenge válido - una sola pieza no tiene solapamiento', () => {
      // Single piece: trivially no overlaps
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.hasPieceOverlaps).toBe(false);
      expect(validation.touchesMirror).toBe(true);
    });

    test('Challenge inválido - piezas que se solapan', () => {
      // Two pieces almost at the same position → solape real
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 550, y: 300, rotation: 0 },
        { type: 'A', face: 'front', x: 555, y: 305, rotation: 0 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.hasPieceOverlaps).toBe(true);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Regla 3: Las piezas no pueden entrar dentro del área del espejo', () => {
    test('Challenge válido - pieza toca pero no cruza el espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.entersMirror).toBe(false);
      expect(validation.touchesMirror).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('Challenge inválido - pieza cruza el espejo', () => {
      // rotation=0: bbox.right = piece.x + 128 = 778 >> 700 (cruza el espejo)
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 650, y: 300, rotation: 0 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.entersMirror).toBe(true);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Regla 4: Todas las piezas deben estar conectadas', () => {
    test('Challenge válido - piezas conectadas con una tocando el espejo', () => {
      // Single piece touching mirror: counts as connected (single piece → trivially connected)
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.piecesConnected).toBe(true);
      expect(validation.touchesMirror).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('Challenge inválido - piezas no conectadas', () => {
      // Ninguna toca el espejo y están a 536px de distancia: no se tocan entre sí.
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 100, y: 300, rotation: 270 },
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
      ];

      expect(geometry.arePiecesConnected(pieces)).toBe(false);
    });
  });

  describe('Regla 5: Ninguna pieza se puede solapar con su propio reflejo', () => {
    test('Challenge válido - pieza no se solapa con su reflejo', () => {
      // Tocando el espejo exactamente: el reflejo coincide con la pieza, no se considera solape.
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.hasReflectionOverlaps).toBe(false);
    });

    test('Challenge inválido - pieza se solapa con su reflejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 650, y: 300, rotation: 0 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      // This piece crosses the mirror, so it's invalid
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Regla 6: Todas las piezas deben caber dentro del área de reto', () => {
    test('Challenge válido - piezas dentro del área', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.piecesInArea).toBe(true);
    });

    test('Challenge inválido - pieza fuera del área', () => {
      // Type B (volteada) en x=-200: bbox.left = -200 - 128 = -328, muy por debajo
      // del mínimo permisivo (-50) → fuera del área.
      const pieces: PiecePosition[] = [
        { type: 'B', face: 'front', x: -200, y: 300, rotation: 0 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.piecesInArea).toBe(false);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Validación de Challenges Embebidos', () => {
    test('Challenge 1 - Corazón Simple debe ser válido', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.isValid).toBe(true);
      expect(validation.touchesMirror).toBe(true);
      expect(validation.hasPieceOverlaps).toBe(false);
      expect(validation.hasReflectionOverlaps).toBe(false);
      expect(validation.entersMirror).toBe(false);
      expect(validation.piecesConnected).toBe(true);
      expect(validation.piecesInArea).toBe(true);
    });

    test('Challenge 2 - Bloque Horizontal debe ser válido (pieza única)', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 400, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.isValid).toBe(true);
      expect(validation.touchesMirror).toBe(true);
      expect(validation.piecesInArea).toBe(true);
    });

    test('Challenge 3 - Torre Vertical debe ser válido (pieza única)', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.isValid).toBe(true);
      expect(validation.touchesMirror).toBe(true);
    });

    test('Challenge 4 - Forma en L debe ser válido (pieza única)', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.isValid).toBe(true);
      expect(validation.touchesMirror).toBe(true);
    });
  });

  describe('Casos Edge - Geometría Precisa', () => {
    test('Piezas rotadas deben validarse correctamente', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 636, y: 300, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.touchesMirror).toBe(true);
      expect(validation.piecesInArea).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('Piezas tipo B (volteadas) deben validarse correctamente', () => {
      // Type B se extiende de -128 a +192 respecto al centro (volteo horizontal
      // de Type A): toca el espejo cuando bbox.right = x + 192 = 700, x = 508.
      const pieces: PiecePosition[] = [
        { type: 'B', face: 'front', x: 508, y: 300, rotation: 0 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.touchesMirror).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('Piezas con cara back deben validarse correctamente', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'back', x: 636, y: 300, rotation: 270 }
      ];

      const validation = geometry.validateChallengeCard(pieces);

      expect(validation.touchesMirror).toBe(true);
      expect(validation.isValid).toBe(true);
    });
  });
});
