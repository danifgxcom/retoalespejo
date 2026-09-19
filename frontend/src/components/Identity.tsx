import { PIECE_PARTS } from '@reto/geometry';

export function MirrorMark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path d="M7 16h20v32H7l16-16Z" fill="currentColor" />
    <path d="M57 16H37v32h20L41 32Z" fill="currentColor" opacity=".55" />
    <path d="M32 5v54" stroke="currentColor" strokeWidth="2" />
  </svg>;
}

export function SymmetryArt({ className = '', incomplete = false }: { className?: string; incomplete?: boolean }) {
  return <svg viewBox="0 0 560 460" className={`symmetry-art ${className}`} role="img" aria-label="Una pieza roja y dorada se encuentra con su reflejo para completar una figura simétrica">
    <circle cx="280" cy="230" r="190" fill="none" stroke="currentColor" opacity=".15" />
    <circle cx="280" cy="230" r="145" fill="none" stroke="currentColor" opacity=".12" strokeDasharray="2 7" />
    <path d="M35 230h490M280 24v412" stroke="currentColor" opacity=".16" />
    {[0, 1].map(side => <g key={side} className={side ? 'reflected-half' : 'original-half'} transform={side ? `translate(${incomplete ? 590 : 560} 0) scale(-1 1)` : undefined}>
      <g transform="translate(50 305) scale(92 -92)">
        {PIECE_PARTS.map((part, i) => <polygon key={i} points={part.units.map(p => p.join(',')).join(' ')} fill={part.kind === 'center' ? '#edb935' : '#c74732'} stroke="#172d38" strokeWidth=".018" />)}
      </g>
    </g>)}
    <path d="M280 28v404" stroke="currentColor" strokeWidth="2" />
    <path d="m275 35 5-9 5 9m-10 390 5 9 5-9" fill="none" stroke="currentColor" />
    <g fill="currentColor" fontFamily="monospace" fontSize="11" letterSpacing="2">
      <text x="43" y="398">01 / PIEZA</text><text x="368" y="398">02 / REFLEJO</text>
      <text x="299" y="55">EJE DE SIMETRÍA</text>
    </g>
    <g stroke="currentColor" opacity=".45"><path d="M32 38h16m-8-8v16M512 414h16m-8-8v16" /></g>
  </svg>;
}
