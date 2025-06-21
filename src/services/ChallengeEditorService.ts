import { Challenge } from '../components/ChallengeCard';

export class ChallengeEditorService {
  private static instance: ChallengeEditorService;

  static getInstance(): ChallengeEditorService {
    if (!ChallengeEditorService.instance) {
      ChallengeEditorService.instance = new ChallengeEditorService();
    }
    return ChallengeEditorService.instance;
  }

  async loadChallenges(): Promise<Challenge[]> {
    try {
      const response = await fetch('/challenges.json');
      if (!response.ok) {
        throw new Error(`Failed to load challenges: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading challenges:', error);
      return [];
    }
  }

  async saveChallenge(challenge: Challenge, existingChallenges: Challenge[]): Promise<boolean> {
    try {
      // Find if we're updating an existing challenge or adding a new one
      const existingIndex = existingChallenges.findIndex(c => c.id === challenge.id);
      
      let updatedChallenges: Challenge[];
      if (existingIndex >= 0) {
        // Update existing challenge
        updatedChallenges = [...existingChallenges];
        updatedChallenges[existingIndex] = challenge;
      } else {
        // Add new challenge
        updatedChallenges = [...existingChallenges, challenge];
      }

      // Sort by ID to maintain order
      updatedChallenges.sort((a, b) => a.id - b.id);

      // In a real application, this would make an API call to save to the server
      // For now, we'll download the JSON file for the user to manually update
      const blob = new Blob([JSON.stringify(updatedChallenges, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'challenges.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error saving challenge:', error);
      return false;
    }
  }

  async deleteChallenge(challengeId: number, existingChallenges: Challenge[]): Promise<boolean> {
    try {
      const updatedChallenges = existingChallenges.filter(c => c.id !== challengeId);
      
      // Download updated file
      const blob = new Blob([JSON.stringify(updatedChallenges, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'challenges.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error deleting challenge:', error);
      return false;
    }
  }

  validateChallengeData(challenge: Challenge): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!challenge.name || challenge.name.trim().length === 0) {
      errors.push('El nombre del reto es obligatorio');
    }

    if (!challenge.description || challenge.description.trim().length === 0) {
      errors.push('La descripción del reto es obligatoria');
    }

    if (!challenge.difficulty || !['Principiante', 'Fácil', 'Intermedio', 'Difícil', 'Experto'].includes(challenge.difficulty)) {
      errors.push('La dificultad debe ser una de las opciones válidas');
    }

    if (!challenge.objective.playerPieces || challenge.objective.playerPieces.length === 0) {
      errors.push('El reto debe tener al menos una pieza');
    }

    if (challenge.piecesNeeded !== challenge.objective.playerPieces.length) {
      errors.push('El número de piezas necesarias no coincide con las piezas del objetivo');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  exportChallenges(challenges: Challenge[]): void {
    const blob = new Blob([JSON.stringify(challenges, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `challenges_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importChallenges(file: File): Promise<Challenge[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const challenges = JSON.parse(content);
          
          // Validate that it's an array of challenges
          if (!Array.isArray(challenges)) {
            throw new Error('El archivo debe contener un array de retos');
          }

          // Basic validation of challenge structure
          for (const challenge of challenges) {
            if (!challenge.id || !challenge.name || !challenge.objective) {
              throw new Error('Formato de reto inválido en el archivo');
            }
          }

          resolve(challenges);
        } catch (error) {
          reject(new Error(`Error al procesar el archivo: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsText(file);
    });
  }
}