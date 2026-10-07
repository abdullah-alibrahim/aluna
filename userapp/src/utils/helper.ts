/**
 * Converts a 24-hour time string (e.g. "14:30") to a 12-hour AM/PM string (e.g. "02:30 PM").
 * Safely returns the input if it's already in 12-hour format or empty.
 */
export const formatTime12h = (time24: string) => {
  if (!time24) return '';
  if (time24.includes('AM') || time24.includes('PM')) return time24;
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${mStr} ${ampm}`;
};

/**
 * Formats money amounts for Syrian Pound display (ل.س).
 */
export const formatMoney = (amount: number | string | null | undefined, currency = 'ل.س') => {
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe.toLocaleString('ar-SY')} ${currency}`;
};

/**
 * Calculates the end time given a start time and duration in minutes.
 * Accepts both 12-hour and 24-hour formats for the start time.
 * Returns the end time in 24-hour format (e.g. "15:45") as expected by the backend.
 */
export const calculateEndTime = (startTimeStr: string, durationMins: number) => {
  const [time, modifier] = startTimeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier && hours === 12 && modifier.toLowerCase() === 'am') hours = 0;
  if (modifier && hours < 12 && modifier.toLowerCase() === 'pm') hours += 12;
  
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  d.setMinutes(d.getMinutes() + durationMins);
  
  let endH = d.getHours();
  const endM = d.getMinutes();
  
  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
};
