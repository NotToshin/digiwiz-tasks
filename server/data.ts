import type { PoolConnection } from 'mysql2/promise';
export async function readWorkspace(db: PoolConnection, identity?: {staffId:string;role:string}) {
 let [companies]: any = await db.query('SELECT * FROM companies ORDER BY name');
 let [projects]: any = await db.query('SELECT id,company_id AS companyId,name,lead_id AS lead,target_date AS targetDate,summary FROM projects ORDER BY name');
 let [tasks]: any = await db.query('SELECT id,project_id AS projectId,title,work_type_id AS workType,assigned_on AS assignedOn,delivery_date AS deliveryDate,status,details,notes,prerequisite_id AS prerequisiteId,version,requires_review AS requiresReview,priority,follow_up_id AS followUpId,review_feedback AS reviewFeedback FROM tasks ORDER BY delivery_date,id');
 const [assignments]: any = await db.query('SELECT task_id,staff_id FROM task_assignees ORDER BY staff_id');
 let [staff]: any = await db.query('SELECT id,display_name AS name FROM staff WHERE active=1');
 const [workTypes]: any = await db.query('SELECT id,name FROM work_types ORDER BY name');
 const assigneesByTask = new Map<string, string[]>();
 for (const assignment of assignments) {
  const assignees = assigneesByTask.get(assignment.task_id) || [];
  assignees.push(assignment.staff_id);
  assigneesByTask.set(assignment.task_id, assignees);
 }
 for (const task of tasks) task.assignees = assigneesByTask.get(task.id) || [];
 if(identity && identity.role!=='Superadmin') {
  const [memberships]:any=await db.execute('SELECT project_id FROM project_members WHERE staff_id=?',[identity.staffId]);
  const allowed=memberships.map((m:any)=>m.project_id);
  projects=projects.filter((p:any)=>allowed.includes(p.id));
  tasks=tasks.filter((t:any)=>allowed.includes(t.projectId));
  companies=companies.filter((c:any)=>projects.some((p:any)=>p.companyId===c.id));
  const [members]:any=await db.query('SELECT project_id,staff_id FROM project_members');
  staff=staff.filter((s:any)=>s.id===identity.staffId || members.some((m:any)=>allowed.includes(m.project_id) && m.staff_id===s.id));
 }
 return { companies,projects,tasks,staff,workTypes,currentStaffId:identity?.staffId };
}
