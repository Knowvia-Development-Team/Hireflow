import { memo } from 'react';
import { IconCheck, IconArrowRight, IconSettings, IconX } from '@/shared/components/ui/Icons';
import type { Toast, ToastColor } from '@/types';

interface Props { toasts: Toast[]; removeToast: (id: number) => void; }

const ACCENT: Record<ToastColor, string> = {
  green: 'var(--green)',
  blue:  'var(--blue2)',
  amber: 'var(--amber)',
};

const ToastIcon = memo(function ToastIcon({ color }: { color: ToastColor }) {
  const s = { color: ACCENT[color] };
  if (color === 'green')  return <IconCheck size={13} style={s} />;
  if (color === 'amber')  return <IconSettings size={13} style={s} />;
  return <IconArrowRight size={13} style={s} />;
});

export default memo(function ToastContainer({ toasts, removeToast }: Props): JSX.Element {
  return (
    <div className="toast-container" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast${t.leaving ? ' leaving' : ''}`}
          style={{ borderLeft: `3px solid ${ACCENT[t.color]}` }}
        >
          <div className="toast-icon">
            <ToastIcon color={t.color} />
          </div>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.msg && <div className="toast-msg">{t.msg}</div>}
          </div>
          <button
            className="toast-close"
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss notification"
          >
            <IconX size={11} />
          </button>
        </div>
      ))}
    </div>
  );
});
