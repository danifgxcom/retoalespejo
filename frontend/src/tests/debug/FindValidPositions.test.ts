import { PiecePositioningAlgorithm, PositioningArea } from '../../utils/positioning/PiecePositioningAlgorithm';
import { GameGeometry, GameAreaConfig } from '../../utils/geometry/GameGeometry';

describe('Find Valid Positions', () => {
  test('find positions that actually work', () => {
    const config: GameAreaConfig = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    const geometry = new GameGeometry(config);

    const pieceArea: PositioningArea = {
      x: 0,
      y: 600,
      width: 350,
      height: 400
    };

    console.log('🔍 Testing different positions manually...');

    // Probar diferentes posiciones dentro del área
    const testPositions = [
      { x: 175, y: 800 }, // Centro del área
      { x: 100, y: 750 }, // Izquierda
      { x: 250, y: 750 }, // Derecha
      { x: 175, y: 700 }, // Arriba
      { x: 175, y: 900 }, // Abajo
    ];

    testPositions.forEach((pos, i) => {
      console.log(`\n🧩 Testing position ${i}: (${pos.x}, ${pos.y})`);
      
      const testPiece = {
        type: 'A' as const,
        face: 'front' as const,
        x: pos.x,
        y: pos.y,
        rotation: 0
      };

      const vertices = geometry.getPieceVertices(testPiece);
      console.log(`  📍 Vertices:`, vertices.map(v => `(${v[0].toFixed(1)}, ${v[1].toFixed(1)})`));

      const bbox = geometry.getPieceBoundingBox(testPiece);
      console.log(`  📦 BBox: left=${bbox.left.toFixed(1)}, right=${bbox.right.toFixed(1)}, top=${bbox.top.toFixed(1)}, bottom=${bbox.bottom.toFixed(1)}`);

      const inBounds = vertices.every(([x, y]) => 
        x >= pieceArea.x && x <= pieceArea.x + pieceArea.width &&
        y >= pieceArea.y && y <= pieceArea.y + pieceArea.height
      );
      console.log(`  ✅ In bounds: ${inBounds}`);

      if (inBounds) {
        console.log(`  🎯 FOUND VALID POSITION: (${pos.x}, ${pos.y})`);
      }
    });

    // Ahora probar dos piezas que funcionen
    console.log('\n🔍 Testing two pieces...');
    
    // Posiciones más conservadoras hacia el centro del área
    const piece1 = {
      type: 'A' as const,
      face: 'front' as const,
      x: 175, // Centro horizontal del área (350/2 = 175)
      y: 750, // Centro vertical aprox
      rotation: 0
    };

    const piece2 = {
      type: 'B' as const,
      face: 'front' as const,
      x: 175,
      y: 850, // Separado verticalmente
      rotation: 0
    };

    console.log('Piece 1:', piece1);
    console.log('Piece 2:', piece2);

    const piece1InBounds = geometry.getPieceVertices(piece1).every(([x, y]) => 
      x >= pieceArea.x && x <= pieceArea.x + pieceArea.width &&
      y >= pieceArea.y && y <= pieceArea.y + pieceArea.height
    );

    const piece2InBounds = geometry.getPieceVertices(piece2).every(([x, y]) => 
      x >= pieceArea.x && x <= pieceArea.x + pieceArea.width &&
      y >= pieceArea.y && y <= pieceArea.y + pieceArea.height
    );

    const overlap = geometry.doPiecesOverlap(piece1, piece2);

    console.log(`Piece 1 in bounds: ${piece1InBounds}`);
    console.log(`Piece 2 in bounds: ${piece2InBounds}`);
    console.log(`Pieces overlap: ${overlap}`);

    if (piece1InBounds && piece2InBounds && !overlap) {
      console.log('🎉 FOUND VALID TWO-PIECE CONFIGURATION!');
    }
  });
});