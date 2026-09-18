import type { Piece, PiecePosition } from './types';
import { getPieceExtent, getWorldVertices } from './PieceShape';

export type { Piece, PiecePosition } from './types';

export interface Position {
  x: number;
  y: number;
}

export interface GameAreaConfig {
  width: number;
  height: number;
  mirrorLineX: number;
  pieceSize: number;
}

type PieceEdge = {
  start: [number, number];
  end: [number, number];
  direction: [number, number];
  length: number;
  type: 'straight' | 'diagonal';
};

type CompatibleEdgePair = {
  edge1: PieceEdge;
  edge2: PieceEdge;
  alignmentScore: number;
  continuityScore: number;
};

type BoundingBox = { left: number; right: number; top: number; bottom: number };

/**
 * Paso de la retícula en la que el jugador suelta las piezas.
 *
 * Lo importa `useMouseHandlers` para encajar las piezas: es la misma constante
 * para que la tolerancia geométrica y el encaje no puedan separarse.
 */
export const PLACEMENT_GRID_PX = 10;

/**
 * Tolerancias geométricas, en un solo sitio y derivadas de la retícula.
 *
 * Con el ancla en el centro y la geometría real de la pieza (en vez de la caja
 * de `pieceSize` que nunca existió), el error de cálculo propio es del orden de
 * 1px. Pero el límite real no es ése: como el jugador sólo puede soltar las
 * piezas en múltiplos de `PLACEMENT_GRID_PX`, y el redondeo actúa en los DOS
 * ejes, una colocación perfecta a ojo se desvía hasta media diagonal de la
 * retícula. Exigir menos margen que eso haría los retos IMPOSIBLES de resolver
 * aunque el jugador lo hiciera todo bien — lo comprueba
 * `tests/integration/Winnable.test.ts`, que juega los 16 retos.
 *
 * O sea: no es un margen generoso, es el mínimo coherente con cómo se colocan
 * las piezas.
 *
 * Se comprobó empíricamente que NO se puede bajar: con 1.5px, 11 de los 16
 * retos se vuelven inválidos. El motivo de fondo es que la retícula de 10px es
 * inconmensurable con la geometría de la pieza (lado 128px y giros de 45°, o
 * sea múltiplos de 128·√2/2 ≈ 90.5px), así que el contacto exacto entre piezas
 * sencillamente no existe sobre esta retícula.
 *
 * Esta constante sigue siendo la tolerancia con la que se DECIDE si dos piezas
 * se tocan. Los microhuecos que dejaba (hasta 7px, visibles) los cierra ahora
 * `refineToExactContact`, que al soltar pega la pieza al borde exacto de su
 * vecina en vez de dejarla donde la heurística la puso.
 */
const TOUCH_TOLERANCE_PX = PLACEMENT_GRID_PX * Math.SQRT1_2;
const OVERLAP_TOLERANCE_PX = PLACEMENT_GRID_PX * Math.SQRT1_2;

/** Caja envolvente de un contorno ya calculado. */
const boundsOf = (vertices: Array<[number, number]>): BoundingBox => ({
  left: Math.min(...vertices.map(([x]) => x)),
  right: Math.max(...vertices.map(([x]) => x)),
  top: Math.min(...vertices.map(([, y]) => y)),
  bottom: Math.max(...vertices.map(([, y]) => y)),
});

/** Separación entre dos cajas: cota INFERIOR de la distancia entre sus figuras. */
const boxGap = (a: BoundingBox, b: BoundingBox): number => {
  const dx = Math.max(0, b.left - a.right, a.left - b.right);
  const dy = Math.max(0, b.top - a.bottom, a.top - b.bottom);
  return dx === 0 ? dy : dy === 0 ? dx : Math.hypot(dx, dy);
};

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
   * Calcula el reflejo de una pieza al otro lado del espejo.
   *
   * Un espejo no traslada la pieza: la invierte. Como la forma es quiral, el
   * reflejo de un tipo A es un tipo B (y al revés) y el sentido de giro se
   * invierte. Con el centro de la pieza como ancla, la posición es
   * simplemente `x' = 2 * mirrorLineX - x`.
   */
  reflectPieceAcrossMirror(piece: PiecePosition): PiecePosition {
    return {
      ...piece,
      type: piece.type === 'A' ? 'B' : 'A',
      rotation: (360 - (piece.rotation % 360)) % 360,
      x: 2 * this.config.mirrorLineX - piece.x,
    };
  }

  /**
   * Reflejo para las challenge cards. Es la misma reflexión que en el área de
   * juego: se mantiene como alias para no romper a quien ya la llamaba.
   */
  reflectPieceForChallengeCard(piece: PiecePosition): PiecePosition {
    return this.reflectPieceAcrossMirror(piece);
  }

  /**
   * Verifica si una pieza está en el área de juego (no en el área de piezas disponibles).
   *
   * Compara el CENTRO de la pieza, no su bounding box: es un criterio estable
   * (no depende de la rotación) y evita que una pieza a medio meter en el área
   * ya cuente como "colocada" sólo porque una esquina la toca.
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
    const vertices = getWorldVertices(piece, this.config.pieceSize);
    // Se repite el primer vértice al final: el resto de la clase recorre los
    // bordes como pares consecutivos y espera el contorno cerrado.
    return [...vertices, vertices[0]];
  }

  /**
   * Obtiene los bordes de una pieza como segmentos de línea
   */
  getPieceEdges(piece: PiecePosition): PieceEdge[] {
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
      const type: 'straight' | 'diagonal' = (isHorizontal || isVertical) ? 'straight' : 'diagonal';

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
  findCompatibleEdges(piece1: PiecePosition, piece2: PiecePosition): CompatibleEdgePair[] {
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
  private calculateEdgeAlignment(edge1: PieceEdge, edge2: PieceEdge): number {
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
  private calculateEdgeContinuity(edge1: PieceEdge, edge2: PieceEdge): number {
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
        const edge: [number, number] = [next[0] - current[0], next[1] - current[1]];
        const normal: [number, number] = [-edge[1], edge[0]]; // Perpendicular 90 grados

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
    return penetrationDepth > OVERLAP_TOLERANCE_PX;
  }

  /**
   * Algoritmo SAT (Separating Axes Theorem) para detectar colisión entre polígonos
   * Incluye tolerancia para permitir piezas que se tocan por los bordes sin considerarse solapadas
   */
  private doPolygonsOverlap(vertices1: Array<[number, number]>, vertices2: Array<[number, number]>): boolean {
    const polygons = [vertices1, vertices2];

    for (const polygon of polygons) {
      for (let i = 0; i < polygon.length - 1; i++) {
        const current = polygon[i];
        const next = polygon[i + 1];

        // Calcular el vector normal (perpendicular al borde)
        const edge: [number, number] = [next[0] - current[0], next[1] - current[1]];
        const normal: [number, number] = [-edge[1], edge[0]]; // Perpendicular 90 grados

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
        if (overlap < -OVERLAP_TOLERANCE_PX) {
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

    // Penetración real (más allá de la tolerancia): no es un contacto, es un solape.
    if (penetrationDepth > OVERLAP_TOLERANCE_PX) {
      return false;
    }

    // Penetración dentro de tolerancia: contacto válido.
    if (penetrationDepth > 0) {
      return true;
    }

    // Sin penetración: sólo es contacto si no hay un hueco visible entre las piezas.
    return this.getMinDistanceBetweenPieces(piece1, piece2) <= TOUCH_TOLERANCE_PX;
  }

  /**
   * Distancia de contacto por defecto: por debajo de esto se considera que la
   * pieza está "junto a" una vecina y merece el ajuste fino. Por encima, el
   * jugador la está dejando suelta a propósito y no hay que moverla.
   *
   * Sólo se usa para la pieza que se acaba de soltar. Al asentar el resto se
   * pasa un margen más corto (ver `RotationAwareGrid.settlePlacedPieces`): a
   * una pieza que el jugador ya había colocado se le cierra la ranura, pero no
   * se la mueve para crear un contacto que no existía.
   */
  static readonly REFINE_NEAR_PX = 12;

  /**
   * Ajuste final a contacto EXACTO, después de que la heurística de encaje haya
   * elegido posición.
   *
   * El encaje por bordes y por caja envolvente acierta el sitio pero no el
   * último píxel: alinea centros de borde, mete un margen de 1px para no
   * solapar y, sobre todo, la pieza viene de una retícula de 10px que es
   * inconmensurable con su propia geometría (lado 128px, giros de 45° = pasos
   * de 128·√2/2 ≈ 90.5px). El resultado eran ranuras de hasta ~6px entre piezas
   * que el jugador VE, aunque la validación las diera por buenas.
   *
   * Aquí no se inventa nada: se prueban las traslaciones que hacen coincidir un
   * vértice de esta pieza con un vértice o un borde de una vecina, y se coge la
   * más pequeña que deje hueco cero sin solapar. Es geometría pura, no mira el
   * objetivo del reto: encaja igual una figura que no sea solución de nada.
   *
   * Si la pieza toca el espejo, ese contacto manda: sólo se aceptan candidatas
   * que lo conserven exacto (mover en horizontal cambiaría la figura compuesta
   * con el reflejo, que es lo único que el jugador no puede compensar).
   */
  refineToExactContact(
    piece: PiecePosition,
    otherPieces: PiecePosition[],
    nearPx: number = GameGeometry.REFINE_NEAR_PX
  ): PiecePosition {
    let refined = { ...piece };

    const mirrorGap = this.config.mirrorLineX - this.getPieceBoundingBox(refined).right;
    const onMirror = Math.abs(mirrorGap) <= TOUCH_TOLERANCE_PX;
    if (onMirror) {
      refined = { ...refined, x: refined.x + mirrorGap };
    }

    /*
      Si la pieza se solapa de verdad con otra, la posición no es válida y no
      hay contacto que perfeccionar: afinarla sería asentar una colocación que
      el juego va a rechazar igualmente. Se devuelve tal cual y decide quien
      valida. (De paso evita el caso peor: un montón de piezas superpuestas
      donde ninguna candidata sirve y habría que probarlas todas.)
    */
    if (otherPieces.some(other => this.doPiecesOverlapSignificantly(refined, other))) {
      return refined;
    }

    const neighbours = otherPieces.filter(
      other => this.getMinDistanceBetweenPieces(refined, other) <= nearPx
    );
    if (neighbours.length === 0) return refined;

    /*
      Vértices precalculados. `getMinDistanceBetweenPieces` recalcularía los de
      las DOS piezas en cada llamada, y eso lleva un seno y un coseno por
      vértice; aquí se evalúan cientos de candidatas contra las mismas vecinas.
      Los de la candidata salen de trasladar los de la pieza, sin trigonometría.
    */
    const ownVertices = this.getPieceVertices(refined);
    const ownBox = boundsOf(ownVertices);
    const neighbourVertices = neighbours.map(other => this.getPieceVertices(other));
    const neighbourBoxes = neighbourVertices.map(boundsOf);

    /** Suma de huecos, abandonando en cuanto supera el mejor conocido. */
    const gapTo = (dx: number, dy: number, limit = Infinity): number => {
      /*
        Primero la cota inferior por cajas envolventes: cuesta cuatro restas por
        vecina y descarta de un plumazo las candidatas que alejan la pieza, que
        son la mayoría. Sólo lo que sobrevive paga la distancia real entre
        contornos, que son ~150 distancias punto-segmento por vecina.
      */
      const moved = {
        left: ownBox.left + dx, right: ownBox.right + dx,
        top: ownBox.top + dy, bottom: ownBox.bottom + dy,
      };
      let lower = 0;
      for (const box of neighbourBoxes) {
        lower += boxGap(moved, box);
        if (lower >= limit) return lower;
      }

      const vertices = ownVertices.map(([x, y]) => [x + dx, y + dy] as [number, number]);
      let total = 0;
      for (const theirs of neighbourVertices) {
        total += this.getMinDistanceBetweenPolygons(vertices, theirs);
        if (total >= limit) return total;
      }
      return total;
    };

    const candidates = this.getContactCandidates(refined, neighbours, nearPx);
    const keepsMirror = (dx: number, dy: number): boolean => {
      if (!onMirror) return true;
      const moved = { ...refined, x: refined.x + dx, y: refined.y + dy };
      return Math.abs(this.config.mirrorLineX - this.getPieceBoundingBox(moved).right) <= 0.01;
    };
    const isValid = (dx: number, dy: number): boolean => {
      const moved = { ...refined, x: refined.x + dx, y: refined.y + dy };
      if (otherPieces.some(other => this.doPiecesOverlapSignificantly(moved, other))) return false;
      return neighbours.every(other => this.doPiecesTouch(moved, other));
    };

    /*
      Primera vuelta: encajes a hueco CERO. El límite de 0.01 hace que la cota
      por cajas descarte casi todo sin calcular distancias reales.

      Entre ellos no vale quedarse con el que menos mueve la pieza: dos piezas
      que comparten un borde de 45° encajan igual de "exacto" deslizadas a lo
      largo de él, y el deslizamiento más corto suele ser el que NO era. Gana el
      que hace coincidir más vértices — esquina con esquina, que es como encajan
      las teselas de verdad — entre los que quedan a un paso de retícula del
      encaje más cercano. Fuera de ese margen manda la distancia: un encaje
      lejano no es el que el jugador quiso aunque case mejor.
    */
    const exact: Array<{ dx: number; dy: number; shift: number }> = [];
    for (const [dx, dy] of candidates) {
      if (gapTo(dx, dy, 0.01) >= 0.01) continue;
      if (!keepsMirror(dx, dy) || !isValid(dx, dy)) continue;
      exact.push({ dx, dy, shift: Math.hypot(dx, dy) });
    }

    if (exact.length > 0) {
      // El más cercano a donde estaba: entre encajes igual de perfectos, el que
      // menos mueve la pieza es el que el jugador quiso.
      const best = exact[0];
      return { ...refined, x: refined.x + best.dx, y: refined.y + best.dy };
    }

    /*
      Segunda vuelta: no hay ningún encaje perfecto al alcance. Se acepta el que
      menos hueco deje, que es mejor que dejar la ranura entera.
    */
    let best: PiecePosition | null = null;
    let bestGap = gapTo(0, 0);

    for (const [dx, dy] of candidates) {
      const gapSum = gapTo(dx, dy, bestGap);
      if (gapSum >= bestGap - 1e-6) continue;
      if (!keepsMirror(dx, dy) || !isValid(dx, dy)) continue;
      best = { ...refined, x: refined.x + dx, y: refined.y + dy };
      bestGap = gapSum;
    }

    return best ?? refined;
  }

  /**
   * Traslaciones candidatas para `refineToExactContact`: las que hacen coincidir
   * un vértice de la pieza con un vértice de una vecina, y las que lo apoyan
   * sobre uno de sus bordes (y al revés). Son los únicos contactos que existen
   * entre piezas rectas, así que la lista es completa, no una muestra.
   */
  private getContactCandidates(
    piece: PiecePosition,
    neighbours: PiecePosition[],
    near: number
  ): Array<[number, number]> {
    const own = this.getPieceVertices(piece);
    const byKey = new Map<string, [number, number]>();

    const add = (dx: number, dy: number) => {
      if (Math.hypot(dx, dy) > near) return;
      // Muchos pares de vértices dan la misma traslación; sin agrupar se
      // evalúa la misma candidata decenas de veces.
      byKey.set(`${dx.toFixed(4)},${dy.toFixed(4)}`, [dx, dy]);
    };

    for (const neighbour of neighbours) {
      const theirs = this.getPieceVertices(neighbour);

      for (const [tx, ty] of theirs) {
        for (const [ox, oy] of own) add(tx - ox, ty - oy);
      }
      for (const vertex of own) {
        for (let i = 0; i < theirs.length - 1; i++) {
          const [px, py] = this.getClosestPointOnSegment(vertex, theirs[i], theirs[i + 1]);
          add(px - vertex[0], py - vertex[1]);
        }
      }
      for (const vertex of theirs) {
        for (let i = 0; i < own.length - 1; i++) {
          const [px, py] = this.getClosestPointOnSegment(vertex, own[i], own[i + 1]);
          add(vertex[0] - px, vertex[1] - py);
        }
      }
    }

    return [...byKey.values()].sort(
      (a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1])
    );
  }

  /**
   * Distancia mínima entre dos contornos YA calculados. Es lo mismo que
   * `getMinDistanceBetweenPieces` pero sin volver a proyectar los vértices,
   * para poder usarlo dentro de un bucle cerrado.
   */
  private getMinDistanceBetweenPolygons(
    a: Array<[number, number]>,
    b: Array<[number, number]>
  ): number {
    let min = Infinity;

    for (const point of a) {
      for (let i = 0; i < b.length - 1; i++) {
        min = Math.min(min, this.getDistanceFromPointToLineSegment(point, b[i], b[i + 1]));
      }
    }
    for (const point of b) {
      for (let i = 0; i < a.length - 1; i++) {
        min = Math.min(min, this.getDistanceFromPointToLineSegment(point, a[i], a[i + 1]));
      }
    }

    return min;
  }

  /** Punto de un segmento más cercano a `point`. */
  private getClosestPointOnSegment(
    point: [number, number],
    start: [number, number],
    end: [number, number]
  ): [number, number] {
    const vx = end[0] - start[0];
    const vy = end[1] - start[1];
    const lengthSquared = vx * vx + vy * vy;
    if (lengthSquared === 0) return [start[0], start[1]];

    const t = Math.max(
      0,
      Math.min(1, ((point[0] - start[0]) * vx + (point[1] - start[1]) * vy) / lengthSquared)
    );
    return [start[0] + t * vx, start[1] + t * vy];
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
    // El bounding box se traslada 1:1 con piece.x (el ancla es el centro), así
    // que basta con medirlo en x=0 para saber cuánto sobresale el borde
    // derecho respecto al centro, y despejar la x que lo deja en el espejo:
    // bbox.right(x) = x + bbox.right(0)  =>  x = mirrorLineX - bbox.right(0)
    const bboxAtOrigin = this.getPieceBoundingBox({ type: pieceType, face: 'front', x: 0, y, rotation });

    return {
      x: this.config.mirrorLineX - bboxAtOrigin.right,
      y
    };
  }

  /**
   * Calcula posición para que dos piezas tipo A sin rotar se toquen horizontalmente
   * (bounding box contra bounding box, sin solaparse).
   *
   * Separarlas `pieceSize` px no tiene relación con el tamaño real de la pieza
   * (320x192, ver `getPieceExtent`). Al separarlas exactamente el ancho real,
   * el borde derecho de la primera coincide con el izquierdo de la segunda.
   */
  getHorizontalTouchingPositions(baseY: number, leftX: number): [Position, Position] {
    const { width } = getPieceExtent(this.config.pieceSize);
    const rightX = leftX + width;

    return [
      { x: leftX, y: baseY },
      { x: rightX, y: baseY }
    ];
  }

  /**
   * Calcula posición para que dos piezas tipo A sin rotar se toquen verticalmente
   * (bounding box contra bounding box, sin solaparse). Ver `getHorizontalTouchingPositions`.
   */
  getVerticalTouchingPositions(baseX: number, topY: number): [Position, Position] {
    const { height } = getPieceExtent(this.config.pieceSize);
    const bottomY = topY + height;

    return [
      { x: baseX, y: topY },
      { x: baseX, y: bottomY }
    ];
  }

  /**
   * Verifica si una pieza (con su geometría real: tipo y rotación) cabe
   * dentro del área de juego. Antes comparaba contra `mirrorLineX - pieceSize`,
   * un límite arbitrario que no tenía relación con el tamaño real de la
   * pieza; ahora usa su bounding box real.
   */
  isPositionInGameArea(piece: PiecePosition): boolean {
    const bbox = this.getPieceBoundingBox(piece);
    return bbox.left >= 0 &&
           bbox.right <= this.config.mirrorLineX &&
           bbox.top >= 0 &&
           bbox.bottom <= this.config.height;
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

      let bestAlignment: PiecePosition | null = null;
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
                const alignedPosition = this.calculateEdgeAlignmentPosition(movingPiece, {
                  edge1: movingEdge,
                  edge2: targetEdge,
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
                  const finalAdjustment = this.closeSmallGap(snappedPiece, otherPiece);
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
        const closeGapPosition = this.closeSmallGap(snappedPiece, otherPiece);
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
    let bestAlignment: { position: PiecePosition; targetPiece: PiecePosition } | null = null;
    let bestScore = 0;

    for (const otherPiece of otherPieces) {
      const compatibleEdges = this.findCompatibleEdges(snappedPiece, otherPiece);

      for (const edgePair of compatibleEdges) {
        const combinedScore = edgePair.alignmentScore * edgePair.continuityScore;

        if (combinedScore > bestScore) {
          // Calcular la posición necesaria para alinear perfectamente estos bordes
          const alignedPosition = this.calculateEdgeAlignmentPosition(snappedPiece, edgePair);

          if (alignedPosition) {
            bestAlignment = {
              position: alignedPosition,
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
  private closeSmallGap(movingPiece: PiecePosition, targetPiece: PiecePosition): PiecePosition | null {
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
  private calculateEdgeAlignmentPosition(movingPiece: PiecePosition, edgePair: CompatibleEdgePair): PiecePosition | null {
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
      (movingEdge.start[0] + movingEdge.end[0]) / 2 - movingPiece.x,
      (movingEdge.start[1] + movingEdge.end[1]) / 2 - movingPiece.y
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
  private findClosestPointsBetweenEdges(edge1: PieceEdge, edge2: PieceEdge): { moving: [number, number]; target: [number, number] } | null {
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
  private piecesOverlapVertically(bbox1: BoundingBox, bbox2: BoundingBox): boolean {
    return !(bbox1.bottom <= bbox2.top || bbox2.bottom <= bbox1.top);
  }

  /**
   * Verifica si dos bounding boxes se solapan horizontalmente
   */
  private piecesOverlapHorizontally(bbox1: BoundingBox, bbox2: BoundingBox): boolean {
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
  getPieceBoundingBox(piece: PiecePosition): BoundingBox {
    const vertices = getWorldVertices(piece, this.config.pieceSize);
    const xs = vertices.map(([x]) => x);
    const ys = vertices.map(([, y]) => y);

    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys),
    };
  }

  /**
   * Detecta colisión con el espejo (pieza intentando cruzar la línea del espejo)
   * Permite que las piezas toquen el espejo con tolerancia para grid fijo
   */
  detectMirrorCollision(piece: PiecePosition): boolean {
    const bbox = this.getPieceBoundingBox(piece);
    const penetration = bbox.right - this.config.mirrorLineX;

    // Solo considerar colisión si la pieza penetra en el espejo más allá de la tolerancia de contacto
    return penetration > TOUCH_TOLERANCE_PX;
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
    const distance = Math.abs(bbox.right - this.config.mirrorLineX);

    return distance <= TOUCH_TOLERANCE_PX;
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
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];

      if (!this.isPiecePositionInGameArea(piece)) {
        return false;
      }

      // Compute reflected bbox geometrically (mirror the original bbox through the mirror line)
      // This gives the correct reflected extent without depending on reflectPieceAcrossMirror's formula
      const originalBbox = this.getPieceBoundingBox(piece);
      const reflectedBboxLeft = 2 * this.config.mirrorLineX - originalBbox.right;
      const reflectedBboxRight = 2 * this.config.mirrorLineX - originalBbox.left;

      const pieceTouchesMirror = this.isPieceTouchingMirror(piece);

      if (!pieceTouchesMirror) {
        if (reflectedBboxLeft < 0 || reflectedBboxRight > 2 * this.config.mirrorLineX) {
          return false;
        }
      } else {
        if (reflectedBboxLeft < this.config.mirrorLineX - TOUCH_TOLERANCE_PX) {
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
