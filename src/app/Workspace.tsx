import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch } from './api';
import * as sample from '../fixtures/workspace';
import type { Company, Project, Task } from '../domain/models';
type Data = {companies:readonly Company[]; projects:readonly Project[]; tasks:readonly Task[]; staff:{id:string;name:string}[]; workTypes:{id:string;name:string}[];currentStaffId?:string};
type Workspace = Data & {reload:()=>Promise<void>; sampleMode:boolean; projectSnapshot:typeof sample.projectSnapshot};
const Context=createContext<Workspace|null>(null);
export function useWorkspace() { const value=useContext(Context); if(!value) throw new Error('Workspace missing'); return value; }
export function WorkspaceProvider({children}:{children:ReactNode}) {
 const sampleMode=import.meta.env.DEV && import.meta.env.VITE_DATA_SOURCE==='sample';
 const [data,setData]=useState<Data|null>(null);
 const [error,setError]=useState('');
 async function reload() {
  setError('');
  try {
   if(sampleMode) { setData({...sample,staff:[],workTypes:[]}); return; }
   const response=await apiFetch('/api/workspace');
   if(!response.ok) throw new Error('Database workspace unavailable. Start the API and run migrations and seed.');
   setData(await response.json());
  } catch(error) { setError(error instanceof Error?error.message:'Loading failed'); }
 }
 useEffect(()=>{void reload();},[]);
 if(!data) return <main className="workspace"><p role="status">{error || 'Loading workspace…'}</p>{error && <button onClick={()=>void reload()}>Retry</button>}</main>;
 function projectSnapshot(projectId:string) {
  const jobs=data!.tasks.filter(t=>t.projectId===projectId);
  const done=jobs.filter(t=>t.status==='Done').length;
  return {jobs,done,waiting:jobs.filter(t=>t.status==='Waiting for Client').length,overdue:jobs.filter(t=>t.status!=='Done' && t.deliveryDate<(sampleMode?sample.demoToday:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka'}).format(new Date()))).length,percent:jobs.length?Math.round(done/jobs.length*100):null};
 }
 return <Context.Provider value={{...data,reload,sampleMode,projectSnapshot}}>{error && <p role="alert">{error}</p>}{children}</Context.Provider>;
}
