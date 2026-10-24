import { useEffect, useMemo, useState } from 'react';
import { api, money } from '../../lib/api';
import { badgeTone, formatDate, withdrawalStatusAr } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Toolbar, StatCard, CardHeader, Field } from '../../components/ui';

export default function AdminWithdrawals() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState('');
  const [note, setNote] = useState('');

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
    if (status === 'rejected' && !note.trim()) {
      alert('أدخلي سبب الرفض في خانة الملاحظة');
      return;
    }
    setBusyId(id);
    try {
      await api(`/admin/withdrawals/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNote: note.trim() || undefined }),
      });
      setNote('');
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

  const pendingCount = items.filter((w) => w.status === 'pending').length;
  const pendingTotal = items.filter((w) => w.status === 'pending').reduce((sum, w) => sum + (w.amount || 0), 0);

  return (
    <div className="stack">
      <PageHeader title="طلبات السحب" subtitle={`${pendingCount} معلّقة`} />
      <ErrorBanner message={error} />

      <div className="grid cols-3">
        <StatCard icon="⏳" label="طلبات معلّقة" value={pendingCount} />
        <StatCard icon="💸" label="قيمة المعلّق" value={money(pendingTotal)} />
        <StatCard icon="📋" label="كل الطلبات" value={items.length} />
      </div>

      <div className="card stack">
        <CardHeader
          title={`الطلبات (${filtered.length})`}
          extra={
            <Toolbar>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">كل الحالات</option>
                <option value="pending">معلّق</option>
                <option value="approved">موافق عليه</option>
                <option value="completed">مكتمل</option>
                <option value="rejected">مرفوض</option>
              </select>
            </Toolbar>
          }
        />
        {pendingCount > 0 ? (
          <Field label="ملاحظة الإدارة" hint="مطلوبة عند رفض الطلب — تُحفظ مع الطلب">
            <input placeholder="سبب الرفض أو ملاحظة التحويل" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        ) : null}
        {filtered.length === 0 ? (
          <EmptyState title="لا توجد طلبات" hint="غيّري الفلتر أو انتظري طلبات جديدة" icon="↗" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>المالك</th>
                  <th>المبلغ</th>
                  <th>تفاصيل الدفع</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w._id}>
                    <td data-label="المالك">{w.ownerId?.name || w.ownerId?.email || '—'}</td>
                    <td data-label="المبلغ">
                      <strong>{money(w.amount)}</strong>
                    </td>
                    <td data-label="طريقة الاستلام" className="muted small">
                      {w.payoutDetails || '—'}
                      {w.adminNote ? <div>ملاحظة: {w.adminNote}</div> : null}
                    </td>
                    <td data-label="التاريخ">{formatDate(w.createdAt || w.date)}</td>
                    <td data-label="الحالة">
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
