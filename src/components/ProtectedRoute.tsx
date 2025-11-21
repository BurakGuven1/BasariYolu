import { Navigate } from 'react-router-dom';
import { useAuthContext, UserType } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: UserType[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedUserTypes,
  redirectTo = '/',
}: ProtectedRouteProps) {
  const { user, loading } = useAuthContext();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // No user, redirect to home or specified path
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check if user type is allowed
  if (allowedUserTypes && !allowedUserTypes.includes(user.userType)) {
    // Redirect based on user type
    switch (user.userType) {
      case 'student':
      case 'parent':
        return <Navigate to="/dashboard" replace />;
      case 'teacher':
        return <Navigate to="/dashboard" replace />;
      case 'institution':
        return <Navigate to="/institution" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
