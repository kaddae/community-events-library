import { addDays, format, parseISO } from 'date-fns';
import { copy } from '@/content/copy';

// Pickup slots and drop-off days, built from copy.request.openHours.
// Dates are yyyy-MM-dd strings; a slot key is "yyyy-MM-dd HH:mm".

export interface OpenDay { date: string; from: string; to: string; starts: string[] }

const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const hhmm = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
const clock = (n: number) => `${Math.floor(n / 60) % 12 || 12}:${String(n % 60).padStart(2, '0')}`;
const ampm = (n: number) => (n >= 720 ? 'pm' : 'am');
const iso = (d: Date) => format(d, 'yyyy-MM-dd');

function span(fromMin: number, toMin: number) {
  return ampm(fromMin) === ampm(toMin)
    ? `${clock(fromMin)}–${clock(toMin)} ${ampm(toMin)}`
    : `${clock(fromMin)} ${ampm(fromMin)}–${clock(toMin)} ${ampm(toMin)}`;
}

// Open days from start to end (inclusive), skipping past days and slots already started today.
function openDaysBetween(start: string, end: string, now = new Date()): OpenDay[] {
  const today = iso(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const step = copy.request.slotMinutes;
  const out: OpenDay[] = [];
  for (let d = parseISO(start), n = 0; iso(d) <= end && n < 31; d = addDays(d, 1), n++) {
    const date = iso(d);
    if (date < today) continue;
    const hours = copy.request.openHours.find((o) => o.day === d.getDay());
    if (!hours) continue;
    const starts: string[] = [];
    for (let m = mins(hours.from); m + step <= mins(hours.to); m += step) {
      if (date === today && m <= nowMin) continue;
      starts.push(hhmm(m));
    }
    if (starts.length) out.push({ date, from: hours.from, to: hours.to, starts });
  }
  return out;
}

const valid = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(parseISO(d).getTime());

// The first day hosts can pick up for a gathering: a week before it, or today if that's later.
export function pickupWindowStart(eventDate: string) {
  const weekBefore = iso(addDays(parseISO(eventDate), -7));
  const today = iso(new Date());
  return weekBefore > today ? weekBefore : today;
}

// Open days in the week before the gathering, through the gathering day.
export function pickupDays(eventDate: string): OpenDay[] {
  if (!valid(eventDate)) return [];
  return openDaysBetween(iso(addDays(parseISO(eventDate), -7)), eventDate);
}

// Open days from the gathering day through the week after it.
export function returnDays(eventDate: string): OpenDay[] {
  if (!valid(eventDate)) return [];
  return openDaysBetween(eventDate, iso(addDays(parseISO(eventDate), 7)));
}

export const slotKey = (date: string, start: string) => `${date} ${start}`;
export const dayLabel = (date: string) => format(parseISO(date), 'EEE MMM d');
export const hoursLabel = (d: OpenDay) => span(mins(d.from), mins(d.to));
export const startLabel = (start: string) => clock(mins(start));

// "Thu Jun 5, 4:00–4:30 pm"
export function formatSlot(key: string) {
  const [date, start] = key.split(' ');
  const s = mins(start);
  return `${dayLabel(date)}, ${span(s, s + copy.request.slotMinutes)}`;
}

export const slotsToWindow = (keys: string[]) => [...keys].sort().map(formatSlot).join('; ');
export const slotDays = (keys: string[]) => [...new Set(keys.map((k) => k.split(' ')[0]))].sort();