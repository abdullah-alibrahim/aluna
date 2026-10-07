import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, money } from '../../lib/api';
import { badgeTone, bookingStatusAr, formatDate, shopStatusAr } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, StatCard } from '../../components/ui';

export default function OwnerShopHome() {
  const { shopId } = useParams();
  const [shop, setShop] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [pos, setPos] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;
    setLoading(true);
    Promise.all([
      api('/owner/shops'),
      api(`/owner/shops/${shopId}/analytics`),
      api(`/owner/shops/${shopId}/pos/summary`),
      api(`/owner/shops/${shopId}/bookings`),
      api(`/owner/shops/${shopId}/staff`),
      api(`/owner/shops/${shopId}/branches`),
    ])
      .then(([shops, a, p, b, st, br]) => {
        setShop((shops || []).find((s: any) => s._id === shopId) || null);
        setAnalytics(a);
        setPos(p);
        setBookings(b || []);
        setStaff(st || []);
        setBranches(br || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [shopId]);

  const todayBookings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return bookings.filter((b) => String(b.date).slice(0, 10) === today);
  }, [bookings]);

  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => b.status === 'pending' || b.status === 'confirmed')
        .slice(0, 8),
    [bookings],
  );

  if (loading) return <LoadingBlock />;

  const status = shop?.approvalStatus || (shop?.isApproved ? 'approved' : 'pending');

  return (
    <div className="stack">
      <PageHeader
        title={shop?.name || 'داشبورد المحل'}
        subtitle="نظرة على الحجوزات والمبيعات والفروع"
        backTo="/owner"
        actions={
          shop ? <Badge tone={badgeTone('shop', status)}>{shopStatusAr[status] || status}</Badge> : null
        }
      />
      <ErrorBanner message={error} />

      <div className="grid">
        <StatCard label="إيراد 30 يوم" value={money(analytics?.monthlyRevenue)} />
        <StatCard label="حجوزات قادمة" value={analytics?.upcomingAppointments ?? 0} />
        <StatCard label="حجوزات اليوم" value={todayBookings.length} />
        <StatCard label="مبيعات اليوم (POS)" value={money(pos?.sales)} />
        <StatCard label="صافي اليوم" value={money(pos?.net)} />
        <StatCard
          label="نسبة الإلغاء"
          value={`${analytics?.cancellationRate ?? 0}%`}
          hint="آخر 30 يوم"
        />
      </div>

      <div className="quick-links">
        <Link to={`/owner/shops/${shopId}/bookings`} className="quick-link">
          <strong>الحجوزات</strong>
          <span className="muted">{bookings.length} إجمالي · تأكيد وإكمال</span>
        </Link>
        <Link to={`/owner/shops/${shopId}/pos`} className="quick-link">
          <strong>نقطة البيع</strong>
          <span className="muted">فواتير ومصاريف نقدية</span>
        </Link>
        <Link to={`/owner/shops/${shopId}/branches`} className="quick-link">
          <strong>الفروع</strong>
          <span className="muted">{branches.length} فرع · {staff.length} موظف</span>
        </Link>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="card stack">
          <strong>أبرز الخدمات</strong>
          {!analytics?.topServices?.length ? (
            <EmptyState title="ما في بيانات بعد" hint="تظهر بعد اكتمال حجوزات" />
          ) : (
            analytics.topServices.map((s: any) => (
              <div key={s._id} className="row" style={{ justifyContent: 'space-between' }}>
                <span>{s.name}</span>
                <Badge tone="neutral">{s.count} حجز</Badge>
              </div>
            ))
          )}
        </div>

        <div className="card stack">
          <strong>الفروع والموظفين</strong>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">الفروع النشطة</span>
            <strong>{branches.filter((b) => b.isActive !== false).length}</strong>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">الموظفون</span>
            <strong>{staff.length}</strong>
          </div>
          {branches.slice(0, 4).map((b) => (
            <div key={b._id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>
                {b.name}
                {b.isMain ? <span className="muted"> · رئيسي</span> : null}
              </span>
              <Badge tone={b.isActive ? 'ok' : 'neutral'}>{b.isActive ? 'نشط' : 'متوقف'}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="card stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong>حجوزات تحتاج متابعة</strong>
          <Link to={`/owner/shops/${shopId}/bookings`} className="muted small">
            عرض الكل
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState title="لا حجوزات معلّقة" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الزبون</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((b) => (
                  <tr key={b._id}>
                    <td>
                      {b.userId?.name || '—'}
                      {b.guestName ? ` / ${b.guestName}` : ''}
                    </td>
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
