import { useEffect, useMemo, useState } from 'react';
import { api, money } from '../../lib/api';
import { badgeTone, formatDate, withdrawalStatusAr } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Toolbar } from '../../components/ui';

export default function AdminWithdrawals() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await api('/admin/withdrawals'));
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

  const act = async (id: string, status: 'approved' | 'rejected' | 'completed') => {
    setBusyId(id);
    try {
      await api(`/admin/withdrawals/${id}/approve`, {
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
    () => (filter === 'all' ? items : items.filter((w) => w.status === filter)),
    [items, filter],
  );

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="طلبات السحب" subtitle={`${items.filter((w) => w.status === 'pending').length} معلّقة`} />
      <ErrorBanner message={error} />
      <Toolbar>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="pending">معلّق</option>
          <option value="approved">موافق عليه</option>
          <option value="completed">مكتمل</option>
          <option value="rejected">مرفوض</option>
        </select>
      </Toolbar>
      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState title="لا توجد طلبات" hint="غيّري الفلتر أو انتظري طلبات جديدة" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>المالك</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w._id}>
                    <td>{w.ownerId?.name || w.ownerId?.email || '—'}</td>
                    <td>
                      <strong>{money(w.amount)}</strong>
                    </td>
                    <td>{formatDate(w.createdAt || w.date)}</td>
                    <td>
                      <Badge tone={badgeTone('withdrawal', w.status)}>
                        {withdrawalStatusAr[w.status] || w.status}
                      </Badge>
                    </td>
                    <td className="row">
                      {w.status === 'pending' && (
                        <>
                          <button type="button" disabled={busyId === w._id} onClick={() => act(w._id, 'approved')}>
                            موافقة
                          </button>
                          <button
                            type="button"
                            className="danger"
                            disabled={busyId === w._id}
                            onClick={() => act(w._id, 'rejected')}
                          >
                            رفض
                          </button>
                        </>
                      )}
                      {w.status === 'approved' && (
                        <button type="button" disabled={busyId === w._id} onClick={() => act(w._id, 'completed')}>
                          تم التحويل
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
