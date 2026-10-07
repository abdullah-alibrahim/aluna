import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function PageHeader({
  title,
  subtitle,
  actions,
  backTo,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  backTo?: string;
}) {
  return (
    <header className="page-header">
      <div>
        {backTo ? (
          <Link to={backTo} className="back-link">
            ← رجوع
          </Link>
        ) : null}
        <h2>{title}</h2>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card stat-card">
      <div className="muted">{label}</div>
      <strong className="stat-value">{value}</strong>
      {hint ? <div className="muted small">{hint}</div> : null}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {hint ? <p className="muted">{hint}</p> : null}
    </div>
  );
}

export function LoadingBlock({ label = 'جاري التحميل...' }: { label?: string }) {
  return (
    <div className="loading-block">
      <div className="spinner" />
      <span className="muted">{label}</span>
    </div>
  );
}

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="banner error-banner">{message}</div>;
}

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar">{children}</div>;
}
