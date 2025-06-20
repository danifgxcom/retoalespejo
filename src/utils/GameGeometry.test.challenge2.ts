import { GameGeometry, PiecePosition, GameAreaConfig } from './GameGeometry.ts';
import { ChallengeGenerator } from './ChallengeGenerator.ts';

describe('Challenge 2 Validation', () => {
  let geometry: GameGeometry;
  let challengeGenerator: ChallengeGenerator;
  let config: GameAreaConfig;

  beforeEach(() => {
    config = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    geometry = new GameGeometry(config);
    challengeGenerator = new ChallengeGenerator(geometry);
  });

  test('Challenge 2 pieces should be connected', () => {
    // Generate challenge 2
    const challenge2 = challengeGenerator.generateHorizontalBlockChallenge();
    const pieces = challenge2.objective.playerPieces;

    // Log the pieces for debugging
    console.log('[DEBUG_LOG] Challenge 2 pieces:', pieces);

    // Check if pieces are connected
    const piecesConnected = geometry.arePiecesConnected(pieces);
    console.log('[DEBUG_LOG] Are pieces connected?', piecesConnected);

    // Check if pieces touch each other
    const piece1 = pieces[0];
    const piece2 = pieces[1];
    const piecesTouch = geometry.doPiecesTouch(piece1, piece2);
    console.log('[DEBUG_LOG] Do pieces touch?', piecesTouch);

    // Calculate distance between pieces
    const distance = geometry.getDistanceBetweenPieces(piece1, piece2);
    console.log('[DEBUG_LOG] Distance between pieces:', distance);

    // Get bounding boxes
    const bbox1 = geometry.getPieceBoundingBox(piece1);
    const bbox2 = geometry.getPieceBoundingBox(piece2);
    console.log('[DEBUG_LOG] Piece 1 bounding box:', bbox1);
    console.log('[DEBUG_LOG] Piece 2 bounding box:', bbox2);

    // Check if the challenge is valid according to the validation function
    const validation = geometry.validateChallengeCard(pieces);
    console.log('[DEBUG_LOG] Challenge validation:', validation);

    // Assert that pieces are connected
    expect(piecesConnected).toBe(true);
    
    // Assert that pieces touch each other
    expect(piecesTouch).toBe(true);
    
    // Assert that the challenge is valid
    expect(validation.isValid).toBe(true);
    expect(validation.piecesConnected).toBe(true);
  });

  test('Pieces with a gap should not be considered connected', () => {
    // Create two pieces with a gap between them
    const pieces: PiecePosition[] = [
      {
        type: 'A',
        face: 'front',
        x: 300,
        y: 300,
        rotation: 0
      },
      {
        type: 'B',
        face: 'front',
        x: 420, // 20-unit gap (100 piece size + 20 gap = 120)
        y: 300,
        rotation: 0
      }
    ];

    // Check if pieces are connected
    const piecesConnected = geometry.arePiecesConnected(pieces);
    console.log('[DEBUG_LOG] Are pieces with gap connected?', piecesConnected);

    // Check if pieces touch each other
    const piecesTouch = geometry.doPiecesTouch(pieces[0], pieces[1]);
    console.log('[DEBUG_LOG] Do pieces with gap touch?', piecesTouch);

    // Calculate distance between pieces
    const distance = geometry.getDistanceBetweenPieces(pieces[0], pieces[1]);
    console.log('[DEBUG_LOG] Distance between pieces with gap:', distance);

    // Assert that pieces with a gap are not connected
    expect(piecesConnected).toBe(false);
    
    // Assert that pieces with a gap do not touch
    expect(piecesTouch).toBe(false);
  });
});