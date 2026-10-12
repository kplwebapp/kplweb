import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated } = useAuth();
  const hasToken = !!localStorage.getItem('accessToken');

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
