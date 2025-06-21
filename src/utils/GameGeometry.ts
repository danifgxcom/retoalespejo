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
    console.log(`🪞 MIRROR REFLECTION: original(${piece.x}, ${piece.y}) bbox[${originalBbox.left.toFixed(1)}, ${originalBbox.right.toFixed(1)}] -> reflected(${reflectedX.toFixed(2)}, ${piece.y}) bbox[${reflectedBbox.left.toFixed(1)}, ${reflectedBbox.right.toFixed(1)}]`);

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
   * Calcula si dos piezas se solapan usando detección de colisión precisa entre polígonos
   */
  doPiecesOverlap(piece1: PiecePosition, piece2: PiecePosition): boolean {
    const vertices1 = this.getPieceVertices(piece1);
    const vertices2 = this.getPieceVertices(piece2);

    return this.doPolygonsOverlap(vertices1, vertices2);
  }

  /**
   * Algoritmo SAT (Separating Axes Theorem) para detectar colisión entre polígonos
   */
  private doPolygonsOverlap(vertices1: Array<[number, number]>, vertices2: Array<[number, number]>): boolean {
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

        // Si hay separación en este eje, no hay colisión
        if (projection1.max < projection2.min || projection2.max < projection1.min) {
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
   * Verifica si dos piezas se tocan sin solaparse usando detección precisa
   */
  doPiecesTouch(piece1: PiecePosition, piece2: PiecePosition): boolean {
    // Verificar si se solapan (si se solapan, no solo se tocan)
    if (this.doPiecesOverlap(piece1, piece2)) {
      return false; // Si se solapan, no se consideran "tocándose"
    }

    // Calcular la distancia mínima entre las dos piezas
    const minDistance = this.getMinDistanceBetweenPieces(piece1, piece2);
    
    // Las piezas se tocan si están muy cerca (tolerancia pequeña)
    const tolerance = 5; // Tolerancia para considerar que se tocan
    return minDistance <= tolerance;
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
   */
  isPiecePositionInGameArea(piece: PiecePosition): boolean {
    const bbox = this.getPieceBoundingBox(piece);
    return bbox.left >= 0 &&
           bbox.right <= this.config.mirrorLineX &&
           bbox.top >= 0 &&
           bbox.bottom <= this.config.height;
  }

  /**
   * Ajusta automáticamente la posición de una pieza para que se conecte perfectamente
   * con otras piezas cercanas o con el espejo
   */
  snapPieceToNearbyTargets(piece: PiecePosition, otherPieces: PiecePosition[], snapDistance: number = 15): PiecePosition {
    let snappedPiece = { ...piece };
    const pieceBbox = this.getPieceBoundingBox(piece);
    
    // 1. Snap al espejo si está cerca
    const distanceToMirror = Math.abs(pieceBbox.right - this.config.mirrorLineX);
    if (distanceToMirror <= snapDistance) {
      // Calcular nueva posición X para que el bounding box toque exactamente el espejo
      const adjustment = this.config.mirrorLineX - pieceBbox.right;
      snappedPiece.x = piece.x + adjustment;
      console.log(`🧲 SNAP TO MIRROR: Adjusted piece by ${adjustment.toFixed(2)} pixels`);
    }
    
    // 2. Snap a otras piezas cercanas
    for (const otherPiece of otherPieces) {
      if (otherPiece === piece) continue;
      
      const otherBbox = this.getPieceBoundingBox(otherPiece);
      const currentPieceBbox = this.getPieceBoundingBox(snappedPiece);
      
      // Snap horizontal (side-by-side)
      const horizontalGapLeft = Math.abs(currentPieceBbox.right - otherBbox.left);
      const horizontalGapRight = Math.abs(otherBbox.right - currentPieceBbox.left);
      
      if (horizontalGapLeft <= snapDistance && this.piecesOverlapVertically(currentPieceBbox, otherBbox)) {
        // Snap pieza actual a la izquierda de la otra pieza
        const adjustment = otherBbox.left - currentPieceBbox.right;
        snappedPiece.x = snappedPiece.x + adjustment;
        console.log(`🧲 SNAP HORIZONTAL LEFT: Adjusted piece by ${adjustment.toFixed(2)} pixels`);
      } else if (horizontalGapRight <= snapDistance && this.piecesOverlapVertically(currentPieceBbox, otherBbox)) {
        // Snap pieza actual a la derecha de la otra pieza
        const adjustment = otherBbox.right - currentPieceBbox.left;
        snappedPiece.x = snappedPiece.x + adjustment;
        console.log(`🧲 SNAP HORIZONTAL RIGHT: Adjusted piece by ${adjustment.toFixed(2)} pixels`);
      }
      
      // Snap vertical (top-bottom)
      const verticalGapTop = Math.abs(currentPieceBbox.bottom - otherBbox.top);
      const verticalGapBottom = Math.abs(otherBbox.bottom - currentPieceBbox.top);
      
      if (verticalGapTop <= snapDistance && this.piecesOverlapHorizontally(currentPieceBbox, otherBbox)) {
        // Snap pieza actual arriba de la otra pieza
        const adjustment = otherBbox.top - currentPieceBbox.bottom;
        snappedPiece.y = snappedPiece.y + adjustment;
        console.log(`🧲 SNAP VERTICAL TOP: Adjusted piece by ${adjustment.toFixed(2)} pixels`);
      } else if (verticalGapBottom <= snapDistance && this.piecesOverlapHorizontally(currentPieceBbox, otherBbox)) {
        // Snap pieza actual debajo de la otra pieza
        const adjustment = otherBbox.bottom - currentPieceBbox.top;
        snappedPiece.y = snappedPiece.y + adjustment;
        console.log(`🧲 SNAP VERTICAL BOTTOM: Adjusted piece by ${adjustment.toFixed(2)} pixels`);
      }
    }
    
    return snappedPiece;
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
   */
  detectMirrorCollision(piece: PiecePosition): boolean {
    const bbox = this.getPieceBoundingBox(piece);
    return bbox.right > this.config.mirrorLineX;
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
    const tolerance = 1; // Tolerancia de 1 pixel

    return Math.abs(bbox.right - this.config.mirrorLineX) <= tolerance;
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

    // Límite del espejo (si debe respetarlo)
    if (respectMirror && bbox.right > this.config.mirrorLineX) {
      const overlap = bbox.right - this.config.mirrorLineX;
      newX = piece.x - overlap;
    }

    // Límite derecho del canvas (si no respeta el espejo)
    if (!respectMirror && bbox.right > canvasWidth) {
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
    console.log(`🔍 CHECKING ${pieces.length} PIECES IN CHALLENGE AREA`);

    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      console.log(`\n--- PIECE ${i + 1} ---`);
      console.log(`Position: (${piece.x}, ${piece.y}), rotation: ${piece.rotation}°`);

      // Verificar que la pieza original esté dentro del área de juego
      const originalBbox = this.getPieceBoundingBox(piece);
      console.log(`Original bbox:`, originalBbox);

      const withinGameArea = originalBbox.left >= 0 && originalBbox.right <= this.config.mirrorLineX &&
          originalBbox.top >= 0 && originalBbox.bottom <= this.config.height;

      if (!withinGameArea) {
        console.log(`❌ Original piece outside game area`);
        return false;
      }

      // Verificar que el reflejo esté dentro del área del espejo
      const reflectedPiece = this.reflectPieceAcrossMirror(piece);
      console.log(`Reflected piece position: (${reflectedPiece.x}, ${reflectedPiece.y})`);

      const reflectedBbox = this.getPieceBoundingBox(reflectedPiece);
      console.log(`Reflected bbox:`, reflectedBbox);

      // Para piezas que no tocan el espejo, el reflejo puede cruzar hacia el área de juego
      // Solo verificamos si la pieza DEBE tocar el espejo
      const pieceTouchesMirror = this.isPieceTouchingMirror(piece);
      
      if (!pieceTouchesMirror) {
        // Si la pieza no toca el espejo, el reflejo puede estar en cualquier lado
        // pero debe estar dentro del área total (juego + espejo)
        if (reflectedBbox.left < 0 || reflectedBbox.right > 2 * this.config.mirrorLineX) {
          console.log(`❌ Reflected piece outside total area: left=${reflectedBbox.left}, right=${reflectedBbox.right}`);
          return false;
        }
      } else {
        // Si la pieza toca el espejo, su reflejo debe estar en el área del espejo
        const tolerance = 5; // Tolerancia pequeña para errores de cálculo
        if (reflectedBbox.left < this.config.mirrorLineX - tolerance) {
          console.log(`❌ Reflected piece of mirror-touching piece crosses back: left=${reflectedBbox.left} < ${this.config.mirrorLineX - tolerance}`);
          return false;
        }
      }

      console.log(`✅ Piece ${i + 1} validation passed`);
    }

    console.log(`✅ ALL PIECES FIT IN CHALLENGE AREA`);
    return true;
  }



  /**
   * Valida si una challenge card es válida según las reglas:
   * 1. Al menos una pieza debe tocar el espejo
   * 2. Ninguna pieza se puede solapar
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
    // Verificar solapamientos entre piezas normales
    const hasPieceOverlaps = pieces.some((piece1, i) =>
      pieces.slice(i + 1).some(piece2 => this.doPiecesOverlap(piece1, piece2))
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
}