/**
 * Script para procesar challenges.json y generar posiciones perfectas
 * Elimina micro-gaps manteniendo la integridad visual de las figuras
 */

class PerfectAlignmentService {
  static PIECE_SIZE = 100;
  static TOLERANCE = 5;
  static GRID_SIZE = 10;

  static calculatePerfectPositions(pieces) {
    if (pieces.length <= 1) return pieces;

    const perfectPieces = pieces.map(piece => ({ ...piece }));
    const connectionGroups = this.findConnectionGroups(perfectPieces);

    connectionGroups.forEach(group => {
      this.alignGroupPerfectly(group, perfectPieces);
    });

    return perfectPieces;
  }

  static findConnectionGroups(pieces) {
    const groups = [];
    const visited = new Set();

    pieces.forEach((piece, index) => {
      if (visited.has(index)) return;

      const group = [];
      this.findConnectedPieces(pieces, index, visited, group);
      
      if (group.length > 1) {
        groups.push(group);
      }
    });

    return groups;
  }

  static findConnectedPieces(pieces, pieceIndex, visited, group) {
    if (visited.has(pieceIndex)) return;

    visited.add(pieceIndex);
    group.push(pieceIndex);

    const currentPiece = pieces[pieceIndex];

    pieces.forEach((otherPiece, otherIndex) => {
      if (otherIndex === pieceIndex || visited.has(otherIndex)) return;

      if (this.arePiecesConnected(currentPiece, otherPiece)) {
        this.findConnectedPieces(pieces, otherIndex, visited, group);
      }
    });
  }

  static arePiecesConnected(piece1, piece2) {
    const dx = Math.abs(piece1.x - piece2.x);
    const dy = Math.abs(piece1.y - piece2.y);

    const horizontallyConnected = dy < this.TOLERANCE && 
      (Math.abs(dx - this.PIECE_SIZE) < this.TOLERANCE);
    
    const verticallyConnected = dx < this.TOLERANCE && 
      (Math.abs(dy - this.PIECE_SIZE) < this.TOLERANCE);

    const diagonalDistance = Math.sqrt(dx * dx + dy * dy);
    const expectedDiagonalConnections = [
      this.PIECE_SIZE * Math.sqrt(2),
      this.PIECE_SIZE * Math.sqrt(2) / 2,
      this.PIECE_SIZE
    ];

    const diagonallyConnected = expectedDiagonalConnections.some(expected => 
      Math.abs(diagonalDistance - expected) < this.TOLERANCE * 2
    );

    return horizontallyConnected || verticallyConnected || diagonallyConnected;
  }

  static alignGroupPerfectly(groupIndices, pieces) {
    if (groupIndices.length < 2) return;

    const referenceIndex = this.findReferencePiece(groupIndices, pieces);
    const referencePiece = pieces[referenceIndex];

    const alignedReference = this.snapToGrid(referencePiece);
    pieces[referenceIndex] = alignedReference;

    groupIndices.forEach(index => {
      if (index === referenceIndex) return;

      const piece = pieces[index];
      const perfectPosition = this.calculatePerfectRelativePosition(
        alignedReference, 
        piece, 
        pieces[index]
      );
      
      pieces[index] = perfectPosition;
    });
  }

  static findReferencePiece(groupIndices, pieces) {
    let bestIndex = groupIndices[0];
    let bestScore = this.calculateReferenceScore(pieces[bestIndex]);

    groupIndices.forEach(index => {
      const score = this.calculateReferenceScore(pieces[index]);
      if (score > bestScore) {
        bestIndex = index;
        bestScore = score;
      }
    });

    return bestIndex;
  }

  static calculateReferenceScore(piece) {
    let score = 0;

    if (Math.abs(piece.x - 650) < this.TOLERANCE) score += 100;
    if (piece.x % 10 === 0) score += 10;
    if (piece.y % 10 === 0) score += 10;
    if (piece.rotation % 45 === 0) score += 20;
    if (piece.x % 1 !== 0) score -= 5;
    if (piece.y % 1 !== 0) score -= 5;

    return score;
  }

  static snapToGrid(piece) {
    return {
      ...piece,
      x: Math.round(piece.x / this.GRID_SIZE) * this.GRID_SIZE,
      y: Math.round(piece.y / this.GRID_SIZE) * this.GRID_SIZE,
      rotation: Math.round(piece.rotation / 45) * 45
    };
  }

  static calculatePerfectRelativePosition(reference, original, current) {
    const dx = original.x - reference.x;
    const dy = original.y - reference.y;

    let perfectDx = dx;
    let perfectDy = dy;

    if (Math.abs(dx) > Math.abs(dy)) {
      perfectDx = dx > 0 ? this.PIECE_SIZE : -this.PIECE_SIZE;
      perfectDy = Math.round(dy / this.GRID_SIZE) * this.GRID_SIZE;
    } else if (Math.abs(dy) > Math.abs(dx)) {
      perfectDy = dy > 0 ? this.PIECE_SIZE : -this.PIECE_SIZE;
      perfectDx = Math.round(dx / this.GRID_SIZE) * this.GRID_SIZE;
    } else {
      const diagonalSize = this.PIECE_SIZE;
      perfectDx = dx > 0 ? diagonalSize : -diagonalSize;
      perfectDy = dy > 0 ? diagonalSize : -diagonalSize;
    }

    return {
      ...current,
      x: reference.x + perfectDx,
      y: reference.y + perfectDy,
      rotation: Math.round(current.rotation / 45) * 45
    };
  }
}

// Test con algunos challenges de ejemplo
const testChallenges = [
  {
    "id": 2,
    "name": "Tarjeta 2: Bloque Horizontal",
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
      ]
    }
  },
  {
    "id": 10,
    "name": "Pareja Horizontal",
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
      ]
    }
  }
];

function processChallenge(challenge) {
  console.log(`\n=== Challenge ${challenge.id}: ${challenge.name} ===`);
  
  const originalPieces = challenge.objective.playerPieces;
  console.log('Piezas originales:');
  originalPieces.forEach((p, i) => 
    console.log(`  ${i}: ${p.type}(${p.face}) at (${p.x}, ${p.y}) rot:${p.rotation}°`)
  );

  const perfectPieces = PerfectAlignmentService.calculatePerfectPositions(originalPieces);
  
  console.log('Piezas perfectas:');
  perfectPieces.forEach((p, i) => 
    console.log(`  ${i}: ${p.type}(${p.face}) at (${p.x}, ${p.y}) rot:${p.rotation}°`)
  );

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

  return {
    ...challenge,
    objective: {
      ...challenge.objective,
      playerPieces: perfectPieces
    }
  };
}

console.log('🎯 PRUEBA DE ALGORITMO DE ALINEACIÓN PERFECTA');
console.log('='.repeat(50));

testChallenges.forEach(processChallenge);

console.log('\n✅ PRUEBA COMPLETADA');