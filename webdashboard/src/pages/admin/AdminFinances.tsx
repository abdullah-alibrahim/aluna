import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../../lib/api';
import { formatDate } from '../../lib/labels';
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, StatCard, CardHeader, Field } from '../../components/ui';

export default function AdminFinances() {
  const [owed, setOwed] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [amount, setAmount] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [note, setNote] = useState('');
  const [referenceId, setReferenceId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [w, p] = await Promise.all([api('/admin/finances/owed'), api('/admin/finances/payouts')]);
      setOwed(w || []);
      setPayouts(p || []);
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

  const totalOwed = owed.reduce((s, w) => s + Number(w.balance || 0), 0);

  const payout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerId || !amount) return;
    setBusy('pay');
    try {
      await api('/admin/finances/payouts', {
        method: 'POST',
        body: JSON.stringify({
          ownerId,
          amount: Number(amount),
          adminNote: note || undefined,
          referenceId: referenceId.trim() || undefined,
        }),
      });
      setAmount('');
      setNote('');
      setReferenceId('');
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy('');
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader
        title="المالية والمدفوعات"
        subtitle="أرصدة المراكز وتسجيل الدفعات"
        actions={
          <Link to="/admin/withdrawals" className="btn-link">
            طلبات السحب →
          </Link>
        }
      />
      <ErrorBanner message={error} />

      <div className="grid cols-3">
        <StatCard icon="💳" label="إجمالي المستحقات" value={money(totalOwed)} />
        <StatCard icon="🏪" label="محافظ مستحقة" value={owed.length} />
        <StatCard icon="✅" label="دفعات مسجّلة" value={payouts.length} />
      </div>

      <form className="card stack" onSubmit={payout}>
        <CardHeader title="تسجيل دفعة لمالك" />
        <div className="form-grid">
          <Field label="المالك" required className="span-2">
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required>
              <option value="">اختاري المالك</option>
              {owed.map((w) => (
                <option key={w._id} value={w.ownerId?._id || w.ownerId}>
                  {w.ownerId?.name || w.ownerId} — {money(w.balance)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="المبلغ (ل.س)" required>
            <input
              type="number"
              min="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
          <Field label="رقم مرجعي للتحويل" hint="اختياري">
            <input placeholder="رقم الحوالة" value={referenceId} onChange={(e) => setReferenceId(e.target.value)} />
          </Field>
          <Field label="ملاحظة" hint="اختياري" className="span-2">
            <input placeholder="ملاحظة داخلية" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
        <div className="row">
          <button type="submit" disabled={busy === 'pay'}>
            {busy === 'pay' ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
          </button>
        </div>
      </form>

      <div className="card stack">
        <CardHeader title="أرصدة مستحقة" />
        {owed.length === 0 ? (
          <EmptyState title="لا مستحقات حالياً" hint="كل أرصدة المالكين مسدّدة" icon="✅" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>المالك</th>
                  <th>الرصيد</th>
                  <th>المسحوب</th>
                </tr>
              </thead>
              <tbody>
                {owed.map((w) => (
                  <tr key={w._id}>
                    <td data-label="المالك">
                      <strong>{w.ownerId?.name || '—'}</strong>
                      <div className="muted small">{w.ownerId?.email}</div>
                    </td>
                    <td data-label="الرصيد" className="money">{money(w.balance)}</td>
                    <td data-label="المسحوب" className="money">{money(w.totalWithdrawn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card stack">
        <CardHeader title={`سجل الدفعات (${payouts.length})`} />
        {payouts.length === 0 ? (
          <EmptyState title="لا دفعات مسجّلة" hint="الدفعات التي تسجّلها للمالكين تظهر هنا" icon="🧾" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>المالك</th>
                  <th>المبلغ</th>
                  <th>المرجع</th>
                  <th>ملاحظة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {payouts.slice(0, 30).map((p) => (
                  <tr key={p._id}>
                    <td data-label="المالك">{p.ownerId?.name || '—'}</td>
                    <td data-label="المبلغ" className="money">{money(p.amount)}</td>
                    <td data-label="المرجع" className="small" dir="ltr" style={{ textAlign: 'right' }}>{p.referenceId || '—'}</td>
                    <td data-label="ملاحظة" className="small">{p.adminNote || '—'}</td>
                    <td data-label="التاريخ">{formatDate(p.createdAt)}</td>
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
