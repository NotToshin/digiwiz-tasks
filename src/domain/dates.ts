import type { DateKey } from './models';

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: 'UTC' });
const shortFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dhaka' });

function dateFromKey(key: DateKey) {
  return new Date(key + 'T00:00:00Z');
}

function toKey(date: Date) {
  return date.toISOString().split('T')[0] as DateKey;
}

export function readDateKey(value: string | null): DateKey | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const key = value as DateKey;
  const date = dateFromKey(key);
  return Number.isFinite(date.getTime()) && toKey(date) === key ? key : undefined;
}

export function monthStart(key: DateKey): DateKey {
  return (key.slice(0, 7) + '-01') as DateKey;
}

export function shiftMonth(key: DateKey, offset: number) {
  const date = dateFromKey(monthStart(key));
  date.setUTCMonth(date.getUTCMonth() + offset);
  return toKey(date);
}

export function monthWeeks(key: DateKey) {
  const firstDay = dateFromKey(monthStart(key));
  const lastDay = new Date(firstDay);
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  const weekCount = Math.ceil((mondayOffset + lastDay.getUTCDate()) / 7);

  return Array.from({ length: weekCount }, (_, week) => Array.from({ length: 7 }, (_, day) => {
    const date = new Date(firstDay);
    date.setUTCDate(1 - mondayOffset + week * 7 + day);
    return readDateKey(toKey(date));
  }));
}

export const formatDate = (key: DateKey) => dateFormat.format(dateFromKey(key));
export const formatShortDate = (key: DateKey) => shortFormat.format(dateFromKey(key));
export const formatMonth = (key: DateKey) => monthFormat.format(dateFromKey(key));
export const formatDhakaTime = (instant: string) => timeFormat.format(new Date(instant));
