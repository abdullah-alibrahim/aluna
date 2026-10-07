import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader } from '../../components/ui';

export default function OwnerBranches() {
  const { shopId } = useParams();
  const [branches, setBranches] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!cityId) {
      alert('اختاري مدينة');
      return;
    }
    setSaving(true);
    try {
      await api(`/owner/shops/${shopId}/branches`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          address,
          cityId,
          longitude: 36.2765,
          latitude: 33.5138,
        }),
      });
      setName('');
      setAddress('');
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

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="الفروع" subtitle={`${branches.length} فرع`} backTo="/owner" />
      <ErrorBanner message={error} />

      <form className="card stack" onSubmit={onAdd}>
        <strong>إضافة فرع</strong>
        <input placeholder="اسم الفرع" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <select value={cityId} onChange={(e) => setCityId(e.target.value)} required>
          <option value="">اختاري المدينة</option>
          {cities.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={saving}>
          {saving ? 'جاري الإضافة...' : 'إضافة فرع'}
        </button>
      </form>

      <div className="card">
        {branches.length === 0 ? (
          <EmptyState title="لا فروع بعد" hint="أضيفي الفرع الرئيسي أو فروعاً إضافية" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>العنوان</th>
                  <th>المدينة</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <strong>{b.name}</strong>
                      {b.isMain ? <span className="muted"> · رئيسي</span> : null}
                    </td>
                    <td>{b.address}</td>
                    <td>{b.cityId?.name || '—'}</td>
                    <td>
                      <Badge tone={b.isActive ? 'ok' : 'neutral'}>{b.isActive ? 'نشط' : 'متوقف'}</Badge>
                    </td>
                    <td>
                      <button type="button" className="secondary" onClick={() => toggleActive(b)}>
                        {b.isActive ? 'إيقاف' : 'تفعيل'}
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
