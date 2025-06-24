import { PiecePositioningAlgorithm, PositioningArea } from '../../utils/positioning/PiecePositioningAlgorithm';
import { GameGeometry, GameAreaConfig } from '../../utils/geometry/GameGeometry';

describe('Test Full Area', () => {
  test('test with full width area', () => {
    const config: GameAreaConfig = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    const geometry = new GameGeometry(config);
    const algorithm = new PiecePositioningAlgorithm(geometry, 100, 30);

    // Área completa de 700px de ancho
    const fullArea: PositioningArea = {
      x: 0,
      y: 600,
      width: 700,
      height: 400
    };

    console.log('🔍 Testing with full area:', fullArea);

    // Probar con 2 piezas
    const result = algorithm.positionPieces(2, fullArea, ['A', 'B']);
    console.log('🔍 Result:', result);

    if (result.success) {
      console.log('🎉 Success! Positions:');
      result.positions.forEach((pos, i) => {
        console.log(`  Piece ${i + 1}: (${pos.x}, ${pos.y}) rotation: ${pos.rotation}`);
        
        const testPiece = {
          type: ['A', 'B'][i] as 'A' | 'B',
          face: 'front' as const,
          x: pos.x,
          y: pos.y,
          rotation: pos.rotation
        };

        const vertices = geometry.getPieceVertices(testPiece);
        const bbox = geometry.getPieceBoundingBox(testPiece);
        
        console.log(`    BBox: ${bbox.left.toFixed(0)}-${bbox.right.toFixed(0)} x ${bbox.top.toFixed(0)}-${bbox.bottom.toFixed(0)}`);
        
        const inBounds = vertices.every(([x, y]) => 
          x >= fullArea.x && x <= fullArea.x + fullArea.width &&
          y >= fullArea.y && y <= fullArea.y + fullArea.height
        );
        console.log(`    In bounds: ${inBounds}`);
      });

      // Verificar solapamiento
      if (result.positions.length === 2) {
        const piece1 = {
          type: 'A' as const,
          face: 'front' as const,
          x: result.positions[0].x,
          y: result.positions[0].y,
          rotation: result.positions[0].rotation
        };

        const piece2 = {
          type: 'B' as const,
          face: 'front' as const,
          x: result.positions[1].x,
          y: result.positions[1].y,
          rotation: result.positions[1].rotation
        };

        const overlap = geometry.doPiecesOverlap(piece1, piece2);
        console.log(`    Pieces overlap: ${overlap}`);
      }
    }
  });
});