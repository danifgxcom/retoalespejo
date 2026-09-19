import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number | string };
export type LucideIcon = React.FC<IconProps>;
const icon = (path: string): LucideIcon => {
  const Glyph: LucideIcon = ({ size = 24, ...props }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" {...props}><path d={path} /></svg>;
  return Glyph;
};
// Drafting marks: open corners, squared terminals, reflection axes.
export const X = icon('m6 6 12 12M18 6 6 18');
export const Check = icon('m4 12 5 5L20 5');
export const CheckCircle = icon('M20 13v7H4V4h11M8 11l4 4L21 4');
export const XCircle = icon('M4 4h16v16H4ZM8 8l8 8m0-8-8 8');
export const RotateCw = icon('M17 3h5v5m0-5-5 5M19 12a7 7 0 1 1-7-7M9 9h6v6H9Z');
export const RotateCcw = icon('M7 3H2v5m0-5 5 5M5 12a7 7 0 1 0 7-7M9 9h6v6H9Z');
export const RefreshCw = RotateCw;
export const FlipHorizontal = icon('M12 2v20M3 6h5v12H3ZM21 6h-5v12h5Z');
export const FlipVertical = icon('M2 12h20M6 3h12v5H6ZM6 21h12v-5H6Z');
export const SkipForward = icon('m5 5 10 7-10 7ZM19 4v16');
export const SkipBack = icon('m19 5-10 7 10 7ZM5 4v16');
export const ArrowRight = icon('M3 12h17m-7-7 7 7-7 7');
export const HelpCircle = icon('M4 4h16v16H4ZM9 8c0-3 6-3 6 0 0 2-3 2-3 5m0 3v1');
export const Upload = icon('M4 14v6h16v-6M12 16V3m-5 5 5-5 5 5');
export const Save = icon('M4 4h13l3 3v13H4ZM8 4v6h8V4M8 20v-6h8v6');
export const Edit = icon('M3 21h18M5 16l1-5L17 1l5 5-11 10ZM14 4l5 5');
export const Camera = icon('M3 7h5l2-3h5l2 3h4v13H3ZM9 11h6v6H9Z');
export const Bug = icon('M8 5h8v15H8ZM3 8h5m8 0h5M3 14h5m8 0h5M10 5V2m4 3V2M12 8v9');
export const Grid3x3 = icon('M3 3h18v18H3ZM9 3v18m6-18v18M3 9h18M3 15h18');
export const Undo2 = icon('M9 4 3 10l6 6M3 10h12a5 5 0 0 1 0 10');
export const Redo2 = icon('m15 4 6 6-6 6m6-6H9a5 5 0 0 0 0 10');
export const Clock = icon('M5 3h14l3 9-3 9H5l-3-9ZM12 6v7h5');
export const Users = icon('M2 7h7v7H2Zm13 0h7v7h-7ZM1 21v-4h9v4m4 0v-4h9v4M12 2v20');
export const User = icon('M8 3h8v8H8ZM4 21v-6h16v6');
export const Play = icon('m6 3 15 9-15 9Z');
export const Pause = icon('M6 3v18M18 3v18');
export const Link = icon('m9 15 6-6M7 13l-3 3 4 4 5-5m-2-6 5-5 4 4-3 3');
export const Plus = icon('M12 3v18M3 12h18');
export const Trash2 = icon('M3 6h18M9 6V3h6v3M6 6v15h12V6M10 10v7m4-7v7');
export const Trophy = icon('M12 2v20M3 6h6v12H3l4-6Zm18 0h-6v12h6l-4-6Z');
