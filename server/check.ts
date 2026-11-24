import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pool } from './db.ts';
import { readWorkspace } from './data.ts';
const db=await pool.getConnection();
try {
 await db.beginTransaction();
 const data=await readWorkspace(db);
 assert.equal(new Set(data.tasks.map((t:any)=>t.id)).size,data.tasks.length,'Task list must contain unique IDs');
 const handoff=data.tasks.find((t:any)=>t.id==='design-handoff');
 assert.ok(handoff,'Run the fictional seed first');
 assert.equal(handoff.assignees.length,2);
 const sql=await readFile('db/queries/company-task-counts.sql','utf8');
 const [counts]:any=await db.execute(sql,['example-retail']);
 const projectIds=data.projects.filter((p:any)=>p.companyId==='example-retail').map((p:any)=>p.id);
 const expected=data.tasks.filter((t:any)=>projectIds.includes(t.projectId)).length;
 assert.equal(Number(counts[0].total_tasks),expected);
 const [before]:any=await db.execute(sql,['example-retail']);
 await db.execute("DELETE FROM task_assignees WHERE task_id='design-handoff' AND staff_id='Rian'");
 const [after]:any=await db.execute(sql,['example-retail']);
 assert.equal(Number(before[0].total_tasks),Number(after[0].total_tasks));
 await db.rollback();
 console.log('PASS: unique task rows, two handoff assignees, company counts independent of assignment count.');
} finally {db.release();await pool.end();}
