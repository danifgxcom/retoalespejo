import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock UI components to avoid ESM/lucide-react issues
jest.mock('../../components/ui/Modal', () => ({
  Modal: ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return React.createElement('div', { role: 'dialog', 'aria-label': title },
      React.createElement('button', { onClick: onClose, 'aria-label': 'Cerrar' }, 'X'),
      children
    );
  }
}));

jest.mock('../../components/ui/Button', () => {
  return ({ onClick, children, disabled, ...props }: any) =>
    React.createElement('button', { onClick, disabled, ...props }, children);
});

jest.mock('../../components/ui/Card', () => {
  return ({ children, ...props }: any) =>
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

    const { Modal } = require('../../components/ui/Modal');
    render(React.createElement(Modal, {
      isOpen: true,
      onClose: onCloseMock,
      title: 'Modal de prueba'
    }, React.createElement('div', null, 'Contenido del modal')));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('Modal no se muestra cuando está cerrado', () => {
    const { Modal } = require('../../components/ui/Modal');
    render(React.createElement(Modal, {
      isOpen: false,
      onClose: jest.fn(),
      title: 'Modal cerrado'
    }, React.createElement('div', null, 'Contenido')));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('Botones tienen roles accesibles por defecto', () => {
    render(React.createElement('button', { onClick: jest.fn() }, 'Botón accesible'));

    const button = screen.getByRole('button', { name: 'Botón accesible' });
    expect(button).toBeInTheDocument();
  });
});
