import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../../lib/api';
import { badgeTone, bookingStatusAr, formatDate, shopStatusAr, ticketStatusAr } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, StatCard } from '../../components/ui';

export default function AdminHome() {
  const [stats, setStats] = useState<any>(null);
  const [pendingShops, setPendingShops] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api('/admin/dashboard-stats'),
      api('/admin/shops/pending'),
      api('/admin/tickets'),
      api('/admin/bookings'),
    ])
      .then(([s, shops, tix, bks]) => {
        setStats(s);
        setPendingShops((shops || []).slice(0, 5));
        setTickets((tix || []).filter((t: any) => t.status === 'open' || t.status === 'in_progress').slice(0, 5));
        setBookings((bks || []).slice(0, 8));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="داشبورد الأدمن" subtitle="إدارة المنصة · موافقات · سحوبات · دعم" />
      <ErrorBanner message={error} />

      <div className="grid">
        <StatCard label="صالونات معلّقة" value={stats?.pendingShops ?? 0} />
        <StatCard label="تذاكر مفتوحة" value={stats?.openTickets ?? 0} />
        <StatCard label="سحوبات معلّقة" value={stats?.pendingWithdrawals ?? 0} />
        <StatCard label="حجوزات اليوم" value={stats?.todayBookings ?? 0} />
        <StatCard label="صالونات معتمدة" value={stats?.approvedShops ?? 0} hint={`من أصل ${stats?.totalShops ?? 0}`} />
        <StatCard label="مستحقات الصالونات" value={money(stats?.totalOwedBalance)} />
      </div>

      <div className="quick-links">
        <Link to="/admin/shops" className="quick-link">
          <strong>الصالونات</strong>
          <span className="muted">موافقة ورفض وتثبيت</span>
        </Link>
        <Link to="/admin/withdrawals" className="quick-link">
          <strong>السحوبات</strong>
          <span className="muted">مراجعة طلبات الدفع</span>
        </Link>
        <Link to="/admin/bookings" className="quick-link">
          <strong>الحجوزات</strong>
          <span className="muted">متابعة نشاط المنصة</span>
        </Link>
        <Link to="/admin/tickets" className="quick-link">
          <strong>التذاكر</strong>
          <span className="muted">دعم المستخدمين</span>
        </Link>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>بانتظار الموافقة</strong>
            <Link to="/admin/shops" className="muted small">
              عرض الكل
            </Link>
          </div>
          {pendingShops.length === 0 ? (
            <EmptyState title="لا طلبات معلّقة" />
          ) : (
            pendingShops.map((s) => (
              <div key={s._id} className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>{s.name}</strong>
                  <div className="muted small">{s.ownerId?.name || '—'} · {s.cityId?.name || '—'}</div>
                </div>
                <Badge tone="warn">{shopStatusAr.pending}</Badge>
              </div>
            ))
          )}
        </div>

        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>تذاكر تحتاج متابعة</strong>
            <Link to="/admin/tickets" className="muted small">
              عرض الكل
            </Link>
          </div>
          {tickets.length === 0 ? (
            <EmptyState title="لا تذاكر مفتوحة" />
          ) : (
            tickets.map((t) => (
              <div key={t._id} className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>{t.subject}</strong>
                  <div className="muted small">{t.userId?.name || t.userId?.email || '—'}</div>
                </div>
                <Badge tone={badgeTone('ticket', t.status)}>{ticketStatusAr[t.status] || t.status}</Badge>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong>آخر الحجوزات</strong>
          <Link to="/admin/bookings" className="muted small">
            عرض الكل
          </Link>
        </div>
        {bookings.length === 0 ? (
          <EmptyState title="لا حجوزات بعد" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الصالون</th>
                  <th>الزبون</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>{b.shopId?.name || '—'}</td>
                    <td>{b.userId?.name || '—'}</td>
                    <td>
                      {formatDate(b.date)} {b.startTime || ''}
                    </td>
                    <td>
                      <Badge tone={badgeTone('booking', b.status)}>
                        {bookingStatusAr[b.status] || b.status}
                      </Badge>
                    </td>
                    <td>{money(b.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
