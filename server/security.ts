import type { Express, Request, Response, NextFunction } from 'express';
import { createRequire } from 'node:module';
import { pool } from './db.ts';
import { digest } from './credentials.ts';
import { reconcileStaff } from './attendance-service.ts';
import type { PoolConnection } from 'mysql2/promise';
const require=createRequire(import.meta.url);
const proxyaddr=require('proxy-addr') as {compile:(ranges:string[]) => (ip:string)=>boolean};
export function installBoundary(app:Express) {
 const networks=(process.env.OFFICE_ALLOWED_CIDRS || '').split(',').map(s=>s.trim()).filter(Boolean);
 const proxies=(process.env.TRUSTED_PROXY_CIDRS || '').split(',').map(s=>s.trim()).filter(Boolean);
 const allowed=networks.length?proxyaddr.compile(networks):()=>false;
 app.set('trust proxy',proxies.length?proxyaddr.compile(proxies):false);
 app.use((req,res,next)=>{
  if(!req.ip || !allowed(req.ip)) return res.status(403).json({error:'Office network required'});
  if(!['GET','HEAD','OPTIONS'].includes(req.method) && req.get('origin')!==process.env.APP_ORIGIN) return res.status(403).json({error:'Invalid request origin'});
  next();
 });
}
export interface Identity {staffId:string; role:'Superadmin'|'Lead'|'Staff'; csrf:string; displayName:string; onboarded:boolean; correctAttendance:boolean; viewAttendance:boolean}
declare global { namespace Express { interface Request { identity:Identity } } }
export async function requireAccount(req:Request,res:Response,next:NextFunction) {
 const token=(req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('dw_session='))?.slice(11);
 if(!token) return res.status(401).json({error:'Sign in required'});
 const db=await pool.getConnection();
 try {
  await db.beginTransaction();
  const [rows]:any=await db.execute('SELECT a.*,s.display_name,se.csrf FROM auth_sessions se JOIN accounts a ON a.staff_id=se.staff_id JOIN staff s ON s.id=a.staff_id WHERE se.digest=? AND se.expires_at>? AND s.active=1',[digest(token),Date.now()]);
  const account=rows[0];
  if(!account) {await db.rollback();return res.status(401).json({error:'Sign in required'});}
  const open=await reconcileStaff(db,account.staff_id);
  if(!open) {await db.commit();return res.status(401).json({error:'Attendance closed. Sign in again.'});}
  req.identity={staffId:account.staff_id,role:account.role,csrf:account.csrf,displayName:account.display_name,onboarded:!!account.onboarded,correctAttendance:!!account.can_correct_attendance,viewAttendance:!!account.can_view_attendance};
  await db.commit();
  if(!['GET','HEAD'].includes(req.method) && req.get('x-csrf-token')!==account.csrf) return res.status(403).json({error:'Invalid request token'});
  next();
 } catch(error) {await db.rollback();next(error);}
 finally {db.release();}
}
export function requireAdmin(req:Request,res:Response,next:NextFunction) {
 if(req.identity.role!=='Superadmin') return res.status(403).json({error:'Administrator permission required'});
 next();
}
export async function canAccessProject(db:PoolConnection,staffId:string,role:string,projectId:string) {
 if(role==='Superadmin') return true;
 const [rows]:any=await db.execute('SELECT project_id FROM project_members WHERE project_id=? AND staff_id=?',[projectId,staffId]);
 return rows.length>0;
}
