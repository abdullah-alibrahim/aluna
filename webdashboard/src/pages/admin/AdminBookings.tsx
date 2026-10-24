import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../../lib/api';
import { badgeTone, bookingStatusAr, formatDate } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Toolbar } from '../../components/ui';

export default function AdminBookings() {
  const nav = useNavigate();
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

  const changeStatus = async (id: string, newStatus: string) => {
    if (!confirm(`تأكيد تغيير حالة الحجز إلى ${newStatus}؟`)) return;
    try {
      await api(`/admin/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
      setItems(items.map((b) => b._id === id ? { ...b, status: newStatus } : b));
    } catch (e: any) {
      alert(e.message || 'فشل التحديث');
    }
  };

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
        <input placeholder="بحث بالمركز أو الزبون..." value={q} onChange={(e) => setQ(e.target.value)} />
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
                  <th>مركز التجميل</th>
                  <th>الزبون</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                  <th>المبلغ</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 150).map((b) => (
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
                    <td data-label="الإجراء" className="actions">
                      {b.status !== 'completed' && (
                        <button className="btn btn-sm outline" onClick={() => changeStatus(b._id, 'completed')}>إكمال</button>
                      )}
                      {b.status !== 'cancelled' && (
                        <button className="btn btn-sm outline" onClick={() => changeStatus(b._id, 'cancelled')}>إلغاء</button>
                      )}
                      <a className="btn btn-sm" onClick={(e) => { e.preventDefault(); nav(`/admin/shops/${b.shopId?._id}`); }}>المركز</a>
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
