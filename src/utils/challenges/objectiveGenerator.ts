import { ObjectivePattern, PiecePosition } from '../components/ChallengeCard';

// Función para calcular el reflejo de una pieza
export const calculateMirrorPiece = (piece: PiecePosition, mirrorLine: number = 700): PiecePosition => {
  const reflectedX = 2 * mirrorLine - piece.x - 80; // 80 es PIECE_SIZE
  return {
    ...piece,
    x: reflectedX
  };
};

// Función para crear un objetivo simétrico completo a partir de las piezas del jugador
export const createSymmetricObjectiveFromPlayerPieces = (playerPieces: PiecePosition[]): ObjectivePattern => {
  const mirrorPieces = playerPieces.map(piece => calculateMirrorPiece(piece));
  
  // El patrón simétrico incluye tanto las piezas del jugador como sus reflejos
  const symmetricPattern = [...playerPieces, ...mirrorPieces];
  
  return {
    playerPieces,
    symmetricPattern
  };
};

// Función para exportar un objetivo en formato JSON
export const exportObjectiveToJSON = (objective: ObjectivePattern, metadata?: {
  id?: number;
  name?: string;
  description?: string;
  difficulty?: string;
}): string => {
  const fullObjective = {
    ...metadata,
    objective,
    // También incluir para compatibilidad
    targetPieces: objective.playerPieces
  };
  
  return JSON.stringify(fullObjective, null, 2);
};

// Función para importar un objetivo desde JSON
export const importObjectiveFromJSON = (jsonString: string): ObjectivePattern => {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Si tiene la estructura nueva, usarla
    if (parsed.objective) {
      return parsed.objective;
    }
    
    // Si solo tiene targetPieces, crear la estructura nueva
    if (parsed.targetPieces) {
      return createSymmetricObjectiveFromPlayerPieces(parsed.targetPieces);
    }
    
    // Si es directamente un array de piezas
    if (Array.isArray(parsed)) {
      return createSymmetricObjectiveFromPlayerPieces(parsed);
    }
    
    throw new Error('Formato JSON no válido para objetivo');
  } catch (error) {
    throw new Error(`Error al importar objetivo: ${error.message}`);
  }
};

// Función para validar un objetivo
export const validateObjective = (objective: ObjectivePattern): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!objective.playerPieces || !Array.isArray(objective.playerPieces)) {
    errors.push('playerPieces debe ser un array');
  }
  
  if (!objective.symmetricPattern || !Array.isArray(objective.symmetricPattern)) {
    errors.push('symmetricPattern debe ser un array');
  }
  
  if (objective.symmetricPattern?.length !== (objective.playerPieces?.length || 0) * 2) {
    errors.push('symmetricPattern debe tener el doble de elementos que playerPieces (piezas + reflejos)');
  }
  
  // Validar cada pieza del jugador
  objective.playerPieces?.forEach((piece, index) => {
    if (!piece.type || !['A', 'B'].includes(piece.type)) {
      errors.push(`Pieza ${index}: tipo debe ser 'A' o 'B'`);
    }
    if (!piece.face || !['front', 'back'].includes(piece.face)) {
      errors.push(`Pieza ${index}: face debe ser 'front' o 'back'`);
    }
    if (typeof piece.x !== 'number' || typeof piece.y !== 'number') {
      errors.push(`Pieza ${index}: x e y deben ser números`);
    }
    if (typeof piece.rotation !== 'number' || piece.rotation < 0 || piece.rotation >= 360) {
      errors.push(`Pieza ${index}: rotation debe ser un número entre 0 y 359`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Ejemplos de objetivos predefinidos en formato JSON
export const EXAMPLE_OBJECTIVES = {
  simple: `{
  "id": 1,
  "name": "Objetivo Simple",
  "description": "Dos piezas A en línea",
  "difficulty": "Fácil",
  "objective": {
    "playerPieces": [
      { "type": "A", "face": "front", "x": 150, "y": 150, "rotation": 0 },
      { "type": "A", "face": "front", "x": 230, "y": 150, "rotation": 0 }
    ],
    "mirrorPieces": [
      { "type": "A", "face": "front", "x": 390, "y": 150, "rotation": 0 },
      { "type": "A", "face": "front", "x": 470, "y": 150, "rotation": 0 }
    ]
  }
}`,
  
  complex: `{
  "id": 2,
  "name": "Objetivo Complejo",
  "description": "Patrón con rotaciones y caras",
  "difficulty": "Difícil",
  "objective": {
    "playerPieces": [
      { "type": "A", "face": "front", "x": 120, "y": 120, "rotation": 0 },
      { "type": "B", "face": "back", "x": 200, "y": 120, "rotation": 90 },
      { "type": "A", "face": "back", "x": 120, "y": 200, "rotation": 180 },
      { "type": "B", "face": "front", "x": 200, "y": 200, "rotation": 270 }
    ],
    "mirrorPieces": [
      { "type": "A", "face": "front", "x": 500, "y": 120, "rotation": 0 },
      { "type": "B", "face": "back", "x": 420, "y": 120, "rotation": 90 },
      { "type": "A", "face": "back", "x": 500, "y": 200, "rotation": 180 },
      { "type": "B", "face": "front", "x": 420, "y": 200, "rotation": 270 }
    ]
  }
}`
};