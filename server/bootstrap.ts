import { pool } from './db.ts';
const db = await pool.getConnection();
try {
 await db.beginTransaction();
 const [existing]: any = await db.query("SELECT staff_id FROM accounts WHERE role='Superadmin' FOR UPDATE");
 if (existing.length) throw new Error('An administrator already exists. Use its invite screen.');
 const staffId = 'Example Lead';
 await db.execute('INSERT IGNORE INTO staff(id,display_name) VALUES (?,?)', [staffId, staffId]);
 await db.execute("INSERT INTO invites(email,staff_id,role,expires_at) VALUES (?,?,'Superadmin',?) ON DUPLICATE KEY UPDATE expires_at=VALUES(expires_at)", ['admin@example.test',staffId,Date.now()+86400000]);
 await db.commit();
 console.log('Invite ready for admin@example.test. Use Accept invitation and read .local/mail.');
} catch(error) {await db.rollback();throw error;}
finally {db.release();await pool.end();}
