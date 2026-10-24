import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api, money } from '../../lib/api';
import { formatDate } from '../../lib/labels';
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, StatCard, CardHeader, Field } from '../../components/ui';

type Line = { name: string; unitPrice: string; quantity: string };

export default function OwnerPos() {
  const { shopId } = useParams();
  const [summary, setSummary] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [lines, setLines] = useState<Line[]>([{ name: '', unitPrice: '', quantity: '1' }]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [discount, setDiscount] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, inv, exp] = await Promise.all([
        api(`/owner/shops/${shopId}/pos/summary`),
        api(`/owner/shops/${shopId}/invoices`),
        api(`/owner/shops/${shopId}/expenses`),
      ]);
      setSummary(s);
      setInvoices(inv);
      setExpenses(exp);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [shopId]);

  const previewTotal = useMemo(() => {
    const sub = lines.reduce((sum, l) => {
      const price = Number(l.unitPrice);
      const qty = Math.max(1, Number(l.quantity) || 1);
      if (!l.name.trim() || !Number.isFinite(price)) return sum;
      return sum + price * qty;
    }, 0);
    return Math.max(0, sub - (Number(discount) || 0));
  }, [lines, discount]);

  const createInvoice = async (e: FormEvent) => {
    e.preventDefault();
    const items = lines
      .map((l) => ({
        type: 'custom' as const,
        name: l.name.trim(),
        quantity: Math.max(1, Number(l.quantity) || 1),
        unitPrice: Number(l.unitPrice),
      }))
      .filter((l) => l.name && Number.isFinite(l.unitPrice));
    if (!items.length) {
      alert('أضيفي بنداً واحداً على الأقل');
      return;
    }
    setSaving(true);
    try {
      await api(`/owner/shops/${shopId}/invoices`, {
        method: 'POST',
        body: JSON.stringify({
          customerName: customerName || undefined,
          items,
          paymentMethod,
          discountAmount: Number(discount) || 0,
        }),
      });
      setLines([{ name: '', unitPrice: '', quantity: '1' }]);
      setCustomerName('');
      setDiscount('');
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const createExpense = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/owner/shops/${shopId}/expenses`, {
        method: 'POST',
        body: JSON.stringify({ category: expCategory, amount: Number(expAmount) }),
      });
      setExpCategory('');
      setExpAmount('');
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateLine = (idx: number, patch: Partial<Line>) => {
    const next = [...lines];
    next[idx] = { ...next[idx], ...patch };
    setLines(next);
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="نقطة البيع والمصاريف" subtitle="فواتير سريعة ومتابعة يومية" backTo={`/owner/shops/${shopId}`} />
      <ErrorBanner message={error} />

      <div className="grid cols-3">
        <StatCard icon="🧾" label="مبيعات اليوم" value={money(summary?.sales)} />
        <StatCard icon="📉" label="مصاريف اليوم" value={money(summary?.expenses)} />
        <StatCard icon="💰" label="الصافي" value={money(summary?.net)} />
      </div>

      <div className="pos-grid">
        <form className="card stack" onSubmit={createInvoice}>
          <CardHeader title="فاتورة سريعة" extra={<span className="muted small">تُحتسب ضمن مبيعات اليوم</span>} />
          <Field label="اسم الزبون" hint="اختياري">
            <input
              placeholder="زبون نقدي"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </Field>

          <div className="line-head" aria-hidden>
            <span>البند</span>
            <span>الكمية</span>
            <span>السعر (ل.س)</span>
            <span />
          </div>
          {lines.map((line, idx) => (
            <div key={idx} className="line-row">
              <label className="line-field line-name">
                <span className="line-label">البند</span>
                <input
                  placeholder="مثال: قص شعر"
                  value={line.name}
                  onChange={(e) => updateLine(idx, { name: e.target.value })}
                />
              </label>
              <label className="line-field">
                <span className="line-label">الكمية</span>
                <input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                />
              </label>
              <label className="line-field">
                <span className="line-label">السعر (ل.س)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(idx, { unitPrice: e.target.value })}
                />
              </label>
              {lines.length > 1 ? (
                <button
                  type="button"
                  className="secondary btn-icon"
                  title="حذف البند"
                  onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                >
                  ✕
                </button>
              ) : (
                <span />
              )}
            </div>
          ))}

          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="secondary"
              onClick={() => setLines([...lines, { name: '', unitPrice: '', quantity: '1' }])}
            >
              + إضافة بند
            </button>
            <Field label="خصم (ل.س)">
              <input
                type="number"
                min="0"
                placeholder="0"
                style={{ maxWidth: 140 }}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </Field>
          </div>

          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="chip-row">
              <button
                type="button"
                className={`chip${paymentMethod === 'cash' ? ' selected' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                💵 نقدي
              </button>
              <button
                type="button"
                className={`chip${paymentMethod === 'card' ? ' selected' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                💳 بطاقة
              </button>
            </div>
            <div className="pos-total">
              <span className="muted small">الإجمالي</span>
              <strong>{money(previewTotal)}</strong>
            </div>
          </div>

          <button type="submit" disabled={saving}>
            {saving ? 'جاري الإصدار...' : 'إصدار الفاتورة'}
          </button>
        </form>

        <form className="card stack" onSubmit={createExpense}>
          <CardHeader title="تسجيل مصروف" />
          <Field label="التصنيف" required>
            <input
              placeholder="مستلزمات، كهرباء، رواتب..."
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              required
            />
          </Field>
          <Field label="المبلغ (ل.س)" required>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              required
            />
          </Field>
          <button type="submit" disabled={saving}>
            + تسجيل المصروف
          </button>
        </form>
      </div>

      <div className="card stack">
        <CardHeader title={`آخر الفواتير`} />
        {invoices.length === 0 ? (
          <EmptyState title="ما في فواتير اليوم" hint="الفواتير الصادرة بتظهر هنا" icon="🧾" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الرقم</th>
                  <th>الزبون</th>
                  <th>الدفع</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 30).map((i) => (
                  <tr key={i._id}>
                    <td data-label="الرقم" dir="ltr" style={{ textAlign: 'right' }}>{i.invoiceNumber}</td>
                    <td data-label="الزبون">{i.customerName || '—'}</td>
                    <td data-label="الدفع">{i.paymentMethod === 'card' ? 'بطاقة' : 'نقدي'}</td>
                    <td data-label="المبلغ" className="money">{money(i.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card stack">
        <CardHeader title="المصاريف" />
        {expenses.length === 0 ? (
          <EmptyState title="لا مصاريف مسجّلة" hint="سجّلي مصاريف المركز لمتابعة الصافي" icon="📉" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>التصنيف</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 30).map((e) => (
                  <tr key={e._id}>
                    <td data-label="التصنيف">{e.category}</td>
                    <td data-label="المبلغ" className="money">{money(e.amount)}</td>
                    <td data-label="التاريخ">{formatDate(e.date || e.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="danger"
                        disabled={saving}
                        onClick={async () => {
                          if (!confirm('حذف المصروف؟')) return;
                          setSaving(true);
                          try {
                            await api(`/owner/shops/${shopId}/expenses/${e._id}`, { method: 'DELETE' });
                            await load();
                          } catch (err: any) {
                            alert(err.message);
                          } finally {
                            setSaving(false);
                          }
                        }}
                      >
                        حذف
                      </button>
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
