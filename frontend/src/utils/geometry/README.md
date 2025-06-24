# Geometry and Transformation Library API Documentation

This library provides comprehensive geometric calculations and transformations for the Mirror Challenge Game, handling piece positioning, collision detection, mirror reflections, and game validation.

## Core Classes

### GameGeometry

The main class responsible for all geometric calculations and game validation logic.

#### Constructor
```typescript
constructor(config: GameConfig)
```

**Parameters:**
- `config: GameConfig` - Game configuration including canvas dimensions and piece size

**Example:**
```typescript
const geometry = new GameGeometry({
  gameAreaWidth: 700,
  gameAreaHeight: 600,
  bottomAreaHeight: 400,
  mirrorLine: 700,
  canvasWidth: 1400,
  canvasHeight: 1000,
  pieceSize: 100
});
```

#### Core Methods

##### Piece Positioning

```typescript
constrainPiecePosition(piece: PiecePosition, targetX: number, targetY: number): PiecePosition
```
Constrains piece position within game boundaries and validates placement.

**Parameters:**
- `piece: PiecePosition` - The piece to position
- `targetX: number` - Desired X coordinate
- `targetY: number` - Desired Y coordinate

**Returns:** `PiecePosition` - Constrained piece position

**Example:**
```typescript
const constrainedPiece = geometry.constrainPiecePosition(piece, 150, 200);
```

##### Mirror Calculations

```typescript
calculateMirrorReflection(piece: PiecePosition): PiecePosition
```
Calculates the mirror reflection of a piece across the mirror line.

**Parameters:**
- `piece: PiecePosition` - Original piece to reflect

**Returns:** `PiecePosition` - Reflected piece position

**Example:**
```typescript
const reflection = geometry.calculateMirrorReflection(gamePiece);
```

##### Collision Detection

```typescript
doPiecesOverlap(piece1: PiecePosition, piece2: PiecePosition): boolean
```
Determines if two pieces overlap using Separating Axes Theorem (SAT).

**Parameters:**
- `piece1: PiecePosition` - First piece
- `piece2: PiecePosition` - Second piece

**Returns:** `boolean` - True if pieces overlap significantly

```typescript
doPiecesTouch(piece1: PiecePosition, piece2: PiecePosition): boolean
```
Determines if two pieces are properly connected (touching without significant overlap).

**Returns:** `boolean` - True if pieces are validly connected

##### Game Validation

```typescript
validateChallengeCard(pieces: PiecePosition[]): ValidationResult
```
Performs comprehensive validation of all game rules.

**Returns:** `ValidationResult` with properties:
- `isValid: boolean` - Overall validation result
- `hasReflectionOverlaps: boolean` - Whether reflections overlap with pieces
- `hasPieceOverlaps: boolean` - Whether pieces overlap each other
- `touchesMirror: boolean` - Whether at least one piece touches mirror
- `entersMirror: boolean` - Whether any piece enters mirror area
- `piecesConnected: boolean` - Whether all pieces are connected
- `piecesInArea: boolean` - Whether all pieces fit in game area

##### Smart Positioning

```typescript
snapPieceToOptimalPosition(piece: PiecePosition, targetX: number, targetY: number, otherPieces: PiecePosition[]): PiecePosition
```
Intelligently positions a piece to avoid overlaps and optimize connections.

**Parameters:**
- `piece: PiecePosition` - Piece to position
- `targetX: number` - Target X coordinate
- `targetY: number` - Target Y coordinate  
- `otherPieces: PiecePosition[]` - Other pieces to avoid/connect with

**Returns:** `PiecePosition` - Optimally positioned piece

#### Utility Methods

##### Bounding Box Calculations

```typescript
getPieceBoundingBox(piece: PiecePosition): BoundingBox
```
Calculates the axis-aligned bounding box for a piece.

**Returns:** `BoundingBox` with properties:
- `left: number`
- `right: number`
- `top: number`
- `bottom: number`

##### Distance Calculations

```typescript
getMinDistanceBetweenPieces(piece1: PiecePosition, piece2: PiecePosition): number
```
Calculates minimum distance between two piece boundaries.

**Returns:** `number` - Distance in pixels

##### Area Validation

```typescript
isPieceInGameArea(piece: PiecePosition): boolean
isPieceInStorageArea(piece: PiecePosition): boolean
```
Checks if piece is within specific game areas.

## Data Types

### PiecePosition
```typescript
interface PiecePosition {
  type: 'A' | 'B';           // Piece type
  face: 'front' | 'back';    // Current face  
  x: number;                 // X coordinate
  y: number;                 // Y coordinate
  rotation: number;          // Rotation in degrees (0-315, 45° increments)
}
```

### BoundingBox
```typescript
interface BoundingBox {
  left: number;    // Left edge X coordinate
  right: number;   // Right edge X coordinate  
  top: number;     // Top edge Y coordinate
  bottom: number;  // Bottom edge Y coordinate
}
```

### ValidationResult
```typescript
interface ValidationResult {
  isValid: boolean;                // Overall validation result
  hasReflectionOverlaps: boolean;  // Reflection collision detection
  hasPieceOverlaps: boolean;       // Piece-to-piece collision
  touchesMirror: boolean;          // Mirror contact requirement
  entersMirror: boolean;           // Mirror area violation
  piecesConnected: boolean;        // Connectivity requirement
  piecesInArea: boolean;          // Boundary compliance
  penetrationDepth?: number;       // Overlap severity (if any)
  minDistance?: number;           // Connection gap (if any)
}
```

### GameConfig
```typescript
interface GameConfig {
  gameAreaWidth: number;     // Game area width (typically 700px)
  gameAreaHeight: number;    // Game area height (typically 600px)
  bottomAreaHeight: number;  // Storage area height (typically 400px)
  mirrorLine: number;        // Mirror line X position (typically 700px)
  canvasWidth: number;       // Total canvas width (typically 1400px)
  canvasHeight: number;      // Total canvas height (typically 1000px)
  pieceSize: number;         // Logical piece size (typically 100px)
}
```

## Usage Examples

### Basic Setup
```typescript
import { GameGeometry } from './GameGeometry';

const geometry = new GameGeometry({
  gameAreaWidth: 700,
  gameAreaHeight: 600,
  bottomAreaHeight: 400,
  mirrorLine: 700,
  canvasWidth: 1400,
  canvasHeight: 1000,
  pieceSize: 100
});
```

### Validate Game State
```typescript
const pieces = [
  { type: 'A', face: 'front', x: 200, y: 300, rotation: 0 },
  { type: 'A', face: 'back', x: 400, y: 300, rotation: 90 }
];

const validation = geometry.validateChallengeCard(pieces);
if (validation.isValid) {
  console.log('Challenge completed successfully!');
} else {
  console.log('Validation failed:', validation);
}
```

### Position Piece with Collision Avoidance
```typescript
const newPiece = { type: 'B', face: 'front', x: 0, y: 0, rotation: 0 };
const targetX = 250;
const targetY = 350;

const positionedPiece = geometry.snapPieceToOptimalPosition(
  newPiece, 
  targetX, 
  targetY, 
  existingPieces
);
```

### Check Piece Connection
```typescript
const piece1 = { type: 'A', face: 'front', x: 200, y: 300, rotation: 0 };
const piece2 = { type: 'B', face: 'back', x: 300, y: 300, rotation: 45 };

if (geometry.doPiecesTouch(piece1, piece2)) {
  console.log('Pieces are properly connected');
} else if (geometry.doPiecesOverlap(piece1, piece2)) {
  console.log('Pieces overlap significantly');
} else {
  console.log('Pieces have gap between them');
}
```

## Performance Considerations

- **Collision Detection**: Uses optimized SAT algorithm with early exit conditions
- **Caching**: Bounding box calculations are cached when possible
- **Tolerance**: Uses pixel-level tolerance (2-3px) for floating-point precision
- **Smart Positioning**: Implements spatial optimization to reduce calculation overhead

## Error Handling

The library uses defensive programming with:
- Input validation for all public methods
- Graceful degradation for edge cases
- Comprehensive logging for debugging
- Safe defaults for invalid inputs

## Testing

The library includes comprehensive test coverage:
- Unit tests for all geometric calculations
- Integration tests for game rule validation
- Edge case testing for boundary conditions
- Performance benchmarks for complex scenarios

See `/src/tests/unit/` for detailed test cases and examples.