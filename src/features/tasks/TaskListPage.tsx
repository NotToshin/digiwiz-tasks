import { PageHeader } from '../../app/ui';
import { useWorkspace } from '../../app/Workspace';
import { demoStaff } from '../../fixtures/workspace';
import TaskTable from './TaskTable';

export default function TaskListPage() {
  const { tasks, currentStaffId, sampleMode } = useWorkspace();
  const owner=sampleMode?demoStaff:currentStaffId || "";
  return (
    <>
      <PageHeader title="My tasks" description="Your assigned work" />
      <TaskTable title="Assigned to me" tasks={tasks.filter((task) => task.assignees.includes(owner))} />
    </>
  );
}
