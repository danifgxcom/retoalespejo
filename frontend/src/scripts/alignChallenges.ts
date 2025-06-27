import { PerfectAlignmentService } from '../services/PerfectAlignmentService';
import { Challenge } from '../components/ChallengeCard';

/**
 * Script para procesar challenges.json y generar posiciones perfectas
 * Elimina micro-gaps manteniendo la integridad visual de las figuras
 */

// Simulación de challenges.json (en un entorno real se leería del archivo)
const challenges: Challenge[] = [
  {
    "id": 1,
    "name": "Tarjeta 1: Corazón Simple",
    "description": "Forma un corazón con una pieza A tocando el espejo",
    "piecesNeeded": 1,
    "difficulty": "Principiante",
    "targetPattern": "heart_simple",
    "objective": {
      "playerPieces": [
        {
          "type": "A",
          "face": "front",
          "x": 650,
          "y": 387.74,
          "rotation": 270
        }
      ],
      "symmetricPattern": []
    },
    "targetPieces": [
      {
        "type": "A",
        "face": "front",
        "x": 330,
        "y": 300,
        "rotation": 0
      }
    ]
  },
  {
    "id": 2,
    "name": "Tarjeta 2: Bloque Horizontal",
    "description": "Forma un bloque horizontal con dos piezas A tocándose",
    "piecesNeeded": 2,
    "difficulty": "Fácil",
    "targetPattern": "custom",
    "objective": {
      "playerPieces": [
        {
          "type": "A",
          "face": "back",
          "x": 650,
          "y": 400.76,
          "rotation": 270
        },
        {
          "type": "A",
          "face": "back",
          "x": 330,
          "y": 464.76,
          "rotation": 0
        }
      ],
      "symmetricPattern": []
    },
    "targetPieces": [
      {
        "type": "A",
        "face": "back",
        "x": 650,
        "y": 400.76,
        "rotation": 270
      },
      {
        "type": "A",
        "face": "back",
        "x": 330,
        "y": 464.76,
        "rotation": 0
      }
    ]
  },
  {
    "id": 7,
    "name": "Cuadrado",
    "description": "Un cuadrado básico",
    "piecesNeeded": 2,
    "difficulty": "Principiante",
    "targetPattern": "custom",
    "objective": {
      "playerPieces": [
        {
          "type": "B",
          "face": "front",
          "x": 650,
          "y": 356.78,
          "rotation": 45
        },
        {
          "type": "B",
          "face": "front",
          "x": 468.98,
          "y": 169.6,
          "rotation": 225
        }
      ],
      "symmetricPattern": []
    },
    "targetPieces": [
      {
        "type": "B",
        "face": "front",
        "x": 650,
        "y": 356.78,
        "rotation": 45
      },
      {
        "type": "B",
        "face": "front",
        "x": 468.98,
        "y": 169.6,
        "rotation": 225
      }
    ]
  },
  {
    "id": 10,
    "name": "Pareja Horizontal",
    "description": "Dos piezas A en línea horizontal",
    "piecesNeeded": 2,
    "difficulty": "Fácil",
    "targetPattern": "custom",
    "objective": {
      "playerPieces": [
        {
          "type": "A",
          "face": "front",
          "x": 650,
          "y": 300,
          "rotation": 0
        },
        {
          "type": "A",
          "face": "front",
          "x": 520,
          "y": 300,
          "rotation": 0
        }
      ],
      "symmetricPattern": []
    },
    "targetPieces": [
      {
        "type": "A",
        "face": "front",
        "x": 650,
        "y": 300,
        "rotation": 0
      },
      {
        "type": "A",
        "face": "front",
        "x": 520,
        "y": 300,
        "rotation": 0
      }
    ]
  }
];

/**
 * Procesa un challenge individual aplicando alineación perfecta
 */
function processChallenge(challenge: Challenge): Challenge {
  console.log(`\n=== Procesando Challenge ${challenge.id}: ${challenge.name} ===`);
  
  const originalPieces = challenge.objective.playerPieces;
  console.log('Piezas originales:', originalPieces.map(p => 
    `${p.type}(${p.face}) at (${p.x}, ${p.y}) rot:${p.rotation}°`
  ));

  // Calcular posiciones perfectas
  const perfectPieces = PerfectAlignmentService.calculatePerfectPositions(originalPieces);
  
  console.log('Piezas perfectas:', perfectPieces.map(p => 
    `${p.type}(${p.face}) at (${p.x}, ${p.y}) rot:${p.rotation}°`
  ));

  // Validar que las conexiones se mantienen
  const isValid = PerfectAlignmentService.validatePerfectPositions(originalPieces, perfectPieces);
  console.log('Validación:', isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO');

  // Mostrar diferencias
  console.log('Diferencias:');
  originalPieces.forEach((orig, i) => {
    const perfect = perfectPieces[i];
    const dx = perfect.x - orig.x;
    const dy = perfect.y - orig.y;
    const dr = perfect.rotation - orig.rotation;
    
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01 || Math.abs(dr) > 0.01) {
      console.log(`  Pieza ${i}: Δx=${dx.toFixed(2)}, Δy=${dy.toFixed(2)}, Δrot=${dr}°`);
    } else {
      console.log(`  Pieza ${i}: Sin cambios`);
    }
  });

  // Crear nuevo challenge con posiciones perfectas
  return {
    ...challenge,
    objective: {
      ...challenge.objective,
      playerPieces: perfectPieces
    },
    // También actualizar targetPieces para consistency
    targetPieces: perfectPieces
  };
}

/**
 * Función principal de procesamiento
 */
function processChallenges(): Challenge[] {
  console.log('🎯 INICIANDO PROCESAMIENTO DE CHALLENGES PARA ALINEACIÓN PERFECTA');
  console.log('='.repeat(70));

  const processedChallenges = challenges.map(processChallenge);

  console.log('\n' + '='.repeat(70));
  console.log('✅ PROCESAMIENTO COMPLETADO');
  console.log(`📊 Total de challenges procesados: ${processedChallenges.length}`);

  return processedChallenges;
}

/**
 * Genera el JSON de salida con las posiciones perfectas
 */
function generatePerfectChallengesJson(): string {
  const perfectChallenges = processChallenges();
  return JSON.stringify(perfectChallenges, null, 2);
}

// Ejemplo de uso
if (typeof window === 'undefined') {
  // Solo ejecutar en Node.js/script mode
  const perfectJson = generatePerfectChallengesJson();
  console.log('\n📄 JSON DE SALIDA:');
  console.log(perfectJson);
}

export { processChallenges, generatePerfectChallengesJson };