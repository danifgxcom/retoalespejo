import { useEffect, useState } from 'react';
import { sound } from '../services/SoundService';

export function SoundControl() {
  const [enabled, setEnabled] = useState(sound.enabled);
  const [ambient, setAmbient] = useState(false);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('button')) return;
      void sound.unlock().then(() => sound.play('touch'));
    };
    const visibility = () => { if (document.hidden) sound.suspend(); else void sound.unlock(); };
    document.addEventListener('click', click);
    document.addEventListener('visibilitychange', visibility);
    return () => { document.removeEventListener('click', click); document.removeEventListener('visibilitychange', visibility); sound.setAmbient(false); };
  }, []);
  return <div className="sound-controls">
    <button type="button" className="sound-toggle" aria-pressed={enabled} aria-label={enabled ? 'Desactivar sonido' : 'Activar sonido'} onClick={() => { sound.setEnabled(!enabled); setEnabled(!enabled); setAmbient(false); }}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 10v4h4l5 4V6l-5 4H3Z" /><path d={enabled ? 'M16 8q5 4 0 8M19 5q7 7 0 14' : 'm16 9 6 6m0-6-6 6'} /></svg>
      <span>{enabled ? 'Sonido' : 'Silencio'}</span>
    </button>
    {enabled && <button type="button" className="ambient-toggle" aria-pressed={ambient} onClick={() => { sound.setAmbient(!ambient); setAmbient(!ambient); }}>Ambiente {ambient ? 'sí' : 'no'}</button>}
  </div>;
}
