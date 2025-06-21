import React, { useState, useRef, useEffect } from 'react';
import { Save, RotateCw, FlipHorizontal, Plus, Trash2, Check, X, Edit } from 'lucide-react';
import { Piece } from './GamePiece';
import { Challenge, PiecePosition } from './ChallengeCard';
import { GameGeometry } from '../utils/GameGeometry.ts';
import EditorCanvas, { EditorCanvasRef } from './EditorCanvas';
import { useMouseHandlers } from '../hooks/useMouseHandlers';

interface ChallengeEditorProps {
  onSave?: (challenge: Challenge) => void;
  onClose?: () => void;
  existingChallenges?: Challenge[];
  initialChallenge?: Challenge;
}

export const ChallengeEditor: React.FC<ChallengeEditorProps> = ({
  onSave,
  onClose,
  existingChallenges = [],
  initialChallenge
}) => {
  const canvasRef = useRef<EditorCanvasRef>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<Piece | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(initialChallenge || null);
  const [isEditing, setIsEditing] = useState(!!initialChallenge);
  
  // Challenge metadata
  const [challengeName, setChallengeName] = useState(initialChallenge?.name || '');
  const [challengeDescription, setChallengeDescription] = useState(initialChallenge?.description || '');
  const [challengeDifficulty, setChallengeDifficulty] = useState<string>(initialChallenge?.difficulty || 'Fácil');
  const [validationResult, setValidationResult] = useState<any>(null);

  // Geometry configuration
  const geometry = new GameGeometry({
    width: 700,
    height: 600,
    mirrorLineX: 700,
    pieceSize: 100
  });


  // Helper para verificar hit de pieza (EXACTAMENTE como en useGameLogic)
  const isPieceHit = (piece: Piece, x: number, y: number): boolean => {
    const size = 100; // Tamaño base de la pieza (25% más grande)
    const unit = size * 1.28; // Factor de escala

    // La pieza se dibuja con translate(x + size/2, y + size/2) y luego rotate
    // Necesitamos hacer la transformación inversa
    const pieceDrawCenterX = piece.x + size/2;
    const pieceDrawCenterY = piece.y + size/2;

    // Traducir el punto al origen de la pieza
    let translatedX = x - pieceDrawCenterX;
    const translatedY = y - pieceDrawCenterY;

    // Rotar en sentido contrario para "desrotar" el punto
    const rad = (-piece.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rotatedX = translatedX * cos - translatedY * sin;
    const rotatedY = translatedX * sin + translatedY * cos;

    // Si es pieza tipo B, compensar el volteo horizontal que se aplica en el dibujo
    let finalRotatedX = rotatedX;
    if (piece.type === 'B') {
      finalRotatedX = -rotatedX;
    }

    // Convertir a coordenadas unitarias de la pieza (el sistema coord(x,y))
    const unitX = finalRotatedX / unit;
    const unitY = -rotatedY / unit; // Invertir Y porque el canvas Y+ es hacia abajo

    // Función para verificar si un punto está dentro de un triángulo
    const isPointInTriangle = (px: number, py: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): boolean => {
      const denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
      const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denom;
      const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denom;
      const c = 1 - a - b;
      return a >= 0 && b >= 0 && c >= 0;
    };

    // Verificar si está en el cuadrado central (1,0), (2,0), (2,1), (1,1)
    const inSquare = unitX >= 1 && unitX <= 2 && unitY >= 0 && unitY <= 1;

    // Verificar si está en el triángulo izquierdo (0,0), (1,0), (1,1)
    const inLeftTriangle = isPointInTriangle(unitX, unitY, 0, 0, 1, 0, 1, 1);

    // Verificar si está en el triángulo superior (1,1), (2,1), (1.5,1.5)
    const inTopTriangle = isPointInTriangle(unitX, unitY, 1, 1, 2, 1, 1.5, 1.5);

    // Verificar si está en el triángulo derecho (2,0), (2,1), (2.5,0.5)
    const inRightTriangle = isPointInTriangle(unitX, unitY, 2, 0, 2, 1, 2.5, 0.5);

    return inSquare || inLeftTriangle || inTopTriangle || inRightTriangle;
  };

  // Rotation functions - exactly like in useGameLogic (defined before useMouseHandlers)
  // Note: useMouseHandlers expects rotatePiece to take an ID
  const rotatePieceById = (pieceId: number) => {
    setPieces(pieces.map(p =>
      p.id === pieceId
        ? { ...p, rotation: (p.rotation + 45) % 360 }
        : p
    ));
  };

  const rotatePiece = (piece: Piece) => {
    setPieces(pieces.map(p =>
      p.id === piece.id
        ? { ...p, rotation: (p.rotation + 45) % 360 }
        : p
    ));
  };

  const rotatePieceCounterClockwise = (piece: Piece) => {
    setPieces(pieces.map(p =>
      p.id === piece.id
        ? { ...p, rotation: (p.rotation - 45 + 360) % 360 }
        : p
    ));
  };

  // Mouse handlers usando exactamente el mismo hook que el juego
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
  } = useMouseHandlers({
    pieces,
    draggedPiece,
    dragOffset,
    setPieces,
    setDraggedPiece,
    setDragOffset,
    isPieceHit,
    canvasRef,
    rotatePiece: rotatePieceById,
    geometry,
  });

  // Initialize pieces from existing challenge
  useEffect(() => {
    if (selectedChallenge) {
      const loadedPieces: Piece[] = selectedChallenge.objective.playerPieces.map((piecePos, index) => ({
        id: index + 1,
        type: piecePos.type,
        face: piecePos.face,
        centerColor: piecePos.face === 'front' ? '#FFD700' : '#FF6B6B',
        triangleColor: piecePos.face === 'front' ? '#FF6B6B' : '#FFD700',
        x: piecePos.x,
        y: piecePos.y,
        rotation: piecePos.rotation,
        placed: true
      }));
      setPieces(loadedPieces);
      setChallengeName(selectedChallenge.name);
      setChallengeDescription(selectedChallenge.description);
      setChallengeDifficulty(selectedChallenge.difficulty);
    }
  }, [selectedChallenge]);

  // Add new piece
  const addPiece = (type: 'A' | 'B') => {
    const newPiece: Piece = {
      id: pieces.length + 1,
      type,
      face: 'front',
      centerColor: '#FFD700', // Yellow for front face
      triangleColor: '#FF6B6B', // Red for front face
      x: 50 + (pieces.length * 120) % 500,
      y: 650,
      rotation: 0,
      placed: false
    };
    setPieces(prev => [...prev, newPiece]);
  };

  // Delete piece
  const deletePiece = (piece: Piece) => {
    setPieces(prev => prev.filter(p => p.id !== piece.id));
  };

  // Flip piece face
  const flipPiece = (piece: Piece) => {
    setPieces(prev => prev.map(p => 
      p.id === piece.id ? { 
        ...p, 
        face: p.face === 'front' ? 'back' : 'front',
        centerColor: p.face === 'front' ? '#FF6B6B' : '#FFD700',
        triangleColor: p.face === 'front' ? '#FFD700' : '#FF6B6B'
      } : p
    ));
  };

  // Validate challenge
  const validateChallenge = () => {
    const piecesInGameArea = pieces.filter(p => p.placed && p.y < 600);
    const piecePositions: PiecePosition[] = piecesInGameArea.map(p => ({
      type: p.type,
      face: p.face,
      x: Math.round(p.x * 100) / 100, // Redondear a 2 decimales
      y: Math.round(p.y * 100) / 100,
      rotation: p.rotation % 360 // Normalizar rotación
    }));

    console.log('Validating pieces:', piecePositions);
    const result = geometry.validateChallengeCard(piecePositions);
    console.log('Validation result:', result);
    
    // Debug the area validation specifically
    if (!result.piecesInArea) {
      console.log('🔍 DEBUGGING AREA VALIDATION:');
      piecePositions.forEach((piece, index) => {
        const bbox = geometry.getPieceBoundingBox(piece);
        const isInGameArea = geometry.isPiecePositionInGameArea(piece);
        const reflectedPiece = geometry.reflectPieceAcrossMirror(piece);
        const reflectedBbox = geometry.getPieceBoundingBox(reflectedPiece);
        
        console.log(`  Piece ${index + 1}:`);
        console.log(`    Original bbox: left=${bbox.left}, right=${bbox.right}, top=${bbox.top}, bottom=${bbox.bottom}`);
        console.log(`    Is in game area: ${isInGameArea}`);
        console.log(`    Reflected bbox: left=${reflectedBbox.left}, right=${reflectedBbox.right}, top=${reflectedBbox.top}, bottom=${reflectedBbox.bottom}`);
        console.log(`    Game area limits: 0 <= x <= ${geometry.getConfig().mirrorLineX}, 0 <= y <= ${geometry.getConfig().height}`);
        console.log(`    Mirror area limits: ${geometry.getConfig().mirrorLineX} <= x <= ${2 * geometry.getConfig().mirrorLineX}, 0 <= y <= ${geometry.getConfig().height}`);
      });
    }
    
    // Debug reflection overlap
    if (result.hasReflectionOverlaps) {
      piecePositions.forEach(piece => {
        const reflectedPiece = geometry.reflectPieceAcrossMirror(piece);
        console.log('Original piece:', piece);
        console.log('Reflected piece:', reflectedPiece);
        console.log('Overlap detected:', geometry.doPiecesOverlap(piece, reflectedPiece));
      });
    }
    setValidationResult(result);
    return result;
  };

  // Auto-position pieces to touch mirror correctly
  const autoPositionPiecesToMirror = () => {
    const piecesInGameArea = pieces.filter(p => p.placed && p.y < 600);
    
    if (piecesInGameArea.length === 0) {
      alert('No hay piezas en el área de juego para posicionar.');
      return;
    }

    const updatedPieces = pieces.map(piece => {
      if (piece.placed && piece.y < 600) {
        console.log(`\n=== Auto-positioning piece ${piece.id} (type: ${piece.type}, rotation: ${piece.rotation}) ===`);
        console.log(`Original position: x=${piece.x}, y=${piece.y}`);
        
        // Find a position that touches mirror but doesn't overlap with reflection
        let bestX = piece.x;
        const mirrorLine = 700;
        const pieceSize = 100;
        
        // Get the bounding box at current position to understand the piece size
        const currentBbox = geometry.getPieceBoundingBox({
          type: piece.type,
          face: piece.face,
          x: piece.x,
          y: piece.y,
          rotation: piece.rotation
        });
        console.log(`Current bbox: left=${currentBbox.left}, right=${currentBbox.right}, width=${currentBbox.right - currentBbox.left}`);
        
        // Start from a position that's more likely to work - closer to mirror
        const startX = mirrorLine - (currentBbox.right - currentBbox.left) - 10; // Start with piece width + small margin
        console.log(`Starting search at x=${startX}, searching until x=${mirrorLine + 5}`); // Allow slight overlap with mirror
        
        let foundValidPosition = false;
        
        for (let testX = startX; testX <= mirrorLine; testX += 0.1) { // Finer granularity and allow exact mirror position
          const testPiece = { 
            type: piece.type, 
            face: piece.face, 
            x: testX, 
            y: piece.y, 
            rotation: piece.rotation 
          };
          
          // Get bounding box for this test position
          const testBbox = geometry.getPieceBoundingBox(testPiece);
          const touchesMirror = geometry.isPieceTouchingMirror(testPiece);
          const distanceToMirror = Math.abs(testBbox.right - mirrorLine);
          
          if (Math.abs(testX % 1) < 0.05) { // Log every 1 pixel for readability
            console.log(`  Testing x=${testX.toFixed(1)}: bbox.right=${testBbox.right.toFixed(1)}, distance=${distanceToMirror.toFixed(1)}, touches=${touchesMirror}`);
          }
          
          // Check if it touches mirror
          if (touchesMirror) {
            console.log(`  ✓ Piece touches mirror at x=${testX} (bbox.right=${testBbox.right})`);
            
            const reflectedPiece = geometry.reflectPieceAcrossMirror(testPiece);
            console.log(`  Reflected piece: x=${reflectedPiece.x}, y=${reflectedPiece.y}`);
            
            const hasOverlap = geometry.detectPieceReflectionOverlap(testPiece);
            const isInGameArea = geometry.isPiecePositionInGameArea(testPiece);
            console.log(`  Overlap check: ${hasOverlap}, In game area: ${isInGameArea}`);
            
            if (!hasOverlap && isInGameArea) {
              console.log(`  ✓ Found valid position: x=${testX}`);
              bestX = testX;
              foundValidPosition = true;
              // Don't break, keep looking for the closest position to mirror
            } else {
              if (hasOverlap) console.log(`  ✗ Position has reflection overlap at x=${testX}`);
              if (!isInGameArea) console.log(`  ✗ Position not in game area at x=${testX}`);
            }
          }
        }
        
        if (!foundValidPosition) {
          console.log(`  ❌ No valid position found for piece ${piece.id}. Keeping original position.`);
          
          // Try a different approach: position the piece so its right edge touches the mirror
          // Calculate the X position needed to make the piece's right edge align with the mirror
          const targetX = mirrorLine - (currentBbox.right - piece.x);
          console.log(`  Alternative approach: Setting x=${targetX} to align right edge with mirror`);
          
          const altTestPiece = {
            type: piece.type,
            face: piece.face,
            x: targetX,
            y: piece.y,
            rotation: piece.rotation
          };
          
          const altBbox = geometry.getPieceBoundingBox(altTestPiece);
          const altTouches = geometry.isPieceTouchingMirror(altTestPiece);
          const altReflected = geometry.reflectPieceAcrossMirror(altTestPiece);
          const altOverlap = geometry.detectPieceReflectionOverlap(altTestPiece);
          
          console.log(`  Alternative result: bbox.right=${altBbox.right}, touches=${altTouches}, overlap=${altOverlap}`);
          
          if (altTouches && !altOverlap) {
            bestX = targetX;
            foundValidPosition = true;
            console.log(`  ✓ Alternative approach succeeded`);
          }
        }
        
        console.log(`Final position for piece ${piece.id}: x=${bestX} (moved ${Math.abs(bestX - piece.x).toFixed(2)} pixels)`);
        
        return {
          ...piece,
          x: bestX,
          y: piece.y
        };
      }
      return piece;
    });

    setPieces(updatedPieces);
  };

  // Save challenge
  const saveChallenge = () => {
    const validation = validateChallenge();
    if (!validation.isValid) {
      alert('El reto no es válido. Por favor, corrige los errores antes de guardar.');
      return;
    }

    if (!challengeName.trim()) {
      alert('Por favor, introduce un nombre para el reto.');
      return;
    }

    const piecesInGameArea = pieces.filter(p => p.placed && p.y < 600);
    const piecePositions: PiecePosition[] = piecesInGameArea.map(p => ({
      type: p.type,
      face: p.face,
      x: Math.round(p.x * 100) / 100, // Redondear a 2 decimales
      y: Math.round(p.y * 100) / 100,
      rotation: p.rotation % 360 // Normalizar rotación
    }));

    const challenge: Challenge = {
      id: selectedChallenge?.id || Math.max(0, ...existingChallenges.map(c => c.id)) + 1,
      name: challengeName,
      description: challengeDescription,
      piecesNeeded: piecesInGameArea.length,
      difficulty: challengeDifficulty,
      targetPattern: 'custom',
      objective: {
        playerPieces: piecePositions,
        symmetricPattern: []
      },
      targetPieces: piecePositions
    };

    onSave?.(challenge);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Editor de Retos</h1>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Challenge List */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4">Retos Existentes</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {existingChallenges.map(challenge => (
                  <div
                    key={challenge.id}
                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                      selectedChallenge?.id === challenge.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      setSelectedChallenge(challenge);
                      setIsEditing(true);
                    }}
                  >
                    <div className="font-medium">{challenge.name}</div>
                    <div className="text-sm text-gray-600">{challenge.difficulty}</div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setSelectedChallenge(null);
                    setIsEditing(true);
                    setPieces([]);
                    setChallengeName('');
                    setChallengeDescription('');
                    setChallengeDifficulty('Fácil');
                  }}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-gray-400 hover:text-gray-800"
                >
                  + Nuevo Reto
                </button>
              </div>
            </div>

            {/* Main Editor */}
            <div className="lg:col-span-3">
              {isEditing && (
                <>
                  {/* Challenge Metadata Form */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-4">Información del Reto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre del Reto
                        </label>
                        <input
                          type="text"
                          value={challengeName}
                          onChange={(e) => setChallengeName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ej: Tarjeta 5: Patrón Complejo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dificultad
                        </label>
                        <select
                          value={challengeDifficulty}
                          onChange={(e) => setChallengeDifficulty(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Principiante">Principiante</option>
                          <option value="Fácil">Fácil</option>
                          <option value="Intermedio">Intermedio</option>
                          <option value="Difícil">Difícil</option>
                          <option value="Experto">Experto</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          value={challengeDescription}
                          onChange={(e) => setChallengeDescription(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe el objetivo del reto..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <button
                      onClick={() => addPiece('A')}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Añadir Pieza A
                    </button>
                    <button
                      onClick={() => addPiece('B')}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Añadir Pieza B
                    </button>
                    <button
                      onClick={validateChallenge}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Validar
                    </button>
                    <button
                      onClick={autoPositionPiecesToMirror}
                      className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Auto-posicionar al Espejo
                    </button>
                    <button
                      onClick={saveChallenge}
                      className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedChallenge(null);
                        setPieces([]);
                        setValidationResult(null);
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>

                  {/* Validation Result */}
                  {validationResult && (
                    <div className={`p-4 rounded-lg mb-6 border-2 ${validationResult.isValid ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
                      <h4 className="font-bold text-lg mb-3">
                        {validationResult.isValid ? '✅ Reto Válido' : '❌ Reto Inválido'}
                      </h4>
                      <div className="text-sm space-y-1 font-medium">
                        <div className={`${validationResult.touchesMirror ? 'text-green-700' : 'text-red-700'}`}>
                          {validationResult.touchesMirror ? '✅' : '❌'} Toca espejo
                        </div>
                        <div className={`${!validationResult.hasPieceOverlaps && !validationResult.hasReflectionOverlaps ? 'text-green-700' : 'text-red-700'}`}>
                          {!validationResult.hasPieceOverlaps && !validationResult.hasReflectionOverlaps ? '✅' : '❌'} Sin solapamientos
                        </div>
                        <div className={`${validationResult.piecesInArea ? 'text-green-700' : 'text-red-700'}`}>
                          {validationResult.piecesInArea ? '✅' : '❌'} En área válida
                        </div>
                        <div className={`${validationResult.piecesConnected ? 'text-green-700' : 'text-red-700'}`}>
                          {validationResult.piecesConnected ? '✅' : '❌'} Piezas conectadas
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Editor Canvas - same as game but without objective area */}
                  <div className="bg-white border rounded-lg p-4">
                    <EditorCanvas
                      ref={canvasRef}
                      pieces={pieces}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onContextMenu={handleContextMenu}
                      geometry={geometry}
                    />
                  </div>

                  {/* Piece Controls - Same style as in the main game */}
                  <div className="mt-4">
                    <h4 className="font-semibold mb-4">Controles de Piezas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {pieces.map(piece => (
                        <div key={piece.id} className="bg-gradient-to-br from-white to-gray-50 p-3 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                          <div className="text-sm font-bold mb-2 text-gray-800 text-center">
                            🧩 Pieza {piece.id} ({piece.type})
                          </div>
                          <div className="grid grid-cols-3 gap-1 mb-2">
                            <button
                              onClick={() => rotatePieceCounterClockwise(piece)}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-2 rounded-lg flex items-center justify-center shadow-md transition-all transform hover:scale-110"
                              title="Rotar 45° antihorario"
                            >
                              <RotateCw className="w-4 h-4 transform scale-x-[-1]" />
                            </button>
                            <button
                              onClick={() => flipPiece(piece)}
                              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-2 rounded-lg flex items-center justify-center shadow-md transition-all transform hover:scale-110"
                              title="Voltear pieza"
                            >
                              <FlipHorizontal className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => rotatePiece(piece)}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-2 rounded-lg flex items-center justify-center shadow-md transition-all transform hover:scale-110"
                              title="Rotar 45° horario"
                            >
                              <RotateCw className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-1 rounded-full text-white font-medium text-xs ${
                              piece.face === 'front' 
                                ? 'bg-green-500' 
                                : 'bg-purple-500'
                            }`}>
                              Cara {piece.face === 'front' ? 'A' : 'B'}
                            </span>
                            <button
                              onClick={() => deletePiece(piece)}
                              className="p-1 hover:bg-red-200 rounded text-red-600"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!isEditing && (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">Selecciona un reto existente para editarlo o crea uno nuevo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};