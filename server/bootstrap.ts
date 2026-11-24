/**
 * Bootstrap: creates the initial Superadmin invite.
 *
 * Usage:
 *   node --env-file-if-exists=.env server/bootstrap.ts [email]
 *
 * If no email argument is given, defaults to admin@example.test for local dev.
 * Production: pass the real admin email as the first argument.
 *   node --env-file-if-exists=.env server/bootstrap.ts admin@digiwiz.com.bd
 */
import { pool } from './db.ts';

const email = process.argv[2] || 'admin@example.test';
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Invalid email address:', email);
  process.exit(1);
}

const db = await pool.getConnection();
try {
  await db.beginTransaction();
  const [existing]: any = await db.query("SELECT staff_id FROM accounts WHERE role='Superadmin' FOR UPDATE");
  if (existing.length) throw new Error('An administrator already exists. Use the Staff access screen to manage it.');
  const staffId = 'admin-bootstrap';
  await db.execute('INSERT IGNORE INTO staff(id,display_name) VALUES (?,?)', [staffId, 'Administrator']);
  await db.execute(
    "INSERT INTO invites(email,staff_id,role,expires_at) VALUES (?,?,'Superadmin',?) ON DUPLICATE KEY UPDATE expires_at=VALUES(expires_at)",
    [email, staffId, Date.now() + 86400000]
  );
  await db.commit();
  if (process.env.SMTP_HOST) {
    console.log('Invite ready for', email + '. Accept invitation — a code will be sent to that address.');
  } else {
    console.log('Invite ready for', email + '. Use Accept invitation and read .local/mail/ for the code.');
  }
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  db.release();
  await pool.end();
}
