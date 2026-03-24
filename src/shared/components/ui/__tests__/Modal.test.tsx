import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('renders with correct ARIA attributes', () => {
    render(<Modal title="Test Dialog" onClose={vi.fn()}>Content</Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('displays the title', () => {
    render(<Modal title="My Title" onClose={vi.fn()}>Body</Modal>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<Modal title="T" onClose={vi.fn()}><span>Modal content</span></Modal>);
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('renders optional footer', () => {
    render(
      <Modal title="T" onClose={vi.fn()} footer={<button>Confirm</button>}>
        Body
      </Modal>,
    );
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<Modal title="T" onClose={onClose}>Body</Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when clicking the close button', () => {
    const onClose = vi.fn();
    render(<Modal title="T" onClose={onClose}>Body</Modal>);
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('close button has accessible aria-label', () => {
    render(<Modal title="T" onClose={vi.fn()}>Body</Modal>);
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });
});
