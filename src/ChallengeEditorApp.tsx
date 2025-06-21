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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando retos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Editor de Retos - Reto al Espejo</h1>
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
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
              >
                Importar
              </label>
              <button
                onClick={handleExportChallenges}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Exportar
              </button>
              <button
                onClick={handleNewChallenge}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Nuevo Reto
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Volver al Juego
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map(challenge => (
              <div
                key={challenge.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                    {challenge.name}
                  </h3>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    #{challenge.id}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {challenge.description}
                </p>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Dificultad:</span> {challenge.difficulty}
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Piezas:</span> {challenge.piecesNeeded}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditChallenge(challenge)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteChallenge(challenge.id)}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {challenges.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No hay retos disponibles.</p>
              <button
                onClick={handleNewChallenge}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Crear tu primer reto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};