import { installBoundary, requireAccount, canAccessProject } from './security.ts';
import { accounts } from './accounts.ts';
import { attendanceRouter } from './attendance-routes.ts';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import { pool } from './db.ts';
import { readWorkspace } from './data.ts';

if (process.env.NODE_ENV === 'production') throw new Error('Phase 2 is local-only. Accounts and office access must be implemented before deployment.');
const app = express();
app.disable('x-powered-by');
installBoundary(app);
app.use(express.json({limit:'64kb'}));
app.use('/api', accounts);
app.use('/api', requireAccount);
app.use('/api/attendance', attendanceRouter);
const text = z.string().trim().min(1).max(160);
const date = z.iso.date();
const companySchema = z.object({name:text,initials:z.string().trim().min(1).max(8),kind:z.enum(['Client','Internal']),description:z.string().max(10000)}).strict();
const projectSchema = z.object({companyId:text,name:text,lead:text,targetDate:date,summary:z.string().max(10000)}).strict();
const taskSchema = z.object({
 projectId:text,title:z.string().trim().min(1).max(200),workType:text,
 assignees:z.array(text).min(1).max(50).refine(a=>new Set(a).size===a.length,'Duplicate assignees'),
 deliveryDate:date,status:z.enum(['Backlog','To Do','In Progress','Waiting for Client','In Review','Done']),
 details:z.string().max(10000),notes:z.string().max(10000),
 version:z.number().int().positive().optional(),
}).strict();
const countsSql = await readFile('db/queries/company-task-counts.sql','utf8');
app.get('/api/health', async (_req,res) => { await pool.query('SELECT 1'); res.json({status:'ok',mode:'local'}); });
app.get('/api/workspace', async (req,res) => {
 const db = await pool.getConnection();
 try { await db.beginTransaction(); const data=await readWorkspace(db,req.identity); await db.commit(); res.json(data); }
 catch(error) { await db.rollback(); throw error; }
 finally { db.release(); }
});
app.get('/api/companies/:id/counts', async (req,res) => {
 const db=await pool.getConnection();
 try {
  const data=await readWorkspace(db,req.identity);
  const company=data.companies.find((c:any)=>c.id===req.params.id);
  if(!company) return res.sendStatus(404);
  const ids=data.projects.filter((p:any)=>p.companyId===company.id).map((p:any)=>p.id);
  const tasks=data.tasks.filter((t:any)=>ids.includes(t.projectId));
  res.json({id:company.id,name:company.name,total_tasks:tasks.length,completed_tasks:tasks.filter((t:any)=>t.status==='Done').length,waiting_tasks:tasks.filter((t:any)=>t.status==='Waiting for Client').length});
 } finally {db.release();}
});
for (const entity of ['companies','projects','tasks'] as const) {
 app.get('/api/'+entity, async (req,res) => {
  const db=await pool.getConnection();
  try {
   const data=await readWorkspace(db,req.identity);
   let rows=data[entity];
   if (entity==='tasks' && req.query.projectId) rows=rows.filter((r:any)=>r.projectId===req.query.projectId);
   if (entity==='projects' && req.query.companyId) rows=rows.filter((r:any)=>r.companyId===req.query.companyId);
   res.json(rows);
  } finally { db.release(); }
 });
 app.post('/api/'+entity, save(entity));
 app.put('/api/'+entity+'/:id', save(entity));
}
function fail(message:string,status=400):never { throw Object.assign(new Error(message),{status}); }
function save(entity:'companies'|'projects'|'tasks') {
 return async (req:express.Request,res:express.Response) => {
  const data=(entity==='companies'?companySchema:entity==='projects'?projectSchema:taskSchema).parse(req.body) as any;
  const id=String(req.params.id || randomUUID());
  const db=await pool.getConnection();
  try {
   await db.beginTransaction();
   const [rows]:any=await db.execute('SELECT * FROM '+entity+' WHERE id=? FOR UPDATE',[id]);
   const old=rows[0];
   if(req.method==='PUT' && !old) fail('Record unavailable',404);
   if(entity==='companies' && req.identity.role!=='Superadmin') fail('Permission denied',403);
   if(entity==='projects' && req.identity.role!=='Superadmin') {
    if(!old || old.lead_id!==req.identity.staffId) fail('Permission denied',403);
   }
   if(entity==='tasks') {
    if(!await canAccessProject(db,req.identity.staffId,req.identity.role,data.projectId)) fail('Permission denied',403);
    if(old && req.identity.role!=='Superadmin') {
     const [editors]:any=await db.execute('SELECT t.id FROM tasks t JOIN projects p ON p.id=t.project_id LEFT JOIN task_assignees a ON a.task_id=t.id WHERE t.id=? AND (p.lead_id=? OR a.staff_id=?)',[id,req.identity.staffId,req.identity.staffId]);
     if(!editors.length) fail('Permission denied',403);
    }
    if(old?.status==='Done') fail('Done tasks are final',409);
    if(old && data.version!==old.version) fail('Task changed. Reload before saving.',409);
    if(data.status!==old?.status && (data.status==='Done' || data.status==='In Review')) fail('Review and completion are available in Phase 4',409);
    if(old?.prerequisite_id && data.status==='In Progress') {
     const [deps]:any=await db.execute('SELECT status FROM tasks WHERE id=?',[old.prerequisite_id]);
     if(deps[0]?.status!=='Done') fail('Complete the prerequisite first',409);
    }
    if(old && old.project_id!==data.projectId) fail('Task project cannot be changed',409);
    const [members]:any=await db.execute('SELECT pm.staff_id FROM project_members pm JOIN staff s ON s.id=pm.staff_id WHERE project_id=? AND s.active=1',[data.projectId]);
    if(data.assignees.some((id:string)=>!members.some((m:any)=>m.staff_id===id))) fail('Assignees must be active project members');
    const values=[data.projectId,data.title,data.workType,data.deliveryDate,data.status,data.details,data.notes];
    if(old) await db.execute('UPDATE tasks SET project_id=?,title=?,work_type_id=?,delivery_date=?,status=?,details=?,notes=?,version=version+1 WHERE id=?',[...values,id]);
    else await db.execute('INSERT INTO tasks(project_id,title,work_type_id,delivery_date,status,details,notes,id,assigned_on) VALUES (?,?,?,?,?,?,?,?,?)',[...values,id,new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka'}).format(new Date())]);
    const [previousAssignees]:any=await db.execute('SELECT staff_id FROM task_assignees WHERE task_id=?',[id]);
    if(old) old.assignees=previousAssignees.map((a:any)=>a.staff_id);
    await db.execute('DELETE FROM task_assignees WHERE task_id=?',[id]);
    for(const staffId of data.assignees) await db.execute('INSERT INTO task_assignees VALUES (?,?,?)',[id,data.projectId,staffId]);
   } else if(entity==='companies') {
    const values=[data.name,data.initials,data.kind,data.description,id];
    await db.execute(old?'UPDATE companies SET name=?,initials=?,kind=?,description=? WHERE id=?':'INSERT INTO companies(name,initials,kind,description,id) VALUES (?,?,?,?,?)',values);
   } else {
    if(old && old.company_id!==data.companyId) fail('Project company cannot be changed',409);
    const values=[data.companyId,data.name,data.lead,data.targetDate,data.summary,id];
    await db.execute(old?'UPDATE projects SET company_id=?,name=?,lead_id=?,target_date=?,summary=? WHERE id=?':'INSERT INTO projects(company_id,name,lead_id,target_date,summary,id) VALUES (?,?,?,?,?,?)',values);
    await db.execute('INSERT IGNORE INTO project_members VALUES (?,?)',[id,data.lead]);
   }
   await db.execute('INSERT INTO change_history(entity_type,entity_id,actor_id,before_json,after_json) VALUES (?,?,?,?,?)',[entity,id,req.identity.staffId,old?JSON.stringify(old):null,JSON.stringify(data)]);
   await db.commit();
   res.status(old?200:201).json({id});
  } catch(error) { await db.rollback(); throw error; }
  finally { db.release(); }
 };
}
app.use('/api',(_req,res)=>res.status(404).json({error:'Unknown API route'}));
app.use(express.static(resolve('dist')));
app.get('/{*path}',(_req,res)=>res.sendFile(resolve('dist/index.html')));
app.use((error:any,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
 if(error instanceof z.ZodError) return res.status(400).json({error:error.issues.map(i=>i.path.join('.')+': '+i.message).join('; ')});
 const status=error.status || (error.code==='ER_NO_REFERENCED_ROW_2'?400:500);
 console.error(error.message);
 res.status(status).json({error:status===500?'Database operation failed':error.message});
});
app.listen(63479,'127.0.0.1',()=>console.log('Local API http://127.0.0.1:63479'));
