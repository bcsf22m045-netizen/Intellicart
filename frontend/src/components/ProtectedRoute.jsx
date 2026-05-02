import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectAuth } from '../store/slices/authSlice';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects unauthenticated users to login page
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, accessToken } = useSelector(selectAuth);
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-gray-800" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * PublicRoute Component
 * Wraps routes that should only be accessible to non-authenticated users
 * Redirects authenticated users to home page
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(selectAuth);
  const location = useLocation();

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    // Redirect to the page they were trying to access, or home
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return children;
};

export default ProtectedRoute;
