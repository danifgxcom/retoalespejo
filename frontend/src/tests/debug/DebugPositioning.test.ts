import { PiecePositioningAlgorithm, PositioningArea } from '../../utils/positioning/PiecePositioningAlgorithm';
import { GameGeometry, GameAreaConfig } from '../../utils/geometry/GameGeometry';

describe('Debug Positioning Algorithm', () => {
  test('debug basic positioning', () => {
    const config: GameAreaConfig = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    const geometry = new GameGeometry(config);
    const algorithm = new PiecePositioningAlgorithm(geometry, 100, 20);

    const pieceArea: PositioningArea = {
      x: 0,
      y: 600,
      width: 350,
      height: 400
    };

    console.log('🔍 Testing area:', pieceArea);
    console.log('🔍 Effective area after piece size:', {
      width: pieceArea.width - 100,
      height: pieceArea.height - 100
    });

    const result = algorithm.positionPieces(2, pieceArea, ['A', 'B']);
    console.log('🔍 Result:', result);

    // Si falló, intentemos verificar manualmente algunas posiciones
    if (!result.success) {
      console.log('🔍 Trying manual positions...');
      
      // Posiciones manuales que deberían funcionar
      const manualPositions = [
        { x: 50, y: 750, rotation: 0 },
        { x: 200, y: 750, rotation: 0 }
      ];

      const testPieces = manualPositions.map((pos, i) => ({
        type: ['A', 'B'][i] as 'A' | 'B',
        face: 'front' as const,
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation
      }));

      console.log('🔍 Manual test pieces:', testPieces);

      // Verificar bounding boxes
      testPieces.forEach((piece, i) => {
        const bbox = geometry.getPieceBoundingBox(piece);
        console.log(`🔍 Piece ${i} bbox:`, bbox);
        
        const inBounds = bbox.left >= pieceArea.x && 
                        bbox.right <= pieceArea.x + pieceArea.width &&
                        bbox.top >= pieceArea.y && 
                        bbox.bottom <= pieceArea.y + pieceArea.height;
        console.log(`🔍 Piece ${i} in bounds:`, inBounds);
      });

      // Verificar solapamiento
      const overlap = geometry.doPiecesOverlap(testPieces[0], testPieces[1]);
      console.log('🔍 Manual pieces overlap:', overlap);
    }
  });
});