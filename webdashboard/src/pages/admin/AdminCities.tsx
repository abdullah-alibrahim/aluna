import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

export default function AdminCities() {
  const [cities, setCities] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [lng, setLng] = useState('');
  const [lat, setLat] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCities(await api('/admin/cities'));
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
    setName('');
    setLng('');
    setLat('');
    setEditingId(null);
  };

  const startEdit = (c: any) => {
    setEditingId(c._id);
    setName(c.name || '');
    setLng(String(c.coordinates?.coordinates?.[0] ?? ''));
    setLat(String(c.coordinates?.coordinates?.[1] ?? ''));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const longitude = Number(lng);
    const latitude = Number(lat);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || Math.abs(longitude) > 180 || Math.abs(latitude) > 90) {
      alert('أدخلي إحداثيات صحيحة (خط الطول بين -180 و180، وخط العرض بين -90 و90)');
      return;
    }
    setBusy(true);
    try {
      const body = {
        name: name.trim(),
        longitude,
        latitude,
      };
      if (editingId) {
        await api(`/admin/cities/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/admin/cities', { method: 'POST', body: JSON.stringify(body) });
      }
      reset();
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
      <PageHeader title="المدن" subtitle="إدارة مدن المنصة المعروضة للمستخدمين" />
      <ErrorBanner message={error} />

      <form className="card stack" onSubmit={save}>
        <CardHeader title={editingId ? 'تعديل مدينة' : 'إضافة مدينة'} />
        <div className="form-grid">
          <Field label="اسم المدينة" required className="span-2">
            <input placeholder="مثال: دمشق" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="خط الطول (Longitude)" hint="الموقع الجغرافي الأفقي للمدينة">
            <input placeholder="مثال: 36.2765" value={lng} required onChange={(e) => setLng(e.target.value)} dir="ltr" style={{ textAlign: 'left' }} />
          </Field>
          <Field label="خط العرض (Latitude)" hint="الموقع الجغرافي العمودي للمدينة">
            <input placeholder="مثال: 33.5138" value={lat} required onChange={(e) => setLat(e.target.value)} dir="ltr" style={{ textAlign: 'left' }} />
          </Field>
        </div>
        <div className="row">
          <button type="submit" disabled={busy}>
            {editingId ? 'حفظ التعديل' : 'إضافة المدينة'}
          </button>
          {editingId ? (
            <button type="button" className="secondary" onClick={reset}>
              إلغاء
            </button>
          ) : null}
        </div>
      </form>

      <div className="card stack">
        <CardHeader title={`المدن (${cities.length})`} />
        {cities.length === 0 ? (
          <EmptyState title="لا مدن بعد" hint="أضيفي أول مدينة لتظهر في التطبيق" icon="📍" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الإحداثيات</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cities.map((c) => (
                  <tr key={c._id}>
                    <td data-label="المدينة">
                      <strong>{c.name}</strong>
                    </td>
                    <td data-label="الإحداثيات" className="muted small">
                      {c.coordinates?.coordinates?.[0] ?? '—'}, {c.coordinates?.coordinates?.[1] ?? '—'}
                    </td>
                    <td>
                      <button type="button" className="secondary" onClick={() => startEdit(c)}>
                        تعديل
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
