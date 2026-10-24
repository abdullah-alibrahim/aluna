import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, apiForm } from '../../lib/api';
import { arAuthError, resolveOwnerShop } from '../../lib/ownerShop';
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

export default function OwnerStaff() {
  const { shopId: paramId } = useParams();
  const navigate = useNavigate();
  const [shopId, setShopId] = useState(paramId || '');
  const [items, setItems] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('موظف');
  const [branchId, setBranchId] = useState('');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { shop } = await resolveOwnerShop(paramId);
      if (!shop) {
        setError('ما في مركز مرتبط بالحساب');
        setItems([]);
        return;
      }
      if (paramId && shop._id !== paramId) {
        navigate(`/owner/shops/${shop._id}/staff`, { replace: true });
        return;
      }
      setShopId(shop._id);
      const [staff, br, srv] = await Promise.all([
        api(`/owner/shops/${shop._id}/staff`),
        api(`/owner/shops/${shop._id}/branches`),
        api(`/owner/shops/${shop._id}/services`),
      ]);
      setItems(staff || []);
      setBranches(br || []);
      setServices(srv || []);
      setError('');
    } catch (e: any) {
      setError(arAuthError(e.message) || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [paramId]);

  const reset = () => {
    setName('');
    setRole('موظف');
    setBranchId('');
    setServiceIds([]);
    setBreakStart('');
    setBreakEnd('');
    setEditingId(null);
    setAvatar(null);
    setPreview('');
  };

  const startEdit = (s: any) => {
    setEditingId(s._id);
    setName(s.name || '');
    setRole(s.role || 'موظف');
    setBranchId(s.branchId?._id || s.branchId || '');
    setServiceIds((s.servicesProvided || []).map((x: any) => x._id || x));
    const brk = s.workingHours?.[0]?.breaks?.[0];
    setBreakStart(brk?.start || '');
    setBreakEnd(brk?.end || '');
    setAvatar(null);
    setPreview(s.avatar || '');
  };

  const toggleService = (id: string) => {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId(editingId || 'new');
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('role', role);
      if (branchId) form.append('branchId', branchId);
      form.append('servicesProvided', JSON.stringify(serviceIds));
      if (breakStart && breakEnd) {
        form.append('globalBreakStart', breakStart);
        form.append('globalBreakEnd', breakEnd);
      }
      if (avatar) form.append('avatar', avatar);
      if (editingId) {
        await apiForm(`/owner/shops/${shopId}/staff/${editingId}`, form, 'PATCH');
      } else {
        await apiForm(`/owner/shops/${shopId}/staff`, form);
      }
      reset();
      await load();
    } catch (err: any) {
      alert(arAuthError(err.message) || err.message);
    } finally {
      setBusyId('');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('حذف الموظف؟')) return;
    setBusyId(id);
    try {
      await api(`/owner/shops/${shopId}/staff/${id}`, { method: 'DELETE' });
      if (editingId === id) reset();
      await load();
    } catch (e: any) {
      alert(arAuthError(e.message) || e.message);
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="الموظفون" subtitle="فريق العمل · الخدمات · الاستراحة" backTo={`/owner/shops/${shopId}`} />
      <ErrorBanner message={error} />

      <form className="card stack" onSubmit={save}>
        <CardHeader title={editingId ? 'تعديل موظف' : 'إضافة موظف'} />
        <div className="form-grid">
          <Field label="الاسم" required>
            <input placeholder="مثال: لمى الأحمد" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="الدور / التخصص">
            <input placeholder="مصففة شعر، خبيرة تجميل..." value={role} onChange={(e) => setRole(e.target.value)} />
          </Field>
          <Field label="الفرع" hint="اختياري — يترك فارغاً لكل الفروع" className="span-2">
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">بدون فرع محدد</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="span-2 field">
            <span className="field-label">الخدمات التي يقدّمها</span>
            <div className="chip-row">
              {services.map((s) => (
                <button
                  key={s._id}
                  type="button"
                  className={`chip${serviceIds.includes(s._id) ? ' selected' : ''}`}
                  onClick={() => toggleService(s._id)}
                >
                  {serviceIds.includes(s._id) ? '✓ ' : ''}
                  {s.name}
                </button>
              ))}
              {!services.length ? <span className="muted">أضيفي خدمات أولاً</span> : null}
            </div>
          </div>
          <Field label="بداية الاستراحة" hint="اختياري">
            <input type="time" value={breakStart} onChange={(e) => setBreakStart(e.target.value)} />
          </Field>
          <Field label="نهاية الاستراحة" hint="اختياري">
            <input type="time" value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} />
          </Field>
          <Field label="صورة الموظف" hint="JPG أو PNG — اختياري" className="span-2">
            <div className="file-field">
              <label className="file-btn" htmlFor="staff-avatar">
                ⬆ اختيار صورة
              </label>
              <input
                id="staff-avatar"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setAvatar(f);
                  setPreview(f ? URL.createObjectURL(f) : preview);
                }}
              />
              <span className="file-name">{avatar ? avatar.name : preview ? 'صورة محفوظة' : 'لم يتم اختيار ملف'}</span>
              {preview ? <img src={preview} alt="" className="file-preview round" loading="lazy" /> : null}
            </div>
          </Field>
        </div>
        <div className="row">
          <button type="submit" disabled={!!busyId}>
            {editingId ? 'حفظ التعديل' : 'إضافة الموظف'}
          </button>
          {editingId ? (
            <button type="button" className="secondary" onClick={reset}>
              إلغاء
            </button>
          ) : null}
        </div>
      </form>

      <div className="card stack">
        <CardHeader title={`الفريق (${items.length})`} />
        {items.length === 0 ? (
          <EmptyState title="لا موظفين بعد" hint="أضيفي أول موظف من النموذج أعلاه" icon="👥" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الصورة</th>
                  <th>الاسم</th>
                  <th>الفرع</th>
                  <th>الخدمات</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s._id}>
                    <td>
                      {s.avatar ? (
                        <img src={s.avatar} alt="" className="media-thumb sm round" loading="lazy" />
                      ) : (
                        <span className="avatar-initial">{s.name?.trim()?.[0] || '؟'}</span>
                      )}
                    </td>
                    <td data-label="الموظف">
                      <strong>{s.name}</strong>
                      <div className="muted small">{s.role || '—'}</div>
                    </td>
                    <td data-label="الفرع" className="small">
                      {branches.find((b) => b._id === (s.branchId?._id || s.branchId))?.name || (
                        <span className="muted">كل الفروع</span>
                      )}
                    </td>
                    <td data-label="الخدمات" className="muted small">
                      {(s.servicesProvided || []).map((x: any) => x.name || x).join(' · ') || '—'}
                    </td>
                    <td className="row">
                      <button type="button" className="secondary" onClick={() => startEdit(s)}>
                        تعديل
                      </button>
                      <button type="button" className="danger" disabled={busyId === s._id} onClick={() => remove(s._id)}>
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
