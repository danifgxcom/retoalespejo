import { GameGeometry, PiecePosition, GameAreaConfig } from './GameGeometry';

describe('Debug Reflection Calculation', () => {
  test('Debug reflection calculation step by step', () => {
    const config: GameAreaConfig = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    const geometry = new GameGeometry(config);
    
    const pieceB: PiecePosition = {
      type: 'B',
      face: 'front',
      x: 650,
      y: 300,
      rotation: 0
    };
    
    console.log('Original piece B:', pieceB);
    console.log('Mirror line X:', config.mirrorLineX);
    console.log('Piece size:', config.pieceSize);
    
    // Current calculation
    const currentReflectedX = 2 * config.mirrorLineX - pieceB.x - config.pieceSize;
    console.log('Current reflected X calculation:', currentReflectedX);
    console.log('  = 2 * 700 - 650 - 100');
    console.log('  = 1400 - 650 - 100');
    console.log('  = 550');
    
    const reflectedPiece = geometry.reflectPieceAcrossMirror(pieceB);
    console.log('Reflected piece:', reflectedPiece);
    
    const originalBbox = geometry.getPieceBoundingBox(pieceB);
    const reflectedBbox = geometry.getPieceBoundingBox(reflectedPiece);
    
    console.log('Original bounding box:', originalBbox);
    console.log('Reflected bounding box:', reflectedBbox);
    
    // For correct reflection, the reflected piece should be on the opposite side
    // The distance from mirror should be the same
    const originalDistanceFromMirror = config.mirrorLineX - originalBbox.right;
    const reflectedDistanceFromMirror = reflectedBbox.left - config.mirrorLineX;
    
    console.log('Original distance from mirror (should be 0):', originalDistanceFromMirror);
    console.log('Reflected distance from mirror (should be 0):', reflectedDistanceFromMirror);
    
    // For a piece that touches the mirror (right edge at 700), 
    // its reflection should start at the mirror line (left edge at 700)
    const correctReflectedX = config.mirrorLineX;
    console.log('Correct reflected X should be:', correctReflectedX);
    
    expect(originalDistanceFromMirror).toBe(0); // Original piece touches mirror
  });
});