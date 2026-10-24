/**
 * Formatting helpers for Arabic (Levantine) dates/times and Syrian Pounds.
 */
import dayjs from 'dayjs';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export const toArabicDigits = (value: string | number) =>
  String(value).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

/** Wraps a value in a Left-to-Right isolate so numbers keep their order inside RTL text. */
export const ltrIsolate = (value: string) => `\u2066${value}\u2069`;

/** 24-hour time with Arabic-Indic digits: "18:00" → "١٨:٠٠" (accepts 12-hour input too). */
export const formatTimeAr = (time?: string) => {
  if (!time) return '';
  const value = String(time).trim();
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return value;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const suffix = match[3]?.toUpperCase();
  if (suffix === 'PM' && hours < 12) hours += 12;
  if (suffix === 'AM' && hours === 12) hours = 0;
  return toArabicDigits(`${String(hours).padStart(2, '0')}:${minutes}`);
};

/** Bidi-safe time range: "من ١٨:٠٠ إلى ١٨:٥٠". */
export const formatTimeRange = (start?: string, end?: string) => {
  const from = formatTimeAr(start);
  if (!from) return '';
  const to = formatTimeAr(end);
  return to ? `من ${from} إلى ${to}` : from;
};

const AR_MONTHS = [
  'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
  'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول',
];
const AR_WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/** Arabic date with Levantine month names and Arabic-Indic digits: "٢٢ تشرين الأول ٢٠٢٦". */
export const formatDateAr = (value: string | Date) => {
  const d = dayjs(value);
  if (!d.isValid()) return '';
  return `${toArabicDigits(d.date())} ${AR_MONTHS[d.month()]} ${toArabicDigits(d.year())}`;
};

/** Arabic weekday + date: "الخميس، ٢٢ تشرين الأول ٢٠٢٦". */
export const formatWeekdayDateAr = (value: string | Date) => {
  const d = dayjs(value);
  if (!d.isValid()) return '';
  return `${AR_WEEKDAYS[d.day()]}، ${formatDateAr(value)}`;
};

/**
 * Formats money amounts for Syrian Pound display (ل.س).
 */
export const formatMoney = (amount: number | string | null | undefined, currency = 'ل.س') => {
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe.toLocaleString('ar-SY')} ${currency}`;
};
