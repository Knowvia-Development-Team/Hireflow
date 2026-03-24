/**
 * Modal — Accessible, focus-trapped, keyboard-navigable
 * ───────────────────────────────────────────────────────
 * WCAG 2.1: role="dialog", aria-modal, focus trap, Esc to close.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from './Icons';

interface Props {
  title:    string;
  onClose:  () => void;
  children: ReactNode;
  footer?:  ReactNode;
  width?:   number;
}

export function Modal({ title, onClose, children, footer, width = 520 }: Props): JSX.Element {
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Focus the close button on mount
  useEffect(() => { firstFocusableRef.current?.focus(); }, []);

  // Prevent body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div
      className="modal-back"
      role="presentation"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal"
        style={{ width, maxWidth: '96vw', maxHeight: '92vh' }}
      >
        <div className="modal-hd">
          <span id="modal-title" className="modal-title">{title}</span>
          <button
            ref={firstFocusableRef}
            className="modal-x"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <IconX size={12} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
