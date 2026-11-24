import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pool } from './db.ts';
import { hashPassword } from './credentials.ts';

const DEFAULT_WORK_TYPES = [
  'Website Design', 'Website Development', 'UI/UX', 'WordPress Development',
  'Software Development', 'Graphic Design', 'Branding', 'Video Editing',
  'Motion Graphics', 'Audio Editing', 'Content Writing', 'Copywriting',
  'Social Media', 'Paid Ads', 'SEO', 'Analytics and Reporting', 'QA', 'Maintenance', 'Other'
];

export async function ensureDatabaseReady() {
  let connection;
  try {
    connection = await pool.getConnection();
  } catch (err: any) {
    console.warn('Database connection deferred (will retry on next request):', err.message);
    return;
  }

  try {
    // 1. Acquire advisory lock so multiple workers don't race migrations
    const [lock]: any = await connection.query("SELECT GET_LOCK('digiwiz_migrations', 30) AS acquired");
    if (!lock[0]?.acquired) {
      console.warn('Migration lock not acquired, skipping startup migration');
      return;
    }

    try {
      // 2. Ensure schema_migrations table exists
      await connection.query('CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(160) PRIMARY KEY, checksum CHAR(64) NOT NULL) ENGINE=InnoDB');

      // 3. Apply any unapplied migrations in order
      const migrationFiles = (await readdir('db/migrations')).filter(name => name.endsWith('.sql')).sort();
      for (const name of migrationFiles) {
        const sql = await readFile('db/migrations/' + name, 'utf8');
        const checksum = createHash('sha256').update(sql).digest('hex');
        const [previous]: any = await connection.execute('SELECT checksum FROM schema_migrations WHERE name=?', [name]);
        if (previous.length) {
          continue;
        }
        for (const statement of sql.split(';').filter(part => part.trim())) {
          await connection.query(statement);
        }
        await connection.execute('INSERT INTO schema_migrations VALUES (?,?)', [name, checksum]);
        console.log('Applied migration:', name);
      }

      // 4. Default work schedule if empty
      await connection.query("INSERT IGNORE INTO work_schedule (id, weekdays) VALUES (1, '[0,1,2,3,4,6]')");

      // 5. Default work types
      for (const wt of DEFAULT_WORK_TYPES) {
        await connection.execute('INSERT IGNORE INTO work_types (id, name) VALUES (?, ?)', [wt, wt]);
      }

      // 6. Ensure default internal agency company
      await connection.execute("INSERT IGNORE INTO companies (id, name, initials, kind, description) VALUES ('internal-digiwiz', 'DIGIWIZ', 'DW', 'Internal', 'DIGIWIZ Internal agency operations')");

      // 7. Ensure Superadmin account for admin@digiwiz.com.bd
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@digiwiz.com.bd').toLowerCase().trim();
      const adminPass = process.env.ADMIN_PASSWORD || 'DigiWiz!2026#Tasks';

      const [existingAdmin]: any = await connection.execute(
        "SELECT a.staff_id FROM accounts a WHERE a.role = 'Superadmin' LIMIT 1"
      );

      if (!existingAdmin.length) {
        const hash = await hashPassword(adminPass);
        const staffId = 'admin';
        await connection.execute('INSERT IGNORE INTO staff(id, display_name, active) VALUES (?, ?, 1)', [staffId, 'Administrator']);
        await connection.execute(
          `INSERT INTO accounts(staff_id, email, password_hash, role, full_name, onboarded, employment_start, can_correct_attendance, can_view_attendance)
           VALUES (?, ?, ?, 'Superadmin', 'Administrator', 1, CURDATE(), 1, 1)
           ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'Superadmin', onboarded = 1`,
          [staffId, adminEmail, hash]
        );
        console.log(`Bootstrapped Superadmin account: ${adminEmail}`);
      }
    } finally {
      await connection.query("SELECT RELEASE_LOCK('digiwiz_migrations')");
    }
  } catch (error: any) {
    console.error('ensureDatabaseReady encountered error:', error.message);
  } finally {
    connection.release();
  }
}
