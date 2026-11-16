import Button from './Button';
import Icon from './Icon';

export function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="rounded-full bg-indigo-50 p-3 text-indigo-600">
        <Icon name="inbox" className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div
      className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center"
      role="alert"
    >
      <div className="rounded-full bg-red-100 p-3 text-red-600">
        <Icon name="alert" className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-red-900">Something went wrong</h3>
      <p className="mt-1 max-w-sm text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
