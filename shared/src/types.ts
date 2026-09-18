export type PieceType = 'A' | 'B';

export type PieceFace = 'front' | 'back';

export interface PiecePosition {
  type: PieceType;
  face: PieceFace;
  x: number;
  y: number;
  rotation: number;
}

/** Campos de una pieza que necesita la geometría, sin detalles de dibujo. */
export interface Piece extends PiecePosition {
  placed: boolean;
}
