import { Router } from 'express';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { sendMail, otpEmail } from './mailer.ts';
import { pool } from './db.ts';
import { digest, hashPassword, verifyPassword } from './credentials.ts';
import { startAttendance, closeAttendance, lockStaff, reconcileStaff } from './attendance-service.ts';
import { requireAccount, requireAdmin } from './security.ts';
export const accounts=Router();
const email=z.email().max(254).transform(s=>s.toLowerCase());
const password=z.string().min(12).max(128);
const challenge=z.object({email,purpose:z.enum(['register','reset'])}).strict();
const complete=challenge.extend({code:z.string().regex(/^\d{6}$/),password});
const invalid=()=>Object.assign(new Error('Invalid or expired credentials'),{status:400});

accounts.use('/auth',async(req,res,next)=>{
 const bucket=digest((req.ip || '')+':'+req.path);
 const db=await pool.getConnection();
 try {
  await db.beginTransaction();
  await db.execute('INSERT IGNORE INTO auth_attempts VALUES (?,?,0)',[bucket,Date.now()]);
  const [rows]:any=await db.execute('SELECT * FROM auth_attempts WHERE bucket=? FOR UPDATE',[bucket]);
  const reset=Number(rows[0].started_at)<Date.now()-900000;
  const count=reset?1:rows[0].attempts+1;
  await db.execute('UPDATE auth_attempts SET started_at=?,attempts=? WHERE bucket=?',[reset?Date.now():rows[0].started_at,count,bucket]);
  await db.commit();
  if(count>30) return res.status(429).json({error:'Too many attempts. Retry in 15 minutes.'});
  next();
 } catch(error) {await db.rollback();next(error);} finally {db.release();}
});
accounts.post('/auth/challenge',async(req,res)=>{
 const data=challenge.parse(req.body);
 const code=String(randomInt(100000,1000000));
 const db=await pool.getConnection();
 try {
  await db.beginTransaction();
  const [eligible]:any=await db.execute(data.purpose==='register'
   ?'SELECT email FROM invites WHERE email=? AND consumed=0 AND expires_at>? FOR UPDATE'
   :'SELECT email FROM accounts a JOIN staff s ON s.id=a.staff_id WHERE email=? AND s.active=1 FOR UPDATE',
   data.purpose==='register'?[data.email,Date.now()]:[data.email]);
  if(eligible.length) {
   const [recent]:any=await db.execute('SELECT expires_at FROM auth_challenges WHERE email=? AND purpose=?',[data.email,data.purpose]);
   if(!recent.length || Number(recent[0].expires_at)<Date.now()+540000) {
    await db.execute('INSERT INTO auth_challenges VALUES (?,?,?,?,0) ON DUPLICATE KEY UPDATE digest=VALUES(digest),expires_at=VALUES(expires_at),attempts=0',[data.email,data.purpose,digest(data.email+':'+data.purpose+':'+code),Date.now()+600000]);
    const mail={...otpEmail(data.purpose,code),to:data.email};
    await sendMail(mail);
   }
  }
  const delivery=process.env.SMTP_HOST?'If eligible, a code has been sent to your email.':'If eligible, a code has been delivered to the local test inbox.';
  await db.commit();res.json({message:delivery});
 } catch(error){await db.rollback();throw error;}finally{db.release();}
});
accounts.post('/auth/complete',async(req,res)=>{
 const data=complete.parse(req.body);
 const hash=await hashPassword(data.password);
 const db=await pool.getConnection();
 try {
  await db.beginTransaction();
  const [codes]:any=await db.execute('SELECT * FROM auth_challenges WHERE email=? AND purpose=? FOR UPDATE',[data.email,data.purpose]);
  const code=codes[0];
  if(!code || Number(code.expires_at)<=Date.now() || code.attempts>=5) throw invalid();
  if(code.digest!==digest(data.email+':'+data.purpose+':'+data.code)) {
   await db.execute('UPDATE auth_challenges SET attempts=attempts+1 WHERE email=? AND purpose=?',[data.email,data.purpose]);
   await db.commit();throw invalid();
  }
  if(data.purpose==='register') {
   const [invites]:any=await db.execute('SELECT i.* FROM invites i JOIN staff s ON s.id=i.staff_id WHERE i.email=? AND i.consumed=0 AND i.expires_at>? AND s.active=1 FOR UPDATE',[data.email,Date.now()]);
   if(!invites.length) throw invalid();
   const invite=invites[0];
   await db.execute('INSERT INTO accounts(staff_id,email,password_hash,role,employment_start) VALUES (?,?,?,?,?)',[invite.staff_id,data.email,hash,invite.role,new Date().toISOString().slice(0,10)]);
   await db.execute('UPDATE invites SET consumed=1 WHERE email=?',[data.email]);
  } else {
   const [rows]:any=await db.execute('SELECT a.staff_id FROM accounts a JOIN staff s ON s.id=a.staff_id WHERE email=? AND s.active=1 FOR UPDATE',[data.email]);
   if(!rows.length) throw invalid();
   await lockStaff(db,rows[0].staff_id);
   await reconcileStaff(db,rows[0].staff_id);
   await db.execute('UPDATE accounts SET password_hash=? WHERE email=?',[hash,data.email]);
   await closeAttendance(db,rows[0].staff_id,Date.now(),true,'Password reset');
   await db.execute('DELETE FROM auth_sessions WHERE staff_id=?',[rows[0].staff_id]);
  }
  await db.execute('DELETE FROM auth_challenges WHERE email=? AND purpose=?',[data.email,data.purpose]);
  await db.commit();res.json({message:'Password saved. Sign in to begin attendance.'});
 }catch(error){await db.rollback();throw error;}finally{db.release();}
});
accounts.post('/auth/login',async(req,res)=>{
 const data=z.object({email,password:z.string().max(128)}).strict().parse(req.body);
 const db=await pool.getConnection();
 try {
  await db.beginTransaction();
  const [rows]:any=await db.execute('SELECT a.* FROM accounts a JOIN staff s ON s.id=a.staff_id WHERE email=? AND s.active=1 FOR UPDATE',[data.email]);
  if(!rows.length || !await verifyPassword(data.password,rows[0].password_hash)) throw invalid();
  const user=rows[0];
  await startAttendance(db,user.staff_id);
  const token=randomBytes(32).toString('hex');
  const csrf=randomBytes(32).toString('hex');
  await db.execute('INSERT INTO auth_sessions VALUES (?,?,?,?)',[digest(token),user.staff_id,csrf,Date.now()+12*3600000]);
  await db.commit();
  res.cookie('dw_session',token,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',maxAge:12*3600000,path:'/'});
  res.json({csrf});
 }catch(error){await db.rollback();throw error;}finally{db.release();}
});
accounts.use(requireAccount);
accounts.get('/me',(req,res)=>res.json(req.identity));
accounts.put('/me',async(req,res)=>{
 const data=z.object({fullName:z.string().trim().min(1).max(160),displayName:z.string().trim().min(1).max(160)}).strict().parse(req.body);
 const db=await pool.getConnection();
 try{
  await db.beginTransaction();
  await db.execute('UPDATE accounts SET full_name=?,onboarded=1 WHERE staff_id=?',[data.fullName,req.identity.staffId]);
  await db.execute('UPDATE staff SET display_name=? WHERE id=?',[data.displayName,req.identity.staffId]);
  await db.commit();res.json({ok:true});
 }catch(error){await db.rollback();throw error;}finally{db.release();}
});
accounts.post('/logout',async(req,res)=>{
 const db=await pool.getConnection();
 try{
  await db.beginTransaction();await lockStaff(db,req.identity.staffId);
  await closeAttendance(db,req.identity.staffId,Date.now());
  await db.execute('DELETE FROM auth_sessions WHERE staff_id=?',[req.identity.staffId]);
  await db.commit();res.clearCookie('dw_session',{path:'/'});res.json({ok:true});
 }catch(error){await db.rollback();throw error;}finally{db.release();}
});
accounts.post('/admin/invites',requireAdmin,async(req,res)=>{
 const data=z.object({email,staffId:z.string().min(1).max(64),role:z.enum(['Staff','Lead','Superadmin'])}).strict().parse(req.body);
 await pool.execute('INSERT INTO invites(email,staff_id,role,expires_at) VALUES (?,?,?,?)',[data.email,data.staffId,data.role,Date.now()+7*86400000]);
 res.status(201).json({ok:true});
});

accounts.get('/admin/staff',requireAdmin,async(_req,res)=>{
 const [rows]=await pool.query('SELECT s.id,s.display_name,s.active,a.email,a.role,a.can_correct_attendance,a.can_view_attendance FROM staff s LEFT JOIN accounts a ON a.staff_id=s.id');
 res.json(rows);
});
accounts.put('/admin/schedule',requireAdmin,async(req,res)=>{
 const data=z.object({weekdays:z.array(z.number().int().min(0).max(6)).min(1).max(7),holidays:z.array(z.object({day:z.iso.date(),name:z.string().min(1).max(160)})).max(366)}).strict().parse(req.body);
 const db=await pool.getConnection();
 try {
  await db.beginTransaction();
  await db.execute('UPDATE work_schedule SET weekdays=? WHERE id=1',[JSON.stringify([...new Set(data.weekdays)])]);
  await db.query('DELETE FROM holidays');
  for(const holiday of data.holidays) await db.execute('INSERT INTO holidays VALUES (?,?)',[holiday.day,holiday.name]);
  await db.execute('INSERT INTO change_history(entity_type,entity_id,actor_id,before_json,after_json) VALUES (?,?,?,?,?)',['schedule','1',req.identity.staffId,null,JSON.stringify(data)]);
  await db.commit();res.json({ok:true});
 }catch(error){await db.rollback();throw error;}finally{db.release();}
});
accounts.put('/admin/staff/:id',requireAdmin,async(req,res)=>{
 const data=z.object({active:z.boolean(),role:z.enum(['Staff','Lead','Superadmin']),viewAttendance:z.boolean(),correctAttendance:z.boolean()}).strict().parse(req.body);
 const db=await pool.getConnection();
 try {
  await db.beginTransaction();
  const [administrators]:any=await db.query("SELECT a.staff_id FROM accounts a JOIN staff s ON s.id=a.staff_id WHERE a.role='Superadmin' AND s.active=1 ORDER BY a.staff_id FOR UPDATE");
  const id=String(req.params.id);
  if(administrators.length===1 && administrators[0].staff_id===id && (!data.active || data.role!=='Superadmin')) {
   await db.rollback();return res.status(409).json({error:'Keep one active Superadmin'});
  }
  await lockStaff(db,id);
  const [previous]:any=await db.execute('SELECT s.active,a.role,a.can_view_attendance,a.can_correct_attendance FROM accounts a JOIN staff s ON s.id=a.staff_id WHERE a.staff_id=?',[id]);
  if(!previous.length){await db.rollback();return res.sendStatus(404);}
  await db.execute('UPDATE staff SET active=? WHERE id=?',[data.active,id]);
  await db.execute('UPDATE accounts SET role=?,can_view_attendance=?,can_correct_attendance=? WHERE staff_id=?',[data.role,data.viewAttendance,data.correctAttendance,id]);
  if(!data.active){
   await db.execute('UPDATE accounts SET employment_end=? WHERE staff_id=?',[new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka'}).format(new Date()),id]);
   await reconcileStaff(db,id);
   await closeAttendance(db,id,Date.now(),true,'Account deactivated');
   await db.execute('DELETE FROM auth_sessions WHERE staff_id=?',[id]);
  }
  else await db.execute('UPDATE accounts SET employment_end=NULL WHERE staff_id=?',[id]);
  await db.execute('INSERT INTO change_history(entity_type,entity_id,actor_id,before_json,after_json) VALUES (?,?,?,?,?)',['account',id,req.identity.staffId,JSON.stringify(previous[0]),JSON.stringify(data)]);
  await db.commit();res.json({ok:true});
 }catch(error){await db.rollback();throw error;}finally{db.release();}
});
