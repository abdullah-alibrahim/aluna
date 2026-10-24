import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../../lib/api';
import { badgeTone, bookingStatusAr, formatDate } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Toolbar } from '../../components/ui';

export default function OwnerBookingsAll() {
  const [shops, setShops] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [shopFilter, setShopFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const myShops = await api('/owner/shops');
      setShops(myShops || []);
      const lists = await Promise.all(
        (myShops || []).map(async (s: any) => {
          const rows = await api(`/owner/shops/${s._id}/bookings`);
          return (rows || []).map((b: any) => ({ ...b, shopName: s.name, shopId: s._id }));
        }),
      );
      setBookings(lists.flat().sort((a, b) => String(b.date).localeCompare(String(a.date))));
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (shopFilter !== 'all' && b.shopId !== shopFilter) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      return true;
    });
  }, [bookings, shopFilter, statusFilter]);

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await api(`/owner/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="كل الحجوزات" subtitle={`${filtered.length} حجز عبر مراكزك`} />
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
          <option value="pending">معلّق</option>
          <option value="confirmed">مؤكد</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغى</option>
        </select>
      </Toolbar>

      <div className="card stack">
        {filtered.length === 0 ? (
          <EmptyState title="لا حجوزات" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>المركز</th>
                  <th>الزبون</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                  <th>المبلغ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b._id}>
                    <td data-label="المركز">
                      <Link to={`/owner/shops/${b.shopId}`}>{b.shopName}</Link>
                    </td>
                    <td data-label="الزبون">
                      {b.userId?.name || '—'}
                      {b.guestName ? ` / ${b.guestName}` : ''}
                    </td>
                    <td data-label="الوقت">
                      {formatDate(b.date)} {b.startTime || ''}
                    </td>
                    <td data-label="الحالة">
                      <Badge tone={badgeTone('booking', b.status)}>
                        {bookingStatusAr[b.status] || b.status}
                      </Badge>
                    </td>
                    <td data-label="المبلغ" className="money">{money(b.totalPrice)}</td>
                    <td className="row">
                      {b.status === 'pending' ? (
                        <button type="button" disabled={busyId === b._id} onClick={() => setStatus(b._id, 'confirmed')}>
                          تأكيد
                        </button>
                      ) : null}
                      {b.status === 'confirmed' ? (
                        <button type="button" disabled={busyId === b._id} onClick={() => setStatus(b._id, 'completed')}>
                          إكمال
                        </button>
                      ) : null}
                    </td>
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
