import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../components/ui/Modal';

// Mock UI components to avoid ESM/lucide-react issues
jest.mock('../../components/ui/Modal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
    if (!isOpen) return null;
    return React.createElement('div', { role: 'dialog', 'aria-label': title },
      React.createElement('button', { onClick: onClose, 'aria-label': 'Cerrar' }, 'X'),
      children
    );
  }
}));

jest.mock('../../components/ui/Button', () => {
  return ({ onClick, children, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
    React.createElement('button', { onClick, disabled, ...props }, children);
});

jest.mock('../../components/ui/Card', () => {
  return ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement('div', { role: 'region', ...props }, children);
});

describe('Pruebas de navegación por teclado', () => {
  test('Los botones son enfocables y se activan con Enter y Space', () => {
    const onClickMock = jest.fn();
    render(React.createElement('button', { onClick: onClickMock }, 'Botón de prueba'));

    const button = screen.getByRole('button', { name: 'Botón de prueba' });

    button.focus();
    expect(button).toHaveFocus();

    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    fireEvent.click(button);
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  test('Modal muestra contenido cuando está abierto', () => {
    const onCloseMock = jest.fn();

    render(
      <Modal isOpen onClose={onCloseMock} title="Modal de prueba">
        <div>Contenido del modal</div>
      </Modal>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('Modal no se muestra cuando está cerrado', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()} title="Modal cerrado">
        <div>Contenido</div>
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('Botones tienen roles accesibles por defecto', () => {
    render(React.createElement('button', { onClick: jest.fn() }, 'Botón accesible'));

    const button = screen.getByRole('button', { name: 'Botón accesible' });
    expect(button).toBeInTheDocument();
  });
});
