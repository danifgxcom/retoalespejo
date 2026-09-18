// `apca-w3` no trae tipos. Declaración mínima con lo que usan los tests de contraste.
declare module 'apca-w3' {
  /** Contraste APCA entre texto y fondo, en Lc (-108..106). */
  export function calcAPCA(textColor: string | number[], backgroundColor: string | number[]): number;
  export function sRGBtoY(color: string | number[]): number;
}
