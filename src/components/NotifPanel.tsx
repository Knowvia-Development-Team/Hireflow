import type { ReactNode } from 'react';
import { sanitize } from '@/shared/lib/sanitize';
import {
  IconCheck, IconStar, IconFileText, IconCalendar,
  IconArrowRight, IconX,
} from '@/shared/components/ui/Icons';

type IconKey = 'check' | 'star' | 'file' | 'calendar' | 'arrow';

interface NotifItem {
  unread: boolean;
  cls:    string;
  icon:   IconKey;
  text:   string;
  time:   string;
}

function NotifIcon({ type }: { type: IconKey }): ReactNode {
  switch (type) {
    case 'check':    return <IconCheck     size={13} />;
    case 'star':     return <IconStar      size={13} />;
    case 'file':     return <IconFileText  size={13} />;
    case 'calendar': return <IconCalendar  size={13} />;
    default:         return <IconArrowRight size={13} />;
  }
}

interface Props { open: boolean; onClose: () => void; activity: { text: string; time: string }[]; }

const inferIcon = (text: string): { icon: IconKey; cls: string } => {
  const lower = text.toLowerCase();
  if (lower.includes('accepted') || lower.includes('hired')) return { icon: 'check', cls: 'ni-green' };
  if (lower.includes('score')) return { icon: 'star', cls: 'ni-amber' };
  if (lower.includes('application')) return { icon: 'file', cls: 'ni-blue' };
  if (lower.includes('interview') || lower.includes('schedule')) return { icon: 'calendar', cls: 'ni-green' };
  return { icon: 'arrow', cls: 'ni-blue' };
};

export default function NotifPanel({ open, onClose, activity }: Props): JSX.Element {
  const notifs: NotifItem[] = activity.slice(0, 7).map((a, idx) => {
    const { icon, cls } = inferIcon(a.text);
    return {
      unread: idx < 3,
      cls,
      icon,
      text: a.text,
      time: a.time,
    };
  });

  return (
    <div
      className={`notif-panel${open ? ' open' : ''}`}
      role="dialog"
      aria-label="Notifications"
      aria-modal="false"
    >
      <div className="notif-panel-hd">
        <span className="notif-panel-title">Notifications</span>
        <button
          className="modal-x"
          onClick={onClose}
          aria-label="Close notifications"
        >
          <IconX size={13} />
        </button>
      </div>

      <div className="notif-list" role="list">
        {notifs.length === 0 && (
          <div className="notif-empty">No notifications yet.</div>
        )}
        {notifs.map((n, i) => (
          <div
            key={i}
            className={`notif-item${n.unread ? ' unread' : ''}`}
            role="listitem"
          >
            <div className={`notif-icon ${n.cls}`}>
              <NotifIcon type={n.icon} />
            </div>
            <div className="notif-body">
              <div
                className="notif-text"
                dangerouslySetInnerHTML={{ __html: sanitize(n.text) }}
              />
              <div className="notif-ts">{n.time}</div>
            </div>
            {n.unread && (
              <div className="notif-unread-dot" aria-label="Unread" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
