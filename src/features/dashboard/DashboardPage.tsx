import { useAttendance } from '../attendance/useAttendance';
import { FiArrowRight, FiArrowUpRight, FiCalendar, FiClock, FiFolder, FiLayers } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { PageHeader, StatusBadge } from '../../app/ui';
import { formatDate, formatShortDate } from '../../domain/dates';
import { useWorkspace } from '../../app/Workspace';
import { attendanceSeconds } from '../../fixtures/workspace';
import { useTaskDrawer } from '../tasks/useTaskDrawer';

export default function DashboardPage() {
  const { companies, projects, projectSnapshot, tasks, sampleMode } = useWorkspace();
  const { openTask } = useTaskDrawer();
  const { today: demoToday, attendance, error: attendanceError } = useAttendance(sampleMode);
  const today = attendance.find((day) => day.date === demoToday);
  const seconds = attendanceSeconds(today);
  const clock = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, '0')).join(':');
  const dueToday = tasks.filter((task) => task.deliveryDate === demoToday && task.status !== 'Done');
  const backlog = tasks.filter((task) => task.status === 'Backlog').sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));

  return (
    <>
      {attendanceError && <p role="alert">{attendanceError}</p>}
      <PageHeader title="Dashboard" description={formatDate(demoToday)} actions={
        <>
          <Link className="button secondary" to="/my-tasks">My tasks</Link>
          <Link className="button primary" to="/calendar"><FiCalendar aria-hidden="true" /> Open calendar</Link>
        </>
      } />
      <div className="dashboard-layout">
        <div className="dashboard-main">
          <div className="overview">
            <section className="work-card">
              <div className="work-decoration" aria-hidden="true"><FiClock /></div>
              <h2><FiClock aria-hidden="true" /> Working today</h2>
              <div className="work-clock" aria-label={'Sample duration ' + Math.floor(seconds / 3600) + ' hours ' + Math.floor(seconds / 60) % 60 + ' minutes'}>{clock}</div>
              <p>Attendance <span aria-hidden="true">·</span> {today?.status}</p>
            </section>
            <section className="card metric-card">
              <span className="tile-icon blue"><FiCalendar aria-hidden="true" /></span>
              <h2>Due today</h2>
              <strong className="metric-value">{dueToday.length}</strong>
              <Link className="text-link" to={'/calendar?date=' + demoToday + '&view=Deadlines'}>View deadlines <FiArrowUpRight aria-hidden="true" /></Link>
            </section>
            <section className="card metric-card">
              <span className="tile-icon amber"><FiFolder aria-hidden="true" /></span>
              <h2>Projects</h2>
              <strong className="metric-value">{projects.length}</strong>
              <Link className="text-link" to="/companies">Browse companies <FiArrowUpRight aria-hidden="true" /></Link>
            </section>
          </div>

          <section className="card dashboard-card">
            <div className="section-heading"><h2>Project progress</h2><Link className="text-link" to="/companies">All companies <FiArrowRight aria-hidden="true" /></Link></div>
            <ul className="project-progress">
              {projects.map((project) => {
                const snapshot = projectSnapshot(project.id);
                const company = companies.find((item) => item.id === project.companyId);
                return (
                  <li key={project.id}>
                    <Link className="progress-link" to={'/companies/' + project.companyId + '/projects/' + project.id}>
                      <span className="progress-names"><strong>{project.name}</strong><small>{company?.name}</small></span>
                      <span className="progress-indicator">
                        <span>{snapshot.percent === null ? 'No tasks' : snapshot.done + ' of ' + snapshot.jobs.length + ' done'}</span>
                        {snapshot.percent !== null && <progress value={snapshot.percent} max={100} aria-label={project.name + ' completion'} />}
                      </span>
                      <FiArrowUpRight aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card dashboard-card">
            <div className="section-heading"><h2>Today’s deadlines</h2><span className="section-date">{formatShortDate(demoToday)}</span></div>
            <ul className="dashboard-deadlines">
              {dueToday.map((task) => (
                <li key={task.id}>
                  <button type="button" className="task-row-button" onClick={() => openTask(task.id)}>{task.title}<FiArrowUpRight aria-hidden="true" /></button>
                  <StatusBadge status={task.status} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="card dashboard-card backlog" aria-label="Backlog">
          <div className="section-heading"><h2>Backlog</h2><span className="count">{backlog.length}</span></div>
          <ul>
            {backlog.map((task) => (
              <li key={task.id}>
                <span className="tile-icon lavender"><FiLayers aria-hidden="true" /></span>
                <div>
                  <button type="button" className="task-row-button" onClick={() => openTask(task.id)}>{task.title}<FiArrowUpRight aria-hidden="true" /></button>
                  <p>{task.workType}</p>
                  <time dateTime={task.deliveryDate}>{formatShortDate(task.deliveryDate)}</time>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
