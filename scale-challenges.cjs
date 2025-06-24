// Script para escalar las coordenadas X de los challenges 
// Factor de escala: nueva línea espejo (1200) / línea espejo anterior (700) = 1.714

const fs = require('fs');
const path = require('path');

const SCALE_FACTOR = 1200 / 700; // 1.714285714...

function scaleChallenge(challenge) {
  const scaledChallenge = JSON.parse(JSON.stringify(challenge)); // Deep clone
  
  // Escalar playerPieces en objective
  if (scaledChallenge.objective && scaledChallenge.objective.playerPieces) {
    scaledChallenge.objective.playerPieces.forEach(piece => {
      piece.x = Math.round(piece.x * SCALE_FACTOR);
    });
  }
  
  // Escalar targetPieces
  if (scaledChallenge.targetPieces) {
    scaledChallenge.targetPieces.forEach(piece => {
      piece.x = Math.round(piece.x * SCALE_FACTOR);
    });
  }
  
  return scaledChallenge;
}

// Leer el archivo de challenges
const challengesPath = path.join(__dirname, 'public', 'challenges.json');
const originalChallenges = JSON.parse(fs.readFileSync(challengesPath, 'utf8'));

// Escalar todos los challenges
const scaledChallenges = originalChallenges.map(scaleChallenge);

// Crear backup del archivo original
const backupPath = path.join(__dirname, 'public', 'challenges.json.backup');
fs.writeFileSync(backupPath, JSON.stringify(originalChallenges, null, 2));
console.log('✅ Backup created at:', backupPath);

// Escribir los challenges escalados
fs.writeFileSync(challengesPath, JSON.stringify(scaledChallenges, null, 2));
console.log('✅ Challenges scaled successfully!');
console.log(`📏 Scale factor applied: ${SCALE_FACTOR.toFixed(3)}`);
console.log('🔄 Mirror line moved from 700 to 1200');

// Mostrar algunos ejemplos de cambios
console.log('\n📊 Example coordinate changes:');
originalChallenges.slice(0, 3).forEach((original, i) => {
  const scaled = scaledChallenges[i];
  console.log(`\nChallenge ${original.id}: ${original.name}`);
  
  if (original.objective?.playerPieces) {
    original.objective.playerPieces.forEach((piece, j) => {
      const scaledPiece = scaled.objective.playerPieces[j];
      console.log(`  Piece ${j+1}: x=${piece.x} → x=${scaledPiece.x} (y=${piece.y} unchanged)`);
    });
  }
});