import React from 'react';
import { User, Users, Play } from 'lucide-react';
import { GAME_NAME, GAME_TAGLINE } from '../branding';

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
    <div
      className="min-h-[100dvh] flex items-center justify-center p-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div
        className="rounded-2xl shadow-2xl p-8 max-w-md w-full"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-light)' }}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            🪞 {GAME_NAME}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {GAME_TAGLINE}
          </p>
        </div>

        {/* Game Modes */}
        <div className="space-y-4">
          {/* Offline Mode */}
          <button
            onClick={onStartOffline}
            className="w-full p-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
            style={{ backgroundColor: 'var(--button-primary-bg)', color: 'var(--text-on-primary)' }}
          >
            <User size={24} aria-hidden="true" />
            <div className="text-left">
              <div className="font-bold text-lg">Jugar Solo</div>
              <div className="text-sm opacity-90">Modo individual clásico</div>
            </div>
            <Play size={20} className="ml-auto" aria-hidden="true" />
          </button>

          {/* Multiplayer Mode */}
          <button
            onClick={isMultiplayerEnabled ? onStartMultiplayer : undefined}
            disabled={!isMultiplayerEnabled}
            className={`w-full p-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 ${
              isMultiplayerEnabled ? 'shadow-lg hover:shadow-xl transform hover:scale-105' : 'cursor-not-allowed opacity-60'
            }`}
            style={{
              backgroundColor: isMultiplayerEnabled ? 'var(--button-secondary-bg)' : 'var(--bg-disabled)',
              color: isMultiplayerEnabled ? 'var(--text-on-secondary)' : 'var(--text-disabled)',
            }}
          >
            <Users size={24} aria-hidden="true" />
            <div className="text-left">
              <div className="font-bold text-lg">Multijugador</div>
              <div className="text-sm opacity-90">
                {isMultiplayerEnabled ? 'Jugar con amigos online' : 'Próximamente disponible'}
              </div>
            </div>
            {isMultiplayerEnabled ? (
              <Play size={20} className="ml-auto" aria-hidden="true" />
            ) : (
              <div
                className="ml-auto text-xs px-2 py-1 rounded"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
              >
                SOON
              </div>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6" style={{ borderTop: '1px solid var(--border-light)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Inspirado en un clásico de puzles de simetría
          </p>
        </div>
      </div>
    </div>
  );
};

export default StartupMenu;
