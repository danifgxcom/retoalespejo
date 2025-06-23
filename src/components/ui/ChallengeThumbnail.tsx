import React, { useRef, useEffect } from 'react';
import { Challenge } from '../ChallengeCard';
import { drawPiece, Piece } from '../GamePiece';

interface ChallengeThumbnailProps {
  challenge: Challenge;
  width?: number;
  height?: number;
  backgroundColor?: string;
}

const ChallengeThumbnail: React.FC<ChallengeThumbnailProps> = ({
  challenge,
  width = 300,
  height = 230,
  backgroundColor
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw gradient background based on difficulty
    if (backgroundColor) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      
      // Map difficulty to gradient colors
      const difficultyColors = {
        'Principiante': ['#60A5FA', '#3B82F6'], // blue-400 to blue-500
        'Fácil': ['#3B82F6', '#2563EB'],        // blue-500 to blue-600
        'Intermedio': ['#2563EB', '#1D4ED8'],   // blue-600 to blue-700
        'Avanzado': ['#1D4ED8', '#1E3A8A']      // blue-700 to blue-900
      };
      
      const colors = difficultyColors[challenge.difficulty as keyof typeof difficultyColors] || ['#60A5FA', '#3B82F6'];
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Default light background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);
    }

    // Calculate scaling and centering
    const playerPieces = challenge.objective.playerPieces;
    if (playerPieces.length === 0) return;

    // Área FIJA para TODAS las miniaturas - mismo crop y escala
    const totalWidth = 1400;   // Juego (700) + Espejo (700)
    const standardHeight = 600; // Altura fija
    
    // Escala FIJA para todas
    const padding = 16;
    const scale = Math.min((width - padding * 2) / totalWidth, (height - padding * 2) / standardHeight);
    
    // Centrado FIJO
    const scaledWidth = totalWidth * scale;
    const scaledHeight = standardHeight * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;
    
    console.log(`🔍 FIXED Challenge ${challenge.id}: Scale=${scale.toFixed(3)} Offset=(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
    
    // Draw original pieces
    playerPieces.forEach((piecePos, index) => {
      const x = piecePos.x * scale + offsetX;
      const y = piecePos.y * scale + offsetY;
      const size = 100 * scale;

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


    // Draw reflected pieces

    playerPieces.forEach((piecePos, index) => {
      const mirrorLine = 700;
      const reflectedX = 2 * mirrorLine - piecePos.x - 100;
      const x = reflectedX * scale + offsetX;
      const y = piecePos.y * scale + offsetY;
      const size = 100 * scale;

      const reflectedPiece = {
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

      // Draw reflected piece with horizontal flip
      ctx.save();
      ctx.translate(x + size/2, y + size/2);
      ctx.scale(-1, 1);
      ctx.translate(-size/2, -size/2);
      drawPiece(ctx, reflectedPiece, 0, 0, size);
      ctx.restore();
    });


  }, [challenge, width, height, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg shadow-sm"
      style={{ imageRendering: 'crisp-edges', border: '1px solid #e5e7eb' }}
    />
  );
};

export default ChallengeThumbnail;