import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from './db.ts';
import { startAttendance, reconcileStaff } from './attendance-service.ts';
const staffId='test-'+randomUUID();
try {
 await pool.execute('INSERT INTO staff(id,display_name) VALUES (?,?)',[staffId,'Fictional concurrency test']);
 async function login() {
  const db=await pool.getConnection();
  try {await db.beginTransaction();const id=await startAttendance(db,staffId);await db.commit();return id;}
  catch(error){await db.rollback();throw error;}
  finally{db.release();}
 }
 const ids=await Promise.all([login(),login(),login()]);
 assert.equal(new Set(ids).size,1,'Concurrent logins must share one attendance session');
 const [rows]:any=await pool.execute('SELECT * FROM attendance_sessions WHERE staff_id=?',[staffId]);
 assert.equal(rows.length,1);
 await pool.execute('UPDATE attendance_sessions SET last_contact=started_at WHERE staff_id=?',[staffId]);
 const db=await pool.getConnection();
 try {
  await db.beginTransaction();
  await reconcileStaff(db,staffId,Number(rows[0].started_at)+600000);
  await db.commit();
 }catch(error){await db.rollback();throw error;}finally{db.release();}
 const [closed]:any=await pool.execute('SELECT * FROM attendance_sessions WHERE staff_id=?',[staffId]);
 assert.equal(Number(closed[0].ended_at),Number(closed[0].started_at));
 assert.equal(closed[0].needs_review,1);
 console.log('PASS concurrent logins, one open session, forgotten logout cutoff, Needs Review');
} finally {
 try {
  await pool.execute('DELETE FROM attendance_sessions WHERE staff_id=?',[staffId]);
  await pool.execute('DELETE FROM staff WHERE id=?',[staffId]);
 } finally {await pool.end();}
}
