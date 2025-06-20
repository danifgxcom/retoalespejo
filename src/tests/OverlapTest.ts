import { GameGeometry, GameAreaConfig } from '../utils/GameGeometry.ts';
import { ChallengeGenerator } from '../utils/ChallengeGenerator.ts';

// Create a test function to specifically check for piece overlaps in all challenges
function testPieceOverlaps() {
  console.log('=== PIECE OVERLAP TEST ===');

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

  // Test each challenge for piece overlaps
  challenges.forEach((challenge, index) => {
    console.log(`\nTesting Challenge ${index + 1}: ${challenge.name}`);

    const pieces = challenge.objective.playerPieces;

    // Print all piece positions for this challenge
    console.log(`  Challenge has ${pieces.length} pieces:`);
    pieces.forEach((piece, i) => {
      console.log(`    Piece ${i+1}: x=${piece.x}, y=${piece.y}, rotation=${piece.rotation}, type=${piece.type}`);
    });

    // Check each pair of pieces for overlaps using bounding box detection
    let hasOverlaps = false;
    let hasClosePositions = false;

    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        const piece1 = pieces[i];
        const piece2 = pieces[j];

        // Calculate distance between pieces (for informational purposes)
        const dx = piece1.x - piece2.x;
        const dy = piece1.y - piece2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        console.log(`    Distance between piece ${i+1} and piece ${j+1}: ${distance.toFixed(2)} (Piece Size: ${gameAreaConfig.pieceSize})`);

        // Get bounding boxes for both pieces
        const bbox1 = geometry.getPieceBoundingBox(piece1);
        const bbox2 = geometry.getPieceBoundingBox(piece2);

        // Check if bounding boxes overlap
        const boundingBoxOverlap = !(
          bbox1.right < bbox2.left ||
          bbox1.left > bbox2.right ||
          bbox1.bottom < bbox2.top ||
          bbox1.top > bbox2.bottom
        );

        // Also check if pieces are very close (for visual overlap concerns)
        const recommendedDistance = gameAreaConfig.pieceSize * 1.2; // 20% more than piece size
        const tooClose = distance < recommendedDistance && !boundingBoxOverlap;

        if (boundingBoxOverlap) {
          hasOverlaps = true;
          console.log(`    OVERLAP DETECTED between piece ${i+1} and piece ${j+1}! (Bounding boxes overlap)`);
          console.log(`      Piece ${i+1} bbox: left=${bbox1.left.toFixed(0)}, right=${bbox1.right.toFixed(0)}, top=${bbox1.top.toFixed(0)}, bottom=${bbox1.bottom.toFixed(0)}`);
          console.log(`      Piece ${j+1} bbox: left=${bbox2.left.toFixed(0)}, right=${bbox2.right.toFixed(0)}, top=${bbox2.top.toFixed(0)}, bottom=${bbox2.bottom.toFixed(0)}`);
        } else if (tooClose) {
          hasClosePositions = true;
          console.log(`    Pieces ${i+1} and ${j+1} are VERY CLOSE (may appear to overlap visually)`);
        }
      }
    }

    // Print summary for this challenge
    if (hasOverlaps) {
      console.log(`  Challenge ${index + 1} has piece overlaps according to standard check!`);
    } else if (hasClosePositions) {
      console.log(`  Challenge ${index + 1} has pieces that are very close (may appear to overlap visually)`);
    } else {
      console.log(`  Challenge ${index + 1} has no piece overlaps or close positions.`);
    }

    // Also check the validation result from GameGeometry
    const validation = geometry.validateChallengeCard(pieces);
    console.log(`  Validation result: ${validation.isValid ? 'VALID' : 'INVALID'}`);
    console.log(`  Validation reports piece overlaps: ${validation.hasPieceOverlaps ? 'YES' : 'NO'}`);

    // Check for discrepancy
    if (hasOverlaps !== validation.hasPieceOverlaps) {
      console.log(`  DISCREPANCY DETECTED: Our test shows ${hasOverlaps ? 'overlaps' : 'no overlaps'} but validation reports ${validation.hasPieceOverlaps ? 'overlaps' : 'no overlaps'}`);
    }
  });

  console.log('\n=== TEST COMPLETE ===');
}

// Run the test
testPieceOverlaps();

// Export the test function for potential reuse
export { testPieceOverlaps };
