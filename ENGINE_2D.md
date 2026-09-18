# 🎮 Engine2D - Motor Gráfico Geométrico 2D

Un motor gráfico especializado en operaciones algebraicas 2D para juegos de geometría y puzzles.

## 🎯 Filosofía del Motor

**Simplicidad sin perder precisión**: Cada operación tiene un propósito claro y los cálculos redundantes se eliminan automáticamente.

## 📋 Tabla de Contenidos

- [🏗️ Arquitectura](#arquitectura)
- [🧮 Sistema de Geometría](#sistema-de-geometría)
- [🎨 Sistema de Renderizado](#sistema-de-renderizado)
- [✅ Sistema de Validación](#sistema-de-validación)
- [📖 Guía de Uso](#guía-de-uso)
- [🔧 API Reference](#api-reference)

## 🏗️ Arquitectura

```
Engine2D/
├── 🧮 Geometry/          # Operaciones algebraicas 2D
│   ├── GameGeometry      # Motor principal de cálculos
│   └── PieceShape        # Forma canónica, vértices y transformaciones
├── 🎨 Rendering/         # Sistema de dibujado
│   ├── GameAreaRenderer  # Renderizado del área de juego
│   └── ResponsiveCanvas  # Canvas adaptativo
├── ✅ Validation/        # Reglas y validaciones
│   └── GameRules         # Lógica de reglas del juego
└── 🔧 Utils/            # Utilidades auxiliares
```

## 🧮 Sistema de Geometría

### Conceptos Clave

#### 🔸 Piece (Pieza)
Una entidad geométrica con propiedades:
```typescript
interface PiecePosition {
  type: 'A' | 'B';           // Tipo geométrico
  face: 'front' | 'back';    // Cara visible
  x: number;                 // Posición X
  y: number;                 // Posición Y
  rotation: number;          // Rotación en grados (0-360)
}
```

#### 🔸 BoundingBox (Caja Delimitadora)
```typescript
interface BoundingBox {
  left: number;    // X mínima
  right: number;   // X máxima  
  top: number;     // Y mínima
  bottom: number;  // Y máxima
}
```

#### 🔸 Transformaciones
```typescript
// ✨ Reflexión de espejo (automática)
const reflected = geometry.reflectPieceAcrossMirror(piece);

// 🔄 Rotación (incrementos de 45°)
piece.rotation = (piece.rotation + 45) % 360;

// 📐 Escala responsive
const scaledPosition = geometry.scalePosition(piece, scaleFactor);
```

### 📊 Operaciones Principales

| Operación | Descripción | Complejidad |
|-----------|-------------|-------------|
| `getPieceBoundingBox()` | Calcula límites geométricos | O(1) |
| `reflectPieceAcrossMirror()` | Reflexión a través del espejo | O(1) |
| `doPiecesOverlap()` | Detección de colisión SAT | O(n) |
| `snapPieceToNearbyTargets()` | Snap inteligente | O(n²) |
| `validateChallengeCard()` | Validación completa | O(n²) |

## 🎨 Sistema de Renderizado

### GameAreaRenderer

**Responsabilidad**: Dibuja el área principal del juego

```typescript
const renderer = new GameAreaRenderer({
  gameAreaWidth: 700,
  gameAreaHeight: 500,
  mirrorLine: 700,
  pieceSize: 100
});

// 🎨 Renderizado completo
renderer.drawBackgroundAreas(ctx);
renderer.drawMirrorFrameAndDivisions(ctx);
renderer.drawGamePieces(ctx, pieces, draggedPiece, debugMode);
renderer.drawMirrorReflections(ctx, pieces);
```

Las miniaturas de objetivos se dibujan con `components/ui/ChallengeThumbnail.tsx`.

## ✅ Sistema de Validación

### Reglas del Motor

1. **🪞 Mirror Rule**: Al menos una pieza debe tocar el espejo
2. **🚫 No Overlap**: Las piezas no pueden superponerse significativamente  
3. **🔗 Connectivity**: Las piezas deben formar una figura continua
4. **📐 Area Constraint**: Las piezas deben estar dentro del área válida

### Validación Automática

```typescript
const validation = geometry.validateChallengeCard(pieces);

if (validation.isValid) {
  console.log('✅ Challenge completado!');
} else {
  console.log('❌ Errores:', {
    touchesMirror: validation.touchesMirror,
    hasPieceOverlaps: validation.hasPieceOverlaps,
    piecesConnected: validation.piecesConnected,
    piecesInArea: validation.piecesInArea
  });
}
```

## 📖 Guía de Uso

### 🚀 Inicialización Básica

```typescript
import { GameGeometry } from './utils/geometry/GameGeometry';
import { GameAreaRenderer } from './rendering/GameAreaRenderer';

// 1. Configurar geometría
const geometry = new GameGeometry({
  width: 700,
  height: 500,
  mirrorLineX: 700,
  pieceSize: 100
});

// 2. Configurar renderizado
const renderer = new GameAreaRenderer({
  gameAreaWidth: 700,
  gameAreaHeight: 500,
  bottomAreaHeight: 400,
  mirrorLine: 700,
  canvasWidth: 1400,
  canvasHeight: 1000,
  pieceSize: 100
});

// 3. Crear piezas
const pieces: PiecePosition[] = [
  {
    type: 'A',
    face: 'front',
    x: 300,
    y: 250,
    rotation: 0
  }
];
```

### 🎮 Loop de Juego Típico

```typescript
function gameLoop() {
  // 1. Limpiar canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 2. Dibujar fondo
  renderer.drawBackgroundAreas(ctx);
  renderer.drawMirrorFrameAndDivisions(ctx);
  
  // 3. Dibujar piezas
  renderer.drawGamePieces(ctx, pieces, draggedPiece, debugMode);
  renderer.drawMirrorReflections(ctx, pieces);
  
  // 4. Validar estado
  const validation = geometry.validateChallengeCard(pieces);
  
  // 5. Actualizar UI
  updateUI(validation);
  
  requestAnimationFrame(gameLoop);
}
```

### 🔧 Operaciones Comunes

#### Mover Pieza
```typescript
// ✨ Con snap automático
const snappedPosition = geometry.snapPieceToNearbyTargets(
  piece, 
  otherPieces, 
  snapDistance
);
piece.x = snappedPosition.x;
piece.y = snappedPosition.y;
```

#### Rotar Pieza
```typescript
// 🔄 Rotación en incrementos de 45°
piece.rotation = (piece.rotation + 45) % 360;
```

#### Detectar Colisión
```typescript
// 🚫 Verificar superposición
const hasOverlap = geometry.doPiecesOverlap(piece1, piece2);
```

## 🔧 API Reference

### GameGeometry

#### Métodos Principales

##### `getPieceBoundingBox(piece: PiecePosition): BoundingBox`
Calcula la caja delimitadora de una pieza considerando rotación.

**Parámetros:**
- `piece`: Posición y propiedades de la pieza

**Retorna:** Coordenadas de la caja delimitadora

**Ejemplo:**
```typescript
const bbox = geometry.getPieceBoundingBox({
  type: 'A', face: 'front', x: 100, y: 200, rotation: 45
});
// bbox = { left: 85.3, right: 185.3, top: 185.3, bottom: 285.3 }
```

##### `reflectPieceAcrossMirror(piece: PiecePosition): PiecePosition`
Calcula la reflexión de una pieza a través del espejo.

**Algoritmo:** `reflected_x = 2 * mirror_line - original_x`. `x` es el centro: además se invierte A↔B y el signo de la rotación.

##### `doPiecesOverlap(piece1: PiecePosition, piece2: PiecePosition): boolean`
Detecta si dos piezas se superponen usando SAT (Separating Axes Theorem).

##### `snapPieceToNearbyTargets(piece, otherPieces, snapDistance): PiecePosition`
Sistema de snap inteligente que alinea piezas automáticamente.

**Características:**
- Detección de bordes compatibles
- Alineación sub-pixel
- Corrección de micro-gaps

### GameAreaRenderer

#### Métodos de Renderizado

##### `drawBackgroundAreas(ctx: CanvasRenderingContext2D): void`
Dibuja todas las áreas de fondo con gradientes.

##### `drawGamePieces(ctx, pieces, draggedPiece, debugMode): void`
Renderiza las piezas del juego con efectos visuales.

**Características:**
- Borde verde para pieza arrastrada
- Información de debug opcional
- Optimización de renderizado

##### `drawMirrorReflections(ctx, pieces): void`
Dibuja las reflexiones de las piezas en el espejo.

**Efectos:**
- Transparencia del 90%
- Transformación horizontal
- Gradiente de distorsión

## 🎯 Casos de Uso

### 🧩 Juego de Puzzles
- Piezas con formas geométricas complejas
- Validación de patrones objetivo
- Sistema de snap inteligente

### 🔄 Juegos de Simetría  
- Reflexiones en tiempo real
- Validación de simetría
- Efectos visuales de espejo

### 📐 Educación Matemática
- Visualización de transformaciones
- Operaciones algebraicas 2D
- Sistema de validación pedagógico

## 📊 Rendimiento

### Complejidad Algorítmica

| Operación | Mejor Caso | Caso Promedio | Peor Caso |
|-----------|------------|---------------|-----------|
| Reflexión | O(1) | O(1) | O(1) |
| Bounding Box | O(1) | O(1) | O(1) |
| Colisión (2 piezas) | O(1) | O(n) | O(n) |
| Snap Sistema | O(n) | O(n²) | O(n²) |
| Validación Completa | O(n) | O(n²) | O(n²) |

### Optimizaciones Implementadas

- ✅ **Cálculos cacheados**: Bounding boxes se reutilizan
- ✅ **Early exit**: Detección rápida de no-colisión
- ✅ **Threshold inteligente**: Evita cálculos innecesarios
- ✅ **Renderizado por lotes**: Canvas calls optimizadas

---

## 🚀 Próximas Mejoras

1. **🔧 Sistema de Entities**: ECS pattern para mayor flexibilidad
2. **⚡ GPU Acceleration**: WebGL para cálculos complejos  
3. **🎵 Audio Engine**: Feedback sonoro para interacciones
4. **📱 Multi-touch**: Soporte para dispositivos táctiles
5. **🔄 Undo/Redo**: Sistema de historial de acciones

---

*Engine2D - Donde la geometría se encuentra con la jugabilidad* ✨
