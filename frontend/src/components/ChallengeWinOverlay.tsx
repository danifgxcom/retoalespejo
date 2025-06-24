import React from 'react';
import { Trophy, Clock, ArrowRight, Users } from 'lucide-react';

interface ChallengeWinOverlayProps {
  winner: {
    id: string;
    username: string;
  };
  completionTime: number;
  isCurrentPlayer: boolean;
  onNextChallenge: () => void;
  onClose: () => void;
}

const ChallengeWinOverlay: React.FC<ChallengeWinOverlayProps> = ({
  winner,
  completionTime,
  isCurrentPlayer,
  onNextChallenge,
  onClose
}) => {
  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      seconds = 0;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl border-4 border-yellow-300">
        {/* Trophy Animation */}
        <div className="mb-6">
          <div className="relative inline-block">
            <Trophy size={64} className="text-yellow-500 animate-bounce" />
            <div className="absolute -top-2 -right-2">
              <div className="w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
          </div>
        </div>

        {/* Winner Info */}
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {isCurrentPlayer ? '¡Felicidades!' : '¡Reto Completado!'}
        </h2>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users size={20} className="text-yellow-600" />
            <span className="text-yellow-800 font-semibold">Ganador</span>
          </div>
          <p className="text-2xl font-bold text-yellow-700">{winner.username}</p>
          {isCurrentPlayer && (
            <p className="text-sm text-yellow-600 mt-1">¡Eres tú!</p>
          )}
        </div>

        {/* Completion Time */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-center gap-2">
            <Clock size={18} className="text-blue-600" />
            <span className="text-blue-800 font-medium">Tiempo:</span>
            <span className="text-xl font-bold text-blue-700">{formatTime(completionTime)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isCurrentPlayer ? (
            <button
              onClick={onNextChallenge}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <ArrowRight size={20} />
              Siguiente Reto
            </button>
          ) : (
            <div className="bg-gray-100 border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2">
              <Clock size={18} className="animate-spin" />
              Esperando al ganador...
            </div>
          )}
          
          <button
            onClick={onClose}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          {isCurrentPlayer 
            ? 'Presiona "Siguiente Reto" cuando estés listo para continuar'
            : `Esperando a que ${winner.username} inicie el siguiente reto`
          }
        </p>
      </div>
    </div>
  );
};

export default ChallengeWinOverlay;