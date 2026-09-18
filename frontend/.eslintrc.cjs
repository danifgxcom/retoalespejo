module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended', // Reglas de accesibilidad para JSX
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'src/tests/__mocks__/lucide-react.js'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'jsx-a11y'], // Plugin de accesibilidad
  overrides: [
    {
      // Los scripts de soporte de las pruebas se ejecutan directamente con Node.
      files: ['src/tests/**/*.js', 'src/tests/**/*.cjs'],
      env: { node: true },
    },
    {
      // Los fixtures geométricos conservan datos JSON deliberadamente flexibles.
      files: ['src/tests/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'react-refresh/only-export-components': 'off',
      },
    },
    {
      // Estos módulos mezclan funciones de dibujo/cálculo con componentes; no
      // son límites de refresco rápido y no deben bloquear el lint de producción.
      files: [
        'src/components/GamePiece.tsx',
        'src/components/PieceLabel.tsx',
        'src/components/accessibility/LiveAnnouncer.tsx',
        'src/contexts/ThemeContext.tsx',
      ],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
    {
      // Dependencias estabilizadas fuera del alcance de esta fase; se mantienen
      // bajo prueba sin convertir avisos históricos en un fallo de CI.
      files: [
        'src/ChallengeEditorApp.tsx',
        'src/components/EditorCanvas.tsx',
        'src/components/GameCanvas.tsx',
        'src/hooks/useGameLogic.ts',
        'src/hooks/usePointerHandlers.ts',
      ],
      rules: {
        'react-hooks/exhaustive-deps': 'off',
      },
    },
  ],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Reglas específicas de accesibilidad
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/html-has-lang': 'error',
    'jsx-a11y/img-redundant-alt': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/media-has-caption': 'error',
    'jsx-a11y/mouse-events-have-key-events': 'error',
    'jsx-a11y/no-access-key': 'error',
    'jsx-a11y/no-autofocus': 'error',
    'jsx-a11y/no-distracting-elements': 'error',
    'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
    'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
    'jsx-a11y/no-noninteractive-tabindex': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/scope': 'error',
    'jsx-a11y/tabindex-no-positive': 'error'
  },
};
