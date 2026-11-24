import { useAttendance } from '../attendance/useAttendance';
import { useMemo } from 'react';
import { FiArrowUpRight, FiCalendar, FiChevronLeft, FiChevronRight, FiClock, FiFlag } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, StatusBadge } from '../../app/ui';
import { formatDate, formatDhakaTime, formatMonth, monthStart, monthWeeks, readDateKey, shiftMonth } from '../../domain/dates';
import type { DateKey, Task } from '../../domain/models';
import { useWorkspace } from '../../app/Workspace';
import { attendanceSeconds } from '../../fixtures/workspace';
import { useTaskDrawer } from '../tasks/useTaskDrawer';
import CalendarDayCell, { calendarFilters, type CalendarFilter } from './CalendarDayCell';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const { tasks, sampleMode } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const { openTask } = useTaskDrawer();
  const { today: demoToday, attendance, error: attendanceError } = useAttendance(sampleMode, params.get('date')?.slice(0, 7));
  const selected = readDateKey(params.get('date')) ?? demoToday;
  const month = monthStart(selected);
  const filter = calendarFilters.find((item) => item === params.get('view')) ?? 'Both';
  const selectedAttendance = attendance.find((day) => day.date === selected);
  const deadlinesByDate = useMemo(() => {
    const grouped = new Map<DateKey, Task[]>();
    for (const task of tasks) {
      const entries = grouped.get(task.deliveryDate) || [];
      entries.push(task);
      grouped.set(task.deliveryDate, entries);
    }
    return grouped;
  }, [tasks]);
  const selectedDeadlines = deadlinesByDate.get(selected) || [];
  const minutes = Math.floor(attendanceSeconds(selectedAttendance) / 60);
  const isFirstMonth = month === '0000-01-01';
  const isLastMonth = month === '9999-12-01';

  function selectDay(day: DateKey) {
    const next = new URLSearchParams(params);
    next.set('date', day);
    setParams(next);
  }

  function selectFilter(nextFilter: CalendarFilter) {
    const next = new URLSearchParams(params);
    next.set('view', nextFilter);
    setParams(next);
  }

  return (
    <>
      {attendanceError && <p role="alert">{attendanceError}</p>}
      <PageHeader title="Calendar" description={sampleMode ? 'Team deadlines and sample attendance in Asia/Dhaka.' : 'Team deadlines and your attendance in Asia/Dhaka.'} />
      <div className="calendar-layout">
        <section className="card calendar-card" aria-label="Monthly calendar">
          <div className="calendar-toolbar">
            <div className="month-controls">
              <button type="button" className="icon-button" aria-label="Previous month" disabled={isFirstMonth} onClick={() => selectDay(shiftMonth(month, -1))}><FiChevronLeft /></button>
              <h2 aria-live="polite">{formatMonth(month)}</h2>
              <button type="button" className="icon-button" aria-label="Next month" disabled={isLastMonth} onClick={() => selectDay(shiftMonth(month, 1))}><FiChevronRight /></button>
              <button type="button" className="button small secondary" onClick={() => selectDay(demoToday)}>Today</button>
            </div>
            <div className="segmented" role="group" aria-label="Calendar display">
              {calendarFilters.map((option) => (
                <button type="button" key={option} aria-pressed={filter === option} onClick={() => selectFilter(option)}>{option}</button>
              ))}
            </div>
          </div>
          <div className="calendar-scroll">
            <table className="calendar-table" aria-label={formatMonth(month)}>
              <thead><tr>{weekdays.map((day) => <th scope="col" key={day}>{day}</th>)}</tr></thead>
              <tbody>
                {monthWeeks(month).map((week, row) => (
                  <tr key={row}>
                    {week.map((day, column) => day ? (
                      <CalendarDayCell key={day} day={day}
                        attendance={attendance.find((entry) => entry.date === day)}
                        deadlines={deadlinesByDate.get(day) || []}
                        filter={filter} isToday={day === demoToday} isSelected={day === selected}
                        isOutsideMonth={monthStart(day) !== month} onSelectDay={selectDay} onOpenTask={openTask} />
                    ) : <td key={column} className="day-cell outside-month" />)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="card day-details" aria-label="Day details">
          <div className="day-details-heading">
            <span className="tile-icon lavender"><FiCalendar aria-hidden="true" /></span>
            <div><h2>Day details</h2><p>{formatDate(selected)}</p></div>
          </div>
          {filter !== 'Deadlines' && (
            <section className="details-section">
              <h3><FiClock aria-hidden="true" /> Attendance</h3>
              {selectedAttendance ? (
                <>
                  <div className="session-summary">
                    <strong>{selectedAttendance.status}</strong>
                    {selectedAttendance.intervals.length > 0 && <span>{Math.floor(minutes / 60)}h {minutes % 60}m</span>}
                  </div>
                  {selectedAttendance.intervals.map((interval) => (
                    <p key={interval.startUtc}>{formatDhakaTime(interval.startUtc)}–{formatDhakaTime(interval.endUtc)}</p>
                  ))}
                  {selectedAttendance.note && <p>{selectedAttendance.note}</p>}
                </>
              ) : <p>No attendance entries.</p>}
            </section>
          )}
          {filter !== 'Attendance' && (
            <section className="details-section">
              <h3><FiFlag aria-hidden="true" /> Deadlines <span className="count">{selectedDeadlines.length}</span></h3>
              {selectedDeadlines.length ? (
                <ul className="day-task-list">
                  {selectedDeadlines.map((task) => (
                    <li key={task.id}>
                      <button type="button" className="day-task" onClick={() => openTask(task.id)}>
                        <span>{task.title}</span><FiArrowUpRight aria-hidden="true" />
                      </button>
                      <StatusBadge status={task.status} />
                    </li>
                  ))}
                </ul>
              ) : <p>No deadlines scheduled.</p>}
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
