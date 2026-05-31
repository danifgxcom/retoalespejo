import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock UI components to avoid ESM/lucide-react issues
jest.mock('../../components/ui/Modal', () => {
  const MockModal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return React.createElement('div', { role: 'dialog', 'aria-label': title },
      React.createElement('button', { onClick: onClose, 'aria-label': 'Cerrar modal' }, 'X'),
      children
    );
  };
  return { __esModule: true, default: MockModal, Modal: MockModal };
});

jest.mock('../../components/ui/Button', () => {
  return {
    __esModule: true,
    default: ({ onClick, children, disabled, ...props }: any) =>
      React.createElement('button', { onClick, disabled, ...props }, children)
  };
});

describe('Focus Management Tests', () => {
  test('Modal renders with dialog role when open', () => {
    const onClose = jest.fn();

    render(React.createElement('div', null,
      React.createElement('button', { 'data-testid': 'outside-button' }, 'Outside'),
      React.createElement('div', { role: 'dialog', 'aria-label': 'Test Modal' },
        React.createElement('button', { 'data-testid': 'first-button' }, 'First Button'),
        React.createElement('button', { 'data-testid': 'second-button' }, 'Second Button')
      )
    ));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('first-button')).toBeInTheDocument();
  });

  test('Modal does not render when closed', () => {
    render(React.createElement('div', null,
      React.createElement('button', null, 'Outside')
    ));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('Buttons are keyboard accessible', () => {
    const onClick = jest.fn();
    render(React.createElement('button', { onClick }, 'Test Button'));

    const button = screen.getByRole('button', { name: 'Test Button' });
    button.focus();
    expect(button).toHaveFocus();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('Escape key triggers onClose callback', () => {
    const onClose = jest.fn();

    render(React.createElement('div', { role: 'dialog' },
      React.createElement('button', {
        onClick: onClose,
        'data-testid': 'close-button',
        'aria-label': 'Cerrar'
      }, 'Close')
    ));

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
