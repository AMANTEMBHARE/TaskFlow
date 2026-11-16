import Icon from '../ui/Icon';

export default function Brand({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <Icon name="check" className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900">TaskFlow</span>
    </div>
  );
}
