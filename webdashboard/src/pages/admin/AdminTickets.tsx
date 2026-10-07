import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { badgeTone, formatDate, ticketStatusAr } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Toolbar } from '../../components/ui';

export default function AdminTickets() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await api('/admin/tickets'));
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

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await api(`/admin/tickets/${id}`, {
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

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((t) => t.status === filter)),
    [items, filter],
  );

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader
        title="تذاكر الدعم"
        subtitle={`${items.filter((t) => t.status === 'open').length} مفتوحة`}
      />
      <ErrorBanner message={error} />
      <Toolbar>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">الكل</option>
          <option value="open">مفتوحة</option>
          <option value="in_progress">قيد المعالجة</option>
          <option value="resolved">محلولة</option>
          <option value="closed">مغلقة</option>
        </select>
      </Toolbar>
      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState title="لا تذاكر" hint="صندوق الدعم فارغ حالياً" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الموضوع</th>
                  <th>المستخدم</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <strong>{t.subject}</strong>
                      <div className="muted">{t.reason || t.message || ''}</div>
                    </td>
                    <td>{t.userId?.name || t.userId?.email || '—'}</td>
                    <td>{formatDate(t.createdAt)}</td>
                    <td>
                      <Badge tone={badgeTone('ticket', t.status)}>
                        {ticketStatusAr[t.status] || t.status}
                      </Badge>
                    </td>
                    <td className="row">
                      {t.status === 'open' && (
                        <button type="button" disabled={busyId === t._id} onClick={() => setStatus(t._id, 'in_progress')}>
                          متابعة
                        </button>
                      )}
                      {t.status !== 'resolved' && t.status !== 'closed' && (
                        <button
                          type="button"
                          className="secondary"
                          disabled={busyId === t._id}
                          onClick={() => setStatus(t._id, 'resolved')}
                        >
                          حل
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
