import React from 'react'
import ReactDOM from 'react-dom/client'
import MirrorChallengeGame from './MirrorChallengeGame.tsx'
import './index.css'
import './styles/theme.css' // Accessible color theme system
import './styles/accessibility.css' // Global accessibility styles
import { ThemeProvider } from './contexts/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <MirrorChallengeGame />
    </ThemeProvider>
  </React.StrictMode>,
)
