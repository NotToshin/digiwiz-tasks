import { useMemo, useState } from 'react';
import { PageHeader, StatusBadge } from '../../app/ui';
import { useWorkspace } from '../../app/Workspace';
import { demoToday } from '../../fixtures/workspace';
import { formatMonth, formatShortDate, monthStart, shiftMonth } from '../../domain/dates';
import type { DateKey } from '../../domain/models';
import { useTaskDrawer } from '../tasks/useTaskDrawer';

const dayMs = 86400000;
const day = (value: string) => Date.parse(value + 'T00:00:00Z');

export default function TimelinePage() {
  const { projects, tasks, sampleMode } = useWorkspace();
  const today = sampleMode ? demoToday : new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka'}).format(new Date()) as DateKey;
  const [month, setMonth] = useState(() => monthStart(today));
  const [projectId, setProjectId] = useState('');
  const { openTask } = useTaskDrawer();
  const start = day(month);
  const end = day(shiftMonth(month, 1));
  const count = (end - start) / dayMs;
  const rows = useMemo(() => tasks.filter(task => {
    const first = day(task.assignedOn);
    const last = day(task.deliveryDate);
    return (!projectId || task.projectId === projectId) && Number.isFinite(last) && last >= start && (Number.isFinite(first) ? Math.min(first, last) : last) < end;
  }), [tasks, projectId, start, end]);

  return <>
    <PageHeader title="Timeline" description="Assignment dates and delivery deadlines · Asia/Dhaka" />
    <section className="card timeline-card">
      <div className="calendar-toolbar">
        <div className="month-controls">
          <button className="button secondary small" onClick={() => setMonth(shiftMonth(month,-1))}>Previous</button>
          <h2 aria-live="polite">{formatMonth(month)}</h2>
          <button className="button secondary small" onClick={() => setMonth(shiftMonth(month,1))}>Next</button>
          <button className="button secondary small" onClick={() => setMonth(monthStart(today))}>Today</button>
        </div>
        <label>Project <select value={projectId} onChange={event => setProjectId(event.target.value)}><option value="">All projects</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
      </div>
      <div className="timeline-scroll">
        <div className="timeline-grid" style={{ '--timeline-days': count } as React.CSSProperties}>
          <div className="timeline-label">Task</div>
          <div className="timeline-track timeline-header">{Array.from({length:count},(_,index) => <span key={index}>{index+1}</span>)}</div>
          {rows.map(task => {
            const deadline = day(task.deliveryDate);
            const assigned = day(task.assignedOn);
            const first = Number.isFinite(assigned) ? Math.min(assigned, deadline) : deadline;
            const left = Math.max(0, (first-start)/dayMs);
            const right = Math.min(count, (deadline-start)/dayMs+1);
            return <div className="timeline-row" key={task.id}>
              <div className="timeline-label"><strong>{task.title}</strong><small>{formatShortDate(task.deliveryDate)} · <StatusBadge status={task.status}/></small></div>
              <div className="timeline-track"><button className="timeline-bar" style={{gridColumn: `${left+1} / ${right+1}`}} onClick={() => openTask(task.id)} aria-label={`${task.title}, ${task.status}, due ${formatShortDate(task.deliveryDate)}`} title={task.title}>{task.title}</button></div>
            </div>;
          })}
        </div>
        {!rows.length && <p className="timeline-empty">No tasks overlap this month.</p>}
      </div>
    </section>
  </>;
}
