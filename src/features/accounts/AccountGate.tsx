import { useEffect,useState,type ReactNode } from 'react';
import { apiFetch,setCsrf } from '../../app/api';
export default function AccountGate({children}:{children:ReactNode}) {
 const sample=import.meta.env.DEV && import.meta.env.VITE_DATA_SOURCE==='sample';
 const [account,setAccount]=useState<any>(null);
 const [loading,setLoading]=useState(!sample);
 const [mode,setMode]=useState('login');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 async function refresh() {
  try {const response=await fetch('/api/me');if(response.ok){const user=await response.json();setCsrf(user.csrf);setAccount(user);}else setAccount(null);}
  catch {setMessage('Cannot reach the API. Check the server and office network configuration.');}
  finally {setLoading(false);}
 }
 useEffect(()=>{
  if(sample)return;
  void refresh();
  const expired=()=>{setAccount(null);setCsrf('');};
  window.addEventListener('session-expired',expired);
  return ()=>window.removeEventListener('session-expired',expired);
 },[]);
 useEffect(()=>{
  if(!account)return;
  const timer=setInterval(()=>{void apiFetch('/api/attendance/heartbeat',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});},60000);
  return ()=>clearInterval(timer);
 },[account]);
 async function submit(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault();setBusy(true);setMessage('');
  const body=Object.fromEntries(new FormData(event.currentTarget));
  const action=(event.nativeEvent as SubmitEvent).submitter?.getAttribute('value');
  let path='/api/auth/login';
  if(account) path='/api/me';
  else if(mode!=='login') {body.purpose=mode;path=action==='code'?'/api/auth/challenge':'/api/auth/complete';if(action==='code'){delete body.password;delete body.code;}}
  try {
   const response=await apiFetch(path,{method:account?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const result=await response.json();
   if(!response.ok) throw new Error(result.error);
   if(path.endsWith('login') || account) await refresh();
   else setMessage(result.message);
  } catch(error){setMessage(error instanceof Error?error.message:'Request failed');}
  finally{setBusy(false);}
 }
 if(sample)return children;
 if(loading)return <main className="workspace">Checking account…</main>;
 if(account?.onboarded)return <><div className="account-bar"><span>{account.displayName}</span><button onClick={async()=>{const r=await apiFetch('/api/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(r.ok){setAccount(null);setCsrf('');}}}>Log out and end shift</button></div>{children}</>;
 return <main className="workspace"><section className="card editor"><h1>{account?'Complete your profile':'Digiwiz staff access'}</h1>
 {!account && <select aria-label="Account action" value={mode} onChange={e=>{setMode(e.target.value);setMessage('');}}><option value="login">Sign in</option><option value="register">Accept invitation</option><option value="reset">Reset password</option></select>}
 <form key={mode} onSubmit={submit}>
 {account?<><label>Full name<input name="fullName" required maxLength={160}/></label><label>Display name<input name="displayName" required maxLength={160}/></label></>:<><label>Email<input name="email" type="email" required maxLength={254}/></label><label>Password<input name="password" type="password" required minLength={12} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'}/></label>{mode!=='login' && <><label>Email code<input name="code" inputMode="numeric" maxLength={6}/></label><button type="submit" value="code" formNoValidate disabled={busy}>Send test email code</button></>}</>}
 <button disabled={busy} type="submit">{busy?'Please wait…':account?'Save profile':mode==='login'?'Sign in':'Verify code and save password'}</button><p role="status">{message}</p>
 </form></section></main>;
}
