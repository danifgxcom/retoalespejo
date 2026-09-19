import { useState } from 'react';
import campaignData from '../../../shared/challenges.json';
import tastersData from '../../../shared/free-challenges.json';
import type { Challenge } from './ChallengeCard';
import { loadGameProgress } from '../utils/progress/gameProgress';
import { buildFreeDeck } from '../utils/progress/freePlay';
import ChallengeThumbnail from './ui/ChallengeThumbnail';
import Modal from './ui/Modal';

export default function FreePlayLibrary({ open, onClose, onSelect }: {
  open: boolean; onClose: () => void; onSelect: (deck: Challenge[], index: number) => void;
}) {
  const [source, setSource] = useState('all');
  const [count, setCount] = useState('all');
  const [page, setPage] = useState(0);
  const campaign = campaignData as Challenge[];
  const tasters = tastersData as Challenge[];
  const deck = buildFreeDeck(campaign, tasters, loadGameProgress().completed);
  const completed = loadGameProgress('free').completed;
  const tasterIds = new Set(tasters.map(c => c.id));
  const filtered = deck.filter(c => (source === 'all' || (source === 'tasters' ? tasterIds.has(c.id) : !tasterIds.has(c.id))) && (count === 'all' || c.piecesNeeded === Number(count)));
  const pages = Math.max(1, Math.ceil(filtered.length / 4));
  const currentPage = Math.min(page, pages - 1);
  return <Modal isOpen={open} onClose={onClose} title="Mesa de juego libre" subtitle="Elige una figura. Sin orden obligatorio ni cuenta atrás. Tu campaña queda intacta." maxWidth="4xl">
    <div className="free-filters">
      <label>Tarjetas<select value={source} onChange={e => { setSource(e.target.value); setPage(0); }}>
        <option value="all">Todas las disponibles</option><option value="campaign">Campaña desbloqueada</option><option value="tasters">Aperitivos · nuevas colecciones</option>
      </select></label>
      <label>Dificultad<select value={count} onChange={e => { setCount(e.target.value); setPage(0); }}>
        <option value="all">Todas las dificultades</option><option value="1">1 pieza · Principiante</option><option value="2">2 piezas · Fácil</option><option value="3">3 piezas · Intermedio</option><option value="4">4 piezas · Difícil</option>
      </select></label>
    </div>
    <p className="free-count" aria-live="polite">{filtered.length} tarjetas disponibles · Resueltas aquí: {filtered.filter(c => completed.includes(c.id)).length}</p>
    <div className="atlas-grid free-grid">
      {filtered.slice(currentPage * 4, currentPage * 4 + 4).map(card => <article key={card.id} className="atlas-card">
        <div className="atlas-index"><span>{tasterIds.has(card.id) ? 'APERITIVO' : 'DESBLOQUEADA'}</span><span>{card.piecesNeeded} {card.piecesNeeded === 1 ? 'PIEZA' : 'PIEZAS'}</span></div>
        <ChallengeThumbnail challenge={card} width={320} height={230} backgroundColor="ink" />
        <h3>{card.name}</h3><p>{card.description}</p>
        <small className="free-origin">{card.chapter} · {Array.from(new Set(card.objective.playerPieces.map(p => p.type))).join(' + ')}</small>
        <button className="brand-button" onClick={() => onSelect(deck, deck.findIndex(c => c.id === card.id))}>{completed.includes(card.id) ? 'Volver a jugar' : 'Jugar esta tarjeta'}</button>
      </article>)}
    </div>
    {filtered.length === 0 && <p className="free-empty">Todavía no tienes tarjetas con esta combinación. Prueba otra dificultad o completa más estudios de campaña.</p>}
    <nav className="free-pagination" aria-label="Páginas de tarjetas">
      <button className="text-link" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Anterior</button>
      <span aria-live="polite">Página {currentPage + 1} de {pages}</span>
      <button className="text-link" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Siguiente</button>
    </nav>
  </Modal>;
}
