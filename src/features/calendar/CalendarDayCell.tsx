import { FiClock } from 'react-icons/fi';
import { formatDate } from '../../domain/dates';
import type { AttendanceDay, DateKey, Task } from '../../domain/models';

export const calendarFilters = ['Both', 'Attendance', 'Deadlines'] as const;
export type CalendarFilter = (typeof calendarFilters)[number];

type Props = {
  day: DateKey;
  attendance?: AttendanceDay;
  deadlines: readonly Pick<Task, 'id' | 'title' | 'status'>[];
  filter: CalendarFilter;
  isToday: boolean;
  isSelected: boolean;
  isOutsideMonth: boolean;
  onSelectDay: (day: DateKey) => void;
  onOpenTask: (taskId: string) => void;
};

export default function CalendarDayCell({
  day, attendance, deadlines, filter, isToday, isSelected, isOutsideMonth, onSelectDay, onOpenTask,
}: Props) {
  const dayNumber = Number(day.slice(-2));
  const classes = ['day-cell', isSelected && 'selected', isOutsideMonth && 'outside-month'].filter(Boolean).join(' ');

  return (
    <td className={classes}>
      <button
        type="button"
        className="day-number"
        aria-label={formatDate(day)}
        aria-current={isToday ? 'date' : undefined}
        aria-pressed={isSelected}
        onClick={() => onSelectDay(day)}
      >
        {dayNumber}
      </button>
      {filter !== 'Deadlines' && attendance && (
        <span className={'calendar-chip attendance attendance-' + attendance.status.toLowerCase().replaceAll(' ', '-')}>
          <FiClock aria-hidden="true" />{attendance.status}
        </span>
      )}
      {filter !== 'Attendance' && deadlines.map((task) => (
        <button
          type="button"
          className={'calendar-chip deadline' + (task.status === 'Done' ? ' complete' : '')}
          key={task.id}
          onClick={() => onOpenTask(task.id)}
        >
          <span className="deadline-dot" aria-hidden="true" />
          <span className="chip-label">{task.title}</span>
        </button>
      ))}
    </td>
  );
}
