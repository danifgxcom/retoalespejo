import React, { useEffect } from 'react';
import Modal from './ui/Modal';
import { SymmetryArt } from './Identity';
import { sound } from '../services/SoundService';

interface ChallengeWinOverlayProps {
  winner: { id: string; username: string };
  completionTime: number;
  isCurrentPlayer: boolean;
  onNextChallenge: () => void;
  onClose: () => void;
}
const ChallengeWinOverlay: React.FC<ChallengeWinOverlayProps> = ({ winner, completionTime, isCurrentPlayer, onNextChallenge, onClose }) => {
  useEffect(() => { sound.play('success'); }, []);
  const seconds = Number.isFinite(completionTime) ? Math.max(0, completionTime) : 0;
  const time = Math.floor(seconds / 60).toString().padStart(2, '0') + ':' + Math.floor(seconds % 60).toString().padStart(2, '0');
  return <Modal isOpen onClose={onClose} title="Simetría encontrada">
    <div className="success-sheet">
      <SymmetryArt />
      <p className="eyebrow">ESTUDIO COMPLETADO</p>
      <h2>{isCurrentPlayer ? 'Tu mirada lo ha resuelto.' : 'Las dos mitades encajan.'}</h2>
      <p>Reto completado por <strong>{winner.username}</strong></p>
      <span className="result-time" aria-label="Tiempo de finalización">{time}</span>
      <button className="brand-button" onClick={onNextChallenge} aria-label="Continuar al siguiente reto">Listo para el siguiente ↗</button>
      <button className="text-link" onClick={onClose}>Volver al tablero</button>
    </div>
  </Modal>;
};
export default ChallengeWinOverlay;
