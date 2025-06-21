import { GameGeometry, PiecePosition, GameAreaConfig } from './GameGeometry';

describe('Calculate Correct Spacing', () => {
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

  test('Find correct vertical spacing for pieces to touch without overlapping', () => {
    // Start with a piece at y: 200
    const piece1: PiecePosition = { type: 'A', face: 'front', x: 330, y: 200, rotation: 0 };
    const bbox1 = geometry.getPieceBoundingBox(piece1);
    
    console.log('Piece 1 at y=200:', piece1);
    console.log('Piece 1 bounding box:', bbox1);
    console.log('Piece 1 height:', bbox1.bottom - bbox1.top);
    
    // Try different y positions for the second piece
    const testYPositions = [250, 270, 290, 310, 330, 350, 370, 390, 410];
    
    for (const y2 of testYPositions) {
      const piece2: PiecePosition = { type: 'A', face: 'front', x: 330, y: y2, rotation: 0 };
      const bbox2 = geometry.getPieceBoundingBox(piece2);
      
      const overlap = geometry.doPiecesOverlap(piece1, piece2);
      const touch = geometry.doPiecesTouch(piece1, piece2);
      const distance = geometry.getMinDistanceBetweenPieces(piece1, piece2);
      
      console.log(`\n--- Testing piece 2 at y=${y2} ---`);
      console.log('Piece 2 bounding box:', bbox2);
      console.log('Overlap:', overlap);
      console.log('Touch:', touch);
      console.log('Distance:', distance);
      console.log('Gap between pieces:', bbox2.top - bbox1.bottom);
      
      if (touch && !overlap) {
        console.log(`*** FOUND GOOD VERTICAL SPACING: y1=200, y2=${y2} ***`);
        
        // Test the validation
        const validation = geometry.validateChallengeCard([piece1, piece2]);
        console.log('Validation result:', validation);
        
        if (validation.isValid) {
          console.log(`*** PERFECT! This configuration is fully valid ***`);
        }
        
        break;
      }
    }
    
    expect(true).toBe(true); // Just log, don't fail
  });

  test('Find correct horizontal spacing for L-shape pieces', () => {
    // For L-shape: piece at (72, 200), piece at (72, y), piece at (330, y)
    // Need to find y such that pieces touch but don't overlap
    
    const piece1: PiecePosition = { type: 'A', face: 'front', x: 72, y: 200, rotation: 0 };
    const piece3: PiecePosition = { type: 'A', face: 'front', x: 330, y: 300, rotation: 0 };
    
    const bbox1 = geometry.getPieceBoundingBox(piece1);
    const bbox3 = geometry.getPieceBoundingBox(piece3);
    
    console.log('L-shape piece 1 (top):', piece1);
    console.log('L-shape piece 1 bbox:', bbox1);
    console.log('L-shape piece 3 (right):', piece3);
    console.log('L-shape piece 3 bbox:', bbox3);
    
    const testYPositions = [250, 270, 290, 310, 330, 350, 370, 390, 410];
    
    for (const y2 of testYPositions) {
      const piece2: PiecePosition = { type: 'A', face: 'front', x: 72, y: y2, rotation: 0 };
      const bbox2 = geometry.getPieceBoundingBox(piece2);
      
      const overlap12 = geometry.doPiecesOverlap(piece1, piece2);
      const touch12 = geometry.doPiecesTouch(piece1, piece2);
      const overlap23 = geometry.doPiecesOverlap(piece2, piece3);
      const touch23 = geometry.doPiecesTouch(piece2, piece3);
      
      console.log(`\n--- Testing L-shape with middle piece at y=${y2} ---`);
      console.log('Piece 2 bbox:', bbox2);
      console.log('1-2: overlap=', overlap12, 'touch=', touch12);
      console.log('2-3: overlap=', overlap23, 'touch=', touch23);
      
      if (touch12 && !overlap12 && touch23 && !overlap23) {
        console.log(`*** FOUND GOOD L-SHAPE CONFIGURATION: y1=200, y2=${y2}, y3=300 ***`);
        
        // Test the validation
        const validation = geometry.validateChallengeCard([piece1, piece2, piece3]);
        console.log('L-shape validation result:', validation);
        
        if (validation.isValid) {
          console.log(`*** PERFECT! L-shape configuration is fully valid ***`);
        }
        
        break;
      }
    }
    
    expect(true).toBe(true); // Just log, don't fail
  });
});