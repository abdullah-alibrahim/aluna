import { useEffect, useState } from 'react';
import { api, money } from '../../lib/api';
import { badgeTone, formatDate, withdrawalStatusAr } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, StatCard, CardHeader, Field } from '../../components/ui';

export default function OwnerWallet() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [data, txList] = await Promise.all([
        api('/owner/wallet'),
        api('/owner/wallet/transactions?limit=50').catch(() => []),
      ]);
      setWallet(data.wallet);
      setWithdrawals(data.withdrawals || []);
      setTransactions(Array.isArray(txList) ? txList : txList?.data || []);
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

  const pending = withdrawals.find((w) => w.status === 'pending');

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 100) {
      alert('الحد الأدنى للسحب 100 ل.س');
      return;
    }
    if (value > Number(wallet?.balance || 0)) {
      alert('المبلغ أكبر من الرصيد المتاح');
      return;
    }
    setBusy(true);
    try {
      await api('/owner/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount), payoutDetails }),
      });
      setAmount('');
      setPayoutDetails('');
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
      <PageHeader title="المحفظة" subtitle="رصيدك وطلبات السحب" />
      <ErrorBanner message={error} />

      <div className="grid">
        <StatCard label="الرصيد المتاح" value={money(wallet?.balance)} />
        <StatCard label="إجمالي المسحوب" value={money(wallet?.totalWithdrawn)} />
      </div>

      {pending ? (
        <div className="banner">
          لديك طلب سحب قيد المراجعة بقيمة {money(pending.amount)}. يمكنك تقديم طلب جديد بعد معالجته.
        </div>
      ) : null}
      <form className="card stack" onSubmit={request}>
        <CardHeader title="طلب سحب" extra={<span className="muted small">الحد الأدنى 100 ل.س</span>} />
        <div className="form-grid">
          <Field label="المبلغ (ل.س)" required hint={`المتاح: ${money(wallet?.balance)}`}>
            <input
              type="number"
              min="1"
              placeholder="50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!!pending}
              required
            />
          </Field>
          <Field label="طريقة الاستلام" required hint="بنك / محفظة إلكترونية / نقداً">
            <input
              placeholder="مثال: بنك الشام — رقم حساب"
              value={payoutDetails}
              onChange={(e) => setPayoutDetails(e.target.value)}
              disabled={!!pending}
              required
            />
          </Field>
        </div>
        <div className="row">
          <button type="submit" disabled={busy || !!pending}>
            {busy ? 'جاري الإرسال...' : pending ? 'لديك طلب قيد المراجعة' : 'إرسال الطلب'}
          </button>
        </div>
      </form>

      <div className="card stack">
        <CardHeader title={`سجل Transações (${transactions.length})`} />
        {transactions.length === 0 ? (
          <EmptyState title="لا توجد لغةains" hint="الscoreد" icon="coin" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>النوع</th>
                  <th>المبلغ</th>
                  <th>الرصيد بعد</th>
                  <th>الوصف</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td data-label="النوع">
                      <Badge tone={badgeTone('withdrawal', t.amount > 0 ? 'approved' : 'rejected')}>
                        {t.type === 'earning' ? 'أرباح' :
                         t.type === 'withdrawal' ? 'سحب' :
                         t.type === 'refund' ? 'إلغاء' :
                         t.type === 'bonus' ? 'مكافأة' :
                         'تسوية'}
                      </Badge>
                    </td>
                    <td data-label="المبلغ" className="money" style={{ color: t.amount > 0 ? 'green' : 'inherits' }}>
                      {t.amount > 0 ? '+' + money(t.amount) : money(t.amount)}
                    </td>
                    <td data-label="الرصيد بعد" className="money">{money(t.balanceAfter)}</td>
                    <td data-label="الوصف" className="small muted">{t.description || '—'}</td>
                    <td data-label="التاريخ">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card stack">
        <CardHeader title={`طلبات السحب (${withdrawals.length})`} />
        {withdrawals.length === 0 ? (
          <EmptyState title="لا طلبات بعد" hint="أول طلب سحب بيظهر هنا مع حالته" icon="↗" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>طريقة الاستلام</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w._id}>
                    <td data-label="المبلغ" className="money">{money(w.amount)}</td>
                    <td data-label="الحالة">
                      <Badge tone={badgeTone('withdrawal', w.status)}>
                        {withdrawalStatusAr[w.status] || w.status}
                      </Badge>
                      {w.adminNote ? <div className="muted small">{w.adminNote}</div> : null}
                    </td>
                    <td data-label="طريقة الاستلام" className="small">{w.payoutDetails || '—'}</td>
                    <td data-label="التاريخ">{formatDate(w.createdAt)}</td>
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
