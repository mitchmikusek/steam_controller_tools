import { useEffect, useState, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: Props) {
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      // Focus the close button when modal opens
      setTimeout(() => closeRef.current?.focus(), 50);
    } else if (visible) {
      setClosing(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle Escape key
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  // Trap focus within modal
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const modal = document.querySelector('.modal') as HTMLElement;
      if (!modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible]);

  if (!visible) return null;

  return createPortal(
    <div
      className={`modal-overlay${closing ? ' closing' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal" style={{ textAlign: 'left', maxWidth: 480, padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div id="modal-title" className="modal-title" style={{ textAlign: 'left' }}>
            {title}
          </div>
          <button
            ref={closeRef}
            className="btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close"
            style={{ fontSize: '1rem', padding: '4px 8px', minWidth: 'auto' }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
