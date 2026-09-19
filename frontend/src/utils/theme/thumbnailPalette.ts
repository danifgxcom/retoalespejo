/** The navy accessible piece must never share a navy ground. */
export function thumbnailPalette(highContrast: boolean, isDark: boolean, framed: boolean) {
  return {
    background: highContrast ? '#ffffff' : framed ? '#203d48' : isDark ? '#213a40' : '#faf7ed',
    outline: highContrast ? '#111111' : '#0f172a',
    outlineWidth: highContrast ? 1.6 : .85,
  };
}
