// Quick debug to calculate correct mirror-touching position
const PIECE_SIZE = 100;
const MIRROR_LINE_X = 700;

// For a piece to touch the mirror, its right edge should be at the mirror line
// Right edge = x + piece_size + extension from geometry
// The actual geometry extends beyond the basic piece size by 1.28 factor
const unit = PIECE_SIZE * 1.28;

// For type A piece at rotation 0, the rightmost point is at coordinate [2.5, 0.5]
// which translates to x + 2.5 * unit in world coordinates
const rightmostExtension = 2.5 * unit;

// So for the piece to touch the mirror:
// x + rightmostExtension = MIRROR_LINE_X
// x = MIRROR_LINE_X - rightmostExtension
const correctX = MIRROR_LINE_X - rightmostExtension;

console.log('PIECE_SIZE:', PIECE_SIZE);
console.log('MIRROR_LINE_X:', MIRROR_LINE_X);
console.log('unit:', unit);
console.log('rightmostExtension:', rightmostExtension);
console.log('Correct X for touching mirror:', correctX);
console.log('Currently using in ChallengeGenerator:', 330);
console.log('Tests are using:', 600);