import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

export default function OwnerBranches() {
  const { shopId } = useParams();
  const [branches, setBranches] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState('');
  const [phone, setPhone] = useState('');
  const [isMain, setIsMain] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalCityId, setOriginalCityId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setBranches(await api(`/owner/shops/${shopId}/branches`));
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api('/auth/cities')
      .then((list: any[]) => {
        setCities(list || []);
        if (list[0]?._id) setCityId(list[0]._id);
      })
      .catch(() => undefined);
  }, [shopId]);

  const resetForm = () => {
    setName('');
    setAddress('');
    setPhone('');
    setIsMain(false);
    setEditingId(null);
    setOriginalCityId('');
  };

  const startEdit = (branch: any) => {
    setEditingId(branch._id);
    setName(branch.name || '');
    setAddress(branch.address || '');
    setCityId(branch.cityId?._id || branch.cityId || '');
    setOriginalCityId(branch.cityId?._id || branch.cityId || '');
    setPhone(branch.phone || '');
    setIsMain(!!branch.isMain);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!cityId) {
      alert('اختاري مدينة');
      return;
    }
    setSaving(true);
    try {
      // Branch coordinates default to the chosen city's centre so the map
      // marker is in the right city (not always Damascus).
      const city = cities.find((c) => c._id === cityId);
      const [lng, lat] = city?.coordinates?.coordinates || [36.2765, 33.5138];
      const body: any = { name, address, cityId, phone: phone || '', isMain };
      // Keep any custom pin location when the city did not change.
      if (!editingId || cityId !== originalCityId) {
        body.longitude = lng;
        body.latitude = lat;
      }
      if (editingId) {
        await api(`/owner/shops/${shopId}/branches/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await api(`/owner/shops/${shopId}/branches`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      resetForm();
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (branch: any) => {
    try {
      await api(`/owner/shops/${shopId}/branches/${branch._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !branch.isActive }),
      });
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const remove = async (branch: any) => {
    if (branch.isMain) {
      alert('لا يمكن حذف الفرع الرئيسي');
      return;
    }
    if (!confirm(`أرشفة فرع «${branch.name}»؟ سيتم إيقافه وإبقاؤه في السجل.`)) return;
    try {
      await api(`/owner/shops/${shopId}/branches/${branch._id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="الفروع" subtitle={`${branches.length} فرع`} backTo={`/owner/shops/${shopId}`} />
      <ErrorBanner message={error} />

      <form className="card stack" onSubmit={onSubmit}>
        <CardHeader title={editingId ? 'تعديل الفرع' : 'إضافة فرع'} />
        <div className="form-grid">
          <Field label="اسم الفرع" required>
            <input placeholder="مثال: فرع المزة" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="رقم الهاتف" hint="اختياري">
            <input
              placeholder="+963 9xx xxx xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
          </Field>
          <Field label="العنوان" required className="span-2">
            <input placeholder="الحي، الشارع، رقم البناء" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </Field>
          <Field label="المدينة" required>
            <select value={cityId} onChange={(e) => setCityId(e.target.value)} required>
              <option value="">اختاري المدينة</option>
              {cities.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <label className="check-field">
            <input
              type="checkbox"
              checked={isMain}
              disabled={!!editingId && isMain}
              onChange={(e) => setIsMain(e.target.checked)}
            />
            <span>تعيين كفرع رئيسي</span>
          </label>
        </div>
        <div className="row">
          <button type="submit" disabled={saving}>
            {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديل' : 'إضافة الفرع'}
          </button>
          {editingId ? (
            <button type="button" className="secondary" onClick={resetForm}>
              إلغاء
            </button>
          ) : null}
        </div>
      </form>

      <div className="card stack">
        <CardHeader title={`الفروع (${branches.length})`} />
        {branches.length === 0 ? (
          <EmptyState title="لا فروع بعد" hint="أضيفي الفرع الرئيسي أو فروعاً إضافية" icon="📍" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>العنوان</th>
                  <th>المدينة</th>
                  <th>الهاتف</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b._id}>
                    <td data-label="الفرع">
                      <strong>{b.name}</strong>
                      {b.isMain ? <span className="muted"> · رئيسي</span> : null}
                    </td>
                    <td data-label="العنوان">{b.address}</td>
                    <td data-label="المدينة">{b.cityId?.name || '—'}</td>
                    <td data-label="الهاتف" dir="ltr" style={{ textAlign: 'right' }}>{b.phone || '—'}</td>
                    <td data-label="الحالة">
                      <Badge tone={b.isActive ? 'ok' : 'neutral'}>{b.isActive ? 'نشط' : 'متوقف'}</Badge>
                    </td>
                    <td className="row">
                      <button type="button" className="secondary" onClick={() => startEdit(b)}>
                        تعديل
                      </button>
                      <button type="button" className="secondary" onClick={() => toggleActive(b)}>
                        {b.isActive ? 'إيقاف' : 'تفعيل'}
                      </button>
                      {!b.isMain ? (
                        <button type="button" className="danger" onClick={() => remove(b)}>
                          أرشفة
                        </button>
                      ) : null}
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
