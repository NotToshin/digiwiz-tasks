import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pool } from './db.ts';
const connection = await pool.getConnection();
try {
 const [lock]: any = await connection.query("SELECT GET_LOCK('digiwiz_migrations', 30) AS acquired");
 if (!lock[0].acquired) throw new Error('Migration lock unavailable');
 await connection.query('CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(160) PRIMARY KEY, checksum CHAR(64) NOT NULL) ENGINE=InnoDB');
 for (const name of (await readdir('db/migrations')).filter(name => name.endsWith('.sql')).sort()) {
  const sql = await readFile('db/migrations/' + name, 'utf8');
  const checksum = createHash('sha256').update(sql).digest('hex');
  const [previous]: any = await connection.execute('SELECT checksum FROM schema_migrations WHERE name=?', [name]);
  if (previous.length) {
   if (previous[0].checksum !== checksum) throw new Error('Applied migration changed: ' + name);
   continue;
  }
  for (const statement of sql.split(';').filter(part => part.trim())) await connection.query(statement);
  await connection.execute('INSERT INTO schema_migrations VALUES (?,?)', [name, checksum]);
  console.log('Applied', name);
 }
} finally {
 await connection.query("SELECT RELEASE_LOCK('digiwiz_migrations')");
 connection.release();
 await pool.end();
}
