import { useAuth } from '@/lib/auth-context';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

export default Index;
