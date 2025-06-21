import { Challenge } from '../components/ChallengeCard';
import { Piece } from '../components/GamePiece';
import { GameGeometry } from '../utils/geometry/GameGeometry';

export interface ChallengeCardRenderConfig {
  cardLeft: number;
  cardTop: number;
  cardWidth: number;
  cardHeight: number;
  contentTop: number;
  contentHeight: number;
  mirrorLineX: number;
  gameAreaWidth: number;
  gameAreaHeight: number;
  pieceSize: number;
  scale: number;
}

export class ChallengeCardRenderer {
  private config: ChallengeCardRenderConfig;
  private geometry: GameGeometry;

  constructor(config: ChallengeCardRenderConfig, geometry: GameGeometry) {
    this.config = config;
    this.geometry = geometry;
  }

  /**
   * Renders the complete challenge card
   */
  render(
    ctx: CanvasRenderingContext2D, 
    challenge: Challenge | null, 
    validation: any,
    debugMode: boolean = false
  ): void {
    this.drawCardFrame(ctx);

    if (!challenge) {
      this.drawLoadingMessage(ctx);
      return;
    }

    if (!validation.isValid) {
      this.drawInvalidChallenge(ctx, validation);
    } else {
      this.drawValidChallenge(ctx, challenge, debugMode);
    }
  }

  /**
   * Draws the card frame and header
   */
  private drawCardFrame(ctx: CanvasRenderingContext2D): void {
    const { cardLeft, cardTop, cardWidth, cardHeight } = this.config;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cardLeft, cardTop, cardWidth, cardHeight);

    // Border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4;
    ctx.strokeRect(cardLeft, cardTop, cardWidth, cardHeight);

    // Title
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CHALLENGE CARD', cardLeft + cardWidth/2, cardTop + 25);
  }

  /**
   * Draws loading message
   */
  private drawLoadingMessage(ctx: CanvasRenderingContext2D): void {
    const { cardLeft, cardWidth, cardTop, cardHeight } = this.config;
    
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Loading challenges...', cardLeft + cardWidth/2, cardTop + cardHeight/2);
  }

  /**
   * Draws invalid challenge state
   */
  private drawInvalidChallenge(ctx: CanvasRenderingContext2D, validation: any): void {
    const { cardLeft, cardTop, cardWidth, cardHeight } = this.config;

    // Red background
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(cardLeft, cardTop, cardWidth, cardHeight);

    // INVALID text
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('INVALID', cardLeft + cardWidth/2, cardTop + cardHeight/2);

    // Error details
    this.drawValidationErrors(ctx, validation);
  }

  /**
   * Draws validation error details
   */
  private drawValidationErrors(ctx: CanvasRenderingContext2D, validation: any): void {
    const { cardLeft, cardWidth, cardTop, cardHeight } = this.config;
    
    ctx.font = '14px Arial';
    let yPos = cardTop + cardHeight/2 + 30;

    const errors = [
      { condition: !validation.touchesMirror, text: 'No piece touches the mirror' },
      { condition: validation.hasPieceOverlaps, text: 'Pieces overlap' },
      { condition: validation.entersMirror, text: 'Piece enters mirror area' },
      { condition: !validation.piecesConnected, text: 'Pieces must form a continuous figure' },
      { condition: !validation.piecesInArea, text: 'Pieces must fit within challenge area' }
    ];

    errors.forEach(error => {
      if (error.condition) {
        ctx.fillText(error.text, cardLeft + cardWidth/2, yPos);
        yPos += 20;
      }
    });
  }

  /**
   * Draws valid challenge with pieces
   */
  private drawValidChallenge(
    ctx: CanvasRenderingContext2D, 
    challenge: Challenge, 
    debugMode: boolean
  ): void {
    if (!challenge.objective?.playerPieces) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Challenge data not available', 
        this.config.cardLeft + this.config.cardWidth/2, 
        this.config.contentTop + 50);
      return;
    }

    this.drawChallengeNumber(ctx, challenge);
    this.drawObjectivePieces(ctx, challenge.objective.playerPieces, debugMode);
  }

  /**
   * Draws challenge number
   */
  private drawChallengeNumber(ctx: CanvasRenderingContext2D, challenge: Challenge): void {
    const { cardLeft, cardWidth, cardTop } = this.config;
    
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`#${challenge.id}`, cardLeft + cardWidth/2, cardTop + 45);
  }

  /**
   * Draws the objective pieces in the card
   */
  private drawObjectivePieces(
    ctx: CanvasRenderingContext2D, 
    playerPieces: any[], 
    debugMode: boolean
  ): void {
    const { 
      cardLeft, cardTop, cardWidth, cardHeight, 
      contentTop, contentHeight, gameAreaWidth, gameAreaHeight,
      scale 
    } = this.config;

    // Center the content within the card
    const totalContentWidth = (gameAreaWidth * 2) * scale;
    const contentStartX = cardLeft + (cardWidth - totalContentWidth) / 2;
    const gameAreaOffsetX = contentStartX;
    const gameAreaOffsetY = contentTop + (contentHeight - gameAreaHeight * scale) / 2;
    const mirrorLineX = gameAreaOffsetX + gameAreaWidth * scale;

    // Debug information
    if (debugMode) {
      this.logDebugInfo(gameAreaOffsetX, gameAreaOffsetY, mirrorLineX, playerPieces);
      this.drawDebugOverlays(ctx, gameAreaOffsetX, gameAreaOffsetY, mirrorLineX, cardLeft, cardTop, cardWidth, cardHeight);
    }

    // Scale pieces
    const scaledPieces = playerPieces.map(piece => ({
      ...piece,
      x: piece.x * scale,
      y: piece.y * scale
    }));

    // Draw pieces
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    scaledPieces.forEach((piecePos, index) => {
      this.drawPieceAndReflection(
        ctx, piecePos, index, 
        gameAreaOffsetX, gameAreaOffsetY, mirrorLineX, 
        debugMode
      );
    });

    ctx.restore();
  }

  /**
   * Draws a piece and its reflection
   */
  private drawPieceAndReflection(
    ctx: CanvasRenderingContext2D,
    piecePos: any,
    index: number,
    gameAreaOffsetX: number,
    gameAreaOffsetY: number,
    mirrorLineX: number,
    debugMode: boolean
  ): void {
    const { pieceSize, scale } = this.config;

    // Create display piece
    const displayPiece = this.createDisplayPiece(piecePos, index, gameAreaOffsetX, gameAreaOffsetY);
    
    // Calculate reflected position
    const reflectedX = 2 * mirrorLineX - displayPiece.x - pieceSize * scale;
    const reflectedPiece = { ...displayPiece, x: reflectedX };

    if (debugMode) {
      this.logPieceDebugInfo(displayPiece, reflectedPiece, index, pieceSize, scale);
    }

    // Draw original piece
    this.drawPieceClean(ctx, displayPiece, displayPiece.x, displayPiece.y, pieceSize * scale);

    // Draw reflected piece
    ctx.save();
    ctx.translate(reflectedPiece.x + (pieceSize * scale)/2, reflectedPiece.y + (pieceSize * scale)/2);
    ctx.scale(-1, 1);
    ctx.translate(-(pieceSize * scale)/2, -(pieceSize * scale)/2);
    this.drawPieceClean(ctx, reflectedPiece, 0, 0, pieceSize * scale);
    ctx.restore();
  }

  /**
   * Creates a display piece from piece position data
   */
  private createDisplayPiece(piecePos: any, index: number, offsetX: number, offsetY: number): Piece {
    const centerColor = piecePos.type === 'A' ? 
      (piecePos.face === 'front' ? '#FFD700' : '#FF4444') : 
      (piecePos.face === 'front' ? '#FF4444' : '#FFD700');
    const triangleColor = piecePos.type === 'A' ? 
      (piecePos.face === 'front' ? '#FF4444' : '#FFD700') : 
      (piecePos.face === 'front' ? '#FFD700' : '#FF4444');

    return {
      id: 1000 + index,
      type: piecePos.type,
      face: piecePos.face,
      centerColor,
      triangleColor,
      x: offsetX + piecePos.x,
      y: offsetY + piecePos.y,
      rotation: piecePos.rotation,
      placed: true
    };
  }

  /**
   * Draws a piece without borders for clean rendering
   */
  private drawPieceClean(ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number, size: number): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    ctx.translate(x + size/2, y + size/2);
    ctx.rotate((piece.rotation * Math.PI) / 180);

    if (piece.type === 'B') {
      ctx.scale(-1, 1);
    }

    const unit = size * 1.28;
    const coord = (coordX: number, coordY: number): [number, number] => [
      Math.round(coordX * unit), 
      Math.round(-coordY * unit)
    ];

    // Disable borders
    ctx.lineWidth = 0;
    ctx.strokeStyle = 'transparent';

    // Draw center square
    ctx.fillStyle = piece.centerColor;
    ctx.beginPath();
    ctx.moveTo(...coord(1, 0));
    ctx.lineTo(...coord(2, 0));
    ctx.lineTo(...coord(2, 1));
    ctx.lineTo(...coord(1, 1));
    ctx.closePath();
    ctx.fill();

    // Draw triangles
    ctx.fillStyle = piece.triangleColor;

    // Left triangle
    ctx.beginPath();
    ctx.moveTo(...coord(0, 0));
    ctx.lineTo(...coord(1.01, 0));
    ctx.lineTo(...coord(1.01, 1));
    ctx.closePath();
    ctx.fill();

    // Top triangle
    ctx.beginPath();
    ctx.moveTo(...coord(0.99, 1));
    ctx.lineTo(...coord(2.01, 1));
    ctx.lineTo(...coord(1.5, 1.5));
    ctx.closePath();
    ctx.fill();

    // Right triangle
    ctx.beginPath();
    ctx.moveTo(...coord(1.99, 0));
    ctx.lineTo(...coord(1.99, 1));
    ctx.lineTo(...coord(2.5, 0.5));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Logs debug information
   */
  private logDebugInfo(
    gameAreaOffsetX: number, 
    gameAreaOffsetY: number, 
    mirrorLineX: number, 
    playerPieces: any[]
  ): void {
    console.log('🎯 TARJETA DE RETO DEBUG:');
    console.log(`Card area: ${this.config.cardWidth}x${this.config.cardHeight}`);
    console.log(`Game scale: ${this.config.scale.toFixed(3)}`);
    console.log(`Mirror line X: ${mirrorLineX.toFixed(1)}`);
    console.log(`Game offset: (${gameAreaOffsetX}, ${gameAreaOffsetY})`);
    console.log(`Pieces count: ${playerPieces.length}`);
    console.log(`Card offset: (${this.config.cardLeft}, ${this.config.cardTop})`);
  }

  /**
   * Logs piece debug information
   */
  private logPieceDebugInfo(
    displayPiece: Piece, 
    reflectedPiece: Piece, 
    index: number, 
    pieceSize: number, 
    scale: number
  ): void {
    console.log(`🧩 Piece ${index + 1}:`);
    console.log(`  Original: x=${displayPiece.x.toFixed(1)}, y=${displayPiece.y.toFixed(1)}`);
    console.log(`  Reflected: x=${reflectedPiece.x.toFixed(1)}, y=${reflectedPiece.y.toFixed(1)}`);
    console.log(`  Gap between pieces: ${Math.abs(reflectedPiece.x - (displayPiece.x + pieceSize * scale)).toFixed(1)}px`);
  }

  /**
   * Draws debug overlays
   */
  private drawDebugOverlays(
    ctx: CanvasRenderingContext2D,
    gameAreaOffsetX: number,
    gameAreaOffsetY: number,
    mirrorLineX: number,
    cardLeft: number,
    cardTop: number,
    cardWidth: number,
    cardHeight: number
  ): void {
    const { gameAreaWidth, gameAreaHeight, scale } = this.config;
    
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`TARJETA DEBUG:`, cardLeft, cardTop - 10);
    ctx.fillText(`Card area: ${cardWidth}x${cardHeight}`, cardLeft, cardTop + 10);
    ctx.fillText(`Game scale: ${scale.toFixed(3)}`, cardLeft, cardTop + 25);
    ctx.fillText(`Mirror line X: ${mirrorLineX.toFixed(1)}`, cardLeft, cardTop + 40);
    ctx.fillText(`Game offset: (${gameAreaOffsetX}, ${gameAreaOffsetY})`, cardLeft, cardTop + 55);

    // Mark card boundaries
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(cardLeft, cardTop, cardWidth, cardHeight);

    // Mark scaled game area
    ctx.strokeStyle = '#0000ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(gameAreaOffsetX, gameAreaOffsetY, gameAreaWidth * scale, gameAreaHeight * scale);
  }
}