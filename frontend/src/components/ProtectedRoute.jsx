import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="content-page"><div className="empty-state"><p>Checking session…</p></div></div>;
  }

  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(next)}`} replace state={{ from: next }} />;
  }

  return children;
}
