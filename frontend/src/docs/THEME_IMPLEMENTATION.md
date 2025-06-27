# Theme Implementation

## Overview
This document describes the implementation of the theme system in the application. The system supports two themes:
1. **Colorful Theme**: A vibrant theme with colors matching the game pieces and challenge thumbnails
2. **Accessible Theme**: A high-contrast theme that meets WCAG AA+ accessibility standards

## Components

### ThemeContext
The theme system is built around a React context that provides theme state and toggling functionality:

- Located at: `src/contexts/ThemeContext.tsx`
- Provides:
  - Current theme state (`'colorful'` or `'accessible'`)
  - `toggleTheme()` function to switch between themes
  - Persistence of theme preference in localStorage
  - Application of theme class to the document body

### ThemeSwitcher
A UI component that allows users to toggle between themes:

- Located at: `src/components/accessibility/ThemeSwitcher.tsx`
- Displays different icons and text based on the current theme
- Integrated into the GameControls component

## CSS Implementation

The theme system uses CSS variables to define colors and other visual properties for each theme:

- Located at: `src/styles/theme.css`
- Theme-specific variables are defined under:
  - `body.theme-colorful` for the colorful theme
  - `body.theme-accessible` for the accessible theme

## Usage

The theme system is integrated into the application as follows:

1. The `ThemeProvider` wraps the application in `main.tsx`
2. The `ThemeSwitcher` component is added to the GameControls component
3. Components use theme variables (e.g., `--game-bg`, `--card-bg`) instead of hardcoded colors

## How to Extend

To add new themed elements:

1. Define variables for both themes in `theme.css`
2. Use these variables in your component styles
3. Test with both themes to ensure proper contrast and visual hierarchy

## Accessibility Considerations

The accessible theme is designed to meet WCAG AA+ standards:
- Sufficient color contrast (4.5:1 for normal text, 3:1 for large text)
- Clear visual hierarchy
- Consistent use of color for interactive elements
- Support for high contrast mode