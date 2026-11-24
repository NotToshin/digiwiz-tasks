export const HEARTBEAT_GAP_SECONDS = 600;
export const MAX_SHIFT_SECONDS = 12 * 3600;
export interface Interval { start: number; end: number }
export function closeDue(start: number, lastContact: number, now: number, maxSeconds = MAX_SHIFT_SECONDS) {
  const limit = start + maxSeconds * 1000;
  if (now >= lastContact + HEARTBEAT_GAP_SECONDS * 1000 || now >= limit) {
    return { end: Math.min(lastContact, limit), reason: now >= limit ? 'Maximum shift reached' : 'Heartbeat lost' };
  }
  return null;
}
export function dailySeconds(intervals: Interval[]) {
  const result: Record<string, number> = {};
  for (const interval of intervals) {
    if (interval.end < interval.start) throw new Error('End precedes start');
    let cursor = interval.start;
    while (cursor < interval.end) {
      const local = new Date(cursor + 6 * 3600000);
      const day = local.toISOString().slice(0, 10);
      const nextMidnight = Date.parse(day + 'T00:00:00+06:00') + 86400000;
      const end = Math.min(interval.end, nextMidnight);
      result[day] = (result[day] || 0) + Math.floor((end - cursor) / 1000);
      cursor = end;
    }
  }
  return result;
}
export function overlaps(a: Interval, b: Interval) {
  return a.start < b.end && b.start < a.end;
}
