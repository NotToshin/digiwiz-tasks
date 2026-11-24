import { useState } from 'react';
import { apiFetch } from '../../app/api';
import { PageHeader } from '../../app/ui';
import { useWorkspace } from '../../app/Workspace';

export default function SettingsPage() {
  const { sampleMode } = useWorkspace();
  const [profile, setProfile] = useState({ fullName: '', displayName: '' });
  const [pwForm, setPwForm] = useState({ currentEmail: '', code: '', password: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    try {
      const r = await apiFetch('/api/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
      const data = await r.json();
      setMsg(r.ok ? 'Profile saved.' : (data.error || 'Save failed'));
    } finally { setBusy(false); }
  }

  if (sampleMode) {
    return (
      <>
        <PageHeader title="Settings" description="Manage your account and workspace configuration" />
        <section className="card editor">
          <p>Settings require a signed-in account. Start the API and log in.</p>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and workspace configuration" />

      <section className="card editor" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Profile</h2>
        <form onSubmit={saveProfile} style={{ display: 'grid', gap: 12 }}>
          <label>Full name
            <input value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} required maxLength={160} placeholder="Your legal full name" />
          </label>
          <label>Display name
            <input value={profile.displayName} onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))} required maxLength={160} placeholder="Name shown in the app" />
          </label>
          <button className="button primary" disabled={busy} style={{ justifySelf: 'start' }}>{busy ? 'Saving…' : 'Save profile'}</button>
          {msg && <p role="status">{msg}</p>}
        </form>
      </section>

      <section className="card editor">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Password reset</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>
          Use the sign-in screen's "Reset password" option to change your password via email OTP.
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Contact your Superadmin to update your role, attendance permissions, or employment details.
        </p>
      </section>
    </>
  );
}
