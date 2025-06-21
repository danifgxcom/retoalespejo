import { GameGeometry, PiecePosition, GameAreaConfig } from './GameGeometry';

describe('Debug Updated Challenges', () => {
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

  test('Debug Updated Challenge 3 - Torre Vertical', () => {
    const pieces: PiecePosition[] = [
      { type: 'A', face: 'front', x: 330, y: 200, rotation: 0 },
      { type: 'A', face: 'front', x: 330, y: 300, rotation: 0 }
    ];

    console.log('Updated Challenge 3 pieces:', pieces);
    
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
    const minDistance = geometry.getMinDistanceBetweenPieces(pieces[0], pieces[1]);
    console.log('Do pieces touch:', doPiecesTouch);
    console.log('Do pieces overlap:', doPiecesOverlap);
    console.log('Min distance between pieces:', minDistance);
    
    const validation = geometry.validateChallengeCard(pieces);
    console.log('Full validation:', validation);
    
    expect(true).toBe(true); // Just log, don't fail
  });

  test('Debug Updated Challenge 4 - Forma en L', () => {
    const pieces: PiecePosition[] = [
      { type: 'A', face: 'front', x: 72, y: 200, rotation: 0 },
      { type: 'A', face: 'front', x: 72, y: 300, rotation: 0 },
      { type: 'A', face: 'front', x: 330, y: 300, rotation: 0 }
    ];

    console.log('Updated Challenge 4 pieces:', pieces);
    
    pieces.forEach((piece, index) => {
      const bbox = geometry.getPieceBoundingBox(piece);
      const isTouching = geometry.isPieceTouchingMirror(piece);
      console.log(`Piece ${index + 1}:`, piece);
      console.log(`  Bounding box:`, bbox);
      console.log(`  Is touching mirror:`, isTouching);
    });
    
    // Check connectivity between pieces
    console.log('Piece connectivity:');
    const dist12 = geometry.getMinDistanceBetweenPieces(pieces[0], pieces[1]);
    const dist23 = geometry.getMinDistanceBetweenPieces(pieces[1], pieces[2]);
    const dist13 = geometry.getMinDistanceBetweenPieces(pieces[0], pieces[2]);
    console.log('  Pieces 1-2 distance:', dist12);
    console.log('  Pieces 1-2 touch:', geometry.doPiecesTouch(pieces[0], pieces[1]));
    console.log('  Pieces 1-2 overlap:', geometry.doPiecesOverlap(pieces[0], pieces[1]));
    console.log('  Pieces 2-3 distance:', dist23);
    console.log('  Pieces 2-3 touch:', geometry.doPiecesTouch(pieces[1], pieces[2]));
    console.log('  Pieces 2-3 overlap:', geometry.doPiecesOverlap(pieces[1], pieces[2]));
    console.log('  Pieces 1-3 distance:', dist13);
    console.log('  Pieces 1-3 touch:', geometry.doPiecesTouch(pieces[0], pieces[2]));
    console.log('  Pieces 1-3 overlap:', geometry.doPiecesOverlap(pieces[0], pieces[2]));
    
    const validation = geometry.validateChallengeCard(pieces);
    console.log('Full validation:', validation);
    
    expect(true).toBe(true); // Just log, don't fail
  });
});