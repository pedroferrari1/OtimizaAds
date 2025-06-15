import { useAuth } from '@/features/auth';
import { Navigate, useLocation } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('AdminProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    console.log('AdminProtectedRoute: User not admin, redirecting to dashboard');
    return <Navigate to="/app/dashboard" replace />;
  }

  console.log('AdminProtectedRoute: Admin user authenticated, allowing access');
  return <>{children}</>;
};

export default AdminProtectedRoute;
