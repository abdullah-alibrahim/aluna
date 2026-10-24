import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

export default function OwnerCoupons() {
  const { shopId } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [code, setCode] = useState('');
  const [discountPercentage, setDiscount] = useState('10');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [expiryDate, setExpiry] = useState('');
  const [usageLimit, setLimit] = useState('100');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      setItems(await api(`/owner/shops/${shopId}/coupons`));
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

  const reset = () => {
    setCode('');
    setDiscount('10');
    setMaxDiscount('');
    setExpiry('');
    setLimit('100');
    setEditingId(null);
  };

  const startEdit = (c: any) => {
    setEditingId(c._id);
    setCode(c.code || '');
    setDiscount(String(c.discountPercentage ?? 10));
    setMaxDiscount(c.maxDiscount != null ? String(c.maxDiscount) : '');
    setExpiry(c.expiryDate ? String(c.expiryDate).slice(0, 10) : '');
    setLimit(c.usageLimit != null ? String(c.usageLimit) : '100');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId(editingId || 'new');
    try {
      const body = {
        code: code.toUpperCase(),
        discountPercentage: Number(discountPercentage),
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        expiryDate: expiryDate || undefined,
        usageLimit: Number(usageLimit) || undefined,
        isActive: true,
      };
      if (editingId) {
        await api(`/owner/shops/${shopId}/coupons/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await api(`/owner/shops/${shopId}/coupons`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      reset();
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusyId('');
    }
  };

  const toggle = async (c: any) => {
    setBusyId(c._id);
    try {
      await api(`/owner/shops/${shopId}/coupons/${c._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId('');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('حذف الكوبون؟')) return;
    setBusyId(id);
    try {
      await api(`/owner/shops/${shopId}/coupons/${id}`, { method: 'DELETE' });
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
      <PageHeader title="الكوبونات" subtitle="خصومات للزبائن" backTo={`/owner/shops/${shopId}`} />
      <ErrorBanner message={error} />

      <form className="card stack" onSubmit={save}>
        <CardHeader title={editingId ? 'تعديل كوبون' : 'كوبون جديد'} />
        <div className="form-grid">
          <Field label="كود الكوبون" hint="أحرف إنجليزية وأرقام — مثال: ALUNA20" required>
            <input
              placeholder="ALUNA20"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              disabled={!!editingId}
              dir="ltr"
              style={{ textAlign: 'left', letterSpacing: 1 }}
            />
          </Field>
          <Field label="نسبة الخصم %" required>
            <input
              type="number"
              min="1"
              max="100"
              placeholder="10"
              value={discountPercentage}
              onChange={(e) => setDiscount(e.target.value)}
              required
            />
          </Field>
          <Field label="حد أقصى للخصم (ل.س)" hint="اختياري — يحدّ قيمة الخصم">
            <input
              type="number"
              min="0"
              placeholder="50000"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
            />
          </Field>
          <Field label="تاريخ الانتهاء" required hint="بعد هذا التاريخ يتوقف الكوبون">
            <input
              type="date"
              value={expiryDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setExpiry(e.target.value)}
              required
            />
          </Field>
          <Field label="حد الاستخدام" hint="عدد مرات الاستخدام الكلي">
            <input
              type="number"
              min="1"
              placeholder="100"
              value={usageLimit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </Field>
        </div>
        <div className="row">
          <button type="submit" disabled={!!busyId}>
            {editingId ? 'حفظ التعديل' : 'إضافة الكوبون'}
          </button>
          {editingId ? (
            <button type="button" className="secondary" onClick={reset}>
              إلغاء
            </button>
          ) : null}
        </div>
      </form>

      <div className="card stack">
        <CardHeader title={`الكوبونات (${items.length})`} />
        {items.length === 0 ? (
          <EmptyState title="لا كوبونات بعد" hint="أنشئي كوبوناً لجذب الزبائن" icon="🎟" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الكود</th>
                  <th>الخصم</th>
                  <th>الانتهاء</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c._id}>
                    <td data-label="الكود">
                      <strong>{c.code}</strong>
                    </td>
                    <td data-label="الخصم">
                      {c.discountPercentage}%
                      {c.maxDiscount ? ` · حد ${c.maxDiscount}` : ''}
                    </td>
                    <td data-label="ينتهي">{c.expiryDate ? formatDate(c.expiryDate) : '—'}</td>
                    <td data-label="الحالة">
                      <Badge tone={c.isActive ? 'ok' : 'neutral'}>{c.isActive ? 'نشط' : 'متوقف'}</Badge>
                    </td>
                    <td className="row">
                      <button type="button" className="secondary" onClick={() => startEdit(c)}>
                        تعديل
                      </button>
                      <button type="button" className="secondary" disabled={busyId === c._id} onClick={() => toggle(c)}>
                        {c.isActive ? 'إيقاف' : 'تفعيل'}
                      </button>
                      <button type="button" className="danger" disabled={busyId === c._id} onClick={() => remove(c._id)}>
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
