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

const NOTIFS: NotifItem[] = [
  { unread: true,  cls: 'ni-green', icon: 'check',    text: '<strong>Amara Dube</strong> accepted the offer for <strong>Senior Designer</strong>',   time: '2 min ago'  },
  { unread: true,  cls: 'ni-blue',  icon: 'arrow',    text: '<strong>Marcus Khumalo</strong> moved to <strong>Final Interview</strong>',               time: '18 min ago' },
  { unread: false, cls: 'ni-amber', icon: 'star',     text: 'Scorecard submitted for <strong>Priya Nair</strong> — Score: 4.2/5',                    time: '1 hr ago'   },
  { unread: false, cls: 'ni-blue',  icon: 'file',     text: '<strong>12 new applications</strong> for <strong>Backend Engineer</strong>',              time: '2 hr ago'   },
  { unread: false, cls: 'ni-green', icon: 'calendar', text: '<strong>Lena Müller</strong> booked her final round for tomorrow at 10am',                time: '3 hr ago'   },
];

function NotifIcon({ type }: { type: IconKey }): ReactNode {
  switch (type) {
    case 'check':    return <IconCheck     size={13} />;
    case 'star':     return <IconStar      size={13} />;
    case 'file':     return <IconFileText  size={13} />;
    case 'calendar': return <IconCalendar  size={13} />;
    default:         return <IconArrowRight size={13} />;
  }
}

interface Props { open: boolean; onClose: () => void; }

export default function NotifPanel({ open, onClose }: Props): JSX.Element {
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
        {NOTIFS.map((n, i) => (
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
