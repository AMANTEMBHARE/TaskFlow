import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCreated } from '../utils/format';

export default function Profile() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('You have been signed out.');
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const rows = [
    { label: 'Name', value: user?.name },
    { label: 'Email', value: user?.email },
    { label: 'Member since', value: formatCreated(user?.createdAt) },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">Your account details.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <dl className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-slate-500">{row.label}</dt>
              <dd className="break-words text-sm text-slate-900 sm:col-span-2">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Session</h2>
        <p className="mt-1 text-sm text-slate-500">Signing out removes the session cookie from this browser.</p>
        <Button variant="secondary" className="mt-4" onClick={handleLogout}>
          Sign out
        </Button>
      </section>
    </div>
  );
}
