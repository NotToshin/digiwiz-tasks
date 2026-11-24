import { useState } from 'react';
import { FiArrowLeft, FiArrowUpRight, FiFolder, FiSearch } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { NotFound, PageHeader } from '../../app/ui';
import { formatShortDate } from '../../domain/dates';
import { taskStatuses, type Project } from '../../domain/models';
import { useWorkspace } from '../../app/Workspace';
import TaskTable from '../tasks/TaskTable';

function CompanyDirectory() {
 const { companies, projects, tasks } = useWorkspace();
  const [search, setSearch] = useState('');
  const matches = companies.filter((company) => company.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <>
      <PageHeader title="Companies" description="Find client and internal projects." />
      <div className="search-control">
        <FiSearch aria-hidden="true" />
        <input type="search" aria-label="Search companies" placeholder="Search companies" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      {matches.length ? (
        <ul className="company-grid">
          {matches.map((company) => {
            const companyProjects = projects.filter((project) => project.companyId === company.id);
            const taskCount = tasks.filter((task) => companyProjects.some((project) => project.id === task.projectId)).length;
            return (
              <li key={company.id}>
                <Link className="card company-card" to={'/companies/' + company.id}>
                  <div className="company-card-top"><span className="company-mark">{company.initials}</span><FiArrowUpRight aria-hidden="true" /></div>
                  <h2>{company.name}</h2>
                  <p>{company.kind}</p>
                  <div className="company-counts"><span>{companyProjects.length} {companyProjects.length === 1 ? 'project' : 'projects'}</span><span>{taskCount} {taskCount === 1 ? 'task' : 'tasks'}</span></div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : <p className="card empty-card">No companies match your search.</p>}
    </>
  );
}

function ProjectCard({ project, basePath }: { project: Project; basePath: string }) {
  const { projectSnapshot } = useWorkspace();
  const { jobs, done, percent } = projectSnapshot(project.id);
  return (
    <Link className="card project-card" to={basePath + '/projects/' + project.id}>
      <div className="company-card-top"><span className="tile-icon lavender"><FiFolder aria-hidden="true" /></span><FiArrowUpRight aria-hidden="true" /></div>
      <h3>{project.name}</h3>
      <p>{project.summary}</p>
      <div className="project-card-meta"><span>{done} of {jobs.length} done</span><span>Target {formatShortDate(project.targetDate)}</span></div>
      {percent !== null && <progress value={percent} max={100} aria-label={project.name + ' completion'} />}
    </Link>
  );
}

export default function CompaniesPage() {
  const { companies, projects, projectSnapshot, tasks } = useWorkspace();
  const { companyId, projectId } = useParams();
  if (!companyId) return <CompanyDirectory />;
  const company = companies.find((item) => item.id === companyId);
  if (!company) return <NotFound title="Company unavailable" to="/companies" linkText="Back to companies" />;

  const basePath = '/companies/' + company.id;
  const companyProjects = projects.filter((project) => project.companyId === company.id);
  const companyTasks = tasks.filter((task) => companyProjects.some((project) => project.id === task.projectId));

  if (projectId) {
    const project = companyProjects.find((item) => item.id === projectId);
    if (!project) return <NotFound title="Project unavailable" to={basePath} linkText={'Back to ' + company.name} />;
    const { jobs, done, overdue, waiting } = projectSnapshot(project.id);
    return (
      <>
        <Link className="back-link" to={basePath}><FiArrowLeft aria-hidden="true" /> {company.name}</Link>
        <PageHeader title={project.name} description={project.summary} />
        <dl className="card project-summary">
          <div><dt>Lead</dt><dd>{project.lead}</dd></div>
          <div><dt>Target date</dt><dd>{formatShortDate(project.targetDate)}</dd></div>
          <div><dt>Completed</dt><dd>{done} of {jobs.length}</dd></div>
          <div><dt>Overdue</dt><dd>{overdue}</dd></div>
          <div><dt>Waiting for client</dt><dd>{waiting}</dd></div>
        </dl>
        <TaskTable title="Project tasks" tasks={jobs} />
      </>
    );
  }

  const completedProjects = companyProjects.filter(({ id }) => projectSnapshot(id).percent === 100).length;

  return (
    <>
      <Link className="back-link" to="/companies"><FiArrowLeft aria-hidden="true" /> Companies</Link>
      <PageHeader title={company.name} description={company.description} />
      <section className="company-section">
        <div className="section-heading"><h2>Projects</h2><p>{companyProjects.length - completedProjects} active · {completedProjects} completed</p></div>
        <ul className="company-grid">
          {companyProjects.map((project) => <li key={project.id}><ProjectCard project={project} basePath={basePath} /></li>)}
        </ul>
      </section>
      <section className="company-section">
        <div className="company-statuses" aria-label="Company task counts by status">
          {taskStatuses.map((status) => <span key={status}><strong>{companyTasks.filter((task) => task.status === status).length}</strong> {status}</span>)}
        </div>
        <TaskTable title="Company tasks" tasks={companyTasks} />
      </section>
    </>
  );
}
