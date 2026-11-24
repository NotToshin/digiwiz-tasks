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
import { validateTransition } from './delivery.ts';

const app = express();
app.disable('x-powered-by');
installBoundary(app);
app.use(express.json({limit:'64kb'}));
app.use('/api', accounts);
app.use('/api', requireAccount);
app.use('/api/attendance', attendanceRouter);
app.get('/api/notifications', async (req,res)=>{
 const [rows]=await pool.execute("SELECT n.id,n.task_id AS taskId,n.message,n.created_at AS createdAt,n.read_at AS readAt FROM notifications n JOIN tasks t ON t.id=n.task_id WHERE n.staff_id=? AND (?='Superadmin' OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id=t.project_id AND pm.staff_id=?)) ORDER BY n.id DESC LIMIT 100",[req.identity.staffId,req.identity.role,req.identity.staffId]);
 res.json(rows);
});
app.post('/api/notifications/:id/read', async(req,res)=>{
 await pool.execute('UPDATE notifications SET read_at=COALESCE(read_at,CURRENT_TIMESTAMP) WHERE id=? AND staff_id=?',[req.params.id,req.identity.staffId]);
 res.json({ok:true});
});
app.get('/api/activity',async(req,res)=>{
 const [rows]=await pool.execute("SELECT h.id,h.entity_id AS taskId,t.title,h.actor_id AS actor,h.before_json AS beforeValue,h.after_json AS afterValue,h.occurred_at AS occurredAt FROM change_history h JOIN tasks t ON t.id=h.entity_id WHERE h.entity_type='tasks' AND (?='Superadmin' OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id=t.project_id AND pm.staff_id=?)) ORDER BY h.id DESC LIMIT 100",[req.identity.role,req.identity.staffId]);
 res.json(rows);
});
const text = z.string().trim().min(1).max(160);
const date = z.iso.date();
const companySchema = z.object({name:text,initials:z.string().trim().min(1).max(8),kind:z.enum(['Client','Internal']),description:z.string().max(10000)}).strict();
const projectSchema = z.object({companyId:text,name:text,lead:text,targetDate:date,summary:z.string().max(10000)}).strict();
const taskSchema = z.object({
 projectId:text,title:z.string().trim().min(1).max(200),workType:text,
 assignees:z.array(text).min(1).max(50).refine(a=>new Set(a).size===a.length,'Duplicate assignees'),
 deliveryDate:date,status:z.enum(['Backlog','To Do','In Progress','Waiting for Client','In Review','Done']),
 details:z.string().max(10000),notes:z.string().max(10000),
 priority:z.enum(['Low','Normal','High','Urgent']).default('Normal'),
 requiresReview:z.boolean().optional(), prerequisiteId:z.string().max(64).nullable().optional(), followUpId:z.string().max(64).optional(), reviewFeedback:z.string().max(2000).optional(),
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
    const [projectRows]:any=await db.execute('SELECT lead_id FROM projects WHERE id=? FOR UPDATE',[data.projectId]);
    if(!projectRows.length) fail('Project unavailable',404);
    const reviewer=req.identity.role==='Superadmin' || (req.identity.role==='Lead' && projectRows[0].lead_id===req.identity.staffId);
    const requiresReview=!!old?.requires_review || !!data.requiresReview;
    validateTransition(old?.status,data.status,requiresReview,reviewer,data.reviewFeedback || '');
    const prerequisite=data.prerequisiteId===undefined?old?.prerequisite_id:data.prerequisiteId;
    if(prerequisite){
     const [dependencies]:any=await db.execute('SELECT id,prerequisite_id,status FROM tasks WHERE project_id=? FOR UPDATE',[data.projectId]);
     const seen=new Set([id]); let cursor=prerequisite;
     while(cursor){if(seen.has(cursor))fail('Dependency cycle',409);seen.add(cursor);const dep=dependencies.find((t:any)=>t.id===cursor);if(!dep)fail('Invalid prerequisite');if(cursor===prerequisite && ['In Progress','In Review','Done'].includes(data.status) && dep.status!=='Done')fail('Complete the prerequisite first',409);cursor=dep.prerequisite_id;}
    }
    if(data.followUpId){if(old)fail('Follow-up can only be set when creating');const [source]:any=await db.execute("SELECT id FROM tasks WHERE id=? AND project_id=? AND status='Done'",[data.followUpId,data.projectId]);if(!source.length)fail('Choose a completed task in this project');}
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
    await db.execute('UPDATE tasks SET priority=?,requires_review=?,prerequisite_id=?,follow_up_id=COALESCE(follow_up_id,?),review_feedback=COALESCE(?,review_feedback) WHERE id=?',[data.priority,requiresReview,prerequisite || null,data.followUpId || null,data.reviewFeedback || null,id]);
    const recipients=new Set<string>([...data.assignees,...(old?.assignees || []),projectRows[0].lead_id]);
    recipients.delete(req.identity.staffId);
    for(const recipient of recipients) await db.execute('INSERT INTO notifications(staff_id,task_id,message) VALUES (?,?,?)',[recipient,id,data.title.slice(0,180)+' — '+data.status]);
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
app.listen(Number(process.env.PORT || 63479), process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1', () => console.log('API listening on port ' + (process.env.PORT || 63479)));
