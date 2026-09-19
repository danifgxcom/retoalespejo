import React, { useState } from 'react';
import { GAME_NAME } from '../branding';
import { MirrorMark, SymmetryArt } from './Identity';
import ThemeSwitcher from './accessibility/ThemeSwitcher';
import { SoundControl } from './SoundControl';
import Modal from './ui/Modal';
import { CampaignAtlas } from './CampaignAtlas';

interface StartupMenuProps {
  onStartOffline: () => void;
  onStartMultiplayer: () => void;
  isMultiplayerEnabled: boolean;
  onSelectChallenge?: (index: number) => void;
  onFreePlay: () => void;
}
const StartupMenu: React.FC<StartupMenuProps> = ({ onStartOffline, onStartMultiplayer, isMultiplayerEnabled, onSelectChallenge, onFreePlay }) => {
  const [guide, setGuide] = useState(false);
  return <main className="atelier-home">
    <header className="identity-header">
      <div className="wordmark"><MirrorMark /><span>{GAME_NAME}<small>GABINETE DE SIMETRÍA</small></span></div>
      <div className="identity-tools"><SoundControl /><ThemeSwitcher className="px-3 py-2 text-sm" /></div>
    </header>
    <section className="home-composition">
      <div className="home-copy">
        <p className="eyebrow"><span className="axis-dash" /> UN JUEGO DE MIRAR DOS VECES</p>
        <h1>Todo tiene<br />otra <em>mitad.</em></h1>
        <p className="home-description">Una pieza. Un espejo. Otra forma de pensar.<br />Mueve, gira y descubre lo que aparece al otro lado.</p>
        <div className="mode-options">
          <button className="mode-ticket primary-ticket" onClick={onStartOffline}>
            <span className="ticket-number">01</span><span><strong>Jugar solo</strong><small>A tu ritmo, pieza a pieza</small></span><span className="ticket-arrow" aria-hidden="true">↗</span>
          </button>
          <button className="mode-ticket free-ticket" onClick={onFreePlay}><span className="ticket-number">02</span><span><strong>Juego libre</strong><small>Tus tarjetas y seis nuevos aperitivos</small></span><span className="ticket-arrow" aria-hidden="true">↗</span></button>
          <button className="mode-ticket" onClick={onStartMultiplayer} disabled={!isMultiplayerEnabled}>
            <span className="ticket-number">03</span><span><strong>Multijugador</strong><small>{isMultiplayerEnabled ? 'Un mismo reto. Distintas miradas.' : 'No disponible'}</small></span><span className="ticket-arrow" aria-hidden="true">↗</span>
          </button>
        </div>
        <div className="home-links"><button className="text-link" onClick={() => setGuide(true)}>Cómo funciona <span aria-hidden="true">↗</span></button><CampaignAtlas onSelect={onSelectChallenge} /></div>
      </div>
      <figure className="home-art">
        <div className="art-caption"><span>ESTUDIO N.º 01</span><span>LA OTRA MITAD</span></div>
        <SymmetryArt />
        <figcaption><span className="art-seal">1 : 1</span><span>Lo que mueves aquí,<br /><strong>se transforma allí.</strong></span><span className="art-index">A / B</span></figcaption>
      </figure>
    </section>
    <footer className="home-footer"><span>OBSERVAR <i /> GIRAR <i /> REFLEJAR</span><span>Pequeñas piezas. Grandes descubrimientos.</span></footer>
    <Modal isOpen={guide} onClose={() => setGuide(false)} title="El arte de completar" subtitle="Tres gestos. Una nueva manera de mirar.">
      <div className="guide-steps">
        <p><b>01 · Observa</b>La ficha del reto muestra la figura que debes construir.</p>
        <p><b>02 · Compón</b>Arrastra las piezas al tablero. Gíralas y cambia su cara con los controles.</p>
        <p><b>03 · Refleja</b>Acerca las piezas al eje. Su reflejo completa la otra mitad. Comprueba cuando coincidan.</p>
      </div>
      <p className="keyboard-note">Con teclado: enfoca el tablero y consulta su guía de controles. Los números y colores identifican cada pieza.</p>
      <button className="brand-button" onClick={onStartOffline}>Empezar a descubrir ↗</button>
    </Modal>
  </main>;
};
export default StartupMenu;
