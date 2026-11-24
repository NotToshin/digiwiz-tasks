import { pool } from './db.ts';
import { companies, projects, tasks } from '../src/fixtures/workspace.ts';
const connection = await pool.getConnection();
try {
 await connection.beginTransaction();
 const names = [...new Set([...projects.map(p => p.lead), ...tasks.flatMap(t => [...t.assignees])])];
 for (const name of names) await connection.execute('INSERT IGNORE INTO staff(id,display_name) VALUES (?,?)',[name,name]);
 for (const type of [...new Set(tasks.map(t => t.workType))]) await connection.execute('INSERT IGNORE INTO work_types(id,name) VALUES (?,?)',[type,type]);
 for (const c of companies) await connection.execute('INSERT IGNORE INTO companies VALUES (?,?,?,?,?)',[c.id,c.name,c.initials,c.kind,c.description]);
 for (const p of projects) {
  await connection.execute('INSERT IGNORE INTO projects VALUES (?,?,?,?,?,?)',[p.id,p.companyId,p.name,p.lead,p.targetDate,p.summary]);
  for (const name of names) await connection.execute('INSERT IGNORE INTO project_members VALUES (?,?)',[p.id,name]);
 }
 for (const t of tasks) {
  const [existing]: any = await connection.execute('SELECT id FROM tasks WHERE id=?',[t.id]);
  if (existing.length) continue;
  await connection.execute('INSERT INTO tasks(id,project_id,title,work_type_id,assigned_on,delivery_date,status,details,notes,requires_review,prerequisite_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
   [t.id,t.projectId,t.title,t.workType,t.assignedOn,t.deliveryDate,t.status,t.details,t.notes,t.status === 'In Review',t.prerequisiteId || null]);
  for (const name of t.assignees) await connection.execute('INSERT INTO task_assignees VALUES (?,?,?)',[t.id,t.projectId,name]);
 }
 await connection.commit();
 console.log('Fictional seed ready');
} catch (error) { await connection.rollback(); throw error; }
finally { connection.release(); await pool.end(); }
