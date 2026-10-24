import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { badgeTone, formatDate, ticketStatusAr } from '../../lib/labels';
import { usePolling } from '../../lib/usePolling';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Toolbar } from '../../components/ui';

export default function AdminTickets() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    try {
      setItems(await api('/admin/tickets'));
      setError('');
    } catch (e: any) {
      if (!soft) setError(e.message);
    } finally {
      if (!soft) setLoading(false);
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    if (!selected?._id) return;
    try {
      setMessages(await api(`/admin/tickets/${selected._id}/messages`));
    } catch {
      /* keep previous */
    }
  }, [selected?._id]);

  useEffect(() => {
    load();
  }, [load]);

  usePolling(() => load(true), 8000, true);
  usePolling(refreshMessages, 4000, Boolean(selected?._id));

  const openTicket = async (t: any) => {
    setSelected(t);
    setBusyId(t._id);
    try {
      setMessages(await api(`/admin/tickets/${t._id}/messages`));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId('');
    }
  };

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await api(`/admin/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
      if (selected?._id === id) {
        setSelected({ ...selected, status });
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId('');
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !text.trim()) return;
    setBusyId('send');
    try {
      await api(`/admin/tickets/${selected._id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      setText('');
      setMessages(await api(`/admin/tickets/${selected._id}/messages`));
      await load();
    } catch (err: any) {
      alert(err.message);
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

      <div className="grid support-grid">
        <div className="card">
          {filtered.length === 0 ? (
            <EmptyState
              title={filter === 'all' ? 'لا تذاكر' : 'لا تذاكر بهذه الحالة'}
              hint={filter === 'all' ? 'صندوق الدعم فارغ حالياً' : 'جرّبي تغيير الفلتر لعرض تذاكر أخرى'}
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>الموضوع</th>
                    <th>الحالة</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t._id} style={{ background: selected?._id === t._id ? 'rgba(181,148,81,0.08)' : undefined }}>
                      <td>
                        <strong>{t.subject}</strong>
                        <div className="muted small">{t.userId?.name || t.userId?.email || '—'}</div>
                        <div className="muted small">{formatDate(t.createdAt)}</div>
                      </td>
                      <td>
                        <Badge tone={badgeTone('ticket', t.status)}>
                          {ticketStatusAr[t.status] || t.status}
                        </Badge>
                      </td>
                      <td className="row">
                        <button type="button" className="secondary" disabled={busyId === t._id} onClick={() => openTicket(t)}>
                          محادثة
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
          {!selected ? (
            <EmptyState title="اختاري تذكرة" hint="افتحي المحادثة للرد" />
          ) : (
            <>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>{selected.subject}</strong>
                  <div className="muted small">{selected.reason || selected.message || ''}</div>
                </div>
                <div className="row">
                  {selected.status === 'open' && (
                    <button type="button" disabled={!!busyId} onClick={() => setStatus(selected._id, 'in_progress')}>
                      متابعة
                    </button>
                  )}
                  {selected.status !== 'resolved' && selected.status !== 'closed' && (
                    <button type="button" className="secondary" disabled={!!busyId} onClick={() => setStatus(selected._id, 'resolved')}>
                      حل
                    </button>
                  )}
                  {selected.status !== 'closed' && (
                    <button type="button" className="secondary" disabled={!!busyId} onClick={() => setStatus(selected._id, 'closed')}>
                      إغلاق
                    </button>
                  )}
                </div>
              </div>
              <div className="stack chat-thread">
                {messages.length === 0 ? (
                  <span className="muted">لا رسائل بعد</span>
                ) : (
                  messages.map((m) => (
                    <div key={m._id} className={`chat-bubble ${m.senderRole === 'admin' || m.isAdmin ? 'mine' : ''}`}>
                      <div className="muted small">{m.senderId?.name || m.senderRole || '—'}</div>
                      <div>{m.text || m.message || m.body}</div>
                    </div>
                  ))
                )}
              </div>
              <form className="row" onSubmit={send}>
                <input
                  style={{ flex: 1 }}
                  placeholder="اكتبي رداً..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button type="submit" disabled={busyId === 'send' || !text.trim()}>
                  إرسال
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
