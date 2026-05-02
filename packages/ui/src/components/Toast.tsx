import { useEffect, useState } from 'react';

interface Props {
  message: string | null;
  type?: 'info' | 'warn' | 'error';
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onDismiss]);

  if (!message) return null;

  const colorMap = {
    info: 'var(--blue)',
    warn: 'var(--yellow)',
    error: 'var(--red)',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 40,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s ease',
        background: 'var(--bg-card)',
        border: `1px solid ${colorMap[type]}`,
        borderRadius: 20,
        padding: '8px 20px',
        fontSize: '0.8rem',
        color: colorMap[type],
        zIndex: 2000,
        pointerEvents: 'none',
      }}
    >
      {message}
    </div>
  );
}
