import { getUnit, PieceType } from './PieceShape';

/**
 * Hasta la reforma de la geometría, `piece.x` / `piece.y` eran la esquina
 * superior izquierda de una caja imaginaria de `pieceSize` × `pieceSize`, y el
 * pivote de giro era su centro — un punto que caía en la esquina inferior
 * izquierda de la figura real, no en su centro.
 *
 * Ahora `piece.x` / `piece.y` son el centro de la pieza. Esta función traduce
 * una posición del formato antiguo al nuevo dejando la figura EXACTAMENTE donde
 * estaba en pantalla, y se usa para migrar los retos guardados y los ficheros
 * de retos que suba el usuario.
 */
export const migrateLegacyAnchor = <T extends { type: PieceType; x: number; y: number; rotation: number }>(
  piece: T,
  pieceSize: number
): T => {
  const unit = getUnit(pieceSize);
  const rad = (piece.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Posición del centro de la pieza dentro del sistema local antiguo.
  const offsetX = (piece.type === 'B' ? -1.5 : 1.5) * unit;
  const offsetY = -0.5 * unit;

  return {
    ...piece,
    x: piece.x + pieceSize / 2 + (offsetX * cos - offsetY * sin),
    y: piece.y + pieceSize / 2 + (offsetX * sin + offsetY * cos),
  };
};

/**
 * Heurística para no migrar dos veces. Los ficheros nuevos se marcan con
 * `anchor: 'center'`; cualquier otra cosa se considera del formato antiguo.
 */
export const PIECE_ANCHOR_MARKER = 'center' as const;
