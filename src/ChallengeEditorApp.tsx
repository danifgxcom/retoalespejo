import React, { useState, useEffect } from 'react';
import { ChallengeEditor } from './components/ChallengeEditor';
import { Challenge } from './components/ChallengeCard';
import { ChallengeEditorService } from './services/ChallengeEditorService';

interface ChallengeEditorAppProps {
  onClose?: () => void;
}

export const ChallengeEditorApp: React.FC<ChallengeEditorAppProps> = ({ onClose }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const editorService = ChallengeEditorService.getInstance();

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const loadedChallenges = await editorService.loadChallenges();
      setChallenges(loadedChallenges);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChallenge = async (challenge: Challenge) => {
    try {
      const success = await editorService.saveChallenge(challenge, challenges);
      if (success) {
        // Update local state
        const existingIndex = challenges.findIndex(c => c.id === challenge.id);
        if (existingIndex >= 0) {
          const updatedChallenges = [...challenges];
          updatedChallenges[existingIndex] = challenge;
          setChallenges(updatedChallenges);
        } else {
          setChallenges([...challenges, challenge]);
        }
        
        alert('Reto guardado exitosamente. Se ha descargado el archivo challenges.json actualizado.');
        setShowEditor(false);
        setSelectedChallenge(null);
      } else {
        alert('Error al guardar el reto. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error saving challenge:', error);
      alert('Error al guardar el reto. Por favor, inténtalo de nuevo.');
    }
  };

  const handleEditChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowEditor(true);
  };

  const handleDeleteChallenge = async (challengeId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este reto?')) {
      return;
    }

    try {
      const success = await editorService.deleteChallenge(challengeId, challenges);
      if (success) {
        setChallenges(challenges.filter(c => c.id !== challengeId));
        alert('Reto eliminado exitosamente. Se ha descargado el archivo challenges.json actualizado.');
      } else {
        alert('Error al eliminar el reto. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
      alert('Error al eliminar el reto. Por favor, inténtalo de nuevo.');
    }
  };

  const handleNewChallenge = () => {
    setSelectedChallenge(null);
    setShowEditor(true);
  };

  const handleExportChallenges = () => {
    editorService.exportChallenges(challenges);
  };

  const handleImportChallenges = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    editorService.importChallenges(file)
      .then(importedChallenges => {
        setChallenges(importedChallenges);
        alert('Retos importados exitosamente.');
      })
      .catch(error => {
        console.error('Error importing challenges:', error);
        alert(`Error al importar retos: ${error.message}`);
      });

    // Reset input
    event.target.value = '';
  };

  if (showEditor) {
    return (
      <ChallengeEditor
        existingChallenges={challenges}
        initialChallenge={selectedChallenge}
        onSave={handleSaveChallenge}
        onClose={() => {
          setShowEditor(false);
          setSelectedChallenge(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-4"></div>
          <div className="text-4xl mb-4">🎯</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Cargando Editor de Retos</h2>
          <p className="text-gray-600">Preparando la experiencia de edición...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">🎯 Editor de Retos</h1>
              <p className="text-gray-600">Crea y edita desafíos para el Reto al Espejo</p>
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleImportChallenges}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg cursor-pointer"
              >
                📥 Importar
              </label>
              <button
                onClick={handleExportChallenges}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                📤 Exportar
              </button>
              <button
                onClick={handleNewChallenge}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                ✨ Nuevo Reto
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  🔙 Volver al Juego
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map(challenge => (
              <div
                key={challenge.id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-all transform hover:scale-102 shadow-lg hover:shadow-xl h-80 flex flex-col"
              >
                {/* Header with ID and Title */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                      {challenge.id}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 truncate">
                      {challenge.name}
                    </h3>
                  </div>
                </div>
                
                {/* Challenge Thumbnail - Mini Canvas Preview */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-4 flex-1 flex items-center justify-center border border-blue-100">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🪞</div>
                    <div className="text-xs text-gray-600">
                      Patrón del Reto #{challenge.id}
                    </div>
                    <div className="mt-2 flex justify-center space-x-1">
                      {Array.from({ length: challenge.piecesNeeded }).map((_, i) => (
                        <div key={i} className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-red-500 rounded-sm"></div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-shrink-0">
                  {challenge.description}
                </p>
                
                {/* Stats */}
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <div className="text-xs">
                    <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-2 py-1 rounded-full font-medium">
                      {challenge.difficulty}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="bg-gradient-to-r from-emerald-400 to-green-500 text-white px-2 py-1 rounded-full font-medium">
                      {challenge.piecesNeeded} 🧩
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEditChallenge(challenge)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all transform hover:scale-105 text-sm font-medium shadow-md"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeleteChallenge(challenge.id)}
                    className="px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg transition-all transform hover:scale-105 text-sm font-medium shadow-md"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {challenges.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No hay retos disponibles</h3>
              <p className="text-gray-600 mb-6">Comienza creando tu primer desafío</p>
              <button
                onClick={handleNewChallenge}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                ✨ Crear tu primer reto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};