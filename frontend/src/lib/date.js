/**
 * Date helpers. Everything in the app keys off local calendar days rendered as
 * 'YYYY-MM-DD', never ISO timestamps, so a study day means the same thing
 * regardless of the user's timezone or the hour they open the app.
 */

export const MS_PER_DAY = 86_400_000;

/** Local calendar key for a Date. `toISOString()` is deliberately avoided: it
 *  shifts to UTC and can hand back yesterday for anyone east of Greenwich. */
export function toKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey() {
  return toKey(new Date());
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** Whole calendar days between two keys. Positive when `to` is later. */
export function daysBetween(fromKeyStr, toKeyStr) {
  return Math.round((fromKey(toKeyStr) - fromKey(fromKeyStr)) / MS_PER_DAY);
}

export function daysUntilExam(examDate, from = todayKey()) {
  if (!examDate) return null;
  return daysBetween(from, examDate);
}

/** Inclusive list of day keys from `start` to `end`. */
export function eachDay(start, end) {
  const out = [];
  let cursor = start;
  let guard = 0;
  while (daysBetween(cursor, end) >= 0 && guard < 1000) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return out;
}

export function weekdayOf(key) {
  return fromKey(key).getDay(); // 0 = Sunday
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatDay(key, opts = {}) {
  return fromKey(key).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...opts,
  });
}

export function formatLongDay(key) {
  return fromKey(key).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** '2h 30m' · '45m' · '0m'. Used everywhere a duration is shown. */
export function formatMinutes(mins) {
  const m = Math.max(0, Math.round(mins || 0));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

export function formatHours(mins) {
  return `${((mins || 0) / 60).toFixed(1)}h`;
}

/** Monday-first week containing `key`, as 7 day keys. */
export function weekOf(key) {
  const dow = weekdayOf(key);
  const back = dow === 0 ? 6 : dow - 1;
  const monday = addDays(key, -back);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Calendar-month grid padded to whole Monday-first weeks. */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = first.getDay();
  const back = startDow === 0 ? 6 : startDow - 1;
  const start = addDays(toKey(first), -back);
  const cells = [];
  let cursor = start;
  while (cells.length < 42) {
    cells.push({ key: cursor, inMonth: fromKey(cursor).getMonth() === month });
    if (cells.length >= 35 && daysBetween(cursor, toKey(last)) < 0) break;
    cursor = addDays(cursor, 1);
  }
  return cells;
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
