import { GameGeometry, PiecePosition, GameAreaConfig } from './GameGeometry';

describe('Test Type B Geometry', () => {
  test('Debug type B geometry issue', () => {
    const config: GameAreaConfig = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    const geometry = new GameGeometry(config);
    
    // Test the getPositionTouchingMirror function for type B
    const typeBPosition = geometry.getPositionTouchingMirror(300, 0, 'B');
    console.log('getPositionTouchingMirror for type B:', typeBPosition);
    
    const pieceB: PiecePosition = {
      type: 'B',
      face: 'front',
      x: typeBPosition.x,
      y: typeBPosition.y,
      rotation: 0
    };
    
    const bbox = geometry.getPieceBoundingBox(pieceB);
    const isTouching = geometry.isPieceTouchingMirror(pieceB);
    
    console.log('Type B piece:', pieceB);
    console.log('Type B bounding box:', bbox);
    console.log('Mirror line X:', config.mirrorLineX);
    console.log('Distance to mirror:', Math.abs(bbox.right - config.mirrorLineX));
    console.log('Is touching mirror:', isTouching);
    
    // Let's also check if the issue is with reflection overlap
    const reflectedPiece = geometry.reflectPieceAcrossMirror(pieceB);
    const reflectedBbox = geometry.getPieceBoundingBox(reflectedPiece);
    const hasReflectionOverlap = geometry.detectPieceReflectionOverlap(pieceB);
    
    console.log('Reflected piece:', reflectedPiece);
    console.log('Reflected bounding box:', reflectedBbox);
    console.log('Has reflection overlap:', hasReflectionOverlap);
    
    // Test if it fits in the challenge area
    const fitsInArea = geometry.doPiecesFitInChallengeArea([pieceB]);
    console.log('Fits in challenge area:', fitsInArea);
    
    // For comparison, let's test type A at the same position
    const pieceA: PiecePosition = {
      type: 'A',
      face: 'front',
      x: 330,
      y: 300,
      rotation: 0
    };
    
    const bboxA = geometry.getPieceBoundingBox(pieceA);
    const isTouchingA = geometry.isPieceTouchingMirror(pieceA);
    console.log('\n--- Type A for comparison ---');
    console.log('Type A piece:', pieceA);
    console.log('Type A bounding box:', bboxA);
    console.log('Type A is touching:', isTouchingA);
    
    expect(isTouching).toBe(true);
  });
});