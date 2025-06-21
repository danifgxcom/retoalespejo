import { GameGeometry, GameAreaConfig } from '../utils/geometry/GameGeometry';
import { ChallengeGenerator } from '../utils/challenges/ChallengeGenerator';
import { testInvalidChallenge } from './InvalidChallengeTest.ts';

// Create a test function to validate both valid and invalid challenges
function testComprehensiveValidation() {
  console.log('=== COMPREHENSIVE VALIDATION TEST ===');

  // Initialize game geometry with the same config used in the game
  const gameAreaConfig: GameAreaConfig = {
    width: 700,
    height: 600,
    mirrorLineX: 700,
    pieceSize: 100
  };

  const geometry = new GameGeometry(gameAreaConfig);
  const challengeGenerator = new ChallengeGenerator(geometry);

  // Generate all valid challenges
  const validChallenges = challengeGenerator.generateAllChallenges();

  // Test each valid challenge
  console.log('\n--- VALID CHALLENGES ---');
  validChallenges.forEach((challenge, index) => {
    console.log(`\nTesting Valid Challenge ${index + 1}: ${challenge.name}`);

    // Validate the challenge
    const validation = geometry.validateChallengeCard(challenge.objective.playerPieces);

    console.log(`Is Valid: ${validation.isValid}`);

    if (!validation.isValid) {
      console.error('ERROR: This challenge should be valid but is not!');
      console.log('Validation Details:');
      console.log(`- Touches Mirror: ${validation.touchesMirror}`);
      console.log(`- Has Piece Overlaps: ${validation.hasPieceOverlaps}`);
      console.log(`- Has Reflection Overlaps: ${validation.hasReflectionOverlaps}`);
      console.log(`- Enters Mirror: ${validation.entersMirror}`);
    }
  });

  // Test an invalid challenge
  console.log('\n--- INVALID CHALLENGE ---');
  testInvalidChallenge(); // This function already logs its results

  console.log('\n=== COMPREHENSIVE TEST SUMMARY ===');
  console.log(`Valid Challenges: ${validChallenges.length}`);
  console.log('Invalid Challenges: 1');
  console.log('\nAll valid challenges should display normally in the UI.');
  console.log('The invalid challenge should display with a red background and "INVALID" text in the UI.');
  console.log('=== TEST COMPLETE ===');
}

// Run the test
testComprehensiveValidation();

// Export the test function for potential reuse
export { testComprehensiveValidation };
