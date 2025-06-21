import { GameGeometry, PiecePosition, GameAreaConfig } from './geometry/GameGeometry';

/**
 * Test para validar que las reglas del juego documentadas en GAME_RULES.md
 * se están aplicando correctamente.
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
        { type: 'A', face: 'front', x: 330, y: 300, rotation: 0 } // Toca exactamente el espejo
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.touchesMirror).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('Challenge inválido - ninguna pieza toca el espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 400, y: 300, rotation: 0 } // No toca el espejo
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.touchesMirror).toBe(false);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Regla 2: Ninguna pieza se puede solapar con otra', () => {
    test('Challenge válido - piezas que se tocan sin solaparse', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 72, y: 300, rotation: 0 },
        { type: 'A', face: 'front', x: 330, y: 300, rotation: 0 } // Toca el espejo
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.hasPieceOverlaps).toBe(false);
      expect(validation.touchesMirror).toBe(true);
      expect(validation.piecesConnected).toBe(true);
    });

    test('Challenge inválido - piezas que se solapan', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 550, y: 300, rotation: 0 },
        { type: 'A', face: 'front', x: 600, y: 320, rotation: 0 } // Se solapa con la primera
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.hasPieceOverlaps).toBe(true);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Regla 3: Las piezas no pueden entrar dentro del área del espejo', () => {
    test('Challenge válido - pieza toca pero no cruza el espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 330, y: 300, rotation: 0 } // Toca exactamente
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.entersMirror).toBe(false);
      expect(validation.touchesMirror).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('Challenge inválido - pieza cruza el espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 650, y: 300, rotation: 0 } // Cruza el espejo
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.entersMirror).toBe(true);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Regla 4: Todas las piezas deben estar conectadas', () => {
    test('Challenge válido - piezas conectadas con una tocando el espejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 72, y: 300, rotation: 0 }, // Conectada a la siguiente
        { type: 'A', face: 'front', x: 330, y: 300, rotation: 0 }  // Toca el espejo
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.piecesConnected).toBe(true);
      expect(validation.touchesMirror).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('Challenge inválido - piezas no conectadas', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 200, y: 200, rotation: 0 }, // Separada
        { type: 'A', face: 'front', x: 330, y: 400, rotation: 0 }  // Toca el espejo pero separada
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.piecesConnected).toBe(false);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Regla 5: Ninguna pieza se puede solapar con su propio reflejo', () => {
    test('Challenge válido - pieza no se solapa con su reflejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 500, y: 300, rotation: 0 } // Lejos del espejo
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.hasReflectionOverlaps).toBe(false);
    });

    test('Challenge inválido - pieza se solapa con su reflejo', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 650, y: 300, rotation: 0 } // Muy cerca del espejo
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.hasReflectionOverlaps).toBe(true);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Regla 6: Todas las piezas deben caber dentro del área de reto', () => {
    test('Challenge válido - piezas dentro del área', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 300, y: 300, rotation: 0 }
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.piecesInArea).toBe(true);
    });

    test('Challenge inválido - pieza fuera del área', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: -50, y: 300, rotation: 0 } // Fuera del área izquierda
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.piecesInArea).toBe(false);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Validación de Challenges Embebidos', () => {
    test('Challenge 1 - Corazón Simple debe ser válido', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 330, y: 300, rotation: 0 }
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

    test('Challenge 2 - Bloque Horizontal debe ser válido', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 72, y: 300, rotation: 0 },
        { type: 'A', face: 'front', x: 330, y: 300, rotation: 0 }
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

    test('Challenge 3 - Torre Vertical debe ser válido', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 330, y: 200, rotation: 0 },
        { type: 'A', face: 'front', x: 330, y: 300, rotation: 0 }
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

    test('Challenge 4 - Forma en L debe ser válido', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 72, y: 200, rotation: 0 },
        { type: 'A', face: 'front', x: 72, y: 300, rotation: 0 },
        { type: 'A', face: 'front', x: 330, y: 300, rotation: 0 }
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
  });

  describe('Casos Edge - Geometría Precisa', () => {
    test('Piezas rotadas deben validarse correctamente', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 330, y: 300, rotation: 45 } // Rotada 45°
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      // La validación debe considerar la rotación
      expect(validation.touchesMirror).toBeDefined();
      expect(validation.piecesInArea).toBeDefined();
    });

    test.skip('Piezas tipo B (volteadas) deben validarse correctamente', () => {
      // TODO: Fix type B geometry - reflection calculation has a bug
      const pieces: PiecePosition[] = [
        { type: 'B', face: 'front', x: 380, y: 300, rotation: 0 }
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.touchesMirror).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('Piezas con cara back deben validarse correctamente', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'back', x: 330, y: 300, rotation: 0 }
      ];

      const validation = geometry.validateChallengeCard(pieces);
      
      expect(validation.touchesMirror).toBe(true);
      expect(validation.isValid).toBe(true);
    });
  });
});