import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader } from '../../components/ui';

export default function AdminNotifications() {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'user' | 'owner'>('all');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

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

  const broadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('إرسال الإشعار للجميع حسب الجمهور المحدد؟')) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await api('/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, message, audience }),
      });
      setTitle('');
      setMessage('');
      setMsg(`تم الإرسال إلى ${res.sent} مستلم`);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader
        title="الإشعارات"
        subtitle="واردك + إرسال جماعي للتطبيقات"
        actions={
          <button type="button" className="secondary" onClick={markAll}>
            تعليم الكل كمقروء
          </button>
        }
      />
      <ErrorBanner message={error} />
      {msg ? <div className="banner success-banner">{msg}</div> : null}

      <form className="card stack" onSubmit={broadcast}>
        <strong>إرسال إشعار جماعي</strong>
        <select value={audience} onChange={(e) => setAudience(e.target.value as any)}>
          <option value="all">الزبائن + المراكز</option>
          <option value="user">الزبائن فقط</option>
          <option value="owner">المراكز فقط</option>
        </select>
        <input placeholder="عنوان الإشعار" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea
          placeholder="نص الرسالة"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? 'جاري الإرسال...' : 'إرسال'}
        </button>
      </form>

      <div className="card stack">
        <strong>وارد الإدارة</strong>
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
