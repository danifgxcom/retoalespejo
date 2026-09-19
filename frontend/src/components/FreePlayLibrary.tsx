import { useState } from 'react';
import campaignData from '../../../shared/challenges.json';
import tastersData from '../../../shared/free-challenges.json';
import type { Challenge } from './ChallengeCard';
import { loadGameProgress } from '../utils/progress/gameProgress';
import { buildFreeDeck } from '../utils/progress/freePlay';
import { collections, collectionEntries } from '../utils/progress/collections';
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
  const completed = loadGameProgress('free').completed;
  const baseDeck = buildFreeDeck(campaign, tasters, loadGameProgress().completed);
  const entries = collectionEntries(completed);
  const deck = [...baseDeck, ...entries.filter(e => e.available).map(e => e.card)];
  const catalog = [...baseDeck, ...entries.map(e => e.card)];
  const available = new Set(deck.map(c => c.id));
  const tasterIds = new Set(tasters.map(c => c.id));
  const campaignIds = new Set(campaign.map(c => c.id));
  const filtered = catalog.filter(c => (source === 'all' || (source === 'campaign' ? campaignIds.has(c.id) : source === 'tasters' ? tasterIds.has(c.id) : entries.some(e => e.card.id === c.id && e.collectionId === source))) && (count === 'all' || c.piecesNeeded === Number(count)));
  const pages = Math.max(1, Math.ceil(filtered.length / 4));
  const currentPage = Math.min(page, pages - 1);
  return <Modal isOpen={open} onClose={onClose} title="Mesa de juego libre" subtitle="Sin reloj. Dos entradas abiertas por colección; resuélvelas para descubrir las siguientes. Tu campaña queda intacta." maxWidth="4xl">
    <div className="free-filters">
      <label>Tarjetas<select value={source} onChange={e => { setSource(e.target.value); setPage(0); }}>
        <option value="all">Todo el catálogo</option><option value="campaign">Campaña desbloqueada</option><option value="tasters">Los seis aperitivos originales</option>
        {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></label>
      <label>Dificultad<select value={count} onChange={e => { setCount(e.target.value); setPage(0); }}>
        <option value="all">Todas las dificultades</option><option value="1">1 pieza · Principiante</option><option value="2">2 piezas · Fácil</option><option value="3">3 piezas · Intermedio</option><option value="4">4 piezas · Difícil</option>
      </select></label>
    </div>
    <p className="free-count" aria-live="polite">{filtered.length} tarjetas · {filtered.filter(c => available.has(c.id)).length} disponibles · {filtered.filter(c => completed.includes(c.id)).length} resueltas aquí</p>
    <div className="atlas-grid free-grid">
      {filtered.slice(currentPage * 4, currentPage * 4 + 4).map(card => <article key={card.id} className="atlas-card">
        <div className="atlas-index"><span>{!available.has(card.id) ? 'POR DESCUBRIR' : tasterIds.has(card.id) ? 'APERITIVO' : 'DISPONIBLE'}</span><span>{card.piecesNeeded} {card.piecesNeeded === 1 ? 'PIEZA' : 'PIEZAS'}</span></div>
        <ChallengeThumbnail challenge={card} width={320} height={230} backgroundColor="ink" />
        <h3>{card.name}</h3><p>{card.description}</p>
        <small className="free-origin">{card.chapter} · {Array.from(new Set(card.objective.playerPieces.map(p => p.type))).join(' + ')}</small>
        <button className="brand-button" disabled={!available.has(card.id)} aria-describedby={!available.has(card.id) ? `unlock-${card.id}` : undefined} onClick={() => { const index = deck.findIndex(c => c.id === card.id); if (index >= 0) onSelect(deck, index); }}>{!available.has(card.id) ? 'Aún por desbloquear' : completed.includes(card.id) ? 'Volver a jugar' : 'Jugar esta tarjeta'}</button>
        {!available.has(card.id) && <small id={`unlock-${card.id}`} className="free-origin">Antes: {entries.find(e => e.card.id === card.id)?.requirement[0]}</small>}
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
