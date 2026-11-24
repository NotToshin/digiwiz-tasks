import { useEffect, useState } from 'react';
import { apiFetch } from '../../app/api';
export default function AdminPage() {
 const [staff,setStaff]=useState<any[]>([]);
 const [message,setMessage]=useState('');
 useEffect(()=>{void apiFetch('/api/admin/staff').then(async r=>{if(r.ok)setStaff(await r.json());else setMessage('Administrator permission required.');});},[]);
 async function invite(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setMessage('');
  const body=Object.fromEntries(new FormData(event.currentTarget));
  const r=await apiFetch('/api/admin/invites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  setMessage(r.ok?'Invitation created. The recipient can request a test email code.':'Could not create invitation. Check the address and existing invitations.');
 }
 async function update(person:any){
  const r=await apiFetch('/api/admin/staff/'+encodeURIComponent(person.id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:!!person.active,role:person.role,viewAttendance:!!person.can_view_attendance,correctAttendance:!!person.can_correct_attendance})});
  setMessage(r.ok?'Account updated.':'Account update rejected. Keep one active Superadmin.');
 }
 function edit(id:string,key:string,value:unknown){setStaff(staff.map(p=>p.id===id?{...p,[key]:value}:p));}
 return <section className="card editor"><h1>Staff access</h1><p role="status">{message}</p>
 <form onSubmit={invite}><label>Staff<select name="staffId" required>{staff.filter(p=>!p.email).map(p=><option key={p.id} value={p.id}>{p.display_name}</option>)}</select></label><label>Email<input name="email" type="email" required/></label><label>Role<select name="role"><option>Staff</option><option>Lead</option><option>Superadmin</option></select></label><button>Create invitation</button></form>
 {staff.filter(p=>p.email).map(person=><fieldset key={person.id}><legend>{person.display_name}</legend>
 <label>Role<select value={person.role} onChange={e=>edit(person.id,'role',e.target.value)}><option>Staff</option><option>Lead</option><option>Superadmin</option></select></label>
 <label><input type="checkbox" checked={!!person.active} onChange={e=>edit(person.id,'active',e.target.checked)}/>Active</label>
 <label><input type="checkbox" checked={!!person.can_view_attendance} onChange={e=>edit(person.id,'can_view_attendance',e.target.checked)}/>View team attendance</label>
 <label><input type="checkbox" checked={!!person.can_correct_attendance} onChange={e=>edit(person.id,'can_correct_attendance',e.target.checked)}/>Correct attendance</label>
 <button onClick={()=>void update(person)}>Save account</button></fieldset>)}
 </section>;
}
