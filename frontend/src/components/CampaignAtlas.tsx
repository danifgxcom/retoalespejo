import React, { useState } from 'react';
import campaignData from '../../../shared/challenges.json';
import { Challenge } from './ChallengeCard';
import ChallengeThumbnail from './ui/ChallengeThumbnail';
import Modal from './ui/Modal';
import { loadGameProgress } from '../utils/progress/gameProgress';
import { computeCampaignNavigation } from '../utils/progress/campaignNavigation';

const campaign = campaignData as Challenge[];
export const CampaignAtlas: React.FC<{ onSelect?: (index: number) => void; className?: string }> = ({ onSelect, className = 'text-link' }) => {
  const [open, setOpen] = useState(false);
  const [chapter, setChapter] = useState(0);
  const completed = loadGameProgress().completed;
  const indices = new Set(campaign.flatMap((c, i) => completed.includes(c.id) ? [i] : []));
  const { maxUnlockedChallenge } = computeCampaignNavigation(0, indices, campaign.length);
  const studies = campaign.slice(chapter * 4, chapter * 4 + 4);
  return <>
    <button type="button" className={className} onClick={() => setOpen(true)}>La colección <span aria-hidden="true">↗</span></button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Un gabinete de pequeñas maravillas" subtitle="16 figuras · 4 cuadernos · una nueva dificultad cada cuatro retos" maxWidth="4xl">
      <div className="chapter-tabs" role="group" aria-label="Cuadernos de la campaña">
        {[0, 1, 2, 3].map(i => <button key={i} aria-pressed={chapter === i} onClick={() => setChapter(i)}><span>0{i + 1}</span>{campaign[i * 4].chapter}</button>)}
      </div>
      <p className="chapter-skill">{studies[0].skill}</p>
      <div className="atlas-grid">
        {studies.map((study, i) => {
          const index = chapter * 4 + i;
          const unlocked = index <= maxUnlockedChallenge;
          return <article className="atlas-card" key={study.id}>
            <div className="atlas-index"><span>ESTUDIO {String(index + 1).padStart(2, '0')}</span><span>{study.piecesNeeded} {study.piecesNeeded === 1 ? 'PIEZA' : 'PIEZAS'}</span></div>
            <ChallengeThumbnail challenge={study} width={320} height={230} backgroundColor="ink" />
            <h3>{study.name}</h3><p>{study.description}</p>
            <button className="brand-button" disabled={!unlocked || !onSelect} onClick={() => { setOpen(false); onSelect?.(index); }}>
              {completed.includes(study.id) ? 'Volver a explorar' : unlocked ? 'Explorar figura' : `Completa el estudio ${index}`}
            </button>
          </article>;
        })}
      </div>
    </Modal>
  </>;
};
