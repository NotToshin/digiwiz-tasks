import type { AttendanceDay, Company, DateKey, Project, Task } from '../domain/models';

// Keep the local walkthrough reproducible, including its due-today view.
export const demoToday: DateKey = '2026-11-29';
export const demoStaff = 'Toshin';

export const companies: readonly Company[] = [
  { id: 'example-retail', name: 'Example Retail', initials: 'ER', kind: 'Client', description: 'A fictional retail brand preparing a new website and launch campaign.' },
  { id: 'digiwiz', name: 'DIGIWIZ', initials: 'DW', kind: 'Internal', description: 'Studio marketing and internal production work.' },
  { id: 'northline-studio', name: 'Northline Studio', initials: 'NS', kind: 'Client', description: 'A fictional interiors studio with a new brand identity in production.' },
];

export const projects: readonly Project[] = [
  { id: 'website-launch', companyId: 'example-retail', name: 'Website Launch', lead: 'Example Lead', targetDate: '2026-11-29', summary: 'Design and develop the new retail homepage.' },
  { id: 'launch-campaign', companyId: 'example-retail', name: 'Launch Campaign', lead: 'Example Lead', targetDate: '2026-12-02', summary: 'Prepare launch messaging and social creative.' },
  { id: 'internal-marketing', companyId: 'digiwiz', name: 'Internal Marketing', lead: 'Example Producer', targetDate: '2026-12-04', summary: 'Update the studio showreel and portfolio.' },
  { id: 'brand-refresh', companyId: 'northline-studio', name: 'Brand Refresh', lead: 'Example Producer', targetDate: '2026-12-07', summary: 'Develop a visual identity for the studio.' },
];

export const tasks: readonly Task[] = [
  { id: 'design-homepage', projectId: 'website-launch', title: 'Design homepage', workType: 'UI/UX', assignees: ['Rian'], assignedOn: '2026-11-23', status: 'In Review', deliveryDate: '2026-11-26', details: 'Prepare the desktop design for the new retail homepage.', notes: 'Lead review requested.' },
  { id: 'develop-homepage', projectId: 'website-launch', title: 'Develop homepage', workType: 'Website Development', assignees: ['Toshin'], assignedOn: '2026-11-23', status: 'To Do', deliveryDate: '2026-11-29', details: 'Build the approved homepage design.', notes: 'Check responsive layouts after the handoff.', prerequisiteId: 'design-homepage' },
  { id: 'design-handoff', projectId: 'website-launch', title: 'Design handoff', workType: 'Website Design', assignees: ['Rian', 'Toshin'], assignedOn: '2026-11-23', status: 'In Progress', deliveryDate: '2026-11-28', details: 'Review components together and agree on implementation details.', notes: 'Check responsive layout.' },
  { id: 'write-launch-caption', projectId: 'launch-campaign', title: 'Write launch caption', workType: 'Content Writing', assignees: ['Example Writer'], assignedOn: '2026-11-24', status: 'Waiting for Client', deliveryDate: '2026-11-29', details: 'Draft two caption options for the launch.', notes: 'Awaiting product details from the client.' },
  { id: 'edit-showreel', projectId: 'internal-marketing', title: 'Edit showreel', workType: 'Video Editing', assignees: ['Example Editor'], assignedOn: '2026-11-24', status: 'Backlog', deliveryDate: '2026-12-03', details: 'Create a short reel with recent studio work.', notes: 'Audio cleanup required.' },
  { id: 'collect-website-content', projectId: 'website-launch', title: 'Collect website content', workType: 'Content Writing', assignees: ['Example Writer'], assignedOn: '2026-11-20', status: 'Done', deliveryDate: '2026-11-23', details: 'Organize product copy and available imagery.', notes: 'Content handoff complete.' },
  { id: 'draft-social-templates', projectId: 'launch-campaign', title: 'Draft social templates', workType: 'Graphic Design', assignees: ['Rian'], assignedOn: '2026-11-25', status: 'Backlog', deliveryDate: '2026-12-02', details: 'Create editable social launch layouts.', notes: 'Start with the square feed format.' },
  { id: 'prepare-portfolio-covers', projectId: 'internal-marketing', title: 'Prepare portfolio covers', workType: 'Graphic Design', assignees: ['Rian'], assignedOn: '2026-11-20', status: 'Done', deliveryDate: '2026-11-24', details: 'Export matching thumbnails for the work archive.', notes: 'Files reviewed and ready.' },
  { id: 'explore-brand-direction', projectId: 'brand-refresh', title: 'Explore brand direction', workType: 'Branding', assignees: ['Rian'], assignedOn: '2026-11-25', status: 'Backlog', deliveryDate: '2026-12-07', details: 'Prepare two visual directions.', notes: 'Collect references before sketching.' },
];

export const attendance: readonly AttendanceDay[] = [
  { date: '2026-11-23', status: 'Worked', intervals: [{ startUtc: '2026-11-23T06:55:00Z', endUtc: '2026-11-23T12:59:00Z' }] },
  { date: '2026-11-24', status: 'Worked', intervals: [{ startUtc: '2026-11-24T07:00:00Z', endUtc: '2026-11-24T13:00:00Z' }] },
  { date: '2026-11-25', status: 'Leave', intervals: [] },
  { date: '2026-11-26', status: 'Worked', intervals: [{ startUtc: '2026-11-26T07:01:00Z', endUtc: '2026-11-26T13:00:00Z' }] },
  { date: '2026-11-27', status: 'Off', intervals: [] },
  { date: '2026-11-28', status: 'Worked', intervals: [{ startUtc: '2026-11-28T06:50:00Z', endUtc: '2026-11-28T13:00:00Z' }] },
  { date: '2026-11-29', status: 'Needs Review', note: 'Sample shift ended at the last confirmed contact.', intervals: [{ startUtc: '2026-11-29T07:00:00Z', endUtc: '2026-11-29T12:42:18Z' }] },
];

export function projectSnapshot(projectId: string) {
  const jobs = tasks.filter((task) => task.projectId === projectId);
  const done = jobs.filter((task) => task.status === 'Done').length;
  const waiting = jobs.filter((task) => task.status === 'Waiting for Client').length;
  const overdue = jobs.filter((task) => task.status !== 'Done' && task.deliveryDate < demoToday).length;

  return { jobs, done, waiting, overdue, percent: jobs.length ? Math.round(done / jobs.length * 100) : null };
}

export function attendanceSeconds(day?: AttendanceDay) {
  return day?.intervals.reduce((total, interval) => {
    return total + (Date.parse(interval.endUtc) - Date.parse(interval.startUtc)) / 1000;
  }, 0) ?? 0;
}
