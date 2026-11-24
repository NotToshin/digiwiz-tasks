import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from './db.ts';
import { reconcileStaff,lockStaff } from './attendance-service.ts';
import { dailySeconds, overlaps } from './attendance-time.ts';
import { calendarStatuses } from './schedule.ts';
export const attendanceRouter=Router();
attendanceRouter.post('/heartbeat',async(req,res)=>{
 const db=await pool.getConnection();
 try {
  await db.beginTransaction();
  const open=await reconcileStaff(db,req.identity.staffId);
  if(open) await db.execute('UPDATE attendance_sessions SET last_contact=? WHERE id=?',[Date.now(),open.id]);
  await db.commit();res.status(open?200:401).json({open:!!open});
 }catch(error){await db.rollback();throw error;}finally{db.release();}
});
attendanceRouter.get('/',async(req,res)=>{
 const staffId=z.string().max(64).parse(req.query.staffId || req.identity.staffId);
 if(staffId!==req.identity.staffId && req.identity.role!=='Superadmin' && !req.identity.viewAttendance) return res.sendStatus(403);
 const month=z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).parse(req.query.month || new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit'}).format(new Date()));
 const db=await pool.getConnection();
 try {
  await db.beginTransaction();
  const open=await reconcileStaff(db,staffId);
  const [sessions]:any=await db.execute('SELECT * FROM attendance_sessions WHERE staff_id=? ORDER BY started_at',[staffId]);
  const [timers]:any=await db.execute('SELECT * FROM task_intervals WHERE staff_id=? ORDER BY started_at',[staffId]);
  const [corrections]:any=await db.execute("SELECT c.* FROM time_corrections c JOIN attendance_sessions s ON c.interval_id=s.id WHERE c.interval_type='attendance' AND s.staff_id=? ORDER BY c.created_at,c.id",[staffId]);
  const intervals=sessions.map((session:any)=>{
   const changes=corrections.filter((c:any)=>c.interval_id===session.id);
   const corrected=changes.at(-1);
   return {start:Number(corrected?.corrected_start ?? session.started_at),end:Number(corrected?.corrected_end ?? session.ended_at ?? Date.now())};
  });
  const days=Object.fromEntries(Object.entries(dailySeconds(intervals)).filter(([day])=>day.startsWith(month)));
  const [schedules]:any=await db.query('SELECT weekdays FROM work_schedule WHERE id=1');
  const [holidays]:any=await db.query('SELECT day FROM holidays');
  const [employment]:any=await db.execute('SELECT employment_start,employment_end FROM accounts WHERE staff_id=?',[staffId]);
  const weekdays=typeof schedules[0].weekdays==='string'?JSON.parse(schedules[0].weekdays):schedules[0].weekdays;
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka'}).format(new Date());
  const statuses=calendarStatuses(month,today,employment[0]?.employment_start || today,weekdays,holidays.map((h:any)=>h.day),days);
  for(const day of Object.keys(statuses)) if(employment[0]?.employment_end && day>employment[0].employment_end) delete statuses[day];
  await db.commit();
  res.json({canCorrect:req.identity.role==='Superadmin' || req.identity.correctAttendance,serverNow:Date.now(),open,sessions,timers,corrections,intervals,days,statuses,totalSeconds:Object.values(days).reduce((a,b)=>a+b,0),provisional:sessions.some((s:any)=>s.needs_review && !corrections.some((c:any)=>c.interval_id===s.id))});
 }catch(error){await db.rollback();throw error;}finally{db.release();}
});
attendanceRouter.post('/timer',async(req,res)=>{
 const data=z.object({taskId:z.string().min(1).max(64).nullable()}).strict().parse(req.body);
 const db=await pool.getConnection();
 try {
  await db.beginTransaction();
  const open=await reconcileStaff(db,req.identity.staffId);
  if(!open){await db.commit();return res.status(401).json({error:'Sign in again'});}
  const [running]:any=await db.execute('SELECT * FROM task_intervals WHERE staff_id=? AND ended_at IS NULL',[req.identity.staffId]);
  if(!data.taskId) {
   await db.execute('UPDATE task_intervals SET ended_at=? WHERE staff_id=? AND ended_at IS NULL',[Date.now(),req.identity.staffId]);
  }else{
   const [allowed]:any=await db.execute("SELECT t.id FROM tasks t JOIN task_assignees a ON a.task_id=t.id JOIN project_members m ON m.project_id=t.project_id AND m.staff_id=a.staff_id WHERE t.id=? AND a.staff_id=? AND t.status='In Progress'",[data.taskId,req.identity.staffId]);
   if(!allowed.length){await db.rollback();return res.sendStatus(403);}
   if(running.length && running[0].task_id!==data.taskId){await db.rollback();return res.status(409).json({error:'Stop the current task timer first'});}
   if(!running.length) await db.execute('INSERT INTO task_intervals(id,staff_id,task_id,attendance_id,started_at) VALUES (?,?,?,?,?)',[randomUUID(),req.identity.staffId,data.taskId,open.id,Date.now()]);
  }
  await db.execute('UPDATE attendance_sessions SET last_contact=? WHERE id=?',[Date.now(),open.id]);
  await db.commit();res.json({ok:true});
 }catch(error){await db.rollback();throw error;}finally{db.release();}
});
attendanceRouter.post('/corrections',async(req,res)=>{
 if(req.identity.role!=='Superadmin' && !req.identity.correctAttendance) return res.sendStatus(403);
 const data=z.object({id:z.string().uuid(),kind:z.enum(['attendance','task']).default('attendance'),start:z.number().int().nonnegative(),end:z.number().int().nonnegative(),reason:z.string().trim().min(1).max(1000)}).strict().parse(req.body);
 if(data.end<data.start || data.end>Date.now()) return res.status(400).json({error:'Invalid interval'});
 const db=await pool.getConnection();
 const table=data.kind==='task'?'task_intervals':'attendance_sessions';
 try{
  await db.beginTransaction();
  const [target]:any=await db.execute('SELECT * FROM '+table+' WHERE id=?',[data.id]);
  if(!target.length || target[0].ended_at===null){await db.rollback();return res.status(409).json({error:'Choose a closed interval'});}
  const row=target[0];await lockStaff(db,row.staff_id);
  if(data.kind==='attendance') {
   const [children]:any=await db.execute('SELECT * FROM task_intervals WHERE attendance_id=?',[row.id]);
   for(const child of children) {
    const [changes]:any=await db.execute("SELECT corrected_start,corrected_end FROM time_corrections WHERE interval_type='task' AND interval_id=? ORDER BY created_at DESC,id DESC LIMIT 1",[child.id]);
    const start=Number(changes[0]?.corrected_start ?? child.started_at);
    const end=Number(changes[0]?.corrected_end ?? child.ended_at ?? Date.now());
    if(start<data.start || end>data.end){await db.rollback();return res.status(409).json({error:'Correct child task intervals before shortening attendance'});}
   }
  }
  if(data.kind==='task') {
   const [parents]:any=await db.execute('SELECT started_at,ended_at FROM attendance_sessions WHERE id=?',[row.attendance_id]);
   const [adjustments]:any=await db.execute("SELECT corrected_start,corrected_end FROM time_corrections WHERE interval_type='attendance' AND interval_id=? ORDER BY created_at DESC,id DESC LIMIT 1",[row.attendance_id]);
   const start=Number(adjustments[0]?.corrected_start ?? parents[0].started_at);
   const end=Number(adjustments[0]?.corrected_end ?? parents[0].ended_at ?? Date.now());
   if(data.start<start || data.end>end){await db.rollback();return res.status(409).json({error:'Task time must fit inside attendance'});}
  }
  const [all]:any=await db.execute('SELECT * FROM '+table+' WHERE staff_id=?',[row.staff_id]);
  const [history]:any=await db.execute('SELECT c.* FROM time_corrections c JOIN '+table+' s ON s.id=c.interval_id WHERE c.interval_type=? AND s.staff_id=? ORDER BY c.created_at,c.id',[data.kind,row.staff_id]);
  for(const session of all.filter((s:any)=>s.id!==row.id)){
   const previous=history.filter((c:any)=>c.interval_id===session.id).at(-1);
   if(overlaps({start:data.start,end:data.end},{start:Number(previous?.corrected_start ?? session.started_at),end:Number(previous?.corrected_end ?? session.ended_at ?? Date.now())})){
    await db.rollback();return res.status(409).json({error:'Correction overlaps another shift'});
   }
  }
  await db.execute('INSERT INTO time_corrections VALUES (?,?,?,?,?,?,?,?,?,?)',[randomUUID(),row.id,data.kind,req.identity.staffId,row.started_at,row.ended_at,data.start,data.end,data.reason,Date.now()]);
  await db.commit();res.json({ok:true});
 }catch(error){await db.rollback();throw error;}finally{db.release();}
});
