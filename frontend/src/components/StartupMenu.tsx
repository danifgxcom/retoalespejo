import React from 'react';
import { User, Users, Play } from 'lucide-react';

interface StartupMenuProps {
  onStartOffline: () => void;
  onStartMultiplayer: () => void;
  isMultiplayerEnabled: boolean;
}

const StartupMenu: React.FC<StartupMenuProps> = ({
  onStartOffline,
  onStartMultiplayer,
  isMultiplayerEnabled
}) => {
  return (
    <div className="h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🪞 Reto al Espejo
          </h1>
          <p className="text-gray-600 text-sm">
            Basado en el juego original de Educa
          </p>
        </div>

        {/* Game Modes */}
        <div className="space-y-4">
          {/* Offline Mode */}
          <button
            onClick={onStartOffline}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <User size={24} />
            <div className="text-left">
              <div className="font-bold text-lg">Jugar Solo</div>
              <div className="text-sm opacity-90">Modo individual clásico</div>
            </div>
            <Play size={20} className="ml-auto" />
          </button>

          {/* Multiplayer Mode */}
          <button
            onClick={isMultiplayerEnabled ? onStartMultiplayer : undefined}
            disabled={!isMultiplayerEnabled}
            className={`w-full p-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 ${
              isMultiplayerEnabled
                ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Users size={24} />
            <div className="text-left">
              <div className="font-bold text-lg">Multijugador</div>
              <div className="text-sm opacity-90">
                {isMultiplayerEnabled ? 'Jugar con amigos online' : 'Próximamente disponible'}
              </div>
            </div>
            {isMultiplayerEnabled ? (
              <Play size={20} className="ml-auto" />
            ) : (
              <div className="ml-auto text-xs bg-gray-400 px-2 py-1 rounded">SOON</div>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Puzzle de geometría y simetría
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Desarrolla tu visión espacial
          </p>
        </div>
      </div>
    </div>
  );
};

export default StartupMenu;