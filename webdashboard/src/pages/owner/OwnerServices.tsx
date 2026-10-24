import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, apiForm, money } from '../../lib/api';
import { arAuthError, resolveOwnerShop } from '../../lib/ownerShop';
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

const emptyForm = () => ({
  name: '',
  price: '',
  duration: '30',
  bufferTime: '0',
  description: '',
  categoryId: '',
});

export default function OwnerServices() {
  const { shopId: paramId } = useParams();
  const navigate = useNavigate();
  const [shopId, setShopId] = useState(paramId || '');
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
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
        navigate(`/owner/shops/${shop._id}/services`, { replace: true });
        return;
      }
      setShopId(shop._id);
      const [services, cats] = await Promise.all([
        api(`/owner/shops/${shop._id}/services`),
        api('/auth/categories'),
      ]);
      setItems(services || []);
      setCategories(cats || []);
      setForm((f) => ({ ...f, categoryId: f.categoryId || cats?.[0]?._id || '' }));
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

  const resetForm = () => {
    setForm({ ...emptyForm(), categoryId: categories[0]?._id || '' });
    setEditingId(null);
    setImage(null);
    setPreview('');
  };

  const startEdit = (s: any) => {
    setEditingId(s._id);
    setForm({
      name: s.name || '',
      price: String(s.price ?? ''),
      duration: String(s.duration ?? 30),
      bufferTime: String(s.bufferTime ?? 0),
      description: s.description || '',
      categoryId: s.categoryId?._id || s.categoryId || categories[0]?._id || '',
    });
    setImage(null);
    setPreview(s.image || '');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId(editingId || 'new');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('price', String(Number(form.price)));
      fd.append('duration', String(Number(form.duration)));
      fd.append('bufferTime', String(Number(form.bufferTime) || 0));
      fd.append('description', form.description);
      fd.append('categoryId', form.categoryId);
      if (image) fd.append('image', image);
      if (editingId) {
        await apiForm(`/owner/shops/${shopId}/services/${editingId}`, fd, 'PATCH');
      } else {
        await apiForm(`/owner/shops/${shopId}/services`, fd);
      }
      resetForm();
      await load();
    } catch (err: any) {
      alert(arAuthError(err.message) || err.message);
    } finally {
      setBusyId('');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('حذف الخدمة؟')) return;
    setBusyId(id);
    try {
      await api(`/owner/shops/${shopId}/services/${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
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
      <PageHeader title="الخدمات" subtitle="أسعار · مدد · صور · تعديل" backTo={`/owner/shops/${shopId}`} />
      <ErrorBanner message={error} />

      <form className="card stack" onSubmit={save}>
        <CardHeader title={editingId ? 'تعديل خدمة' : 'إضافة خدمة'} />
        <div className="form-grid">
          <Field label="اسم الخدمة" required className="span-2">
            <input
              placeholder="مثال: قص وتصفيف"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <Field label="التصنيف" required>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              required
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="السعر (ل.س)" required>
            <input
              type="number"
              min="0"
              placeholder="75000"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </Field>
          <Field label="المدة (دقيقة)" hint="الوقت الذي تستغرقه الخدمة" required>
            <input
              type="number"
              min="1"
              placeholder="45"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              required
            />
          </Field>
          <Field label="وقت فاصل (دقيقة)" hint="راحة أو تنظيف بعد الخدمة">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.bufferTime}
              onChange={(e) => setForm({ ...form, bufferTime: e.target.value })}
            />
          </Field>
          <Field label="الوصف" hint="اختياري — يظهر للزبون في التطبيق" className="span-2">
            <textarea
              placeholder="تفاصيل قصيرة عن الخدمة..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </Field>
          <Field label="صورة الخدمة" hint="JPG أو PNG — اختياري" className="span-2">
            <div className="file-field">
              <label className="file-btn" htmlFor="service-image">
                ⬆ اختيار صورة
              </label>
              <input
                id="service-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setImage(f);
                  setPreview(f ? URL.createObjectURL(f) : preview);
                }}
              />
              <span className="file-name">{image ? image.name : preview ? 'صورة محفوظة' : 'لم يتم اختيار ملف'}</span>
              {preview ? <img src={preview} alt="" className="file-preview" loading="lazy" /> : null}
            </div>
          </Field>
        </div>
        <div className="row">
          <button type="submit" disabled={!!busyId}>
            {busyId === 'new' || busyId === editingId ? 'جاري الحفظ...' : editingId ? 'حفظ التعديل' : 'إضافة الخدمة'}
          </button>
          {editingId ? (
            <button type="button" className="secondary" onClick={resetForm}>
              إلغاء
            </button>
          ) : null}
        </div>
      </form>

      <div className="card stack">
        <CardHeader title={`الخدمات (${items.length})`} />
        {items.length === 0 ? (
          <EmptyState title="لا خدمات بعد" hint="أضيفي أول خدمة من النموذج أعلاه" icon="✂" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الصورة</th>
                  <th>الاسم</th>
                  <th>السعر</th>
                  <th>المدة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s._id}>
                    <td>
                      {s.image ? <img src={s.image} alt="" className="media-thumb sm" loading="lazy" /> : <span className="muted">—</span>}
                    </td>
                    <td data-label="الخدمة">
                      <strong>{s.name}</strong>
                      {s.description ? <div className="muted small">{s.description}</div> : null}
                    </td>
                    <td data-label="السعر" className="money">{money(s.price)}</td>
                    <td data-label="المدة">
                      {s.duration} دقيقة
                      {s.bufferTime ? (
                        <div className="muted small">{s.bufferTime} د راحة بعدها</div>
                      ) : null}
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
