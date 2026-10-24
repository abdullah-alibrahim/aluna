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

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card stat-card">
      <div className="stat-top">
        {icon ? (
          <span className="stat-icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        <span className="stat-label">{label}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      {hint ? <div className="muted small">{hint}</div> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`field${className ? ` ${className}` : ''}`}>
      <span className="field-label">
        {label}
        {required ? <span className="field-req"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function CardHeader({ title, extra }: { title: ReactNode; extra?: ReactNode }) {
  return (
    <div className="card-head">
      <strong>{title}</strong>
      {extra ? <div className="row">{extra}</div> : null}
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden>
        {icon || (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2.8l1.9 5.7 5.7 1.9-5.7 1.9L12 18l-1.9-5.7L4.4 10.4l5.7-1.9L12 2.8z" />
            <path d="M18.6 15.4l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" opacity=".55" />
          </svg>
        )}
      </span>
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
