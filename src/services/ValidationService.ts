import { GameGeometry, PiecePosition } from '../utils/geometry/GameGeometry';
import { Challenge } from '../components/ChallengeCard';

/**
 * Resultado de validación con detalles específicos
 */
export interface ValidationResult {
  isValid: boolean;
  message: string;
  errors: ValidationError[];
}

/**
 * Error específico de validación
 */
export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Resultado de validación de challenge card
 */
export interface ChallengeValidationResult {
  isValid: boolean;
  hasReflectionOverlaps: boolean;
  hasPieceOverlaps: boolean;
  touchesMirror: boolean;
  entersMirror: boolean;
  piecesConnected: boolean;
  piecesInArea: boolean;
}

/**
 * Servicio de validación que encapsula todas las reglas del juego
 * Aplica el principio de Single Responsibility
 */
export class ValidationService {
  constructor(private geometry: GameGeometry) {}

  /**
   * Valida si una solución es correcta según las reglas del juego
   */
  validateSolution(pieces: PiecePosition[], challenge: Challenge): ValidationResult {
    const errors: ValidationError[] = [];
    let isValid = true;

    // Filtrar solo piezas colocadas en el área de juego
    const placedPieces = pieces.filter(piece => 
      this.geometry.isPieceInGameArea(piece)
    );

    if (placedPieces.length === 0) {
      return {
        isValid: false,
        message: "Debes colocar al menos una pieza en el área de juego.",
        errors: [{
          code: 'NO_PIECES_PLACED',
          message: 'No hay piezas colocadas en el área de juego',
          severity: 'error'
        }]
      };
    }

    // Verificar número correcto de piezas
    if (placedPieces.length !== challenge.piecesNeeded) {
      errors.push({
        code: 'WRONG_PIECE_COUNT',
        message: `Se requieren ${challenge.piecesNeeded} piezas, pero hay ${placedPieces.length}`,
        severity: 'error'
      });
      isValid = false;
    }

    // Verificar tipos de piezas correctos
    const requiredTypes = challenge.objective.playerPieces.map(p => p.type);
    const placedTypes = placedPieces.map(p => p.type);
    
    if (!this.arraysEqual(requiredTypes.sort(), placedTypes.sort())) {
      errors.push({
        code: 'WRONG_PIECE_TYPES',
        message: 'Los tipos de piezas no coinciden con los requeridos',
        severity: 'error'
      });
      isValid = false;
    }

    // Validar usando las reglas del challenge card
    const challengeValidation = this.validateChallengeCard(placedPieces);
    
    if (!challengeValidation.piecesConnected) {
      errors.push({
        code: 'PIECES_NOT_CONNECTED',
        message: 'Las piezas deben estar conectadas entre sí',
        severity: 'error'
      });
      isValid = false;
    }

    if (!challengeValidation.touchesMirror) {
      errors.push({
        code: 'NO_MIRROR_TOUCH',
        message: 'Al menos una pieza debe tocar el espejo',
        severity: 'error'
      });
      isValid = false;
    }

    if (challengeValidation.hasPieceOverlaps) {
      errors.push({
        code: 'PIECE_OVERLAPS',
        message: 'Las piezas no pueden solaparse',
        severity: 'error'
      });
      isValid = false;
    }

    if (challengeValidation.entersMirror) {
      errors.push({
        code: 'ENTERS_MIRROR',
        message: 'Las piezas no pueden entrar en el área del espejo',
        severity: 'error'
      });
      isValid = false;
    }

    const successMessage = isValid 
      ? "¡Excelente! Has completado el desafío correctamente."
      : "Hay algunos problemas con tu solución.";

    return {
      isValid,
      message: successMessage,
      errors
    };
  }

  /**
   * Valida un challenge card según las 6 reglas documentadas
   */
  validateChallengeCard(pieces: PiecePosition[]): ChallengeValidationResult {
    return this.geometry.validateChallengeCard(pieces);
  }

  /**
   * Valida que las piezas cumplan con las reglas básicas de colocación
   */
  validatePiecePlacement(piece: PiecePosition, otherPieces: PiecePosition[]): ValidationResult {
    const errors: ValidationError[] = [];
    let isValid = true;

    // Verificar límites del área de juego
    const boundaryCollision = this.geometry.detectGameAreaBoundaryCollision(piece);
    if (boundaryCollision.hasCollision) {
      errors.push({
        code: 'BOUNDARY_COLLISION',
        message: 'La pieza está fuera del área de juego permitida',
        severity: 'error'
      });
      isValid = false;
    }

    // Verificar colisiones con otras piezas
    const pieceCollisions = this.geometry.detectPieceCollisions(piece, otherPieces);
    if (pieceCollisions.hasCollisions) {
      errors.push({
        code: 'PIECE_COLLISION',
        message: 'La pieza se superpone con otra pieza',
        severity: 'error'
      });
      isValid = false;
    }

    // Verificar colisión con espejo
    if (this.geometry.detectMirrorCollision(piece)) {
      errors.push({
        code: 'MIRROR_COLLISION',
        message: 'La pieza no puede entrar en el área del espejo',
        severity: 'error'
      });
      isValid = false;
    }

    return {
      isValid,
      message: isValid ? 'Posición válida' : 'Posición inválida',
      errors
    };
  }

  /**
   * Verifica si dos arrays son iguales (helper method)
   */
  private arraysEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  /**
   * Obtiene un resumen legible de los errores de validación
   */
  getValidationSummary(result: ValidationResult): string {
    if (result.isValid) {
      return result.message;
    }

    const errorMessages = result.errors
      .filter(error => error.severity === 'error')
      .map(error => error.message);

    return errorMessages.length > 0 
      ? errorMessages.join('\n')
      : result.message;
  }
}