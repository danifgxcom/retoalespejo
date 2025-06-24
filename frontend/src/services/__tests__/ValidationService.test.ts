import { ValidationService, PiecePosition } from '../ValidationService';

describe('ValidationService', () => {
  describe('calculateCentroid', () => {
    it('should return origin for empty array', () => {
      expect(ValidationService.calculateCentroid([])).toEqual({ x: 0, y: 0 });
    });

    it('should calculate centroid correctly', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 0, y: 0, rotation: 0 },
        { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 }
      ];
      expect(ValidationService.calculateCentroid(pieces)).toEqual({ x: 50, y: 50 });
    });
  });

  describe('normalizePiecesToCentroid', () => {
    it('should normalize pieces relative to centroid', () => {
      const pieces: PiecePosition[] = [
        { type: 'A', face: 'front', x: 0, y: 0, rotation: 0 },
        { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 }
      ];
      const normalized = ValidationService.normalizePiecesToCentroid(pieces);
      
      expect(normalized[0]).toEqual({ type: 'A', face: 'front', x: -50, y: -50, rotation: 0 });
      expect(normalized[1]).toEqual({ type: 'A', face: 'front', x: 50, y: 50, rotation: 0 });
    });
  });

  describe('checkRelativePositions', () => {
    it('should validate correct relative positions', () => {
      const placed: PiecePosition[] = [
        { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 }
      ];
      const target: PiecePosition[] = [
        { type: 'A', face: 'front', x: 200, y: 200, rotation: 0 }
      ];
      
      const result = ValidationService.checkRelativePositions(placed, target);
      expect(result.isCorrect).toBe(true);
    });

    it('should fail when piece is missing', () => {
      const placed: PiecePosition[] = [];
      const target: PiecePosition[] = [
        { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 }
      ];
      
      const result = ValidationService.checkRelativePositions(placed, target);
      expect(result.isCorrect).toBe(false);
      expect(result.message).toContain('Falta pieza');
    });

    it('should fail when rotation is wrong', () => {
      const placed: PiecePosition[] = [
        { type: 'A', face: 'front', x: 100, y: 100, rotation: 90 }
      ];
      const target: PiecePosition[] = [
        { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 }
      ];
      
      const result = ValidationService.checkRelativePositions(placed, target);
      expect(result.isCorrect).toBe(false);
      expect(result.message).toContain('rotación diferente');
    });
  });

  describe('validateSolution', () => {
    const mockChallenge = {
      piecesNeeded: 1,
      objective: {
        playerPieces: [
          { type: 'A', face: 'front', x: 100, y: 100, rotation: 0 }
        ]
      }
    };

    it('should validate correct solution', () => {
      const pieces = [
        { type: 'A', face: 'front', x: 100, y: 100, rotation: 0, placed: true, y: 100 }
      ];
      
      const result = ValidationService.validateSolution(pieces, mockChallenge);
      expect(result.isCorrect).toBe(true);
    });

    it('should fail when wrong number of pieces', () => {
      const pieces = [];
      
      const result = ValidationService.validateSolution(pieces, mockChallenge);
      expect(result.isCorrect).toBe(false);
      expect(result.message).toContain('Necesitas 1 piezas');
    });
  });
});