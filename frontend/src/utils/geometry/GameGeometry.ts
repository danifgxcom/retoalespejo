import { Piece } from '../components/GamePiece';

export interface Position {
  x: number;
  y: number;
}

export interface PiecePosition {
  type: 'A' | 'B';
  face: 'front' | 'back';
  x: number;
  y: number;
  rotation: number;
}

export interface GameAreaConfig {
  width: number;
  height: number;
  mirrorLineX: number;
  pieceSize: number;
}

export class GameGeometry {
  private config: GameAreaConfig;

  constructor(config: GameAreaConfig) {
    this.config = config;
  }

  /**
   * Devuelve la configuración del área de juego
   */
  getConfig(): GameAreaConfig {
    return this.config;
  }



   /**
   * Calcula la posición del reflejo de una pieza en el espejo
   */
  reflectPieceAcrossMirror(piece: PiecePosition): PiecePosition {
    // Para reflejar correctamente, reflejamos tanto el lado izquierdo como derecho del bbox
    const originalBbox = this.getPieceBoundingBox(piece);
    
    // Reflejar ambos lados del bounding box a través de la línea del espejo
    // Si bbox va de [left, right], el reflejo va de [2*mirror - right, 2*mirror - left]
    const reflectedLeft = 2 * this.config.mirrorLineX - originalBbox.right;
    const reflectedRight = 2 * this.config.mirrorLineX - originalBbox.left;
    
    // Calcular la nueva posición x de la pieza para que su bounding box quede en reflectedLeft
    const offsetFromLeft = piece.x - originalBbox.left;
    const reflectedX = reflectedLeft + offsetFromLeft;

    const reflectedPiece = {
      ...piece,
      x: reflectedX
    };

    // Verificar el bbox del reflejo para debugging
    const reflectedBbox = this.getPieceBoundingBox(reflectedPiece);

    return reflectedPiece;
  }




  /**
   * Calcula el reflejo para challenge cards
   * En un espejo: solo cambia la posición X, todo lo demás permanece igual
   */
  reflectPieceForChallengeCard(piece: PiecePosition): PiecePosition {
    const reflectedX = 2 * this.config.mirrorLineX - piece.x - this.config.pieceSize;

    return {
      ...piece,
      x: reflectedX
      // Todo lo demás permanece EXACTAMENTE igual: tipo, rotación, colores, cara
    };
  }

  /**
   * Verifica si una pieza está en el área de juego (no en el área de piezas disponibles)
   */
  isPieceInGameArea(piece: PiecePosition): boolean {
    return piece.y < this.config.height;
  }

  /**
   * Verifica si una pieza puede mostrar reflejo
   */
  canPieceShowReflection(piece: Piece): boolean {
    return piece.placed && this.isPieceInGameArea(piece);
  }

  /**
   * Obtiene los vértices transformados de una pieza (con rotación y posición)
   */
  getPieceVertices(piece: PiecePosition): Array<[number, number]> {
    const size = this.config.pieceSize;
    const unit = size * 1.28;
    const rad = (piece.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Vértices del contorno de la pieza en coordenadas unitarias
    const shapeVertices = [
      [0, 0], [1, 0], [2, 0], [2.5, 0.5], [2, 1], [1.5, 1.5], [1, 1], [0, 0]
    ];

    const transformedVertices: Array<[number, number]> = [];

    // El centro de rotación real en el canvas
    const centerX = piece.x + size / 2;
    const centerY = piece.y + size / 2;

    for (const [x_u, y_u] of shapeVertices) {
      let localX = x_u * unit;
      const localY = -y_u * unit;

      // Si es pieza tipo B, aplicar el volteo horizontal
      if (piece.type === 'B') {
        localX = -localX;
      }

      // Aplicar la rotación a cada vértice
      const rotatedX = localX * cos - localY * sin;
      const rotatedY = localX * sin + localY * cos;

      // Trasladar al centro de la pieza
      transformedVertices.push([
        centerX + rotatedX,
        centerY + rotatedY
      ]);
    }

    return transformedVertices;
  }

  /**
   * Obtiene los bordes de una pieza como segmentos de línea
   */
  getPieceEdges(piece: PiecePosition): Array<{
    start: [number, number];
    end: [number, number];
    direction: [number, number];
    length: number;
    type: 'straight' | 'diagonal';
  }> {
    const vertices = this.getPieceVertices(piece);
    const edges = [];

    for (let i = 0; i < vertices.length - 1; i++) {
      const start = vertices[i];
      const end = vertices[i + 1];
      
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = Math.sqrt(dx * dx + dy * dy);
      
      // Vector dirección normalizado
      const direction: [number, number] = length > 0 ? [dx / length, dy / length] : [0, 0];
      
      // Determinar tipo de borde
      const angle = Math.abs(Math.atan2(dy, dx));
      const isHorizontal = angle < Math.PI / 8 || angle > 7 * Math.PI / 8;
      const isVertical = angle > 3 * Math.PI / 8 && angle < 5 * Math.PI / 8;
      const type = (isHorizontal || isVertical) ? 'straight' : 'diagonal';

      edges.push({
        start,
        end,
        direction,
        length,
        type
      });
    }

    return edges;
  }

  /**
   * Encuentra bordes compatibles entre dos piezas que pueden formar continuidad
   */
  findCompatibleEdges(piece1: PiecePosition, piece2: PiecePosition): Array<{
    edge1: { start: [number, number]; end: [number, number]; direction: [number, number] };
    edge2: { start: [number, number]; end: [number, number]; direction: [number, number] };
    alignmentScore: number;
    continuityScore: number;
  }> {
    const edges1 = this.getPieceEdges(piece1);
    const edges2 = this.getPieceEdges(piece2);
    const compatiblePairs = [];

    for (const edge1 of edges1) {
      for (const edge2 of edges2) {
        // Solo considerar bordes del mismo tipo
        if (edge1.type !== edge2.type) continue;

        // Calcular similitud de dirección (deben ser opuestas para conectar)
        const dotProduct = edge1.direction[0] * edge2.direction[0] + edge1.direction[1] * edge2.direction[1];
        const isOpposite = dotProduct < -0.8; // Direcciones opuestas
        
        if (!isOpposite) continue;

        // Calcular score de alineación (qué tan cerca están de estar en la misma línea)
        const alignmentScore = this.calculateEdgeAlignment(edge1, edge2);
        
        // Calcular score de continuidad (qué tan bien se conectarían)
        const continuityScore = this.calculateEdgeContinuity(edge1, edge2);

        // Ser más permisivo para detectar gaps pequeños que necesitan corrección
        if (alignmentScore > 0.5 && continuityScore > 0.4) {
          compatiblePairs.push({
            edge1,
            edge2,
            alignmentScore,
            continuityScore
          });
        }
      }
    }

    // Ordenar por mejor score combinado
    return compatiblePairs.sort((a, b) => 
      (b.alignmentScore * b.continuityScore) - (a.alignmentScore * a.continuityScore)
    );
  }

  /**
   * Calcula qué tan alineados están dos bordes (0-1, siendo 1 perfectamente alineados)
   */
  private calculateEdgeAlignment(edge1: any, edge2: any): number {
    // Calcular la distancia entre las líneas extendidas
    const midpoint1 = [(edge1.start[0] + edge1.end[0]) / 2, (edge1.start[1] + edge1.end[1]) / 2];
    const midpoint2 = [(edge2.start[0] + edge2.end[0]) / 2, (edge2.start[1] + edge2.end[1]) / 2];
    
    // Vector entre puntos medios
    const connectionVector = [midpoint2[0] - midpoint1[0], midpoint2[1] - midpoint1[1]];
    const connectionLength = Math.sqrt(connectionVector[0] * connectionVector[0] + connectionVector[1] * connectionVector[1]);
    
    if (connectionLength === 0) return 1; // Están en el mismo punto
    
    // Normalizar vector de conexión
    const normalizedConnection = [connectionVector[0] / connectionLength, connectionVector[1] / connectionLength];
    
    // Calcular qué tan perpendicular es la conexión a la dirección del borde
    const perpendicularity = Math.abs(normalizedConnection[0] * edge1.direction[0] + normalizedConnection[1] * edge1.direction[1]);
    
    // Mejor alineación = conexión más perpendicular al borde
    return 1 - perpendicularity;
  }

  /**
   * Calcula qué tan bien se conectarían dos bordes en términos de continuidad
   */
  private calculateEdgeContinuity(edge1: any, edge2: any): number {
    // Distancia entre los bordes más cercanos
    const distances = [
      this.distanceBetweenPoints(edge1.start, edge2.start),
      this.distanceBetweenPoints(edge1.start, edge2.end),
      this.distanceBetweenPoints(edge1.end, edge2.start),
      this.distanceBetweenPoints(edge1.end, edge2.end)
    ];
    
    const minDistance = Math.min(...distances);
    
    // Ser más agresivo con el snap para gaps pequeños pero visibles
    const maxAcceptableDistance = 15; // Reducido de 50 a 15 pixels para ser más preciso
    
    // Score basado en distancia con curva más agresiva para gaps pequeños
    let distanceScore;
    if (minDistance <= 5) {
      distanceScore = 1; // Perfecta conexión
    } else if (minDistance <= 10) {
      distanceScore = 0.9; // Muy buena conexión
    } else {
      distanceScore = Math.max(0, 1 - minDistance / maxAcceptableDistance);
    }
    
    // Score basado en similitud de longitud
    const lengthRatio = Math.min(edge1.length, edge2.length) / Math.max(edge1.length, edge2.length);
    
    return (distanceScore * 0.8) + (lengthRatio * 0.2); // Priorizamos más la distancia
  }

  /**
   * Calcula la distancia entre dos puntos
   */
  private distanceBetweenPoints(point1: [number, number], point2: [number, number]): number {
    const dx = point2[0] - point1[0];
    const dy = point2[1] - point1[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calcula si dos piezas se solapan usando detección de colisión precisa entre polígonos
   */
  doPiecesOverlap(piece1: PiecePosition, piece2: PiecePosition): boolean {
    const vertices1 = this.getPieceVertices(piece1);
    const vertices2 = this.getPieceVertices(piece2);

    return this.doPolygonsOverlap(vertices1, vertices2);
  }

  /**
   * Calcula la profundidad de penetración entre dos piezas
   * Retorna 0 si no se solapan, >0 si hay penetración real
   */
  getPenetrationDepth(piece1: PiecePosition, piece2: PiecePosition): number {
    const vertices1 = this.getPieceVertices(piece1);
    const vertices2 = this.getPieceVertices(piece2);

    let minOverlap = Infinity;
    const polygons = [vertices1, vertices2];

    for (const polygon of polygons) {
      for (let i = 0; i < polygon.length - 1; i++) {
        const current = polygon[i];
        const next = polygon[i + 1];

        // Calcular el vector normal (perpendicular al borde)
        const edge = [next[0] - current[0], next[1] - current[1]];
        const normal = [-edge[1], edge[0]]; // Perpendicular 90 grados

        // Normalizar el vector normal
        const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
        if (length === 0) continue;
        normal[0] /= length;
        normal[1] /= length;

        // Proyectar ambos polígonos sobre este eje
        const projection1 = this.projectPolygon(vertices1, normal);
        const projection2 = this.projectPolygon(vertices2, normal);

        // Calcular el solapamiento en este eje
        const overlap = Math.min(projection1.max, projection2.max) - Math.max(projection1.min, projection2.min);

        // Si hay separación en este eje, no hay penetración
        if (overlap <= 0) {
          return 0;
        }

        // Rastrear el solapamiento mínimo (profundidad de penetración)
        minOverlap = Math.min(minOverlap, overlap);
      }
    }

    return minOverlap === Infinity ? 0 : minOverlap;
  }

  /**
   * Verifica si dos piezas tienen penetración real (problemática)
   * vs. solo contacto de bordes (acceptable)
   */
  doPiecesOverlapSignificantly(piece1: PiecePosition, piece2: PiecePosition): boolean {
    const penetrationDepth = this.getPenetrationDepth(piece1, piece2);
    const penetrationThreshold = 15; // Más de 15 pixels = penetración real problemática (ajustado para permitir conexiones válidas)
    
    const isSignificant = penetrationDepth > penetrationThreshold;
    
    if (isSignificant) {
    }
    
    return isSignificant;
  }

  /**
   * Algoritmo SAT (Separating Axes Theorem) para detectar colisión entre polígonos
   * Incluye tolerancia para permitir piezas que se tocan por los bordes sin considerarse solapadas
   */
  private doPolygonsOverlap(vertices1: Array<[number, number]>, vertices2: Array<[number, number]>): boolean {
    const polygons = [vertices1, vertices2];
    const overlapTolerance = 5; // Tolerancia de 5 pixels para solapamientos mínimos (ajustado para permitir conexiones)

    for (const polygon of polygons) {
      for (let i = 0; i < polygon.length - 1; i++) {
        const current = polygon[i];
        const next = polygon[i + 1];

        // Calcular el vector normal (perpendicular al borde)
        const edge = [next[0] - current[0], next[1] - current[1]];
        const normal = [-edge[1], edge[0]]; // Perpendicular 90 grados

        // Normalizar el vector normal
        const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
        if (length === 0) continue;
        normal[0] /= length;
        normal[1] /= length;

        // Proyectar ambos polígonos sobre este eje
        const projection1 = this.projectPolygon(vertices1, normal);
        const projection2 = this.projectPolygon(vertices2, normal);

        // Calcular el solapamiento en este eje
        const overlap = Math.min(projection1.max, projection2.max) - Math.max(projection1.min, projection2.min);

        // Si hay separación significativa en este eje, no hay colisión
        if (overlap < -overlapTolerance) {
          return false;
        }
      }
    }

    return true; // No se encontró eje de separación, hay colisión
  }

  /**
   * Proyecta un polígono sobre un eje y devuelve el rango min/max
   */
  private projectPolygon(vertices: Array<[number, number]>, axis: [number, number]): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;

    for (const vertex of vertices) {
      const projection = vertex[0] * axis[0] + vertex[1] * axis[1];
      min = Math.min(min, projection);
      max = Math.max(max, projection);
    }

    return { min, max };
  }

  /**
   * Calcula la distancia entre dos piezas
   */
  getDistanceBetweenPieces(piece1: PiecePosition, piece2: PiecePosition): number {
    const dx = piece1.x - piece2.x;
    const dy = piece1.y - piece2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Verifica si dos piezas se tocan correctamente (contacto perfecto sin gaps visibles)
   * La conexión debe ser exacta para que no aparezca línea blanca entre las piezas
   */
  doPiecesTouch(piece1: PiecePosition, piece2: PiecePosition): boolean {
    const penetrationDepth = this.getPenetrationDepth(piece1, piece2);
    
    // Si hay penetración real (> 15px), no es conexión válida  
    if (penetrationDepth > 15) {
      return false;
    }

    // Si hay contacto/solapamiento mínimo (0.05-15px), es conexión perfecta
    if (penetrationDepth >= 0.05) {
      return true;
    }

    // Si no hay solapamiento, verificar si están muy cerca (pero esto indica gap visible)
    const minDistance = this.getMinDistanceBetweenPieces(piece1, piece2);
    
    // Gap visible = línea blanca = conexión inválida (más estricto)
    if (minDistance > 0.5) {
      return false;
    }

    // Contacto ultra-cercano (gap micro-invisible)
    if (minDistance <= 0.5) {
      return true;
    }

    // Contacto exacto sin gap ni penetración
    return true;
  }

  /**
   * Calcula la distancia mínima entre dos piezas usando sus geometrías precisas
   */
  getMinDistanceBetweenPieces(piece1: PiecePosition, piece2: PiecePosition): number {
    const vertices1 = this.getPieceVertices(piece1);
    const vertices2 = this.getPieceVertices(piece2);

    let minDistance = Infinity;

    // Calcular la distancia entre todos los vértices de ambas piezas
    for (const vertex1 of vertices1) {
      for (const vertex2 of vertices2) {
        const dx = vertex1[0] - vertex2[0];
        const dy = vertex1[1] - vertex2[1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        minDistance = Math.min(minDistance, distance);
      }
    }

    // También calcular la distancia mínima de cada vértice a los bordes de la otra pieza
    for (let i = 0; i < vertices1.length - 1; i++) {
      const vertex = vertices1[i];
      const minDistToEdges = this.getMinDistanceFromPointToPolygon(vertex, vertices2);
      minDistance = Math.min(minDistance, minDistToEdges);
    }

    for (let i = 0; i < vertices2.length - 1; i++) {
      const vertex = vertices2[i];
      const minDistToEdges = this.getMinDistanceFromPointToPolygon(vertex, vertices1);
      minDistance = Math.min(minDistance, minDistToEdges);
    }

    return minDistance;
  }

  /**
   * Calcula la distancia mínima de un punto a un polígono
   */
  private getMinDistanceFromPointToPolygon(point: [number, number], polygonVertices: Array<[number, number]>): number {
    let minDistance = Infinity;

    // Calcular la distancia a cada borde del polígono
    for (let i = 0; i < polygonVertices.length - 1; i++) {
      const edgeStart = polygonVertices[i];
      const edgeEnd = polygonVertices[i + 1];
      const distanceToEdge = this.getDistanceFromPointToLineSegment(point, edgeStart, edgeEnd);
      minDistance = Math.min(minDistance, distanceToEdge);
    }

    return minDistance;
  }

  /**
   * Calcula la distancia de un punto a un segmento de línea
   */
  private getDistanceFromPointToLineSegment(
    point: [number, number], 
    lineStart: [number, number], 
    lineEnd: [number, number]
  ): number {
    const [px, py] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;

    const dx = x2 - x1;
    const dy = y2 - y1;
    
    if (dx === 0 && dy === 0) {
      // El segmento es un punto
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  }

  /**
   * Calcula posición para que una pieza toque el espejo
   * @param y La coordenada Y donde colocar la pieza
   * @param rotation La rotación de la pieza (opcional, por defecto 0)
   * @param pieceType El tipo de pieza (opcional, por defecto 'A')
   */
  getPositionTouchingMirror(y: number, rotation: number = 0, pieceType: 'A' | 'B' = 'A'): Position {
    // Crear una pieza temporal para calcular su bounding box con la rotación dada
    const tempPiece: PiecePosition = {
      type: pieceType,
      face: 'front',
      x: 0, // Posición temporal, será ajustada
      y: y,
      rotation: rotation
    };

    // Calcular la posición X que hará que la pieza toque exactamente el espejo
    // Primero colocamos la pieza en una posición inicial
    tempPiece.x = this.config.mirrorLineX - this.config.pieceSize;

    // Obtenemos el bounding box con esta posición inicial
    const bbox = this.getPieceBoundingBox(tempPiece);

    // Calculamos el ajuste necesario para que el borde derecho toque exactamente el espejo
    const adjustment = this.config.mirrorLineX - bbox.right;

    // Retornamos la posición ajustada
    return {
      x: tempPiece.x + adjustment,
      y: y
    };
  }

  /**
   * Calcula posición para que dos piezas se toquen horizontalmente (sin solaparse)
   */
  getHorizontalTouchingPositions(baseY: number, leftX: number): [Position, Position] {
    // Para que se toquen pero no se solapen, la segunda pieza debe estar
    // exactamente a la derecha de la primera
    // Usamos el tamaño de pieza como separación para garantizar que se toquen
    const rightX = leftX + this.config.pieceSize;

    return [
      { x: leftX, y: baseY },
      { x: rightX, y: baseY }
    ];
  }

  /**
   * Calcula posición para que dos piezas se toquen verticalmente (sin solaparse)
   */
  getVerticalTouchingPositions(baseX: number, topY: number): [Position, Position] {
    // Para que se toquen, pero no se solapen, la segunda pieza debe estar
    // exactamente debajo de la primera.
    // Usamos el tamaño de pieza como separación para garantizar que se toquen
    const bottomY = topY + this.config.pieceSize;

    return [
      { x: baseX, y: topY },
      { x: baseX, y: bottomY }
    ];
  }

  /**
   * Verifica si una posición está dentro del área de juego
   */
  isPositionInGameArea(position: Position): boolean {
    return position.x >= 0 && 
           position.x <= this.config.mirrorLineX - this.config.pieceSize &&
           position.y >= 0 && 
           position.y <= this.config.height;
  }

  /**
   * Verifica si una pieza completa (considerando su bounding box) está dentro del área de juego
   * Usa límites permisivos que coinciden con useMouseHandlers para el grid de 10px
   */
  isPiecePositionInGameArea(piece: PiecePosition): boolean {
    const bbox = this.getPieceBoundingBox(piece);
    
    // Límites permisivos que coinciden con useMouseHandlers.ts
    const minX = -50; // Permitir salir un poco por la izquierda
    const maxX = this.config.mirrorLineX + 10; // Permitir tocar ligeramente el espejo (710)
    const minY = -50; // Permitir salir un poco por arriba  
    const maxY = this.config.height + 10; // Permitir salir ligeramente por abajo (510)
    
    // Debug logging disabled to prevent console spam
    
    const result = bbox.left >= minX &&
                   bbox.right <= maxX &&
                   bbox.top >= minY &&
                   bbox.bottom <= maxY;
    
    return result;
  }

  /**
   * Detecta si dos piezas tienen áreas del mismo color que se están tocando
   */
  private doPiecesHaveSameColorContact(piece1: PiecePosition, piece2: PiecePosition): boolean {
    // Obtener los colores de ambas piezas
    const colors1 = this.getPieceColors(piece1);
    const colors2 = this.getPieceColors(piece2);
    
    // Verificar si tienen algún color en común
    const hasCommonColor = colors1.centerColor === colors2.centerColor || 
                          colors1.centerColor === colors2.triangleColor ||
                          colors1.triangleColor === colors2.centerColor ||
                          colors1.triangleColor === colors2.triangleColor;
    
    return hasCommonColor;
  }
  
  /**
   * Obtiene los colores de una pieza basado en su tipo y cara
   */
  private getPieceColors(piece: PiecePosition): { centerColor: string; triangleColor: string } {
    if (piece.face === 'front') {
      return {
        centerColor: '#FFD700', // Amarillo
        triangleColor: '#FF4444' // Rojo
      };
    } else {
      return {
        centerColor: '#FF4444', // Rojo  
        triangleColor: '#FFD700' // Amarillo
      };
    }
  }
  
  /**
   * Aplica autosnap ultra-preciso para piezas del mismo color
   * Elimina completamente los microgaps entre áreas del mismo color
   */
  private applyPrecisionSnapForSameColor(movingPiece: PiecePosition, targetPiece: PiecePosition): PiecePosition | null {
    try {
      
      // Validar entrada
      if (!movingPiece || !targetPiece) {
        console.error(`❌ Invalid pieces for same color snap`);
        return null;
      }
      
      // Encontrar los bordes más cercanos entre las piezas
      const movingEdges = this.getPieceEdges(movingPiece);
      const targetEdges = this.getPieceEdges(targetPiece);
      
      if (!movingEdges || !targetEdges || movingEdges.length === 0 || targetEdges.length === 0) {
        console.error(`❌ Could not get edges for pieces`);
        return null;
      }
      
      let bestAlignment: any = null;
      let minDistance = Infinity;
      
      // Buscar la mejor alineación entre bordes
      for (const movingEdge of movingEdges) {
        for (const targetEdge of targetEdges) {
          try {
            const alignment = this.calculateEdgeAlignment(movingEdge, targetEdge);
            const continuity = this.calculateEdgeContinuity(movingEdge, targetEdge);
            
            if (alignment > 0.7 && continuity > 0.7) { // Umbrales más estrictos para same color
              const distance = this.distanceBetweenPoints(
                [(movingEdge.start[0] + movingEdge.end[0]) / 2, (movingEdge.start[1] + movingEdge.end[1]) / 2],
                [(targetEdge.start[0] + targetEdge.end[0]) / 2, (targetEdge.start[1] + targetEdge.end[1]) / 2]
              );
              
              if (distance < minDistance && distance > 0) {
                const alignedPosition = this.calculateEdgeAlignmentPosition(movingPiece, targetPiece, {
                  movingEdge,
                  targetEdge,
                  alignmentScore: alignment,
                  continuityScore: continuity
                });
                
                if (alignedPosition && this.isValidPosition(alignedPosition)) {
                  bestAlignment = alignedPosition;
                  minDistance = distance;
                }
              }
            }
          } catch (error) {
            console.error(`❌ Error in edge calculation:`, error);
            continue;
          }
        }
      }
      
      if (bestAlignment) {
        return bestAlignment;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ CRITICAL ERROR in applyPrecisionSnapForSameColor:`, error);
      return null;
    }
  }

  /**
   * Valida que una posición sea válida (no NaN, no infinita, dentro de rangos razonables)
   */
  private isValidPosition(position: PiecePosition): boolean {
    return position &&
           typeof position.x === 'number' && 
           typeof position.y === 'number' &&
           !isNaN(position.x) && 
           !isNaN(position.y) && 
           isFinite(position.x) && 
           isFinite(position.y) &&
           position.x > -1000 && 
           position.x < 2000 && 
           position.y > -1000 && 
           position.y < 2000;
  }

  /**
   * Ajusta automáticamente la posición de una pieza usando snap inteligente geométrico
   * Detecta bordes compatibles y los alinea para formar continuidad perfecta
   * MEJORADO: Autosnap ultra-preciso para piezas del mismo color
   */
  snapPieceToNearbyTargets(piece: PiecePosition, otherPieces: PiecePosition[], snapDistance: number = 30): PiecePosition {
    try {
      // Validar entrada
      if (!piece || !this.isValidPosition(piece)) {
        console.error(`❌ Invalid piece for snap:`, piece);
        return piece;
      }
      
      let snappedPiece = { ...piece };
      
      // 0. PRIORIDAD MÁXIMA: Autosnap ultra-preciso para piezas del mismo color (LIMITADO)
      // Limitar a máximo 4 piezas para evitar bucles infinitos
      if (otherPieces.length <= 4) {
        for (const otherPiece of otherPieces) {
          try {
            const distance = this.getMinDistanceBetweenPieces(snappedPiece, otherPiece);
            
            // Si están cerca Y tienen colores compatibles, aplicar snap de precisión
            if (distance <= snapDistance * 1.5 && this.doPiecesHaveSameColorContact(snappedPiece, otherPiece)) {
              const precisionSnap = this.applyPrecisionSnapForSameColor(snappedPiece, otherPiece);
              if (precisionSnap && this.isValidPosition(precisionSnap)) {
                snappedPiece = precisionSnap;
                
                // Verificar que el resultado sea perfecto (gap < 0.1px)
                const finalDistance = this.getMinDistanceBetweenPieces(snappedPiece, otherPiece);
                if (finalDistance > 0.1) {
                  const finalAdjustment = this.closeSmallGap(snappedPiece, otherPiece, finalDistance);
                  if (finalAdjustment && this.isValidPosition(finalAdjustment)) {
                    snappedPiece = finalAdjustment;
                  }
                }
                
                return snappedPiece; // Retornar inmediatamente con el resultado perfecto
              }
            }
          } catch (error) {
            console.error(`❌ Error in same color snap for piece:`, error);
            continue;
          }
        }
      }
    
    // 1. Verificar si hay gaps pequeños que necesitan cierre inmediato (para piezas de colores diferentes)
    for (const otherPiece of otherPieces) {
      const gapDistance = this.getMinDistanceBetweenPieces(snappedPiece, otherPiece);
      
      if (gapDistance > 0.05 && gapDistance <= 15) { // Gap visible - más agresivo
        const closeGapPosition = this.closeSmallGap(snappedPiece, otherPiece, gapDistance);
        if (closeGapPosition) {
          snappedPiece = closeGapPosition;
          // Gap cerrado exitosamente
          
          // Verificar el resultado y ajustar si es necesario
          const finalGap = this.getMinDistanceBetweenPieces(snappedPiece, otherPiece);
          if (finalGap > 0.5) {
            snappedPiece = this.applyPrecisionAdjustment(snappedPiece, otherPiece, finalGap);
          }
          break; // Solo aplicar el primer cierre exitoso
        }
      }
    }
    
    // 2. Snap inteligente basado en continuidad geométrica
    let bestAlignment: any = null;
    let bestScore = 0;
    
    for (const otherPiece of otherPieces) {
      const compatibleEdges = this.findCompatibleEdges(snappedPiece, otherPiece);
      
      for (const edgePair of compatibleEdges) {
        const combinedScore = edgePair.alignmentScore * edgePair.continuityScore;
        
        if (combinedScore > bestScore) {
          // Calcular la posición necesaria para alinear perfectamente estos bordes
          const alignedPosition = this.calculateEdgeAlignmentPosition(snappedPiece, otherPiece, edgePair);
          
          if (alignedPosition) {
            bestAlignment = {
              position: alignedPosition,
              score: combinedScore,
              edgePair,
              targetPiece: otherPiece
            };
            bestScore = combinedScore;
          }
        }
      }
    }
    
    // Aplicar la mejor alineación encontrada (umbral más bajo)
    if (bestAlignment && bestScore > 0.3) {
      snappedPiece = bestAlignment.position;
      // Verificar y ajustar la penetración final
      const finalPenetration = this.getPenetrationDepth(snappedPiece, bestAlignment.targetPiece);
      if (finalPenetration > 3) {
        snappedPiece = this.adjustToPerfectContact(snappedPiece, bestAlignment.targetPiece);
      }
    } else {
      // Fallback al snap tradicional por bounding box si no hay alineación geométrica
      snappedPiece = this.traditionalSnapToNearbyTargets(snappedPiece, otherPieces, snapDistance);
    }
    
    // 3. Snap al espejo si está cerca
    const pieceBbox = this.getPieceBoundingBox(snappedPiece);
    const distanceToMirror = Math.abs(pieceBbox.right - this.config.mirrorLineX);
    if (distanceToMirror <= snapDistance) {
      const adjustment = this.config.mirrorLineX - pieceBbox.right;
      snappedPiece.x = snappedPiece.x + adjustment;
      // Debug logging disabled to prevent console spam
    }
    
      // Debug logging disabled to prevent console spam
      
      // Validar posición final
      if (!this.isValidPosition(snappedPiece)) {
        // Debug logging disabled to prevent console spam
        return piece;
      }
      
      return snappedPiece;
    } catch (error) {
      console.error(`❌ CRITICAL ERROR in snapPieceToNearbyTargets:`, error);
      return piece; // Retornar pieza original en caso de error
    }
  }

  /**
   * Cierra gaps pequeños entre piezas moviendo una hacia la otra con precisión sub-pixel
   * MEJORADO: Precisión ultra-alta para piezas del mismo color
   */
  private closeSmallGap(movingPiece: PiecePosition, targetPiece: PiecePosition, gapDistance: number): PiecePosition | null {
    // Encontrar los puntos más cercanos entre las piezas para movimiento más preciso
    const movingVertices = this.getPieceVertices(movingPiece);
    const targetVertices = this.getPieceVertices(targetPiece);
    
    let minDistance = Infinity;
    let closestMovingPoint: [number, number] | null = null;
    let closestTargetPoint: [number, number] | null = null;
    
    // Encontrar los puntos más cercanos entre ambas piezas
    for (const movingVertex of movingVertices) {
      for (const targetVertex of targetVertices) {
        const distance = this.distanceBetweenPoints(movingVertex, targetVertex);
        if (distance < minDistance) {
          minDistance = distance;
          closestMovingPoint = movingVertex;
          closestTargetPoint = targetVertex;
        }
      }
    }
    
    if (!closestMovingPoint || !closestTargetPoint) return null;
    
    // Calcular el vector de movimiento necesario para contacto perfecto
    const moveVector = [
      closestTargetPoint[0] - closestMovingPoint[0],
      closestTargetPoint[1] - closestMovingPoint[1]
    ];
    
    // Usar factor de ajuste diferente según si las piezas tienen colores compatibles
    const hasSameColorContact = this.doPiecesHaveSameColorContact(movingPiece, targetPiece);
    
    // DESHABILITADO: Snap exacto sin ajustes que causen gaps
    const adjustmentFactor = 1.0;
    
    // Debug logging disabled to prevent console spam
    
    return {
      ...movingPiece,
      x: movingPiece.x + moveVector[0] * adjustmentFactor,
      y: movingPiece.y + moveVector[1] * adjustmentFactor
    };
  }

  /**
   * Aplica ajuste de precisión final para eliminar gaps residuales
   */
  private applyPrecisionAdjustment(movingPiece: PiecePosition, targetPiece: PiecePosition, finalGap: number): PiecePosition {
    // Para gaps residuales muy pequeños, aplicar movimiento mínimo adicional
    const movingBbox = this.getPieceBoundingBox(movingPiece);
    const targetBbox = this.getPieceBoundingBox(targetPiece);
    
    const centerMoving = {
      x: (movingBbox.left + movingBbox.right) / 2,
      y: (movingBbox.top + movingBbox.bottom) / 2
    };
    const centerTarget = {
      x: (targetBbox.left + targetBbox.right) / 2,
      y: (targetBbox.top + targetBbox.bottom) / 2
    };
    
    const dx = centerTarget.x - centerMoving.x;
    const dy = centerTarget.y - centerMoving.y;
    
    // Movimiento mínimo para cerrar el gap residual
    const microAdjustment = finalGap * 0.7; // 70% del gap residual
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Ajuste horizontal
      const adjustment = dx > 0 ? microAdjustment : -microAdjustment;
      return {
        ...movingPiece,
        x: movingPiece.x + adjustment
      };
    } else {
      // Ajuste vertical
      const adjustment = dy > 0 ? microAdjustment : -microAdjustment;
      return {
        ...movingPiece,
        y: movingPiece.y + adjustment
      };
    }
  }

  /**
   * Calcula la posición exacta necesaria para alinear dos bordes perfectamente
   */
  private calculateEdgeAlignmentPosition(movingPiece: PiecePosition, targetPiece: PiecePosition, edgePair: any): PiecePosition | null {
    const { edge1: movingEdge, edge2: targetEdge } = edgePair;
    
    // Encontrar los puntos más cercanos entre los bordes
    const closestPoints = this.findClosestPointsBetweenEdges(movingEdge, targetEdge);
    
    if (!closestPoints) return null;
    
    // Calcular el vector de traslación necesario
    const translationVector = [
      closestPoints.target[0] - closestPoints.moving[0],
      closestPoints.target[1] - closestPoints.moving[1]
    ];
    
    // Aplicar una separación mínima para contacto perfecto (eliminar gaps visibles)
    const separationDistance = 1; // Reducido a 1 pixel para contacto más cercano
    const edgeNormal = [-movingEdge.direction[1], movingEdge.direction[0]]; // Perpendicular al borde
    
    // Determinar la dirección de separación (hacia adentro para cerrar gaps)
    const centerToEdge = [
      (movingEdge.start[0] + movingEdge.end[0]) / 2 - (movingPiece.x + this.config.pieceSize / 2),
      (movingEdge.start[1] + movingEdge.end[1]) / 2 - (movingPiece.y + this.config.pieceSize / 2)
    ];
    
    const normalDirection = (centerToEdge[0] * edgeNormal[0] + centerToEdge[1] * edgeNormal[1]) > 0 ? -1 : 1; // Invertido para ir hacia adentro
    
    const finalTranslation = [
      translationVector[0] + edgeNormal[0] * separationDistance * normalDirection,
      translationVector[1] + edgeNormal[1] * separationDistance * normalDirection
    ];
    
    return {
      ...movingPiece,
      x: movingPiece.x + finalTranslation[0],
      y: movingPiece.y + finalTranslation[1]
    };
  }

  /**
   * Encuentra los puntos más cercanos entre dos bordes
   */
  private findClosestPointsBetweenEdges(edge1: any, edge2: any): { moving: [number, number]; target: [number, number] } | null {
    // Para simplificar, usamos los puntos medios de los bordes
    const midpoint1: [number, number] = [(edge1.start[0] + edge1.end[0]) / 2, (edge1.start[1] + edge1.end[1]) / 2];
    const midpoint2: [number, number] = [(edge2.start[0] + edge2.end[0]) / 2, (edge2.start[1] + edge2.end[1]) / 2];
    
    return {
      moving: midpoint1,
      target: midpoint2
    };
  }

  /**
   * Snap tradicional por bounding box (fallback)
   */
  private traditionalSnapToNearbyTargets(piece: PiecePosition, otherPieces: PiecePosition[], snapDistance: number): PiecePosition {
    let snappedPiece = { ...piece };
    
    for (const otherPiece of otherPieces) {
      const snapResult = this.snapPieceToTarget(snappedPiece, otherPiece, snapDistance);
      if (snapResult.snapped) {
        snappedPiece = snapResult.piece;
        // Debug logging disabled to prevent console spam
        break; // Solo aplicar el primer snap exitoso
      }
    }
    
    return snappedPiece;
  }

  /**
   * Ajusta dos piezas para que tengan contacto perfecto (sin gap ni penetración excesiva)
   */
  private adjustToPerfectContact(piece: PiecePosition, targetPiece: PiecePosition): PiecePosition {
    const penetrationDepth = this.getPenetrationDepth(piece, targetPiece);
    
    if (penetrationDepth <= 0.1) {
      return piece; // Ya está en contacto perfecto
    }
    
    if (penetrationDepth > 3) {
      // Reducir penetración excesiva
      return this.resolvePenetration(piece, targetPiece, penetrationDepth);
    }
    
    // Penetración entre 0.1-3px es contacto perfecto
    return piece;
  }

  /**
   * Resuelve la penetración entre dos piezas para lograr contacto perfecto
   * No separa las piezas, sino que las ajusta al contacto ideal (1-2px de penetración)
   */
  private resolvePenetration(piece: PiecePosition, otherPiece: PiecePosition, penetrationDepth: number): PiecePosition {
    if (penetrationDepth <= 3) {
      return piece; // Ya está en rango de contacto perfecto
    }
    
    // Calcular el vector de ajuste para reducir penetración
    const pieceBbox = this.getPieceBoundingBox(piece);
    const otherBbox = this.getPieceBoundingBox(otherPiece);
    
    // Determinar la dirección de ajuste con menor movimiento
    const overlapLeft = pieceBbox.right - otherBbox.left;
    const overlapRight = otherBbox.right - pieceBbox.left;
    const overlapTop = pieceBbox.bottom - otherBbox.top;
    const overlapBottom = otherBbox.bottom - pieceBbox.top;
    
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
    
    // Calcular ajuste para llegar a contacto perfecto (2px de penetración)
    const targetPenetration = 2;
    const adjustmentNeeded = minOverlap - targetPenetration;
    
    if (minOverlap === overlapLeft) {
      // Ajustar hacia la izquierda
      return { ...piece, x: piece.x - adjustmentNeeded };
    } else if (minOverlap === overlapRight) {
      // Ajustar hacia la derecha
      return { ...piece, x: piece.x + adjustmentNeeded };
    } else if (minOverlap === overlapTop) {
      // Ajustar hacia arriba
      return { ...piece, y: piece.y - adjustmentNeeded };
    } else {
      // Ajustar hacia abajo
      return { ...piece, y: piece.y + adjustmentNeeded };
    }
  }

  /**
   * Intenta hacer snap de una pieza hacia otra específica
   */
  private snapPieceToTarget(piece: PiecePosition, targetPiece: PiecePosition, snapDistance: number): {
    snapped: boolean;
    piece: PiecePosition;
    direction?: string;
    adjustment?: number;
  } {
    const pieceBbox = this.getPieceBoundingBox(piece);
    const targetBbox = this.getPieceBoundingBox(targetPiece);
    
    // Buscar las conexiones más cercanas en cada dirección
    const connections = [
      {
        direction: 'RIGHT',
        gap: Math.abs(pieceBbox.left - targetBbox.right),
        overlap: this.piecesOverlapVertically(pieceBbox, targetBbox),
        adjustment: targetBbox.right - pieceBbox.left,
        axis: 'x'
      },
      {
        direction: 'LEFT',
        gap: Math.abs(pieceBbox.right - targetBbox.left),
        overlap: this.piecesOverlapVertically(pieceBbox, targetBbox),
        adjustment: targetBbox.left - pieceBbox.right,
        axis: 'x'
      },
      {
        direction: 'BOTTOM',
        gap: Math.abs(pieceBbox.top - targetBbox.bottom),
        overlap: this.piecesOverlapHorizontally(pieceBbox, targetBbox),
        adjustment: targetBbox.bottom - pieceBbox.top,
        axis: 'y'
      },
      {
        direction: 'TOP',
        gap: Math.abs(pieceBbox.bottom - targetBbox.top),
        overlap: this.piecesOverlapHorizontally(pieceBbox, targetBbox),
        adjustment: targetBbox.top - pieceBbox.bottom,
        axis: 'y'
      }
    ];
    
    // Encontrar la conexión más cercana que sea válida
    const validConnections = connections.filter(conn => conn.gap <= snapDistance && conn.overlap);
    if (validConnections.length === 0) {
      return { snapped: false, piece };
    }
    
    // Ordenar por distancia y tomar la más cercana
    const closestConnection = validConnections.sort((a, b) => a.gap - b.gap)[0];
    
    const snappedPiece = { ...piece };
    if (closestConnection.axis === 'x') {
      snappedPiece.x = piece.x + closestConnection.adjustment;
    } else {
      snappedPiece.y = piece.y + closestConnection.adjustment;
    }
    
    return {
      snapped: true,
      piece: snappedPiece,
      direction: closestConnection.direction,
      adjustment: Math.abs(closestConnection.adjustment)
    };
  }

  /**
   * Verifica si dos bounding boxes se solapan verticalmente
   */
  private piecesOverlapVertically(bbox1: any, bbox2: any): boolean {
    return !(bbox1.bottom <= bbox2.top || bbox2.bottom <= bbox1.top);
  }

  /**
   * Verifica si dos bounding boxes se solapan horizontalmente
   */
  private piecesOverlapHorizontally(bbox1: any, bbox2: any): boolean {
    return !(bbox1.right <= bbox2.left || bbox2.right <= bbox1.left);
  }

  /**
   * Escala coordenadas para mostrar en un área más pequeña (como challenge card)
   */
  scalePosition(position: Position, scaleFactor: number, offset: Position = { x: 0, y: 0 }): Position {
    return {
      x: offset.x + (position.x * scaleFactor),
      y: offset.y + (position.y * scaleFactor)
    };
  }

  /**
   * Calcula el cuadro delimitador de una pieza considerando su rotación
   */
  getPieceBoundingBox(piece: PiecePosition): { left: number; right: number; top: number; bottom: number } {
    const size = this.config.pieceSize;
    const unit = size * 1.28;
    const rad = (piece.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Vértices del contorno de la pieza
    const shapeVertices = [
      [0, 0], [1, 0], [2, 0], [2.5, 0.5], [2, 1], [1.5, 1.5], [1, 1],
    ];

    let minRotX = Infinity, maxRotX = -Infinity;
    let minRotY = Infinity, maxRotY = -Infinity;

    for (const [x_u, y_u] of shapeVertices) {
      let localX = x_u * unit;
      const localY = -y_u * unit;

      // Si es pieza tipo B, aplicar el volteo horizontal
      if (piece.type === 'B') {
        localX = -localX;
      }

      // Aplica la rotación a cada vértice
      const rotatedX = localX * cos - localY * sin;
      const rotatedY = localX * sin + localY * cos;

      minRotX = Math.min(minRotX, rotatedX);
      maxRotX = Math.max(maxRotX, rotatedX);
      minRotY = Math.min(minRotY, rotatedY);
      maxRotY = Math.max(maxRotY, rotatedY);
    }

    // El centro de rotación real en el canvas
    const centerX = piece.x + size / 2;
    const centerY = piece.y + size / 2;

    return {
      left: centerX + minRotX,
      right: centerX + maxRotX,
      top: centerY + minRotY,
      bottom: centerY + maxRotY,
    };
  }

  /**
   * Detecta colisión con el espejo (pieza intentando cruzar la línea del espejo)
   * Permite que las piezas toquen el espejo con tolerancia para grid fijo
   */
  detectMirrorCollision(piece: PiecePosition): boolean {
    const bbox = this.getPieceBoundingBox(piece);
    const toleranceForTouch = 15; // Tolerancia para permitir tocar el espejo
    
    // Debug logging disabled to prevent console spam
    const penetration = bbox.right - this.config.mirrorLineX;
    
    // Solo considerar colisión si la pieza penetra significativamente en el espejo
    return penetration > toleranceForTouch;
  }

  /**
   * Detecta colisión con los bordes del área de juego
   */
  detectGameAreaBoundaryCollision(piece: PiecePosition): {
    hasCollision: boolean;
    leftBoundary: boolean;
    rightBoundary: boolean;
    topBoundary: boolean;
    bottomBoundary: boolean;
  } {
    const bbox = this.getPieceBoundingBox(piece);

    const leftBoundary = bbox.left < 0;
    const rightBoundary = bbox.right > this.config.mirrorLineX;
    const topBoundary = bbox.top < 0;
    const bottomBoundary = bbox.bottom > this.config.height;

    return {
      hasCollision: leftBoundary || rightBoundary || topBoundary || bottomBoundary,
      leftBoundary,
      rightBoundary,
      topBoundary,
      bottomBoundary
    };
  }

  /**
   * Detecta colisión con toda el área del canvas (incluyendo área de piezas disponibles)
   */
  detectCanvasBoundaryCollision(piece: PiecePosition, canvasWidth: number, canvasHeight: number): {
    hasCollision: boolean;
    leftBoundary: boolean;
    rightBoundary: boolean;
    topBoundary: boolean;
    bottomBoundary: boolean;
  } {
    const bbox = this.getPieceBoundingBox(piece);

    const leftBoundary = bbox.left < 0;
    const rightBoundary = bbox.right > canvasWidth;
    const topBoundary = bbox.top < 0;
    const bottomBoundary = bbox.bottom > canvasHeight;

    return {
      hasCollision: leftBoundary || rightBoundary || topBoundary || bottomBoundary,
      leftBoundary,
      rightBoundary,
      topBoundary,
      bottomBoundary
    };
  }

  /**
   * Detecta si dos piezas específicas se están solapando
   */
  detectPieceCollision(piece1: PiecePosition, piece2: PiecePosition): boolean {
    return this.doPiecesOverlap(piece1, piece2);
  }

  /**
   * Detecta si una pieza se solapa con su propio reflejo en el espejo
   * IMPORTANTE: Si la pieza está tocando correctamente el espejo, su reflejo
   * coincidirá exactamente con ella en la línea del espejo, lo cual es esperado
   * y no debe considerarse como solapamiento problemático.
   */
  detectPieceReflectionOverlap(piece: PiecePosition): boolean {
    // Si la pieza está tocando el espejo correctamente, no hay solapamiento problemático
    if (this.isPieceTouchingMirror(piece)) {
      return false; // Las piezas que tocan el espejo pueden "coincidir" con su reflejo
    }
    
    // Solo verificar solapamiento real si la pieza NO está tocando el espejo
    const reflectedPiece = this.reflectPieceAcrossMirror(piece);
    return this.doPiecesOverlap(piece, reflectedPiece);
  }

  /**
   * Detecta si una pieza está tocando exactamente la línea del espejo
   */
  isPieceTouchingMirror(piece: PiecePosition): boolean {
    const bbox = this.getPieceBoundingBox(piece);
    const tolerance = 12; // Tolerancia aumentada para grid fijo de 10px
    
    // Debug logging disabled to prevent console spam
    const distance = Math.abs(bbox.right - this.config.mirrorLineX);

    return distance <= tolerance;
  }

  /**
   * Detecta si una pieza toca su reflejo sin solaparse (posición ideal)
   */
  isPieceTouchingReflection(piece: PiecePosition): boolean {
    const reflectedPiece = this.reflectPieceAcrossMirror(piece);

    // Verificar que se toquen pero no se solapen
    const touching = this.doPiecesTouch(piece, reflectedPiece);
    const overlapping = this.doPiecesOverlap(piece, reflectedPiece);

    return touching && !overlapping;
  }

  /**
   * Calcula la distancia de una pieza a la línea del espejo
   */
  getDistanceToMirror(piece: PiecePosition): number {
    const bbox = this.getPieceBoundingBox(piece);
    return Math.abs(bbox.right - this.config.mirrorLineX);
  }

  /**
   * Detecta colisiones de una pieza con una lista de otras piezas
   */
  detectPieceCollisions(targetPiece: PiecePosition, otherPieces: PiecePosition[]): {
    hasCollisions: boolean;
    collidingPieces: PiecePosition[];
  } {
    const collidingPieces = otherPieces.filter(piece => 
      this.detectPieceCollision(targetPiece, piece)
    );

    return {
      hasCollisions: collidingPieces.length > 0,
      collidingPieces
    };
  }

  /**
   * Constrain (ajusta) la posición de una pieza para evitar colisiones
   */
  constrainPiecePosition(
    piece: PiecePosition, 
    canvasWidth: number, 
    canvasHeight: number, 
    respectMirror: boolean = true
  ): PiecePosition {
    const bbox = this.getPieceBoundingBox(piece);
    let newX = piece.x;
    let newY = piece.y;

    // Límite izquierdo
    if (bbox.left < 0) {
      const overlap = -bbox.left;
      newX = piece.x + overlap;
    }

    // Límite del espejo (si debe respetarlo y está en área de juego)
    if (respectMirror && piece.y < this.config.height && bbox.right > this.config.mirrorLineX) {
      const overlap = bbox.right - this.config.mirrorLineX;
      newX = piece.x - overlap;
    }

    // Límite derecho del canvas (si no respeta el espejo o está en área de storage)
    if ((!respectMirror || piece.y >= this.config.height) && bbox.right > canvasWidth) {
      const overlap = bbox.right - canvasWidth;
      newX = piece.x - overlap;
    }

    // Límites verticales
    if (bbox.bottom > canvasHeight) {
      const overlap = bbox.bottom - canvasHeight;
      newY = piece.y - overlap;
    }

    if (bbox.top < 0) {
      const overlap = -bbox.top;
      newY = piece.y + overlap;
    }

    return { ...piece, x: newX, y: newY };
  }

  /**
   * Verifica si una pieza puede ser colocada en una posición sin colisiones
   */
  canPlacePieceAt(
    piece: PiecePosition, 
    otherPieces: PiecePosition[], 
    canvasWidth: number, 
    canvasHeight: number
  ): {
    canPlace: boolean;
    boundaryCollision: boolean;
    mirrorCollision: boolean;
    pieceCollisions: boolean;
  } {
    const boundaryCollision = this.detectCanvasBoundaryCollision(piece, canvasWidth, canvasHeight).hasCollision;
    const mirrorCollision = this.detectMirrorCollision(piece);
    const pieceCollisions = this.detectPieceCollisions(piece, otherPieces).hasCollisions;

    return {
      canPlace: !boundaryCollision && !mirrorCollision && !pieceCollisions,
      boundaryCollision,
      mirrorCollision,
      pieceCollisions
    };
  }

  /**
   * Valida que un conjunto de piezas forme un patrón válido
   */
  validatePattern(pieces: PiecePosition[]): {
    isValid: boolean;
    hasOverlaps: boolean;
    allPiecesTouch: boolean;
    inGameArea: boolean;
  } {
    // Verificar solapamientos
    const hasOverlaps = pieces.some((piece1, i) =>
      pieces.slice(i + 1).some(piece2 => this.doPiecesOverlap(piece1, piece2))
    );

    // Verificar que todas las piezas se toquen (para patrones con múltiples piezas)
    let allPiecesTouch = true;
    if (pieces.length > 1) {
      allPiecesTouch = pieces.every((piece1, i) =>
        pieces.some((piece2, j) => i !== j && this.doPiecesTouch(piece1, piece2))
      );
    }

    // Verificar que todas estén en área de juego
    const inGameArea = pieces.every(piece => this.isPositionInGameArea(piece));

    return {
      isValid: !hasOverlaps && allPiecesTouch && inGameArea,
      hasOverlaps,
      allPiecesTouch,
      inGameArea
    };
  }

  /**
   * Verifica si todas las piezas están conectadas (forman una figura continua)
   * Una pieza está conectada si:
   * 1. Toca al menos a otra pieza del conjunto, o
   * 2. Toca el espejo
   * 
   * Las piezas deben formar un grupo conectado, pero no es obligatorio que toquen el espejo
   * (excepto en el caso de una sola pieza, que debe tocar el espejo)
   */
  arePiecesConnected(pieces: PiecePosition[]): boolean {
    if (pieces.length === 0) return true; // No hay piezas, trivialmente conectadas

    // Si hay una sola pieza, debe tocar el espejo
    if (pieces.length === 1) {
      return this.isPieceTouchingMirror(pieces[0]);
    }

    // Identificar piezas que tocan el espejo
    const touchesMirror: boolean[] = pieces.map(piece => this.isPieceTouchingMirror(piece));

    // Usamos un algoritmo de búsqueda en profundidad (DFS) para verificar la conectividad
    const visited = new Set<number>();
    const adjacencyList: { [key: number]: number[] } = {};

    // Construir lista de adyacencia
    for (let i = 0; i < pieces.length; i++) {
      adjacencyList[i] = [];
      for (let j = 0; j < pieces.length; j++) {
        if (i !== j && this.doPiecesTouch(pieces[i], pieces[j])) {
          adjacencyList[i].push(j);
        }
      }
    }

    // Función DFS recursiva
    const dfs = (node: number) => {
      visited.add(node);
      for (const neighbor of adjacencyList[node]) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        }
      }
    };

    // Iniciar DFS desde una pieza que toca el espejo
    const startNode = touchesMirror.findIndex(touches => touches);
    if (startNode !== -1) {
      dfs(startNode);
    } else {
      // Si no hay piezas que toquen el espejo, iniciar desde la primera pieza
      dfs(0);
    }

    // Si todos los nodos fueron visitados, las piezas están conectadas
    return visited.size === pieces.length;
  }

  /**
   * Verifica si todas las piezas caben dentro del área de reto
   */
  doPiecesFitInChallengeArea(pieces: PiecePosition[]): boolean {
    // Debug logging disabled to prevent console spam

    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];

      // Verificar que la pieza original esté dentro del área de juego usando los límites permisivos
      if (!this.isPiecePositionInGameArea(piece)) {
        return false;
      }

      // Verificar que el reflejo esté dentro del área del espejo
      const reflectedPiece = this.reflectPieceAcrossMirror(piece);

      const reflectedBbox = this.getPieceBoundingBox(reflectedPiece);

      // Para piezas que no tocan el espejo, el reflejo puede cruzar hacia el área de juego
      // Solo verificamos si la pieza DEBE tocar el espejo
      const pieceTouchesMirror = this.isPieceTouchingMirror(piece);
      
      if (!pieceTouchesMirror) {
        // Si la pieza no toca el espejo, el reflejo puede estar en cualquier lado
        // pero debe estar dentro del área total (juego + espejo)
        if (reflectedBbox.left < 0 || reflectedBbox.right > 2 * this.config.mirrorLineX) {
          return false;
        }
      } else {
        // Si la pieza toca el espejo, su reflejo debe estar en el área del espejo
        const tolerance = 5; // Tolerancia pequeña para errores de cálculo
        if (reflectedBbox.left < this.config.mirrorLineX - tolerance) {
          return false;
        }
      }
    }

    return true;
  }



  /**
   * Valida si una challenge card es válida según las reglas:
   * 1. Al menos una pieza debe tocar el espejo
   * 2. Ninguna pieza se puede solapar significativamente (solapamientos mínimos de bordes son permitidos)
   * 3. Las piezas no pueden entrar dentro del espejo
   * 4. Todas las piezas deben estar conectadas (formar una figura continua)
   * 5. Todas las piezas deben caber dentro del área de reto
   */
  validateChallengeCard(pieces: PiecePosition[]): {
    isValid: boolean;
    hasReflectionOverlaps: boolean;
    hasPieceOverlaps: boolean;
    touchesMirror: boolean;
    entersMirror: boolean;
    piecesConnected: boolean;
    piecesInArea: boolean;
  } {
    // Verificar solapamientos SIGNIFICATIVOS entre piezas normales
    // Permitimos solapamientos mínimos que indican piezas bien conectadas
    const hasPieceOverlaps = pieces.some((piece1, i) =>
      pieces.slice(i + 1).some(piece2 => this.doPiecesOverlapSignificantly(piece1, piece2))
    );

    // Verificar solapamientos entre piezas y sus reflejos
    const hasReflectionOverlaps = pieces.some(piece => 
      this.detectPieceReflectionOverlap(piece)
    );

    // Verificar que al menos una pieza toque el espejo
    const touchesMirror = pieces.some(piece => this.isPieceTouchingMirror(piece));

    // Verificar que ninguna pieza entre dentro del espejo
    const entersMirror = pieces.some(piece => this.detectMirrorCollision(piece));

    // Verificar que todas las piezas estén conectadas
    const piecesConnected = this.arePiecesConnected(pieces);

    // Verificar que todas las piezas quepan en el área de reto
    const piecesInArea = this.doPiecesFitInChallengeArea(pieces);

    // Debug logging disabled to prevent console spam

    return {
      isValid: !hasPieceOverlaps && !hasReflectionOverlaps && touchesMirror && !entersMirror && piecesConnected && piecesInArea,
      hasReflectionOverlaps,
      hasPieceOverlaps,
      touchesMirror,
      entersMirror,
      piecesConnected,
      piecesInArea
    };
  }

  /**
   * Verifica si una pieza está completamente dentro del área de almacenamiento de piezas
   */
  isPieceCompletelyInStorageArea(piece: PiecePosition, canvasWidth: number, canvasHeight: number): boolean {
    const storageAreaTop = this.config.height; // y >= 600
    const storageAreaBottom = canvasHeight; // y <= 1000
    const storageAreaLeft = 0; // x >= 0
    const storageAreaRight = canvasWidth; // x <= 1400 (extended storage area)
    
    const bbox = this.getPieceBoundingBox(piece);
    
    const isInside = bbox.left >= storageAreaLeft && 
                    bbox.right <= storageAreaRight && 
                    bbox.top >= storageAreaTop && 
                    bbox.bottom <= storageAreaBottom;
    
    
    return isInside;
  }

  /**
   * Ajusta la posición de una pieza para que esté completamente dentro del área de almacenamiento
   */
  constrainPieceToStorageArea(piece: PiecePosition, canvasWidth: number, canvasHeight: number): PiecePosition {
    const storageAreaTop = this.config.height; // y >= 600
    const storageAreaBottom = canvasHeight; // y <= 1000
    const storageAreaLeft = 0; // x >= 0
    const storageAreaRight = canvasWidth; // x <= 1400 (extended storage area)
    
    const bbox = this.getPieceBoundingBox(piece);
    let newX = piece.x;
    let newY = piece.y;
    
    // Ajustar horizontalmente
    if (bbox.left < storageAreaLeft) {
      const overlap = storageAreaLeft - bbox.left;
      newX = piece.x + overlap;
    } else if (bbox.right > storageAreaRight) {
      const overlap = bbox.right - storageAreaRight;
      newX = piece.x - overlap;
    }
    
    // Ajustar verticalmente
    if (bbox.top < storageAreaTop) {
      const overlap = storageAreaTop - bbox.top;
      newY = piece.y + overlap;
    } else if (bbox.bottom > storageAreaBottom) {
      const overlap = bbox.bottom - storageAreaBottom;
      newY = piece.y - overlap;
    }
    
    return {
      ...piece,
      x: newX,
      y: newY
    };
  }
}