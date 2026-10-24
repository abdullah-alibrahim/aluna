import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, apiForm } from '../../lib/api';
import { arAuthError, resolveOwnerShop } from '../../lib/ownerShop';
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

export default function OwnerPortfolio() {
  const { shopId: paramId } = useParams();
  const navigate = useNavigate();
  const [shopId, setShopId] = useState(paramId || '');
  const [items, setItems] = useState<any[]>([]);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { shop } = await resolveOwnerShop(paramId);
      if (!shop) {
        setError('ما في مركز مرتبط بالحساب');
        return;
      }
      if (paramId && shop._id !== paramId) {
        navigate(`/owner/shops/${shop._id}/portfolio`, { replace: true });
        return;
      }
      setShopId(shop._id);
      // Public portfolio endpoint works for listing; owner may not have dedicated GET
      const list = await api(`/users/shops/${shop._id}/portfolio`).catch(() => []);
      setItems(Array.isArray(list) ? list : []);
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

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('اختاري صورة');
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append('image', file);
      if (caption.trim()) form.append('caption', caption.trim());
      await apiForm(`/owner/shops/${shopId}/portfolio`, form);
      setCaption('');
      setFile(null);
      setPreview('');
      await load();
    } catch (err: any) {
      alert(arAuthError(err.message) || err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('حذف من المعرض؟')) return;
    setBusy(true);
    try {
      await api(`/owner/portfolio/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      alert(arAuthError(e.message) || e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="معرض الأعمال" subtitle="صور قبل/بعد وأعمال المركز" backTo={`/owner/shops/${shopId}`} />
      <ErrorBanner message={error} />

      <form className="card stack" onSubmit={add}>
        <CardHeader title="إضافة صورة" />
        <div className="form-grid">
          <Field label="تعليق على الصورة" hint="اختياري — يظهر تحت الصورة">
            <input placeholder="مثال: صبغة وقص قبل/بعد" value={caption} onChange={(e) => setCaption(e.target.value)} />
          </Field>
          <Field label="الصورة" hint="JPG أو PNG" required>
            <div className="file-field">
              <label className="file-btn" htmlFor="portfolio-image">
                ⬆ اختيار صورة
              </label>
              <input
                id="portfolio-image"
                type="file"
                accept="image/*"
                required
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  setPreview(f ? URL.createObjectURL(f) : '');
                }}
              />
              <span className="file-name">{file ? file.name : 'لم يتم اختيار ملف'}</span>
            </div>
          </Field>
          {preview ? (
            <div className="span-2">
              <img src={preview} alt="" className="media-thumb" style={{ width: 160, height: 160 }} />
            </div>
          ) : null}
        </div>
        <div className="row">
          <button type="submit" disabled={busy}>
            {busy ? 'جاري الرفع...' : 'رفع الصورة'}
          </button>
        </div>
      </form>

      <div className="card stack">
        <CardHeader title={`المعرض (${items.length})`} />
        {items.length === 0 ? (
          <EmptyState title="لا صور في المعرض بعد" hint="أضيفي صور أعمالك لجذب الزبائن" icon="🖼" />
        ) : (
          <div className="media-row">
            {items.map((p) => (
              <div key={p._id} className="media-item">
                <img src={p.imageUrl || p.image} alt="" className="media-thumb" style={{ width: 120, height: 120 }} loading="lazy" />
                {p.caption ? <span className="muted small">{p.caption}</span> : null}
                <button type="button" className="danger" disabled={busy} onClick={() => remove(p._id)}>
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
