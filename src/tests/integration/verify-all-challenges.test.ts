import { GameGeometry } from './src/utils/GameGeometry';
import * as fs from 'fs';

const geometry = new GameGeometry({
  width: 700,
  height: 600,
  mirrorLineX: 700,
  pieceSize: 100
});

console.log('=== VERIFICACIÓN DE TODOS LOS CHALLENGES ===\n');

// Cargar el archivo challenges.json
const challengesData = JSON.parse(fs.readFileSync('./public/challenges.json', 'utf8'));

challengesData.forEach((challenge: any) => {
  console.log(`Challenge ${challenge.id}: ${challenge.name}`);
  
  const pieces = challenge.objective.playerPieces;
  const validation = geometry.validateChallengeCard(pieces);
  
  console.log(`  Válido: ${validation.isValid ? '✅' : '❌'}`);
  console.log(`  Toca espejo: ${validation.touchesMirror ? '✅' : '❌'}`);
  console.log(`  Sin solapamientos: ${!validation.hasPieceOverlaps && !validation.hasReflectionOverlaps ? '✅' : '❌'}`);
  console.log(`  En área: ${validation.piecesInArea ? '✅' : '❌'}`);
  console.log(`  Conectado: ${validation.piecesConnected ? '✅' : '❌'}`);
  
  if (!validation.isValid) {
    console.log('  ❌ PROBLEMAS:', {
      touchesMirror: validation.touchesMirror,
      hasPieceOverlaps: validation.hasPieceOverlaps,
      hasReflectionOverlaps: validation.hasReflectionOverlaps,
      entersMirror: validation.entersMirror,
      piecesConnected: validation.piecesConnected,
      piecesInArea: validation.piecesInArea
    });
  }
  
  console.log('---');
});

console.log('=== VERIFICACIÓN COMPLETA ===');