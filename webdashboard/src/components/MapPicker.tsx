import { useEffect, useId, useMemo, useRef, useState } from 'react';

type Props = {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: number;
  /** Remount when shop loads / city changes */
  resetKey?: string;
};

/** Leaflet via CDN iframe — click or drag to set location (no npm map deps). */
export default function MapPicker({ lat, lng, onChange, height = 260, resetKey = 'default' }: Props) {
  const id = useId().replace(/:/g, '');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [shown, setShown] = useState({ lat, lng });

  useEffect(() => {
    setShown({ lat, lng });
  }, [resetKey, lat, lng]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!e.data || e.data.source !== `aluna-map-${id}`) return;
      if (typeof e.data.lat === 'number' && typeof e.data.lng === 'number') {
        setShown({ lat: e.data.lat, lng: e.data.lng });
        onChangeRef.current({ lat: e.data.lat, lng: e.data.lng });
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [id]);

  // Rebuild iframe only when resetKey changes (not on every drag)
  const mountLat = useRef(lat);
  const mountLng = useRef(lng);
  useEffect(() => {
    mountLat.current = lat;
    mountLng.current = lng;
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const srcDoc = useMemo(() => {
    const la = Number(mountLat.current) || 33.5138;
    const lo = Number(mountLng.current) || 36.2765;
    return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;height:100%;width:100%;background:#f5efe4}</style>
</head><body>
<div id="map"></div>
<script>
  const map = L.map('map',{zoomControl:true}).setView([${la},${lo}],14);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  let marker = L.marker([${la},${lo}],{draggable:true}).addTo(map);
  function send(ll){ parent.postMessage({source:'aluna-map-${id}',lat:ll.lat,lng:ll.lng},'*'); }
  marker.on('dragend',()=>send(marker.getLatLng()));
  map.on('click',(e)=>{ marker.setLatLng(e.latlng); send(e.latlng); });
  setTimeout(()=>map.invalidateSize(),120);
</script>
</body></html>`;
  }, [id, resetKey]);

  return (
    <div className="stack" style={{ gap: 6 }}>
      <span className="muted small">الموقع على الخريطة — انقري أو اسحبي العلامة</span>
      <iframe
        key={`${id}-${resetKey}`}
        title="اختيار الموقع"
        srcDoc={srcDoc}
        style={{
          width: '100%',
          height,
          border: '1px solid rgba(112,98,86,0.18)',
          borderRadius: 12,
          background: '#f5efe4',
        }}
      />
      <div className="row muted small">
        <span>عرض: {Number(shown.lat).toFixed(5)}</span>
        <span>طول: {Number(shown.lng).toFixed(5)}</span>
      </div>
    </div>
  );
}
