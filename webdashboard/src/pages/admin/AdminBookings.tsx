import { useEffect, useMemo, useState } from 'react';
import { api, money } from '../../lib/api';
import { badgeTone, bookingStatusAr, formatDate } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Toolbar } from '../../components/ui';

export default function AdminBookings() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    setLoading(true);
    api('/admin/bookings')
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((b) => {
      if (status !== 'all' && b.status !== status) return false;
      const term = q.trim();
      if (!term) return true;
      return [b.shopId?.name, b.userId?.name, b.status]
        .filter(Boolean)
        .some((v) => String(v).includes(term));
    });
  }, [items, q, status]);

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="الحجوزات" subtitle={`${filtered.length} من ${items.length}`} />
      <ErrorBanner message={error} />
      <Toolbar>
        <input placeholder="بحث بالصالون أو الزبون..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="confirmed">مؤكّد</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغى</option>
        </select>
      </Toolbar>
      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState title="لا حجوزات مطابقة" />
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
                {filtered.slice(0, 150).map((b) => (
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
