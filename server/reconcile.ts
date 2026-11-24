import { pool } from './db.ts';
import { reconcileStaff } from './attendance-service.ts';
try {
 const [staff]:any=await pool.query('SELECT DISTINCT staff_id FROM attendance_sessions WHERE ended_at IS NULL');
 for(const row of staff) {
  const db=await pool.getConnection();
  try {await db.beginTransaction();await reconcileStaff(db,row.staff_id);await db.commit();}
  catch(error){await db.rollback();throw error;}
  finally{db.release();}
 }
} finally{await pool.end();}
