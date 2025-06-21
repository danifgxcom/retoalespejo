import { GameGeometry, PiecePosition, GameAreaConfig } from './GameGeometry';

describe('Debug Type B Position for Mirror Touching', () => {
  test('Find correct position for type B piece touching mirror', () => {
    const config: GameAreaConfig = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    const geometry = new GameGeometry(config);
    
    // Get correct position for type B piece
    const correctPositionB = geometry.getPositionTouchingMirror(300, 0, 'B');
    console.log('Correct position for type B:', correctPositionB);
    
    const pieceB: PiecePosition = {
      type: 'B',
      face: 'front',
      x: correctPositionB.x,
      y: correctPositionB.y,
      rotation: 0
    };
    
    const bboxB = geometry.getPieceBoundingBox(pieceB);
    const isTouchingB = geometry.isPieceTouchingMirror(pieceB);
    const validationB = geometry.validateChallengeCard([pieceB]);
    
    console.log('Type B piece:', pieceB);
    console.log('Type B bounding box:', bboxB);
    console.log('Type B is touching mirror:', isTouchingB);
    console.log('Type B validation:', validationB);
    
    expect(isTouchingB).toBe(true);
    expect(validationB.isValid).toBe(true);
  });
});