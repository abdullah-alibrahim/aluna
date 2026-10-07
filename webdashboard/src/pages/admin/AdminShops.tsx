import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { badgeTone, shopStatusAr } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Toolbar } from '../../components/ui';

export default function AdminShops() {
  const [pending, setPending] = useState<any[]>([]);
  const [all, setAll] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([api('/admin/shops/pending'), api('/admin/shops')]);
      setPending(p);
      setAll(a);
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

  const setStatus = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    try {
      await api(`/admin/shops/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          rejectionReason: status === 'rejected' ? note || 'مرفوض من الإدارة' : undefined,
        }),
      });
      setNote('');
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId('');
    }
  };

  const toggleFeatured = async (id: string) => {
    setBusyId(id);
    try {
      await api(`/admin/shops/${id}/featured`, { method: 'PATCH' });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId('');
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim();
    if (!term) return all;
    return all.filter((s) =>
      [s.name, s.ownerId?.name, s.cityId?.name, s.approvalStatus]
        .filter(Boolean)
        .some((v) => String(v).includes(term)),
    );
  }, [all, q]);

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="الصالونات" subtitle={`${pending.length} بانتظار الموافقة · ${all.length} إجمالي`} />
      <ErrorBanner message={error} />

      <div className="card stack">
        <strong>بانتظار الموافقة ({pending.length})</strong>
        <input
          placeholder="ملاحظة الرفض (اختياري)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {pending.length === 0 ? (
          <EmptyState title="لا توجد طلبات معلّقة" hint="كل الطلبات تمت مراجعتها" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>المالك</th>
                  <th>المدينة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <strong>{s.name}</strong>
                    </td>
                    <td>{s.ownerId?.name || '—'}</td>
                    <td>{s.cityId?.name || '—'}</td>
                    <td className="row">
                      <button type="button" disabled={busyId === s._id} onClick={() => setStatus(s._id, 'approved')}>
                        موافقة
                      </button>
                      <button
                        type="button"
                        className="danger"
                        disabled={busyId === s._id}
                        onClick={() => setStatus(s._id, 'rejected')}
                      >
                        رفض
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong>كل الصالونات ({filtered.length})</strong>
          <Toolbar>
            <input placeholder="بحث بالاسم أو المالك..." value={q} onChange={(e) => setQ(e.target.value)} />
          </Toolbar>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="لا نتائج" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>المالك</th>
                  <th>الحالة</th>
                  <th>مميّز</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const status = s.approvalStatus || (s.isApproved ? 'approved' : 'pending');
                  return (
                    <tr key={s._id}>
                      <td>
                        <strong>{s.name}</strong>
                      </td>
                      <td>{s.ownerId?.name || '—'}</td>
                      <td>
                        <Badge tone={badgeTone('shop', status)}>{shopStatusAr[status] || status}</Badge>
                      </td>
                      <td>
                        <Badge tone={s.isFeatured ? 'ok' : 'neutral'}>{s.isFeatured ? 'مميّز' : 'عادي'}</Badge>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="secondary"
                          disabled={busyId === s._id}
                          onClick={() => toggleFeatured(s._id)}
                        >
                          {s.isFeatured ? 'إلغاء التمييز' : 'تمييز'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
