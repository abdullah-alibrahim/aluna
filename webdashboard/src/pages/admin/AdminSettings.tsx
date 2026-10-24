import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

export default function AdminSettings() {
  const [form, setForm] = useState<any>({
    platformCommissionRate: 10,
    currency: 'ل.س',
    currencyCode: 'SYP',
    depositPercent: 0,
    noShowFeePercent: 0,
    freeCancelHours: 2,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api('/admin/settings')
      .then((s) => setForm((f: any) => ({ ...f, ...s })))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const updated = await api('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          platformCommissionRate: Number(form.platformCommissionRate),
          currency: form.currency,
          currencyCode: form.currencyCode,
          depositPercent: Number(form.depositPercent),
          noShowFeePercent: Number(form.noShowFeePercent),
          freeCancelHours: Number(form.freeCancelHours),
        }),
      });
      setForm((f: any) => ({ ...f, ...updated }));
      setSaved(true);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="إعدادات المنصة" subtitle="العمولة والعملة وسياسات الحجز" />
      <ErrorBanner message={error} />
      {saved ? <div className="banner success-banner">تم حفظ الإعدادات بنجاح</div> : null}
      <form className="stack" onSubmit={save}>
        <div className="card stack">
          <CardHeader title="العمولات" />
          <div className="form-grid">
            <Field label="نسبة عمولة المنصة %" hint="تُخصم من كل حجز مدفوع">
              <input
                type="number"
                min="0"
                max="100"
                value={form.platformCommissionRate ?? ''}
                onChange={(e) => setForm((f: any) => ({ ...f, platformCommissionRate: e.target.value }))}
              />
            </Field>
            <Field label="نسبة العربون %" hint="0 = بدون عربون">
              <input
                type="number"
                min="0"
                max="100"
                value={form.depositPercent ?? ''}
                onChange={(e) => setForm((f: any) => ({ ...f, depositPercent: e.target.value }))}
              />
            </Field>
            <Field label="غرامة عدم الحضور %" hint="تُطبّق على الحجوزات المؤكدة">
              <input
                type="number"
                min="0"
                max="100"
                value={form.noShowFeePercent ?? ''}
                onChange={(e) => setForm((f: any) => ({ ...f, noShowFeePercent: e.target.value }))}
              />
            </Field>
            <Field label="ساعات الإلغاء المجاني" hint="بعدها قد تُطبّق سياسة الغرامة">
              <input
                type="number"
                min="0"
                value={form.freeCancelHours ?? ''}
                onChange={(e) => setForm((f: any) => ({ ...f, freeCancelHours: e.target.value }))}
              />
            </Field>
          </div>
        </div>

        <div className="card stack">
          <CardHeader title="العملة" />
          <div className="form-grid">
            <Field label="اسم العملة (بالعربية)">
              <input
                type="text"
                value={form.currency ?? ''}
                onChange={(e) => setForm((f: any) => ({ ...f, currency: e.target.value }))}
              />
            </Field>
            <Field label="رمز العملة" hint="ISO — مثال: SYP">
              <input
                type="text"
                dir="ltr"
                style={{ textAlign: 'left' }}
                value={form.currencyCode ?? ''}
                onChange={(e) => setForm((f: any) => ({ ...f, currencyCode: e.target.value }))}
              />
            </Field>
          </div>
        </div>

        <div className="card">
          <div className="row">
            <button type="submit" disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
            <span className="muted small">التغييرات تُطبّق على التطبيقات فوراً</span>
          </div>
        </div>
      </form>
    </div>
  );
}
