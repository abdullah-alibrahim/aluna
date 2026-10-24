import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader } from '../../components/ui';

export default function OwnerNotifications() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await api('/notifications'));
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

  const markAll = async () => {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const markOne = async (id: string) => {
    try {
      await api(`/notifications/${id}/read`, { method: 'PATCH' });
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader
        title="الإشعارات"
        subtitle="تنبيهات الحجوزات والموافقة والسحب"
        actions={
          <button type="button" className="secondary" onClick={markAll}>
            تعليم الكل كمقروء
          </button>
        }
      />
      <ErrorBanner message={error} />
      <div className="card stack">
        {items.length === 0 ? (
          <EmptyState title="لا إشعارات" />
        ) : (
          items.map((n) => (
            <div
              key={n._id}
              className="row"
              style={{ justifyContent: 'space-between', opacity: n.isRead || n.read ? 0.65 : 1 }}
            >
              <div>
                <strong>{n.title || 'إشعار'}</strong>
                <div className="muted">{n.body || n.message || ''}</div>
                <div className="muted small">{formatDate(n.createdAt)}</div>
              </div>
              <div className="row">
                <Badge tone={n.isRead || n.read ? 'neutral' : 'warn'}>
                  {n.isRead || n.read ? 'مقروء' : 'جديد'}
                </Badge>
                {!(n.isRead || n.read) ? (
                  <button type="button" className="secondary" onClick={() => markOne(n._id)}>
                    قراءة
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
