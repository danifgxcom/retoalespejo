#!/usr/bin/env node
/**
 * Migración única: pasa las coordenadas de los retos del ancla antigua (esquina
 * de una caja imaginaria de pieceSize × pieceSize) al ancla nueva (el centro de
 * la pieza). Las figuras quedan exactamente donde estaban en pantalla.
 *
 *   node src/scripts/migratePieceAnchor.cjs public/challenges.json
 *
 * Idempotente: las piezas ya migradas llevan `anchor: 'center'` y se ignoran.
 */
const fs = require('fs');

const PIECE_SIZE = 100;
const UNIT = PIECE_SIZE * 1.28;

const migratePiece = piece => {
  if (piece.anchor === 'center') return piece;

  const rad = (piece.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const offsetX = (piece.type === 'B' ? -1.5 : 1.5) * UNIT;
  const offsetY = -0.5 * UNIT;
  const round = v => Math.round(v * 1e4) / 1e4;

  return {
    ...piece,
    anchor: 'center',
    x: round(piece.x + PIECE_SIZE / 2 + (offsetX * cos - offsetY * sin)),
    y: round(piece.y + PIECE_SIZE / 2 + (offsetX * sin + offsetY * cos)),
  };
};

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('uso: migratePieceAnchor.cjs <fichero.json> [...]');
  process.exit(1);
}

for (const file of files) {
  const challenges = JSON.parse(fs.readFileSync(file, 'utf8'));
  let migrated = 0;

  for (const challenge of challenges) {
    for (const key of ['playerPieces', 'symmetricPattern']) {
      const pieces = challenge.objective?.[key];
      if (!Array.isArray(pieces)) continue;
      challenge.objective[key] = pieces.map(piece => {
        if (piece.anchor !== 'center') migrated++;
        return migratePiece(piece);
      });
    }
  }

  fs.writeFileSync(file, JSON.stringify(challenges, null, 2) + '\n');
  console.log(`${file}: ${migrated} piezas migradas en ${challenges.length} retos`);
}
