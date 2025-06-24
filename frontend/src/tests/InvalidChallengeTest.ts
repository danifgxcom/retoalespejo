import { GameGeometry, GameAreaConfig, PiecePosition } from '../utils/geometry/GameGeometry';
import { Challenge, ObjectivePattern } from '../components/ChallengeCard.ts';

// Create a test function to create and validate an invalid challenge
function testInvalidChallenge() {
  console.log('=== INVALID CHALLENGE TEST ===');
  
  // Initialize game geometry with the same config used in the game
  const gameAreaConfig: GameAreaConfig = {
    width: 700,
    height: 600,
    mirrorLineX: 700,
    pieceSize: 100
  };
  
  const geometry = new GameGeometry(gameAreaConfig);
  
  // Create an invalid challenge with overlapping pieces
  const playerPieces: PiecePosition[] = [
    {
      type: 'A',
      face: 'front',
      x: 500,
      y: 300,
      rotation: 0
    },
    {
      type: 'A',
      face: 'front',
      x: 550, // This is too close to the first piece, causing overlap
      y: 300,
      rotation: 0
    }
  ];
  
  // Create the objective pattern
  const objective: ObjectivePattern = {
    playerPieces,
    symmetricPattern: [...playerPieces, ...playerPieces.map(piece => geometry.reflectPieceAcrossMirror(piece))]
  };
  
  // Create the challenge
  const invalidChallenge: Challenge = {
    id: 999,
    name: "Invalid Challenge Test",
    description: "This challenge is intentionally invalid",
    piecesNeeded: 2,
    difficulty: "Test",
    targetPattern: "invalid_test",
    objective,
    targetPieces: playerPieces
  };
  
  // Validate the challenge
  const validation = geometry.validateChallengeCard(playerPieces);
  
  console.log(`Is Valid: ${validation.isValid}`);
  console.log('Validation Details:');
  console.log(`- Touches Mirror: ${validation.touchesMirror}`);
  console.log(`- Has Piece Overlaps: ${validation.hasPieceOverlaps}`);
  console.log(`- Has Reflection Overlaps: ${validation.hasReflectionOverlaps}`);
  console.log(`- Enters Mirror: ${validation.entersMirror}`);
  
  console.log('\nThis invalid challenge should display with a red background and "INVALID" text in the UI.');
  console.log('=== TEST COMPLETE ===');
  
  return invalidChallenge;
}

// Run the test
const invalidChallenge = testInvalidChallenge();

// Export the test function and invalid challenge for potential reuse
export { testInvalidChallenge, invalidChallenge };