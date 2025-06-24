import { GameGeometry, GameAreaConfig } from '../utils/geometry/GameGeometry';
import { ChallengeGenerator } from '../utils/challenges/ChallengeGenerator';

// Create a test function to validate all challenges
function testChallengeValidation() {
  console.log('=== CHALLENGE VALIDATION TEST ===');

  // Initialize game geometry with the same config used in the game
  const gameAreaConfig: GameAreaConfig = {
    width: 700,
    height: 600,
    mirrorLineX: 700,
    pieceSize: 100
  };

  const geometry = new GameGeometry(gameAreaConfig);
  const challengeGenerator = new ChallengeGenerator(geometry);

  // Generate all challenges
  const challenges = challengeGenerator.generateAllChallenges();

  // Test each challenge
  challenges.forEach((challenge, index) => {
    console.log(`\nTesting Challenge ${index + 1}: ${challenge.name}`);

    // Validate the challenge
    const validation = geometry.validateChallengeCard(challenge.objective.playerPieces);

    console.log(`Is Valid: ${validation.isValid}`);

    if (!validation.isValid) {
      console.log('Validation Details:');
      console.log(`- Touches Mirror: ${validation.touchesMirror}`);
      console.log(`- Has Piece Overlaps: ${validation.hasPieceOverlaps}`);
      console.log(`- Has Reflection Overlaps: ${validation.hasReflectionOverlaps}`);
      console.log(`- Enters Mirror: ${validation.entersMirror}`);

      // Log the piece positions for debugging
      console.log('Piece Positions:');
      challenge.objective.playerPieces.forEach((piece, i) => {
        console.log(`Piece ${i + 1}: x=${piece.x}, y=${piece.y}, rotation=${piece.rotation}, type=${piece.type}`);
      });
    }
  });

  console.log('\n=== TEST COMPLETE ===');
}

// Run the test
testChallengeValidation();

// Export the test function for potential reuse
export { testChallengeValidation };
