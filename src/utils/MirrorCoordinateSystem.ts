import { PiecePosition, GameGeometry } from './GameGeometry';

/**
 * Posición de pieza usando coordenadas relativas al espejo
 */
export interface MirrorRelativePiecePosition {
  type: 'A' | 'B';
  face: 'front' | 'back';
  /** Posición X relativa al espejo. 0 = toca el espejo, negativo = izquierda, positivo = derecha */
  x: number;
  /** Posición Y relativa al centro del área de juego. 0 = centro, negativo = arriba, positivo = abajo */
  y: number;
  rotation: number;
}

/**
 * Challenge usando coordenadas relativas al espejo
 */
export interface MirrorRelativeChallenge {
  id: number;
  name: string;
  description: string;
  difficulty: string;
  pieces: MirrorRelativePiecePosition[];
}

/**
 * Configuración del sistema de coordenadas del espejo
 */
export interface MirrorCoordinateConfig {
  /** Posición absoluta X del espejo en el canvas */
  mirrorLineX: number;
  /** Centro Y del área de juego */
  centerY: number;
  /** Tamaño de las piezas en píxeles */
  pieceSize: number;
}

/**
 * Sistema de coordenadas relativo al espejo
 * 
 * En este sistema:
 * - X=0 significa que la pieza toca exactamente el espejo
 * - X<0 significa que la pieza está a la izquierda del espejo
 * - X>0 significa que la pieza está a la derecha del espejo (área reflejada)
 * - Y=0 significa que la pieza está centrada verticalmente
 * - Y<0 significa que la pieza está arriba del centro
 * - Y>0 significa que la pieza está abajo del centro
 */
export class MirrorCoordinateSystem {
  private config: MirrorCoordinateConfig;
  private geometry: GameGeometry;

  constructor(config: MirrorCoordinateConfig, geometry?: GameGeometry) {
    this.config = config;
    this.geometry = geometry || new GameGeometry({
      width: config.mirrorLineX,
      height: config.centerY * 2,
      mirrorLineX: config.mirrorLineX,
      pieceSize: config.pieceSize
    });
  }

  /**
   * Convierte coordenadas relativas al espejo a coordenadas absolutas del canvas
   */
  relativeToAbsolute(relativePiece: MirrorRelativePiecePosition): PiecePosition {
    // Para X: usar GameGeometry para calcular la posición exacta que toca el espejo
    let absoluteX: number;
    
    if (relativePiece.x <= 0) {
      // Pieza en el lado del jugador (izquierda del espejo)
      if (relativePiece.x === 0) {
        // x=0 significa tocar exactamente el espejo - usar cálculo preciso
        const absoluteY = this.config.centerY + relativePiece.y;
        const touchingPosition = this.geometry.getPositionTouchingMirror(
          absoluteY, 
          relativePiece.rotation, 
          relativePiece.type
        );
        absoluteX = touchingPosition.x;
      } else {
        // x<0 significa offset desde la posición que tocaría el espejo
        const absoluteY = this.config.centerY + relativePiece.y;
        const touchingPosition = this.geometry.getPositionTouchingMirror(
          absoluteY, 
          relativePiece.rotation, 
          relativePiece.type
        );
        absoluteX = touchingPosition.x + relativePiece.x;
      }
    } else {
      // Pieza en el lado del espejo (derecha) - normalmente no debería pasar en challenges
      absoluteX = this.config.mirrorLineX + relativePiece.x;
    }

    // Para Y: convertir coordenadas relativas al centro a coordenadas absolutas
    const absoluteY = this.config.centerY + relativePiece.y;

    return {
      type: relativePiece.type,
      face: relativePiece.face,
      x: absoluteX,
      y: absoluteY,
      rotation: relativePiece.rotation
    };
  }

  /**
   * Convierte coordenadas absolutas del canvas a coordenadas relativas al espejo
   */
  absoluteToRelative(absolutePiece: PiecePosition): MirrorRelativePiecePosition {
    // Para X: calcular distancia relativa al espejo usando GameGeometry
    let relativeX: number;
    
    if (absolutePiece.x + this.config.pieceSize <= this.config.mirrorLineX) {
      // Pieza en el lado del jugador
      // Calcular la posición que tocaría el espejo con la misma rotación
      const touchingPosition = this.geometry.getPositionTouchingMirror(
        absolutePiece.y,
        absolutePiece.rotation,
        absolutePiece.type
      );
      relativeX = absolutePiece.x - touchingPosition.x;
    } else {
      // Pieza en el lado del espejo o cruzándolo
      relativeX = absolutePiece.x - this.config.mirrorLineX;
    }

    // Para Y: convertir coordenadas absolutas a relativas al centro
    const relativeY = absolutePiece.y - this.config.centerY;

    return {
      type: absolutePiece.type,
      face: absolutePiece.face,
      x: relativeX,
      y: relativeY,
      rotation: absolutePiece.rotation
    };
  }

  /**
   * Convierte un challenge con coordenadas relativas a coordenadas absolutas
   */
  convertChallengeToAbsolute(relativeChallenge: MirrorRelativeChallenge): {
    id: number;
    name: string;
    description: string;
    difficulty: string;
    objective: {
      playerPieces: PiecePosition[];
    };
  } {
    const absolutePieces = relativeChallenge.pieces.map(piece => 
      this.relativeToAbsolute(piece)
    );

    return {
      id: relativeChallenge.id,
      name: relativeChallenge.name,
      description: relativeChallenge.description,
      difficulty: relativeChallenge.difficulty,
      objective: {
        playerPieces: absolutePieces
      }
    };
  }

  /**
   * Convierte un challenge con coordenadas absolutas a coordenadas relativas
   */
  convertChallengeToRelative(absoluteChallenge: {
    id: number;
    name: string;
    description: string;
    difficulty: string;
    objective: { playerPieces: PiecePosition[] };
  }): MirrorRelativeChallenge {
    const relativePieces = absoluteChallenge.objective.playerPieces.map(piece =>
      this.absoluteToRelative(piece)
    );

    return {
      id: absoluteChallenge.id,
      name: absoluteChallenge.name,
      description: absoluteChallenge.description,
      difficulty: absoluteChallenge.difficulty,
      pieces: relativePieces
    };
  }

  /**
   * Crea una pieza que toca exactamente el espejo
   */
  createPieceTouchingMirror(
    type: 'A' | 'B' = 'A',
    face: 'front' | 'back' = 'front',
    yOffset: number = 0,
    rotation: number = 0
  ): MirrorRelativePiecePosition {
    return {
      type,
      face,
      x: 0, // x=0 significa tocar el espejo
      y: yOffset,
      rotation
    };
  }

  /**
   * Crea dos piezas que se tocan horizontalmente, con una tocando el espejo
   */
  createHorizontalTouchingPieces(
    type: 'A' | 'B' = 'A',
    face: 'front' | 'back' = 'front',
    yOffset: number = 0
  ): MirrorRelativePiecePosition[] {
    return [
      {
        type,
        face,
        x: -this.config.pieceSize, // Una pieza completa a la izquierda
        y: yOffset,
        rotation: 0
      },
      {
        type,
        face,
        x: 0, // Tocando el espejo
        y: yOffset,
        rotation: 0
      }
    ];
  }

  /**
   * Crea dos piezas que se tocan verticalmente, con una tocando el espejo
   */
  createVerticalTouchingPieces(
    type: 'A' | 'B' = 'A',
    face: 'front' | 'back' = 'front',
    xOffset: number = 0
  ): MirrorRelativePiecePosition[] {
    return [
      {
        type,
        face,
        x: xOffset,
        y: -this.config.pieceSize / 2, // Arriba del centro
        rotation: 0
      },
      {
        type,
        face,
        x: xOffset,
        y: this.config.pieceSize / 2, // Abajo del centro
        rotation: 0
      }
    ];
  }

  /**
   * Valida que una posición relativa sea válida para el área de juego
   */
  validateRelativePosition(piece: MirrorRelativePiecePosition): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validar que la pieza esté en el lado del jugador (x <= 0)
    if (piece.x > 0) {
      errors.push('Piece cannot be positioned in the mirror area (x > 0)');
    }

    // Validar que la pieza no esté demasiado a la izquierda
    const maxLeftDistance = this.config.mirrorLineX - this.config.pieceSize;
    if (piece.x < -maxLeftDistance) {
      errors.push(`Piece too far left (x < -${maxLeftDistance})`);
    }

    // Validar Y dentro del área de juego
    const maxYDistance = this.config.centerY;
    if (Math.abs(piece.y) > maxYDistance) {
      errors.push(`Piece Y position out of bounds (|y| > ${maxYDistance})`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtiene información de debug sobre el sistema de coordenadas
   */
  getDebugInfo(): {
    mirrorLineX: number;
    centerY: number;
    pieceSize: number;
    gameAreaWidth: number;
    gameAreaHeight: number;
  } {
    return {
      mirrorLineX: this.config.mirrorLineX,
      centerY: this.config.centerY,
      pieceSize: this.config.pieceSize,
      gameAreaWidth: this.config.mirrorLineX,
      gameAreaHeight: this.config.centerY * 2
    };
  }

  /**
   * Convierte múltiples challenges de relativo a absoluto
   */
  convertMultipleChallenges(relativeChallenges: MirrorRelativeChallenge[]): Array<{
    id: number;
    name: string;
    description: string;
    difficulty: string;
    objective: { playerPieces: PiecePosition[] };
  }> {
    return relativeChallenges.map(challenge => 
      this.convertChallengeToAbsolute(challenge)
    );
  }
}