import { useEffect, useRef, useState } from 'react';
import socketService, { Player } from '../services/SocketService';
import { MirrorMark } from './Identity';

interface Props {
  roomId: string | null;
  players: Player[];
  hostId: string | null;
  error: string | null;
  onClearError: () => void;
  onExit: () => void;
}

export default function MultiplayerLobby({ roomId, players, hostId, error, onClearError, onExit }: Props) {
  const [username, setUsername] = useState(() => socketService.getUsername() || '');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [connected, setConnected] = useState(socketService.isConnected());
  const [localError, setLocalError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const title = useRef<HTMLHeadingElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);
  const ownId = socketService.getSocketId();
  const isHost = hostId !== null && hostId === ownId;
  const message = localError || error;

  useEffect(() => { title.current?.focus(); setPending(false); }, [roomId]);
  useEffect(() => { if (error) setPending(false); }, [error]);
  useEffect(() => {
    if (!pending) return;
    const timeout = window.setTimeout(() => { setPending(false); setLocalError('No hemos recibido respuesta. Comprueba la conexión y vuelve a intentarlo.'); }, 10000);
    return () => window.clearTimeout(timeout);
  }, [pending]);
  useEffect(() => {
    const socket = socketService.socketInstance;
    const online = () => { setConnected(true); setLocalError(''); };
    const offline = () => { setConnected(false); setPending(false); };
    socket?.on('connect', online);
    socket?.on('disconnect', offline);
    socket?.on('connect_error', offline);
    return () => { socket?.off('connect', online); socket?.off('disconnect', offline); socket?.off('connect_error', offline); };
  }, []);

  const submit = (action: 'create' | 'join') => {
    onClearError(); setLocalError('');
    if (!connected || pending) return;
    if (!username.trim() || username.trim().length > 32) { setLocalError('Escribe un nombre de entre 1 y 32 caracteres.'); document.getElementById('lobby-name')?.focus(); return; }
    if (action === 'join' && !/^[A-Za-z0-9_-]{1,64}$/.test(code.trim())) { setLocalError('Introduce el código completo de la sala, sin espacios.'); codeInput.current?.focus(); return; }
    setPending(true);
    if (action === 'create') socketService.createRoom(username.trim());
    else socketService.joinRoom(code.trim(), username.trim());
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(roomId!); setCopyStatus('Código copiado. Compártelo con quienes van a jugar.'); }
    catch { codeInput.current?.focus(); codeInput.current?.select(); setCopyStatus('Selecciona y copia el código para compartirlo.'); }
  };

  return <section className="multiplayer-lobby" aria-labelledby="lobby-title">
    <div className="lobby-heading"><p className="eyebrow">GABINETE COMPARTIDO / {roomId ? '02 · REUNIRSE' : '01 · ENTRAR'}</p>
      <h2 id="lobby-title" ref={title} tabIndex={-1}>{roomId ? 'La mesa está preparada.' : 'Una mesa. Varias miradas.'}</h2>
      <p>{roomId ? 'Comparte el código, reúne a los jugadores y comenzad juntos.' : 'Crea una sala para invitar o entra con el código que te hayan compartido.'}</p>
    </div>
    <p className="lobby-connection" role="status">{connected ? 'Conexión establecida' : 'Conectando con el servidor…'}{pending ? ' · Esperando respuesta…' : ''}</p>
    {!connected && <p className="lobby-notice">Si la conexión no vuelve, regresa al inicio y entra de nuevo. No se enviarán acciones mientras estés sin conexión.</p>}
    {message && <p className="lobby-error" role="alert">{message}</p>}
    {!roomId ? <>
      <label className="lobby-name" htmlFor="lobby-name">Tu nombre en la mesa<input id="lobby-name" value={username} onChange={e => setUsername(e.target.value)} maxLength={32} autoComplete="nickname" aria-describedby={message ? 'lobby-form-help' : undefined} placeholder="Cómo te llamas" /></label>
      <span id="lobby-form-help" className="sr-only">{message || 'El nombre es obligatorio para crear o entrar en una sala.'}</span>
      <div className="lobby-choices">
        <article className="lobby-invitation"><MirrorMark /><p className="eyebrow">TÚ INVITAS</p><h3>Crear una sala</h3><p>Recibirás un código para compartir. Como anfitrión, tú decides cuándo empezar.</p><button className="brand-button" disabled={!connected || pending} onClick={() => submit('create')}>Crear sala</button></article>
        <form className="lobby-invitation" onSubmit={e => { e.preventDefault(); submit('join'); }}><p className="eyebrow">TIENES UNA INVITACIÓN</p><h3>Entrar con código</h3><label htmlFor="lobby-code">Código de la sala<input ref={codeInput} id="lobby-code" value={code} onChange={e => setCode(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={64} placeholder="Pega aquí el código" /></label><button className="brand-button" disabled={!connected || pending} type="submit">Entrar en la sala</button></form>
      </div>
    </> : <div className="lobby-waiting">
      <div className="lobby-pass"><MirrorMark /><p className="eyebrow">INVITACIÓN / HASTA 16 MIRADAS</p><label htmlFor="lobby-share-code">Código de vuestra sala</label><input ref={codeInput} id="lobby-share-code" readOnly value={roomId} onFocus={e => e.target.select()} /><button className="brand-button" onClick={copy}>Copiar código</button><p role="status" className="lobby-copy-status">{copyStatus || 'Cada jugador entra desde Multijugador → Entrar con código.'}</p></div>
      <div className="lobby-roster"><h3>En la mesa <span>{players.length} / 16</span></h3><ul aria-label="Jugadores en la sala">{players.map((player, i) => <li key={player.id}><span className="lobby-seat" aria-hidden="true">0{i + 1}</span><span>{player.username}<small>{player.id === hostId ? 'Anfitrión' : 'Invitado'}{player.id === ownId ? ' · Tú' : ''}</small></span></li>)}</ul>
        <p role="status">{players.length < 2 ? 'Hace falta al menos otro jugador para empezar.' : isHost ? 'Ya podéis empezar. El resto verá la misma cuenta atrás.' : 'Esperando a que el anfitrión comience la partida.'}</p>
        {isHost && <button className="brand-button" disabled={players.length < 2 || !connected || pending} onClick={() => { onClearError(); setPending(true); socketService.startGame(); }}>Comenzar partida</button>}
      </div>
    </div>}
    <footer className="lobby-footer"><button className="text-link" onClick={onExit}>{roomId ? 'Salir de la sala' : 'Volver al inicio'}</button><span>2–16 jugadores · Un mismo reto · Cada cual su tablero</span></footer>
  </section>;
}
