let csrf='';
export function setCsrf(value:string) {csrf=value;}
export async function apiFetch(path:string,options:RequestInit={}) {
 const headers=new Headers(options.headers);
 if(options.method && !['GET','HEAD'].includes(options.method)) headers.set('x-csrf-token',csrf);
 const response=await fetch(path,{...options,headers});
 if(response.status===401) window.dispatchEvent(new Event('session-expired'));
 return response;
}
