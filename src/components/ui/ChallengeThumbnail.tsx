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
  width = 120,
  height = 80
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

    // Find bounding box of all pieces
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    playerPieces.forEach(piece => {
      const pieceSize = 100; // Standard piece size
      minX = Math.min(minX, piece.x);
      maxX = Math.max(maxX, piece.x + pieceSize);
      minY = Math.min(minY, piece.y);
      maxY = Math.max(maxY, piece.y + pieceSize);
    });

    const patternWidth = maxX - minX;
    const patternHeight = maxY - minY;

    // Calculate scale to fit in thumbnail with padding
    const padding = 10;
    const scaleX = (width - padding * 2) / patternWidth;
    const scaleY = (height - padding * 2) / patternHeight;
    const scale = Math.min(scaleX, scaleY, 0.3); // Max scale of 0.3

    // Calculate center offset
    const centerX = (width - patternWidth * scale) / 2;
    const centerY = (height - patternHeight * scale) / 2;

    // Draw pieces
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

    // Draw mirror line
    const mirrorX = width / 2;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(mirrorX, 5);
    ctx.lineTo(mirrorX, height - 5);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw mirrored pieces
    playerPieces.forEach(piecePos => {
      const originalX = (piecePos.x - minX) * scale + centerX;
      const y = (piecePos.y - minY) * scale + centerY;
      const size = 100 * scale;

      // Mirror reflection
      const mirroredX = width - originalX - size;

      // Create mirrored piece
      const mirroredPiece = {
        id: 998,
        type: piecePos.type,
        face: piecePos.face,
        centerColor: piecePos.face === 'front' ? '#FFD700' : '#FF4444',
        triangleColor: piecePos.face === 'front' ? '#FF4444' : '#FFD700',
        x: 0,
        y: 0,
        rotation: piecePos.rotation,
        placed: true
      };

      // Draw mirrored piece with horizontal flip
      ctx.save();
      ctx.translate(mirroredX + size/2, y + size/2);
      ctx.scale(-1, 1);
      ctx.translate(-size/2, -size/2);
      drawPiece(ctx, mirroredPiece, 0, 0, size);
      ctx.restore();
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