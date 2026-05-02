import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser, selectAuth } from '../store/slices/authSlice';

/**
 * AuthInitializer Component
 * Initializes authentication state on app load
 * Checks if user has a valid token and fetches user data
 */
const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { accessToken, isAuthenticated, user } = useSelector(selectAuth);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // If we have a token but no user data, fetch the user
      if (accessToken && !user) {
        try {
          await dispatch(getCurrentUser()).unwrap();
        } catch (error) {
          // Token is invalid, will be handled by the reducer
          console.log('Auth initialization failed:', error);
        }
      }
      setIsInitializing(false);
    };

    initAuth();
  }, [accessToken, user, dispatch]);

  // Show loading while initializing
  if (isInitializing && accessToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

  return children;
};

export default AuthInitializer;
