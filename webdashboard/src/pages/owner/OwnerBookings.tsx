import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, money } from '../../lib/api';
import { badgeTone, bookingStatusAr, formatDate } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Toolbar } from '../../components/ui';

export default function OwnerBookings() {
  const { shopId } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await api(`/owner/shops/${shopId}/bookings`));
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [shopId]);

  const setStatus = async (id: string, next: string) => {
    setBusyId(id);
    try {
      await api(`/owner/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId('');
    }
  };

  const filtered = useMemo(
    () => (status === 'all' ? items : items.filter((b) => b.status === status)),
    [items, status],
  );

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader
        title="حجوزات الصالون"
        subtitle={`${filtered.length} حجز`}
        backTo="/owner"
      />
      <ErrorBanner message={error} />
      <Toolbar>
        <select value={status} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="confirmed">مؤكّد</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغى</option>
        </select>
      </Toolbar>
      <div className="card">
        {filtered.length === 0 ? (
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
                {filtered.map((b) => (
                  <tr key={b._id}>
                    <td>
                      {b.userId?.name || '—'}
                      {b.guestName ? ` / ${b.guestName}` : ''}
                      {b.groupId ? <span className="muted"> · جماعي</span> : null}
                    </td>
                    <td>
                      {formatDate(b.date)} {b.startTime || ''}
                    </td>
                    <td>{money(b.totalPrice)}</td>
                    <td>
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
    </div>
  );
}
