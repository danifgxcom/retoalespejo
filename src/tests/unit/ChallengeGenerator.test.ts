import { GameGeometry, GameAreaConfig } from './geometry/GameGeometry';
import { ChallengeGenerator } from './challenges/ChallengeGenerator';

describe('ChallengeGenerator', () => {
  let geometry: GameGeometry;
  let generator: ChallengeGenerator;
  let config: GameAreaConfig;

  beforeEach(() => {
    config = {
      width: 600,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    geometry = new GameGeometry(config);
    generator = new ChallengeGenerator(geometry);
  });

  test('Challenge 2 (horizontal block) should have touching pieces', () => {
    const challenge = generator.generateHorizontalBlockChallenge();
    
    console.log('Challenge 2 generated:', challenge.name);
    console.log('Player pieces:', challenge.objective.playerPieces);
    
    const pieces = challenge.objective.playerPieces;
    expect(pieces.length).toBe(2);
    
    // Verificar que las piezas se tocan
    const piecesTouch = geometry.doPiecesTouch(pieces[0], pieces[1]);
    console.log(`Pieces touch: ${piecesTouch}`);
    
    // Verificar que no se solapan
    const piecesOverlap = geometry.doPiecesOverlap(pieces[0], pieces[1]);
    console.log(`Pieces overlap: ${piecesOverlap}`);
    
    // Verificar bounding boxes
    const bbox1 = geometry.getPieceBoundingBox(pieces[0]);
    const bbox2 = geometry.getPieceBoundingBox(pieces[1]);
    console.log('Piece 1 bbox:', bbox1);
    console.log('Piece 2 bbox:', bbox2);
    
    // Verificar validación completa
    const validation = geometry.validateChallengeCard(pieces);
    console.log('Validation result:', validation);
    
    expect(piecesTouch).toBe(true);
    expect(piecesOverlap).toBe(false);
    expect(validation.piecesConnected).toBe(true);
    expect(validation.touchesMirror).toBe(true);
    expect(validation.isValid).toBe(true);
  });

  test('doPiecesTouch function works correctly', () => {
    // Test case: dos piezas que deberían tocarse
    const piece1 = { type: 'A' as const, face: 'front' as const, x: 100, y: 100, rotation: 0 };
    const piece2 = { type: 'A' as const, face: 'front' as const, x: 200, y: 100, rotation: 0 };
    
    const touching = geometry.doPiecesTouch(piece1, piece2);
    const overlapping = geometry.doPiecesOverlap(piece1, piece2);
    
    console.log('Test pieces touch:', touching);
    console.log('Test pieces overlap:', overlapping);
    
    const bbox1 = geometry.getPieceBoundingBox(piece1);
    const bbox2 = geometry.getPieceBoundingBox(piece2);
    console.log('Test piece 1 bbox:', bbox1);
    console.log('Test piece 2 bbox:', bbox2);
    
    expect(touching).toBe(true);
    expect(overlapping).toBe(false);
  });

  test('All challenges should be valid', () => {
    const allChallenges = generator.generateAllChallenges();
    
    allChallenges.forEach((challenge, index) => {
      console.log(`\n=== Challenge ${index + 1}: ${challenge.name} ===`);
      const validation = geometry.validateChallengeCard(challenge.objective.playerPieces);
      console.log('Validation:', validation);
      
      if (!validation.isValid) {
        console.log('INVALID CHALLENGE DETAILS:');
        console.log('Pieces:', challenge.objective.playerPieces);
        challenge.objective.playerPieces.forEach((piece, i) => {
          console.log(`Piece ${i + 1} bbox:`, geometry.getPieceBoundingBox(piece));
        });
        
        if (challenge.objective.playerPieces.length > 1) {
          console.log('Piece connections:');
          for (let i = 0; i < challenge.objective.playerPieces.length; i++) {
            for (let j = i + 1; j < challenge.objective.playerPieces.length; j++) {
              const touch = geometry.doPiecesTouch(challenge.objective.playerPieces[i], challenge.objective.playerPieces[j]);
              const overlap = geometry.doPiecesOverlap(challenge.objective.playerPieces[i], challenge.objective.playerPieces[j]);
              console.log(`Piece ${i + 1} - Piece ${j + 1}: touch=${touch}, overlap=${overlap}`);
            }
          }
        }
      }
      
      expect(validation.isValid).toBe(true);
    });
  });
});