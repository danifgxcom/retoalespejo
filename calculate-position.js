// Script temporal para calcular la posición correcta
import { GameGeometry } from './src/utils/GameGeometry.js';

const geometry = new GameGeometry({
  width: 700,
  height: 600,
  mirrorLineX: 350, // El espejo está en X=350, no 700
  pieceSize: 100
});

const position = geometry.getPositionTouchingMirror(300, 270, 'A');
console.log('Position for 270° rotation touching mirror:', position);

// También probar con otras rotaciones
console.log('Position for 0° rotation:', geometry.getPositionTouchingMirror(300, 0, 'A'));
console.log('Position for 90° rotation:', geometry.getPositionTouchingMirror(300, 90, 'A'));
console.log('Position for 180° rotation:', geometry.getPositionTouchingMirror(300, 180, 'A'));