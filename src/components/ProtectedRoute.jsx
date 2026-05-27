import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';

export default function ProtectedRoute({ children }) {
  const { currentUser, needsPasswordReset } = useAuth();
  const { activeGymId } = useTenant();

  if (!currentUser) {
    // If not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (needsPasswordReset && activeGymId) {
    return <Navigate to={`/${activeGymId}/setup-password`} replace />;
  }

  // If logged in and no reset needed, render the dashboard component
  return children;
}
