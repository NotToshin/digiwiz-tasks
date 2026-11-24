export type DateKey = `${number}-${number}-${number}`;

export const taskStatuses = [
  'Backlog', 'To Do', 'In Progress', 'Waiting for Client', 'In Review', 'Done',
] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export interface Company {
  id: string;
  name: string;
  initials: string;
  kind: 'Client' | 'Internal';
  description: string;
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  lead: string;
  targetDate: DateKey;
  summary: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  workType: string;
  assignees: readonly string[];
  assignedOn: DateKey;
  status: TaskStatus;
  deliveryDate: DateKey;
  details: string;
  notes: string;
  prerequisiteId?: string;
}

export interface AttendanceDay {
  date: DateKey;
  status: 'Worked' | 'Needs Review' | 'Leave' | 'Off' | 'Holiday';
  note?: string;
  intervals: readonly { startUtc: string; endUtc: string }[];
}
