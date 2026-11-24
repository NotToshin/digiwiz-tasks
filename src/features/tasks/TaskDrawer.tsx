import { useEffect, useRef } from 'react';
import { FiArrowUpRight, FiX } from 'react-icons/fi';
import { StatusBadge } from '../../app/ui';
import { formatShortDate } from '../../domain/dates';
import { useWorkspace } from '../../app/Workspace';
import { useTaskDrawer } from './useTaskDrawer';

export default function TaskDrawer({ taskId }: { taskId: string }) {
  const { companies, projects, tasks } = useWorkspace();
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const { closeTask, openTask } = useTaskDrawer();
  const task = tasks.find((item) => item.id === taskId);
  const project = projects.find((item) => item.id === task?.projectId);
  const company = companies.find((item) => item.id === project?.companyId);
  const prerequisite = tasks.find((item) => item.id === task?.prerequisiteId);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const opener = document.activeElement;
    element.showModal();
    closeButton.current?.focus();

    return () => {
      element.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="task-drawer"
      aria-labelledby="task-drawer-title"
      onCancel={(event) => { event.preventDefault(); closeTask(); }}
      onClick={(event) => {
        if (event.target === event.currentTarget && event.clientX < event.currentTarget.getBoundingClientRect().left) closeTask();
      }}
    >
      <div className="drawer-content">
        <header className="drawer-header">
          <div><p>{company && project ? company.name + ' / ' + project.name : 'Task details'}</p><h2 id="task-drawer-title">{task?.title ?? 'Task unavailable'}</h2></div>
          <button type="button" className="icon-button" aria-label="Close task" ref={closeButton} onClick={closeTask}><FiX aria-hidden="true" /></button>
        </header>
        {task ? (
          <>
            <dl className="drawer-meta">
              <div><dt>Status</dt><dd><StatusBadge status={task.status} /></dd></div>
              <div><dt>Work type</dt><dd>{task.workType}</dd></div>
              <div><dt>Date assigned</dt><dd><time dateTime={task.assignedOn}>{formatShortDate(task.assignedOn)}</time></dd></div>
              <div><dt>Delivery date</dt><dd><time dateTime={task.deliveryDate}>{formatShortDate(task.deliveryDate)}</time></dd></div>
              <div className="drawer-assignees"><dt>Assignees</dt><dd><ul>{task.assignees.map((assignee) => <li key={assignee}>{assignee}</li>)}</ul></dd></div>
            </dl>
            {prerequisite && (
              <section className="drawer-section">
                <h3>Depends on</h3>
                <button className="task-row-button" type="button" onClick={() => openTask(prerequisite.id)}>{prerequisite.title}<FiArrowUpRight aria-hidden="true" /></button>
                <StatusBadge status={prerequisite.status} />
              </section>
            )}
            <section className="drawer-section"><h3>Details</h3><p>{task.details}</p></section>
            <section className="drawer-section"><h3>Notes</h3><p>{task.notes}</p></section>
          </>
        ) : <p>This task could not be found in the sample workspace.</p>}
      </div>
    </dialog>
  );
}
