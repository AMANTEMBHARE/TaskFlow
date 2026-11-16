import Icon from '../ui/Icon';
import { Select } from '../ui/FormFields';
import Button from '../ui/Button';
import { PRIORITY_OPTIONS, SORT_OPTIONS, STATUS_OPTIONS } from '../../utils/constants';

export default function TaskFilters({ values, onChange, onReset }) {
  const hasFilters = values.search || values.status || values.priority || values.sort !== 'createdAt:desc';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="task-search" className="mb-1 block text-sm font-medium text-slate-700">
            Search
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Icon name="search" className="h-4 w-4" />
            </span>
            <input
              id="task-search"
              type="search"
              value={values.search}
              onChange={(event) => onChange('search', event.target.value)}
              placeholder="Search by title"
              maxLength={100}
              className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>
        <Select
          id="filter-status"
          label="Status"
          placeholder="All statuses"
          options={STATUS_OPTIONS}
          value={values.status}
          onChange={(event) => onChange('status', event.target.value)}
        />
        <Select
          id="filter-priority"
          label="Priority"
          placeholder="All priorities"
          options={PRIORITY_OPTIONS}
          value={values.priority}
          onChange={(event) => onChange('priority', event.target.value)}
        />
        <Select
          id="filter-sort"
          label="Sort by"
          options={SORT_OPTIONS}
          value={values.sort}
          onChange={(event) => onChange('sort', event.target.value)}
        />
      </div>
      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" onClick={onReset} className="px-2 py-1 text-xs">
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
