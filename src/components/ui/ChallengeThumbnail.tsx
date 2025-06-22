import React, { useRef, useEffect } from 'react';
import { Challenge } from '../ChallengeCard';
import { drawPiece } from '../GamePiece';

interface ChallengeThumbnailProps {
  challenge: Challenge;
  width?: number;
  height?: number;
}

const ChallengeThumbnail: React.FC<ChallengeThumbnailProps> = ({
  challenge,
  width = 140,
  height = 100
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Calculate scaling and centering
    const playerPieces = challenge.objective.playerPieces;
    if (playerPieces.length === 0) return;

    // Find bounding box of all pieces (including rotations)
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    playerPieces.forEach(piece => {
      const pieceSize = 100; // Standard piece size
      // Calculate approximate bounds considering rotation
      const centerX = piece.x + pieceSize / 2;
      const centerY = piece.y + pieceSize / 2;
      const radius = pieceSize * 0.8; // Approximate radius for rotated piece
      
      minX = Math.min(minX, centerX - radius);
      maxX = Math.max(maxX, centerX + radius);
      minY = Math.min(minY, centerY - radius);
      maxY = Math.max(maxY, centerY + radius);
    });

    const patternWidth = maxX - minX;
    const patternHeight = maxY - minY;

    // Calculate scale to fit in thumbnail with minimal padding
    const padding = 8;
    const scaleX = (width - padding * 2) / patternWidth;
    const scaleY = (height - padding * 2) / patternHeight;
    const scale = Math.min(scaleX, scaleY, 0.5); // Increased max scale

    // Calculate center offset for tight crop
    const centerX = (width - patternWidth * scale) / 2;
    const centerY = (height - patternHeight * scale) / 2;

    // Draw only the player pieces (no mirror, no reflections)
    playerPieces.forEach(piecePos => {
      const x = (piecePos.x - minX) * scale + centerX;
      const y = (piecePos.y - minY) * scale + centerY;
      const size = 100 * scale;

      // Create display piece
      const displayPiece = {
        id: 999,
        type: piecePos.type,
        face: piecePos.face,
        centerColor: piecePos.face === 'front' ? '#FFD700' : '#FF4444',
        triangleColor: piecePos.face === 'front' ? '#FF4444' : '#FFD700',
        x: 0,
        y: 0,
        rotation: piecePos.rotation,
        placed: true
      };

      drawPiece(ctx, displayPiece, x, y, size);
    });

  }, [challenge, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg border border-gray-200"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
};

export default ChallengeThumbnail;