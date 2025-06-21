import { GameGeometry, PiecePosition, GameAreaConfig } from './geometry/GameGeometry';

describe('Find Valid Type B Position', () => {
  test('Find a valid position for type B piece', () => {
    const config: GameAreaConfig = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    const geometry = new GameGeometry(config);
    
    // Test different positions for type B pieces
    const testPositions = [330, 350, 370, 380, 400, 420, 450, 480, 500, 520, 550];
    
    for (const x of testPositions) {
      const piece: PiecePosition = {
        type: 'B',
        face: 'front',
        x: x,
        y: 300,
        rotation: 0
      };
      
      const bbox = geometry.getPieceBoundingBox(piece);
      const isTouching = geometry.isPieceTouchingMirror(piece);
      const validation = geometry.validateChallengeCard([piece]);
      
      console.log(`\n--- Testing x=${x} ---`);
      console.log('Bounding box:', bbox);
      console.log('Is touching:', isTouching);
      console.log('Validation:', {
        isValid: validation.isValid,
        touchesMirror: validation.touchesMirror,
        hasReflectionOverlaps: validation.hasReflectionOverlaps,
        piecesInArea: validation.piecesInArea
      });
      
      if (validation.isValid) {
        console.log(`*** FOUND VALID POSITION FOR TYPE B: x=${x} ***`);
        expect(validation.isValid).toBe(true);
        return; // Exit early when we find a valid position
      }
    }
    
    // If we get here, no valid position was found
    console.log('No valid position found for type B piece');
    expect(false).toBe(true); // Force test failure
  });
});