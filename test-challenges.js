import { GameGeometry } from './src/utils/GameGeometry.ts';
import { ChallengeGenerator } from './src/utils/ChallengeGenerator.ts';

// Create the same configuration used in the game
const gameAreaConfig = {
    width: 700,
    height: 600,
    mirrorLineX: 700,
    pieceSize: 100
};

// Initialize geometry and challenge generator
const geometry = new GameGeometry(gameAreaConfig);
const challengeGenerator = new ChallengeGenerator(geometry);

// Focus on Challenge 2 which is reported to have disconnected pieces
const challenge2 = challengeGenerator.generateHorizontalBlockChallenge();
const pieces = challenge2.objective.playerPieces;

// Print the pieces
console.log('Challenge 2 pieces:');
console.log(pieces);

// Check if pieces are connected
const piecesConnected = geometry.arePiecesConnected(pieces);
console.log('\nAre Challenge 2 pieces connected?', piecesConnected);

// Check if pieces touch each other
const piece1 = pieces[0];
const piece2 = pieces[1];
const piecesTouch = geometry.doPiecesTouch(piece1, piece2);
console.log('\nDo Challenge 2 pieces touch?', piecesTouch);

// Calculate distance between pieces
const distance = geometry.getDistanceBetweenPieces(piece1, piece2);
console.log('\nDistance between Challenge 2 pieces:', distance);

// Get bounding boxes
const bbox1 = geometry.getPieceBoundingBox(piece1);
const bbox2 = geometry.getPieceBoundingBox(piece2);
console.log('\nPiece 1 bounding box:', bbox1);
console.log('Piece 2 bounding box:', bbox2);

// Calculate the gap between the pieces
const horizontalGap = bbox2.left - bbox1.right;
console.log('\nHorizontal gap between pieces:', horizontalGap);

// Check if the challenge is valid according to the validation function
const validation = geometry.validateChallengeCard(pieces);
console.log('\nChallenge 2 validation:', validation);

// Create test pieces with a known gap
const testPieces = [
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

// Check if test pieces are connected
const testPiecesConnected = geometry.arePiecesConnected(testPieces);
console.log('\nAre test pieces with gap connected?', testPiecesConnected);

// Check if test pieces touch each other
const testPiecesTouch = geometry.doPiecesTouch(testPieces[0], testPieces[1]);
console.log('\nDo test pieces with gap touch?', testPiecesTouch);

// Calculate distance between test pieces
const testDistance = geometry.getDistanceBetweenPieces(testPieces[0], testPieces[1]);
console.log('\nDistance between test pieces with gap:', testDistance);

// Get test piece bounding boxes
const testBbox1 = geometry.getPieceBoundingBox(testPieces[0]);
const testBbox2 = geometry.getPieceBoundingBox(testPieces[1]);
console.log('\nTest piece 1 bounding box:', testBbox1);
console.log('Test piece 2 bounding box:', testBbox2);

// Calculate the gap between the test pieces
const testHorizontalGap = testBbox2.left - testBbox1.right;
console.log('\nHorizontal gap between test pieces:', testHorizontalGap);
