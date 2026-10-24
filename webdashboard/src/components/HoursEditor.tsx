import { DAY_AR, type DayHours } from '../lib/hours';

type Props = {
  value: DayHours[];
  onChange: (next: DayHours[]) => void;
};

export default function HoursEditor({ value, onChange }: Props) {
  const setAt = (index: number, patch: Partial<DayHours>) => {
    const next = value.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  return (
    <div className="stack" style={{ gap: 6 }}>
      <strong>أوقات العمل</strong>
      <div className="hours-head" aria-hidden>
        <span>اليوم</span>
        <span>مغلق</span>
        <span>من</span>
        <span>إلى</span>
      </div>
      {value.map((oh, index) => (
        <div key={oh.day} className="hours-row">
          <span className="hours-day">{DAY_AR[oh.day] || oh.day}</span>
          <label className="hours-closed">
            <input
              type="checkbox"
              checked={oh.isClosed}
              onChange={(e) => setAt(index, { isClosed: e.target.checked })}
            />
          </label>
          <input
            type="time"
            value={oh.open}
            disabled={oh.isClosed}
            aria-label={`فتح ${DAY_AR[oh.day] || oh.day}`}
            onChange={(e) => setAt(index, { open: e.target.value })}
          />
          <input
            type="time"
            value={oh.close}
            disabled={oh.isClosed}
            aria-label={`إغلاق ${DAY_AR[oh.day] || oh.day}`}
            onChange={(e) => setAt(index, { close: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}
