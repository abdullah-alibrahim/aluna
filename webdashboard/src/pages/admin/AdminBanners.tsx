import { useEffect, useState } from 'react';
import { api, apiForm } from '../../lib/api';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

export default function AdminBanners() {
  const [items, setItems] = useState<any[]>([]);
  const [targetLink, setTargetLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await api('/admin/banners'));
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

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('اختاري صورة للبانر');
      return;
    }
    setBusyId('new');
    try {
      const form = new FormData();
      form.append('image', file);
      if (targetLink.trim()) form.append('targetLink', targetLink.trim());
      form.append('isActive', 'true');
      await apiForm('/admin/banners', form);
      setFile(null);
      setPreview('');
      setTargetLink('');
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusyId('');
    }
  };

  const toggle = async (id: string) => {
    setBusyId(id);
    try {
      await api(`/admin/banners/${id}/toggle`, { method: 'PATCH' });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId('');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('حذف البانر؟')) return;
    setBusyId(id);
    try {
      await api(`/admin/banners/${id}`, { method: 'DELETE' });
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
      <PageHeader title="البانرات" subtitle="صور الترويج في الصفحة الرئيسية" />
      <ErrorBanner message={error} />

      <form className="card stack" onSubmit={add}>
        <CardHeader title="إضافة بانر" extra={<span className="muted small">يفضّل 1200×500 بكسل</span>} />
        <div className="form-grid">
          <Field label="صورة البانر" required className="span-2">
            <div className="file-field">
              <label className="file-btn" htmlFor="banner-image">
                ⬆ اختيار صورة
              </label>
              <input
                id="banner-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  setPreview(f ? URL.createObjectURL(f) : '');
                }}
                required
              />
              <span className="file-name">{file ? file.name : 'لم يتم اختيار ملف'}</span>
              {preview ? <img src={preview} alt="" className="file-preview" loading="lazy" /> : null}
            </div>
          </Field>
          <Field label="رابط الهدف" hint="اختياري — رابط داخلي أو خارجي عند الضغط" className="span-2">
            <input
              placeholder="مثال: /shop/123"
              value={targetLink}
              onChange={(e) => setTargetLink(e.target.value)}
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
          </Field>
        </div>
        <div className="row">
          <button type="submit" disabled={busyId === 'new'}>
            {busyId === 'new' ? 'جاري الرفع...' : 'رفع البانر'}
          </button>
        </div>
      </form>

      <div className="card stack">
        <CardHeader title={`البانرات (${items.length})`} />
        {items.length === 0 ? (
          <EmptyState title="لا بانرات" hint="ارفعي بانراً ليظهر في الصفحة الرئيسية" icon="🖼" />
        ) : (
          items.map((b) => (
            <div key={b._id} className="banner-row">
              {b.imageUrl ? (
                <img src={b.imageUrl} alt="" className="banner-thumb" loading="lazy" />
              ) : (
                <div className="banner-thumb placeholder">—</div>
              )}
              <div className="banner-meta">
                <Badge tone={b.isActive ? 'ok' : 'neutral'}>{b.isActive ? 'نشط' : 'متوقف'}</Badge>
                <div className="muted small" dir="ltr" style={{ textAlign: 'right' }}>
                  {b.targetLink || 'بدون رابط'}
                </div>
              </div>
              <div className="row">
                <button type="button" className="secondary" disabled={busyId === b._id} onClick={() => toggle(b._id)}>
                  {b.isActive ? 'إيقاف' : 'تفعيل'}
                </button>
                <button type="button" className="danger" disabled={busyId === b._id} onClick={() => remove(b._id)}>
                  حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
