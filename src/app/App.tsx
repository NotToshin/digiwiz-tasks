import { lazy, Suspense } from 'react';
import { FiBell, FiBriefcase, FiCalendar, FiCheckSquare, FiGrid, FiSettings, FiUsers } from 'react-icons/fi';
import { NavLink, Route, Routes, useSearchParams } from 'react-router-dom';
import DashboardPage from '../features/dashboard/DashboardPage';
import { NotFound } from './ui';
import { useWorkspace } from './Workspace';

const ManagePage = lazy(() => import('../features/tasks/ManagePage'));
const AttendancePage = lazy(() => import('../features/attendance/AttendancePage'));
const AdminPage = lazy(() => import('../features/accounts/AdminPage'));
const CalendarPage = lazy(() => import('../features/calendar/CalendarPage'));
const CompaniesPage = lazy(() => import('../features/companies/CompaniesPage'));
const TaskListPage = lazy(() => import('../features/tasks/TaskListPage'));
const TaskDrawer = lazy(() => import('../features/tasks/TaskDrawer'));
const TimelinePage = lazy(() => import('../features/timeline/TimelinePage'));
const UpdatesPage = lazy(() => import('../features/tasks/UpdatesPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));

const navigation = [
  { to: '/', label: 'Dashboard', icon: FiGrid },
  { to: '/calendar', label: 'Calendar', icon: FiCalendar },
  { to: '/my-tasks', label: 'My tasks', icon: FiCheckSquare },
  { to: '/companies', label: 'Companies', icon: FiBriefcase },
  { to: '/manage', label: 'Manage work', icon: FiBriefcase },
  { to: '/timeline', label: 'Timeline', icon: FiCalendar },
  { to: '/activity', label: 'Activity', icon: FiGrid },
  { to: '/notifications', label: 'Notifications', icon: FiBell },
  { to: '/attendance', label: 'Attendance', icon: FiCalendar },
  { to: '/admin', label: 'Staff access', icon: FiUsers },
  { to: '/settings', label: 'Settings', icon: FiSettings },
];

export default function App() {
  const { staff, currentStaffId, sampleMode } = useWorkspace();
  const displayName = staff.find(person => person.id === currentStaffId)?.name || 'Sample staff';
  const [params] = useSearchParams();
  const taskId = params.get('task');

  return (
    <div className="app">
      <a className="skip-link" href="#workspace">Skip to workspace</a>
      <aside className="rail">
        <NavLink className="brand" to="/" aria-label="Digiwiz Tasks home">
          <span className="brand-mark" aria-hidden="true">DW</span>
        </NavLink>

        <nav aria-label="Workspace">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} className="nav-link" to={to} end={to === '/'}>
              <Icon aria-hidden="true" /><span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="rail-profile">
          <span className="avatar" aria-hidden="true">{displayName.slice(0, 1)}</span>
          <div><strong>{displayName}</strong><small>{sampleMode ? 'Sample profile' : 'Staff account'}</small></div>
        </div>
      </aside>
      <main id="workspace" className="workspace" tabIndex={-1}>
        <div className="workspace-content">
          <Suspense fallback={<p role="status">Loading workspace…</p>}>
            <Routes>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/manage" element={<ManagePage />} />
              <Route path="/" element={<DashboardPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/activity" element={<UpdatesPage kind="activity" />} />
              <Route path="/notifications" element={<UpdatesPage kind="notifications" />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/companies/:companyId" element={<CompaniesPage />} />
              <Route path="/companies/:companyId/projects/:projectId" element={<CompaniesPage />} />
              <Route path="/my-tasks" element={<TaskListPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound title="Page unavailable" to="/" linkText="Back to dashboard" />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      {taskId && <Suspense fallback={null}><TaskDrawer taskId={taskId} /></Suspense>}
    </div>
  );
}
