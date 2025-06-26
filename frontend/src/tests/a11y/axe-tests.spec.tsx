import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { Play } from 'lucide-react';

expect.extend(toHaveNoViolations);

describe('Pruebas de accesibilidad de componentes', () => {
  it('Button no debe tener violaciones de accesibilidad', async () => {
    const { container } = render(
      <Button variant="primary">Botón accesible</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Button con icono no debe tener violaciones de accesibilidad', async () => {
    const { container } = render(
      <Button variant="primary" icon={Play} ariaLabel="Iniciar juego">Iniciar</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Card no debe tener violaciones de accesibilidad', async () => {
    const { container } = render(
      <Card title="Tarjeta de ejemplo">
        <p>Contenido de la tarjeta</p>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Modal no debe tener violaciones de accesibilidad', async () => {
    const { container } = render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        title="Modal de ejemplo"
        aria={{ 
          labelledby: 'modal-title',
          describedby: 'modal-description'
        }}
      >
        <div id="modal-description">Descripción del modal para lectores de pantalla</div>
        <p>Contenido del modal</p>
      </Modal>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
