import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware class joiner: later utilities win over earlier conflicts. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** Rounds to the nearest study-friendly block. Nobody schedules 37 minutes. */
export function roundToBlock(mins, block = 15) {
  return Math.max(block, Math.round(mins / block) * block);
}

export function pct(part, whole) {
  if (!whole) return 0;
  return clamp(Math.round((part / whole) * 100), 0, 100);
}

export function initials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

export function sum(arr, pick = (x) => x) {
  return arr.reduce((acc, x) => acc + (pick(x) || 0), 0);
}

export function groupBy(arr, pick) {
  return arr.reduce((acc, item) => {
    const k = pick(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

export function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
