import { GameGeometry, PiecePosition, GameAreaConfig } from './GameGeometry';

describe('Visual Geometry Test - Verificar coherencia entre cálculo y dibujo', () => {
  test('Verificar que una pieza en x=330 realmente toque el espejo visualmente', () => {
    const config: GameAreaConfig = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    const geometry = new GameGeometry(config);
    
    // Pieza que debería tocar el espejo según nuestros cálculos
    const piece: PiecePosition = {
      type: 'A',
      face: 'front',
      x: 330,
      y: 300,
      rotation: 0
    };
    
    console.log('=== VERIFICACIÓN DE GEOMETRÍA ===');
    console.log('Pieza:', piece);
    console.log('Configuración:', config);
    
    // Calcular bounding box
    const bbox = geometry.getPieceBoundingBox(piece);
    console.log('Bounding box calculado:', bbox);
    
    // Verificar valores específicos para la pieza
    const unit = config.pieceSize * 1.28; // = 100 * 1.28 = 128
    console.log('Unit (tamaño escalado):', unit);
    
    const centerX = piece.x + config.pieceSize / 2; // = 330 + 50 = 380
    const centerY = piece.y + config.pieceSize / 2; // = 300 + 50 = 350
    console.log('Centro de la pieza (centerX, centerY):', centerX, centerY);
    
    // Para rotation = 0, los vértices en coordenadas locales serían:
    const localVertices = [
      [0, 0], [1, 0], [2, 0], [2.5, 0.5], [2, 1], [1.5, 1.5], [1, 1], [0, 0]
    ];
    
    console.log('Vértices en coordenadas unitarias:', localVertices);
    
    // Convertir a coordenadas mundiales
    const worldVertices = localVertices.map(([x_u, y_u]) => {
      const localX = x_u * unit; // Sin rotación ni volteo para tipo A
      const localY = -y_u * unit; // Y invertida
      return [centerX + localX, centerY + localY];
    });
    
    console.log('Vértices en coordenadas mundiales:');
    worldVertices.forEach(([x, y], i) => {
      console.log(`  Vértice ${i}: (${x}, ${y})`);
    });
    
    // Encontrar el vértice más a la derecha
    const rightmostX = Math.max(...worldVertices.map(([x, y]) => x));
    console.log('Vértice más a la derecha (X):', rightmostX);
    console.log('Línea del espejo (X):', config.mirrorLineX);
    console.log('Distancia al espejo:', Math.abs(rightmostX - config.mirrorLineX));
    
    // Verificar específicamente el vértice [2.5, 0.5]
    const criticalVertexLocal = [2.5, 0.5];
    const criticalVertexWorld = [
      centerX + criticalVertexLocal[0] * unit,
      centerY + (-criticalVertexLocal[1]) * unit
    ];
    console.log('Vértice crítico [2.5, 0.5] en mundo:', criticalVertexWorld);
    
    // Verificar la función isPieceTouchingMirror
    const isTouching = geometry.isPieceTouchingMirror(piece);
    console.log('¿Pieza toca el espejo? (función):', isTouching);
    
    // Verificar tolerancia
    const tolerance = 1;
    const actualDistance = Math.abs(bbox.right - config.mirrorLineX);
    console.log('Distancia real al espejo:', actualDistance);
    console.log('Tolerancia permitida:', tolerance);
    console.log('¿Dentro de tolerancia?', actualDistance <= tolerance);
    
    // === VERIFICACIÓN VISUAL ===
    console.log('\n=== COORDENADAS PARA VERIFICACIÓN VISUAL ===');
    console.log('Si dibujamos la pieza usando drawPiece(ctx, piece, 330, 300, 100):');
    console.log('- La pieza se centra en (330 + 50, 300 + 50) = (380, 350)');
    console.log('- El triángulo derecho tiene vértice en (2.5, 0.5) * 128 = (320, 64)');
    console.log('- En coordenadas mundiales: (380 + 320, 350 - 64) = (700, 286)');
    console.log('- Por tanto, el triángulo derecho debería llegar exactamente a X=700');
    
    // Verificar que las transformaciones coinciden
    expect(rightmostX).toBe(config.mirrorLineX);
    expect(isTouching).toBe(true);
    expect(actualDistance).toBeLessThanOrEqual(tolerance);
  });

  test('Verificar coherencia entre getPieceVertices y el dibujo manual', () => {
    const config: GameAreaConfig = {
      width: 700,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    const geometry = new GameGeometry(config);
    
    const piece: PiecePosition = {
      type: 'A',
      face: 'front',
      x: 330,
      y: 300,
      rotation: 0
    };
    
    // Obtener vértices usando la función de geometría
    const calculatedVertices = geometry.getPieceVertices(piece);
    
    // Calcular vértices manualmente usando la misma lógica que drawPiece
    const unit = config.pieceSize * 1.28;
    const centerX = piece.x + config.pieceSize / 2;
    const centerY = piece.y + config.pieceSize / 2;
    
    // Coordenadas de todas las formas dibujadas en drawPiece
    const drawnShapes = {
      // Cuadrado central: (1,0), (2,0), (2,1), (1,1)
      square: [
        [1, 0], [2, 0], [2, 1], [1, 1]
      ],
      // Triángulo izquierdo: (0,0), (1,0), (1,1)
      leftTriangle: [
        [0, 0], [1, 0], [1, 1]
      ],
      // Triángulo superior: (1,1), (2,1), (1.5,1.5)
      topTriangle: [
        [1, 1], [2, 1], [1.5, 1.5]
      ],
      // Triángulo derecho: (2,0), (2,1), (2.5,0.5)
      rightTriangle: [
        [2, 0], [2, 1], [2.5, 0.5]
      ]
    };
    
    // Convertir todas las coordenadas a mundo
    const drawnVerticesWorld: number[][] = [];
    Object.values(drawnShapes).forEach(shape => {
      shape.forEach(([x_u, y_u]) => {
        const worldX = centerX + x_u * unit;
        const worldY = centerY + (-y_u * unit);
        drawnVerticesWorld.push([worldX, worldY]);
      });
    });
    
    // Encontrar extremos de lo dibujado
    const drawnMinX = Math.min(...drawnVerticesWorld.map(([x, y]) => x));
    const drawnMaxX = Math.max(...drawnVerticesWorld.map(([x, y]) => x));
    const drawnMinY = Math.min(...drawnVerticesWorld.map(([x, y]) => y));
    const drawnMaxY = Math.max(...drawnVerticesWorld.map(([x, y]) => y));
    
    // Encontrar extremos de lo calculado
    const calcMinX = Math.min(...calculatedVertices.map(([x, y]) => x));
    const calcMaxX = Math.max(...calculatedVertices.map(([x, y]) => x));
    const calcMinY = Math.min(...calculatedVertices.map(([x, y]) => y));
    const calcMaxY = Math.max(...calculatedVertices.map(([x, y]) => y));
    
    console.log('=== COMPARACIÓN VÉRTICES DIBUJADOS VS CALCULADOS ===');
    console.log('Dibujados - Min X:', drawnMinX, 'Max X:', drawnMaxX);
    console.log('Calculados - Min X:', calcMinX, 'Max X:', calcMaxX);
    console.log('Dibujados - Min Y:', drawnMinY, 'Max Y:', drawnMaxY);
    console.log('Calculados - Min Y:', calcMinY, 'Max Y:', calcMaxY);
    
    console.log('Diferencias:');
    console.log('Delta Max X:', Math.abs(drawnMaxX - calcMaxX));
    console.log('Delta Min X:', Math.abs(drawnMinX - calcMinX));
    
    // Verificar que son muy similares (tolerancia de 1 pixel)
    expect(Math.abs(drawnMaxX - calcMaxX)).toBeLessThan(1);
    expect(Math.abs(drawnMinX - calcMinX)).toBeLessThan(1);
    
    // El punto crítico: ambos deben llegar a X=700
    expect(drawnMaxX).toBeCloseTo(700, 0);
    expect(calcMaxX).toBeCloseTo(700, 0);
  });
});