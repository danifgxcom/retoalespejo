# Guía del juego de referencia

## 🎯 Información del Juego Real

### 📋 Especificaciones Oficiales:
- **Título:** Actividades con espejo
- **Origen:** XIII Feria de la Ciencia Sevilla  
- **Referencia:** Juego de puzles de simetría descatalogado
- **Jugadores:** 1 ó 2 jugadores
- **Edad:** Actividades de aprendizaje de la simetría

### 🎮 Material del Juego:
- ✦ **4 piezas trapezoidales** idénticas
- ✦ **1 espejo vertical** con soporte
- ✦ **14 tarjetas-reto** con patrones objetivo
- ✦ Superficie de juego plana

## 🧩 Descripción de las Piezas

### Forma: Trapecio Rectángulo
Cada pieza está compuesta por:
- **1 cuadrado central** (núcleo de la pieza)
- **4 triángulos rectángulos** (bordes: superior, inferior, izquierdo, derecho)

### Colores Disponibles:
- 🔴 **Rojo**
- 🟡 **Amarillo** 
- 🟢 **Verde**
- 🔵 **Azul**

### Características:
- **Dos caras diferentes** por pieza
- **Distribución de colores distinta** en cada cara
- **Rotación libre** (cualquier ángulo)
- **Combinaciones infinitas** con 4 piezas

### Representación ASCII:
```
Pieza típica:
    /R\      ← Triángulo superior (Rojo)
   /RYR\     ← Triángulos laterales (Amarillo)
  /RY■YR\    ← Cuadrado central (■)
 /RYYYYY\    ← Expansión de la forma
  \GYYG/     ← Triángulos laterales (Verde)  
   \GGG/     ← Triángulo inferior (Verde)
    \G/      ← Punta inferior
```

## 🪞 Mecánica del Espejo

### Funcionamiento:
```
Piezas físicas (izquierda) + Espejo (centro) = Patrón completo (total)

     /R\                |           /R\     /R\
    /RYR\               |          /RYR\   /RYR\  
   /RY■YR\              |         /RY■YR\ /RY■YR\
  /RYYYYY\              |        /RYYYYY\/RYYYYY\
   \GYYG/               |         \GYYG/  \GYYG/
    \GGG/               |          \GGG/    \GGG/
     \G/                |           \G/      \G/
                        |
    Área de Juego    Espejo        Patrón Simétrico Final
```

### Propiedades del Reflejo:
- **Simetría perfecta** respecto al eje vertical del espejo
- **Colores conservados** (no se invierten)
- **Formas reflejadas** horizontalmente
- **Posiciones exactas** espejo de las físicas

## 🎴 Las 14 Tarjetas-Reto Originales

### Categorías de Patrones:

#### 1. **Principiante (1-2 piezas):**
- Corazones simples
- Formas básicas simétricas
- Patrones de iniciación

#### 2. **Intermedio (2-3 piezas):**
- Mariposas con alas extendidas
- Flores de pétalos múltiples  
- Casas con tejados triangulares
- Coronas con picos decorativos

#### 3. **Avanzado (3-4 piezas):**
- Estrellas de múltiples puntas
- Mandalas geométricos
- Patrones arquitectónicos complejos
- Figuras abstractas simétricas

### Ejemplos de Patrones Típicos:

#### Corazón Simple:
```
Patrón objetivo completo:
   /R\ /R\
  /RYR\RYR\
 /RY■■■YR\
/RYYY■■■YYY\
\GYYY■■■YYG/
 \GY■■■YG/
  \G■■■G/
   \GGG/
    \G/
    
Piezas a colocar (solo lado izquierdo):
   /R\
  /RYR\
 /RY■■■
/RYYY■■■
\GYYY■■■
 \GY■■■
  \G■■■
   \GGG
    \G
```

#### Mariposa:
```
Patrón objetivo completo:
  /B\       /B\
 /BGB\     /BGB\
/BG■GB\   /BG■GB\
\BG■GB/   \BG■GB/
 \BGB/     \BGB/
  \B/       \B/
     \     /
      \   /
      /   \
     /     \
  /R/       \R\
 /RYR\     /RYR\
/RY■YR\   /RY■YR\
\RY■YR/   \RY■YR/
 \RYR/     \RYR/
  \R/       \R/

Piezas a colocar (solo lado izquierdo):
  /B\
 /BGB\      (rotación 45°)
/BG■GB\
\BG■GB/
 \BGB/
  \B/
  
  /R\
 /RYR\      (rotación 315°)
/RY■YR\
\RY■YR/
 \RYR/
  \R/
```

## 🎯 Objetivos de Aprendizaje

### Conceptos Matemáticos:
- **Simetría axial** (reflexión respecto a un eje)
- **Geometría espacial** (formas y transformaciones)
- **Reconocimiento de patrones** 
- **Razonamiento visual**

### Habilidades Desarrolladas:
- **Pensamiento lógico** (planificación estratégica)
- **Percepción espacial** (orientación y posición)
- **Resolución de problemas** (análisis y síntesis)
- **Creatividad** (exploración de combinaciones)

## 🔧 Implementación Digital

### Fidelidad al Original:
- ✅ **4 piezas trapezoidales** exactas
- ✅ **Espejo vertical** funcional  
- ✅ **14 tarjetas-reto** auténticas
- ✅ **Colores originales** (rojo, amarillo, verde, azul)
- ✅ **Mecánica idéntica** al juego físico

### Mejoras Digitales:
- 🔄 **Rotación libre** con incrementos de 45°
- 📱 **Interfaz táctil** para drag & drop
- ✔️ **Validación automática** de soluciones
- 🎯 **Progresión de dificultad** estructurada
- 📊 **Seguimiento de progreso** del jugador

### Ventajas de la Versión Digital:
- **Accesibilidad:** Disponible sin material físico
- **Portabilidad:** Jugar en cualquier dispositivo
- **Feedback inmediato:** Verificación instantánea
- **Repetibilidad:** Infinitas partidas sin desgaste
- **Adaptabilidad:** Niveles personalizables

¡Una recreación digital que preserva la esencia didáctica del juego de referencia! 🎮✨
