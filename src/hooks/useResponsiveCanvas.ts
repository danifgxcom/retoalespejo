/**
 * Hook para manejar canvas responsive con coordenadas relativas
 */

import { useState, useEffect, useCallback, RefObject } from 'react';
import { ResponsiveCanvas, RelativeCoordinate, AbsoluteCoordinate } from '../utils/rendering/ResponsiveCanvas';
import { RelativePiecePositions, RelativePiecePosition } from '../utils/geometry/RelativePiecePositions';

interface UseResponsiveCanvasProps {
  canvasRef: RefObject<{ getCanvas: () => HTMLCanvasElement | null }>;
}

export const useResponsiveCanvas = ({ canvasRef }: UseResponsiveCanvasProps) => {
  const [responsiveCanvas, setResponsiveCanvas] = useState<ResponsiveCanvas | null>(null);
  const [piecePositions] = useState(() => new RelativePiecePositions());

  // Actualizar dimensiones del canvas cuando cambie el tamaño
  const updateCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const newResponsiveCanvas = new ResponsiveCanvas(rect.width, rect.height);
    setResponsiveCanvas(newResponsiveCanvas);
  }, [canvasRef]);

  // Escuchar cambios de tamaño de ventana
  useEffect(() => {
    updateCanvasDimensions();
    
    const handleResize = () => {
      updateCanvasDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasDimensions]);

  // Convertir coordenadas relativas a absolutas actuales
  const relativeToAbsolute = useCallback((relative: RelativeCoordinate): AbsoluteCoordinate => {
    if (!responsiveCanvas) return { x: 0, y: 0 };
    return responsiveCanvas.relativeToAbsolute(relative);
  }, [responsiveCanvas]);

  // Convertir coordenadas absolutas a relativas
  const absoluteToRelative = useCallback((absolute: AbsoluteCoordinate): RelativeCoordinate => {
    if (!responsiveCanvas) return { x: 0, y: 0 };
    return responsiveCanvas.absoluteToRelative(absolute);
  }, [responsiveCanvas]);

  // Obtener tamaño escalado
  const getScaledSize = useCallback((baseSize: number): number => {
    if (!responsiveCanvas) return baseSize;
    return responsiveCanvas.scaleSize(baseSize);
  }, [responsiveCanvas]);

  // Obtener posiciones de piezas escaladas para renderizado
  const getScaledPiecePositions = useCallback((count: number) => {
    if (!responsiveCanvas) return [];
    
    const relativePositions = piecePositions.getPositionsForPieceCount(count);
    
    return relativePositions.map(relPos => {
      const absolute = responsiveCanvas.relativeToAbsolute({ 
        x: relPos.x, 
        y: relPos.y 
      });
      
      return {
        x: absolute.x,
        y: absolute.y,
        rotation: relPos.rotation,
        size: responsiveCanvas.scaleSize(100) // Tamaño base de pieza
      };
    });
  }, [responsiveCanvas, piecePositions]);

  // Obtener áreas del juego escaladas
  const getScaledGameAreas = useCallback(() => {
    if (!responsiveCanvas) return null;
    
    const areas = responsiveCanvas.getGameAreas();
    const dimensions = responsiveCanvas.getDimensions();
    
    return {
      gameArea: {
        x: areas.gameArea.x * dimensions.width,
        y: areas.gameArea.y * dimensions.height,
        width: areas.gameArea.width * dimensions.width,
        height: areas.gameArea.height * dimensions.height
      },
      mirrorArea: {
        x: areas.mirrorArea.x * dimensions.width,
        y: areas.mirrorArea.y * dimensions.height,
        width: areas.mirrorArea.width * dimensions.width,
        height: areas.mirrorArea.height * dimensions.height
      },
      piecesArea: {
        x: areas.piecesArea.x * dimensions.width,
        y: areas.piecesArea.y * dimensions.height,
        width: areas.piecesArea.width * dimensions.width,
        height: areas.piecesArea.height * dimensions.height
      },
      objectiveArea: {
        x: areas.objectiveArea.x * dimensions.width,
        y: areas.objectiveArea.y * dimensions.height,
        width: areas.objectiveArea.width * dimensions.width,
        height: areas.objectiveArea.height * dimensions.height
      },
      mirrorLine: {
        x: areas.mirrorLine.x * dimensions.width,
        y: areas.mirrorLine.y * dimensions.height,
        height: areas.mirrorLine.height * dimensions.height
      }
    };
  }, [responsiveCanvas]);

  return {
    responsiveCanvas,
    piecePositions,
    relativeToAbsolute,
    absoluteToRelative,
    getScaledSize,
    getScaledPiecePositions,
    getScaledGameAreas,
    isReady: !!responsiveCanvas
  };
};