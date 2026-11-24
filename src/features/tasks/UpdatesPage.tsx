import { useEffect, useState } from 'react';
import { FiBell, FiCheck, FiClock } from 'react-icons/fi';
import { apiFetch } from '../../app/api';
import { PageHeader, StatusBadge } from '../../app/ui';
import { useWorkspace } from '../../app/Workspace';
import { useTaskDrawer } from './useTaskDrawer';

function timeAgo(dateValue: string | number): string {
  const ms = typeof dateValue === 'number' ? dateValue : Date.parse(dateValue);
  const diff = Math.max(0, Date.now() - ms);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function UpdatesPage({ kind }: { kind: 'activity' | 'notifications' }) {
  const { sampleMode, tasks } = useWorkspace();
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState<number | null>(null);
  const { openTask } = useTaskDrawer();

  async function load() {
    if (sampleMode) return;
    try {
      const response = await apiFetch('/api/' + kind);
      if (!response.ok) throw new Error(kind === 'notifications' ? 'Notifications unavailable' : 'Activity unavailable');
      setRows(await response.json());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Updates unavailable');
    }
  }

  useEffect(() => {
    setRows([]);
    void load();
    const timer = setInterval(() => void load(), 60000);
    return () => clearInterval(timer);
  }, [kind, sampleMode]);

  async function markRead(id: number) {
    setMarking(id);
    try {
      const r = await apiFetch('/api/notifications/' + id + '/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (r.ok) await load();
    } finally { setMarking(null); }
  }

  async function markAllRead() {
    const unread = rows.filter(r => !r.readAt);
    for (const row of unread) {
      await apiFetch('/api/notifications/' + row.id + '/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    }
    await load();
  }

  const unreadCount = kind === 'notifications' ? rows.filter(r => !r.readAt).length : 0;

  const title = kind === 'activity' ? 'Activity' : 'Notifications';
  const description = kind === 'activity'
    ? 'Recent task changes across your projects'
    : (unreadCount > 0 ? `${unreadCount} unread` : 'All caught up');

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={kind === 'notifications' && unreadCount > 0
          ? <button className="button secondary" onClick={markAllRead}>Mark all read</button>
          : undefined}
      />

      {sampleMode && (
        <section className="card editor">
          <p>{title} requires a signed-in account. Start the API and log in.</p>
        </section>
      )}

      {!sampleMode && error && (
        <section className="card editor">
          <p role="alert" style={{ color: '#c0392b' }}>{error}</p>
          <button className="button secondary" onClick={load} style={{ marginTop: 10 }}>Retry</button>
        </section>
      )}

      {!sampleMode && !error && rows.length === 0 && (
        <section className="card empty-card">
          <span style={{ fontSize: 32 }}>{kind === 'notifications' ? '🔔' : '📋'}</span>
          <h1>{kind === 'notifications' ? 'No notifications' : 'No activity yet'}</h1>
          <p style={{ color: 'var(--muted)', marginTop: 8 }}>
            {kind === 'notifications'
              ? 'You will be notified when tasks are assigned or reviewed.'
              : 'Task changes in your projects will appear here.'}
          </p>
        </section>
      )}

      {!sampleMode && rows.length > 0 && (
        <section className="card task-table-card">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {rows.map((row, index) => (
              <li
                key={row.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 18px',
                  borderTop: index === 0 ? 'none' : '1px solid var(--line)',
                  background: kind === 'notifications' && !row.readAt ? '#faf7ff' : 'transparent',
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    background: kind === 'notifications' && !row.readAt ? '#ede4fb' : '#f0edf5',
                    color: '#6039a9',
                    marginTop: 2,
                  }}
                >
                  {kind === 'notifications' ? <FiBell size={15} /> : <FiClock size={15} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <button
                    className="task-row-button"
                    onClick={() => openTask(row.taskId)}
                    style={{ marginBottom: 4, fontSize: 14 }}
                  >
                    {kind === 'notifications' ? row.message : row.title}
                  </button>
                  {kind === 'activity' && row.beforeValue && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                      Changed by <strong>{row.actor}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {timeAgo(kind === 'notifications' ? row.createdAt : row.occurredAt)}
                    </span>
                    {kind === 'notifications' && row.readAt && (
                      <span style={{ fontSize: 11, color: '#7c9b77', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <FiCheck size={11} /> Read
                      </span>
                    )}
                  </div>
                </div>
                {kind === 'notifications' && !row.readAt && (
                  <button
                    className="button secondary"
                    style={{ flexShrink: 0, minHeight: 30, padding: '0 10px', fontSize: 12 }}
                    disabled={marking === row.id}
                    onClick={() => markRead(row.id)}
                  >
                    {marking === row.id ? '…' : 'Mark read'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
