import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api, money } from '../../lib/api';
import { formatDate } from '../../lib/labels';
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, StatCard } from '../../components/ui';

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
      <PageHeader title="نقطة البيع والمصاريف" subtitle="فواتير سريعة ومتابعة يومية" backTo="/owner" />
      <ErrorBanner message={error} />

      <div className="grid">
        <StatCard label="مبيعات اليوم" value={money(summary?.sales)} />
        <StatCard label="مصاريف اليوم" value={money(summary?.expenses)} />
        <StatCard label="الصافي" value={money(summary?.net)} />
      </div>

      <div className="grid">
        <form className="card stack" onSubmit={createInvoice}>
          <strong>فاتورة سريعة</strong>
          <input
            placeholder="اسم الزبون (اختياري)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          {lines.map((line, idx) => (
            <div key={idx} className="row">
              <input
                placeholder="البند"
                value={line.name}
                onChange={(e) => updateLine(idx, { name: e.target.value })}
              />
              <input
                placeholder="كمية"
                style={{ maxWidth: 90 }}
                value={line.quantity}
                onChange={(e) => updateLine(idx, { quantity: e.target.value })}
              />
              <input
                placeholder="السعر"
                style={{ maxWidth: 120 }}
                value={line.unitPrice}
                onChange={(e) => updateLine(idx, { unitPrice: e.target.value })}
              />
              {lines.length > 1 && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                >
                  حذف
                </button>
              )}
            </div>
          ))}
          <div className="row">
            <button
              type="button"
              className="secondary"
              onClick={() => setLines([...lines, { name: '', unitPrice: '', quantity: '1' }])}
            >
              + بند
            </button>
            <input
              placeholder="خصم"
              style={{ maxWidth: 140 }}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div className="row">
            <button
              type="button"
              className={paymentMethod === 'cash' ? '' : 'secondary'}
              onClick={() => setPaymentMethod('cash')}
            >
              نقدي
            </button>
            <button
              type="button"
              className={paymentMethod === 'card' ? '' : 'secondary'}
              onClick={() => setPaymentMethod('card')}
            >
              بطاقة
            </button>
            <span className="line-total">الإجمالي: {money(previewTotal)}</span>
          </div>
          <button type="submit" disabled={saving}>
            {saving ? 'جاري الإصدار...' : 'إصدار فاتورة'}
          </button>
        </form>

        <form className="card stack" onSubmit={createExpense}>
          <strong>مصروف</strong>
          <input
            placeholder="التصنيف"
            value={expCategory}
            onChange={(e) => setExpCategory(e.target.value)}
            required
          />
          <input
            placeholder="المبلغ"
            value={expAmount}
            onChange={(e) => setExpAmount(e.target.value)}
            required
          />
          <button type="submit" className="secondary" disabled={saving}>
            تسجيل مصروف
          </button>
        </form>
      </div>

      <div className="card stack">
        <strong>آخر الفواتير</strong>
        {invoices.length === 0 ? (
          <EmptyState title="ما في فواتير اليوم" />
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
                    <td>{i.invoiceNumber}</td>
                    <td>{i.customerName || '—'}</td>
                    <td>{i.paymentMethod === 'card' ? 'بطاقة' : 'نقدي'}</td>
                    <td>{money(i.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card stack">
        <strong>المصاريف</strong>
        {expenses.length === 0 ? (
          <EmptyState title="لا مصاريف مسجّلة" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>التصنيف</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 30).map((e) => (
                  <tr key={e._id}>
                    <td>{e.category}</td>
                    <td>{money(e.amount)}</td>
                    <td>{formatDate(e.date || e.createdAt)}</td>
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
