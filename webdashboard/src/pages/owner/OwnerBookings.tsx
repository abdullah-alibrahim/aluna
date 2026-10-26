import { useEffect, useMemo, useRef, useState } from 'react';
import { api, money } from '../../lib/api';
import { badgeTone, bookingStatusAr, formatDate } from '../../lib/labels';
import { arAuthError } from '../../lib/ownerShop';
import { useOwnerShopId } from '../../hooks/useOwnerShopId';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Toolbar } from '../../components/ui';

const PAGE_SIZE = 20;

export default function OwnerBookings() {
  const { shopId, ready, error: shopError } = useOwnerShopId('bookings');
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [status, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState('');
  const skipRef = useRef(0);

  const fetchPage = async (nextStatus: string, reset: boolean) => {
    if (!shopId) return;
    const skip = reset ? 0 : skipRef.current;
    const query = new URLSearchParams({ limit: String(PAGE_SIZE), skip: String(skip) });
    if (nextStatus !== 'all') query.set('status', nextStatus);

    const page: any[] = await api(`/owner/shops/${shopId}/bookings?${query.toString()}`);
    skipRef.current = skip + (page?.length || 0);
    setHasMore((page?.length || 0) === PAGE_SIZE);
    setItems((prev) => (reset ? page : [...prev, ...page]));
  };

  const load = async (nextStatus = status) => {
    setLoading(true);
    try {
      await fetchPage(nextStatus, true);
      setError('');
    } catch (e: any) {
      setError(arAuthError(e.message, e.code) || 'تعذّر تحميل الحجوزات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !shopId) return;
    load(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, shopId, status]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchPage(status, false);
    } catch (e: any) {
      setError(arAuthError(e.message, e.code) || 'تعذّر تحميل المزيد');
    } finally {
      setLoadingMore(false);
    }
  };

  const setStatus = async (id: string, next: string) => {
    setBusyId(id);
    // Optimistic update keeps the table snappy; server response reconciles shortly after.
    setItems((prev) => prev.map((b) => (b._id === id ? { ...b, status: next } : b)));
    try {
      const updated = await api(`/owner/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      setItems((prev) => prev.map((b) => (b._id === id ? { ...b, ...(updated as any) } : b)));
      if (status !== 'all' && next !== status) {
        setItems((prev) => prev.filter((b) => b._id !== id));
      }
      setError('');
    } catch (e: any) {
      setError(arAuthError(e.message, e.code) || 'تعذّر تحديث الحالة');
      load(status);
    } finally {
      setBusyId('');
    }
  };

  const total = useMemo(() => items.length, [items]);

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="حجوزات المركز" subtitle={`${total} حجز`} backTo={`/owner/shops/${shopId || ''}`} />
      <ErrorBanner message={shopError || error} />
      <Toolbar>
        <select value={status} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="confirmed">مؤكّد</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغى</option>
          <option value="no_show">لم يحضر</option>
        </select>
      </Toolbar>
      <div className="card">
        {items.length === 0 ? (
          <EmptyState title="لا حجوزات" hint="الحجوزات الجديدة تظهر هنا" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الزبون</th>
                  <th>الوقت</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b._id}>
                    <td data-label="الزبون">
                      {b.userId?.name || '—'}
                      {b.guestName ? ` / ${b.guestName}` : ''}
                      {b.groupId ? <span className="muted"> · جماعي</span> : null}
                    </td>
                    <td data-label="الوقت">
                      {formatDate(b.date)} {b.startTime || ''}
                    </td>
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
                        <>
                          <button
                            type="button"
                            className="secondary"
                            disabled={busyId === b._id}
                            onClick={() => setStatus(b._id, 'completed')}
                          >
                            إكمال
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            disabled={busyId === b._id}
                            onClick={() => setStatus(b._id, 'no_show')}
                          >
                            لم يحضر
                          </button>
                          <button
                            type="button"
                            className="danger"
                            disabled={busyId === b._id}
                            onClick={() => setStatus(b._id, 'cancelled')}
                          >
                            إلغاء
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasMore && items.length > 0 && (
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="secondary" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? 'جارٍ التحميل…' : 'تحميل المزيد'}
          </button>
        </div>
      )}
    </div>
  );
}
