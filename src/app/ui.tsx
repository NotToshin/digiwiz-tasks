import type { ReactNode } from 'react';
import { FiArrowUpRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import type { TaskStatus } from '../domain/models';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {actions && <div className="header-actions">{actions}</div>}
    </header>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={'status-badge status-' + status.toLowerCase().replaceAll(' ', '-')}>{status}</span>;
}

export function NotFound({ title, to, linkText }: { title: string; to: string; linkText: string }) {
  return (
    <section className="card empty-card">
      <h1>{title}</h1>
      <Link className="button secondary" to={to}>{linkText}<FiArrowUpRight aria-hidden="true" /></Link>
    </section>
  );
}
