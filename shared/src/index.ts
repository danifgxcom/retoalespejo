export type { Piece, PieceFace, PiecePosition, PieceType } from './types';
export {
  PIECE_UNIT_RATIO,
  PIECE_OUTLINE_UNITS,
  PIECE_PARTS,
  getUnit,
  toLocalPoint,
  getLocalVertices,
  getWorldVertices,
  getPieceExtent,
  getPieceRadius,
  getPartsInWorld,
} from './PieceShape';
export { GameGeometry, PLACEMENT_GRID_PX } from './GameGeometry';
export type { Position, GameAreaConfig } from './GameGeometry';
export { migrateLegacyAnchor, PIECE_ANCHOR_MARKER } from './legacyAnchor';
export { ValidationService, SOLUTION_TOLERANCE, FIGURE_TOLERANCE } from './ValidationService';
export type { ValidationResult } from './ValidationService';
