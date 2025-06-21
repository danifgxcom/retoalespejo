import { GameGeometry, PiecePosition, GameAreaConfig } from './GameGeometry';

describe('Debug Challenge 3 and 4', () => {
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

  test('Debug Challenge 3 - Torre Vertical', () => {
    const pieces: PiecePosition[] = [
      { type: 'A', face: 'front', x: 330, y: 108, rotation: 0 },
      { type: 'A', face: 'front', x: 330, y: 350, rotation: 0 }
    ];

    console.log('Challenge 3 pieces:', pieces);
    
    pieces.forEach((piece, index) => {
      const bbox = geometry.getPieceBoundingBox(piece);
      const isTouching = geometry.isPieceTouchingMirror(piece);
      console.log(`Piece ${index + 1}:`, piece);
      console.log(`  Bounding box:`, bbox);
      console.log(`  Is touching mirror:`, isTouching);
    });
    
    // Check if pieces touch each other
    const doPiecesTouch = geometry.doPiecesTouch(pieces[0], pieces[1]);
    const doPiecesOverlap = geometry.doPiecesOverlap(pieces[0], pieces[1]);
    console.log('Do pieces touch:', doPiecesTouch);
    console.log('Do pieces overlap:', doPiecesOverlap);
    
    const validation = geometry.validateChallengeCard(pieces);
    console.log('Full validation:', validation);
    
    expect(true).toBe(true); // Just log, don't fail
  });

  test('Debug Challenge 4 - Forma en L', () => {
    const pieces: PiecePosition[] = [
      { type: 'A', face: 'front', x: 72, y: 58, rotation: 0 },
      { type: 'A', face: 'front', x: 72, y: 300, rotation: 0 },
      { type: 'A', face: 'front', x: 330, y: 300, rotation: 0 }
    ];

    console.log('Challenge 4 pieces:', pieces);
    
    pieces.forEach((piece, index) => {
      const bbox = geometry.getPieceBoundingBox(piece);
      const isTouching = geometry.isPieceTouchingMirror(piece);
      console.log(`Piece ${index + 1}:`, piece);
      console.log(`  Bounding box:`, bbox);
      console.log(`  Is touching mirror:`, isTouching);
    });
    
    // Check connectivity between pieces
    console.log('Piece connectivity:');
    console.log('  Pieces 1-2 touch:', geometry.doPiecesTouch(pieces[0], pieces[1]));
    console.log('  Pieces 1-2 overlap:', geometry.doPiecesOverlap(pieces[0], pieces[1]));
    console.log('  Pieces 2-3 touch:', geometry.doPiecesTouch(pieces[1], pieces[2]));
    console.log('  Pieces 2-3 overlap:', geometry.doPiecesOverlap(pieces[1], pieces[2]));
    console.log('  Pieces 1-3 touch:', geometry.doPiecesTouch(pieces[0], pieces[2]));
    console.log('  Pieces 1-3 overlap:', geometry.doPiecesOverlap(pieces[0], pieces[2]));
    
    const validation = geometry.validateChallengeCard(pieces);
    console.log('Full validation:', validation);
    
    expect(true).toBe(true); // Just log, don't fail
  });
});