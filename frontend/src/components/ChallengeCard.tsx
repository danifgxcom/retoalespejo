import React from 'react';

export interface PiecePosition {
  type: 'A' | 'B';
  face: 'front' | 'back';
  x: number;
  y: number;
  rotation: number;
}

export interface ObjectivePattern {
  // Piezas que el jugador debe colocar en el área de juego
  playerPieces: PiecePosition[];
  // Patrón completo simétrico que debe formarse (jugador + reflejos automáticos)
  // Esto incluye TODAS las piezas que deberían ser visibles: las del área de juego + las del área del espejo
  symmetricPattern: PiecePosition[];
}

export interface Challenge {
  id: number;
  name: string;
  description: string;
  piecesNeeded: number;
  difficulty: string;
  targetPattern: string;
  // Definición del patrón objetivo completo (piezas + reflejos)
  objective: ObjectivePattern;
  // Backward compatibility - mantener targetPieces por ahora
  targetPieces: PiecePosition[];
}

interface ChallengeCardProps {
  challenge: Challenge;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge }) => {
  return (
    <div className="mt-4 flex justify-center">
      <div className="bg-white border-4 border-gray-800 p-4 rounded-lg shadow-lg w-64">
        <div className="text-center">
          <h3 className="font-bold text-lg mb-2">RETO AL ESPEJO</h3>
          <div className="text-2xl font-bold mb-4">{challenge.id}</div>

          {/* Información del reto */}
          <div className="text-sm text-gray-600">
            <p>Reto {challenge.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;
