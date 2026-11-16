import { PRIORITY_OPTIONS, STATUS_OPTIONS, labelFor } from '../../utils/constants';

const STATUS_STYLES = {
  pending: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
};

const PRIORITY_STYLES = {
  low: { dot: 'bg-slate-400', text: 'text-slate-600' },
  medium: { dot: 'bg-amber-500', text: 'text-amber-700' },
  high: { dot: 'bg-red-500', text: 'text-red-700' },
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}
    >
      {labelFor(STATUS_OPTIONS, status)}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${style.text}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
      {labelFor(PRIORITY_OPTIONS, priority)}
    </span>
  );
}
