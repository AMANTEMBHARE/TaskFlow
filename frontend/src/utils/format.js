// Due dates are stored as UTC midnight of the chosen calendar day, so they are formatted in UTC
// to avoid showing the previous day in timezones west of UTC.
export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatCreated(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** "YYYY-MM-DD" for <input type="date"> from an ISO string. */
export function toDateInputValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function todayLocalISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function isOverdue(task) {
  if (!task.dueDate || task.status === 'completed') return false;
  return toDateInputValue(task.dueDate) < todayLocalISO();
}
