import { useEffect,useState } from 'react';
import { apiFetch } from '../../app/api';
import { useWorkspace } from '../../app/Workspace';
import ElapsedTime from './ElapsedTime';
export default function AttendancePage() {
 const {tasks,staff,sampleMode}=useWorkspace();
 const [data,setData]=useState<any>(null);
 const [month,setMonth]=useState(new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',timeZone:'Asia/Dhaka'}).format(new Date()));
 const [staffId,setStaffId]=useState('');
 const [error,setError]=useState('');
 const [tick,setTick]=useState(0);
 const [received,setReceived]=useState(0);
 async function load(){
  if(sampleMode)return;
  try {
   const r=await apiFetch('/api/attendance?month='+month+'&staffId='+encodeURIComponent(staffId));
   if(!r.ok)throw new Error('Attendance unavailable or permission denied');
   setData(await r.json());setReceived(Date.now());setTick(0);setError('');
  }catch(e){setError(e instanceof Error?e.message:'Request failed');}
 }
 useEffect(()=>{setData(null);void load();},[month,staffId]);
 useEffect(()=>{const id=setInterval(()=>setTick(Math.floor((Date.now()-received)/1000)),1000);return()=>clearInterval(id);},[received]);
 async function timer(taskId:string|null){
  const r=await apiFetch('/api/attendance/timer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskId})});
  if(!r.ok){setError('Timer could not change. Choose your assigned In Progress task and stop any running timer first.');return;}
  await load();
 }
 async function correct(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  const form=new FormData(event.currentTarget);
  const body={id:form.get('id'),kind:form.get('kind'),start:Date.parse(String(form.get('start'))),end:Date.parse(String(form.get('end'))),reason:form.get('reason')};
  const response=await apiFetch('/api/attendance/corrections',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(response.ok)await load();else setError((await response.json()).error || 'Correction rejected');
 }
 return <section className="card editor"><h1>Attendance</h1>
 <label>Month<input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label>
 <label>Staff<select value={staffId} onChange={e=>setStaffId(e.target.value)}><option value="">My attendance</option>{staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
 <p role="status">{sampleMode?'Attendance requires a signed-in account.':error}</p>
 {data && <><p>Monthly total <ElapsedTime seconds={data.totalSeconds}/>{data.provisional?' Â· Provisional':''}</p>
 {data.open && <p>Current shift <ElapsedTime seconds={(data.serverNow-Number(data.open.started_at))/1000+Math.min(tick,60)}/></p>}
 <table className="task-table"><thead><tr><th>Date</th><th>Working time</th></tr></thead><tbody>{Object.entries(data.days).map(([date,seconds])=><tr key={date}><td>{date}</td><td><ElapsedTime seconds={Number(seconds)}/></td></tr>)}</tbody></table>
 <button onClick={()=>void load()}>Refresh totals</button>
 <h2>Task timer</h2><select aria-label="Start task timer" defaultValue="" onChange={e=>{if(e.target.value)void timer(e.target.value);}}><option value="">Choose a task</option>{tasks.filter(t=>t.status==='In Progress').map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select><button onClick={()=>void timer(null)}>Stop timer</button>
 {data.canCorrect && <form onSubmit={correct}>
 <h2>Correct a closed interval</h2>
 <label>Type<select name="kind"><option value="attendance">Attendance</option><option value="task">Task time</option></select></label>
 <label>Interval<select name="id">{[...data.sessions,...data.timers].filter((item:any)=>item.ended_at!==null).map((item:any)=><option key={item.id} value={item.id}>{item.task_id || 'Attendance'} — {new Date(Number(item.started_at)).toISOString()} — {item.id}</option>)}</select></label>
 <label>Start in ISO format with timezone<input name="start" placeholder="2026-11-24T13:00:00+06:00" required/></label>
 <label>End in ISO format with timezone<input name="end" placeholder="2026-11-24T19:00:00+06:00" required/></label>
 <label>Reason<input name="reason" required maxLength={1000}/></label><button>Save correction</button>
 </form>}
 <p>{data.timers.some((t:any)=>t.ended_at===null)?'Task timer running':'Task timer stopped'}</p></>}
 </section>;
}
