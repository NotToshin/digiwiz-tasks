import { useEffect, useState } from 'react';
import { apiFetch } from '../../app/api';
import { attendance as sampleAttendance, demoToday } from '../../fixtures/workspace';
import type { AttendanceDay, DateKey } from '../../domain/models';

export function useAttendance(sampleMode: boolean, month?: string) {
 const today = sampleMode ? demoToday : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date()) as DateKey;
 const [data, setData] = useState<any>(null);
 const [error, setError] = useState('');
 const [receivedAt, setReceivedAt] = useState(0);
 const [now, setNow] = useState(Date.now());
 useEffect(() => {
  if (sampleMode) return;
  let active = true;
  async function load() {
   try {
    const response = await apiFetch('/api/attendance?month=' + (month || today.slice(0, 7)));
    if (!response.ok) throw new Error('Attendance unavailable');
    const value = await response.json();
    if (active) { setData(value); setReceivedAt(Date.now()); setError(''); }
   } catch { if (active) setError('Attendance unavailable'); }
  }
  void load();
  const refresh = setInterval(() => void load(), 60000);
  return () => { active = false; clearInterval(refresh); };
 }, [sampleMode, month, today]);
 useEffect(() => {
  const timer = setInterval(() => setNow(Date.now()), 1000);
  return () => clearInterval(timer);
 }, []);
 if (sampleMode) return { today, attendance: sampleAttendance, error };
 const days = new Map<string, AttendanceDay>();
 for (const [date,status] of Object.entries(data?.statuses || {})) {
  days.set(date,{date:date as DateKey,status:status as AttendanceDay['status'],intervals:[]});
 }
 for (const interval of data?.intervals || []) {
  let cursor = interval.start;
  let end = interval.end;
  if (data.open && Number(data.open.started_at) === cursor) end += Math.min(Math.max(0, now - receivedAt), 60000);
  while (cursor < end) {
   const day = new Date(cursor + 21600000).toISOString().slice(0, 10) as DateKey;
   const cutoff = Math.min(end, Date.parse(day + 'T00:00:00+06:00') + 86400000);
   const entry = days.get(day) || { date: day, status: 'Worked' as const, intervals: [] };
   const needsReview = data.sessions.some((session:any) => session.needs_review && Number(session.started_at) < cutoff && Number(session.ended_at) > cursor && !data.corrections.some((correction:any) => correction.interval_id === session.id));
   days.set(day, { ...entry, status: needsReview ? 'Needs Review' : entry.status, intervals: [...entry.intervals, { startUtc: new Date(cursor).toISOString(), endUtc: new Date(cutoff).toISOString() }] });
   cursor = cutoff;
  }
 }
 return { today, attendance: [...days.values()], error };
}
