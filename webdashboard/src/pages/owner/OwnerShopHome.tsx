import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, money } from '../../lib/api';
import { badgeTone, bookingStatusAr, formatDate, shopStatusAr } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, StatCard, CardHeader } from '../../components/ui';

async function soft<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export default function OwnerShopHome() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [pos, setPos] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const shops = await api('/owner/shops');
        if (cancelled) return;
        const found = (shops || []).find((s: any) => s._id === shopId) || shops?.[0] || null;
        if (!found) {
          setShop(null);
          setError('ما في مركز مرتبط بالحساب');
          return;
        }
        if (shopId && found._id !== shopId) {
          navigate(`/owner/shops/${found._id}`, { replace: true });
          return;
        }
        setShop(found);
        const id = found._id;
        const [a, p, b, st, br] = await Promise.all([
          soft(() => api(`/owner/shops/${id}/analytics`), null),
          soft(() => api(`/owner/shops/${id}/pos/summary`), null),
          soft(() => api(`/owner/shops/${id}/bookings`), []),
          soft(() => api(`/owner/shops/${id}/staff`), []),
          soft(() => api(`/owner/shops/${id}/branches`), []),
        ]);
        if (cancelled) return;
        setAnalytics(a);
        setPos(p);
        setBookings(b || []);
        setStaff(st || []);
        setBranches(br || []);
      } catch (e: any) {
        if (!cancelled) setError(e.message === 'Not authorized' ? 'انتهت الجلسة أو تغيّرت البيئة — أعيدي تسجيل الدخول' : e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shopId, navigate]);

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

      <div className="grid cols-3">
        <StatCard icon="💵" label="إيراد 30 يوم" value={money(analytics?.monthlyRevenue)} />
        <StatCard icon="📅" label="حجوزات قادمة" value={analytics?.upcomingAppointments ?? 0} />
        <StatCard icon="☀️" label="حجوزات اليوم" value={todayBookings.length} />
        <StatCard icon="🧾" label="مبيعات اليوم (POS)" value={money(pos?.sales)} />
        <StatCard icon="💰" label="صافي اليوم" value={money(pos?.net)} />
        <StatCard
          icon="🚫"
          label="نسبة الإلغاء"
          value={`${Number(analytics?.cancellationRate ?? 0).toLocaleString('ar-SY')}%`}
          hint="آخر 30 يوم"
        />
      </div>

      <div className="quick-links">
        <Link to={`/owner/shops/${shopId}/bookings`} className="quick-link">
          <strong>📅 الحجوزات</strong>
          <span className="muted">{bookings.length} إجمالي · تأكيد وإكمال</span>
        </Link>
        <Link to={`/owner/shops/${shopId}/services`} className="quick-link">
          <strong>✂ الخدمات</strong>
          <span className="muted">أسعار · مدد · صور</span>
        </Link>
        <Link to={`/owner/shops/${shopId}/staff`} className="quick-link">
          <strong>👥 الموظفون</strong>
          <span className="muted">{staff.length} موظف · صور</span>
        </Link>
        <Link to={`/owner/shops/${shopId}/branches`} className="quick-link">
          <strong>📍 الفروع</strong>
          <span className="muted">{branches.length} فرع</span>
        </Link>
        <Link to={`/owner/shops/${shopId}/coupons`} className="quick-link">
          <strong>🎟 الكوبونات</strong>
          <span className="muted">خصومات الزبائن</span>
        </Link>
        <Link to={`/owner/shops/${shopId}/pos`} className="quick-link">
          <strong>🧾 نقطة البيع</strong>
          <span className="muted">فواتير ومصاريف نقدية</span>
        </Link>
        <Link to={`/owner/shops/${shopId}/edit`} className="quick-link">
          <strong>⚙️ تعديل المركز</strong>
          <span className="muted">لوغو · ساعات · موقع</span>
        </Link>
        <Link to={`/owner/shops/${shopId}/portfolio`} className="quick-link">
          <strong>🖼 معرض الأعمال</strong>
          <span className="muted">صور الأعمال</span>
        </Link>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="card stack">
          <CardHeader title="أبرز الخدمات" />
          {!analytics?.topServices?.length ? (
            <EmptyState title="ما في بيانات بعد" hint="تظهر بعد اكتمال حجوزات" icon="✂" />
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
          <CardHeader title="الفروع والموظفين" />
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
        <CardHeader
          title="حجوزات تحتاج متابعة"
          extra={
            <Link to={`/owner/shops/${shopId}/bookings`} className="muted small">
              عرض الكل
            </Link>
          }
        />
        {upcoming.length === 0 ? (
          <EmptyState title="لا حجوزات معلّقة" hint="كل الحجوزات مؤكدة أو مكتملة" icon="✅" />
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
                    <td className="money">{money(b.totalPrice)}</td>
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
