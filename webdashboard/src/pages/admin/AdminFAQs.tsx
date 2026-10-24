import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

const TARGET_AR: Record<string, string> = {
  user: 'للزبائن',
  owner: 'للمراكز',
  all: 'للجميع',
};

export default function AdminFAQs() {
  const [items, setItems] = useState<any[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [target, setTarget] = useState('user');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await api('/admin/faqs'));
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

  const reset = () => {
    setQuestion('');
    setAnswer('');
    setTarget('user');
    setEditingId(null);
  };

  const startEdit = (f: any) => {
    setEditingId(f._id);
    setQuestion(f.question || '');
    setAnswer(f.answer || '');
    setTarget(f.target || 'user');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId(editingId || 'new');
    try {
      const body = { question, answer, target };
      if (editingId) {
        await api(`/admin/faqs/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/admin/faqs', { method: 'POST', body: JSON.stringify(body) });
      }
      reset();
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusyId('');
    }
  };

  const toggle = async (id: string) => {
    setBusyId(id);
    try {
      await api(`/admin/faqs/${id}/toggle`, { method: 'PATCH' });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId('');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('حذف السؤال؟')) return;
    setBusyId(id);
    try {
      await api(`/admin/faqs/${id}`, { method: 'DELETE' });
      if (editingId === id) reset();
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="الأسئلة الشائعة" subtitle="محتوى المساعدة في التطبيقات" />
      <ErrorBanner message={error} />

      <form className="card stack" onSubmit={save}>
        <CardHeader title={editingId ? 'تعديل سؤال' : 'إضافة سؤال'} />
        <div className="form-grid">
          <Field label="موجّه إلى" required>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="user">للزبائن</option>
              <option value="owner">للمراكز</option>
              <option value="all">للجميع</option>
            </select>
          </Field>
          <Field label="السؤال" required className="span-2">
            <input placeholder="مثال: كيف أحجز موعداً؟" value={question} onChange={(e) => setQuestion(e.target.value)} required />
          </Field>
          <Field label="الجواب" required className="span-2">
            <textarea placeholder="اكتبي الجواب بالتفصيل..." value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} required />
          </Field>
        </div>
        <div className="row">
          <button type="submit" disabled={!!busyId}>
            {editingId ? 'حفظ التعديل' : 'إضافة السؤال'}
          </button>
          {editingId ? (
            <button type="button" className="secondary" onClick={reset}>
              إلغاء
            </button>
          ) : null}
        </div>
      </form>

      <div className="card stack">
        <CardHeader title={`الأسئلة (${items.length})`} />
        {items.length === 0 ? (
          <EmptyState title="لا أسئلة بعد" hint="أضيفي أسئلة مساعدة للزبائن والمراكز" icon="❓" />
        ) : (
          items.map((f) => (
            <div key={f._id} className="faq-item">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{f.question}</strong>
                <Badge tone={f.isActive !== false ? 'ok' : 'neutral'}>
                  {TARGET_AR[f.target] || f.target} · {f.isActive !== false ? 'نشط' : 'متوقف'}
                </Badge>
              </div>
              <p className="muted">{f.answer}</p>
              <div className="row">
                <button type="button" className="secondary" onClick={() => startEdit(f)}>
                  تعديل
                </button>
                <button type="button" className="secondary" disabled={busyId === f._id} onClick={() => toggle(f._id)}>
                  {f.isActive !== false ? 'إيقاف' : 'تفعيل'}
                </button>
                <button type="button" className="danger" disabled={busyId === f._id} onClick={() => remove(f._id)}>
                  حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
