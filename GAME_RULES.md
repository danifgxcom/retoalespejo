# Reglas del Juego "Reto al Espejo"

## Reglas de Validación para Challenge Cards

Para que un challenge sea válido, debe cumplir TODAS las siguientes reglas:

### 1. Al menos una pieza debe tocar el espejo
- **Regla**: Una o más piezas deben estar posicionadas de manera que toquen exactamente la línea del espejo (mirrorLineX).
- **Implementación**: `GameGeometry.isPieceTouchingMirror(piece)`
- **Tolerancia**: 1 pixel de diferencia permitida

### 2. Ninguna pieza se puede solapar con otra
- **Regla**: Las piezas no pueden ocupar el mismo espacio geométrico.
- **Implementación**: `GameGeometry.doPiecesOverlap(piece1, piece2)` usando SAT (Separating Axes Theorem)
- **Geometría**: Se considera la forma real de las piezas (cuadrado + 3 triángulos), no bounding boxes rectangulares

### 3. Las piezas no pueden entrar dentro del área del espejo
- **Regla**: Ninguna parte de una pieza puede cruzar la línea del espejo hacia el área de reflejo.
- **Implementación**: `GameGeometry.detectMirrorCollision(piece)`
- **Límite**: Las piezas pueden tocar exactamente la línea pero no cruzarla

### 4. Todas las piezas deben estar conectadas
- **Regla**: Las piezas deben formar una figura continua donde cada pieza toca al menos a otra pieza.
- **Implementación**: `GameGeometry.arePiecesConnected(pieces)` usando algoritmo DFS (Depth-First Search)
- **Excepción**: Si hay una sola pieza, debe tocar el espejo para considerarse "conectada"

### 5. Ninguna pieza se puede solapar con su propio reflejo
- **Regla**: Una pieza no puede estar tan cerca del espejo que se solape con su reflejo automático.
- **Implementación**: `GameGeometry.detectPieceReflectionOverlap(piece)`
- **Cálculo**: Se genera el reflejo de la pieza y se verifica solapamiento usando SAT

### 6. Todas las piezas deben caber dentro del área de reto
- **Regla**: Las piezas (incluyendo sus reflejos) deben estar completamente dentro de los límites del área de juego.
- **Implementación**: `GameGeometry.doPiecesFitInChallengeArea(pieces)`
- **Áreas**: Área de juego (0-700px) y área de espejo (700-1400px)

## Validación Completa

La validación se realiza mediante la función `GameGeometry.validateChallengeCard(pieces)` que retorna:

```typescript
{
  isValid: boolean;              // true solo si TODAS las reglas se cumplen
  hasReflectionOverlaps: boolean; // Regla 5
  hasPieceOverlaps: boolean;     // Regla 2
  touchesMirror: boolean;        // Regla 1
  entersMirror: boolean;         // Regla 3
  piecesConnected: boolean;      // Regla 4
  piecesInArea: boolean;         // Regla 6
}
```

## Implementación de Precisión Geométrica

- **SAT (Separating Axes Theorem)**: Para detección precisa de colisiones entre polígonos complejos
- **Vértices transformados**: Se calculan los vértices reales de cada pieza considerando rotación y tipo
- **Distancias mínimas**: Se calculan distancias exactas entre geometrías complejas, no entre centros
- **Búsqueda binaria**: Para posicionamiento óptimo donde las piezas se tocan sin solaparse

## Configuración del Área de Juego

```typescript
const gameAreaConfig: GameAreaConfig = {
  width: 700,          // Ancho del área de juego
  height: 600,         // Alto del área de juego
  mirrorLineX: 700,    // Posición X de la línea del espejo
  pieceSize: 100       // Tamaño base de las piezas
};
```