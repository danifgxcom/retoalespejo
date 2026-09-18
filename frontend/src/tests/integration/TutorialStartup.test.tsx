import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { useGameLogic } from '../../hooks/useGameLogic';
import { ThemeProvider } from '../../contexts/ThemeContext';
import TutorialOverlay from '../../components/TutorialOverlay';

/**
 * F06: monta el tutorial sobre el hook REAL (useGameLogic), sin props ya
 * resueltas a mano, para reproducir la carrera de arranque real: challenges
 * llega por fetch asíncrono, y sólo tras un segundo efecto se generan las
 * piezas del Reto 1. Un test que le pasara `pieces`/`challenges` ya listos
 * no habría detectado un fallo de cableado en ese arranque.
 *
 * No se monta `MirrorChallengeGame` directamente: ese componente (y
 * `GameControls`/`SocketService`, a los que también afecta) usa
 * `import.meta.env.DEV` a nivel de módulo, sintaxis que la configuración
 * actual de ts-jest (module: CommonJS) no puede transpilar - una limitación
 * de la suite ya existente antes de F06, no algo introducido aquí. Por eso
 * la app completa no tiene ningún test de montaje en este repo (ver
 * RightSidebarHost.test.tsx, que sortea el mismo problema haciendo
 * jest.mock de SocketService). El montaje de extremo a extremo (menú de
 * arranque real, clic en "Jugar Solo", bundle de producción real) se
 * verificó a mano con Chromium headless sobre `vite preview` - ver el
 * resumen de la tarea.
 */
const realChallenges = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../../shared/challenges.json'), 'utf-8')
);

global.fetch = jest.fn();

const Harness: React.FC = () => {
  const { pieces, currentChallenge, challenges, geometry } = useGameLogic();
  return (
    <div style={{ position: 'relative' }}>
      {/* Señal de "ya terminó de cargar" para que los tests esperen al dato
          real (fetch resuelto + piezas generadas) en vez de un timeout fijo. */}
      <span data-testid="loaded-pieces-count">{challenges.length > 0 ? pieces.length : -1}</span>
      <TutorialOverlay
        pieces={pieces}
        currentChallenge={currentChallenge}
        challenges={challenges}
        geometry={geometry}
      />
    </div>
  );
};

const renderHarness = () => render(
  <ThemeProvider>
    <Harness />
  </ThemeProvider>
);

describe('Tutorial F06: arranque real (fetch asíncrono + useGameLogic real)', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(realChallenges)
    });
  });

  test('con localStorage vacío, el tutorial del Reto 1 se monta tras la carga asíncrona de challenges', async () => {
    renderHarness();

    // Antes de que resuelva el fetch, el tutorial todavía no puede mostrarse
    // (challenges/pieces siguen vacíos) - si esta primera evaluación a false
    // no se recuperase al llegar los datos, este findBy no encontraría nada.
    const tutorialCard = await screen.findByText(/mueve la pieza/i, {}, { timeout: 5000 });
    expect(tutorialCard).toBeInTheDocument();

    const region = tutorialCard.closest('[role="status"]');
    expect(region).not.toBeNull();
    expect(within(region as HTMLElement).getByRole('button', { name: /saltar tutorial/i })).toBeInTheDocument();
    expect(within(region as HTMLElement).getByText(/paso 1 de 3/i)).toBeInTheDocument();
  });

  test('si el tutorial ya se marcó como visto, no aparece aunque el Reto 1 esté activo', async () => {
    localStorage.setItem('reto-al-espejo:tutorial-seen:v1', '1');
    renderHarness();

    // Espera a que termine la carga real (mismo dato que revela el tutorial
    // en el test anterior) antes de comprobar que, esta vez, no aparece.
    await screen.findByText('1', { selector: '[data-testid="loaded-pieces-count"]' }, { timeout: 5000 });

    expect(screen.queryByText(/mueve la pieza/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /saltar tutorial/i })).not.toBeInTheDocument();
  });
});
