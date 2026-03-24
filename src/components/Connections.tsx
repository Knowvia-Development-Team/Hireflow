import { IconCheck } from '@/shared/components/ui/Icons';
import { useState } from 'react';
import { EMAIL_TEMPLATES } from '@/data';
import type { Email, ToastColor } from '@/types';

interface Props {
  emails:    Email[];
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;
  showToast: (title: string, msg: string, color?: ToastColor) => void;
}

export default function Connections({ emails, setEmails, showToast }: Props): JSX.Element {
  const [selected,   setSelected]   = useState<Email>(emails[0]!);
  const [replyText,  setReplyText]  = useState('');
  const [emailType,  setEmailType]  = useState('Reply');

  const sendEmail = (): void => {
    if (!replyText.trim()) return;
    showToast('Email Sent', `Reply sent to ${selected.from}`, 'green');
    setReplyText('');
    setEmails(prev => prev.map(e => e.id === selected.id ? { ...e, unread: false } : e));
  };

  return (
    <div className="view">
      <div className="pg-hd">
        <div>
          <div className="pg-tag">Communication</div>
          <h1 className="pg-title">Connections</h1>
        </div>
        <div className="pg-actions">
          <button className="btn btn-primary btn-sm">+ Compose</button>
        </div>
      </div>

      <div className="conn-layout">
        {/* Thread list */}
        <div className="conn-list">
          <div className="conn-search">
            <input className="conn-search-input" placeholder="Search messages…" />
          </div>
          {emails.map(e => (
            <div key={e.id} className={`conn-item${selected.id === e.id ? ' active' : ''}`} onClick={() => setSelected(e)}>
              <span className="ci-time">{e.time}</span>
              <div className="ci-name">
                {e.unread && <span className="unread-dot" />}
                {e.from}
              </div>
              <div className="ci-subject">{e.subject}</div>
              <div className="ci-preview">{e.preview}</div>
            </div>
          ))}
        </div>

        {/* Email pane */}
        <div className="email-pane">
          <div className="email-top">
            <div className="email-subject">{selected.subject}</div>
            <div className="email-from">
              <div className="email-av">
                {selected.from.split(' ').map(n => n[0] ?? '').join('')}
              </div>
              <div>
                <div className="email-sender-name">{selected.from}</div>
                <div className="email-addr">{selected.addr}</div>
              </div>
              <div className="email-time">{selected.time}</div>
            </div>
          </div>
          <div className="email-body-wrap">{selected.body}</div>
          <div className="email-compose">
            <div className="compose-toolbar">
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--g3)', letterSpacing: 1 }}>TEMPLATE:</span>
              {Object.keys(EMAIL_TEMPLATES).map(t => (
                <div key={t} className={`compose-type${emailType === t ? ' active' : ''}`}
                  onClick={() => { setEmailType(t); setReplyText(EMAIL_TEMPLATES[t] ?? ''); }}>
                  {t}
                </div>
              ))}
            </div>
            <textarea className="compose-input" value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Reply to candidate…" rows={3} />
            <div className="compose-footer">
              <span className="ds-delivered" style={{display:"flex",alignItems:"center",gap:4}}><IconCheck size={11} style={{color:"var(--green)"}}/> Last email delivered</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm">Save draft</button>
                <button className="btn btn-primary btn-sm" onClick={sendEmail}>Send →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
