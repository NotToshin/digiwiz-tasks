import { FiArrowUpRight } from 'react-icons/fi';
import { StatusBadge } from '../../app/ui';
import { formatShortDate } from '../../domain/dates';
import type { Task } from '../../domain/models';
import { useTaskDrawer } from './useTaskDrawer';

export default function TaskTable({ title, tasks }: { title: string; tasks: readonly Task[] }) {
  const { openTask } = useTaskDrawer();
  return (
    <section className="card task-table-card" aria-label={title}>
      <div className="section-heading"><h2>{title}</h2><span className="count">{tasks.length}</span></div>
      {tasks.length ? (
        <div className="table-scroll">
          <table className="task-table" aria-label={title}>
            <thead><tr><th scope="col">Task</th><th scope="col">Assignees</th><th scope="col">Status</th><th scope="col">Deadline</th></tr></thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td><button type="button" className="task-row-button" onClick={() => openTask(task.id)}>{task.title}<FiArrowUpRight aria-hidden="true" /></button><small>{task.workType}</small></td>
                  <td>{task.assignees.join(', ') || 'Unassigned'}</td>
                  <td><StatusBadge status={task.status} /></td>
                  <td><time dateTime={task.deliveryDate}>{formatShortDate(task.deliveryDate)}</time></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="table-empty">No tasks in this view.</p>}
    </section>
  );
}
