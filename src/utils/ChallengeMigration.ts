import { MirrorCoordinateSystem, MirrorRelativeChallenge } from './MirrorCoordinateSystem';
import { Challenge } from '../components/ChallengeCard';
import { GameGeometry } from './GameGeometry';

/**
 * Formato de archivo JSON con challenges en coordenadas relativas
 */
export interface RelativeChallengeFile {
  coordinate_system: 'mirror_relative';
  description: string;
  mirror_position: number;
  piece_size: number;
  challenges: Array<{
    id: number;
    name: string;
    description: string;
    piecesNeeded: number;
    difficulty: string;
    targetPattern: string;
    pieces: Array<{
      type: 'A' | 'B';
      face: 'front' | 'back';
      x: number;
      y: number;
      rotation: number;
      comment?: string;
    }>;
  }>;
  coordinate_examples?: any;
  validation_notes?: string[];
}

/**
 * Utilidad para migrar challenges entre formatos relativos y absolutos
 */
export class ChallengeMigration {
  private mirrorSystem: MirrorCoordinateSystem;
  private geometry: GameGeometry;

  constructor(mirrorLineX: number = 700, centerY: number = 300, pieceSize: number = 100) {
    this.geometry = new GameGeometry({
      width: mirrorLineX,
      height: centerY * 2,
      mirrorLineX,
      pieceSize
    });
    
    this.mirrorSystem = new MirrorCoordinateSystem({
      mirrorLineX,
      centerY,
      pieceSize
    }, this.geometry);
  }

  /**
   * Carga challenges desde un archivo JSON con coordenadas relativas
   */
  async loadRelativeChallenges(filePath: string): Promise<Challenge[]> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load relative challenges: ${response.status}`);
      }

      const data: RelativeChallengeFile = await response.json();
      
      if (data.coordinate_system !== 'mirror_relative') {
        throw new Error('Invalid coordinate system. Expected "mirror_relative".');
      }

      return this.convertRelativeFileToAbsolute(data);
    } catch (error) {
      console.error('Error loading relative challenges:', error);
      throw error;
    }
  }

  /**
   * Convierte un archivo de challenges relativas al formato absoluto
   */
  convertRelativeFileToAbsolute(relativeFile: RelativeChallengeFile): Challenge[] {
    return relativeFile.challenges.map(relativeChallenge => {
      // Convertir las piezas de formato JSON a formato MirrorRelativePiecePosition
      const relativePieces = relativeChallenge.pieces.map(piece => ({
        type: piece.type,
        face: piece.face,
        x: piece.x,
        y: piece.y,
        rotation: piece.rotation
      }));

      // Crear challenge en formato relativo
      const relativeChallengeData: MirrorRelativeChallenge = {
        id: relativeChallenge.id,
        name: relativeChallenge.name,
        description: relativeChallenge.description,
        difficulty: relativeChallenge.difficulty,
        pieces: relativePieces
      };

      // Convertir a formato absoluto
      const absoluteChallenge = this.mirrorSystem.convertChallengeToAbsolute(relativeChallengeData);

      // Adaptar al formato Challenge completo
      return {
        id: absoluteChallenge.id,
        name: absoluteChallenge.name,
        description: absoluteChallenge.description,
        piecesNeeded: relativeChallenge.piecesNeeded,
        difficulty: absoluteChallenge.difficulty,
        targetPattern: relativeChallenge.targetPattern,
        objective: absoluteChallenge.objective,
        targetPieces: absoluteChallenge.objective.playerPieces // Mismo que objective.playerPieces
      };
    });
  }

  /**
   * Convierte challenges absolutas al formato relativo para exportar
   */
  convertAbsoluteChallengeToRelativeFile(challenges: Challenge[]): RelativeChallengeFile {
    const relativeChallenges = challenges.map(challenge => {
      const relativeChallenge = this.mirrorSystem.convertChallengeToRelative({
        id: challenge.id,
        name: challenge.name,
        description: challenge.description,
        difficulty: challenge.difficulty,
        objective: challenge.objective
      });

      return {
        id: relativeChallenge.id,
        name: relativeChallenge.name,
        description: relativeChallenge.description,
        piecesNeeded: challenge.piecesNeeded || relativeChallenge.pieces.length,
        difficulty: relativeChallenge.difficulty,
        targetPattern: challenge.targetPattern || 'custom',
        pieces: relativeChallenge.pieces.map(piece => ({
          type: piece.type,
          face: piece.face,
          x: piece.x,
          y: piece.y,
          rotation: piece.rotation,
          comment: this.generateCoordinateComment(piece.x, piece.y)
        }))
      };
    });

    return {
      coordinate_system: 'mirror_relative',
      description: 'Challenges using mirror-relative coordinates. X=0 means touching the mirror, negative values are to the left. Y=0 is vertical center.',
      mirror_position: 0,
      piece_size: 100,
      challenges: relativeChallenges,
      coordinate_examples: {
        touching_mirror: { x: 0, description: 'Pieza toca exactamente el espejo' },
        left_of_mirror: { x: -50, description: 'Pieza 50px a la izquierda de tocar el espejo' },
        vertical_center: { y: 0, description: 'Centro vertical del área de juego' }
      },
      validation_notes: [
        'Todas las piezas deben tener x <= 0 (no pueden estar en el área del espejo)',
        'Al menos una pieza debe tener x = 0 (tocar el espejo)',
        'Las piezas no pueden solaparse entre sí',
        'Las piezas deben formar una figura conectada'
      ]
    };
  }

  /**
   * Migra el archivo challenges.json actual al nuevo formato relativo
   */
  async migrateCurrentChallenges(currentFilePath: string): Promise<RelativeChallengeFile> {
    try {
      const response = await fetch(currentFilePath);
      if (!response.ok) {
        throw new Error(`Failed to load current challenges: ${response.status}`);
      }

      const currentChallenges: Challenge[] = await response.json();
      return this.convertAbsoluteChallengeToRelativeFile(currentChallenges);
    } catch (error) {
      console.error('Error migrating current challenges:', error);
      throw error;
    }
  }

  /**
   * Valida que un archivo de challenges relativas sea válido
   */
  validateRelativeFile(relativeFile: RelativeChallengeFile): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar formato del archivo
    if (relativeFile.coordinate_system !== 'mirror_relative') {
      errors.push('Invalid coordinate_system. Must be "mirror_relative"');
    }

    if (!Array.isArray(relativeFile.challenges)) {
      errors.push('Challenges must be an array');
      return { isValid: false, errors, warnings };
    }

    // Validar cada challenge
    relativeFile.challenges.forEach((challenge, index) => {
      if (!challenge.id || !challenge.name || !challenge.pieces) {
        errors.push(`Challenge ${index + 1}: Missing required fields (id, name, pieces)`);
        return;
      }

      // Validar cada pieza
      challenge.pieces.forEach((piece, pieceIndex) => {
        const validation = this.mirrorSystem.validateRelativePosition({
          type: piece.type,
          face: piece.face,
          x: piece.x,
          y: piece.y,
          rotation: piece.rotation
        });

        if (!validation.isValid) {
          errors.push(`Challenge ${challenge.id}, piece ${pieceIndex + 1}: ${validation.errors.join(', ')}`);
        }
      });

      // Validar que al menos una pieza toque el espejo
      const hasMirrorTouchingPiece = challenge.pieces.some(piece => piece.x === 0);
      if (!hasMirrorTouchingPiece) {
        warnings.push(`Challenge ${challenge.id}: No piece touches the mirror (x=0)`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Genera comentario explicativo para unas coordenadas
   */
  private generateCoordinateComment(x: number, y: number): string {
    let comment = '';

    // Comentario para X
    if (x === 0) {
      comment += 'Tocando el espejo';
    } else if (x < 0) {
      comment += `${Math.abs(x)}px a la izquierda del espejo`;
    } else {
      comment += `${x}px en área del espejo (¡inválido!)`;
    }

    // Comentario para Y
    if (y === 0) {
      comment += ', centrada verticalmente';
    } else if (y < 0) {
      comment += `, ${Math.abs(y)}px arriba del centro`;
    } else {
      comment += `, ${y}px abajo del centro`;
    }

    return comment;
  }

  /**
   * Información de debug sobre la migración
   */
  getMigrationInfo(): {
    mirrorLineX: number;
    centerY: number;
    pieceSize: number;
    conversionFormula: {
      relativeToAbsolute: string;
      absoluteToRelative: string;
    };
  } {
    const debugInfo = this.mirrorSystem.getDebugInfo();
    
    return {
      mirrorLineX: debugInfo.mirrorLineX,
      centerY: debugInfo.centerY,
      pieceSize: debugInfo.pieceSize,
      conversionFormula: {
        relativeToAbsolute: 'absoluteX = mirrorLineX - pieceSize + relativeX; absoluteY = centerY + relativeY',
        absoluteToRelative: 'relativeX = absoluteX - (mirrorLineX - pieceSize); relativeY = absoluteY - centerY'
      }
    };
  }
}