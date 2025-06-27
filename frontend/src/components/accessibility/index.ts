/**
 * Accessibility Components
 * 
 * This file exports all accessibility-related components for easier imports.
 * 
 * Usage:
 * ```tsx
 * import { SkipLink, ThemeSwitcher } from '@/components/accessibility';
 * ```
 */
import SkipLink from './SkipLink';
import VisuallyHidden from './VisuallyHidden';
import { LiveRegion, useAnnounce } from './LiveAnnouncer';
import ThemeSwitcher from './ThemeSwitcher';

export {
  SkipLink,
  VisuallyHidden,
  LiveRegion,
  useAnnounce,
  ThemeSwitcher
};

// Export additional accessibility components as they are created
// export { default as ScreenReaderText } from './ScreenReaderText';
// export { default as FocusTrap } from './FocusTrap';
