import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { badgeTone, formatDate, ticketStatusAr } from '../../lib/labels';
import { usePolling } from '../../lib/usePolling';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

export default function OwnerTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const conversationRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    try {
      setTickets(await api('/users/tickets'));
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
      setMessages(await api(`/users/tickets/${selected._id}/messages`));
    } catch {
      /* keep */
    }
  }, [selected?._id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (selected && window.innerWidth < 821) {
      const t = setTimeout(() => conversationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [selected?._id]);

  usePolling(() => load(true), 8000, true);
  usePolling(refreshMessages, 4000, Boolean(selected?._id));

  const openTicket = async (t: any) => {
    setSelected(t);
    try {
      setMessages(await api(`/users/tickets/${t._id}/messages`));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/users/tickets', {
        method: 'POST',
        body: JSON.stringify({ subject, reason: body }),
      });
      setSubject('');
      setBody('');
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !text.trim()) return;
    setBusy(true);
    try {
      await api(`/users/tickets/${selected._id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      setText('');
      setMessages(await api(`/users/tickets/${selected._id}/messages`));
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="الدعم والرسائل" subtitle="تواصل مع إدارة المنصة" />
      <ErrorBanner message={error} />

      <form className="card stack" onSubmit={create}>
        <CardHeader title="تذكرة جديدة" extra={<span className="muted small">يرد عليك فريق المنصة</span>} />
        <div className="form-grid">
          <Field label="الموضوع" required className="span-2">
            <input placeholder="مثال: مشكلة في الحجوزات" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </Field>
          <Field label="الرسالة" required className="span-2">
            <textarea placeholder="اشرحي المشكلة بالتفصيل..." value={body} onChange={(e) => setBody(e.target.value)} rows={3} required />
          </Field>
        </div>
        <div className="row">
          <button type="submit" disabled={busy}>
            {busy ? 'جاري الإرسال...' : 'إرسال التذكرة'}
          </button>
        </div>
      </form>

      <div className="grid support-grid">
        <div className="card stack">
          <CardHeader title={`تذاكري (${tickets.length})`} />
          {tickets.length === 0 ? (
            <EmptyState title="لا تذاكر" hint="أرسلي تذكرة إذا احتجت مساعدة" icon="🎫" />
          ) : (
            tickets.map((t) => (
              <button key={t._id} type="button" className="ticket-item" onClick={() => openTicket(t)}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <strong>{t.subject}</strong>
                  <Badge tone={badgeTone('ticket', t.status)}>{ticketStatusAr[t.status] || t.status}</Badge>
                </div>
                <div className="muted small">{formatDate(t.createdAt)}</div>
              </button>
            ))
          )}
        </div>

        <div className="card stack conversation-card" ref={conversationRef}>
          {!selected ? (
            <EmptyState title="اختاري تذكرة" hint="لعرض المحادثة والرد" icon="💬" />
          ) : (
            <>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{selected.subject}</strong>
                <Badge tone={badgeTone('ticket', selected.status)}>
                  {ticketStatusAr[selected.status] || selected.status}
                </Badge>
              </div>
              <div className="chat-thread">
                {selected.reason ? (
                  <div className="chat-bubble mine">
                    <div className="meta">أنت · {formatDate(selected.createdAt)}</div>
                    <div>{selected.reason}</div>
                  </div>
                ) : null}
                {messages.map((m) => (
                  <div key={m._id} className={`chat-bubble ${m.isAdmin ? '' : 'mine'}`}>
                    <div className="meta">
                      {m.senderId?.name || '—'} · {formatDate(m.createdAt)}
                    </div>
                    <div>{m.text || m.message}</div>
                  </div>
                ))}
              </div>
              {selected.status === 'resolved' ? (
                <div className="banner success-banner">
                  تم حل هذه التذكرة. أرسلي تذكرة جديدة إذا احتجت متابعة.
                </div>
              ) : (
                <form className="row" onSubmit={send}>
                  <input
                    style={{ flex: 1 }}
                    placeholder="اكتب ردك..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button type="submit" disabled={busy}>
                    إرسال
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
