import { Piece, drawPiece } from '../components/GamePiece';
import { Challenge } from '../components/ChallengeCard';
import { GameGeometry } from '../utils/GameGeometry';

/**
 * Configuración de área de canvas
 */
export interface CanvasAreaConfig {
  gameAreaWidth: number;
  gameAreaHeight: number;
  bottomAreaHeight: number;
  mirrorLine: number;
  pieceSize: number;
  frameWidth: number;
}

/**
 * Configuración de colores y estilos
 */
export interface RenderingTheme {
  gameAreaGradient: [string, string];
  mirrorAreaGradient: [string, string, string, string];
  availableAreaColor: string;
  objectiveAreaColor: string;
  frameColor: string;
  frameInnerColor: string;
  textColor: string;
  subtitleColor: string;
}

/**
 * Servicio de rendering que maneja todo el dibujo del canvas
 * Aplica el principio de Single Responsibility para rendering
 */
export class RenderingService {
  private config: CanvasAreaConfig;
  private theme: RenderingTheme;

  constructor(
    private geometry: GameGeometry,
    config?: Partial<CanvasAreaConfig>,
    theme?: Partial<RenderingTheme>
  ) {
    this.config = {
      gameAreaWidth: 700,
      gameAreaHeight: 600,
      bottomAreaHeight: 400,
      mirrorLine: 700,
      pieceSize: 100,
      frameWidth: 15,
      ...config
    };

    this.theme = {
      gameAreaGradient: ['#f8fafc', '#e2e8f0'],
      mirrorAreaGradient: ['#e2e8f0', '#f1f5f9', '#f1f5f9', '#cbd5e1'],
      availableAreaColor: '#f1f5f9',
      objectiveAreaColor: '#fefefe',
      frameColor: '#8b5a3c',
      frameInnerColor: '#d4af37',
      textColor: '#1e293b',
      subtitleColor: '#64748b',
      ...theme
    };
  }

  /**
   * Dibuja todas las áreas de fondo
   */
  drawBackgroundAreas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    this.drawGameArea(ctx);
    this.drawMirrorArea(ctx);
    this.drawAvailableArea(ctx);
    this.drawObjectiveArea(ctx);
  }

  /**
   * Dibuja el marco del espejo y divisiones
   */
  drawMirrorFrameAndDivisions(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    this.drawOuterFrame(ctx, canvas);
    this.drawInnerFrame(ctx, canvas);
    this.drawDividers(ctx, canvas);
    this.drawShadowEffects(ctx, canvas);
  }

  /**
   * Dibuja las etiquetas de las áreas
   */
  drawAreaLabels(ctx: CanvasRenderingContext2D): void {
    const { frameWidth } = this.config;

    // Configurar estilo de texto
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = this.theme.textColor;

    // Etiquetas principales
    ctx.fillText('🎮 ÁREA DE JUEGO', frameWidth + 15, frameWidth + 25);
    ctx.fillText('🪞 ESPEJO', this.config.mirrorLine + 15, frameWidth + 25);
    ctx.fillText('🧩 PIEZAS DISPONIBLES', frameWidth + 15, this.config.gameAreaHeight + 25);
    ctx.fillText('🎯 OBJETIVO', this.config.mirrorLine + 15, this.config.gameAreaHeight + 25);

    // Subtítulos descriptivos
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = this.theme.subtitleColor;
    ctx.fillText('Arrastra aquí tus piezas', frameWidth + 15, frameWidth + 45);
    ctx.fillText('Reflejo automático', this.config.mirrorLine + 15, frameWidth + 45);
    ctx.fillText('Haz clic para rotar/voltear', frameWidth + 15, this.config.gameAreaHeight + 45);
    ctx.fillText('Patrón a conseguir', this.config.mirrorLine + 15, this.config.gameAreaHeight + 45);
  }

  /**
   * Dibuja las piezas interactivas
   */
  drawInteractivePieces(ctx: CanvasRenderingContext2D, pieces: Piece[]): void {
    if (!pieces || pieces.length === 0) return;

    pieces.forEach(piece => {
      if (piece) {
        drawPiece(ctx, piece, piece.x, piece.y, this.config.pieceSize);
      }
    });
  }

  /**
   * Dibuja los reflejos de las piezas en el espejo
   */
  drawMirrorReflections(ctx: CanvasRenderingContext2D, pieces: Piece[]): void {
    ctx.save();
    
    // Recortar el área del espejo
    ctx.beginPath();
    ctx.rect(this.config.mirrorLine, 0, this.config.gameAreaWidth, this.config.gameAreaHeight);
    ctx.clip();

    if (pieces && pieces.length > 0) {
      pieces.forEach(piece => {
        if (!piece) return;

        // Solo reflejar piezas que están en el área de juego o entrando desde abajo
        const entryMargin = 60;
        const pieceBottomWithMargin = piece.y + this.config.pieceSize + entryMargin;
        const isEnteringFromBelow = pieceBottomWithMargin > this.config.gameAreaHeight;
        const isInsideGameArea = piece.y < this.config.gameAreaHeight;

        if (isEnteringFromBelow || isInsideGameArea) {
          ctx.save();

          // Transformación para el reflejo
          const reflectedX = 2 * this.config.mirrorLine - piece.x - this.config.pieceSize;
          ctx.translate(reflectedX + this.config.pieceSize, piece.y);
          ctx.scale(-1, 1);

          // Crear pieza con ligera transparencia para efecto espejo
          const mirrorPiece = { 
            ...piece, 
            centerColor: piece.centerColor + 'E6', // 90% opacidad
            triangleColor: piece.triangleColor + 'E6'
          };

          drawPiece(ctx, mirrorPiece, 0, 0, this.config.pieceSize);
          ctx.restore();
        }
      });
    }

    this.drawMirrorDistortionEffect(ctx);
    ctx.restore();
  }

  /**
   * Dibuja una challenge card completa
   */
  drawChallengeCard(
    ctx: CanvasRenderingContext2D, 
    challenge: Challenge | null,
    validationResult?: any
  ): void {
    const cardDimensions = this.calculateCardDimensions();
    
    this.drawCardFrame(ctx, cardDimensions);
    
    if (!challenge) {
      this.drawLoadingMessage(ctx, cardDimensions);
      return;
    }

    this.drawCardTitle(ctx, challenge, cardDimensions);
    
    if (validationResult && !validationResult.isValid) {
      this.drawInvalidChallengeMessage(ctx, validationResult, cardDimensions);
    } else {
      this.drawObjectivePieces(ctx, challenge, cardDimensions);
    }
  }

  /**
   * Dibuja una pieza sin bordes (versión limpia)
   */
  drawPieceClean(
    ctx: CanvasRenderingContext2D, 
    piece: Piece & { isReflected?: boolean }, 
    x: number, 
    y: number, 
    size: number = 100
  ): void {
    ctx.save();

    // Desactivar antialiasing para evitar bordes blancos
    ctx.imageSmoothingEnabled = false;

    ctx.translate(x + size/2, y + size/2);
    ctx.rotate((piece.rotation * Math.PI) / 180);

    // Aplicar escala horizontal invertida para piezas tipo B
    if (piece.type === 'B') {
      ctx.scale(-1, 1);
    }

    const unit = size * 1.28;
    const coord = (coordX: number, coordY: number): [number, number] => [
      Math.round(coordX * unit), 
      Math.round(-coordY * unit)
    ];

    // Configurar para evitar bordes
    ctx.lineWidth = 0;
    ctx.strokeStyle = 'transparent';

    // Dibujar cuadrado central
    ctx.fillStyle = piece.centerColor;
    ctx.beginPath();
    ctx.moveTo(...coord(1, 0));
    ctx.lineTo(...coord(2, 0));
    ctx.lineTo(...coord(2, 1));
    ctx.lineTo(...coord(1, 1));
    ctx.closePath();
    ctx.fill();

    // Dibujar triángulos
    ctx.fillStyle = piece.triangleColor;

    // Triángulo izquierdo
    ctx.beginPath();
    ctx.moveTo(...coord(0, 0));
    ctx.lineTo(...coord(1.01, 0)); // Ligera extensión para evitar gaps
    ctx.lineTo(...coord(1.01, 1));
    ctx.closePath();
    ctx.fill();

    // Triángulo superior
    ctx.beginPath();
    ctx.moveTo(...coord(0.99, 1));
    ctx.lineTo(...coord(2.01, 1));
    ctx.lineTo(...coord(1.5, 1.5));
    ctx.closePath();
    ctx.fill();

    // Triángulo derecho
    ctx.beginPath();
    ctx.moveTo(...coord(1.99, 0));
    ctx.lineTo(...coord(1.99, 1));
    ctx.lineTo(...coord(2.5, 0.5));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Métodos privados para organizar el código

  private drawGameArea(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, this.config.gameAreaWidth, 0);
    gradient.addColorStop(0, this.theme.gameAreaGradient[0]);
    gradient.addColorStop(1, this.theme.gameAreaGradient[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.config.gameAreaWidth, this.config.gameAreaHeight);
  }

  private drawMirrorArea(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(
      this.config.mirrorLine, 0, 
      this.config.mirrorLine + this.config.gameAreaWidth, 0
    );
    gradient.addColorStop(0, this.theme.mirrorAreaGradient[0]);
    gradient.addColorStop(0.1, this.theme.mirrorAreaGradient[1]);
    gradient.addColorStop(0.9, this.theme.mirrorAreaGradient[2]);
    gradient.addColorStop(1, this.theme.mirrorAreaGradient[3]);
    ctx.fillStyle = gradient;
    ctx.fillRect(this.config.mirrorLine, 0, this.config.gameAreaWidth, this.config.gameAreaHeight);
  }

  private drawAvailableArea(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.theme.availableAreaColor;
    ctx.fillRect(0, this.config.gameAreaHeight, this.config.gameAreaWidth, this.config.bottomAreaHeight);
  }

  private drawObjectiveArea(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.theme.objectiveAreaColor;
    ctx.fillRect(this.config.mirrorLine, this.config.gameAreaHeight, this.config.gameAreaWidth, this.config.bottomAreaHeight);
  }

  private drawOuterFrame(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    const { frameWidth } = this.config;
    ctx.fillStyle = this.theme.frameColor;
    
    // Top, Bottom, Left, Right
    ctx.fillRect(0, 0, canvas.width, frameWidth);
    ctx.fillRect(0, canvas.height - frameWidth, canvas.width, frameWidth);
    ctx.fillRect(0, 0, frameWidth, canvas.height);
    ctx.fillRect(canvas.width - frameWidth, 0, frameWidth, canvas.height);
  }

  private drawInnerFrame(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    const { frameWidth } = this.config;
    const innerFrame = 5;
    ctx.fillStyle = this.theme.frameInnerColor;
    
    // Top, Bottom, Left, Right inner frames
    ctx.fillRect(innerFrame, innerFrame, canvas.width - innerFrame * 2, frameWidth - innerFrame);
    ctx.fillRect(innerFrame, canvas.height - frameWidth, canvas.width - innerFrame * 2, frameWidth - innerFrame);
    ctx.fillRect(innerFrame, innerFrame, frameWidth - innerFrame, canvas.height - innerFrame * 2);
    ctx.fillRect(canvas.width - frameWidth, innerFrame, frameWidth - innerFrame, canvas.height - innerFrame * 2);
  }

  private drawDividers(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    const { frameWidth, mirrorLine, gameAreaHeight } = this.config;
    
    ctx.strokeStyle = '#cbd5e1';
    
    // Línea divisoria central
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mirrorLine, frameWidth);
    ctx.lineTo(mirrorLine, gameAreaHeight);
    ctx.stroke();

    // Divisoria horizontal
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(frameWidth, gameAreaHeight);
    ctx.lineTo(canvas.width - frameWidth, gameAreaHeight);
    ctx.stroke();

    // Divisoria vertical inferior
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mirrorLine, gameAreaHeight);
    ctx.lineTo(mirrorLine, canvas.height - frameWidth);
    ctx.stroke();
  }

  private drawShadowEffects(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    const { frameWidth, gameAreaHeight } = this.config;
    
    const shadowGradient = ctx.createLinearGradient(0, gameAreaHeight, 0, gameAreaHeight + 10);
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGradient;
    ctx.fillRect(frameWidth, gameAreaHeight, canvas.width - frameWidth * 2, 10);
  }

  private drawMirrorDistortionEffect(ctx: CanvasRenderingContext2D): void {
    const distortionGradient = ctx.createLinearGradient(
      this.config.mirrorLine, 0, 
      this.config.mirrorLine + this.config.gameAreaWidth, 0
    );
    distortionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    distortionGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
    distortionGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
    distortionGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    ctx.fillStyle = distortionGradient;
    ctx.fillRect(this.config.mirrorLine, 0, this.config.gameAreaWidth, this.config.gameAreaHeight);
  }

  private calculateCardDimensions() {
    const cardLeft = this.config.mirrorLine + 50;
    const cardTop = this.config.gameAreaHeight + 50;
    const cardWidth = this.config.gameAreaWidth - 100;
    const cardHeight = this.config.bottomAreaHeight - 100;
    const contentTop = cardTop + 40;
    const contentHeight = cardHeight - 40;

    return {
      cardLeft,
      cardTop,
      cardWidth,
      cardHeight,
      contentTop,
      contentHeight
    };
  }

  private drawCardFrame(ctx: CanvasRenderingContext2D, dimensions: any): void {
    const { cardLeft, cardTop, cardWidth, cardHeight } = dimensions;
    
    // Fondo de la tarjeta
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cardLeft, cardTop, cardWidth, cardHeight);

    // Borde exterior de la tarjeta
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4;
    ctx.strokeRect(cardLeft, cardTop, cardWidth, cardHeight);
  }

  private drawCardTitle(ctx: CanvasRenderingContext2D, challenge: Challenge, dimensions: any): void {
    const centerX = this.config.mirrorLine + this.config.gameAreaWidth / 2;
    
    // Título de la tarjeta
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CHALLENGE CARD', centerX, this.config.gameAreaHeight + 75);

    // Número del desafío
    ctx.font = 'bold 20px Arial';
    if (challenge.id !== undefined) {
      ctx.fillText(`#${challenge.id}`, centerX, this.config.gameAreaHeight + 95);
    }
  }

  private drawLoadingMessage(ctx: CanvasRenderingContext2D, dimensions: any): void {
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Loading challenges...', 
      this.config.mirrorLine + this.config.gameAreaWidth / 2, 
      this.config.gameAreaHeight + this.config.bottomAreaHeight / 2
    );
  }

  private drawInvalidChallengeMessage(ctx: CanvasRenderingContext2D, validation: any, dimensions: any): void {
    const centerX = this.config.mirrorLine + this.config.gameAreaWidth / 2;
    const centerY = this.config.gameAreaHeight + this.config.bottomAreaHeight / 2;
    
    // Fondo rojo
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(dimensions.cardLeft, dimensions.cardTop, dimensions.cardWidth, dimensions.cardHeight);

    // Texto "INVALID"
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('INVALID', centerX, centerY);

    // Detalles de invalidez
    ctx.font = '14px Arial';
    let yPos = centerY + 30;

    if (!validation.touchesMirror) {
      ctx.fillText('No piece touches the mirror', centerX, yPos);
      yPos += 20;
    }

    if (validation.hasPieceOverlaps) {
      ctx.fillText('Pieces overlap', centerX, yPos);
      yPos += 20;
    }

    if (validation.entersMirror) {
      ctx.fillText('Piece enters mirror area', centerX, yPos);
      yPos += 20;
    }

    if (!validation.piecesConnected) {
      ctx.fillText('Pieces must form a continuous figure', centerX, yPos);
      yPos += 20;
    }

    if (!validation.piecesInArea) {
      ctx.fillText('Pieces must fit within challenge area', centerX, yPos);
    }
  }

  private drawObjectivePieces(ctx: CanvasRenderingContext2D, challenge: Challenge, dimensions: any): void {
    // Verificar que el challenge y sus propiedades existan
    if (!challenge || !challenge.objective || !challenge.objective.playerPieces) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Challenge data not available', 
        this.config.mirrorLine + this.config.gameAreaWidth / 2, 
        dimensions.contentTop + 50
      );
      return;
    }

    const playerPieces = challenge.objective.playerPieces;
    const { contentTop, contentHeight } = dimensions;

    // Configuración de área y escala
    const cardAreaWidth = this.config.gameAreaWidth - 120;
    const cardAreaHeight = contentHeight - 60;
    const maxScale = 0.3;

    const cardOffsetX = this.config.mirrorLine + 60;
    const cardOffsetY = contentTop + 30;

    // Calcular límites del patrón
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    playerPieces.forEach(piecePos => {
      minX = Math.min(minX, piecePos.x);
      maxX = Math.max(maxX, piecePos.x + this.config.pieceSize);
      minY = Math.min(minY, piecePos.y);
      maxY = Math.max(maxY, piecePos.y + this.config.pieceSize);
    });

    const playerPatternWidth = maxX - minX;
    const playerPatternHeight = maxY - minY;

    // Calcular escala
    const scaleX = (cardAreaWidth / 2) / playerPatternWidth;
    const scaleY = cardAreaHeight / playerPatternHeight;
    const scale = Math.min(scaleX, scaleY, maxScale);

    // Dibujar línea divisoria para simular el espejo
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    const mirrorLineX = cardOffsetX + (cardAreaWidth / 2);
    ctx.beginPath();
    ctx.moveTo(mirrorLineX, cardOffsetY);
    ctx.lineTo(mirrorLineX, cardOffsetY + cardAreaHeight);
    ctx.stroke();
    ctx.restore();

    // Dibujar piezas escaladas
    this.drawScaledPieces(ctx, playerPieces, {
      scale,
      minX,
      minY,
      cardOffsetX,
      cardOffsetY,
      cardAreaWidth,
      cardAreaHeight,
      mirrorLineX
    });
  }

  private drawScaledPieces(ctx: CanvasRenderingContext2D, playerPieces: any[], config: any): void {
    const { scale, minX, minY, cardOffsetX, cardOffsetY, cardAreaWidth, cardAreaHeight, mirrorLineX } = config;

    // Calcular posiciones escaladas
    const scaledPlayerPieces = playerPieces.map(piecePos => ({
      ...piecePos,
      x: (piecePos.x - minX) * scale,
      y: (piecePos.y - minY) * scale
    }));

    // Posicionamiento
    const scaledPatternWidth = (this.config.gameAreaWidth - 120) * scale;
    const scaledPatternHeight = (cardAreaHeight - 60) * scale;

    const playerAreaCenterX = cardOffsetX + (cardAreaWidth / 4);
    const playerAreaCenterY = cardOffsetY + (cardAreaHeight / 2);
    
    const playerOffsetX = playerAreaCenterX - (scaledPatternWidth / 2);
    const playerOffsetY = playerAreaCenterY - (scaledPatternHeight / 2);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    scaledPlayerPieces.forEach((piecePos, index) => {
      // Crear pieza visual
      const displayPiece = {
        id: 1000 + index,
        type: piecePos.type,
        face: piecePos.face,
        centerColor: piecePos.type === 'A' ? 
          (piecePos.face === 'front' ? '#FFD700' : '#FF4444') : 
          (piecePos.face === 'front' ? '#FF4444' : '#FFD700'),
        triangleColor: piecePos.type === 'A' ? 
          (piecePos.face === 'front' ? '#FF4444' : '#FFD700') : 
          (piecePos.face === 'front' ? '#FFD700' : '#FF4444'),
        x: playerOffsetX + piecePos.x,
        y: playerOffsetY + piecePos.y,
        rotation: piecePos.rotation,
        placed: true
      };

      // Dibujar la pieza del jugador
      this.drawPieceClean(ctx, displayPiece, displayPiece.x, displayPiece.y, this.config.pieceSize * scale);

      // Calcular y dibujar la pieza reflejada
      const reflectedX = mirrorLineX + (mirrorLineX - displayPiece.x - this.config.pieceSize * scale);
      const reflectedPiece = { ...displayPiece, x: reflectedX, y: displayPiece.y };

      ctx.save();
      ctx.translate(reflectedPiece.x + (this.config.pieceSize * scale)/2, reflectedPiece.y + (this.config.pieceSize * scale)/2);
      ctx.scale(-1, 1);
      ctx.translate(-(this.config.pieceSize * scale)/2, -(this.config.pieceSize * scale)/2);
      this.drawPieceClean(ctx, reflectedPiece, 0, 0, this.config.pieceSize * scale);
      ctx.restore();
    });

    ctx.restore();
  }
}