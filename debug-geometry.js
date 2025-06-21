// Import and test the actual GameGeometry class
import { GameGeometry } from './src/utils/GameGeometry.ts';

const config = {
  width: 700,
  height: 600,
  mirrorLineX: 700,
  pieceSize: 100
};

const geometry = new GameGeometry(config);

// Test getPositionTouchingMirror function
const touchingPosition = geometry.getPositionTouchingMirror(300, 0, 'A');
console.log('getPositionTouchingMirror result:', touchingPosition);

// Test isPieceTouchingMirror with the result
const testPiece = {
  type: 'A',
  face: 'front',
  x: touchingPosition.x,
  y: touchingPosition.y,
  rotation: 0
};

const isTouching = geometry.isPieceTouchingMirror(testPiece);
console.log('isPieceTouchingMirror result:', isTouching);

// Test the bounding box
const bbox = geometry.getPieceBoundingBox(testPiece);
console.log('Bounding box:', bbox);
console.log('Distance to mirror:', Math.abs(bbox.right - config.mirrorLineX));