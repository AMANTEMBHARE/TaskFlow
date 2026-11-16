import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';
import TaskModal from '../components/tasks/TaskModal';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { PriorityBadge, StatusBadge } from '../components/ui/Badges';
import { PageSpinner } from '../components/ui/Spinner';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { getDashboardStats } from '../services/dashboardApi';
import { formatCreated } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const [state, setState] = useState({ stats: null, loading: true, error: null });
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const stats = await getDashboardStats();
      setState({ stats, loading: false, error: null });
    } catch (error) {
      setState({ stats: null, loading: false, error: getErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { stats, loading, error } = state;
  const firstName = user?.name?.split(' ')[0];
  const completion = stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hello, {firstName}</h1>
          <p className="text-sm text-slate-500">Here is where your work stands today.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Icon name="plus" className="h-4 w-4" />
          New task
        </Button>
      </div>

      {loading && !stats && <PageSpinner label="Loading dashboard..." />}
      {error && <ErrorState message={error} onRetry={load} />}

      {stats && stats.total === 0 && (
        <EmptyState
          title="No tasks yet"
          message="Create your first task and your statistics will show up here."
          action={<Button onClick={() => setModalOpen(true)}>Create a task</Button>}
        />
      )}

      {stats && stats.total > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Total" value={stats.total} tone="indigo" />
            <StatCard label="Pending" value={stats.pending} tone="slate" />
            <StatCard label="In progress" value={stats.inProgress} tone="amber" />
            <StatCard label="Completed" value={stats.completed} tone="emerald" />
            <StatCard label="High priority (open)" value={stats.highPriority} tone="red" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Overall completion</span>
              <span className="text-slate-500">{completion}%</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${completion}%` }} />
            </div>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Recent tasks</h2>
              <Link to="/tasks" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {stats.recentTasks.map((task) => (
                <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">Created {formatCreated(task.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <TaskModal open={modalOpen} task={null} onClose={() => setModalOpen(false)} onSaved={load} />
    </div>
  );
}
