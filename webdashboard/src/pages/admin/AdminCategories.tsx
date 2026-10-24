import { useEffect, useState } from 'react';
import { api, apiForm } from '../../lib/api';
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

export default function AdminCategories() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await api('/admin/categories'));
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
    setDescription('');
    setFile(null);
    setPreview('');
    setEditingId(null);
  };

  const startEdit = (c: any) => {
    setEditingId(c._id);
    setName(c.name || '');
    setDescription(c.description || '');
    setFile(null);
    setPreview(c.image || '');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('name', name.trim());
      if (description.trim()) form.append('description', description.trim());
      if (file) form.append('image', file);
      if (editingId) {
        await apiForm(`/admin/categories/${editingId}`, form, 'PUT');
      } else {
        await apiForm('/admin/categories', form);
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
      <PageHeader title="التصنيفات" subtitle="تصنيفات الخدمات الظاهرة في التطبيق" />
      <ErrorBanner message={error} />

      <form className="card stack" onSubmit={save}>
        <CardHeader title={editingId ? 'تعديل تصنيف' : 'إضافة تصنيف'} />
        <div className="form-grid">
          <Field label="اسم التصنيف" required>
            <input placeholder="مثال: عناية بالبشرة" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="الوصف" hint="اختياري">
            <input placeholder="وصف قصير" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="صورة التصنيف" hint="اختياري — تظهر في الصفحة الرئيسية" className="span-2">
            <div className="file-field">
              <label className="file-btn" htmlFor="category-image">
                ⬆ اختيار صورة
              </label>
              <input
                id="category-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  setPreview(f ? URL.createObjectURL(f) : preview);
                }}
              />
              <span className="file-name">{file ? file.name : preview ? 'صورة محفوظة' : 'لم يتم اختيار ملف'}</span>
              {preview ? <img src={preview} alt="" className="file-preview" loading="lazy" /> : null}
            </div>
          </Field>
        </div>
        <div className="row">
          <button type="submit" disabled={busy}>
            {editingId ? 'حفظ التعديل' : 'إضافة التصنيف'}
          </button>
          {editingId ? (
            <button type="button" className="secondary" onClick={reset}>
              إلغاء
            </button>
          ) : null}
        </div>
      </form>

      <div className="card stack">
        <CardHeader title={`التصنيفات (${items.length})`} />
        {items.length === 0 ? (
          <EmptyState title="لا تصنيفات بعد" hint="أضيفي تصنيفاً ليظهر في التطبيق" icon="🧾" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الصورة</th>
                  <th>الاسم</th>
                  <th>الوصف</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c._id}>
                    <td>
                      {c.image ? (
                        <img src={c.image} alt="" className="media-thumb sm" loading="lazy" />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td data-label="التصنيف">
                      <strong>{c.name}</strong>
                    </td>
                    <td data-label="الوصف" className="muted">{c.description || '—'}</td>
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
