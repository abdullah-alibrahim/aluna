import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HoursEditor from '../../components/HoursEditor';
import MapPicker from '../../components/MapPicker';
import { api, apiForm } from '../../lib/api';
import { defaultOperatingHours, type DayHours } from '../../lib/hours';
import { ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

export default function OwnerCreateShop() {
  const nav = useNavigate();
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [slotInterval, setSlotInterval] = useState('15');
  const [lng, setLng] = useState('36.2765');
  const [lat, setLat] = useState('33.5138');
  const [hours, setHours] = useState<DayHours[]>(defaultOperatingHours());
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api('/auth/cities'), api('/auth/categories')])
      .then(([c, cats]) => {
        setCities(c || []);
        setCategories(cats || []);
        if (c?.[0]?._id) setCityId(c[0]._id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleCat = (id: string) => {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onPickImages = (files: FileList | null) => {
    const list = files ? Array.from(files).slice(0, 5) : [];
    setImages(list);
    setPreviews(list.map((f) => URL.createObjectURL(f)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('description', description);
      form.append('address', address);
      form.append('cityId', cityId);
      form.append('categoryIds', JSON.stringify(categoryIds));
      form.append('longitude', lng);
      form.append('latitude', lat);
      form.append('slotInterval', slotInterval);
      form.append('operatingHours', JSON.stringify(hours));
      images.forEach((f) => form.append('images', f));
      await apiForm("/admin/shops", form);
      nav('/admin/shops');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="إضافة مركز" subtitle="يُضاف مباشرة للمنصة من الإدارة" backTo="/admin/shops" />
      <ErrorBanner message={error} />
      <form className="card stack" onSubmit={submit}>
        <CardHeader title="معلومات المركز" />
        <div className="form-grid">
          <Field label="اسم المركز" required className="span-2">
            <input placeholder="مثال: مركز ألونا للتجميل" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="الوصف" required className="span-2">
            <textarea
              placeholder="عرّفي عن مركزك والخدمات المميزة..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </Field>
          <Field label="العنوان" required className="span-2">
            <input placeholder="الحي، الشارع، رقم البناء" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </Field>
          <Field label="المدينة" required>
            <select
              value={cityId}
              onChange={(e) => {
                const id = e.target.value;
                setCityId(id);
                const city = cities.find((c) => c._id === id);
                const coords = city?.coordinates?.coordinates;
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
          <Field label="فترة الفتحات (دقيقة)" hint="المدة بين مواعيد الحجز — 15 أو 30">
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
              resetKey={cityId || 'create'}
              onChange={({ lat: la, lng: lo }) => {
                setLat(String(la));
                setLng(String(lo));
              }}
            />
          </div>
          <div className="span-2">
            <HoursEditor value={hours} onChange={setHours} />
          </div>
          <Field label="شعار وصور المركز" hint="الأولى = اللوغو · حتى 5 صور" className="span-2">
            <div className="file-field">
              <label className="file-btn" htmlFor="shop-images">
                ⬆ اختيار صور
              </label>
              <input
                id="shop-images"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => onPickImages(e.target.files)}
              />
              <span className="file-name">
                {images.length ? `${images.length} صورة مختارة` : 'لم يتم اختيار ملفات'}
              </span>
            </div>
          </Field>
          {previews.length ? (
            <div className="media-row span-2">
              {previews.map((url) => (
                <img key={url} src={url} alt="" className="media-thumb" />
              ))}
            </div>
          ) : null}
        </div>
        <div className="row">
          <button type="submit" disabled={busy}>
            {busy ? 'جاري الإرسال...' : 'إنشاء المركز'}
          </button>
        </div>
      </form>
    </div>
  );
}
