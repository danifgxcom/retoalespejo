import { GameGeometry, PiecePosition, GameAreaConfig } from './GameGeometry';

describe('Debug Correct Position for Mirror Touching', () => {
  test('Find the actual correct position for touching mirror', () => {
    const config: GameAreaConfig = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    const geometry = new GameGeometry(config);
    
    // Use the actual function to get the correct position
    const correctPosition = geometry.getPositionTouchingMirror(300, 0, 'A');
    console.log('Correct position from getPositionTouchingMirror:', correctPosition);
    
    // Test this position
    const piece: PiecePosition = {
      type: 'A',
      face: 'front',
      x: correctPosition.x,
      y: correctPosition.y,
      rotation: 0
    };
    
    const bbox = geometry.getPieceBoundingBox(piece);
    const isTouching = geometry.isPieceTouchingMirror(piece);
    const validation = geometry.validateChallengeCard([piece]);
    
    console.log('Piece:', piece);
    console.log('Bounding box:', bbox);
    console.log('Is touching mirror:', isTouching);
    console.log('Distance to mirror:', Math.abs(bbox.right - config.mirrorLineX));
    console.log('Full validation:', validation);
    
    // Test other positions for comparison
    console.log('\n--- Testing position x: 330 ---');
    const piece330 = { ...piece, x: 330 };
    const bbox330 = geometry.getPieceBoundingBox(piece330);
    const isTouching330 = geometry.isPieceTouchingMirror(piece330);
    console.log('Bounding box at x=330:', bbox330);
    console.log('Is touching at x=330:', isTouching330);
    console.log('Distance to mirror at x=330:', Math.abs(bbox330.right - config.mirrorLineX));
    
    console.log('\n--- Testing position x: 600 ---');
    const piece600 = { ...piece, x: 600 };
    const bbox600 = geometry.getPieceBoundingBox(piece600);
    const isTouching600 = geometry.isPieceTouchingMirror(piece600);
    console.log('Bounding box at x=600:', bbox600);
    console.log('Is touching at x=600:', isTouching600);
    console.log('Distance to mirror at x=600:', Math.abs(bbox600.right - config.mirrorLineX));
    
    expect(isTouching).toBe(true);
    expect(validation.isValid).toBe(true);
  });
});