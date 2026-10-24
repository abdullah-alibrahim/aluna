export const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const DAY_AR: Record<string, string> = {
  Sunday: 'الأحد',
  Monday: 'الإثنين',
  Tuesday: 'الثلاثاء',
  Wednesday: 'الأربعاء',
  Thursday: 'الخميس',
  Friday: 'الجمعة',
  Saturday: 'السبت',
};

export type DayHours = {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
};

export function defaultOperatingHours(): DayHours[] {
  return DAYS.map((day) => ({
    day,
    open: '10:00',
    close: '20:00',
    isClosed: day === 'Friday',
  }));
}

export function mergeOperatingHours(existing?: DayHours[] | null): DayHours[] {
  const base = defaultOperatingHours();
  if (!existing?.length) return base;
  return base.map((dh) => {
    const found = existing.find((e) => e.day === dh.day);
    return found
      ? {
          day: dh.day,
          open: found.open || '10:00',
          close: found.close || '20:00',
          isClosed: Boolean(found.isClosed),
        }
      : dh;
  });
}
