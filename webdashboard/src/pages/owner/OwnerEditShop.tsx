import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HoursEditor from '../../components/HoursEditor';
import MapPicker from '../../components/MapPicker';
import { api, apiForm } from '../../lib/api';
import { mergeOperatingHours, type DayHours } from '../../lib/hours';
import { arAuthError, resolveOwnerShop } from '../../lib/ownerShop';
import { ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

export default function OwnerEditShop() {
  const { shopId: paramId } = useParams();
  const navigate = useNavigate();
  const [shopId, setShopId] = useState(paramId || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [slotInterval, setSlotInterval] = useState('15');
  const [lng, setLng] = useState('36.2765');
  const [lat, setLat] = useState('33.5138');
  const [hours, setHours] = useState<DayHours[]>(mergeOperatingHours());
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [{ shop }, citiesList, cats] = await Promise.all([
          resolveOwnerShop(paramId),
          api('/auth/cities'),
          api('/auth/categories'),
        ]);
        if (cancelled) return;
        if (!shop) {
          setError('المركز غير موجود');
          return;
        }
        if (paramId && shop._id !== paramId) {
          navigate(`/owner/shops/${shop._id}/edit`, { replace: true });
          return;
        }
        setShopId(shop._id);
        setName(shop.name || '');
        setDescription(shop.description || '');
        setAddress(shop.address || '');
        setCityId(shop.cityId?._id || shop.cityId || '');
        setCategoryIds((shop.categoryIds || []).map((c: any) => c._id || c));
        setSlotInterval(String(shop.slotInterval || 15));
        const coords = shop.location?.coordinates;
        if (coords?.length === 2) {
          setLng(String(coords[0]));
          setLat(String(coords[1]));
        }
        setHours(mergeOperatingHours(shop.operatingHours));
        setExistingImages(shop.images || []);
        setCities(citiesList || []);
        setCategories(cats || []);
        setError('');
      } catch (e: any) {
        if (!cancelled) setError(arAuthError(e.message) || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paramId, navigate]);

  const toggleCat = (id: string) => {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onPickFiles = (files: FileList | null) => {
    const list = files ? Array.from(files).slice(0, 5) : [];
    setNewFiles(list);
    setPreviews(list.map((f) => URL.createObjectURL(f)));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('description', description);
      form.append('address', address);
      form.append('cityId', cityId);
      form.append('categoryIds', JSON.stringify(categoryIds));
      form.append('slotInterval', slotInterval);
      form.append('longitude', lng);
      form.append('latitude', lat);
      form.append('operatingHours', JSON.stringify(hours));
      form.append('existingImages', JSON.stringify(existingImages));
      newFiles.forEach((f) => form.append('images', f));
      await apiForm(`/owner/shops/${shopId}`, form, 'PATCH');
      setMsg('تم حفظ التعديلات');
      setError('');
      setNewFiles([]);
      setPreviews([]);
      const { shop } = await resolveOwnerShop(shopId);
      if (shop) setExistingImages(shop.images || []);
    } catch (err: any) {
      setError(arAuthError(err.message) || err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="تعديل المركز" subtitle="لوغو · ساعات · موقع · تصنيفات" backTo={`/owner/shops/${shopId}`} />
      <ErrorBanner message={error} />
      {msg ? <div className="banner success-banner">{msg}</div> : null}
      <form className="card stack" onSubmit={save}>
        <CardHeader title="معلومات المركز" />
        <div className="form-grid">
          <Field label="اسم المركز" required className="span-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المركز" required />
          </Field>
          <Field label="الوصف" className="span-2">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف المركز" rows={3} />
          </Field>
          <Field label="العنوان" required className="span-2">
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="الحي، الشارع" />
          </Field>
          <Field label="المدينة" required>
            <select
              value={cityId}
              onChange={(e) => {
                const id = e.target.value;
                setCityId(id);
                const coords = cities.find((c) => c._id === id)?.coordinates?.coordinates;
                if (coords?.length === 2) {
                  setLng(String(coords[0]));
                  setLat(String(coords[1]));
                }
              }}
              required
            >
              {cities.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="فترة الفتحات (دقيقة)" hint="المدة بين مواعيد الحجز">
            <input
              type="number"
              min={5}
              max={60}
              value={slotInterval}
              onChange={(e) => setSlotInterval(e.target.value)}
            />
          </Field>
          <div className="span-2 field">
            <span className="field-label">التصنيفات</span>
            <div className="chip-row">
              {categories.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  className={`chip${categoryIds.includes(c._id) ? ' selected' : ''}`}
                  onClick={() => toggleCat(c._id)}
                >
                  {categoryIds.includes(c._id) ? '✓ ' : ''}
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="span-2">
            <MapPicker
              lat={Number(lat) || 33.5138}
              lng={Number(lng) || 36.2765}
              resetKey={shopId || 'edit'}
              onChange={({ lat: la, lng: lo }) => {
                setLat(String(la));
                setLng(String(lo));
              }}
            />
          </div>
          <div className="span-2">
            <HoursEditor value={hours} onChange={setHours} />
          </div>

          <div className="span-2 field">
            <span className="field-label">صور المركز / الشعار</span>
            <span className="field-hint">الصورة الأولى = اللوغو</span>
            {existingImages.length ? (
              <div className="media-row" style={{ marginTop: 6 }}>
                {existingImages.map((url) => (
                  <div key={url} className="media-item">
                    <img src={url} alt="" className="media-thumb" loading="lazy" />
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setExistingImages((p) => p.filter((u) => u !== url))}
                    >
                      إزالة
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <span className="muted small">لا صور بعد</span>
            )}
            <div className="file-field" style={{ marginTop: 6 }}>
              <label className="file-btn" htmlFor="edit-images">
                ⬆ إضافة صور
              </label>
              <input id="edit-images" type="file" accept="image/*" multiple onChange={(e) => onPickFiles(e.target.files)} />
              <span className="file-name">
                {newFiles.length ? `${newFiles.length} صورة جديدة` : 'لم يتم اختيار ملفات'}
              </span>
            </div>
            {previews.length ? (
              <div className="media-row" style={{ marginTop: 6 }}>
                {previews.map((url) => (
                  <img key={url} src={url} alt="" className="media-thumb" />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="row">
          <button type="submit" disabled={busy}>
            {busy ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </form>
    </div>
  );
}
