import { apiFetch } from '../../app/api';
import { useState } from 'react';
import { useWorkspace } from '../../app/Workspace';
import { PageHeader, StatusBadge } from '../../app/ui';
import { taskStatuses } from '../../domain/models';
import { useTaskDrawer } from './useTaskDrawer';
type Entity='companies'|'projects'|'tasks';
export default function ManagePage() {
 const workspace=useWorkspace();
 const {openTask}=useTaskDrawer();
 const [entity,setEntity]=useState<Entity>('tasks');
 const [id,setId]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [project,setProject]=useState('');
 const record=workspace[entity].find(row=>row.id===id) as any;
 async function save(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); setBusy(true); setError('');
  const form=new FormData(event.currentTarget);
  const body:any=Object.fromEntries(form);
  if(entity==='tasks') { body.assignees=form.getAll('assignees'); body.requiresReview=form.has('requiresReview'); body.prerequisiteId=body.prerequisiteId || null; if(!body.followUpId)delete body.followUpId; if(record) body.version=record.version; }
  try {
   const response=await apiFetch('/api/'+entity+(id?'/'+id:''),{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(!response.ok) throw new Error((await response.json()).error);
   await workspace.reload(); setId(''); setError('Saved.');
  } catch(error) {setError(error instanceof Error?error.message:'Save failed');}
  finally {setBusy(false);}
 }
 const field=(name:string,label:string,type='text')=><label>{label}<input name={name} type={type} defaultValue={record?.[name] || ''} required={!['notes','details','description','summary'].includes(name)} /></label>;
 const select=(name:string,label:string,items:{id:string;name:string}[])=><label>{label}<select name={name} defaultValue={record?.[name] || items[0]?.id}>{items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>;
 return <>
 <PageHeader title="Manage work" description="Local fictional workspace" />
 {workspace.sampleMode ? <p>Sample preview is read-only. Start the API to manage work.</p> : <section className="card editor">
 <label>Record type<select value={entity} onChange={e=>{setEntity(e.target.value as Entity);setId('');setError('');}}>{(['companies','projects','tasks'] as const).map(type=><option key={type}>{type}</option>)}</select></label>
 <label>Edit record<select value={id} onChange={e=>{setId(e.target.value);setError('');}}><option value="">Create new</option>{workspace[entity].map((row:any)=><option value={row.id} key={row.id}>{row.name || row.title}</option>)}</select></label>
 <form key={entity+id} onSubmit={save}>
 {entity==='companies' && <>{field('name','Company name')}{field('initials','Initials')}{select('kind','Kind',[{id:'Client',name:'Client'},{id:'Internal',name:'Internal'}])}{field('description','Description')}</>}
 {entity==='projects' && <>{select('companyId','Company',[...workspace.companies])}{field('name','Project name')}{select('lead','Lead',workspace.staff)}{field('targetDate','Target date','date')}{field('summary','Summary')}</>}
 {entity==='tasks' && <>{select('projectId','Project',[...workspace.projects])}{field('title','Title')}{select('workType','Work type',workspace.workTypes)}{field('deliveryDate','Delivery date','date')}{select('status','Status',taskStatuses.map(status=>({id:status,name:status})))}{field('details','Details')}{field('notes','Notes')}<fieldset><legend>Assignees</legend>{workspace.staff.map(person=><label key={person.id}><input type="checkbox" name="assignees" value={person.id} defaultChecked={record?.assignees.includes(person.id)} />{person.name}</label>)}</fieldset></>}
 <button className="button primary" disabled={busy}>{busy?'Saving…':'Save '+entity}</button>
 {entity==='tasks' && <><label>Priority<select name="priority" defaultValue={record?.priority || 'Normal'}>{['Low','Normal','High','Urgent'].map(priority=><option key={priority}>{priority}</option>)}</select></label><label>Prerequisite<select name="prerequisiteId" defaultValue={record?.prerequisiteId || ''}><option value="">None</option>{workspace.tasks.filter(t=>t.id!==id).map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label><label><input type="checkbox" name="requiresReview" defaultChecked={!!record?.requiresReview}/>Requires review</label><label>Review feedback<input name="reviewFeedback" /></label>{!id && <label>Follow-up to<select name="followUpId"><option value="">None</option>{workspace.tasks.filter(t=>t.status==='Done').map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label>}</>}
 <p role="status">{error}</p>
 </form></section>}
 <section className="company-section"><PageHeader title="Board" />
 <label>Project<select value={project} onChange={e=>setProject(e.target.value)}><option value="">All projects</option>{workspace.projects.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
 <div className="board">{taskStatuses.map(status=><section className="card board-column" key={status}><h2>{status}</h2>{workspace.tasks.filter(t=>t.status===status && (!project || t.projectId===project)).map(t=><button key={t.id} className="card board-task" onClick={()=>openTask(t.id)}><strong>{t.title}</strong><span>{t.assignees.join(', ')}</span><StatusBadge status={t.status}/></button>)}</section>)}</div></section>
 </>;
}
