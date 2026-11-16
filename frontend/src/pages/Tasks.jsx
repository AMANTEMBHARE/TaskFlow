import { useEffect, useMemo, useState } from 'react';
import TaskCard from '../components/tasks/TaskCard';
import TaskFilters from '../components/tasks/TaskFilters';
import TaskModal from '../components/tasks/TaskModal';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Icon from '../components/ui/Icon';
import { PageSpinner } from '../components/ui/Spinner';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import useTasks from '../hooks/useTasks';
import { getErrorMessage } from '../services/api';
import { deleteTask, updateTask } from '../services/taskApi';

const DEFAULT_FILTERS = { search: '', status: '', priority: '', sort: 'createdAt:desc' };
const PAGE_SIZE = 9;

export default function Tasks() {
  const toast = useToast();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, task: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const debouncedSearch = useDebounce(filters.search, 350);
  const [sortBy, order] = filters.sort.split(':');

  const params = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      sortBy,
      order,
      page,
      limit: PAGE_SIZE,
    }),
    [debouncedSearch, filters.status, filters.priority, sortBy, order, page]
  );

  const { tasks, pagination, loading, error, refetch } = useTasks(params);

  // If the last task on a page was deleted, step back one page.
  useEffect(() => {
    if (!loading && !error && tasks.length === 0 && page > 1) setPage((current) => current - 1);
  }, [loading, error, tasks.length, page]);

  const handleFilterChange = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleStatusChange = async (task, status) => {
    setBusyId(task.id);
    try {
      await updateTask(task.id, { status });
      toast.success('Status updated.');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTask(toDelete.id);
      toast.success('Task deleted.');
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(filters.search || filters.status || filters.priority);
  const openCreate = () => setModal({ open: true, task: null });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">All tasks</h1>
          <p className="text-sm text-slate-500">
            {pagination ? `${pagination.total} task${pagination.total === 1 ? '' : 's'}` : 'Loading...'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Icon name="plus" className="h-4 w-4" />
          New task
        </Button>
      </div>

      <TaskFilters values={filters} onChange={handleFilterChange} onReset={handleReset} />

      {loading && tasks.length === 0 && <PageSpinner label="Loading tasks..." />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && tasks.length === 0 && (
        <EmptyState
          title={hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
          message={
            hasActiveFilters
              ? 'Try a different search term or clear the filters.'
              : 'Create your first task to get started.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" onClick={handleReset}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={openCreate}>Create a task</Button>
            )
          }
        />
      )}

      {tasks.length > 0 && (
        <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              busy={busyId === task.id}
              onEdit={(selected) => setModal({ open: true, task: selected })}
              onDelete={setToDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <nav className="flex items-center justify-between" aria-label="Pagination">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </nav>
      )}

      <TaskModal
        open={modal.open}
        task={modal.task}
        onClose={() => setModal({ open: false, task: null })}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete task?"
        message={toDelete ? `"${toDelete.title}" will be permanently deleted. This cannot be undone.` : ''}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
