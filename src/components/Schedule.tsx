import { IconUsers, IconLink, IconNotepad } from '@/shared/components/ui/Icons';
import { useState } from 'react';
import { fmtDate, fmtDateLabel } from '@/utils';
import type { Interview, ModalId, ToastColor } from '@/types';

type ViewMode = 'list' | 'grid';

const TYPE_COLOR: Record<string, string> = { Screening: '#1e6fa8', Technical: '#1e7a5a', Final: '#2448a5', Culture: '#7c3aed' };
const TYPE_CLS:   Record<string, string> = { Screening: 'ib-screen', Technical: 'ib-tech', Final: 'ib-final', Culture: 'ib-culture' };
const STATUS_CLS: Record<string, string> = { Scheduled: 'int-scheduled', Completed: 'int-completed', Cancelled: 'int-cancelled', 'No-show': 'int-noshow' };
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'] as const;
const TIME_SLOTS  = [9, 10, 11, 12, 13, 14, 15, 16] as const;
const SLOT_H      = 58;
const BASE_DATE   = '2026-03-16';

function getWeekDates(offset: number): Date[] {
  const base = new Date(BASE_DATE);
  base.setDate(base.getDate() + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return d;
  });
}

interface Props {
  interviews:    Interview[];
  setInterviews: React.Dispatch<React.SetStateAction<Interview[]>>;
  openModal:     (id: ModalId) => void;
  showToast:     (title: string, msg: string, color?: ToastColor) => void;
}

export default function Schedule({ interviews, openModal }: Props): JSX.Element {
  const [weekOffset, setWeekOffset] = useState(0);
  const [mode,       setMode]       = useState<ViewMode>('list');

  const weekDates     = getWeekDates(weekOffset);
  const firstDay      = weekDates[0]!;
  const weekStart     = weekDates[0]!;
  const weekEnd       = weekDates[6]!;

  const weekInterviews = interviews
    .filter(iv => {
      const d = new Date(iv.date);
      return d >= weekStart && d <= weekEnd;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <div className="view">
      <div className="pg-hd">
        <div>
          <div className="pg-tag">Interview Calendar</div>
          <h1 className="pg-title">Schedule</h1>
          <div className="pg-sub">
            {interviews.filter(i => i.status === 'Scheduled').length} upcoming ·{' '}
            {interviews.filter(i => i.date === '2026-03-18').length} today
          </div>
        </div>
        <div className="pg-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setMode(m => m === 'list' ? 'grid' : 'list')}>
            {mode === 'list' ? 'Grid View' : 'List View'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('schedule')}>
            + Schedule Interview
          </button>
        </div>
      </div>

      <div className="sched-controls">
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w - 1)}>← Prev</button>
        <span className="week-label">
          {MONTH_NAMES[firstDay.getMonth()]} {firstDay.getFullYear()} · Week of {firstDay.getDate()}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w + 1)}>Next →</button>
      </div>

      {mode === 'grid' ? (
        <div className="card">
          <div className="week-grid-wrap">
            <div className="week-grid" style={{ gridTemplateColumns: '48px repeat(7,1fr)' }}>
              <div className="wg-header" />
              {weekDates.map((d, i) => (
                <div key={i} className={`wg-header${fmtDate(d) === '2026-03-18' ? ' wg-today-hd' : ''}`}>
                  {fmtDateLabel(d)}
                </div>
              ))}
              <div>
                {TIME_SLOTS.map(h => (
                  <div key={h} className="wg-time-slot" style={{ height: SLOT_H }}>{h}:00</div>
                ))}
              </div>
              {weekDates.map((d, di) => {
                const dateStr = fmtDate(d);
                const dayIvs  = interviews.filter(iv => iv.date === dateStr && iv.status !== 'Cancelled');
                return (
                  <div key={di} className="wg-col">
                    {TIME_SLOTS.map(h => (
                      <div key={h} className="wg-slot" style={{ height: SLOT_H }}>
                        <span className="wg-add-hint">+ {h}:00</span>
                      </div>
                    ))}
                    {dayIvs.map(iv => {
                      const [hh = 9, mm = 0] = iv.time.split(':').map(Number);
                      const top    = (hh - 9) * SLOT_H + mm;
                      const height = Math.max((iv.duration / 60) * SLOT_H, 28);
                      return (
                        <div key={iv.id}
                          className={`int-block ${TYPE_CLS[iv.type] ?? 'ib-screen'}`}
                          style={{ top, height: `${height}px` }}
                          title={`${iv.candidate} — ${iv.type}`}>
                          <div className="ib-title">{iv.candidate}</div>
                          <div className="ib-role">{iv.type}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          {weekInterviews.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--g3)' }}>
              No interviews scheduled this week.
            </div>
          ) : (
            <div className="sched-list">
              {weekInterviews.map(iv => (
                <div key={iv.id} className="sched-item">
                  <div className="sched-time-col">
                    <div className="sched-time">{iv.time}</div>
                    <div className="sched-dur">{iv.duration}m</div>
                  </div>
                  <div className="sched-vline" style={{ background: TYPE_COLOR[iv.type] ?? 'var(--blue2)' }} />
                  <div className="sched-info">
                    <div className="sched-cand">{iv.candidate}</div>
                    <div className="sched-role">{iv.role}</div>
                    <div className="sched-meta">
                      <span className="sched-tag">{iv.type}</span>
                      <span className="sched-tag" style={{display:"flex",alignItems:"center",gap:4}}><IconUsers size={11}/> {iv.interviewers}</span>
                      <span className="sched-tag" style={{display:"flex",alignItems:"center",gap:4}}><IconLink size={11}/> {iv.videoLink}</span>
                      {iv.notes && <span className="sched-tag" style={{display:"flex",alignItems:"center",gap:4}}><IconNotepad size={11}/> {iv.notes}</span>}
                    </div>
                  </div>
                  <span className={`int-status-badge ${STATUS_CLS[iv.status] ?? 'int-scheduled'}`}>
                    {iv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
