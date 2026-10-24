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

      <div className="grid cols-3">
        <StatCard icon="⏳" label="مراكز معلّقة" value={stats?.pendingShops ?? 0} />
        <StatCard icon="🎫" label="تذاكر مفتوحة" value={stats?.openTickets ?? 0} />
        <StatCard icon="↗" label="سحوبات معلّقة" value={stats?.pendingWithdrawals ?? 0} />
        <StatCard icon="📅" label="حجوزات اليوم" value={stats?.todayBookings ?? 0} />
        <StatCard icon="✅" label="مراكز معتمدة" value={stats?.approvedShops ?? 0} hint={`من أصل ${stats?.totalShops ?? 0}`} />
        <StatCard icon="💳" label="مستحقات المراكز" value={money(stats?.totalOwedBalance)} />
      </div>

      <div className="quick-links">
        <Link to="/admin/shops" className="quick-link">
          <strong>🏪 مراكز التجميل</strong>
          <span className="muted">موافقة ورفض وتثبيت</span>
        </Link>
        <Link to="/admin/finances" className="quick-link">
          <strong>💵 المالية</strong>
          <span className="muted">مستحقات ودفعات</span>
        </Link>
        <Link to="/admin/withdrawals" className="quick-link">
          <strong>↗ السحوبات</strong>
          <span className="muted">مراجعة طلبات الدفع</span>
        </Link>
        <Link to="/admin/bookings" className="quick-link">
          <strong>📅 الحجوزات</strong>
          <span className="muted">متابعة نشاط المنصة</span>
        </Link>
        <Link to="/admin/tickets" className="quick-link">
          <strong>🎫 التذاكر</strong>
          <span className="muted">دعم المستخدمين</span>
        </Link>
        <Link to="/admin/cities" className="quick-link">
          <strong>📍 المدن</strong>
          <span className="muted">تغطية المنصة</span>
        </Link>
        <Link to="/admin/categories" className="quick-link">
          <strong>🧾 التصنيفات</strong>
          <span className="muted">خدمات التطبيق</span>
        </Link>
        <Link to="/admin/banners" className="quick-link">
          <strong>🖼 البانرات</strong>
          <span className="muted">ترويج الصفحة الرئيسية</span>
        </Link>
        <Link to="/admin/faqs" className="quick-link">
          <strong>❓ الأسئلة الشائعة</strong>
          <span className="muted">محتوى المساعدة</span>
        </Link>
        <Link to="/admin/settings" className="quick-link">
          <strong>⚙️ الإعدادات</strong>
          <span className="muted">عمولة وسياسات</span>
        </Link>
        <Link to="/admin/notifications" className="quick-link">
          <strong>🔔 الإشعارات</strong>
          <span className="muted">تنبيهات الحساب</span>
        </Link>
        <Link to="/admin/profile" className="quick-link">
          <strong>👤 الملف الشخصي</strong>
          <span className="muted">الحساب وكلمة المرور</span>
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
                  <th>مركز التجميل</th>
                  <th>الزبون</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td data-label="المركز">{b.shopId?.name || '—'}</td>
                    <td data-label="الزبون">{b.userId?.name || '—'}</td>
                    <td data-label="الوقت">
                      {formatDate(b.date)} {b.startTime || ''}
                    </td>
                    <td data-label="الحالة">
                      <Badge tone={badgeTone('booking', b.status)}>
                        {bookingStatusAr[b.status] || b.status}
                      </Badge>
                    </td>
                    <td data-label="المبلغ" className="money">{money(b.totalPrice)}</td>
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
