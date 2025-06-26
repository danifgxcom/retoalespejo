import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

describe('Focus Management Tests', () => {
  test('Modal should trap focus within its boundaries', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    // Render elements outside the modal first
    render(
      <div>
        <Button data-testid="outside-button-before">Outside Before</Button>
        <Modal 
          isOpen={true}
          onClose={onClose}
          title="Test Modal"
          aria={{ labelledby: 'modal-title' }}
        >
          <Button data-testid="first-button">First Button</Button>
          <Button data-testid="second-button">Second Button</Button>
          <Button data-testid="third-button">Third Button</Button>
        </Modal>
        <Button data-testid="outside-button-after">Outside After</Button>
      </div>
    );

    // First focusable element in the modal should be focused automatically
    const firstButton = screen.getByTestId('first-button');
    expect(firstButton).toHaveFocus();

    // Tab should move focus to next button in modal
    await user.tab();
    expect(screen.getByTestId('second-button')).toHaveFocus();

    await user.tab();
    expect(screen.getByTestId('third-button')).toHaveFocus();

    // Tab again should wrap back to first button in modal (focus trap)
    await user.tab();
    expect(firstButton).toHaveFocus();

    // Shift+Tab should cycle backwards
    await user.keyboard('{shift>}{tab}{/shift}');
    expect(screen.getByTestId('third-button')).toHaveFocus();

    // Escape key should close the modal
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  test('Skip link should be visible on focus and move focus to main content', async () => {
    const user = userEvent.setup();

    // Create a mock main content with an ID
    document.body.innerHTML = `
      <div>
        <a href="#main-content" class="skip-link">Skip to main content</a>
        <header>
          <nav>
            <a href="#">Link 1</a>
            <a href="#">Link 2</a>
          </nav>
        </header>
        <main id="main-content" tabindex="-1">
          <h1>Main Content</h1>
          <button>Test Button</button>
        </main>
      </div>
    `;

    // First tab should focus the skip link
    const skipLink = document.querySelector('.skip-link') as HTMLElement;
    skipLink.focus();
    expect(document.activeElement).toBe(skipLink);

    // Skip link should be visible when focused
    const skipLinkComputedStyle = window.getComputedStyle(skipLink);
    expect(skipLinkComputedStyle.position).not.toBe('absolute');
    expect(skipLinkComputedStyle.transform).not.toBe('translateY(-100%)');

    // Pressing Enter should move focus to main content
    fireEvent.click(skipLink);
    const mainContent = document.getElementById('main-content');
    expect(document.activeElement).toBe(mainContent);
  });
});
