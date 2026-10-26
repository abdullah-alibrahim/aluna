import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../../lib/api';
import { badgeTone, bookingStatusAr, formatDate } from '../../lib/labels';
import { arAuthError } from '../../lib/ownerShop';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Toolbar } from '../../components/ui';

const PAGE_SIZE = 30;

export default function OwnerBookingsAll() {
  const [shops, setShops] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [shopFilter, setShopFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [busyId, setBusyId] = useState('');
  const skipRef = useRef(0);

  const fetchPage = async (nextShop: string, nextStatus: string, reset: boolean) => {
    const skip = reset ? 0 : skipRef.current;
    const query = new URLSearchParams({ limit: String(PAGE_SIZE), skip: String(skip) });
    if (nextStatus !== 'all') query.set('status', nextStatus);
    if (nextShop !== 'all') query.set('shopId', nextShop);

    // One aggregated request replaces one request per shop.
    const page: any[] = await api(`/owner/bookings?${query.toString()}`);
    skipRef.current = skip + (page?.length || 0);
    setHasMore((page?.length || 0) === PAGE_SIZE);
    setBookings((prev) => (reset ? page : [...prev, ...page]));
  };

  const load = async () => {
    setLoading(true);
    try {
      const [myShops] = await Promise.all([api('/owner/shops')]);
      setShops(myShops || []);
      await fetchPage(shopFilter, statusFilter, true);
      setError('');
    } catch (e: any) {
      setError(arAuthError(e.message, e.code) || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopFilter, statusFilter]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchPage(shopFilter, statusFilter, false);
    } catch (e: any) {
      setError(arAuthError(e.message, e.code) || e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = useMemo(() => bookings, [bookings]);

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status } : b)));
    try {
      const updated = await api(`/owner/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, ...(updated as any) } : b)));
      setError('');
    } catch (e: any) {
      setError(arAuthError(e.message, e.code) || 'تعذّر تحديث الحالة');
      load();
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="كل الحجوزات" subtitle={`${filtered.length} حجز عبر ${shops.length} مركز`} backTo="/owner" />
      <ErrorBanner message={error} />
      <Toolbar>
        <select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)}>
          <option value="all">كل المراكز</option>
          {shops.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="confirmed">مؤكّد</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغى</option>
          <option value="no_show">لم يحضر</option>
        </select>
      </Toolbar>

      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState title="لا حجوزات" hint="لا توجد حجوزات مطابقة" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>المركز</th>
                  <th>الزبون</th>
                  <th>الوقت</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b._id}>
                    <td data-label="المركز">
                      {b.shopId?._id ? (
                        <Link to={`/owner/shops/${b.shopId._id}/bookings`}>{b.shopId.name}</Link>
                      ) : (
                        b.shopName || '—'
                      )}
                    </td>
                    <td data-label="الزبون">
                      {b.userId?.name || '—'}
                      {b.guestName ? ` / ${b.guestName}` : ''}
                    </td>
                    <td data-label="الوقت">{formatDate(b.date)} {b.startTime || ''}</td>
                    <td data-label="المبلغ" className="money">{money(b.totalPrice)}</td>
                    <td data-label="الحالة">
                      <Badge tone={badgeTone('booking', b.status)}>
                        {bookingStatusAr[b.status] || b.status}
                      </Badge>
                    </td>
                    <td className="row">
                      {b.status === 'pending' && (
                        <button type="button" disabled={busyId === b._id} onClick={() => setStatus(b._id, 'confirmed')}>
                          تأكيد
                        </button>
                      )}
                      {(b.status === 'pending' || b.status === 'confirmed') && (
                        <button
                          type="button"
                          className="secondary"
                          disabled={busyId === b._id}
                          onClick={() => setStatus(b._id, 'completed')}
                        >
                          إكمال
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasMore && filtered.length > 0 && (
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="secondary" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? 'جارٍ التحميل…' : 'تحميل المزيد'}
          </button>
        </div>
      )}
    </div>
  );
}
