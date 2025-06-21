import { Challenge } from '../components/ChallengeCard';
import { ChallengeGenerator } from '../utils/challenges/ChallengeGenerator';
import { GameGeometry } from '../utils/geometry/GameGeometry';
import { ValidationService } from './ValidationService';
import { ChallengeMigration, RelativeChallengeFile } from '../utils/challenges/ChallengeMigration';

/**
 * Configuración del servicio de challenges
 */
export interface ChallengeServiceConfig {
  defaultChallengesPath: string;
  maxRetries: number;
  enableCache: boolean;
}

/**
 * Resultado de carga de challenges
 */
export interface ChallengeLoadResult {
  challenges: Challenge[];
  source: 'file' | 'embedded' | 'generated';
  success: boolean;
  error?: string;
}

/**
 * Servicio para manejo de challenges que encapsula toda la lógica relacionada
 * Aplica principios de Single Responsibility y Dependency Injection
 */
export class ChallengeService {
  private generator: ChallengeGenerator;
  private validationService: ValidationService;
  private config: ChallengeServiceConfig;
  private migration: ChallengeMigration;
  private isLoading: boolean = false;

  constructor(
    geometry: GameGeometry,
    config: Partial<ChallengeServiceConfig> = {}
  ) {
    this.generator = new ChallengeGenerator(geometry);
    this.validationService = new ValidationService(geometry);
    this.migration = new ChallengeMigration(700, 300, 100); // mirrorLineX, centerY, pieceSize
    this.config = {
      defaultChallengesPath: '/challenges.json',
      maxRetries: 2,
      enableCache: true,
      ...config
    };
  }

  /**
   * Carga challenges desde archivo o usa fallbacks
   */
  async loadChallenges(): Promise<ChallengeLoadResult> {
    if (this.isLoading) {
      throw new Error('Ya se están cargando challenges');
    }

    this.isLoading = true;

    try {
      // Intentar cargar desde archivo
      const fileResult = await this.loadFromFile();
      if (fileResult.success) {
        return fileResult;
      }

      // Fallback a challenges embebidos
      console.warn('Archivo no disponible, usando challenges embebidos');
      const embeddedResult = this.loadEmbedded();
      if (embeddedResult.success) {
        return embeddedResult;
      }

      // Último fallback - generar challenges
      console.warn('Challenges embebidos no válidos, generando automáticamente');
      return this.generateFallback();

    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Carga challenges desde archivo personalizado
   */
  async loadCustomChallenges(file: File): Promise<ChallengeLoadResult> {
    try {
      const content = await file.text();
      const challenges = JSON.parse(content);

      if (!Array.isArray(challenges)) {
        throw new Error('El archivo debe contener un array de challenges');
      }

      const validatedChallenges = this.validateAndFilterChallenges(challenges);
      
      if (validatedChallenges.length === 0) {
        throw new Error('No se encontraron challenges válidos en el archivo');
      }

      return {
        challenges: validatedChallenges,
        source: 'file',
        success: true
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return {
        challenges: [],
        source: 'file',
        success: false,
        error: `Error al cargar archivo: ${message}`
      };
    }
  }

  /**
   * Obtiene información del challenge actual
   */
  getChallengeInfo(challenge: Challenge) {
    const validation = this.validationService.validateChallengeCard(
      challenge.objective.playerPieces
    );

    return {
      ...challenge,
      isValid: validation.isValid,
      validationDetails: validation
    };
  }

  /**
   * Verifica si un challenge es válido según las reglas
   */
  isChallengeValid(challenge: Challenge): boolean {
    if (!challenge.objective?.playerPieces) {
      return false;
    }

    const validation = this.validationService.validateChallengeCard(
      challenge.objective.playerPieces
    );

    return validation.isValid;
  }

  /**
   * Carga challenges desde archivo por defecto
   * Detecta automáticamente si es formato relativo o absoluto
   */
  private async loadFromFile(): Promise<ChallengeLoadResult> {
    try {
      // Primero intentar cargar archivo con coordenadas relativas
      const relativeResult = await this.tryLoadRelativeFile('/challenges-relative.json');
      if (relativeResult.success) {
        console.log('✅ Cargado archivo con coordenadas relativas');
        return relativeResult;
      }

      // Fallback al archivo original con coordenadas absolutas
      const challenges = await this.generator.loadChallengesFromFile(
        this.config.defaultChallengesPath
      );

      const validatedChallenges = this.validateAndFilterChallenges(challenges);

      console.log('✅ Cargado archivo con coordenadas absolutas');
      return {
        challenges: validatedChallenges,
        source: 'file',
        success: validatedChallenges.length > 0
      };

    } catch (error) {
      console.warn('Error cargando desde archivo:', error);
      return {
        challenges: [],
        source: 'file',
        success: false,
        error: 'No se pudo cargar el archivo de challenges'
      };
    }
  }

  /**
   * Carga challenges embebidos
   */
  private loadEmbedded(): ChallengeLoadResult {
    try {
      const embeddedChallenges = this.generator.generateAllChallenges();
      const validatedChallenges = this.validateAndFilterChallenges(embeddedChallenges);

      return {
        challenges: validatedChallenges,
        source: 'embedded',
        success: validatedChallenges.length > 0
      };

    } catch (error) {
      console.warn('Error cargando challenges embebidos:', error);
      return {
        challenges: [],
        source: 'embedded',
        success: false,
        error: 'Error en challenges embebidos'
      };
    }
  }

  /**
   * Genera challenges como último recurso
   */
  private generateFallback(): ChallengeLoadResult {
    try {
      // Generar challenges simples que sabemos que funcionan
      const simpleChallenges: Challenge[] = [
        {
          id: 1,
          name: "Desafío Simple 1",
          description: "Coloca una pieza A tocando el espejo",
          piecesNeeded: 1,
          difficulty: "Fácil",
          targetPattern: "simple",
          objective: {
            playerPieces: [{
              type: 'A',
              face: 'front',
              x: 330,
              y: 300,
              rotation: 0
            }],
            symmetricPattern: []
          },
          targetPieces: [{
            type: 'A',
            face: 'front',
            x: 330,
            y: 300,
            rotation: 0
          }]
        }
      ];

      return {
        challenges: simpleChallenges,
        source: 'generated',
        success: true
      };

    } catch (error) {
      console.error('Error generando challenges fallback:', error);
      return {
        challenges: [],
        source: 'generated',
        success: false,
        error: 'No se pudieron generar challenges'
      };
    }
  }

  /**
   * Valida y filtra challenges, manteniendo solo los válidos
   */
  private validateAndFilterChallenges(challenges: Challenge[]): Challenge[] {
    return challenges.filter(challenge => {
      const isValid = this.isChallengeValid(challenge);
      if (!isValid) {
        console.warn(`Challenge "${challenge.name}" no es válido y será omitido`);
      }
      return isValid;
    });
  }

  /**
   * Obtiene el servicio de validación (para casos especiales)
   */
  getValidationService(): ValidationService {
    return this.validationService;
  }

  /**
   * Obtiene el generador de challenges (para casos especiales)
   */
  getGenerator(): ChallengeGenerator {
    return this.generator;
  }

  /**
   * Intenta cargar un archivo con coordenadas relativas
   */
  private async tryLoadRelativeFile(filePath: string): Promise<ChallengeLoadResult> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        return {
          challenges: [],
          source: 'file',
          success: false,
          error: `HTTP ${response.status}`
        };
      }

      const data: RelativeChallengeFile = await response.json();
      
      // Validar que es un archivo de coordenadas relativas
      if (data.coordinate_system !== 'mirror_relative') {
        return {
          challenges: [],
          source: 'file',
          success: false,
          error: 'Not a relative coordinate file'
        };
      }

      // Validar el archivo
      const validation = this.migration.validateRelativeFile(data);
      if (!validation.isValid) {
        console.warn('Archivo relativo tiene errores:', validation.errors);
      }

      if (validation.warnings.length > 0) {
        console.warn('Advertencias en archivo relativo:', validation.warnings);
      }

      // Convertir a formato absoluto
      const challenges = this.migration.convertRelativeFileToAbsolute(data);
      const validatedChallenges = this.validateAndFilterChallenges(challenges);

      return {
        challenges: validatedChallenges,
        source: 'file',
        success: validatedChallenges.length > 0,
        error: validatedChallenges.length === 0 ? 'No valid challenges found after conversion' : undefined
      };

    } catch (error) {
      return {
        challenges: [],
        source: 'file',
        success: false,
        error: `Error loading relative file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Carga un archivo personalizado, detectando automáticamente el formato
   */
  async loadCustomRelativeChallenges(file: File): Promise<ChallengeLoadResult> {
    try {
      const content = await file.text();
      const data = JSON.parse(content);

      // Detectar si es formato relativo
      if (data.coordinate_system === 'mirror_relative') {
        const validation = this.migration.validateRelativeFile(data);
        if (!validation.isValid) {
          throw new Error(`Errores en archivo relativo: ${validation.errors.join(', ')}`);
        }

        const challenges = this.migration.convertRelativeFileToAbsolute(data);
        const validatedChallenges = this.validateAndFilterChallenges(challenges);

        if (validatedChallenges.length === 0) {
          throw new Error('No se encontraron challenges válidos después de la conversión');
        }

        return {
          challenges: validatedChallenges,
          source: 'file',
          success: true
        };
      }

      // Si no es relativo, usar el método original
      return this.loadCustomChallenges(file);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return {
        challenges: [],
        source: 'file',
        success: false,
        error: `Error al cargar archivo: ${message}`
      };
    }
  }

  /**
   * Exporta challenges actuales al formato relativo
   */
  exportToRelativeFormat(challenges: Challenge[]): RelativeChallengeFile {
    return this.migration.convertAbsoluteChallengeToRelativeFile(challenges);
  }

  /**
   * Obtiene información sobre el sistema de coordenadas
   */
  getCoordinateSystemInfo() {
    return this.migration.getMigrationInfo();
  }
}