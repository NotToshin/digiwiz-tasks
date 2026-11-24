import test from 'node:test';
import assert from 'node:assert/strict';
import { closeDue, dailySeconds, overlaps } from './attendance-time.ts';
import { hashPassword, verifyPassword } from './credentials.ts';
import express from 'express';
import { createRequire } from 'node:module';
import { installBoundary } from './security.ts';
import { readWorkspace } from './data.ts';
import { calendarStatuses } from './schedule.ts';

test('schedule distinguishes elapsed absence, future workdays, holidays and employment start',()=>{
 const statuses=calendarStatuses('2026-11','2026-11-24','2026-11-20',[0,1,2,3,4,6],['2026-11-22'],{});
 assert.equal(statuses['2026-11-19'],undefined);
 assert.equal(statuses['2026-11-20'],'Off');
 assert.equal(statuses['2026-11-22'],'Holiday');
 assert.equal(statuses['2026-11-23'],'Leave');
 assert.equal(statuses['2026-11-25'],undefined);
});

test('untrusted peers cannot set the client IP using forwarding headers',()=>{
 const lookup=createRequire(import.meta.url)('proxy-addr');
 const app=express();
 const original=process.env.TRUSTED_PROXY_CIDRS;
 try {
  process.env.TRUSTED_PROXY_CIDRS='127.0.0.1/32';
  installBoundary(app);
  const request={socket:{remoteAddress:'203.0.113.9'},headers:{'x-forwarded-for':'127.0.0.1'}};
  assert.equal(lookup(request,app.get('trust proxy fn')),'203.0.113.9');
  const trusted={socket:{remoteAddress:'127.0.0.1'},headers:{'x-forwarded-for':'203.0.113.9'}};
  assert.equal(lookup(trusted,app.get('trust proxy fn')),'203.0.113.9');
 } finally {if(original===undefined)delete process.env.TRUSTED_PROXY_CIDRS;else process.env.TRUSTED_PROXY_CIDRS=original;}
});
test('scoped workspace excludes other companies, projects, tasks and staff',async()=>{
 const results=[
  [{id:'c1'},{id:'c2'}],
  [{id:'p1',companyId:'c1'},{id:'p2',companyId:'c2'}],
  [{id:'t1',projectId:'p1'},{id:'t2',projectId:'p2'}],
  [{task_id:'t1',staff_id:'s1'},{task_id:'t2',staff_id:'s2'}],
  [{id:'s1'},{id:'s2'}],[],
  [{project_id:'p1',staff_id:'s1'},{project_id:'p2',staff_id:'s2'}]
 ];
 const db={query:async()=>[results.shift()],execute:async()=>[[{project_id:'p1'}]]};
 const data=await readWorkspace(db as any,{staffId:'s1',role:'Staff'});
 assert.deepEqual(data.companies.map((c:any)=>c.id),['c1']);
 assert.deepEqual(data.projects.map((p:any)=>p.id),['p1']);
 assert.deepEqual(data.tasks.map((t:any)=>t.id),['t1']);
 assert.deepEqual(data.staff.map((s:any)=>s.id),['s1']);
});

test('forgotten logout closes at last contact exactly after ten minutes',()=>{
 assert.equal(closeDue(0,60000,659999),null);
 assert.deepEqual(closeDue(0,60000,660000),{end:60000,reason:'Heartbeat lost'});
});
test('maximum shift closes even with a recent heartbeat',()=>{
 assert.equal(closeDue(0,43200000,43200000)?.end,43200000);
});
test('Dhaka midnight splits a month-end interval',()=>{
 const start=Date.parse('2026-11-30T17:30:00Z');
 const end=Date.parse('2026-11-30T18:30:00Z');
 assert.deepEqual(dailySeconds([{start,end}]),{'2026-11-30':1800,'2026-12-01':1800});
});
test('separate shifts sum, touching intervals do not overlap',()=>{
 assert.deepEqual(dailySeconds([{start:0,end:1000},{start:2000,end:4000}]),{'1970-01-01':3});
 assert.equal(overlaps({start:0,end:1000},{start:1000,end:2000}),false);
 assert.equal(overlaps({start:0,end:1001},{start:1000,end:2000}),true);
 assert.throws(()=>dailySeconds([{start:1000,end:0}]));
});
test('password hashes use independent salts and reject the wrong password',async()=>{
 const first=await hashPassword('fictional-test-password');
 const second=await hashPassword('fictional-test-password');
 assert.notEqual(first,second);
 assert.equal(await verifyPassword('fictional-test-password',first),true);
 assert.equal(await verifyPassword('wrong',first),false);
});
