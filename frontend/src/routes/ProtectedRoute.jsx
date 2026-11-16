import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageSpinner } from '../components/ui/Spinner';

/** Only renders child routes for signed-in users. Others are sent to /login. */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Login/register pages: signed-in users are sent to the dashboard instead. */
export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) return <PageSpinner label="Loading..." />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
