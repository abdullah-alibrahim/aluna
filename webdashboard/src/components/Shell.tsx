import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type LinkItem = { to: string; label: string; end?: boolean };

export default function Shell({ links }: { links: LinkItem[] }) {
  const { me, logout } = useAuth();
  const location = useLocation();
  const params = useParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const shopId = params.shopId;
  const shopLinks = useMemo<LinkItem[]>(() => {
    if (!shopId) return [];
    return [
      { to: `/owner/shops/${shopId}`, label: 'داشبورد المحل', end: true },
      { to: `/owner/shops/${shopId}/bookings`, label: 'الحجوزات' },
      { to: `/owner/shops/${shopId}/branches`, label: 'الفروع' },
      { to: `/owner/shops/${shopId}/pos`, label: 'نقطة البيع' },
    ];
  }, [shopId]);

  const roleLabel = me?.role === 'admin' ? 'داشبورد الأدمن' : 'داشبورد المحل';

  return (
    <div className="layout">
      <div className="mobile-top">
        <div className="brand-inline">ألونا</div>
        <button type="button" className="secondary" onClick={() => setOpen(true)}>
          القائمة
        </button>
      </div>

      <div
        className={`sidebar-backdrop ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <h1>ألونا</h1>
          <div className="tag">{me?.role === 'admin' ? 'إدارة المنصة' : 'إدارة المحل'} · سوريا</div>
        </div>

        <div className="user-chip">
          <strong>{me?.name || '—'}</strong>
          <span>{roleLabel}</span>
        </div>

        <div className="nav-section-label">القائمة</div>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end ?? true}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            {l.label}
          </NavLink>
        ))}

        {shopLinks.length > 0 && (
          <>
            <div className="nav-section-label">إدارة المحل</div>
            {shopLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {l.label}
              </NavLink>
            ))}
          </>
        )}

        <div className="spacer" />
        <button className="ghost" type="button" onClick={() => logout()}>
          تسجيل الخروج
        </button>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
