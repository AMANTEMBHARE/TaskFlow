import Icon from '../ui/Icon';
import { PriorityBadge, StatusBadge } from '../ui/Badges';
import { STATUS_OPTIONS } from '../../utils/constants';
import { formatDate, isOverdue } from '../../utils/format';

export default function TaskCard({ task, onEdit, onDelete, onStatusChange, busy = false }) {
  const overdue = isOverdue(task);
  const done = task.status === 'completed';

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3
          className={`break-words text-sm font-semibold ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}
        >
          {task.title}
        </h3>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && <p className="mt-2 line-clamp-2 break-words text-sm text-slate-600">{task.description}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        <StatusBadge status={task.status} />
        {task.dueDate && (
          <span
            className={`inline-flex items-center gap-1 ${overdue ? 'font-semibold text-red-600' : 'text-slate-500'}`}
          >
            <Icon name="calendar" className="h-3.5 w-3.5" />
            {overdue ? 'Overdue: ' : 'Due '}
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div>
          <label htmlFor={`status-${task.id}`} className="sr-only">
            Change status
          </label>
          <select
            id={`status-${task.id}`}
            value={task.status}
            disabled={busy}
            onChange={(event) => onStatusChange(task, event.target.value)}
            className="rounded-md border border-slate-300 bg-white py-1 pl-2 pr-6 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
            aria-label={`Edit ${task.title}`}
          >
            <Icon name="edit" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${task.title}`}
          >
            <Icon name="trash" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
