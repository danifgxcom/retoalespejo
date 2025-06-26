import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

describe('Pruebas de navegación por teclado', () => {
  test('Los botones son enfocables y se activan con Enter y Space', async () => {
    const user = userEvent.setup();
    const onClickMock = jest.fn();
    render(<Button onClick={onClickMock}>Botón de prueba</Button>);

    const button = screen.getByRole('button', { name: 'Botón de prueba' });

    // Verificar que el botón puede recibir foco
    button.focus();
    expect(button).toHaveFocus();

    // Verificar activación con tecla Enter
    await user.keyboard('{Enter}');
    expect(onClickMock).toHaveBeenCalledTimes(1);

    // Verificar activación con tecla Space
    await user.keyboard(' ');
    expect(onClickMock).toHaveBeenCalledTimes(2);
  });

  test('Modal atrapa el foco y responde a Escape', async () => {
    const user = userEvent.setup();
    const onCloseMock = jest.fn();

    render(
      <Modal 
        isOpen={true} 
        onClose={onCloseMock}
        title="Modal de prueba"
        aria={{
          labelledby: 'modal-title',
          describedby: 'modal-desc'
        }}
      >
        <div id="modal-desc">Descripción de prueba</div>
        <Button>Primer botón</Button>
        <Button>Segundo botón</Button>
        <Button>Tercer botón</Button>
      </Modal>
    );

    // Verificar que el foco está dentro del modal
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveFocus();

    // Verificar que el foco se mantiene dentro del modal al tabular
    await user.tab();
    expect(buttons[1]).toHaveFocus();
    await user.tab();
    expect(buttons[2]).toHaveFocus();
    await user.tab();
    // El foco debe volver al primer elemento
    expect(buttons[0]).toHaveFocus();

    // Verificar que Escape cierra el modal
    await user.keyboard('{Escape}');
    expect(onCloseMock).toHaveBeenCalled();
  });
});
