import { randomUUID } from 'node:crypto';
import type { PoolConnection } from 'mysql2/promise';
import { closeDue } from './attendance-time.ts';
export async function lockStaff(db:PoolConnection,staffId:string) {
 await db.execute('SELECT id FROM staff WHERE id=? FOR UPDATE',[staffId]);
}
export async function reconcileStaff(db:PoolConnection,staffId:string,now=Date.now()) {
 await lockStaff(db,staffId);
 const [rows]:any=await db.execute('SELECT * FROM attendance_sessions WHERE staff_id=? AND ended_at IS NULL FOR UPDATE',[staffId]);
 const open=rows[0];
 if(!open) return null;
 const cutoff=closeDue(Number(open.started_at),Number(open.last_contact),now);
 if(!cutoff) return open;
 await closeAttendance(db,staffId,cutoff.end,true,cutoff.reason);
 await db.execute('DELETE FROM auth_sessions WHERE staff_id=?',[staffId]);
 return null;
}
export async function closeAttendance(db:PoolConnection,staffId:string,end:number,review=false,reason='Logout') {
 await db.execute('UPDATE task_intervals SET ended_at=GREATEST(started_at,?) WHERE staff_id=? AND ended_at IS NULL',[end,staffId]);
 await db.execute('UPDATE attendance_sessions SET ended_at=?,needs_review=?,reason=? WHERE staff_id=? AND ended_at IS NULL',[end,review,reason,staffId]);
}
export async function startAttendance(db:PoolConnection,staffId:string,now=Date.now()) {
 const open=await reconcileStaff(db,staffId,now);
 if(open) return open.id;
 const id=randomUUID();
 await db.execute('INSERT INTO attendance_sessions(id,staff_id,started_at,last_contact) VALUES (?,?,?,?)',[id,staffId,now,now]);
 return id;
}
