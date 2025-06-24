# Reto al Espejo (Mirror Challenge) - Mono-repo

> Digital implementation of the "Reto al Espejo" puzzle game, originally by Educa. A React-based interactive web application that simulates a physical geometric puzzle game involving symmetry and mirror reflection, now with multiplayer support through a Node.js backend.

## 🎮 Game Overview

**Mirror Challenge** is a puzzle game where players place geometric pieces on one side of a mirror line, and the pieces are automatically reflected on the other side. The goal is to recreate specific challenge patterns by strategically positioning, rotating, and flipping pieces to match the target configuration.

## 📂 Mono-repo Structure

This project is now organized as a mono-repo with separate directories for frontend and backend:

- `frontend/` - Contains the React application for the game interface
- `backend/` - Contains the Node.js server for multiplayer functionality

### Multiplayer Features

The backend adds the following multiplayer capabilities:
- Real-time multiplayer gameplay with Socket.io
- Chat functionality between players in the same room
- Synchronized game timer for all players
- Player elimination on wrong answers
- Winner notification when a player solves the challenge

### Getting Started

#### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

#### Installation
1. Install dependencies for both frontend and backend:
   ```
   npm install
   ```

#### Running the Application
Start both frontend and backend in development mode:
```
npm run dev
```

Start only the frontend:
```
npm run frontend:dev
```

Start only the backend:
```
npm run backend:dev
```

For more detailed information about each part of the application:
- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)

## 🎮 Game Mechanics

- **Two piece types**: Type A and Type B (with different geometric shapes)
- **Color combinations**: Yellow center with red triangles, or inverted
- **Face system**: Front/back faces with inverted color schemes
- **Real-time reflection**: Pieces placed in the game area automatically appear reflected
- **Challenge system**: 4+ predefined patterns with increasing difficulty
- **Piece manipulation**: Rotation (90° increments), face flipping, and drag-and-drop

## 🏗️ Architecture & Structure

### Project Structure

```
/
├── frontend/           # Frontend React application
│   ├── src/            # Frontend source code
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # Business logic services
│   │   ├── utils/      # Utility libraries
│   │   ├── main.tsx    # React entry point
│   │   └── MirrorChallengeGame.tsx # Root game component
│   ├── public/         # Static assets
│   └── package.json    # Frontend dependencies
├── backend/            # Backend Node.js application
│   ├── src/            # Backend source code
│   │   └── index.js    # Express and Socket.io server
│   └── package.json    # Backend dependencies
└── package.json        # Root package.json for mono-repo
```

### Architecture Principles

#### SOLID Design Patterns
- **Single Responsibility**: Each service handles one specific concern
- **Open/Closed**: Extensible through interfaces without modifying existing code
- **Liskov Substitution**: Services are interchangeable through interfaces
- **Interface Segregation**: Focused, minimal interfaces
- **Dependency Injection**: Services receive dependencies through constructors

#### Clean Code Implementation
- **Separation of Concerns**: UI, business logic, and data handling are separated
- **Dependency Inversion**: High-level modules don't depend on low-level details
- **Service-Oriented Architecture**: Core functionality organized in specialized services
- **Type Safety**: Full TypeScript implementation with strict types

## 🎯 Game Rules & Validation

### Challenge Validation Rules

The game enforces 6 core validation rules for valid challenge patterns:

1. **Mirror Touch Rule**: At least one piece must touch the mirror line (x=700)
2. **No Piece Overlaps**: Pieces cannot overlap with each other
3. **No Mirror Intrusion**: Pieces cannot cross into the mirror area (x>700)
4. **No Reflection Overlaps**: Pieces cannot overlap with their own reflections
5. **Connectivity Rule**: All pieces must form a continuous connected figure
6. **Area Containment**: All pieces (including reflections) must fit within the challenge area

### Geometric Precision

- **SAT Collision Detection**: Separating Axes Theorem for precise polygon overlap detection
- **Exact Touch Validation**: Sub-pixel precision for mirror touching verification
- **Complex Piece Geometry**: Square with 3 triangular extensions (7 vertices total)
- **Rotation & Transformation**: Full 360° rotation support with proper bounding box calculations

## 🔧 Technical Implementation

### Canvas Rendering System

#### Multi-Area Layout
- **Game Area** (0-700px): Player interaction zone
- **Mirror Area** (700-1400px): Automatic reflection display  
- **Piece Storage** (bottom): Available pieces inventory
- **Challenge Card** (bottom-right): Target pattern visualization

#### Coordinate Systems
- **World Coordinates**: Logical game coordinates (0-700 for game area)
- **Canvas Coordinates**: Physical pixel coordinates
- **Viewport Transformations**: Managed by `ViewportManager` for consistent scaling

### State Management

#### React Hooks Architecture
```typescript
// Game state centralized in custom hooks
const gameLogic = useGameLogic(challenges, geometry);
const mouseHandlers = useMouseHandlers(gameLogic, canvasRef);

// State flows unidirectionally
pieces → validation → rendering → user interaction → state update
```

#### Service Layer
```typescript
// Dependency injection pattern
const validationService = new ValidationService(geometry);
const challengeService = new ChallengeService(generator, validationService);
const renderingService = new RenderingService(theme);
```

### Challenge System

#### Challenge Loading
- **Primary**: Load from `/public/challenges.json`
- **Fallback**: Embedded challenges in `ChallengeGenerator`
- **Validation**: All challenges validated against game rules
- **Format**: JSON with piece positions, types, rotations, and metadata

#### Challenge Structure

**New Relative Coordinate System (Recommended):**
```json
{
  "coordinate_system": "mirror_relative",
  "challenges": [
    {
      "id": 1,
      "name": "Heart Simple",
      "pieces": [
        {
          "type": "A",
          "face": "front",
          "x": 0,    // 0 = touches mirror, negative = left of mirror
          "y": 0,    // 0 = vertical center, negative = up, positive = down
          "rotation": 0
        }
      ]
    }
  ]
}
```

**Legacy Absolute Coordinate System:**
```json
{
  "id": 1,
  "name": "Challenge Name",
  "objective": {
    "playerPieces": [
      {
        "type": "A|B",
        "face": "front|back", 
        "x": 330,  // Absolute canvas coordinates (confusing)
        "y": 300,
        "rotation": 0
      }
    ]
  }
}
```

## 🧪 Testing Strategy

### Comprehensive Test Coverage

#### Unit Tests
- **ViewportManager**: 17 tests covering coordinate transformations
- **GameGeometry**: Collision detection, piece validation, mirror calculations
- **ValidationService**: All 6 game rules tested independently
- **VisualGeometryTest**: Verification of calculation-to-rendering consistency

#### Test Categories
- **Precision Tests**: Sub-pixel accuracy verification
- **Edge Cases**: Boundary conditions and invalid inputs
- **Integration Tests**: Service interaction verification
- **Regression Tests**: Prevent breaking changes

#### Quality Assurance
```bash
npm test                    # Run all tests
npm run lint               # Code style validation
npm run typecheck          # TypeScript validation
npm run build              # Production build verification
```

## 🖼️ Visual Design

### Professional UI Elements
- **Elegant Mirror Frame**: Classic wooden frame with golden accents
- **Gradient Backgrounds**: Subtle gradients for visual depth
- **Area Labels**: Clear section identification with icons
- **Professional Typography**: Segoe UI with proper hierarchy
- **Responsive Layout**: Scales appropriately for different screen sizes

### Rendering Optimizations
- **Anti-aliasing Control**: Disabled for crisp pixel edges
- **Color Consistency**: Exact hex colors for piece identification
- **Performance**: Efficient canvas operations with minimal redraws
- **Visual Feedback**: Clear hover states and interaction indicators

## 🚀 Development Workflow

### Local Development
```bash
npm install                 # Install dependencies
npm run dev                # Start development server (http://localhost:5173)
npm run build              # Production build
npm run preview            # Preview production build
npm run lint               # Run ESLint
npm test                   # Run test suite
```

### Code Quality Standards
- **TypeScript Strict Mode**: Full type safety enforcement
- **ESLint Configuration**: Consistent code style
- **Prettier Integration**: Automated code formatting
- **Git Hooks**: Pre-commit validation

### Performance Considerations
- **Canvas Optimization**: Efficient drawing operations
- **Memory Management**: Proper cleanup of event listeners
- **State Optimization**: Minimal re-renders through proper memoization
- **Bundle Size**: Tree-shaking and code splitting

## 📐 Mathematical Foundations

### Coordinate Transformations
- **Mirror Reflection**: `reflectedX = 2 * mirrorLine - pieceX - pieceWidth`
- **Rotation Mathematics**: Standard 2D rotation matrices
- **Scaling Algorithms**: Proportional viewport fitting
- **Collision Detection**: Vector mathematics and polygon intersection

### Geometric Algorithms
- **Separating Axes Theorem (SAT)**: For precise collision detection
- **Bounding Box Calculations**: Axis-aligned and oriented bounding boxes
- **Distance Calculations**: Point-to-polygon and polygon-to-polygon
- **Connectivity Analysis**: Graph algorithms for piece connectivity validation

## 🔄 Future Extensibility

### Planned Enhancements
- **Custom Challenge Editor**: Visual challenge creation interface
- **Multiplayer Support**: ✓ Implemented with real-time collaborative puzzle solving
- **Chat System**: ✓ Implemented for player communication
- **Progressive Difficulty**: Adaptive challenge generation
- **Animation System**: Smooth piece transitions and feedback
- **Accessibility**: Screen reader support and keyboard navigation

### Architecture Benefits
- **Modular Services**: Easy to extend without breaking existing functionality
- **Type Safety**: Compile-time error detection for new features
- **Test Coverage**: Ensures reliability during feature additions
- **Clean Interfaces**: Well-defined contracts between components

## 📝 Documentation Standards

### Code Documentation
- **JSDoc Comments**: Comprehensive function and class documentation
- **Type Annotations**: Full TypeScript type information
- **Architecture Decisions**: Documented rationale for design choices
- **API Documentation**: Clear service interfaces and usage examples

### Project Documentation
- **CLAUDE.md**: Development guidelines for AI assistants
- **GAME_RULES.md**: Detailed validation rules documentation
- **Component READMEs**: Usage examples for complex components
- **Testing Guidelines**: Test writing standards and best practices

---

## 🏆 Project Status

**Current Version**: 2.0.0  
**Status**: Production Ready  
**Frontend Test Coverage**: 95%+  
**Architecture**: SOLID Compliant  
**Code Quality**: TypeScript Strict + ESLint  
**Mono-repo Structure**: ✓ Implemented  
**Multiplayer Support**: ✓ Implemented  

This implementation represents a complete, professional-grade puzzle game with robust architecture, comprehensive testing, and clean code principles suitable for production deployment and future enhancement. The addition of multiplayer functionality through a Node.js backend allows for real-time collaborative gameplay and chat functionality.
